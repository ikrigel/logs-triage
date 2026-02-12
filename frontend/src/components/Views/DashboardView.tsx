import { useState, useEffect } from 'react';
import './DashboardView.css';

interface MetricCard {
  id: string;
  icon: string;
  label: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
}

export function DashboardView() {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading metrics
    const timer = setTimeout(() => {
      setMetrics([
        {
          id: 'logs',
          icon: '📝',
          label: 'Total Logs',
          value: '2,847',
          description: 'Across all log sets',
          trend: 'up',
        },
        {
          id: 'tickets',
          icon: '🎫',
          label: 'Open Tickets',
          value: '12',
          description: 'Awaiting investigation',
          trend: 'down',
        },
        {
          id: 'issues',
          icon: '⚠️',
          label: 'Critical Issues',
          value: '3',
          description: 'Require immediate attention',
          trend: 'down',
        },
        {
          id: 'sessions',
          icon: '💬',
          label: 'Chat Sessions',
          value: '8',
          description: 'Active conversations',
          trend: 'up',
        },
      ]);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-view">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Overview of your production logs and triage activity</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading metrics...</p>
        </div>
      ) : (
        <>
          <div className="metrics-grid">
            {metrics.map((metric) => (
              <div key={metric.id} className="metric-card">
                <div className="metric-icon">{metric.icon}</div>
                <div className="metric-content">
                  <h3 className="metric-label">{metric.label}</h3>
                  <div className="metric-value">
                    {metric.value}
                    {metric.trend && (
                      <span className={`trend ${metric.trend}`}>
                        {metric.trend === 'up' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  <p className="metric-description">{metric.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="recent-activity">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-icon">🔍</span>
                <div className="activity-content">
                  <p className="activity-title">Triage completed for Log Set 3</p>
                  <p className="activity-time">2 hours ago</p>
                </div>
              </div>
              <div className="activity-item">
                <span className="activity-icon">🎫</span>
                <div className="activity-content">
                  <p className="activity-title">Created ticket TKT-002845</p>
                  <p className="activity-time">5 hours ago</p>
                </div>
              </div>
              <div className="activity-item">
                <span className="activity-icon">💬</span>
                <div className="activity-content">
                  <p className="activity-title">Started new chat session</p>
                  <p className="activity-time">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
