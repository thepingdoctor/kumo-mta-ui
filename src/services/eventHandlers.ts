/**
 * Event type handlers for WebSocket events
 */

import type {
  WebSocketEvent,
  QueueUpdateEvent,
  MetricUpdateEvent,
  DeliveryEvent,
  BounceEvent,
  QueueSuspendEvent,
  QueueResumeEvent,
  SystemMetricEvent,
  ErrorEvent,
} from '../types/websocket-events';

export type EventHandlerFunction<T extends WebSocketEvent = WebSocketEvent> = (
  event: T
) => void;

/**
 * Queue update event handler
 */
export const handleQueueUpdate = (
  event: QueueUpdateEvent,
  callback: (data: QueueUpdateEvent['data']) => void
): void => {
  callback(event.data);
};

/**
 * Metric update event handler
 */
export const handleMetricUpdate = (
  event: MetricUpdateEvent,
  callback: (data: MetricUpdateEvent['data']) => void
): void => {
  callback(event.data);
};

/**
 * Delivery event handler
 */
export const handleDelivery = (
  event: DeliveryEvent,
  callback: (data: DeliveryEvent['data']) => void
): void => {
  callback(event.data);
};

/**
 * Bounce event handler
 */
export const handleBounce = (
  event: BounceEvent,
  callback: (data: BounceEvent['data']) => void
): void => {
  callback(event.data);
};

/**
 * Queue suspend event handler
 */
export const handleQueueSuspend = (
  event: QueueSuspendEvent,
  callback: (data: QueueSuspendEvent['data']) => void
): void => {
  callback(event.data);
};

/**
 * Queue resume event handler
 */
export const handleQueueResume = (
  event: QueueResumeEvent,
  callback: (data: QueueResumeEvent['data']) => void
): void => {
  callback(event.data);
};

/**
 * System metric event handler
 */
export const handleSystemMetric = (
  event: SystemMetricEvent,
  callback: (data: SystemMetricEvent['data']) => void
): void => {
  callback(event.data);
};

/**
 * Error event handler
 */
export const handleError = (
  event: ErrorEvent,
  callback: (data: ErrorEvent['data']) => void
): void => {
  callback(event.data);
};

/**
 * Generic event router
 */
export const routeEvent = (
  event: WebSocketEvent,
  handlers: {
    onQueueUpdate?: EventHandlerFunction<QueueUpdateEvent>;
    onMetricUpdate?: EventHandlerFunction<MetricUpdateEvent>;
    onDelivery?: EventHandlerFunction<DeliveryEvent>;
    onBounce?: EventHandlerFunction<BounceEvent>;
    onQueueSuspend?: EventHandlerFunction<QueueSuspendEvent>;
    onQueueResume?: EventHandlerFunction<QueueResumeEvent>;
    onSystemMetric?: EventHandlerFunction<SystemMetricEvent>;
    onError?: EventHandlerFunction<ErrorEvent>;
  }
): void => {
  switch (event.type) {
    case 'queue_update':
      handlers.onQueueUpdate?.(event as QueueUpdateEvent);
      break;
    case 'metric_update':
      handlers.onMetricUpdate?.(event as MetricUpdateEvent);
      break;
    case 'delivery':
      handlers.onDelivery?.(event as DeliveryEvent);
      break;
    case 'bounce':
      handlers.onBounce?.(event as BounceEvent);
      break;
    case 'queue_suspend':
      handlers.onQueueSuspend?.(event as QueueSuspendEvent);
      break;
    case 'queue_resume':
      handlers.onQueueResume?.(event as QueueResumeEvent);
      break;
    case 'system_metric':
      handlers.onSystemMetric?.(event as SystemMetricEvent);
      break;
    case 'error':
      handlers.onError?.(event as ErrorEvent);
      break;
    default:
      console.warn('[EventHandler] Unknown event type:', event);
  }
};

/**
 * Aggregate events by time window
 */
export class EventAggregator {
  private events: Map<string, WebSocketEvent[]> = new Map();
  private windowMs: number;
  private flushCallback: (events: Map<string, WebSocketEvent[]>) => void;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(
    windowMs: number,
    flushCallback: (events: Map<string, WebSocketEvent[]>) => void
  ) {
    this.windowMs = windowMs;
    this.flushCallback = flushCallback;
    this.startFlushInterval();
  }

  add(event: WebSocketEvent): void {
    if (!this.events.has(event.type)) {
      this.events.set(event.type, []);
    }
    this.events.get(event.type)!.push(event);
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.windowMs);
  }

  flush(): void {
    if (this.events.size > 0) {
      this.flushCallback(new Map(this.events));
      this.events.clear();
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush(); // Final flush
  }
}
