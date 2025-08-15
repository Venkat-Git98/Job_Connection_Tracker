import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useUser } from '../../contexts/UserContext'
import DataTable from '../shared/DataTable'
import StatusBadge from '../shared/StatusBadge'

const EmailMonitorHub = () => {
  const [emailEvents, setEmailEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [monitoringStatus, setMonitoringStatus] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)
  const { showSuccess, showError, showInfo } = useToast()
  const { currentUser } = useUser()

  // Check if current user has email access (only Venkat)
  const hasEmailAccess = currentUser && (
    currentUser.username === 'venkat' || 
    currentUser.preferences?.email_access === true
  )

  useEffect(() => {
    if (currentUser && hasEmailAccess) {
      loadEmailEvents()
      loadMonitoringStatus()
    }
  }, [currentUser, hasEmailAccess])

  useEffect(() => {
    if (currentUser && hasEmailAccess) {
      loadEmailEvents()
    }
  }, [searchTerm, typeFilter])

  // Show access denied message if user doesn't have email access
  if (!hasEmailAccess) {
    return (
      <div className="email-access-denied">
        <div className="access-denied-content">
          <div className="access-denied-icon">🔒</div>
          <h2>Email Access Restricted</h2>
          <p>Email monitoring is only available for authorized users.</p>
          <p>Contact the administrator if you need access to this feature.</p>
        </div>

        <style jsx>{`
          .email-access-denied {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            padding: var(--space-8);
          }

          .access-denied-content {
            text-align: center;
            max-width: 500px;
            padding: var(--space-8);
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-3xl);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }

          .access-denied-icon {
            font-size: 4rem;
            margin-bottom: var(--space-4);
          }

          .access-denied-content h2 {
            font-size: var(--text-2xl);
            font-weight: 800;
            color: var(--text-primary);
            margin-bottom: var(--space-3);
          }

          .access-denied-content p {
            color: var(--text-muted);
            margin-bottom: var(--space-2);
            line-height: var(--leading-relaxed);
          }

          .access-denied-content p:last-child {
            margin-bottom: 0;
          }
        `}</style>
      </div>
    )
  }

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
      await apiService.startEmailMonitoring(60) // Check every 60 minutes (1 hour)
      showSuccess('Email monitoring started successfully (checking every hour)')
      setIsMonitoring(true)
      loadMonitoringStatus()
    } catch (error) {
      console.error('Failed to start monitoring:', error)
      showError('Failed to start email monitoring')
    }
  }

  const handleStopMonitoring = async () => {
    try {
      await apiService.stopEmailMonitoring()
      showSuccess('Email monitoring stopped')
      setIsMonitoring(false)
      loadMonitoringStatus()
    } catch (error) {
      console.error('Failed to stop monitoring:', error)
      showError('Failed to stop email monitoring')
    }
  }

  const handleDeleteEvent = async (eventId) => {
    setEventToDelete(eventId)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteEvent = async () => {
    try {
      await apiService.deleteEmailEvent(eventToDelete)
      showSuccess('Email event deleted successfully')
      setShowDeleteConfirm(false)
      setEventToDelete(null)
      loadEmailEvents() // Refresh the list
    } catch (error) {
      console.error('Failed to delete email event:', error)
      showError('Failed to delete email event')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedEvents.size === 0) {
      showError('Please select events to delete')
      return
    }

    try {
      const eventIds = Array.from(selectedEvents)
      await apiService.bulkDeleteEmailEvents(eventIds)
      showSuccess(`Successfully deleted ${eventIds.length} email events`)
      setSelectedEvents(new Set())
      loadEmailEvents() // Refresh the list
    } catch (error) {
      console.error('Failed to bulk delete email events:', error)
      showError('Failed to delete selected email events')
    }
  }

  const handleSelectEvent = (eventId) => {
    const newSelected = new Set(selectedEvents)
    if (newSelected.has(eventId)) {
      newSelected.delete(eventId)
    } else {
      newSelected.add(eventId)
    }
    setSelectedEvents(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedEvents.size === filteredEvents.length) {
      setSelectedEvents(new Set())
    } else {
      setSelectedEvents(new Set(filteredEvents.map(event => event.id)))
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

  // Calculate filtered events first
  const filteredEvents = emailEvents.filter(event => {
    const matchesSearch = !searchTerm || 
      event.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.from?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || event.type === typeFilter
    
    return matchesSearch && matchesType
  })

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={selectedEvents.size === filteredEvents.length && filteredEvents.length > 0}
          onChange={handleSelectAll}
          style={{ margin: 0 }}
        />
      ),
      render: (value, row) => (
        <input
          type="checkbox"
          checked={selectedEvents.has(row.id)}
          onChange={() => handleSelectEvent(row.id)}
          style={{ margin: 0 }}
        />
      )
    },
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
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <button
          onClick={() => handleDeleteEvent(row.id)}
          className="btn btn-sm btn-danger"
          title="Delete this email event"
        >
          🗑️ Delete
        </button>
      )
    }
  ]

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
              ▶️ Start Hourly Monitoring
            </button>
          ) : (
            <div className="monitoring-info">
              <span className="monitoring-text">
                ✅ Monitoring every hour
              </span>
              {monitoringStatus?.lastChecked && (
                <span className="last-check">
                  Last check: {new Date(monitoringStatus.lastChecked).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={handleStopMonitoring}
                className="btn btn-sm btn-danger"
                style={{ marginTop: 'var(--space-2)' }}
              >
                ⏹️ Stop Monitoring
              </button>
            </div>
          )}
          
          <button
            onClick={() => window.location.hash = '#email-classification'}
            className="btn btn-secondary"
          >
            🤖 AI Classification Stats
          </button>
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

        {/* Bulk Actions */}
        {selectedEvents.size > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">
              {selectedEvents.size} event{selectedEvents.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="btn btn-danger"
            >
              🗑️ Delete Selected ({selectedEvents.size})
            </button>
          </div>
        )}
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
                <p>Click "Start Hourly Monitoring" to begin automatic email scanning every hour.</p>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to delete this email event?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                This action cannot be undone.
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmDeleteEvent}
              >
                Delete
              </button>
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

        .bulk-actions {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-3);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
          margin-top: var(--space-4);
        }

        .selected-count {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-2xl);
          width: 90%;
          max-width: 400px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-6);
          border-bottom: 1px solid var(--border-primary);
        }

        .modal-header h3 {
          margin: 0;
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
        }

        .modal-close {
          background: none;
          border: none;
          font-size: var(--text-2xl);
          color: var(--text-muted);
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-full);
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: var(--bg-muted);
          color: var(--text-primary);
        }

        .modal-body {
          padding: var(--space-6);
        }

        .modal-body p {
          margin: 0 0 var(--space-3) 0;
          color: var(--text-primary);
        }

        .modal-body p:last-child {
          margin-bottom: 0;
        }

        .modal-footer {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          padding: var(--space-6);
          border-top: 1px solid var(--border-primary);
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

          .bulk-actions {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-2);
          }
        }

        /* Button styles */
        .btn-sm {
          padding: var(--space-1) var(--space-2);
          font-size: var(--text-xs);
          border-radius: var(--radius-md);
        }

        .btn-danger {
          background: var(--danger-500);
          color: white;
          border: 1px solid var(--danger-500);
        }

        .btn-danger:hover {
          background: var(--danger-600);
          border-color: var(--danger-600);
        }

        .btn-danger:disabled {
          background: var(--danger-300);
          border-color: var(--danger-300);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default EmailMonitorHub