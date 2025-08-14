import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiService } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import MetricCard from './MetricCard'
import QuickActions from './QuickActions'
import RecentActivity from './RecentActivity'
import InsightsPanel from './InsightsPanel'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const { showError } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load dashboard analytics data
      const response = await apiService.getDashboardAnalytics('30d')
      
      if (response.data && response.data.analytics) {
        const analytics = response.data.analytics
        
        // Transform analytics data to stats format
        const transformedStats = {
          totalConnections: 0, // We don't have connection data yet
          totalJobs: analytics.statusBreakdown ? Object.values(analytics.statusBreakdown).reduce((a, b) => a + b, 0) : 0,
          totalCompanies: analytics.companyStats ? analytics.companyStats.length : 0,
          responseRate: analytics.responseRate ? parseFloat(analytics.responseRate.responseRate) : 0,
          connectionsTrend: 0,
          jobsTrend: 5, // Mock trend
          companiesTrend: 2,
          responseRateTrend: 3
        }
        
        setStats(transformedStats)
        setRecentActivity(analytics.recentActivity || [])
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Don't show error for now, just use mock data
      setStats({
        totalConnections: 0,
        totalJobs: 0,
        totalCompanies: 0,
        responseRate: 0,
        connectionsTrend: 0,
        jobsTrend: 0,
        companiesTrend: 0,
        responseRateTrend: 0
      })
      setRecentActivity([])
    } finally {
      setLoading(false)
    }
  }

  const metrics = stats ? [
    {
      id: 'connections',
      title: 'LinkedIn Connections',
      value: stats.totalConnections || 0,
      subtitle: 'Total network size',
      icon: '🤝',
      trend: stats.connectionsTrend || 0,
      color: 'var(--gradient-secondary)',
      link: '/connections'
    },
    {
      id: 'jobs',
      title: 'Job Applications',
      value: stats.totalJobs || 0,
      subtitle: 'Applications tracked',
      icon: '💼',
      trend: stats.jobsTrend || 0,
      color: 'var(--gradient-success)',
      link: '/jobs'
    },
    {
      id: 'companies',
      title: 'Companies',
      value: stats.totalCompanies || 0,
      subtitle: 'Organizations tracked',
      icon: '🏢',
      trend: stats.companiesTrend || 0,
      color: 'var(--gradient-warning)',
      link: '/companies'
    },
    {
      id: 'response-rate',
      title: 'Response Rate',
      value: `${stats.responseRate || 0}%`,
      subtitle: 'Connection acceptance',
      icon: '📈',
      trend: stats.responseRateTrend || 0,
      color: 'var(--gradient-primary)',
      link: '/analytics'
    }
  ] : []

  return (
    <div className="dashboard">
      {/* Welcome Section */}
      <div className="dashboard-header animate-slide-in-up">
        <div className="welcome-content">
          <div className="welcome-text">
            <h1 className="welcome-title">
              Welcome back, <span className="highlight">Venkat</span>
            </h1>
            <p className="welcome-subtitle">
              Track your job applications, manage connections, and optimize your career search strategy.
            </p>
          </div>
          <div className="welcome-actions">
            <QuickActions onRefresh={loadDashboardData} />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        {loading ? (
          // Loading skeletons
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="metric-skeleton">
              <div className="skeleton skeleton-avatar"></div>
              <div className="skeleton skeleton-text"></div>
              <div className="skeleton skeleton-text"></div>
            </div>
          ))
        ) : (
          metrics.map((metric, index) => (
            <MetricCard
              key={metric.id}
              {...metric}
              animationDelay={index * 0.1}
            />
          ))
        )}
      </div>

      {/* Content Grid */}
      <div className="content-grid animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
        {/* Recent Activity */}
        <div className="content-section">
          <RecentActivity 
            activities={recentActivity} 
            loading={loading}
            onRefresh={loadDashboardData}
          />
        </div>

        {/* Insights Panel */}
        <div className="content-section">
          <InsightsPanel 
            stats={stats} 
            loading={loading}
          />
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="quick-nav animate-slide-in-up" style={{ animationDelay: '0.3s' }}>
        <div className="quick-nav-header">
          <h3 className="quick-nav-title">Quick Navigation</h3>
          <p className="quick-nav-subtitle">Jump to any section of your career tracker</p>
        </div>
        <div className="quick-nav-grid">
          <Link to="/connections" className="quick-nav-card">
            <div className="quick-nav-icon">🤝</div>
            <div className="quick-nav-content">
              <h4>Manage Connections</h4>
              <p>Track LinkedIn networking progress</p>
            </div>
            <div className="quick-nav-arrow">→</div>
          </Link>
          <Link to="/jobs" className="quick-nav-card">
            <div className="quick-nav-icon">💼</div>
            <div className="quick-nav-content">
              <h4>Job Applications</h4>
              <p>Monitor application status</p>
            </div>
            <div className="quick-nav-arrow">→</div>
          </Link>
          <Link to="/companies" className="quick-nav-card">
            <div className="quick-nav-icon">🏢</div>
            <div className="quick-nav-content">
              <h4>Company Research</h4>
              <p>Explore target organizations</p>
            </div>
            <div className="quick-nav-arrow">→</div>
          </Link>
          <Link to="/analytics" className="quick-nav-card">
            <div className="quick-nav-icon">📊</div>
            <div className="quick-nav-content">
              <h4>Performance Analytics</h4>
              <p>View detailed insights</p>
            </div>
            <div className="quick-nav-arrow">→</div>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: var(--space-8);
        }

        /* Dashboard Header */
        .dashboard-header {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-8);
          box-shadow: var(--shadow-lg);
          position: relative;
          overflow: hidden;
        }

        .dashboard-header::before {
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

        .welcome-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-6);
        }

        .welcome-text {
          flex: 1;
        }

        .welcome-title {
          font-size: var(--text-4xl);
          font-weight: 900;
          color: var(--text-primary);
          margin-bottom: var(--space-3);
          line-height: var(--leading-tight);
        }

        .highlight {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .welcome-subtitle {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        .welcome-actions {
          flex-shrink: 0;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-6);
        }

        .metric-skeleton {
          background: var(--bg-card);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-8);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          min-height: 200px;
          justify-content: center;
        }

        /* Content Grid */
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: var(--space-6);
        }

        .content-section {
          display: flex;
          flex-direction: column;
        }

        /* Quick Navigation */
        .quick-nav {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-8);
          box-shadow: var(--shadow-lg);
        }

        .quick-nav-header {
          text-align: center;
          margin-bottom: var(--space-8);
        }

        .quick-nav-title {
          font-size: var(--text-2xl);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-2);
        }

        .quick-nav-subtitle {
          font-size: var(--text-base);
          color: var(--text-muted);
          margin: 0;
        }

        .quick-nav-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--space-4);
        }

        .quick-nav-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-6);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-2xl);
          text-decoration: none;
          color: var(--text-primary);
          transition: var(--transition-normal);
          position: relative;
          overflow: hidden;
        }

        .quick-nav-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          transition: left var(--transition-slower);
        }

        .quick-nav-card:hover::before {
          left: 100%;
        }

        .quick-nav-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--border-accent);
          text-decoration: none;
          color: var(--text-primary);
        }

        .quick-nav-icon {
          font-size: var(--text-3xl);
          flex-shrink: 0;
        }

        .quick-nav-content {
          flex: 1;
        }

        .quick-nav-content h4 {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 var(--space-1) 0;
        }

        .quick-nav-content p {
          font-size: var(--text-sm);
          color: var(--text-muted);
          margin: 0;
        }

        .quick-nav-arrow {
          font-size: var(--text-xl);
          color: var(--text-muted);
          transition: var(--transition-normal);
        }

        .quick-nav-card:hover .quick-nav-arrow {
          color: var(--primary-500);
          transform: translateX(4px);
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Responsive Design */
        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 1fr;
            gap: var(--space-6);
          }
        }

        @media (max-width: 768px) {
          .dashboard {
            gap: var(--space-6);
          }

          .dashboard-header {
            padding: var(--space-6);
          }

          .welcome-content {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-4);
          }

          .welcome-title {
            font-size: var(--text-3xl);
          }

          .welcome-subtitle {
            font-size: var(--text-base);
          }

          .metrics-grid {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }

          .quick-nav {
            padding: var(--space-6);
          }

          .quick-nav-grid {
            grid-template-columns: 1fr;
            gap: var(--space-3);
          }

          .quick-nav-card {
            padding: var(--space-4);
          }
        }

        @media (max-width: 480px) {
          .dashboard-header {
            padding: var(--space-4);
          }

          .welcome-title {
            font-size: var(--text-2xl);
          }

          .quick-nav {
            padding: var(--space-4);
          }

          .quick-nav-header {
            margin-bottom: var(--space-6);
          }
        }
      `}</style>
    </div>
  )
}

export default Dashboard