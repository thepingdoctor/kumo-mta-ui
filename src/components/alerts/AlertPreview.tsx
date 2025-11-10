/**
 * AlertPreview Component
 * Test alert before activation with live preview
 */

import React, { useState } from 'react';
import { useAlertRules } from '../../hooks/useAlertRules';
import { AlertStatusIndicator } from './AlertStatusIndicator';
import type { AlertRule } from '../../types/alert';
import { conditionToString } from '../../utils/alertConditionBuilder';

interface AlertPreviewProps {
  rule?: AlertRule;
  ruleId?: string;
  onClose?: () => void;
}

export const AlertPreview: React.FC<AlertPreviewProps> = ({ rule, ruleId, onClose }) => {
  const { testRule, testResult, isTesting } = useAlertRules();
  const [testRunning, setTestRunning] = useState(false);

  const handleTest = async () => {
    if (!rule && !ruleId) return;

    setTestRunning(true);
    const id = ruleId || rule?.id;
    if (id) {
      await testRule(id);
    }
    setTestRunning(false);
  };

  const displayRule = rule;

  if (!displayRule && !ruleId) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No rule selected for preview</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Alert Preview & Test</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
        {displayRule && (
          <p className="text-blue-100 mt-1">Testing: {displayRule.name}</p>
        )}
      </div>

      {displayRule && (
        <div className="p-6 space-y-6">
          {/* Rule Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Rule Configuration</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-medium text-gray-900 mt-1">{displayRule.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Severity:</span>
                <div className="mt-1">
                  <AlertStatusIndicator severity={displayRule.severity} status="active" />
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Condition:</span>
                <code className="block mt-1 px-3 py-2 bg-white rounded border border-gray-200 font-mono text-xs">
                  {conditionToString(displayRule.condition)}
                </code>
              </div>
              {displayRule.description && (
                <div className="col-span-2">
                  <span className="text-gray-600">Description:</span>
                  <p className="text-gray-900 mt-1">{displayRule.description}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Priority:</span>
                <p className="text-gray-900 mt-1">{displayRule.priority || 0}</p>
              </div>
              <div>
                <span className="text-gray-600">Cooldown:</span>
                <p className="text-gray-900 mt-1">{displayRule.cooldownMinutes || 0} minutes</p>
              </div>
            </div>
          </div>

          {/* Test Controls */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Test Alert</h3>
            <p className="text-sm text-gray-600 mb-4">
              Click the button below to test this alert rule. This will evaluate the current system state
              against the configured condition and show whether the alert would trigger.
            </p>
            <button
              onClick={handleTest}
              disabled={isTesting || testRunning}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isTesting || testRunning ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Testing Alert...
                </span>
              ) : (
                'Run Test'
              )}
            </button>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className={`border-t border-gray-200 pt-6`}>
              <h3 className="font-semibold text-gray-900 mb-3">Test Results</h3>
              <div
                className={`p-4 rounded-lg ${
                  testResult.success
                    ? testResult.triggered
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {testResult.success
                      ? testResult.triggered
                        ? '🔔'
                        : '✓'
                      : '⚠️'}
                  </span>
                  <div className="flex-1">
                    <h4
                      className={`font-semibold mb-1 ${
                        testResult.success
                          ? testResult.triggered
                            ? 'text-red-800'
                            : 'text-green-800'
                          : 'text-yellow-800'
                      }`}
                    >
                      {testResult.success
                        ? testResult.triggered
                          ? 'Alert Would Trigger'
                          : 'Alert Would Not Trigger'
                        : 'Test Completed with Warnings'}
                    </h4>
                    <p
                      className={`text-sm ${
                        testResult.success
                          ? testResult.triggered
                            ? 'text-red-700'
                            : 'text-green-700'
                          : 'text-yellow-700'
                      }`}
                    >
                      {testResult.message}
                    </p>

                    {testResult.currentValue !== undefined && (
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Current Value:</span>
                          <span className="font-mono font-medium">{testResult.currentValue}</span>
                        </div>
                        {testResult.threshold !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Threshold:</span>
                            <span className="font-mono font-medium">{testResult.threshold}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {testResult.estimatedNotifications !== undefined && testResult.estimatedNotifications > 0 && (
                      <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Estimated Notifications:</span>{' '}
                          {testResult.estimatedNotifications} channel(s) would be notified
                        </p>
                      </div>
                    )}

                    <p className="mt-3 text-xs text-gray-500">
                      Test completed at {new Date(testResult.testTimestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview Example */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Example Alert Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🔔</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertStatusIndicator severity={displayRule.severity} status="active" />
                    <span className="font-semibold text-gray-900">{displayRule.name}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">
                    {displayRule.description || 'This is how your alert will appear when triggered.'}
                  </p>
                  <div className="text-xs text-gray-500">
                    <p>Triggered: Just now</p>
                    <p>Condition: {conditionToString(displayRule.condition)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">ℹ️ About Testing</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Testing evaluates the rule against current system metrics</li>
              <li>No actual notifications will be sent during testing</li>
              <li>Results are based on real-time data from your system</li>
              <li>Cooldown periods are not enforced during testing</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertPreview;
