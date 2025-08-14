import React from 'react'

const InsightsPanel = ({ stats, loading }) => {
  const generateInsights = (stats) => {
    if (!stats) return []

    const insights = []

    // Connection insights
    if (stats.totalConnections > 0) {
      const responseRate = stats.responseRate || 0
      if (responseRate > 70) {
        insights.push({
          type: 'success',
          icon: '🎯',
          title: 'Excellent Response Rate',
          message: `Your ${responseRate}% connection acceptance rate is above average. Keep using personalized messages!`,
          action: 'View Connection Strategy'
        })
      } else if (responseRate < 30) {
        insights.push({
          type: 'warning',
          icon: '💡',
          title: 'Improve Connection Messages',
          message: `Your ${responseRate}% response rate could be improved. Try using the AI message generator for more personalized requests.`,
          action: 'Generate Better Messages'
        })
      }
    }

    // Job application insights
    if (stats.totalJobs > 0) {
      const applicationRate = stats.applicationRate || 0
      if (applicationRate < 20) {
        insights.push({
          type: 'info',
          icon: '🚀',
          title: 'Apply to More Positions',
          message: `You've viewed ${stats.totalJobs} jobs but applied to ${Math.round(stats.totalJobs * applicationRate / 100)}. Consider applying to more positions that match your skills.`,
          action: 'View Job Recommendations'
        })
      }
    }

    // Activity insights
    const currentHour = new Date().getHours()
    if (currentHour >= 9 && currentHour <= 17) {
      insights.push({
        type: 'tip',
        icon: '⏰',
        title: 'Optimal Networking Time',
        message: 'You\'re active during business hours when professionals are most likely to respond to connection requests.',
        action: 'Schedule More Outreach'
      })
    }

    // AI-powered insights
    insights.push({
      type: 'ai',
      icon: '🤖',
      title: 'AI Recommendation',
      message: 'Based on your activity, focusing on ML Engineer roles at mid-size tech companies shows the highest success rate.',
      action: 'Explore AI Insights'
    })

    return insights.slice(0, 4) // Limit to 4 insights
  }

  const insights = generateInsights(stats)

  const getInsightStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          background: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          iconColor: 'var(--success-500)'
        }
      case 'warning':
        return {
          background: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          iconColor: 'var(--warning-500)'
        }
      case 'info':
        return {
          background: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)',
          iconColor: 'var(--primary-500)'
        }
      case 'ai':
        return {
          background: 'rgba(139, 92, 246, 0.1)',
          borderColor: 'rgba(139, 92, 246, 0.3)',
          iconColor: 'var(--secondary-500)'
        }
      default:
        return {
          background: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.3)',
          iconColor: 'var(--neutral-500)'
        }
    }
  }

  return (
    <div className="insights-panel">
      <div className="insights-header">
        <h3 className="insights-title">
          <span>💡</span>
          AI Insights
        </h3>
        <div className="insights-badge">
          <span className="badge-dot"></span>
          Live Analysis
        </div>
      </div>

      <div className="insights-list">
        {loading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="insight-skeleton">
              <div className="skeleton skeleton-avatar"></div>
              <div className="insight-content">
                <div className="skeleton skeleton-text"></div>
                <div className="skeleton skeleton-text" style={{ width: '80%' }}></div>
              </div>
            </div>
          ))
        ) : insights.length > 0 ? (
          insights.map((insight, index) => {
            const style = getInsightStyle(insight.type)
            return (
              <div 
                key={index} 
                className="insight-item"
                style={{ 
                  background: style.background,
                  borderColor: style.borderColor,
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div 
                  className="insight-icon"
                  style={{ color: style.iconColor }}
                >
                  {insight.icon}
                </div>
                <div className="insight-content">
                  <div className="insight-title">{insight.title}</div>
                  <div className="insight-message">{insight.message}</div>
                  <button className="insight-action">
                    {insight.action} →
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="insights-empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-text">Analyzing your data...</div>
            <div className="empty-subtitle">
              Insights will appear as you use the platform more
            </div>
          </div>
        )}
      </div>

      {insights.length > 0 && (
        <div className="insights-footer">
          <button className="btn btn-primary btn-sm">
            🧠 View All AI Insights
          </button>
        </div>
      )}

      <style jsx>{`
        .insights-panel {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
          height: fit-content;
        }

        .insights-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .insights-title {
          font-size: var(--text-xl);
          font-weight: 800;
          background: var(--gradient-secondary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .insights-badge {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-1) var(--space-3);
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 700;
          color: var(--secondary-500);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          background: var(--secondary-500);
          border-radius: var(--radius-full);
          animation: pulse 2s infinite;
        }

        .insights-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          max-height: 400px;
          overflow-y: auto;
        }

        .insight-item {
          display: flex;
          gap: var(--space-3);
          padding: var(--space-4);
          border: 1px solid;
          border-radius: var(--radius-2xl);
          transition: var(--transition-normal);
          animation: slideInUp 0.5s ease-out;
        }

        .insight-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .insight-skeleton {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
        }

        .insight-icon {
          font-size: var(--text-2xl);
          flex-shrink: 0;
        }

        .insight-content {
          flex: 1;
          min-width: 0;
        }

        .insight-title {
          font-size: var(--text-sm);
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .insight-message {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-3);
        }

        .insight-action {
          background: none;
          border: none;
          color: var(--primary-500);
          font-size: var(--text-xs);
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition-normal);
          padding: 0;
        }

        .insight-action:hover {
          color: var(--primary-400);
          transform: translateX(2px);
        }

        .insights-empty {
          text-align: center;
          padding: var(--space-8);
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: var(--space-4);
        }

        .empty-text {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
        }

        .empty-subtitle {
          font-size: var(--text-sm);
          color: var(--text-muted);
          line-height: var(--leading-relaxed);
        }

        .insights-footer {
          margin-top: var(--space-4);
          padding-top: var(--space-4);
          border-top: 1px solid var(--border-primary);
          text-align: center;
        }

        @media (max-width: 768px) {
          .insights-panel {
            padding: var(--space-4);
          }

          .insights-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-3);
          }

          .insight-item {
            padding: var(--space-3);
          }

          .insight-icon {
            font-size: var(--text-xl);
          }
        }
      `}</style>
    </div>
  )
}

export default InsightsPanel