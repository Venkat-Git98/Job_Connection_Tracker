import React, { useState } from 'react'
import { useToast } from '../../contexts/ToastContext'

const QuickActions = ({ onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { showSuccess, showInfo } = useToast()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
      showSuccess('Dashboard data refreshed successfully')
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExtensionGuide = () => {
    showInfo('Chrome extension guide opened in new tab')
    window.open('/extension-guide', '_blank')
  }

  const handleAPIStatus = () => {
    window.open('http://localhost:3001/health', '_blank')
  }

  return (
    <div className="quick-actions">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="btn btn-primary"
        title="Refresh all dashboard data"
      >
        {isRefreshing ? (
          <>
            <span className="loading loading-sm"></span>
            Refreshing...
          </>
        ) : (
          <>
            🔄 Refresh Data
          </>
        )}
      </button>

      <button
        onClick={handleExtensionGuide}
        className="btn btn-secondary"
        title="Learn how to use the Chrome extension"
      >
        🧩 Extension Guide
      </button>

      <button
        onClick={handleAPIStatus}
        className="btn btn-ghost"
        title="Check API health status"
      >
        📊 API Status
      </button>

      <style jsx>{`
        .quick-actions {
          display: flex;
          gap: var(--space-3);
          align-items: center;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .quick-actions {
            flex-direction: column;
            width: 100%;
          }

          .quick-actions .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default QuickActions