import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import ThemeToggle from './ThemeToggle'

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.header')) {
        setIsMobileMenuOpen(false)
      }
    }
    
    if (isMobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      gradient: 'var(--gradient-primary)'
    },
    { 
      path: '/connections', 
      label: 'Connections',
      gradient: 'var(--gradient-secondary)'
    },
    { 
      path: '/jobs', 
      label: 'Jobs',
      gradient: 'var(--gradient-success)'
    },
    { 
      path: '/companies', 
      label: 'Companies',
      gradient: 'var(--gradient-warning)'
    },
    { 
      path: '/analytics', 
      label: 'Analytics',
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
            <div className="brand-logo">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="url(#gradient)"/>
                <path d="M12 28V16H16V28H12ZM14 14C13.2 14 12.5 13.7 12 13.2C11.5 12.7 11.2 12 11.2 11.2C11.2 10.4 11.5 9.7 12 9.2C12.5 8.7 13.2 8.4 14 8.4C14.8 8.4 15.5 8.7 16 9.2C16.5 9.7 16.8 10.4 16.8 11.2C16.8 12 16.5 12.7 16 13.2C15.5 13.7 14.8 14 14 14ZM20 28V21.5C20 20.1 20.6 19 22 19C23.4 19 24 20.1 24 21.5V28H28V20.5C28 17.5 26.5 16 24 16C22.5 16 21.2 16.8 20.5 18H20V16H16V28H20Z" fill="white"/>
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#8b5cf6"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="brand-content">
              <h1 className="brand-title">CareerTracker</h1>
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
                  <span className="nav-label">{item.label}</span>
                  {isActive && <div className="nav-indicator"></div>}
                </Link>
              )
            })}
          </nav>

          {/* Header Actions */}
          <div className="header-actions">
            <ThemeToggle />
            <button
              className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        {isMobileMenuOpen && <div className="nav-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />}
        
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
                  <span className="nav-label">{item.label}</span>
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
          z-index: 100;
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
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-content {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-size: var(--text-xl);
          font-weight: 700;
          color: var(--text-primary);
          line-height: var(--leading-tight);
          margin: 0;
          letter-spacing: var(--tracking-tight);
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
          padding: var(--space-3) var(--space-5);
          border-radius: var(--radius-xl);
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

        .nav-label {
          font-weight: 700;
          line-height: 1;
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
          transform-origin: center;
        }

        .mobile-menu-toggle.open span:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
        }

        .mobile-menu-toggle.open span:nth-child(2) {
          opacity: 0;
        }

        .mobile-menu-toggle.open span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }

        .mobile-menu-toggle:hover {
          background: var(--bg-glass-light);
        }

        /* Mobile Navigation Overlay */
        .nav-mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 98;
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
          z-index: 99;
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
          padding: var(--space-4);
          border-radius: var(--radius-xl);
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

        @media (max-width: 480px) {
          .header-container {
            padding: var(--space-2) var(--space-3);
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