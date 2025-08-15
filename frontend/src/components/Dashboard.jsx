import React from 'react';
import AnalyticsDashboard from './AnalyticsDashboard';

const Dashboard = () => {
  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Overview</h2>
          <div className="card-subtitle">Your job search control center</div>
        </div>
        <AnalyticsDashboard />
      </div>
    </div>
  );
};

export default Dashboard;



