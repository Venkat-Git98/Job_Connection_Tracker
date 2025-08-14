import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'
import StatusIndicator from './StatusIndicator'

const Layout = ({ children }) => {
  const location = useLocation()
  const { theme } = useTheme()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: '🏠',
      description: 'Overview & Insights',
      gradient: 'var(--gradient-primary)'
    },
    { 
      path: '/connections', 
      label: 'Connections', 
      icon: '🤝',
      description: 'LinkedIn Network',
      gradient: 'var(--gradient-secondary)'
    },
    { 
      path: '/jobs', 
      label: 'Jobs', 
      icon: '💼',
      description: 'Applications & Tracking',
      gradient: 'var(--gradient-success)'
    },
    { 
      path: '/companies', 
      label: 'Companies', 
      icon: '🏢',
      description: 'Organizations & People',
      gradient: 'var(--gradient-warning)'
    },
    { 
      path: '/analytics', 
      label: 'Analytics', 
      icon: '📊',
      description: 'Performance Metrics',
      gradient: 'var(--gradient-danger)'
    },
  ]

  return (
    <div className="layout">
      {/* Header */}
      <header className={`header ${isScrolled ? 'header-scrolled' : ''}`}>
        <div className="header-container">
          {/* Brand */}
          <div className="header-brand">
            <div className="brand-logo animate-float">
              <div className="logo-icon">🚀</div>
              <div className="logo-pulse"></div>
            </div>
            <div className="brand-content">
              <h1 className="brand-title">LinkedIn Job Tracker</h1>
              <p className="brand-subtitle">AI-Powered Career Intelligence</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="nav-desktop">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                  style={{
                    background: isActive ? item.gradient : 'transparent'
                  }}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                  {isActive && <div className="nav-indicator"></div>}
                </Link>
              )
            })}
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            <StatusIndicator />
            <ThemeToggle />
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className={`nav-mobile ${isMobileMenuOpen ? 'nav-mobile-open' : ''}`}>
          <div className="nav-mobile-content">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-mobile-link ${isActive ? 'nav-mobile-link-active' : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <div className="nav-content">
                    <span className="nav-label">{item.label}</span>
                    <span className="nav-description">{item.description}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="main-container">
          <div className="content animate-fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">🚀</div>
              <div className="footer-info">
                <p className="footer-title">LinkedIn Job Tracker</p>
                <p className="footer-subtitle">© 2024 - AI-Powered Career Management</p>
              </div>
            </div>
            <div className="footer-badges">
              <span className="footer-badge">React + Vite</span>
              <span className="footer-badge">Node.js + Express</span>
              <span className="footer-badge">Gemini AI</span>
              <span className="footer-badge">PostgreSQL</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        /* Header Styles */
        .header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--bg-glass);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-primary);
          transition: var(--transition-normal);
        }

        .header-scrolled {
          box-shadow: var(--shadow-xl);
          border-bottom-color: var(--border-accent);
        }

        .header-container {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: var(--space-4) var(--space-6);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-6);
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          flex-shrink: 0;
        }

        .brand-logo {
          position: relative;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-icon {
          width: 56px;
          height: 56px;
          background: var(--gradient-primary);
          border-radius: var(--radius-2xl);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: var(--shadow-lg);
          position: relative;
          z-index: 2;
        }

        .logo-pulse {
          position: absolute;
          top: -4px;
          left: -4px;
          right: -4px;
          bottom: -4px;
          background: var(--gradient-primary);
          border-radius: var(--radius-2xl);
          opacity: 0.3;
          animation: pulse 3s ease-in-out infinite;
        }

        .brand-content {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-size: var(--text-2xl);
          font-weight: 900;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: var(--leading-tight);
          margin: 0;
          letter-spacing: var(--tracking-tight);
        }

        .brand-subtitle {
          font-size: var(--text-sm);
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
          margin: 0;
        }

        /* Desktop Navigation */
        .nav-desktop {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex: 1;
          justify-content: center;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-2xl);
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: var(--text-sm);
          transition: var(--transition-normal);
          position: relative;
          overflow: hidden;
          border: 1px solid transparent;
        }

        .nav-link::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slower);
        }

        .nav-link:hover::before {
          left: 100%;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: var(--bg-glass-light);
          text-decoration: none;
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .nav-link-active {
          color: white;
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: var(--shadow-lg);
        }

        .nav-link-active:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-xl);
        }

        .nav-icon {
          font-size: var(--text-xl);
          flex-shrink: 0;
        }

        .nav-content {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .nav-label {
          font-weight: 700;
          line-height: 1;
        }

        .nav-description {
          font-size: var(--text-xs);
          opacity: 0.8;
          font-weight: 500;
          line-height: 1;
          margin-top: 2px;
        }

        .nav-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: var(--radius-full);
        }

        /* Header Actions */
        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-shrink: 0;
        }

        .mobile-menu-toggle {
          display: none;
          flex-direction: column;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--space-2);
          border-radius: var(--radius-lg);
          transition: var(--transition-normal);
        }

        .mobile-menu-toggle span {
          width: 24px;
          height: 2px;
          background: var(--text-primary);
          border-radius: var(--radius-full);
          transition: var(--transition-normal);
        }

        .mobile-menu-toggle:hover {
          background: var(--bg-glass-light);
        }

        /* Mobile Navigation */
        .nav-mobile {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-primary);
          box-shadow: var(--shadow-xl);
          transform: translateY(-100%);
          opacity: 0;
          transition: var(--transition-normal);
        }

        .nav-mobile-open {
          transform: translateY(0);
          opacity: 1;
        }

        .nav-mobile-content {
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .nav-mobile-link {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          border-radius: var(--radius-2xl);
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 600;
          transition: var(--transition-normal);
          border: 1px solid transparent;
        }

        .nav-mobile-link:hover {
          color: var(--text-primary);
          background: var(--bg-glass-light);
          text-decoration: none;
        }

        .nav-mobile-link-active {
          color: var(--primary-500);
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.3);
        }

        /* Main Content */
        .main {
          flex: 1;
          padding: var(--space-8) 0;
        }

        .main-container {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: 0 var(--space-6);
        }

        .content {
          min-height: 60vh;
        }

        /* Footer */
        .footer {
          background: var(--bg-glass);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid var(--border-primary);
          margin-top: auto;
        }

        .footer-container {
          max-width: var(--content-max-width);
          margin: 0 auto;
          padding: var(--space-8) var(--space-6);
        }

        .footer-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-6);
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .footer-logo {
          width: 40px;
          height: 40px;
          background: var(--gradient-primary);
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .footer-info {
          display: flex;
          flex-direction: column;
        }

        .footer-title {
          font-size: var(--text-base);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
        }

        .footer-subtitle {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 0;
        }

        .footer-badges {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .footer-badge {
          padding: var(--space-1) var(--space-3);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: var(--tracking-wide);
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
          .nav-desktop {
            gap: var(--space-1);
          }

          .nav-link {
            padding: var(--space-2) var(--space-3);
          }

          .nav-description {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .header-container {
            padding: var(--space-3) var(--space-4);
          }

          .nav-desktop {
            display: none;
          }

          .nav-mobile {
            display: block;
          }

          .mobile-menu-toggle {
            display: flex;
          }

          .brand-title {
            font-size: var(--text-xl);
          }

          .brand-subtitle {
            font-size: var(--text-xs);
          }

          .main-container {
            padding: 0 var(--space-4);
          }

          .footer-content {
            flex-direction: column;
            text-align: center;
            gap: var(--space-4);
          }

          .footer-badges {
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .header-container {
            padding: var(--space-2) var(--space-3);
          }

          .brand-logo {
            width: 48px;
            height: 48px;
          }

          .logo-icon {
            width: 48px;
            height: 48px;
            font-size: 24px;
          }

          .brand-title {
            font-size: var(--text-lg);
          }

          .main-container {
            padding: 0 var(--space-3);
          }

          .main {
            padding: var(--space-6) 0;
          }
        }
      `}</style>
    </div>
  )
}

export default Layout