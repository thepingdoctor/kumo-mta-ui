/**
 * AlertDashboard Component
 * Main alerts overview with statistics and recent alerts
 */

import React, { useState } from 'react';
import { useAlerts } from '../../hooks/useAlerts';
import { useAlertStats } from '../../hooks/useAlerts';
import { AlertStatusIndicator } from './AlertStatusIndicator';
import { formatDistanceToNow } from 'date-fns';

export const AlertDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const { stats, isLoading: statsLoading } = useAlertStats(timeRange);
  const { alerts, isLoading: alertsLoading, acknowledgeAlert, snoozeAlert, resolveAlert, dismissAlert } = useAlerts({
    limit: 10,
  });

  const handleQuickAction = (alertId: string, action: 'acknowledge' | 'snooze' | 'resolve' | 'dismiss') => {
    switch (action) {
      case 'acknowledge':
        acknowledgeAlert({ id: alertId });
        break;
      case 'snooze':
        snoozeAlert({ id: alertId, duration: 3600 }); // 1 hour
        break;
      case 'resolve':
        resolveAlert({ id: alertId });
        break;
      case 'dismiss':
        dismissAlert(alertId);
        break;
    }
  };

  if (statsLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Alert Dashboard</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === '24h'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            24h
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === '7d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            7d
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeRange === '30d'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            30d
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Total Alerts</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalAlerts || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Active Alerts</h3>
            <span className="text-2xl">🔴</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">{stats?.activeAlerts || 0}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Critical</h3>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {stats?.alertsBySeverity?.critical || 0}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Warning</h3>
            <span className="text-2xl">⚡</span>
          </div>
          <p className="mt-2 text-3xl font-bold text-yellow-600">
            {stats?.alertsBySeverity?.warning || 0}
          </p>
        </div>
      </div>

      {/* Alert Trend Chart */}
      {stats?.alertTrend && stats.alertTrend.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Trends</h2>
          <div className="h-64 flex items-end gap-2">
            {stats.alertTrend.map((trend, index) => {
              const maxCount = Math.max(...stats.alertTrend.map(t => t.count));
              const height = (trend.count / maxCount) * 100;
              const severityColor =
                trend.severity === 'critical' ? 'bg-red-500' :
                trend.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full ${severityColor} rounded-t transition-all hover:opacity-80`}
                    style={{ height: `${height}%` }}
                    title={`${trend.count} alerts`}
                  />
                  <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                    {new Date(trend.timestamp).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {alerts.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No recent alerts
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertStatusIndicator severity={alert.severity} status={alert.status} />
                      <h3 className="font-semibold text-gray-900">{alert.ruleName}</h3>
                    </div>
                    <p className="text-gray-600 mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-500">
                      Triggered {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {alert.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleQuickAction(alert.id, 'acknowledge')}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          aria-label="Acknowledge alert"
                        >
                          Acknowledge
                        </button>
                        <button
                          onClick={() => handleQuickAction(alert.id, 'snooze')}
                          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                          aria-label="Snooze alert"
                        >
                          Snooze
                        </button>
                        <button
                          onClick={() => handleQuickAction(alert.id, 'resolve')}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          aria-label="Resolve alert"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleQuickAction(alert.id, 'dismiss')}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          aria-label="Dismiss alert"
                        >
                          Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {alert.notificationsSent && alert.notificationsSent.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                    <span>Notifications sent:</span>
                    {alert.notificationsSent.map((notification, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded ${
                          notification.status === 'sent'
                            ? 'bg-green-100 text-green-800'
                            : notification.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {notification.channelType}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Top Triggered Rules */}
      {stats?.topTriggeredRules && stats.topTriggeredRules.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Most Triggered Rules</h2>
          <div className="space-y-3">
            {stats.topTriggeredRules.map((rule) => (
              <div key={rule.ruleId} className="flex items-center justify-between py-2">
                <span className="font-medium text-gray-900">{rule.ruleName}</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">
                  {rule.count} triggers
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertDashboard;
