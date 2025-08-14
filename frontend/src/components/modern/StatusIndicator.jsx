import React, { useState, useEffect } from 'react'

const StatusIndicator = () => {
  const [status, setStatus] = useState('checking')
  const [lastChecked, setLastChecked] = useState(null)

  useEffect(() => {
    checkAPIStatus()
    const interval = setInterval(checkAPIStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkAPIStatus = async () => {
    try {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        timeout: 5000
      })
      
      if (response.ok) {
        setStatus('online')
      } else {
        setStatus('error')
      }
    } catch (error) {
      setStatus('offline')
    }
    
    setLastChecked(new Date())
  }

  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'var(--success-500)',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
          text: 'API Online',
          icon: '✅',
          pulse: true
        }
      case 'offline':
        return {
          color: 'var(--danger-500)',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          text: 'API Offline',
          icon: '❌',
          pulse: false
        }
      case 'error':
        return {
          color: 'var(--warning-500)',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          text: 'API Error',
          icon: '⚠️',
          pulse: false
        }
      default:
        return {
          color: 'var(--neutral-500)',
          bgColor: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.3)',
          text: 'Checking...',
          icon: '🔄',
          pulse: false
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div className="status-indicator" onClick={checkAPIStatus}>
      <div className="status-dot">
        <div className={`status-pulse ${config.pulse ? 'status-pulse-active' : ''}`}></div>
      </div>
      <div className="status-content">
        <span className="status-text">{config.text}</span>
        {lastChecked && (
          <span className="status-time">
            {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      <style jsx>{`
        .status-indicator {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: ${config.bgColor};
          border: 1px solid ${config.borderColor};
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: var(--transition-normal);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          user-select: none;
        }

        .status-indicator:hover {
          transform: scale(1.02);
          box-shadow: var(--shadow-sm);
        }

        .status-dot {
          position: relative;
          width: 8px;
          height: 8px;
          background: ${config.color};
          border-radius: var(--radius-full);
          flex-shrink: 0;
        }

        .status-pulse {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: ${config.color};
          border-radius: var(--radius-full);
          opacity: 0;
        }

        .status-pulse-active {
          animation: statusPulse 2s ease-in-out infinite;
        }

        .status-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .status-text {
          font-size: var(--text-xs);
          font-weight: 700;
          color: ${config.color};
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
          line-height: 1;
        }

        .status-time {
          font-size: 10px;
          color: var(--text-muted);
          font-weight: 500;
          line-height: 1;
          margin-top: 1px;
        }

        @keyframes statusPulse {
          0%, 100% {
            opacity: 0;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.5);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .status-indicator {
            padding: var(--space-1-5) var(--space-2);
          }

          .status-content {
            display: none;
          }

          .status-dot {
            width: 10px;
            height: 10px;
          }
        }
      `}</style>
    </div>
  )
}

export default StatusIndicator