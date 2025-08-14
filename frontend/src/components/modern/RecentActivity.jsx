import React from 'react'

const RecentActivity = ({ activities = [], loading, onRefresh }) => {
  const mockActivities = [
    {
      id: 1,
      type: 'connection',
      action: 'Connection request sent',
      target: 'Sarah Chen at Google',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      status: 'pending'
    },
    {
      id: 2,
      type: 'job',
      action: 'Applied to position',
      target: 'Senior ML Engineer at Microsoft',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      status: 'completed'
    },
    {
      id: 3,
      type: 'connection',
      action: 'Connection accepted',
      target: 'David Kim at Amazon',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      status: 'success'
    },
    {
      id: 4,
      type: 'job',
      action: 'Job posting viewed',
      target: 'AI Research Scientist at Meta',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      status: 'completed'
    },
    {
      id: 5,
      type: 'connection',
      action: 'Profile viewed',
      target: 'Lisa Wang at Tesla',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
      status: 'completed'
    }
  ]

  const data = activities.length > 0 ? activities : mockActivities

  const getActivityIcon = (type, status) => {
    if (type === 'connection') {
      if (status === 'success') return '✅'
      if (status === 'pending') return '⏳'
      return '🤝'
    }
    if (type === 'job') {
      if (status === 'success') return '🎉'
      return '💼'
    }
    return '📝'
  }

  const getActivityColor = (type, status) => {
    if (status === 'success') return 'var(--success-500)'
    if (status === 'pending') return 'var(--warning-500)'
    if (type === 'connection') return 'var(--secondary-500)'
    if (type === 'job') return 'var(--primary-500)'
    return 'var(--neutral-500)'
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="recent-activity">
      <div className="activity-header">
        <h3 className="activity-title">
          <span>⚡</span>
          Recent Activity
        </h3>
        <button
          onClick={onRefresh}
          className="btn btn-ghost btn-sm"
          disabled={loading}
          title="Refresh activity"
        >
          {loading ? <span className="loading loading-sm"></span> : '🔄'}
        </button>
      </div>

      <div className="activity-list">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="activity-item-skeleton">
              <div className="skeleton skeleton-avatar"></div>
              <div className="activity-content">
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
              </div>
            </div>
          ))
        ) : data.length > 0 ? (
          data.map((activity, index) => (
            <div 
              key={activity.id || index} 
              className="activity-item"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div 
                className="activity-icon"
                style={{ background: getActivityColor(activity.type, activity.status) }}
              >
                {getActivityIcon(activity.type, activity.status)}
              </div>
              <div className="activity-content">
                <div className="activity-action">{activity.action}</div>
                <div className="activity-target">{activity.target}</div>
                <div className="activity-time">{formatTimeAgo(activity.timestamp)}</div>
              </div>
              <div className={`activity-status status-${activity.status}`}>
                {activity.status}
              </div>
            </div>
          ))
        ) : (
          <div className="activity-empty">
            <div className="empty-icon">📭</div>
            <div className="empty-text">No recent activity</div>
            <div className="empty-subtitle">
              Start using the Chrome extension to track your LinkedIn activity
            </div>
          </div>
        )}
      </div>

      {data.length > 0 && (
        <div className="activity-footer">
          <button className="btn btn-ghost btn-sm">
            View All Activity →
          </button>
        </div>
      )}

      <style jsx>{`
        .recent-activity {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
          height: fit-content;
        }

        .activity-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .activity-title {
          font-size: var(--text-xl);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          max-height: 400px;
          overflow-y: auto;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          transition: var(--transition-normal);
          animation: slideInUp 0.5s ease-out;
        }

        .activity-item:hover {
          background: var(--bg-elevated);
          transform: translateX(4px);
        }

        .activity-item-skeleton {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-lg);
          flex-shrink: 0;
          box-shadow: var(--shadow-sm);
        }

        .activity-content {
          flex: 1;
          min-width: 0;
        }

        .activity-action {
          font-size: var(--text-sm);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .activity-target {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          margin-bottom: var(--space-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .activity-time {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 500;
        }

        .activity-status {
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
          flex-shrink: 0;
        }

        .status-success {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success-500);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-pending {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning-500);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .status-completed {
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary-500);
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .activity-empty {
          text-align: center;
          padding: var(--space-8);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: var(--space-4);
        }

        .empty-text {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .empty-subtitle {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: var(--leading-relaxed);
        }

        .activity-footer {
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--border-primary);
          text-align: center;
        }

        @media (max-width: 768px) {
          .recent-activity {
            padding: var(--space-4);
          }

          .activity-item {
            padding: var(--space-2);
          }

          .activity-icon {
            width: 32px;
            height: 32px;
            font-size: var(--text-base);
          }

          .activity-target {
            white-space: normal;
            overflow: visible;
            text-overflow: unset;
          }
        }
      `}</style>
    </div>
  )
}

export default RecentActivity