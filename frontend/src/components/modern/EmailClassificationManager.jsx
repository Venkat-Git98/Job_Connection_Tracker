import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import DataTable from '../shared/DataTable'
import StatusBadge from '../shared/StatusBadge'

const EmailClassificationManager = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(false)
  const [feedbackData, setFeedbackData] = useState({ correctType: '', feedback: '' })
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    loadClassificationStats()
  }, [])

  const loadClassificationStats = async () => {
    try {
      setLoading(true)
      const response = await apiService.get('/email/classification-stats')
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to load classification stats:', error)
      showError('Failed to load classification statistics')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async () => {
    try {
      await apiService.post('/email/classification-feedback', {
        emailId: selectedEmail.id,
        correctType: feedbackData.correctType,
        feedback: feedbackData.feedback
      })
      
      showSuccess('Classification feedback submitted successfully')
      setFeedbackModal(false)
      setSelectedEmail(null)
      setFeedbackData({ correctType: '', feedback: '' })
      loadClassificationStats()
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      showError('Failed to submit feedback')
    }
  }

  const getTypeColor = (type) => {
    const colors = {
      rejection: 'var(--danger-500)',
      interview_invite: 'var(--success-500)',
      assessment: 'var(--warning-500)',
      offer: 'var(--success-600)',
      application_confirmation: 'var(--info-500)',
      follow_up: 'var(--primary-500)',
      not_job_related: 'var(--neutral-500)',
      other: 'var(--neutral-400)'
    }
    return colors[type] || 'var(--neutral-500)'
  }

  const columns = [
    {
      key: 'subject',
      label: 'Subject',
      render: (value) => (
        <div style={{ maxWidth: '300px' }} className="text-truncate">
          {value}
        </div>
      )
    },
    {
      key: 'type',
      label: 'Classified As',
      render: (value) => (
        <span style={{ 
          color: getTypeColor(value),
          fontWeight: '600',
          textTransform: 'capitalize'
        }}>
          {value.replace('_', ' ')}
        </span>
      )
    },
    {
      key: 'confidence',
      label: 'Confidence',
      render: (value) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            style={{
              width: '60px',
              height: '6px',
              background: 'var(--bg-muted)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                width: `${value}%`,
                height: '100%',
                background: value >= 80 ? 'var(--success-500)' : 
                          value >= 60 ? 'var(--warning-500)' : 'var(--danger-500)',
                borderRadius: '3px'
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {value}%
          </span>
        </div>
      )
    },
    {
      key: 'timestamp',
      label: 'Classified',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => (
        <button
          onClick={() => {
            setSelectedEmail(row)
            setFeedbackModal(true)
          }}
          className="btn btn-sm btn-secondary"
        >
          Provide Feedback
        </button>
      )
    }
  ]

  if (loading) {
    return (
      <div className="email-classification-manager">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span>🤖</span>
              Email Classification Analytics
            </h2>
          </div>
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            Loading classification statistics...
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="email-classification-manager">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span>🤖</span>
              Email Classification Analytics
            </h2>
          </div>
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            No classification data available yet.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="email-classification-manager">
      {/* Overview Stats */}
      <div className="card animate-slide-in-up">
        <div className="card-header">
          <h2 className="card-title">
            <span>🤖</span>
            Email Classification Analytics
          </h2>
          <p className="card-subtitle">
            AI-powered email classification performance and accuracy metrics
          </p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Classified</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{Math.round(stats.averageConfidence)}%</div>
            <div className="stat-label">Avg Confidence</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{Object.keys(stats.byType).length}</div>
            <div className="stat-label">Email Types</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{Object.keys(stats.byDomain).length}</div>
            <div className="stat-label">Unique Domains</div>
          </div>
        </div>
      </div>

      {/* Classification Breakdown */}
      <div className="card animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="card-header">
          <h3 className="card-title">Classification Breakdown</h3>
        </div>
        
        <div className="breakdown-grid">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="breakdown-item">
              <div className="breakdown-header">
                <span 
                  className="breakdown-dot"
                  style={{ background: getTypeColor(type) }}
                />
                <span className="breakdown-type">
                  {type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="breakdown-count">{count}</div>
              <div className="breakdown-percentage">
                {((count / stats.total) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Domains */}
      <div className="card animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="card-header">
          <h3 className="card-title">Top Email Domains</h3>
        </div>
        
        <div className="domain-list">
          {Object.entries(stats.byDomain)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([domain, count]) => (
              <div key={domain} className="domain-item">
                <div className="domain-name">{domain}</div>
                <div className="domain-count">{count} emails</div>
                <div className="domain-bar">
                  <div 
                    className="domain-bar-fill"
                    style={{ 
                      width: `${(count / Math.max(...Object.values(stats.byDomain))) * 100}%` 
                    }}
                  />
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Recent Classifications */}
      <div className="card animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="card-header">
          <h3 className="card-title">Recent Classifications</h3>
        </div>
        
        <DataTable
          data={stats.recentClassifications}
          columns={columns}
          loading={false}
          emptyMessage="No recent classifications available"
        />
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="modal-overlay" onClick={() => setFeedbackModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Provide Classification Feedback</h3>
              <button 
                className="modal-close"
                onClick={() => setFeedbackModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Email Subject:</label>
                <div className="email-subject">{selectedEmail?.subject}</div>
              </div>
              
              <div className="form-group">
                <label>Current Classification:</label>
                <div className="current-classification">
                  <StatusBadge status={selectedEmail?.type} type="email" />
                  <span>({selectedEmail?.confidence}% confidence)</span>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="correctType">Correct Classification:</label>
                <select
                  id="correctType"
                  value={feedbackData.correctType}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, correctType: e.target.value }))}
                  className="form-select"
                >
                  <option value="">Select correct type...</option>
                  <option value="rejection">Rejection</option>
                  <option value="interview_invite">Interview Invite</option>
                  <option value="assessment">Assessment</option>
                  <option value="offer">Job Offer</option>
                  <option value="application_confirmation">Application Confirmation</option>
                  <option value="follow_up">Follow-up</option>
                  <option value="not_job_related">Not Job Related</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="feedback">Additional Feedback (optional):</label>
                <textarea
                  id="feedback"
                  value={feedbackData.feedback}
                  onChange={(e) => setFeedbackData(prev => ({ ...prev, feedback: e.target.value }))}
                  className="form-textarea"
                  rows="3"
                  placeholder="Explain why this classification was incorrect..."
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setFeedbackModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleFeedback}
                disabled={!feedbackData.correctType}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .email-classification-manager {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: var(--space-4);
        }

        .breakdown-item {
          padding: var(--space-4);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
        }

        .breakdown-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        }

        .breakdown-dot {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-full);
        }

        .breakdown-type {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
        }

        .breakdown-count {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
        }

        .breakdown-percentage {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .domain-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .domain-item {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-3);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-lg);
        }

        .domain-name {
          font-weight: 600;
          color: var(--text-primary);
          min-width: 150px;
        }

        .domain-count {
          font-size: var(--text-sm);
          color: var(--text-muted);
          min-width: 80px;
        }

        .domain-bar {
          flex: 1;
          height: 6px;
          background: var(--bg-muted);
          border-radius: var(--radius-full);
          overflow: hidden;
        }

        .domain-bar-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-full);
          transition: width 0.3s ease;
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
          max-width: 500px;
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

        .form-group {
          margin-bottom: var(--space-4);
        }

        .form-group label {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .email-subject {
          padding: var(--space-3);
          background: var(--bg-muted);
          border-radius: var(--radius-lg);
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .current-classification {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .modal-footer {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          padding: var(--space-6);
          border-top: 1px solid var(--border-primary);
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .breakdown-grid {
            grid-template-columns: 1fr;
          }

          .domain-item {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-2);
          }

          .domain-name,
          .domain-count {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  )
}

export default EmailClassificationManager