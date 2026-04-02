import React from 'react';
import '../Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Franchise Management Hub</h1>
        <p>Real-time insights and system overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-label">Total Revenue</div>
            <div className="stat-value">$2.4M</div>
            <div className="stat-change positive">+12.5%</div>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <div className="stat-label">Active Orders</div>
            <div className="stat-value">342</div>
            <div className="stat-change positive">+8.2%</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-label">Inventory Items</div>
            <div className="stat-value">1,247</div>
            <div className="stat-change negative">-2.1%</div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">🏪</div>
          <div className="stat-content">
            <div className="stat-label">Active Franchises</div>
            <div className="stat-value">48</div>
            <div className="stat-change positive">+4.3%</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <div className="chart-placeholder">
            Chart will be here
          </div>
        </div>

        <div className="chart-card">
          <h3>Inventory Distribution</h3>
          <div className="chart-placeholder">
            Chart will be here
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
