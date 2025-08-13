import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from './shared/ThemeToggle';

const Layout = ({ children }) => {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: '🏠',
      gradient: 'var(--accent-gradient)'
    },
    { 
      path: '/connections', 
      label: 'LinkedIn Connections', 
      icon: '🤝',
      gradient: 'var(--primary-gradient)'
    },
    { 
      path: '/jobs', 
      label: 'Jobs Applied', 
      icon: '💼',
      gradient: 'var(--secondary-gradient)'
    },
    { 
      path: '/companies', 
      label: 'Companies & People', 
      icon: '🏢',
      gradient: 'var(--success-gradient)'
    },
    { 
      path: '/emails', 
      label: 'Analytics', 
      icon: '📊',
      gradient: 'var(--warning-gradient)'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className={`glass sticky top-0 z-50 transition-all duration-300 ${
        isScrolled ? 'shadow-xl' : 'shadow-md'
      }`} style={{
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="container">
          <div className="d-flex items-center justify-between py-5">
            <div className="d-flex items-center gap-4">
              <div className="relative">
                <div style={{
                  width: '56px',
                  height: '56px',
                  background: 'var(--primary-gradient)',
                  borderRadius: 'var(--border-radius-lg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  boxShadow: 'var(--shadow-glow)',
                  animation: 'float 3s ease-in-out infinite'
                }}>
                  🚀
                </div>
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '16px',
                  height: '16px',
                  background: 'var(--success-color)',
                  borderRadius: '50%',
                  border: '2px solid var(--bg-primary)',
                  animation: 'pulse 2s infinite'
                }} />
              </div>
              <div>
                <h1 className="text-3xl font-black leading-tight m-0" style={{ 
                  background: 'var(--primary-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em'
                }}>
                  LinkedIn Job Tracker
                </h1>
                <p className="text-sm text-muted font-semibold m-0 mt-1" style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  AI-Powered Career Intelligence
                </p>
              </div>
            </div>
            <div className="d-flex gap-3 items-center">
              <ThemeToggle />
              <div className="glass-light rounded-full px-4 py-2 d-flex items-center gap-2">
                <div style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--success-color)',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite',
                  boxShadow: '0 0 8px var(--success-color)'
                }} />
                <span className="text-xs font-bold" style={{
                  color: 'var(--success-color)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  LIVE
                </span>
              </div>
              <a 
                href="http://localhost:3001/health" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
                style={{ 
                  borderRadius: 'var(--border-radius-full)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: 'var(--text-xs)'
                }}
              >
                API Status
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation (non-sticky to prevent overlap) */}
      <nav className="glass transition-all duration-300" style={{
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div className="container">
          <div className="d-flex">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive ? 'active' : ''}`}
                  style={{
                    padding: 'var(--space-5) var(--space-8)',
                    textDecoration: 'none',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    background: isActive ? item.gradient : 'transparent',
                    borderRadius: isActive ? 'var(--border-radius) var(--border-radius) 0 0' : '0',
                    fontWeight: '700',
                    fontSize: 'var(--text-sm)',
                    transition: 'all var(--transition-normal)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    position: 'relative',
                    overflow: 'hidden',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: isActive ? '0 var(--space-1)' : '0',
                    boxShadow: isActive ? 'var(--shadow-lg)' : 'none',
                    border: isActive ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.background = 'var(--bg-elevated)';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.background = 'transparent';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  {item.label}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'rgba(255, 255, 255, 0.6)',
                      borderRadius: '2px'
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-10 min-h-screen relative">
        <div className="container">
          <div className="fade-in">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="glass border-t mt-auto" style={{
        borderColor: 'var(--border-color)'
      }}>
        <div className="container py-8">
          <div className="d-flex justify-between items-center">
            <div className="d-flex items-center gap-4">
              <div style={{
                width: '32px',
                height: '32px',
                background: 'var(--primary-gradient)',
                borderRadius: 'var(--border-radius)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px'
              }}>
                🚀
              </div>
              <div>
                <p className="text-sm text-secondary font-semibold m-0">
                  © 2024 LinkedIn Job Tracker
                </p>
                <p className="text-xs text-muted m-0">
                  AI-Powered Career Management Platform
                </p>
              </div>
            </div>
            <div className="d-flex gap-3">
              <span className="glass-light rounded-full px-3 py-1 text-xs font-bold" style={{
                color: 'var(--primary-color)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                React + Node.js
              </span>
              <span className="glass-light rounded-full px-3 py-1 text-xs font-bold" style={{
                color: 'var(--success-color)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                AI-Powered
              </span>
              <span className="glass-light rounded-full px-3 py-1 text-xs font-bold" style={{
                color: 'var(--warning-color)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Real-time
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;