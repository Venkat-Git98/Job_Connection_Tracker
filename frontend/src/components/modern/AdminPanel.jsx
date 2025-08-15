import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useUser } from '../../contexts/UserContext'

const AdminPanel = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showConfirm, setShowConfirm] = useState(false)
  const [cleanupType, setCleanupType] = useState(null)
  const { showSuccess, showError, showWarning } = useToast()
  const { currentUser } = useUser()

  // Check if current user has admin access (only Venkat)
  const hasAdminAccess = currentUser && (
    currentUser.username === 'venkat' || 
    currentUser.preferences?.admin_access === true
  )

  useEffect(() => {
    if (currentUser && hasAdminAccess) {
      loadStats()
    }
  }, [currentUser, hasAdminAccess])

  // Show access denied message if user doesn't have admin access
  if (!hasAdminAccess) {
    return (
      <div className="admin-access-denied">
        <div className="access-denied-content">
          <div className="access-denied-icon">🔒</div>
          <h2>Admin Access Restricted</h2>
          <p>Administrative functions are only available for authorized users.</p>
          <p>Contact the system administrator if you need access to this panel.</p>
        </div>

        <style jsx>{`
          .admin-access-denied {
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

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await apiService.getDatabaseStats()
      setStats(response.data.stats)
    } catch (error) {
      console.error('Failed to load database stats:', error)
      showError('Failed to load database statistics')
    } finally {
      setLoading(false)
    }
  }

  const handleCleanup = (type) => {
    setCleanupType(type)
    setShowConfirm(true)
  }

  const confirmCleanup = async () => {
    try {
      if (cleanupType === 'all') {
        await apiService.cleanupAllData()
        showWarning('All data cleanup initiated. This may take a few moments.')
      } else if (cleanupType === 'dummy') {
        await apiService.cleanupDummyData()
        showSuccess('Dummy data cleanup initiated. Test data will be removed.')
      }
      
      setShowConfirm(false)
      setCleanupType(null)
      
      // Reload stats after a delay
      setTimeout(() => {
        loadStats()
      }, 3000)
      
    } catch (error) {
      console.error('Failed to initiate cleanup:', error)
      showError('Failed to initiate database cleanup')
    }
  }

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span>⚙️</span>
              Admin Panel
            </h2>
          </div>
          <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
            Loading database statistics...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      {/* Database Statistics */}
      <div className="card animate-slide-in-up">
        <div className="card-header">
          <h2 className="card-title">
            <span>📊</span>
            Database Statistics
          </h2>
          <p className="card-subtitle">
            Current database usage and recent activity
          </p>
        </div>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{stats?.jobs || 0}</div>
            <div className="stat-label">Total Jobs</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats?.profiles || 0}</div>
            <div className="stat-label">Connections</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats?.email_events || 0}</div>
            <div className="stat-label">Email Events</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats?.users || 0}</div>
            <div className="stat-label">Users</div>
          </div>
        </div>

        {stats?.recent_activity && (
          <div className="recent-activity">
            <h3>Recent Activity (Last 7 Days)</h3>
            <div className="activity-grid">
              <div className="activity-item">
                <span className="activity-count">{stats.recent_activity.jobs_last_7_days}</span>
                <span className="activity-label">New Jobs</span>
              </div>
              <div className="activity-item">
                <span className="activity-count">{stats.recent_activity.profiles_last_7_days}</span>
                <span className="activity-label">New Connections</span>
              </div>
              <div className="activity-item">
                <span className="activity-count">{stats.recent_activity.emails_last_7_days}</span>
                <span className="activity-label">Email Events</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Database Cleanup */}
      <div className="card animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="card-header">
          <h2 className="card-title">
            <span>🧹</span>
            Database Cleanup
          </h2>
          <p className="card-subtitle">
            Remove unwanted data to clean up your analytics
          </p>
        </div>
        
        <div className="cleanup-options">
          <div className="cleanup-option">
            <div className="cleanup-info">
              <h3>Clean Dummy Data</h3>
              <p>
                Remove test/sample data from known test companies (Google, Microsoft, etc.) 
                while preserving your real job applications and connections.
              </p>
              <div className="cleanup-details">
                <strong>Will remove:</strong>
                <ul>
                  <li>Jobs from test companies (Google, Microsoft, OpenAI, etc.)</li>
                  <li>Sample profiles and connections</li>
                  <li>Old test data (older than 30 days)</li>
                  <li>Related email events</li>
                </ul>
                <strong>Will preserve:</strong> All your real job applications and connections
              </div>
            </div>
            <button
              onClick={() => handleCleanup('dummy')}
              className="btn btn-warning"
            >
              🗑️ Clean Dummy Data
            </button>
          </div>

          <div className="cleanup-option danger">
            <div className="cleanup-info">
              <h3>Clean All Data</h3>
              <p>
                <strong>⚠️ DANGER:</strong> This will permanently delete ALL data including 
                your real job applications, connections, and email events.
              </p>
              <div className="cleanup-details">
                <strong>Will remove:</strong>
                <ul>
                  <li>All job applications</li>
                  <li>All connections and profiles</li>
                  <li>All email events</li>
                  <li>All user data (except admin user)</li>
                </ul>
                <strong style={{ color: 'var(--danger-500)' }}>
                  This action cannot be undone!
                </strong>
              </div>
            </div>
            <button
              onClick={() => handleCleanup('all')}
              className="btn btn-danger"
            >
              ⚠️ Delete All Data
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {cleanupType === 'all' ? '⚠️ Confirm Delete All Data' : '🧹 Confirm Cleanup'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowConfirm(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {cleanupType === 'all' ? (
                <>
                  <p><strong>You are about to delete ALL data from the database!</strong></p>
                  <p>This includes:</p>
                  <ul>
                    <li>All job applications ({stats?.jobs || 0} jobs)</li>
                    <li>All connections ({stats?.profiles || 0} profiles)</li>
                    <li>All email events ({stats?.email_events || 0} events)</li>
                  </ul>
                  <p style={{ color: 'var(--danger-500)', fontWeight: 'bold' }}>
                    This action cannot be undone!
                  </p>
                </>
              ) : (
                <>
                  <p>You are about to clean up dummy/test data.</p>
                  <p>This will remove:</p>
                  <ul>
                    <li>Jobs from test companies (Google, Microsoft, etc.)</li>
                    <li>Sample profiles and connections</li>
                    <li>Old test data and related email events</li>
                  </ul>
                  <p style={{ color: 'var(--success-500)' }}>
                    Your real data will be preserved.
                  </p>
                </>
              )}
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className={`btn ${cleanupType === 'all' ? 'btn-danger' : 'btn-warning'}`}
                onClick={confirmCleanup}
              >
                {cleanupType === 'all' ? 'Delete All Data' : 'Clean Dummy Data'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-panel {
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

        .recent-activity {
          padding-top: var(--space-6);
          border-top: 1px solid var(--border-primary);
        }

        .recent-activity h3 {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-4);
        }

        .activity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--space-3);
        }

        .activity-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: var(--space-3);
          background: var(--bg-muted);
          border-radius: var(--radius-lg);
        }

        .activity-count {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
        }

        .activity-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          text-align: center;
        }

        .cleanup-options {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .cleanup-option {
          display: flex;
          gap: var(--space-4);
          padding: var(--space-6);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          align-items: flex-start;
        }

        .cleanup-option.danger {
          border-color: var(--danger-300);
          background: rgba(239, 68, 68, 0.05);
        }

        .cleanup-info {
          flex: 1;
        }

        .cleanup-info h3 {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 var(--space-2) 0;
        }

        .cleanup-info p {
          color: var(--text-secondary);
          margin: 0 0 var(--space-3) 0;
          line-height: var(--leading-relaxed);
        }

        .cleanup-details {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .cleanup-details ul {
          margin: var(--space-2) 0;
          padding-left: var(--space-4);
        }

        .cleanup-details li {
          margin-bottom: var(--space-1);
        }

        .btn-warning {
          background: var(--warning-500);
          color: white;
          border: 1px solid var(--warning-500);
        }

        .btn-warning:hover {
          background: var(--warning-600);
          border-color: var(--warning-600);
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

        .modal-body p {
          margin: 0 0 var(--space-3) 0;
          color: var(--text-primary);
        }

        .modal-body ul {
          margin: var(--space-3) 0;
          padding-left: var(--space-4);
        }

        .modal-body li {
          margin-bottom: var(--space-1);
          color: var(--text-secondary);
        }

        .modal-footer {
          display: flex;
          gap: var(--space-3);
          justify-content: flex-end;
          padding: var(--space-6);
          border-top: 1px solid var(--border-primary);
        }

        @media (max-width: 768px) {
          .cleanup-option {
            flex-direction: column;
            align-items: stretch;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .activity-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  )
}

export default AdminPanel