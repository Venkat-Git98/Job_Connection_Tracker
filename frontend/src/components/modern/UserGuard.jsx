import React from 'react'
import { useUser } from '../../contexts/UserContext'
import UserSelector from './UserSelector'
import LoadingScreen from './LoadingScreen'

const UserGuard = ({ children }) => {
  const { currentUser, loading, error } = useUser()

  if (loading) {
    return <LoadingScreen message="Loading user profiles..." />
  }

  if (error) {
    return (
      <div className="user-guard-error">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>User Management Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-retry"
          >
            🔄 Retry
          </button>
        </div>

        <style jsx>{`
          .user-guard-error {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
            padding: var(--space-6);
          }

          .error-content {
            text-align: center;
            max-width: 500px;
            padding: var(--space-8);
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-3xl);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
          }

          .error-icon {
            font-size: 4rem;
            margin-bottom: var(--space-4);
          }

          .error-content h2 {
            font-size: var(--text-2xl);
            font-weight: 800;
            color: var(--text-primary);
            margin-bottom: var(--space-3);
          }

          .error-content p {
            color: var(--text-muted);
            margin-bottom: var(--space-6);
            line-height: var(--leading-relaxed);
          }

          .btn-retry {
            padding: var(--space-4) var(--space-6);
            border: none;
            border-radius: var(--radius-xl);
            background: var(--gradient-primary);
            color: white;
            font-size: var(--text-base);
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition-normal);
          }

          .btn-retry:hover {
            transform: translateY(-2px);
            box-shadow: var(--shadow-lg);
          }
        `}</style>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="user-guard-selection">
        <div className="selection-container">
          <div className="welcome-header">
            <div className="welcome-icon">🚀</div>
            <h1>Welcome to CareerTracker</h1>
            <p>Professional Job Search Management</p>
          </div>
          
          <UserSelector />
          
          <div className="welcome-footer">
            <p>Track LinkedIn connections, job applications, and networking opportunities with AI-powered insights.</p>
          </div>
        </div>

        <style jsx>{`
          .user-guard-selection {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
            padding: var(--space-6);
          }

          .selection-container {
            max-width: 600px;
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: var(--space-8);
          }

          .welcome-header {
            text-align: center;
            padding: var(--space-8);
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-3xl);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            position: relative;
            overflow: hidden;
          }

          .welcome-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: var(--gradient-rainbow);
            background-size: 300% 100%;
            animation: gradient 3s ease infinite;
          }

          .welcome-icon {
            font-size: 4rem;
            margin-bottom: var(--space-4);
            animation: float 3s ease-in-out infinite;
          }

          .welcome-header h1 {
            font-size: var(--text-4xl);
            font-weight: 900;
            background: var(--gradient-primary);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: var(--space-3);
            line-height: var(--leading-tight);
          }

          .welcome-header p {
            font-size: var(--text-lg);
            color: var(--text-secondary);
            margin: 0;
            font-weight: 500;
          }

          .welcome-footer {
            text-align: center;
            padding: var(--space-6);
            background: var(--bg-glass-light);
            border: 1px solid var(--border-primary);
            border-radius: var(--radius-2xl);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
          }

          .welcome-footer p {
            color: var(--text-muted);
            font-size: var(--text-base);
            line-height: var(--leading-relaxed);
            margin: 0;
          }

          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }

          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          @media (max-width: 768px) {
            .user-guard-selection {
              padding: var(--space-4);
            }

            .welcome-header {
              padding: var(--space-6);
            }

            .welcome-header h1 {
              font-size: var(--text-3xl);
            }

            .welcome-icon {
              font-size: 3rem;
            }
          }
        `}</style>
      </div>
    )
  }

  return children
}

export default UserGuard