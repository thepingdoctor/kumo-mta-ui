/**
 * AuditLogTimeline Component
 * Timeline view for audit events
 */

import React from 'react';
import type { AuditEvent } from '../../types/audit';
import { AuditSeverity } from '../../types/audit';

interface AuditLogTimelineProps {
  events: AuditEvent[];
  onEventClick: (event: AuditEvent) => void;
}

const AuditLogTimeline: React.FC<AuditLogTimelineProps> = ({ events, onEventClick }) => {
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

  const formatTime = (timestamp: Date | string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: Date | string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const groupedEvents = events.reduce((acc, event) => {
    const date = formatDate(event.timestamp);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, AuditEvent[]>);

  return (
    <div className="audit-timeline">
      {Object.entries(groupedEvents).map(([date, dateEvents]) => (
        <div key={date} className="timeline-date-group">
          <div className="timeline-date-header">
            <span className="date-label">{date}</span>
            <span className="event-count">{dateEvents.length} events</span>
          </div>

          <div className="timeline-events">
            {dateEvents.map((event, index) => (
              <div
                key={event.id}
                className="timeline-event"
                onClick={() => onEventClick(event)}
                style={{ '--severity-color': getSeverityColor(event.severity) } as React.CSSProperties}
              >
                <div className="timeline-marker">
                  <div className="timeline-dot" />
                  {index < dateEvents.length - 1 && <div className="timeline-line" />}
                </div>

                <div className="timeline-content">
                  <div className="event-header">
                    <span className="event-time">{formatTime(event.timestamp)}</span>
                    <span className="event-category">{event.category}</span>
                  </div>

                  <div className="event-body">
                    <h4 className="event-action">{event.action}</h4>
                    <p className="event-description">
                      {event.username} ({event.userRole})
                      {event.resourceName && ` • ${event.resourceName}`}
                    </p>

                    {!event.success && event.errorMessage && (
                      <div className="event-error">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-11a1 1 0 00-1 1v3a1 1 0 002 0V5a1 1 0 00-1-1zm1 7a1 1 0 11-2 0 1 1 0 012 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{event.errorMessage}</span>
                      </div>
                    )}
                  </div>

                  <div className="event-footer">
                    <span className={`status-badge ${event.success ? 'success' : 'failure'}`}>
                      {event.success ? 'Success' : 'Failed'}
                    </span>
                    <span className="severity-badge">{event.severity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {events.length === 0 && (
        <div className="no-events">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="30" stroke="#e2e8f0" strokeWidth="4" />
            <path
              d="M32 16v16M32 40v.01"
              stroke="#cbd5e0"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
          <p>No audit events found</p>
        </div>
      )}

      <style jsx>{`
        .audit-timeline {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .timeline-date-group {
          margin-bottom: 32px;
        }

        .timeline-date-group:last-child {
          margin-bottom: 0;
        }

        .timeline-date-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
        }

        .date-label {
          font-size: 16px;
          font-weight: 600;
          color: #2d3748;
        }

        .event-count {
          font-size: 13px;
          color: #718096;
        }

        .timeline-events {
          position: relative;
        }

        .timeline-event {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .timeline-event:last-child {
          margin-bottom: 0;
        }

        .timeline-event:hover .timeline-content {
          background: #f7fafc;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .timeline-marker {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .timeline-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--severity-color);
          border: 3px solid white;
          box-shadow: 0 0 0 2px var(--severity-color);
          z-index: 1;
        }

        .timeline-line {
          width: 2px;
          flex: 1;
          background: #e2e8f0;
          margin-top: 4px;
        }

        .timeline-content {
          flex: 1;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          transition: all 0.2s;
        }

        .event-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .event-time {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          color: #718096;
        }

        .event-category {
          padding: 4px 10px;
          background: #edf2f7;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #4a5568;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .event-body {
          margin-bottom: 12px;
        }

        .event-action {
          margin: 0 0 6px 0;
          font-size: 15px;
          font-weight: 600;
          color: #1a202c;
        }

        .event-description {
          margin: 0;
          font-size: 14px;
          color: #4a5568;
        }

        .event-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          margin-top: 12px;
          padding: 10px;
          background: #fff5f5;
          border-radius: 6px;
          font-size: 13px;
          color: #c53030;
        }

        .event-error svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .event-footer {
          display: flex;
          gap: 8px;
        }

        .status-badge,
        .severity-badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge.success {
          background: #c6f6d5;
          color: #22543d;
        }

        .status-badge.failure {
          background: #fed7d7;
          color: #742a2a;
        }

        .severity-badge {
          background: #edf2f7;
          color: #4a5568;
        }

        .no-events {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          color: #a0aec0;
        }

        .no-events p {
          margin-top: 16px;
          font-size: 16px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default AuditLogTimeline;
