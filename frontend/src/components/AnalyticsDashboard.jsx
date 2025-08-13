import React, { useState, useEffect, useMemo } from 'react';
import Skeleton from './shared/Skeleton';
import { apiService } from '../services/api';

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    totalJobs: 0,
    totalEmails: 0,
    dailyStats: [],
    weeklyStats: [],
    monthlyStats: [],
    statusBreakdown: {},
    emailTypeBreakdown: {},
    companyStats: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const [dashboardResponse, performanceResponse] = await Promise.all([
        apiService.getDashboardAnalytics(timeRange),
        apiService.getPerformanceMetrics()
      ]);

      const dashboardData = dashboardResponse.data.analytics;
      const performanceData = performanceResponse.data.performance;

      setAnalytics({
        totalJobs: performanceData.total_applications || 0,
        totalEmails: performanceData.emailStats?.total_emails || 0,
        totalConnections: 0,
        dailyStats: dashboardData.dailyStats || [],
        statusBreakdown: dashboardData.statusBreakdown || {},
        emailTypeBreakdown: dashboardData.emailTypeBreakdown || {},
        companyStats: dashboardData.companyStats || [],
        recentActivity: dashboardData.recentActivity || [],
        applicationRate: calculateApplicationRate(dashboardData.dailyStats || [], timeRange),
        responseRate: dashboardData.responseRate?.responseRate || 0,
        averageResponseTime: dashboardData.responseRate?.avgResponseDays?.toFixed(1) || 0,
        performanceMetrics: performanceData,
        platformStats: dashboardData.platformStats || {},
        weeklyTrends: dashboardData.weeklyTrends || []
      });
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateApplicationRate = (dailyStats, timeRange) => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const totalApps = dailyStats.reduce((sum, day) => sum + (day.applications || 0), 0);
    return days > 0 ? (totalApps / days).toFixed(1) : 0;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="d-flex justify-between items-center">
          <div>
            <Skeleton width={260} height={28} />
            <div className="mt-2"><Skeleton width={340} height={16} /></div>
          </div>
          <Skeleton width={160} height={40} rounded />
        </div>
        <div className="row">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="col-md-3 mb-6">
              <div className="metric-card">
                <Skeleton width={64} height={48} />
                <div className="mt-3"><Skeleton width={120} height={32} /></div>
                <div className="mt-2"><Skeleton width={100} height={14} /></div>
              </div>
            </div>
          ))}
        </div>
        <div className="row">
          <div className="col-md-8"><div className="chart-card p-6"><Skeleton width="100%" height={280} /></div></div>
          <div className="col-md-4"><div className="chart-card p-6"><Skeleton width="100%" height={280} /></div></div>
        </div>
      </div>
    );
  }

  const nextActions = buildNextActions(analytics);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="d-flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-primary mb-2 d-flex items-center gap-3">
            <span className="text-5xl">📊</span>
            Analytics Dashboard
          </h1>
          <p className="text-lg text-secondary font-medium">
            Comprehensive insights into your job search performance
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <label className="text-sm font-bold text-secondary mb-2 d-block text-uppercase" style={{ letterSpacing: '0.05em' }}>
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="form-select"
            style={{
              minWidth: '160px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
              fontWeight: '600'
            }}
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="row">
        <MetricCard
          title="Total Applications"
          value={analytics.totalJobs}
          icon="💼"
          gradient="var(--primary-gradient)"
          subtitle={`${analytics.applicationRate} per day average`}
          trend={12}
        />
        <MetricCard
          title="Email Events"
          value={analytics.totalEmails}
          icon="📧"
          gradient="var(--secondary-gradient)"
          subtitle="Automated tracking"
          trend={8}
        />
        <MetricCard
          title="Response Rate"
          value={`${analytics.responseRate}%`}
          icon="📈"
          gradient="var(--success-gradient)"
          subtitle="Companies responding"
          trend={-3}
        />
        <MetricCard
          title="Avg Response Time"
          value={`${analytics.averageResponseTime}`}
          icon="⏱️"
          gradient="var(--warning-gradient)"
          subtitle="Days to hear back"
          trend={5}
        />
      </div>

      {/* Guidance Bar */}
      {nextActions.length > 0 && (
        <div className="glass-light rounded-xl p-4 d-flex gap-3 items-center">
          {nextActions.map((a, i) => (
            <span key={i} className="suggestion-pill">
              <span style={{ marginRight: 6 }}>{a.icon}</span>
              {a.text}
            </span>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="row">
        {/* Daily Applications Chart */}
        <div className="col-md-8">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <span className="text-2xl mr-3">📅</span>
                Daily Application Activity
              </h3>
              <div className="d-flex gap-2">
                <div className="glass-light rounded-full px-3 py-1 text-xs font-bold" style={{ color: 'var(--primary-color)' }}>
                  APPLICATIONS
                </div>
                <div className="glass-light rounded-full px-3 py-1 text-xs font-bold" style={{ color: 'var(--success-color)' }}>
                  RESPONSES
                </div>
              </div>
            </div>
            <div className="p-6">
              <DailyChart data={analytics.dailyStats} />
            </div>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="col-md-4">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <span className="text-2xl mr-3">📊</span>
                Application Status
              </h3>
            </div>
            <div className="p-6">
              <StatusBreakdown data={analytics.statusBreakdown} />
            </div>
          </div>
        </div>
      </div>

      {/* Email Types and Company Stats */}
      <div className="row">
        <div className="col-md-6">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <span className="text-2xl mr-3">📧</span>
                Email Response Types
              </h3>
            </div>
            <div className="p-6">
              <EmailTypeChart data={analytics.emailTypeBreakdown} />
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <span className="text-2xl mr-3">🏢</span>
                Top Companies Applied
              </h3>
            </div>
            <div className="p-6">
              <CompanyStats data={analytics.companyStats} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">
            <span className="text-2xl mr-3">🕒</span>
            Recent Activity Timeline
          </h3>
          <div className="glass-light rounded-full px-3 py-1 text-xs font-bold" style={{ color: 'var(--accent-color)' }}>
            LIVE UPDATES
          </div>
        </div>
        <div className="p-6">
          <RecentActivity data={analytics.recentActivity} />
        </div>
      </div>
    </div>
  );
};

// Enhanced Metric Card Component with Perfect Alignment
const MetricCard = ({ title, value, icon, gradient, subtitle, trend }) => (
  <div className="col-md-3 mb-6">
    <div className="metric-card float" style={{ 
      background: `${gradient}10`,
      border: `1px solid ${gradient.includes('var(') ? 'var(--border-accent)' : 'rgba(99, 102, 241, 0.3)'}`
    }}>
      {/* Background Decoration */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '80px',
        height: '80px',
        background: gradient,
        borderRadius: '50%',
        opacity: 0.1,
        filter: 'blur(20px)'
      }} />
      
      {/* Icon */}
      <div className="metric-icon" style={{ 
        fontSize: '3.5rem',
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
      }}>
        {icon}
      </div>
      
      {/* Value */}
      <div className="metric-value" style={{ 
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        {value}
      </div>
      
      {/* Title */}
      <div className="metric-label">
        {title}
      </div>
      
      {/* Subtitle */}
      <div className="metric-subtitle">
        {subtitle}
      </div>
      
      {/* Trend Indicator */}
      {trend && (
        <div className={`metric-trend ${trend > 0 ? 'positive' : 'negative'}`}>
          {trend > 0 ? '↗️' : '↘️'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  </div>
);

// Enhanced Daily Chart Component
const DailyChart = ({ data }) => {
  const maxApplications = Math.max(...data.map(d => d.applications), 1);
  
  return (
    <div className="py-6">
      <div className="d-flex items-end justify-between" style={{ height: '280px', gap: 'var(--space-2)' }}>
        {data.map((day, index) => {
          const height = (day.applications / maxApplications) * 220;
          const hasApplications = day.applications > 0;
          const responseHeight = day.responses ? (day.responses / maxApplications) * 220 : 0;
          
          return (
            <div key={index} className="d-flex flex-col items-center" style={{ flex: 1, position: 'relative' }}>
              {/* Response Bar (Background) */}
              {day.responses > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '60px',
                    width: '80%',
                    background: 'var(--success-gradient)',
                    height: `${Math.max(responseHeight, 4)}px`,
                    borderRadius: 'var(--border-radius-sm)',
                    opacity: 0.6,
                    zIndex: 1
                  }}
                />
              )}
              
              {/* Application Bar */}
              <div
                className="interactive"
                style={{
                  width: '100%',
                  background: hasApplications 
                    ? 'var(--primary-gradient)'
                    : 'var(--bg-elevated)',
                  height: `${Math.max(height, 6)}px`,
                  borderRadius: 'var(--border-radius-sm) var(--border-radius-sm) 0 0',
                  marginBottom: 'var(--space-3)',
                  position: 'relative',
                  transition: 'all var(--transition-normal)',
                  cursor: 'pointer',
                  boxShadow: hasApplications ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                  zIndex: 2
                }}
                title={`${day.applications} applications, ${day.responses || 0} responses on ${day.date}`}
              >
                {/* Value Label */}
                {hasApplications && (
                  <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: '800',
                    color: 'var(--text-primary)',
                    background: 'var(--bg-glass)',
                    padding: 'var(--space-1) var(--space-2)',
                    borderRadius: 'var(--border-radius-full)',
                    boxShadow: 'var(--shadow-md)',
                    whiteSpace: 'nowrap',
                    border: '1px solid var(--border-color)',
                    backdropFilter: 'blur(12px)'
                  }}>
                    {day.applications}
                    {day.responses > 0 && (
                      <span style={{ color: 'var(--success-color)', marginLeft: 'var(--space-1)' }}>
                        +{day.responses}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Date Labels */}
              <div className="text-center">
                <div className="text-xs font-bold text-secondary mb-1">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-xs text-muted">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Chart Legend */}
      <div className="d-flex justify-center gap-6 mt-6 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <div className="d-flex items-center gap-2">
          <div style={{
            width: '16px',
            height: '16px',
            background: 'var(--primary-gradient)',
            borderRadius: 'var(--border-radius-sm)'
          }} />
          <span className="text-sm font-semibold text-secondary">Applications</span>
        </div>
        <div className="d-flex items-center gap-2">
          <div style={{
            width: '16px',
            height: '16px',
            background: 'var(--success-gradient)',
            borderRadius: 'var(--border-radius-sm)',
            opacity: 0.6
          }} />
          <span className="text-sm font-semibold text-secondary">Responses</span>
        </div>
      </div>
    </div>
  );
};

// Enhanced Status Breakdown Component
const StatusBreakdown = ({ data }) => {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  
  const statusConfig = {
    viewed: { color: 'var(--neutral-gradient)', label: 'Viewed', icon: '👀' },
    applied: { color: 'var(--primary-gradient)', label: 'Applied', icon: '📝' },
    interviewing: { color: 'var(--warning-gradient)', label: 'Interviewing', icon: '💬' },
    rejected: { color: 'var(--danger-gradient)', label: 'Rejected', icon: '❌' },
    offer: { color: 'var(--success-gradient)', label: 'Offer', icon: '🎉' }
  };

  return (
    <div className="space-y-4">
      {Object.entries(data).map(([status, count]) => {
        const config = statusConfig[status] || { color: 'var(--neutral-gradient)', label: status, icon: '📄' };
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        
        return (
          <div key={status} className="glass-light rounded-xl p-4 transition-all duration-300 hover:scale-105">
            <div className="d-flex justify-between items-center mb-3">
              <div className="d-flex items-center gap-3">
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: config.color,
                  borderRadius: 'var(--border-radius)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  {config.icon}
                </div>
                <div>
                  <div className="font-bold text-primary text-base">{config.label}</div>
                  <div className="text-xs text-muted font-medium">{percentage}% of total</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-primary">{count}</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '6px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--border-radius-full)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${percentage}%`,
                height: '100%',
                background: config.color,
                borderRadius: 'var(--border-radius-full)',
                transition: 'width 1s ease-out'
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Enhanced Email Type Chart Component
const EmailTypeChart = ({ data }) => {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);
  
  const typeConfig = {
    rejection: { color: 'var(--danger-gradient)', label: 'Rejections', icon: '❌' },
    assessment: { color: 'var(--warning-gradient)', label: 'Assessments', icon: '📝' },
    interview_invite: { color: 'var(--accent-gradient)', label: 'Interview Invites', icon: '💬' },
    offer: { color: 'var(--success-gradient)', label: 'Offers', icon: '🎉' },
    application_confirmation: { color: 'var(--primary-gradient)', label: 'Confirmations', icon: '✅' },
    other: { color: 'var(--neutral-gradient)', label: 'Other', icon: '📧' }
  };

  return (
    <div className="space-y-3">
      {Object.entries(data).map(([type, count]) => {
        const config = typeConfig[type] || { color: 'var(--neutral-gradient)', label: type, icon: '📧' };
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        
        return (
          <div key={type} className="d-flex justify-between items-center p-3 glass-light rounded-lg transition-all duration-300 hover:scale-105">
            <div className="d-flex items-center gap-3">
              <div style={{
                width: '32px',
                height: '32px',
                background: config.color,
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                {config.icon}
              </div>
              <span className="font-semibold text-secondary">{config.label}</span>
            </div>
            <div className="d-flex items-center gap-3">
              <span className="text-lg font-bold text-primary">{count}</span>
              <span className="text-xs text-muted font-medium px-2 py-1 glass-light rounded-full">
                {percentage}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Enhanced Company Stats Component
const CompanyStats = ({ data }) => (
  <div className="space-y-3">
    {data.slice(0, 8).map((company, index) => (
      <div key={index} className="glass-light rounded-lg p-4 transition-all duration-300 hover:scale-105">
        <div className="d-flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="font-bold text-primary text-base mb-1">{company.name}</div>
            <div className="d-flex gap-4 text-xs">
              {company.interviews > 0 && (
                <span className="text-warning font-semibold">
                  💬 {company.interviews} interviews
                </span>
              )}
              {company.offers > 0 && (
                <span className="text-success font-semibold">
                  🎉 {company.offers} offers
                </span>
              )}
              {company.rejections > 0 && (
                <span className="text-muted font-semibold">
                  ❌ {company.rejections} rejections
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black" style={{ color: 'var(--primary-color)' }}>
              {company.applications}
            </div>
            <div className="text-xs text-muted font-medium">applications</div>
          </div>
        </div>
        
        {/* Success Rate Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--border-radius-full)',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${company.applications > 0 ? ((company.interviews + company.offers) / company.applications) * 100 : 0}%`,
            height: '100%',
            background: 'var(--success-gradient)',
            borderRadius: 'var(--border-radius-full)',
            transition: 'width 1s ease-out'
          }} />
        </div>
      </div>
    ))}
  </div>
);

// Enhanced Recent Activity Component
const RecentActivity = ({ data }) => (
  <div className="space-y-4">
    {data.map((activity, index) => (
      <div key={index} className="d-flex items-center p-4 glass-light rounded-xl transition-all duration-300 hover:scale-105">
        <div className="mr-4">
          <div style={{
            width: '48px',
            height: '48px',
            background: activity.type === 'application' ? 'var(--primary-gradient)' : 'var(--secondary-gradient)',
            borderRadius: 'var(--border-radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {activity.type === 'application' ? '💼' : '📧'}
          </div>
        </div>
        <div className="flex-1">
          <div className="font-bold text-primary text-base mb-1">{activity.title}</div>
          <div className="d-flex items-center gap-3 text-sm text-secondary">
            <span className="font-semibold">{activity.company}</span>
            <span className="text-muted">•</span>
            <span className="text-muted">{new Date(activity.date).toLocaleDateString()}</span>
          </div>
        </div>
        <div>
          <StatusBadge 
            status={activity.status} 
            type={activity.type === 'application' ? 'job' : 'email'} 
          />
        </div>
      </div>
    ))}
  </div>
);

// Status Badge Component (assuming it exists)
const StatusBadge = ({ status, type }) => {
  const getStatusConfig = (status, type) => {
    if (type === 'job') {
      const configs = {
        viewed: { color: 'var(--neutral-gradient)', label: 'Viewed' },
        applied: { color: 'var(--primary-gradient)', label: 'Applied' },
        interviewing: { color: 'var(--warning-gradient)', label: 'Interviewing' },
        rejected: { color: 'var(--danger-gradient)', label: 'Rejected' },
        offer: { color: 'var(--success-gradient)', label: 'Offer' }
      };
      return configs[status] || { color: 'var(--neutral-gradient)', label: status };
    } else {
      const configs = {
        rejection: { color: 'var(--danger-gradient)', label: 'Rejection' },
        assessment: { color: 'var(--warning-gradient)', label: 'Assessment' },
        interview_invite: { color: 'var(--accent-gradient)', label: 'Interview' },
        offer: { color: 'var(--success-gradient)', label: 'Offer' },
        application_confirmation: { color: 'var(--primary-gradient)', label: 'Confirmation' }
      };
      return configs[status] || { color: 'var(--neutral-gradient)', label: status };
    }
  };

  const config = getStatusConfig(status, type);
  
  return (
    <span className="status-badge" style={{
      background: `${config.color}15`,
      color: config.color.includes('var(') ? 'var(--primary-color)' : config.color,
      border: `1px solid ${config.color}30`
    }}>
      {config.label}
    </span>
  );
};

export default AnalyticsDashboard;

function buildNextActions(analytics) {
  const actions = [];
  if ((analytics.emailTypeBreakdown?.assessment || 0) > 0) {
    actions.push({ icon: '📝', text: 'Complete pending assessments' });
  }
  if ((analytics.statusBreakdown?.interviewing || 0) > 0) {
    actions.push({ icon: '💬', text: 'Prepare for interviews' });
  }
  if ((analytics.statusBreakdown?.viewed || 0) > 5) {
    actions.push({ icon: '🚀', text: 'Apply to more roles today' });
  }
  return actions.slice(0, 3);
}