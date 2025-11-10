/**
 * Alert System Type Definitions
 * Comprehensive types for alert rules, conditions, notifications, and history
 */

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'snoozed' | 'resolved' | 'dismissed';
export type AlertRuleStatus = 'enabled' | 'disabled' | 'error';
export type NotificationChannelType = 'email' | 'slack' | 'webhook' | 'pagerduty';
export type ComparisonOperator = '>' | '<' | '>=' | '<=' | '==' | '!=';
export type TimeWindow = '5m' | '15m' | '30m' | '1h' | '4h' | '24h' | '7d';

/**
 * Alert Condition Types
 */
export interface AlertCondition {
  id: string;
  metric: string;
  operator: ComparisonOperator;
  threshold: number;
  timeWindow?: TimeWindow;
  groupBy?: string[];
}

export interface CompositeCondition {
  type: 'AND' | 'OR';
  conditions: (AlertCondition | CompositeCondition)[];
}

/**
 * Notification Channel Configurations
 */
export interface BaseNotificationChannel {
  id: string;
  name: string;
  type: NotificationChannelType;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailChannel extends BaseNotificationChannel {
  type: 'email';
  config: {
    recipients: string[];
    subject: string;
    bodyTemplate: string;
    includeAttachment?: boolean;
  };
}

export interface SlackChannel extends BaseNotificationChannel {
  type: 'slack';
  config: {
    webhookUrl: string;
    channel?: string;
    username?: string;
    iconEmoji?: string;
    mentions?: string[];
    useMarkdown?: boolean;
  };
}

export interface WebhookChannel extends BaseNotificationChannel {
  type: 'webhook';
  config: {
    url: string;
    method: 'POST' | 'PUT' | 'PATCH';
    headers: Record<string, string>;
    bodyTemplate: string;
    authentication?: {
      type: 'bearer' | 'apikey' | 'basic';
      credentials: Record<string, string>;
    };
    retryConfig?: {
      maxRetries: number;
      retryDelay: number;
    };
  };
}

export interface PagerDutyChannel extends BaseNotificationChannel {
  type: 'pagerduty';
  config: {
    integrationKey: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    autoResolve: boolean;
  };
}

export type NotificationChannel = EmailChannel | SlackChannel | WebhookChannel | PagerDutyChannel;

/**
 * Alert Rule Definition
 */
export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  severity: AlertSeverity;
  status: AlertRuleStatus;
  condition: AlertCondition | CompositeCondition;
  notificationChannels: string[];
  cooldownMinutes?: number;
  priority: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  lastTriggered?: string;
  triggerCount?: number;
}

/**
 * Alert Instance (Triggered Alert)
 */
export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  details: Record<string, any>;
  triggeredAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  snoozedUntil?: string;
  notificationsSent: {
    channelId: string;
    channelType: NotificationChannelType;
    sentAt: string;
    status: 'sent' | 'failed' | 'pending';
    error?: string;
  }[];
}

/**
 * Alert Statistics
 */
export interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  alertsBySeverity: Record<AlertSeverity, number>;
  alertsByStatus: Record<AlertStatus, number>;
  topTriggeredRules: {
    ruleId: string;
    ruleName: string;
    count: number;
  }[];
  alertTrend: {
    timestamp: string;
    count: number;
    severity: AlertSeverity;
  }[];
}

/**
 * Alert Rule Validation Result
 */
export interface AlertRuleValidation {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings?: {
    field: string;
    message: string;
  }[];
}

/**
 * Alert Test Result
 */
export interface AlertTestResult {
  success: boolean;
  message: string;
  triggered: boolean;
  currentValue?: number;
  threshold?: number;
  estimatedNotifications?: number;
  testTimestamp: string;
}

/**
 * Form Types
 */
export interface AlertRuleFormData {
  name: string;
  description: string;
  severity: AlertSeverity;
  metric: string;
  operator: ComparisonOperator;
  threshold: number;
  timeWindow?: TimeWindow;
  notificationChannels: string[];
  cooldownMinutes: number;
  priority: number;
  tags: string[];
}

export interface NotificationChannelFormData {
  name: string;
  type: NotificationChannelType;
  config: Record<string, any>;
}

/**
 * WebSocket Alert Updates
 */
export interface AlertUpdate {
  type: 'alert_triggered' | 'alert_resolved' | 'alert_acknowledged' | 'rule_updated';
  alert?: Alert;
  rule?: AlertRule;
  timestamp: string;
}
