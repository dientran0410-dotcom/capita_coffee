import React from 'react';
import '../Dashboard.css';

const CustomerDashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Customer Dashboard</h1>
        <p>Your loyalty points and rewards overview</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon">🎁</div>
          <div className="stat-content">
            <div className="stat-label">Loyalty Points</div>
            <div className="stat-value">2,450</div>
            <div className="stat-change positive">+125 this month</div>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">🏆</div>
          <div className="stat-content">
            <div className="stat-label">Rewards Available</div>
            <div className="stat-value">8</div>
            <div className="stat-change positive">2 new rewards</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">☕</div>
          <div className="stat-content">
            <div className="stat-label">Total Orders</div>
            <div className="stat-value">47</div>
            <div className="stat-change positive">+5 this month</div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Spent</div>
            <div className="stat-value">$1,850</div>
            <div className="stat-change positive">+$230</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>Points History</h3>
          <div className="chart-placeholder">
            Chart will be here
          </div>
        </div>

        <div className="chart-card">
          <h3>Recent Activity</h3>
          <div className="chart-placeholder">
            Chart will be here
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
