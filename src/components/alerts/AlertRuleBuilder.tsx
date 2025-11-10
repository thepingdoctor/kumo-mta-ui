/**
 * AlertRuleBuilder Component
 * Visual alert rule configuration with no-code condition builder
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAlertRules } from '../../hooks/useAlertRules';
import { useNotificationChannels } from '../../hooks/useNotificationChannels';
import { validateAlertRule } from '../../utils/alertRuleValidator';
import { getAvailableMetrics, getMetricInfo } from '../../utils/alertRuleValidator';
import type { AlertRuleFormData, AlertSeverity, ComparisonOperator, TimeWindow } from '../../types/alert';

interface AlertRuleBuilderProps {
  ruleId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const SEVERITIES: AlertSeverity[] = ['info', 'warning', 'critical'];
const OPERATORS: ComparisonOperator[] = ['>', '<', '>=', '<=', '==', '!='];
const TIME_WINDOWS: TimeWindow[] = ['5m', '15m', '30m', '1h', '4h', '24h', '7d'];

export const AlertRuleBuilder: React.FC<AlertRuleBuilderProps> = ({
  ruleId,
  onSuccess,
  onCancel,
}) => {
  const { createRule, updateRule, isCreating, isUpdating } = useAlertRules();
  const { channels } = useNotificationChannels({ enabled: true });

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AlertRuleFormData>({
    defaultValues: {
      name: '',
      description: '',
      severity: 'warning',
      metric: '',
      operator: '>',
      threshold: 0,
      timeWindow: '15m',
      notificationChannels: [],
      cooldownMinutes: 15,
      priority: 5,
      tags: [],
    },
  });

  const watchedMetric = watch('metric');
  const metricInfo = getMetricInfo(watchedMetric);

  const onSubmit = async (data: AlertRuleFormData) => {
    // Validate before submission
    const condition = {
      id: crypto.randomUUID(),
      metric: data.metric,
      operator: data.operator,
      threshold: data.threshold,
      timeWindow: data.timeWindow,
    };

    const validation = validateAlertRule({
      ...data,
      condition,
    });

    if (!validation.isValid) {
      console.error('Validation errors:', validation.errors);
      return;
    }

    if (ruleId) {
      updateRule({ id: ruleId, data }, {
        onSuccess: () => onSuccess?.(),
      });
    } else {
      createRule(data, {
        onSuccess: () => onSuccess?.(),
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {ruleId ? 'Edit Alert Rule' : 'Create Alert Rule'}
        </h2>
        <p className="text-gray-600 mt-1">
          Configure alert conditions and notification preferences
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name *
            </label>
            <input
              {...register('name', { required: 'Rule name is required' })}
              id="name"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., High Queue Depth Alert"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe what this alert monitors..."
            />
          </div>

          <div>
            <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
              Severity Level *
            </label>
            <Controller
              name="severity"
              control={control}
              rules={{ required: 'Severity is required' }}
              render={({ field }) => (
                <select
                  {...field}
                  id="severity"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {SEVERITIES.map((severity) => (
                    <option key={severity} value={severity}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        {/* Condition Builder */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Alert Condition</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="metric" className="block text-sm font-medium text-gray-700 mb-1">
                Metric *
              </label>
              <Controller
                name="metric"
                control={control}
                rules={{ required: 'Metric is required' }}
                render={({ field }) => (
                  <select
                    {...field}
                    id="metric"
                    onChange={(e) => {
                      field.onChange(e);
                      setSelectedMetric(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select metric...</option>
                    {getAvailableMetrics().map((metric) => (
                      <option key={metric} value={metric}>
                        {metric.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.metric && (
                <p className="mt-1 text-sm text-red-600">{errors.metric.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="operator" className="block text-sm font-medium text-gray-700 mb-1">
                Operator *
              </label>
              <Controller
                name="operator"
                control={control}
                rules={{ required: 'Operator is required' }}
                render={({ field }) => (
                  <select
                    {...field}
                    id="operator"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op} value={op}>
                        {op === '>' ? 'Greater than' :
                         op === '<' ? 'Less than' :
                         op === '>=' ? 'Greater or equal' :
                         op === '<=' ? 'Less or equal' :
                         op === '==' ? 'Equal to' :
                         'Not equal to'}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            <div>
              <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">
                Threshold *
                {metricInfo && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({metricInfo.min}-{metricInfo.max} {metricInfo.unit})
                  </span>
                )}
              </label>
              <input
                {...register('threshold', {
                  required: 'Threshold is required',
                  valueAsNumber: true,
                  validate: (value) => {
                    if (metricInfo) {
                      if (value < metricInfo.min || value > metricInfo.max) {
                        return `Value must be between ${metricInfo.min} and ${metricInfo.max}`;
                      }
                    }
                    return true;
                  },
                })}
                id="threshold"
                type="number"
                step="any"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
              {errors.threshold && (
                <p className="mt-1 text-sm text-red-600">{errors.threshold.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="timeWindow" className="block text-sm font-medium text-gray-700 mb-1">
              Time Window
            </label>
            <Controller
              name="timeWindow"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  id="timeWindow"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">No time window</option>
                  {TIME_WINDOWS.map((window) => (
                    <option key={window} value={window}>
                      {window}
                    </option>
                  ))}
                </select>
              )}
            />
          </div>
        </div>

        {/* Notification Channels */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Notification Channels</h3>

          <Controller
            name="notificationChannels"
            control={control}
            rules={{ validate: (value) => value.length > 0 || 'At least one channel is required' }}
            render={({ field }) => (
              <div className="space-y-2">
                {channels.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No notification channels configured. Please create channels first.
                  </p>
                ) : (
                  channels.map((channel) => (
                    <label
                      key={channel.id}
                      className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={channel.id}
                        checked={field.value.includes(channel.id)}
                        onChange={(e) => {
                          const newValue = e.target.checked
                            ? [...field.value, channel.id]
                            : field.value.filter((id) => id !== channel.id);
                          field.onChange(newValue);
                        }}
                        className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{channel.name}</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                            {channel.type}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            )}
          />
          {errors.notificationChannels && (
            <p className="text-sm text-red-600">{errors.notificationChannels.message}</p>
          )}
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cooldownMinutes" className="block text-sm font-medium text-gray-700 mb-1">
                Cooldown Period (minutes)
              </label>
              <input
                {...register('cooldownMinutes', { valueAsNumber: true })}
                id="cooldownMinutes"
                type="number"
                min="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Minimum time between notifications for this rule
              </p>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority (0-10)
              </label>
              <input
                {...register('priority', { valueAsNumber: true, min: 0, max: 10 })}
                id="priority"
                type="number"
                min="0"
                max="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Higher priority rules are evaluated first
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isCreating || isUpdating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating || isUpdating ? 'Saving...' : ruleId ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlertRuleBuilder;
