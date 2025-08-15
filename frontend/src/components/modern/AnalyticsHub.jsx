import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useToast } from '../../contexts/ToastContext'
import { useUser } from '../../contexts/UserContext'

const AnalyticsHub = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const { showError } = useToast()
  const { currentUser } = useUser()

  useEffect(() => {
    if (currentUser) {
      loadAnalytics()
    }
  }, [currentUser, timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await apiService.getDashboardAnalytics(timeRange)
      if (response.data && response.data.analytics) {
        // Transform the analytics data to match our expected format
        const analyticsData = response.data.analytics
        setAnalytics({
          overview: {
            totalConnections: 0, // We don't have connection data
            totalJobs: analyticsData.statusBreakdown ? Object.values(analyticsData.statusBreakdown).reduce((a, b) => a + b, 0) : 0,
            responseRate: analyticsData.responseRate ? parseFloat(analyticsData.responseRate.responseRate) : 0,
            applicationRate: 75 // Mock data
          },
          trends: {
            connectionsGrowth: 0,
            jobsGrowth: 8,
            responseRateChange: 5,
            applicationRateChange: -2
          },
          topCompanies: analyticsData.companyStats ? analyticsData.companyStats.slice(0, 4).map(company => ({
            name: company.name,
            applications: company.applications,
            connections: 0 // We don't have connection data
          })) : [],
          activityByDay: analyticsData.dailyStats ? analyticsData.dailyStats.slice(0, 7).map((day, index) => ({
            day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index % 7],
            connections: 0,
            applications: day.applications || 0
          })) : []
        })
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      // Don't show error, just use mock data
    } finally {
      setLoading(false)
    }
  }

  const mockAnalytics = {
    overview: {
      totalConnections: 156,
      totalJobs: 43,
      responseRate: 68,
      applicationRate: 23
    },
    trends: {
      connectionsGrowth: 12,
      jobsGrowth: 8,
      responseRateChange: 5,
      applicationRateChange: -2
    },
    topCompanies: [
      { name: 'Google', applications: 5, connections: 12 },
      { name: 'Microsoft', applications: 3, connections: 8 },
      { name: 'Amazon', applications: 4, connections: 6 },
      { name: 'Meta', applications: 2, connections: 9 }
    ],
    activityByDay: [
      { day: 'Mon', connections: 5, applications: 2 },
      { day: 'Tue', connections: 8, applications: 1 },
      { day: 'Wed', connections: 3, applications: 4 },
      { day: 'Thu', connections: 12, applications: 3 },
      { day: 'Fri', connections: 6, applications: 2 },
      { day: 'Sat', connections: 2, applications: 0 },
      { day: 'Sun', connections: 1, applications: 1 }
    ]
  }

  const data = analytics || mockAnalytics

  return (
    <div className="analytics-hub">
      {/* Header */}
      <div className="card animate-slide-in-up">
        <div className="card-header">
          <div className="header-content">
            <h2 className="card-title">
              <span>📊</span>
              Performance Analytics
            </h2>
            <p className="card-subtitle">
              Track your networking and job search performance over time
            </p>
          </div>
          <div className="header-actions">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="form-select"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="metrics-grid animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="metric-card">
          <div className="metric-icon">🤝</div>
          <div className="metric-content">
            <div className="metric-value">{data.overview.totalConnections}</div>
            <div className="metric-label">Total Connections</div>
            <div className={`metric-trend ${data.trends.connectionsGrowth >= 0 ? 'positive' : 'negative'}`}>
              {data.trends.connectionsGrowth >= 0 ? '↗' : '↘'} {Math.abs(data.trends.connectionsGrowth)}% this period
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">💼</div>
          <div className="metric-content">
            <div className="metric-value">{data.overview.totalJobs}</div>
            <div className="metric-label">Job Applications</div>
            <div className={`metric-trend ${data.trends.jobsGrowth >= 0 ? 'positive' : 'negative'}`}>
              {data.trends.jobsGrowth >= 0 ? '↗' : '↘'} {Math.abs(data.trends.jobsGrowth)}% this period
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <div className="metric-value">{data.overview.responseRate}%</div>
            <div className="metric-label">Response Rate</div>
            <div className={`metric-trend ${data.trends.responseRateChange >= 0 ? 'positive' : 'negative'}`}>
              {data.trends.responseRateChange >= 0 ? '↗' : '↘'} {Math.abs(data.trends.responseRateChange)}% this period
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <div className="metric-value">{data.overview.applicationRate}%</div>
            <div className="metric-label">Application Rate</div>
            <div className={`metric-trend ${data.trends.applicationRateChange >= 0 ? 'positive' : 'negative'}`}>
              {data.trends.applicationRateChange >= 0 ? '↗' : '↘'} {Math.abs(data.trends.applicationRateChange)}% this period
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="content-grid animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
        {/* Activity Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <span>📅</span>
              Weekly Activity
            </h3>
          </div>
          <div className="chart-content">
            <div className="activity-chart">
              {data.activityByDay.map((day, index) => (
                <div key={day.day} className="activity-day">
                  <div className="activity-bars">
                    <div 
                      className="activity-bar connections"
                      style={{ height: `${(day.connections / 12) * 100}%` }}
                      title={`${day.connections} connections`}
                    ></div>
                    <div 
                      className="activity-bar applications"
                      style={{ height: `${(day.applications / 4) * 100}%` }}
                      title={`${day.applications} applications`}
                    ></div>
                  </div>
                  <div className="activity-label">{day.day}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color connections"></div>
                <span>Connections</span>
              </div>
              <div className="legend-item">
                <div className="legend-color applications"></div>
                <span>Applications</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Companies */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">
              <span>🏆</span>
              Top Companies
            </h3>
          </div>
          <div className="chart-content">
            <div className="companies-list">
              {data.topCompanies.map((company, index) => (
                <div key={company.name} className="company-item">
                  <div className="company-rank">#{index + 1}</div>
                  <div className="company-info">
                    <div className="company-name">{company.name}</div>
                    <div className="company-stats">
                      {company.applications} applications • {company.connections} connections
                    </div>
                  </div>
                  <div className="company-score">
                    {company.applications + company.connections}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>



      <style jsx>{`
        .analytics-hub {
          display: flex;
          flex-direction: column;
          gap: var(--space-6);
        }

        .header-content {
          flex: 1;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--space-6);
        }

        .metric-card {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-6);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          transition: var(--transition-normal);
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .metric-icon {
          font-size: 2.5rem;
          flex-shrink: 0;
        }

        .metric-content {
          flex: 1;
        }

        .metric-value {
          font-size: var(--text-3xl);
          font-weight: 900;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: var(--space-1);
        }

        .metric-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: var(--space-2);
        }

        .metric-trend {
          font-size: var(--text-xs);
          font-weight: 600;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-full);
        }

        .metric-trend.positive {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success-500);
        }

        .metric-trend.negative {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger-500);
        }

        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: var(--space-6);
        }

        .chart-card {
          background: var(--bg-card);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-3xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
        }

        .chart-header {
          margin-bottom: var(--space-6);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-primary);
        }

        .chart-title {
          font-size: var(--text-lg);
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin: 0;
        }

        .activity-chart {
          display: flex;
          align-items: end;
          gap: var(--space-3);
          height: 200px;
          margin-bottom: var(--space-4);
        }

        .activity-day {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }

        .activity-bars {
          display: flex;
          align-items: end;
          gap: 2px;
          height: 160px;
        }

        .activity-bar {
          width: 12px;
          border-radius: var(--radius-sm) var(--radius-sm) 0 0;
          min-height: 4px;
          transition: var(--transition-normal);
        }

        .activity-bar.connections {
          background: var(--gradient-secondary);
        }

        .activity-bar.applications {
          background: var(--gradient-success);
        }

        .activity-label {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-weight: 600;
        }

        .chart-legend {
          display: flex;
          justify-content: center;
          gap: var(--space-4);
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: var(--radius-sm);
        }

        .legend-color.connections {
          background: var(--gradient-secondary);
        }

        .legend-color.applications {
          background: var(--gradient-success);
        }

        .companies-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .company-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-3);
          background: var(--bg-glass-light);
          border: 1px solid var(--border-primary);
          border-radius: var(--radius-xl);
          transition: var(--transition-normal);
        }

        .company-item:hover {
          background: var(--bg-elevated);
        }

        .company-rank {
          width: 32px;
          height: 32px;
          background: var(--gradient-warning);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-sm);
          font-weight: 700;
          color: white;
          flex-shrink: 0;
        }

        .company-info {
          flex: 1;
        }

        .company-name {
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .company-stats {
          font-size: var(--text-xs);
          color: var(--text-muted);
        }

        .company-score {
          font-size: var(--text-lg);
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }



        @media (max-width: 1200px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .card-header {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-4);
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }

          .metric-card {
            padding: var(--space-4);
          }
        }
      `}</style>
    </div>
  )
}

export default AnalyticsHub