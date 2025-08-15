import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useUser } from '../../contexts/UserContext'
import DataTable from '../shared/DataTable'
import StatusBadge from '../shared/StatusBadge'
import ActionButtons from '../shared/ActionButtons'

const ConnectionsHub = () => {
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stats, setStats] = useState(null)
  const { showSuccess, showError } = useToast()
  const { currentUser } = useUser()

  useEffect(() => {
    if (currentUser) {
      loadConnections()
      loadStats()
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      loadConnections()
    }
  }, [searchTerm, statusFilter])

  const loadConnections = async () => {
    try {
      setLoading(true)
      const response = await apiService.getConnections({ 
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined 
      })
      setConnections(response.data.connections || [])
    } catch (error) {
      console.error('Failed to load connections:', error)
      showError('Failed to load connections')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await apiService.getConnectionStats()
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadConnections()
  }

  const handleStatusUpdate = async (profileId, newStatus) => {
    try {
      await apiService.updateConnectionStatus(profileId, newStatus)
      showSuccess(`Connection status updated to ${newStatus}`)
      loadConnections()
      loadStats()
    } catch (error) {
      console.error('Failed to update status:', error)
      showError('Failed to update connection status')
    }
  }

  const handleCopyConnectionText = async (text) => {
    if (!text) {
      showError('No connection request text available')
      return
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.top = '-1000px'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      showSuccess('Connection request copied to clipboard')
    } catch (error) {
      console.error('Failed to copy text:', error)
      showError('Failed to copy to clipboard')
    }
  }

  const handleGenerateConnection = async (profile) => {
    try {
      const response = await apiService.generateConnection(profile)
      showSuccess('New connection request generated')
      
      if (response.data.connectionRequest) {
        await navigator.clipboard.writeText(response.data.connectionRequest)
        showSuccess('Connection request copied to clipboard')
      }
      
      loadConnections()
    } catch (error) {
      console.error('Failed to generate connection:', error)
      showError('Failed to generate connection request')
    }
  }

  const columns = [
    {
      key: 'personName',
      label: 'Name',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: '600' }}>{value}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {row.currentTitle}
          </div>
        </div>
      )
    },
    {
      key: 'currentCompany',
      label: 'Company',
      render: (value) => value || 'N/A'
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => value || 'N/A'
    },
    {
      key: 'connectionStatus',
      label: 'Status',
      render: (value) => <StatusBadge status={value} type="connection" />
    },
    {
      key: 'lastContactDate',
      label: 'Last Contact',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <ActionButtons
          items={[
            {
              label: 'View Profile',
              onClick: () => window.open(row.profileUrl, '_blank'),
              variant: 'secondary'
            },
            {
              label: 'Generate Request',
              onClick: () => handleGenerateConnection(row),
              variant: 'primary'
            },
            {
              label: 'Follow Up',
              onClick: () => {
                const msg = `Hi ${row.personName?.split(' ')[0] || ''}, just following up on my connection request.`
                handleCopyConnectionText(msg)
              },
              variant: 'secondary'
            },
            ...(row.connectionRequestText ? [{
              label: 'Copy Request',
              onClick: () => handleCopyConnectionText(row.connectionRequestText),
              variant: 'secondary'
            }] : []),
            {
              label: 'Mark Requested',
              onClick: () => handleStatusUpdate(row.id, 'requested'),
              variant: 'success',
              show: row.connectionStatus === 'none'
            },
            {
              label: 'Mark Accepted',
              onClick: () => handleStatusUpdate(row.id, 'accepted'),
              variant: 'success',
              show: row.connectionStatus === 'requested'
            }
          ].filter(item => item.show !== false)}
        />
      )
    }
  ]

  const filteredConnections = connections.filter(connection => {
    const matchesSearch = !searchTerm || 
      connection.personName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.currentCompany?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || connection.connectionStatus === statusFilter
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="connections-hub">
      {/* Header with Stats */}
      <div className="card animate-slide-in-up">
        <div className="card-header">
          <h2 className="card-title">
            <span>🤝</span>
            LinkedIn Connections
          </h2>
          <p className="card-subtitle">
            Manage your professional network and track connection requests
          </p>
        </div>
        
        {stats && (
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{stats.totalProfiles}</div>
              <div className="stat-label">Total Profiles</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.accepted}</div>
              <div className="stat-label">Accepted</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.requested}</div>
              <div className="stat-label">Requested</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{stats.notContacted}</div>
              <div className="stat-label">Not Contacted</div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by name or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Statuses</option>
            <option value="none">Not Contacted</option>
            <option value="requested">Requested</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
          </select>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Connections Table */}
      <div className="card animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={filteredConnections}
          columns={columns}
          loading={loading}
          emptyMessage="No connections found. Start by using the Chrome extension to track LinkedIn profiles."
        />
      </div>

      <style jsx>{`
        .connections-hub {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
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
          background: var(--gradient-primary);
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

        .search-form {
          display: flex;
          gap: var(--space-3);
          align-items: center;
        }

        .search-form .form-input {
          flex: 1;
        }

        .search-form .form-select {
          min-width: 200px;
        }

        @media (max-width: 768px) {
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

export default ConnectionsHub