import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import DataTable from '../shared/DataTable'
import StatusBadge from '../shared/StatusBadge'

const EmailMonitorHub = () => {
  const [emailEvents, setEmailEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [monitoringStatus, setMonitoringStatus] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isMonitoring, setIsMonitoring] = useState(false)
  const { showSuccess, showError, showInfo } = useToast()

  useEffect(() => {
    loadEmailEvents()
    loadMonitoringStatus()
  }, [])

  const loadEmailEvents = async () => {
    try {
      setLoading(true)
      const response = await apiService.getEmailEvents({ 
        search: searchTerm || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined 
      })
      setEmailEvents(response.data.events || [])
    } catch (error) {
      console.error('Failed to load email events:', error)
      // Don't show error, just use empty array
      setEmailEvents([])
    } finally {
      setLoading(false)
    }
  }

  const loadMonitoringStatus = async () => {
    try {
      const response = await apiService.getEmailMonitoringStatus()
      setMonitoringStatus(response.data.status)
      setIsMonitoring(response.data.status?.monitoring || false)
    } catch (error) {
      console.error('Failed to load monitoring status:', error)
      setMonitoringStatus({ monitoring: false, lastChecked: null })
      setIsMonitoring(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadEmailEvents()
  }

  const handleStartMonitoring = async () => {
    try {
      await apiService.startEmailMonitoring(5) // Check every 5 minutes
      showSuccess('Email monitoring started successfully')
      setIsMonitoring(true)
      loadMonitoringStatus()
    } catch (error) {
      console.error('Failed to start monitoring:', error)
      showError('Failed to start email monitoring')
    }
  }

  const handleCheckNow = async () => {
    try {
      showInfo('Checking emails now...')
      const response = await apiService.checkEmailsNow()
      showSuccess(`Email check completed. Found ${response.data.emails?.length || 0} job-related emails.`)
      loadEmailEvents()
      loadMonitoringStatus()
    } catch (error) {
      console.error('Failed to check emails:', error)
      showError('Failed to check emails')
    }
  }

  const getEmailTypeIcon = (type) => {
    switch (type) {
      case 'rejection': return '❌'
      case 'interview_invite': return '📅'
      case 'assessment': return '📝'
      case 'offer': return '🎉'
      case 'follow_up': return '📧'
      default: return '📬'
    }
  }

  const getEmailTypeColor = (type) => {
    switch (type) {
      case 'rejection': return 'var(--danger-500)'
      case 'interview_invite': return 'var(--success-500)'
      case 'assessment': return 'var(--warning-500)'
      case 'offer': return 'var(--success-500)'
      case 'follow_up': return 'var(--primary-500)'
      default: return 'var(--neutral-500)'
    }
  }

  const columns = [
    {
      key: 'subject',
      label: 'Subject',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: getEmailTypeColor(row.type) }}>
              {getEmailTypeIcon(row.type)}
            </span>
            {value}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            From: {row.from}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => <StatusBadge status={value} type="email" />
    },
    {
      key: 'companyName',
      label: 'Company',
      render: (value) => value || 'Unknown'
    },
    {
      key: 'jobTitle',
      label: 'Job Title',
      render: (value) => value || 'N/A'
    },
    {
      key: 'processedAt',
      label: 'Received',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    {
      key: 'metadata',
      label: 'Job Updated',
      render: (value) => {
        const metadata = typeof value === 'string' ? JSON.parse(value || '{}') : value || {}
        return metadata.jobStatusUpdated ? '✅ Yes' : '⏳ Pending'
      }
    }
  ]

  const filteredEvents = emailEvents.filter(event => {
    const matchesSearch = !searchTerm || 
      event.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.from?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || event.type === typeFilter
    
    return matchesSearch && matchesType
  })

  // Calculate stats
  const stats = {
    total: emailEvents.length,
    rejections: emailEvents.filter(e => e.type === 'rejection').length,
    interviews: emailEvents.filter(e => e.type === 'interview_invite').length,
    assessments: emailEvents.filter(e => e.type === 'assessment').length,
    offers: emailEvents.filter(e => e.type === 'offer').length,
    updated: emailEvents.filter(e => {
      const metadata = typeof e.metadata === 'string' ? JSON.parse(e.metadata || '{}') : e.metadata || {}
      return metadata.jobStatusUpdated
    }).length
  }

  return (
    <div className="email-monitor-hub">
      {/* Header with Status */}
      <div className="card animate-slide-in-up">
        <div className="card-header">
          <div className="header-content">
            <h2 className="card-title">
              <span>📧</span>
              Email Monitor
            </h2>
            <p className="card-subtitle">
              Monitor job-related emails and automatically update job statuses
            </p>
          </div>
          <div className="monitoring-status">
            <div className={`status-indicator ${isMonitoring ? 'active' : 'inactive'}`}>
              <div className="status-dot"></div>
              <span>{isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}</span>
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Emails</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.rejections}</div>
            <div className="stat-label">Rejections</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.interviews}</div>
            <div className="stat-label">Interviews</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.offers}</div>
            <div className="stat-label">Offers</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.updated}</div>
            <div className="stat-label">Jobs Updated</div>
          </div>
        </div>

        {/* Controls */}
        <div className="email-controls">
          <button
            onClick={handleCheckNow}
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Checking...' : '🔄 Check Emails Now'}
          </button>
          
          {!isMonitoring ? (
            <button
              onClick={handleStartMonitoring}
              className="btn btn-success"
            >
              ▶️ Start Monitoring
            </button>
          ) : (
            <div className="monitoring-info">
              <span className="monitoring-text">
                ✅ Monitoring every 5 minutes
              </span>
              {monitoringStatus?.lastChecked && (
                <span className="last-check">
                  Last check: {new Date(monitoringStatus.lastChecked).toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by subject, company, or sender..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Types</option>
            <option value="rejection">Rejections</option>
            <option value="interview_invite">Interview Invites</option>
            <option value="assessment">Assessments</option>
            <option value="offer">Offers</option>
            <option value="follow_up">Follow-ups</option>
          </select>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Email Events Table */}
      <div className="card animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={filteredEvents}
          columns={columns}
          loading={loading}
          emptyMessage="No email events found. Start email monitoring to track job-related emails automatically."
        />
      </div>

      {/* Setup Instructions */}
      {!isMonitoring && emailEvents.length === 0 && (
        <div className="card animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h3 className="card-title">
              <span>⚙️</span>
              Setup Email Monitoring
            </h3>
          </div>
          <div className="setup-instructions">
            <div className="instruction-item">
              <div className="instruction-number">1</div>
              <div className="instruction-content">
                <h4>Configure Gmail Access</h4>
                <p>Make sure your Gmail credentials are configured in the backend environment variables.</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-number">2</div>
              <div className="instruction-content">
                <h4>Start Monitoring</h4>
                <p>Click "Start Monitoring" to begin automatic email scanning every 5 minutes.</p>
              </div>
            </div>
            <div className="instruction-item">
              <div className="instruction-number">3</div>
              <div className="instruction-content">
                <h4>Automatic Job Updates</h4>
                <p>When rejection or interview emails are detected, job statuses will be updated automatically.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .email-monitor-hub {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .header-content {
          flex: 1;
        }

        .monitoring-status {
          display: flex;
          align-items: center;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: 600;
        }

        .status-indicator.active {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success-500);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .status-indicator.inactive {
          background: rgba(107, 114, 128, 0.1);
          color: var(--neutral-500);
          border: 1px solid rgba(107, 114, 128, 0.3);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: var(--radius-full);
          background: currentColor;
        }

        .status-indicator.active .status-dot {
          animation: pulse 2s infinite;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }

        .stat-item {
          text-align: center;
          padding: var(--space-4);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
        }

        .stat-value {
          font-size: var(--text-2xl);
          font-weight: 800;
          background: var(--gradient-warning);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-1);
        }

        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
        }

        .email-controls {
          display: flex;
          gap: var(--space-4);
          align-items: center;
          margin-bottom: var(--space-6);
          flex-wrap: wrap;
        }

        .monitoring-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .monitoring-text {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--success-500);
        }

        .last-check {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .search-form {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }

        .search-form .form-input {
          flex: 1;
        }

        .search-form .form-select {
          min-width: 150px;
        }

        .setup-instructions {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .instruction-item {
          display: flex;
          gap: var(--space-4);
          align-items: flex-start;
        }

        .instruction-number {
          width: 32px;
          height: 32px;
          background: var(--gradient-warning);
          color: white;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: var(--text-sm);
          flex-shrink: 0;
        }

        .instruction-content h4 {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 var(--space-2) 0;
        }

        .instruction-content p {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-4);
          }

          .email-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-form {
            flex-direction: column;
            align-items: stretch;
          }

          .search-form .form-select {
            min-width: auto;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
}

export default EmailMonitorHub