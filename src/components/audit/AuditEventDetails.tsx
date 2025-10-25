/**
 * AuditEventDetails Component
 * Modal displaying detailed audit event information
 */

import React from 'react';
import type { AuditEvent } from '../../types/audit';

interface AuditEventDetailsProps {
  event: AuditEvent;
  onClose: () => void;
}

const AuditEventDetails: React.FC<AuditEventDetailsProps> = ({ event, onClose }) => {
  const formatTimestamp = (timestamp: Date | string): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '-';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-container">
        <div className="modal-header">
          <div>
            <h2>Audit Event Details</h2>
            <span className="event-id">ID: {event.id}</span>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.225 4.811a1 1 0 00-1.414 1.414L10.586 12 4.81 17.775a1 1 0 101.414 1.414L12 13.414l5.775 5.775a1 1 0 001.414-1.414L13.414 12l5.775-5.775a1 1 0 00-1.414-1.414L12 10.586 6.225 4.81z" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Basic Information */}
          <section className="detail-section">
            <h3>Basic Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">Timestamp</span>
                <span className="value">{formatTimestamp(event.timestamp)}</span>
              </div>
              <div className="detail-item">
                <span className="label">Category</span>
                <span className="value badge category-badge">{event.category}</span>
              </div>
              <div className="detail-item">
                <span className="label">Action</span>
                <span className="value">{event.action}</span>
              </div>
              <div className="detail-item">
                <span className="label">Severity</span>
                <span className={`value badge severity-${event.severity.toLowerCase()}`}>
                  {event.severity}
                </span>
              </div>
              <div className="detail-item">
                <span className="label">Status</span>
                <span className={`value badge status-${event.success ? 'success' : 'failure'}`}>
                  {event.success ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>
          </section>

          {/* User Information */}
          <section className="detail-section">
            <h3>User Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">User ID</span>
                <span className="value">{event.userId}</span>
              </div>
              <div className="detail-item">
                <span className="label">Username</span>
                <span className="value">{event.username}</span>
              </div>
              <div className="detail-item">
                <span className="label">Role</span>
                <span className="value">{event.userRole}</span>
              </div>
              <div className="detail-item">
                <span className="label">Session ID</span>
                <span className="value">{event.sessionId || '-'}</span>
              </div>
            </div>
          </section>

          {/* Resource Information */}
          {(event.resourceType || event.resourceId || event.resourceName) && (
            <section className="detail-section">
              <h3>Resource Information</h3>
              <div className="detail-grid">
                {event.resourceType && (
                  <div className="detail-item">
                    <span className="label">Resource Type</span>
                    <span className="value">{event.resourceType}</span>
                  </div>
                )}
                {event.resourceId && (
                  <div className="detail-item">
                    <span className="label">Resource ID</span>
                    <span className="value">{event.resourceId}</span>
                  </div>
                )}
                {event.resourceName && (
                  <div className="detail-item">
                    <span className="label">Resource Name</span>
                    <span className="value">{event.resourceName}</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Technical Details */}
          <section className="detail-section">
            <h3>Technical Details</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="label">IP Address</span>
                <span className="value mono">{event.ipAddress || '-'}</span>
              </div>
              <div className="detail-item full-width">
                <span className="label">User Agent</span>
                <span className="value mono">{event.userAgent || '-'}</span>
              </div>
              {event.correlationId && (
                <div className="detail-item">
                  <span className="label">Correlation ID</span>
                  <span className="value mono">{event.correlationId}</span>
                </div>
              )}
            </div>
          </section>

          {/* Error Information */}
          {!event.success && event.errorMessage && (
            <section className="detail-section error-section">
              <h3>Error Information</h3>
              <div className="error-message">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 9.293 8.707 8.707z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{event.errorMessage}</span>
              </div>
            </section>
          )}

          {/* Event Details */}
          <section className="detail-section">
            <h3>Event Details</h3>
            <div className="details-json">
              {Object.entries(event.details).map(([key, value]) => (
                <div key={key} className="json-item">
                  <span className="json-key">{key}:</span>
                  <span className="json-value">{formatValue(value)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="secondary-button" onClick={onClose}>
            Close
          </button>
          <button
            className="primary-button"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(event, null, 2));
              alert('Event details copied to clipboard');
            }}
          >
            Copy JSON
          </button>
        </div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            animation: fadeIn 0.2s;
          }

          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .modal-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            animation: slideIn 0.3s ease-out;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translate(-50%, -48%);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%);
            }
          }

          .modal-header {
            padding: 24px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .modal-header h2 {
            margin: 0 0 4px 0;
            font-size: 24px;
            font-weight: 600;
            color: #1a202c;
          }

          .event-id {
            font-size: 13px;
            color: #718096;
            font-family: 'Monaco', 'Courier New', monospace;
          }

          .close-button {
            padding: 4px;
            border: none;
            background: transparent;
            cursor: pointer;
            color: #718096;
            transition: color 0.2s;
          }

          .close-button:hover {
            color: #2d3748;
          }

          .modal-body {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
          }

          .detail-section {
            margin-bottom: 28px;
          }

          .detail-section h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            font-weight: 600;
            color: #2d3748;
            padding-bottom: 8px;
            border-bottom: 2px solid #e2e8f0;
          }

          .detail-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }

          .detail-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .detail-item.full-width {
            grid-column: 1 / -1;
          }

          .label {
            font-size: 12px;
            font-weight: 600;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .value {
            font-size: 14px;
            color: #2d3748;
            word-break: break-word;
          }

          .value.mono {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 13px;
          }

          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .category-badge {
            background: #3182ce;
            color: white;
          }

          .severity-info {
            background: #3182ce;
            color: white;
          }

          .severity-warning {
            background: #dd6b20;
            color: white;
          }

          .severity-error {
            background: #e53e3e;
            color: white;
          }

          .severity-critical {
            background: #c53030;
            color: white;
          }

          .status-success {
            background: #c6f6d5;
            color: #22543d;
          }

          .status-failure {
            background: #fed7d7;
            color: #742a2a;
          }

          .error-section {
            background: #fff5f5;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #feb2b2;
          }

          .error-section h3 {
            color: #c53030;
            border-bottom-color: #feb2b2;
          }

          .error-message {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            color: #c53030;
          }

          .error-message svg {
            flex-shrink: 0;
            margin-top: 2px;
          }

          .details-json {
            background: #f7fafc;
            border-radius: 8px;
            padding: 16px;
            border: 1px solid #e2e8f0;
          }

          .json-item {
            display: flex;
            gap: 12px;
            margin-bottom: 8px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 13px;
          }

          .json-item:last-child {
            margin-bottom: 0;
          }

          .json-key {
            color: #805ad5;
            font-weight: 600;
            min-width: 150px;
          }

          .json-value {
            color: #2d3748;
            word-break: break-word;
          }

          .modal-footer {
            padding: 20px 24px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: flex-end;
            gap: 12px;
          }

          .primary-button,
          .secondary-button {
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }

          .primary-button {
            background: #3182ce;
            color: white;
            border: none;
          }

          .primary-button:hover {
            background: #2c5282;
          }

          .secondary-button {
            background: white;
            color: #4a5568;
            border: 1px solid #e2e8f0;
          }

          .secondary-button:hover {
            background: #f7fafc;
            border-color: #cbd5e0;
          }
        `}</style>
      </div>
    </>
  );
};

export default AuditEventDetails;
