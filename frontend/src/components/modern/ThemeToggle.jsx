import React, { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

const ThemeToggle = () => {
  const { theme, toggleTheme, isDark } = useTheme()
  const [isAnimating, setIsAnimating] = useState(false)

  const handleToggle = () => {
    setIsAnimating(true)
    toggleTheme()
    setTimeout(() => setIsAnimating(false), 300)
  }

  return (
    <button
      onClick={handleToggle}
      className={`theme-toggle ${isAnimating ? 'theme-toggle-animating' : ''}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <div className="theme-toggle-track">
        <div className="theme-toggle-thumb">
          <span className="theme-icon">
            {isDark ? '🌙' : '☀️'}
          </span>
        </div>
        <div className="theme-toggle-icons">
          <span className="theme-icon-light">☀️</span>
          <span className="theme-icon-dark">🌙</span>
        </div>
      </div>

      <style jsx>{`
        .theme-toggle {
          position: relative;
          width: 64px;
          height: 32px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          border-radius: var(--radius-full);
          transition: var(--transition-normal);
        }

        .theme-toggle:hover {
          transform: scale(1.05);
        }

        .theme-toggle:focus-visible {
          outline: 2px solid var(--primary-500);
          outline-offset: 2px;
        }

        .theme-toggle-track {
          width: 100%;
          height: 100%;
          background: var(--bg-glass);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-full);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: var(--shadow-sm);
          transition: var(--transition-normal);
        }

        .theme-toggle:hover .theme-toggle-track {
          border-color: var(--border-accent);
          box-shadow: var(--shadow-md);
        }

        .theme-toggle-thumb {
          position: absolute;
          top: 2px;
          left: ${isDark ? '34px' : '2px'};
          width: 28px;
          height: 28px;
          background: var(--gradient-primary);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-normal);
          box-shadow: var(--shadow-md);
          z-index: 2;
        }

        .theme-toggle-animating .theme-toggle-thumb {
          animation: thumbBounce 0.3s ease;
        }

        .theme-icon {
          font-size: 14px;
          transition: var(--transition-normal);
        }

        .theme-toggle-icons {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--space-2);
          z-index: 1;
        }

        .theme-icon-light,
        .theme-icon-dark {
          font-size: 12px;
          opacity: 0.5;
          transition: var(--transition-normal);
        }

        .theme-icon-light {
          opacity: ${isDark ? '0.3' : '0.7'};
        }

        .theme-icon-dark {
          opacity: ${isDark ? '0.7' : '0.3'};
        }

        @keyframes thumbBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .theme-toggle {
            width: 56px;
            height: 28px;
          }

          .theme-toggle-thumb {
            width: 24px;
            height: 24px;
            left: ${isDark ? '30px' : '2px'};
          }

          .theme-icon {
            font-size: 12px;
          }

          .theme-icon-light,
          .theme-icon-dark {
            font-size: 10px;
          }
        }
      `}</style>
    </button>
  )
}

export default ThemeToggle