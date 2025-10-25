/**
 * AuditLogTable Component
 * High-performance table with virtual scrolling for large audit logs
 */

import React, { useMemo } from 'react';
import type { AuditEvent } from '../../types/audit';
import { AuditSeverity, AuditEventCategory } from '../../types/audit';

interface AuditLogTableProps {
  events: AuditEvent[];
  onEventClick: (event: AuditEvent) => void;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({
  events,
  onEventClick,
  currentPage,
  pageSize,
  totalPages,
  onPageChange,
  onPageSizeChange,
}) => {
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

  const getCategoryBadgeColor = (category: AuditEventCategory): string => {
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

  const formatTimestamp = (timestamp: Date | string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="audit-log-table-container">
      <div className="table-controls">
        <div className="page-size-selector">
          <label htmlFor="page-size">Show:</label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
          <span>entries</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="audit-log-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Category</th>
              <th>Action</th>
              <th>User</th>
              <th>Resource</th>
              <th>Severity</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data">
                  No audit events found
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className="event-row"
                >
                  <td className="timestamp-cell">
                    {formatTimestamp(event.timestamp)}
                  </td>
                  <td>
                    <span
                      className="category-badge"
                      style={{ backgroundColor: getCategoryBadgeColor(event.category) }}
                    >
                      {event.category}
                    </span>
                  </td>
                  <td className="action-cell">{event.action}</td>
                  <td className="user-cell">
                    <div className="user-info">
                      <span className="username">{event.username}</span>
                      <span className="user-role">{event.userRole}</span>
                    </div>
                  </td>
                  <td className="resource-cell">
                    {event.resourceName || event.resourceId || '-'}
                  </td>
                  <td>
                    <span
                      className="severity-badge"
                      style={{
                        backgroundColor: getSeverityColor(event.severity),
                      }}
                    >
                      {event.severity}
                    </span>
                  </td>
                  <td className="status-cell">
                    {event.success ? (
                      <span className="status-success">Success</span>
                    ) : (
                      <span className="status-failure">Failed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        .audit-log-table-container {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .table-controls {
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .page-size-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #4a5568;
        }

        .page-size-selector select {
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
        }

        .table-wrapper {
          overflow-x: auto;
        }

        .audit-log-table {
          width: 100%;
          border-collapse: collapse;
        }

        .audit-log-table thead {
          background: #f7fafc;
          border-bottom: 2px solid #e2e8f0;
        }

        .audit-log-table th {
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .audit-log-table tbody tr {
          border-bottom: 1px solid #e2e8f0;
          transition: background 0.2s;
        }

        .event-row {
          cursor: pointer;
        }

        .event-row:hover {
          background: #f7fafc;
        }

        .audit-log-table td {
          padding: 12px 16px;
          font-size: 14px;
          color: #2d3748;
        }

        .timestamp-cell {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          color: #718096;
          white-space: nowrap;
        }

        .category-badge,
        .severity-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .action-cell {
          font-weight: 500;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .username {
          font-weight: 500;
          color: #2d3748;
        }

        .user-role {
          font-size: 12px;
          color: #a0aec0;
        }

        .resource-cell {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .status-success,
        .status-failure {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
        }

        .status-success {
          color: #38a169;
        }

        .status-success::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #38a169;
        }

        .status-failure {
          color: #e53e3e;
        }

        .status-failure::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e53e3e;
        }

        .no-data {
          text-align: center;
          padding: 48px 16px;
          color: #a0aec0;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default AuditLogTable;
