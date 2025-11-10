/**
 * AlertHistory Component
 * Triggered alerts log with filtering and search
 */

import React, { useState } from 'react';
import { useAlertHistory } from '../../hooks/useAlertHistory';
import { AlertStatusIndicator } from './AlertStatusIndicator';
import type { Alert } from '../../types/alert';
import { format, formatDistanceToNow } from 'date-fns';

export const AlertHistory: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    ruleId: '',
    startDate: '',
    endDate: '',
    limit: 50,
    offset: 0,
  });

  const { alerts, total, isLoading } = useAlertHistory(filters);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handlePageChange = (newOffset: number) => {
    setFilters({ ...filters, offset: newOffset });
  };

  const openDetails = (alert: Alert) => {
    setSelectedAlert(alert);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Alert History</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label htmlFor="severity-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              id="severity-filter"
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="info">Info</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="snoozed">Snoozed</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, offset: 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({
                status: '',
                severity: '',
                ruleId: '',
                startDate: '',
                endDate: '',
                limit: 50,
                offset: 0,
              })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Triggered
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No alerts found matching your filters
                  </td>
                </tr>
              ) : (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <AlertStatusIndicator severity={alert.severity} status={alert.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{alert.ruleName}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {alert.message}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{format(new Date(alert.triggeredAt), 'MMM d, yyyy')}</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(alert.triggeredAt), 'HH:mm:ss')}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          alert.status === 'active'
                            ? 'bg-red-100 text-red-800'
                            : alert.status === 'resolved'
                            ? 'bg-green-100 text-green-800'
                            : alert.status === 'acknowledged'
                            ? 'bg-blue-100 text-blue-800'
                            : alert.status === 'snoozed'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {alert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openDetails(alert)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > filters.limit && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filters.offset + 1} to {Math.min(filters.offset + filters.limit, total)} of {total} alerts
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
                disabled={filters.offset === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(filters.offset + filters.limit)}
                disabled={filters.offset + filters.limit >= total}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alert Details Modal */}
      {showDetails && selectedAlert && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Alert Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Rule Name</label>
                <p className="mt-1 text-gray-900">{selectedAlert.ruleName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <p className="mt-1 text-gray-900">{selectedAlert.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Severity</label>
                  <div className="mt-1">
                    <AlertStatusIndicator
                      severity={selectedAlert.severity}
                      status={selectedAlert.status}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <p className="mt-1 text-gray-900 capitalize">{selectedAlert.status}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Triggered At</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(selectedAlert.triggeredAt), 'PPpp')}
                </p>
              </div>
              {selectedAlert.acknowledgedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Acknowledged At</label>
                  <p className="mt-1 text-gray-900">
                    {format(new Date(selectedAlert.acknowledgedAt), 'PPpp')}
                    {selectedAlert.acknowledgedBy && ` by ${selectedAlert.acknowledgedBy}`}
                  </p>
                </div>
              )}
              {selectedAlert.resolvedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Resolved At</label>
                  <p className="mt-1 text-gray-900">
                    {format(new Date(selectedAlert.resolvedAt), 'PPpp')}
                    {selectedAlert.resolvedBy && ` by ${selectedAlert.resolvedBy}`}
                  </p>
                </div>
              )}
              {selectedAlert.details && Object.keys(selectedAlert.details).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Additional Details</label>
                  <pre className="mt-1 p-3 bg-gray-50 rounded-lg text-xs text-gray-800 overflow-auto">
                    {JSON.stringify(selectedAlert.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedAlert.notificationsSent && selectedAlert.notificationsSent.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Notifications Sent</label>
                  <div className="mt-2 space-y-2">
                    {selectedAlert.notificationsSent.map((notification, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-gray-900">
                            {notification.channelType}
                          </span>
                          <p className="text-xs text-gray-500">
                            {format(new Date(notification.sentAt), 'PPpp')}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            notification.status === 'sent'
                              ? 'bg-green-100 text-green-800'
                              : notification.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {notification.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowDetails(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertHistory;
