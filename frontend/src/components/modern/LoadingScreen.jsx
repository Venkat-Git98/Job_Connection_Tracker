import React, { useState, useEffect } from 'react'

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0)
  const [loadingText, setLoadingText] = useState('Initializing...')

  const loadingSteps = [
    { progress: 20, text: 'Loading AI models...' },
    { progress: 40, text: 'Connecting to LinkedIn API...' },
    { progress: 60, text: 'Fetching your data...' },
    { progress: 80, text: 'Analyzing connections...' },
    { progress: 100, text: 'Ready to launch!' }
  ]

  useEffect(() => {
    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep]
        setProgress(step.progress)
        setLoadingText(step.text)
        currentStep++
      } else {
        clearInterval(interval)
      }
    }, 400)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="loading-screen">
      <div className="loading-content animate-fade-in">
        {/* Logo */}
        <div className="loading-logo animate-float">
          <div className="logo-icon">
            🚀
          </div>
          <div className="logo-glow"></div>
        </div>

        {/* Brand */}
        <div className="loading-brand">
          <h1 className="brand-title">LinkedIn Job Tracker</h1>
          <p className="brand-subtitle">AI-Powered Career Intelligence</p>
        </div>

        {/* Progress */}
        <div className="loading-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{loadingText}</div>
          <div className="progress-percentage">{progress}%</div>
        </div>

        {/* Features */}
        <div className="loading-features">
          <div className="feature-item animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
            <span className="feature-icon">🤝</span>
            <span className="feature-text">Smart Connection Tracking</span>
          </div>
          <div className="feature-item animate-slide-in-up" style={{ animationDelay: '0.7s' }}>
            <span className="feature-icon">💼</span>
            <span className="feature-text">Job Application Management</span>
          </div>
          <div className="feature-item animate-slide-in-up" style={{ animationDelay: '0.9s' }}>
            <span className="feature-icon">🧠</span>
            <span className="feature-text">AI-Generated Messages</span>
          </div>
        </div>

        {/* Footer */}
        <div className="loading-footer">
          <div className="tech-badges">
            <span className="tech-badge">React</span>
            <span className="tech-badge">Node.js</span>
            <span className="tech-badge">Gemini AI</span>
            <span className="tech-badge">PostgreSQL</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .loading-screen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, var(--dark-bg-primary) 0%, var(--dark-bg-secondary) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          overflow: hidden;
        }

        .loading-screen::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--gradient-mesh);
          animation: meshShift 30s ease-in-out infinite;
        }

        .loading-content {
          text-align: center;
          position: relative;
          z-index: 1;
          max-width: 500px;
          padding: var(--space-8);
        }

        .loading-logo {
          position: relative;
          margin-bottom: var(--space-8);
          display: inline-block;
        }

        .logo-icon {
          width: 120px;
          height: 120px;
          background: var(--gradient-primary);
          border-radius: var(--radius-3xl);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
          position: relative;
          z-index: 2;
          box-shadow: var(--shadow-2xl);
        }

        .logo-glow {
          position: absolute;
          top: -20px;
          left: -20px;
          right: -20px;
          bottom: -20px;
          background: var(--gradient-primary);
          border-radius: var(--radius-3xl);
          opacity: 0.3;
          filter: blur(20px);
          animation: pulse 3s ease-in-out infinite;
        }

        .loading-brand {
          margin-bottom: var(--space-10);
        }

        .brand-title {
          font-size: var(--text-4xl);
          font-weight: 900;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-2);
          letter-spacing: var(--tracking-tight);
        }

        .brand-subtitle {
          font-size: var(--text-lg);
          color: var(--dark-text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
        }

        .loading-progress {
          margin-bottom: var(--space-12);
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--space-4);
          position: relative;
        }

        .progress-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: var(--radius-full);
          transition: width 0.5s ease;
          position: relative;
          overflow: hidden;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          animation: shimmer 2s infinite;
        }

        .progress-text {
          font-size: var(--text-sm);
          color: var(--dark-text-secondary);
          font-weight: 600;
          margin-bottom: var(--space-2);
        }

        .progress-percentage {
          font-size: var(--text-2xl);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .loading-features {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
          margin-bottom: var(--space-10);
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: var(--radius-2xl);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .feature-icon {
          font-size: var(--text-xl);
        }

        .feature-text {
          font-size: var(--text-sm);
          color: var(--dark-text-secondary);
          font-weight: 600;
        }

        .loading-footer {
          opacity: 0.8;
        }

        .tech-badges {
          display: flex;
          justify-content: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .tech-badge {
          padding: var(--space-1) var(--space-3);
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          color: var(--dark-text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
        }

        @media (max-width: 768px) {
          .loading-content {
            padding: var(--space-6);
          }

          .logo-icon {
            width: 80px;
            height: 80px;
            font-size: 40px;
          }

          .brand-title {
            font-size: var(--text-3xl);
          }

          .brand-subtitle {
            font-size: var(--text-base);
          }

          .loading-features {
            gap: var(--space-2);
          }

          .feature-item {
            padding: var(--space-2) var(--space-3);
          }

          .feature-text {
            font-size: var(--text-xs);
          }
        }
      `}</style>
    </div>
  )
}

export default LoadingScreen