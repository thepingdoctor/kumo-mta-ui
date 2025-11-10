/**
 * Type definitions for KumoMTA UI Backend
 */

// WebSocket Event Types
export interface QueueUpdate {
  queueName: string;
  size: number;
  ready: number;
  scheduled: number;
  timestamp: number;
}

export interface MetricsUpdate {
  delivered: number;
  bounced: number;
  deferred: number;
  throughput: number;
  timestamp: number;
}

export interface MessageStatus {
  messageId: string;
  status: 'queued' | 'delivered' | 'bounced' | 'deferred' | 'failed';
  queue: string;
  timestamp: number;
  details?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  kumoMtaStatus: 'healthy' | 'degraded' | 'down';
  timestamp: number;
}

// Alert System Types
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  condition: AlertCondition;
  channels: AlertChannel[];
  throttle?: {
    period: number; // milliseconds
    maxAlerts: number;
  };
}

export interface AlertCondition {
  type: 'queue_depth' | 'bounce_rate' | 'delivery_rate' | 'domain_suspension' | 'system_health';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  timeWindow?: number; // milliseconds
  aggregation?: 'avg' | 'sum' | 'max' | 'min';
}

export type AlertChannel = 'email' | 'slack' | 'webhook';

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertRule['severity'];
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
}

export interface NotificationPayload {
  alert: Alert;
  rule: AlertRule;
}

// Authentication Types
export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthToken {
  userId: string;
  username: string;
  roles: string[];
}

// KumoMTA API Types
export interface KumoQueueData {
  name: string;
  size: number;
  ready: number;
  scheduled: number;
}

export interface KumoMetrics {
  counters: {
    delivered: number;
    bounced: number;
    deferred: number;
  };
  gauges: {
    queue_size: number;
  };
  timestamp: number;
}

// Configuration Types
export interface ServerConfig {
  port: number;
  corsOrigin: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  kumoMtaApiUrl: string;
  kumoMtaApiToken?: string;
}

export interface AlertConfig {
  smtp?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  };
  slack?: {
    webhookUrl: string;
  };
  webhook?: {
    url: string;
  };
}
