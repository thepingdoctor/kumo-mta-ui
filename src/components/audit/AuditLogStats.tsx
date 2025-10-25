/**
 * AuditLogStats Component
 * Statistics dashboard for audit logs
 */

import React from 'react';
import type { AuditLogStats } from '../../types/audit';
import { AuditEventCategory, AuditSeverity } from '../../types/audit';

interface AuditLogStatsProps {
  stats: AuditLogStats;
}

const AuditLogStats: React.FC<AuditLogStatsProps> = ({ stats }) => {
  const getCategoryColor = (category: AuditEventCategory): string => {
    switch (category) {
      case AuditEventCategory.AUTH:
        return '#805ad5';
      case AuditEventCategory.CONFIG:
        return '#3182ce';
      case AuditEventCategory.QUEUE:
        return '#38a169';
      case AuditEventCategory.SECURITY:
        return '#e53e3e';
      case AuditEventCategory.SYSTEM:
        return '#718096';
      case AuditEventCategory.USER:
        return '#d69e2e';
      default:
        return '#4a5568';
    }
  };

  const getSeverityColor = (severity: AuditSeverity): string => {
    switch (severity) {
      case AuditSeverity.CRITICAL:
        return '#c53030';
      case AuditSeverity.ERROR:
        return '#e53e3e';
      case AuditSeverity.WARNING:
        return '#dd6b20';
      case AuditSeverity.INFO:
      default:
        return '#3182ce';
    }
  };

  const failureRate = stats.totalEvents > 0
    ? ((stats.failedEvents / stats.totalEvents) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="audit-log-stats">
      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon total">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path
                fillRule="evenodd"
                d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Events</span>
            <span className="metric-value">{stats.totalEvents.toLocaleString()}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon users">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-label">Unique Users</span>
            <span className="metric-value">{stats.uniqueUsers}</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon failed">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 9.293 8.707 8.707z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-label">Failed Events</span>
            <span className="metric-value">{stats.failedEvents.toLocaleString()}</span>
            <span className="metric-subtext">{failureRate}% failure rate</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="stats-section">
        <h4>Events by Category</h4>
        <div className="category-breakdown">
          {Object.entries(stats.eventsByCategory).map(([category, count]) => {
            const percentage = ((count / stats.totalEvents) * 100).toFixed(1);
            return (
              <div key={category} className="category-item">
                <div className="category-header">
                  <span className="category-name">{category}</span>
                  <span className="category-count">
                    {count.toLocaleString()} ({percentage}%)
                  </span>
                </div>
                <div className="category-bar">
                  <div
                    className="category-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getCategoryColor(category as AuditEventCategory),
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Severity Breakdown */}
      <div className="stats-section">
        <h4>Events by Severity</h4>
        <div className="severity-grid">
          {Object.entries(stats.eventsBySeverity).map(([severity, count]) => (
            <div
              key={severity}
              className="severity-card"
              style={{
                borderColor: getSeverityColor(severity as AuditSeverity),
              }}
            >
              <div
                className="severity-indicator"
                style={{
                  backgroundColor: getSeverityColor(severity as AuditSeverity),
                }}
              />
              <span className="severity-label">{severity}</span>
              <span className="severity-count">{count.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .audit-log-stats {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 28px;
        }

        .metric-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: #f7fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .metric-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 10px;
          color: white;
        }

        .metric-icon.total {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .metric-icon.users {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .metric-icon.failed {
          background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .metric-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-label {
          font-size: 12px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
        }

        .metric-subtext {
          font-size: 12px;
          color: #a0aec0;
        }

        .stats-section {
          margin-bottom: 28px;
        }

        .stats-section:last-child {
          margin-bottom: 0;
        }

        .stats-section h4 {
          margin: 0 0 16px 0;
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .category-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .category-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .category-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .category-name {
          font-size: 13px;
          font-weight: 600;
          color: #4a5568;
        }

        .category-count {
          font-size: 13px;
          color: #718096;
        }

        .category-bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .category-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .severity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .severity-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          background: white;
          border: 2px solid;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .severity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .severity-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .severity-label {
          font-size: 11px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .severity-count {
          font-size: 20px;
          font-weight: 700;
          color: #1a202c;
        }
      `}</style>
    </div>
  );
};

export default AuditLogStats;
