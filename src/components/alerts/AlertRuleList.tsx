/**
 * AlertRuleList Component
 * List of active and inactive alert rules with management actions
 */

import React, { useState } from 'react';
import { useAlertRules } from '../../hooks/useAlertRules';
import { AlertStatusIndicator } from './AlertStatusIndicator';
import { conditionToString } from '../../utils/alertConditionBuilder';
import type { AlertRule } from '../../types/alert';
import { formatDistanceToNow } from 'date-fns';

interface AlertRuleListProps {
  onEdit?: (rule: AlertRule) => void;
  onTest?: (rule: AlertRule) => void;
}

export const AlertRuleList: React.FC<AlertRuleListProps> = ({ onEdit, onTest }) => {
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    search: '',
  });

  const {
    rules,
    total,
    isLoading,
    deleteRule,
    toggleRule,
    duplicateRule,
    testRule,
    isTesting,
  } = useAlertRules(filters);

  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const handleToggle = (id: string, currentStatus: string) => {
    toggleRule({ id, enabled: currentStatus !== 'enabled' });
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the rule "${name}"?`)) {
      deleteRule(id);
    }
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Alert Rules</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search rules..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filters.severity}
            onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="enabled">Enabled</option>
            <option value="disabled">Disabled</option>
            <option value="error">Error</option>
          </select>
        </div>
      </div>

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {rules.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No alert rules found. Create your first rule to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Rule Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{rule.name}</h3>
                      <AlertStatusIndicator
                        severity={rule.severity}
                        status="active"
                      />
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rule.status === 'enabled'
                            ? 'bg-green-100 text-green-800'
                            : rule.status === 'disabled'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {rule.status}
                      </span>
                      {rule.priority > 5 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          High Priority
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {rule.description && (
                      <p className="text-gray-600 mb-2">{rule.description}</p>
                    )}

                    {/* Condition */}
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <span className="font-medium text-gray-700">Condition:</span>
                      <code className="px-2 py-1 bg-gray-100 text-gray-800 rounded font-mono text-xs">
                        {conditionToString(rule.condition)}
                      </code>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      {rule.lastTriggered && (
                        <span>
                          Last triggered: {formatDistanceToNow(new Date(rule.lastTriggered), { addSuffix: true })}
                        </span>
                      )}
                      {rule.triggerCount !== undefined && (
                        <span>{rule.triggerCount} total triggers</span>
                      )}
                      <span>
                        Created {formatDistanceToNow(new Date(rule.createdAt), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Expanded Details */}
                    {expandedRule === rule.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Cooldown:</span>
                          <span className="ml-2 text-gray-600">
                            {rule.cooldownMinutes || 0} minutes
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Priority:</span>
                          <span className="ml-2 text-gray-600">{rule.priority || 0}</span>
                        </div>
                        {rule.tags && rule.tags.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-700">Tags:</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {rule.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => handleToggle(rule.id, rule.status)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        rule.status === 'enabled'
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      aria-label={rule.status === 'enabled' ? 'Disable rule' : 'Enable rule'}
                    >
                      {rule.status === 'enabled' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => onEdit?.(rule)}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                      aria-label="Edit rule"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        testRule(rule.id);
                        onTest?.(rule);
                      }}
                      disabled={isTesting}
                      className="px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors font-medium disabled:opacity-50"
                      aria-label="Test rule"
                    >
                      {isTesting ? 'Testing...' : 'Test'}
                    </button>
                    <button
                      onClick={() => duplicateRule(rule.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      aria-label="Duplicate rule"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      aria-label="Toggle details"
                    >
                      {expandedRule === rule.id ? 'Less' : 'More'}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id, rule.name)}
                      className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors font-medium"
                      aria-label="Delete rule"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Info */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Showing {rules.length} of {total} rules</span>
        </div>
      )}
    </div>
  );
};

export default AlertRuleList;
