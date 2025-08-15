import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useUser } from '../../contexts/UserContext'
import DataTable from '../shared/DataTable'
import StatusBadge from '../shared/StatusBadge'
import ActionButtons from '../shared/ActionButtons'

const JobsHub = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const { showSuccess, showError } = useToast()
  const { currentUser } = useUser()

  useEffect(() => {
    if (currentUser) {
      loadJobs()
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser) {
      loadJobs()
    }
  }, [searchTerm, statusFilter, platformFilter])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const response = await apiService.getJobs({ 
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined
      })
      setJobs(response.data.jobs || [])
    } catch (error) {
      console.error('Failed to load jobs:', error)
      showError('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadJobs()
  }

  const handleStatusUpdate = async (jobUrl, newStatus) => {
    try {
      await apiService.updateJobStatus(jobUrl, newStatus)
      showSuccess(`Job status updated to ${newStatus}`)
      loadJobs()
    } catch (error) {
      console.error('Failed to update status:', error)
      showError('Failed to update job status')
    }
  }

  const handleMarkApplied = async (jobUrl) => {
    try {
      await apiService.markJobAsApplied(jobUrl)
      showSuccess('Job marked as applied')
      loadJobs()
    } catch (error) {
      console.error('Failed to mark as applied:', error)
      showError('Failed to mark job as applied')
    }
  }

  const handleAddNote = async (jobUrl, note) => {
    if (!note.trim()) return
    
    try {
      await apiService.addJobNote(jobUrl, note)
      showSuccess('Note added successfully')
      loadJobs()
    } catch (error) {
      console.error('Failed to add note:', error)
      showError('Failed to add note')
    }
  }

  const columns = [
    {
      key: 'jobTitle',
      label: 'Job Title',
      render: (value, row) => (
        <div>
          <div style={{ fontWeight: '600' }}>{value}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {row.platform}
          </div>
        </div>
      )
    },
    {
      key: 'companyName',
      label: 'Company',
      render: (value) => value || 'N/A'
    },
    {
      key: 'location',
      label: 'Location',
      render: (value) => value || 'Remote/N/A'
    },
    {
      key: 'applicationStatus',
      label: 'Status',
      render: (value) => <StatusBadge status={value} type="job" />
    },
    {
      key: 'appliedDate',
      label: 'Applied Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Not Applied'
    },
    {
      key: 'postedDate',
      label: 'Posted Date',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'N/A'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <ActionButtons
          items={[
            {
              label: 'View Job',
              onClick: () => window.open(row.jobUrl, '_blank'),
              variant: 'secondary'
            },
            {
              label: 'Mark Applied',
              onClick: () => handleMarkApplied(row.jobUrl),
              variant: 'success',
              show: row.applicationStatus === 'viewed'
            },
            {
              label: 'Add Quick Note',
              onClick: () => {
                const note = prompt('Add a quick note (e.g., recruiter name, next step):')
                if (note) handleAddNote(row.jobUrl, note)
              },
              variant: 'secondary'
            },
            {
              label: 'Interviewing',
              onClick: () => handleStatusUpdate(row.jobUrl, 'interviewing'),
              variant: 'primary',
              show: row.applicationStatus === 'applied'
            },
            {
              label: 'Rejected',
              onClick: () => handleStatusUpdate(row.jobUrl, 'rejected'),
              variant: 'danger',
              show: ['applied', 'interviewing'].includes(row.applicationStatus)
            },
            {
              label: 'Got Offer',
              onClick: () => handleStatusUpdate(row.jobUrl, 'offer'),
              variant: 'success',
              show: row.applicationStatus === 'interviewing'
            }
          ].filter(item => item.show !== false)}
        />
      )
    }
  ]

  // Get unique platforms for filter
  const platforms = [...new Set(jobs.map(job => job.platform))].sort()

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = !searchTerm || 
      job.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || job.applicationStatus === statusFilter
    const matchesPlatform = platformFilter === 'all' || job.platform === platformFilter
    
    return matchesSearch && matchesStatus && matchesPlatform
  })

  // Calculate stats
  const stats = {
    total: jobs.length,
    viewed: jobs.filter(j => j.applicationStatus === 'viewed').length,
    applied: jobs.filter(j => j.applicationStatus === 'applied').length,
    interviewing: jobs.filter(j => j.applicationStatus === 'interviewing').length,
    offers: jobs.filter(j => j.applicationStatus === 'offer').length,
    rejected: jobs.filter(j => j.applicationStatus === 'rejected').length
  }

  return (
    <div className="jobs-hub">
      {/* Header with Stats */}
      <div className="card animate-slide-in-up">
        <div className="card-header">
          <h2 className="card-title">
            <span>💼</span>
            Job Applications
          </h2>
          <p className="card-subtitle">
            Track your job applications and manage the hiring process
          </p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.applied}</div>
            <div className="stat-label">Applied</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.interviewing}</div>
            <div className="stat-label">Interviewing</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.offers}</div>
            <div className="stat-label">Offers</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>

        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search by job title or company..."
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
            <option value="viewed">Viewed</option>
            <option value="applied">Applied</option>
            <option value="interviewing">Interviewing</option>
            <option value="assessment">Assessment</option>
            <option value="rejected">Rejected</option>
            <option value="offer">Offer</option>
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="form-select"
          >
            <option value="all">All Platforms</option>
            {platforms.map(platform => (
              <option key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Jobs Table */}
      <div className="card animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        <DataTable
          data={filteredJobs}
          columns={columns}
          loading={loading}
          emptyMessage="No jobs found. Start by using the Chrome extension to track job postings."
        />
      </div>

      {/* Quick Actions */}
      <div className="card animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="card-header">
          <h3 className="card-title">
            <span>⚡</span>
            Quick Actions
          </h3>
        </div>
        <div className="quick-actions">
          <button
            onClick={() => loadJobs()}
            className="btn btn-secondary"
          >
            🔄 Refresh Data
          </button>
          <button
            onClick={() => {
              const viewedJobs = jobs.filter(j => j.applicationStatus === 'viewed')
              if (viewedJobs.length === 0) {
                showError('No viewed jobs to mark as applied')
                return
              }
              if (confirm(`Mark all ${viewedJobs.length} viewed jobs as applied?`)) {
                Promise.all(viewedJobs.map(job => handleMarkApplied(job.jobUrl)))
                  .then(() => showSuccess(`Marked ${viewedJobs.length} jobs as applied`))
                  .catch(() => showError('Failed to update some jobs'))
              }
            }}
            className="btn btn-success"
            disabled={stats.viewed === 0}
          >
            ✅ Mark All Viewed as Applied ({stats.viewed})
          </button>
        </div>
      </div>

      <style jsx>{`
        .jobs-hub {
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
          background: var(--gradient-success);
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
          min-width: 150px;
        }

        .quick-actions {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
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

          .quick-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

export default JobsHub