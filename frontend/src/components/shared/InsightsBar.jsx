import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import Skeleton from './Skeleton';

const InsightsBar = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [perf, dash] = await Promise.all([
          apiService.getPerformanceMetrics(),
          apiService.getDashboardAnalytics('7d')
        ]);

        const performance = perf.data.performance || {};
        const analytics = dash.data.analytics || {};

        const dailyStats = analytics.dailyStats || [];
        const today = dailyStats[dailyStats.length - 1] || {};

        const suggestions = buildSuggestions(analytics, performance);

        setMetrics({ performance, analytics, today, suggestions });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="glass-light rounded-xl p-4 d-flex gap-4 items-center overflow-x-auto">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="d-flex flex-col gap-2" style={{ minWidth: 160 }}>
            <Skeleton width={120} height={12} />
            <Skeleton width={140} height={22} />
          </div>
        ))}
      </div>
    );
  }

  const { performance, analytics, today, suggestions } = metrics;

  return (
    <div className="glass-light rounded-xl p-4 d-flex items-center justify-between gap-4 overflow-x-auto">
      <KPI label="Today" value={today.applications || 0} icon="🗓️" hint="applications" />
      <KPI label="Response rate" value={`${analytics.responseRate?.responseRate || 0}%`} icon="📈" hint="companies responding" />
      <KPI label="Interviews" value={analytics.companyStats?.reduce((s, c) => s + (c.interviews || 0), 0) || 0} icon="💬" hint="total"
      />
      <KPI label="Assessments" value={analytics.emailTypeBreakdown?.assessment || 0} icon="📝" hint="detected" />
      <KPI label="Offers" value={analytics.emailTypeBreakdown?.offer || 0} icon="🎉" hint="received" />

      <div className="d-flex items-center gap-2 ml-auto" style={{ minWidth: 280 }}>
        {suggestions.map((s, i) => (
          <span key={i} className="suggestion-pill" title={s.detail}>{s.text}</span>
        ))}
      </div>
    </div>
  );
};

const KPI = ({ label, value, icon, hint }) => (
  <div className="d-flex flex-col" style={{ minWidth: 160 }}>
    <div className="text-xs text-muted font-semibold mb-1">{label}</div>
    <div className="d-flex items-end gap-2">
      <div style={{ fontSize: '1.5rem' }}>{icon}</div>
      <div className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
    <div className="text-xs text-muted">{hint}</div>
  </div>
);

function buildSuggestions(analytics, performance) {
  const list = [];
  const totalAssessments = analytics.emailTypeBreakdown?.assessment || 0;
  const rejections = analytics.emailTypeBreakdown?.rejection || 0;
  const responseRate = Number(analytics.responseRate?.responseRate || 0);

  if (totalAssessments > 0) {
    list.push({ text: 'Finish assessments', detail: 'Complete pending coding tests before deadlines' });
  }
  if (responseRate < 20 && (performance.actually_applied || 0) < 10) {
    list.push({ text: 'Apply to more roles', detail: 'Boost pipeline to improve response odds' });
  }
  if (rejections > 0) {
    list.push({ text: 'Refine resume', detail: 'Tune resume/keywords for better screening' });
  }
  if (list.length === 0) {
    list.push({ text: 'Maintain momentum', detail: 'Great pace—keep applying and following up' });
  }
  return list.slice(0, 3);
}

export default InsightsBar;



