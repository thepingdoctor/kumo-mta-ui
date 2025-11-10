/**
 * WebSocket event types for real-time KumoMTA updates
 */

export interface QueueUpdateEvent {
  type: 'queue_update';
  data: {
    queue_name: string;
    domain: string;
    message_count: number;
    status: string;
    timestamp: string;
  };
}

export interface MetricUpdateEvent {
  type: 'metric_update';
  data: {
    metric_name: string;
    value: number;
    labels?: Record<string, string>;
    timestamp: string;
  };
}

export interface DeliveryEvent {
  type: 'delivery';
  data: {
    message_id: string;
    recipient: string;
    domain: string;
    status: 'delivered' | 'bounced' | 'deferred';
    timestamp: string;
  };
}

export interface BounceEvent {
  type: 'bounce';
  data: {
    message_id: string;
    recipient: string;
    domain: string;
    bounce_type: 'hard' | 'soft' | 'block' | 'complaint';
    smtp_code: number;
    reason: string;
    timestamp: string;
  };
}

export interface QueueSuspendEvent {
  type: 'queue_suspend';
  data: {
    domain: string;
    reason: string;
    duration?: number;
    timestamp: string;
  };
}

export interface QueueResumeEvent {
  type: 'queue_resume';
  data: {
    domain: string;
    timestamp: string;
  };
}

export interface SystemMetricEvent {
  type: 'system_metric';
  data: {
    cpu_usage: number;
    memory_usage: number;
    active_connections: number;
    messages_per_second: number;
    timestamp: string;
  };
}

export interface ErrorEvent {
  type: 'error';
  data: {
    message: string;
    code?: string;
    details?: unknown;
    timestamp: string;
  };
}

export type WebSocketEvent =
  | QueueUpdateEvent
  | MetricUpdateEvent
  | DeliveryEvent
  | BounceEvent
  | QueueSuspendEvent
  | QueueResumeEvent
  | SystemMetricEvent
  | ErrorEvent;

export interface WebSocketSubscription {
  id: string;
  event_type: WebSocketEvent['type'] | 'all';
  filters?: Record<string, string>;
}

export interface WebSocketMessage {
  event: WebSocketEvent;
  subscription_id?: string;
}

export interface WebSocketState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  lastPing: Date | null;
  subscriptions: WebSocketSubscription[];
}
