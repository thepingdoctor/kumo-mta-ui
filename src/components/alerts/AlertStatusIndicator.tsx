/**
 * AlertStatusIndicator Component
 * Real-time alert status badge with severity colors
 */

import React from 'react';
import type { AlertSeverity, AlertStatus } from '../../types/alert';

interface AlertStatusIndicatorProps {
  severity: AlertSeverity;
  status: AlertStatus;
  count?: number;
  className?: string;
}

const severityColors: Record<AlertSeverity, string> = {
  info: 'bg-blue-100 text-blue-800 border-blue-300',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  critical: 'bg-red-100 text-red-800 border-red-300',
};

const statusIcons: Record<AlertStatus, string> = {
  active: '🔴',
  acknowledged: '✓',
  snoozed: '💤',
  resolved: '✓',
  dismissed: '✕',
};

export const AlertStatusIndicator: React.FC<AlertStatusIndicatorProps> = ({
  severity,
  status,
  count,
  className = '',
}) => {
  const colorClass = severityColors[severity];
  const icon = statusIcons[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${colorClass} ${className}`}
      role="status"
      aria-label={`${severity} alert - ${status}`}
    >
      <span className="text-base" aria-hidden="true">
        {icon}
      </span>
      <span className="capitalize">{severity}</span>
      {status !== 'active' && (
        <span className="text-xs opacity-75">({status})</span>
      )}
      {count !== undefined && count > 0 && (
        <span className="ml-1 px-2 py-0.5 bg-white bg-opacity-50 rounded-full text-xs font-bold">
          {count}
        </span>
      )}
    </div>
  );
};

export default AlertStatusIndicator;
