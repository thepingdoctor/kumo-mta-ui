/**
 * Alert Rule Validation Utilities
 * Validates alert rule configurations before saving
 */

import type {
  AlertRule,
  AlertRuleValidation,
  AlertCondition,
  CompositeCondition,
  NotificationChannel,
} from '../types/alert';

const VALID_METRICS = [
  'queue_depth',
  'bounce_rate',
  'delivery_rate',
  'system_cpu',
  'system_memory',
  'system_disk',
  'message_rate',
  'error_rate',
  'response_time',
];

const METRIC_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  queue_depth: { min: 0, max: 1000000, unit: 'messages' },
  bounce_rate: { min: 0, max: 100, unit: '%' },
  delivery_rate: { min: 0, max: 100, unit: '%' },
  system_cpu: { min: 0, max: 100, unit: '%' },
  system_memory: { min: 0, max: 100, unit: '%' },
  system_disk: { min: 0, max: 100, unit: '%' },
  message_rate: { min: 0, max: 1000000, unit: 'msg/s' },
  error_rate: { min: 0, max: 100, unit: '%' },
  response_time: { min: 0, max: 60000, unit: 'ms' },
};

export function validateAlertRule(rule: Partial<AlertRule>): AlertRuleValidation {
  const errors: { field: string; message: string }[] = [];
  const warnings: { field: string; message: string }[] = [];

  // Validate name
  if (!rule.name || rule.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Alert rule name is required' });
  } else if (rule.name.length > 100) {
    errors.push({ field: 'name', message: 'Alert rule name must be 100 characters or less' });
  }

  // Validate severity
  if (!rule.severity || !['info', 'warning', 'critical'].includes(rule.severity)) {
    errors.push({ field: 'severity', message: 'Invalid severity level' });
  }

  // Validate condition
  if (!rule.condition) {
    errors.push({ field: 'condition', message: 'Alert condition is required' });
  } else {
    const conditionErrors = validateCondition(rule.condition);
    errors.push(...conditionErrors);
  }

  // Validate notification channels
  if (!rule.notificationChannels || rule.notificationChannels.length === 0) {
    errors.push({ field: 'notificationChannels', message: 'At least one notification channel is required' });
  }

  // Validate cooldown
  if (rule.cooldownMinutes !== undefined) {
    if (rule.cooldownMinutes < 0) {
      errors.push({ field: 'cooldownMinutes', message: 'Cooldown cannot be negative' });
    } else if (rule.cooldownMinutes > 1440) {
      warnings.push({ field: 'cooldownMinutes', message: 'Cooldown exceeds 24 hours' });
    }
  }

  // Validate priority
  if (rule.priority !== undefined && (rule.priority < 0 || rule.priority > 10)) {
    errors.push({ field: 'priority', message: 'Priority must be between 0 and 10' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function validateCondition(condition: AlertCondition | CompositeCondition): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = [];

  if ('type' in condition) {
    // Composite condition
    if (!['AND', 'OR'].includes(condition.type)) {
      errors.push({ field: 'condition.type', message: 'Invalid composite condition type' });
    }
    if (!condition.conditions || condition.conditions.length === 0) {
      errors.push({ field: 'condition.conditions', message: 'Composite condition must have at least one sub-condition' });
    } else {
      condition.conditions.forEach((subCondition, index) => {
        const subErrors = validateCondition(subCondition);
        errors.push(...subErrors.map(e => ({ ...e, field: `condition.conditions[${index}].${e.field}` })));
      });
    }
  } else {
    // Simple condition
    if (!condition.metric || !VALID_METRICS.includes(condition.metric)) {
      errors.push({ field: 'condition.metric', message: 'Invalid metric' });
    }

    if (!condition.operator || !['>', '<', '>=', '<=', '==', '!='].includes(condition.operator)) {
      errors.push({ field: 'condition.operator', message: 'Invalid comparison operator' });
    }

    if (condition.threshold === undefined || condition.threshold === null) {
      errors.push({ field: 'condition.threshold', message: 'Threshold is required' });
    } else if (condition.metric && METRIC_RANGES[condition.metric]) {
      const range = METRIC_RANGES[condition.metric];
      if (condition.threshold < range.min || condition.threshold > range.max) {
        errors.push({
          field: 'condition.threshold',
          message: `Threshold must be between ${range.min} and ${range.max} ${range.unit}`,
        });
      }
    }

    if (condition.timeWindow && !['5m', '15m', '30m', '1h', '4h', '24h', '7d'].includes(condition.timeWindow)) {
      errors.push({ field: 'condition.timeWindow', message: 'Invalid time window' });
    }
  }

  return errors;
}

export function validateNotificationChannel(channel: Partial<NotificationChannel>): AlertRuleValidation {
  const errors: { field: string; message: string }[] = [];
  const warnings: { field: string; message: string }[] = [];

  // Validate name
  if (!channel.name || channel.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Channel name is required' });
  }

  // Validate type
  if (!channel.type || !['email', 'slack', 'webhook', 'pagerduty'].includes(channel.type)) {
    errors.push({ field: 'type', message: 'Invalid channel type' });
  }

  // Type-specific validation
  if (channel.type === 'email' && channel.config) {
    const config = channel.config as any;
    if (!config.recipients || config.recipients.length === 0) {
      errors.push({ field: 'config.recipients', message: 'At least one recipient is required' });
    } else {
      const invalidEmails = config.recipients.filter((email: string) => !isValidEmail(email));
      if (invalidEmails.length > 0) {
        errors.push({ field: 'config.recipients', message: `Invalid email addresses: ${invalidEmails.join(', ')}` });
      }
    }
    if (!config.subject || config.subject.trim().length === 0) {
      errors.push({ field: 'config.subject', message: 'Email subject is required' });
    }
    if (!config.bodyTemplate || config.bodyTemplate.trim().length === 0) {
      errors.push({ field: 'config.bodyTemplate', message: 'Email body template is required' });
    }
  }

  if (channel.type === 'slack' && channel.config) {
    const config = channel.config as any;
    if (!config.webhookUrl || !isValidUrl(config.webhookUrl)) {
      errors.push({ field: 'config.webhookUrl', message: 'Valid Slack webhook URL is required' });
    }
  }

  if (channel.type === 'webhook' && channel.config) {
    const config = channel.config as any;
    if (!config.url || !isValidUrl(config.url)) {
      errors.push({ field: 'config.url', message: 'Valid webhook URL is required' });
    }
    if (!config.method || !['POST', 'PUT', 'PATCH'].includes(config.method)) {
      errors.push({ field: 'config.method', message: 'Invalid HTTP method' });
    }
    if (!config.bodyTemplate || config.bodyTemplate.trim().length === 0) {
      errors.push({ field: 'config.bodyTemplate', message: 'Webhook body template is required' });
    }
  }

  if (channel.type === 'pagerduty' && channel.config) {
    const config = channel.config as any;
    if (!config.integrationKey || config.integrationKey.trim().length === 0) {
      errors.push({ field: 'config.integrationKey', message: 'PagerDuty integration key is required' });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getMetricInfo(metric: string): { min: number; max: number; unit: string } | null {
  return METRIC_RANGES[metric] || null;
}

export function getAvailableMetrics(): string[] {
  return VALID_METRICS;
}
