import { useWebSocket } from '../hooks/useWebSocket';

export interface WebSocketConfig {
  url: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface MetricsMessage {
  type: 'metrics';
  data: {
    messages_sent: number;
    bounces: number;
    delayed: number;
    throughput: number;
    active_connections: number;
  };
  timestamp: string;
}

export interface QueueMessage {
  type: 'queue';
  data: {
    action: 'add' | 'update' | 'remove';
    item: unknown;
  };
  timestamp: string;
}

export interface HealthMessage {
  type: 'health';
  data: {
    status: 'healthy' | 'degraded' | 'down';
    services: Record<string, string>;
  };
  timestamp: string;
}

export type WebSocketMessage = MetricsMessage | QueueMessage | HealthMessage;

/**
 * Get WebSocket URL from environment or use default
 */
export const getWebSocketURL = (): string => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = import.meta.env.VITE_WS_URL || window.location.host;
  return `${protocol}//${host}/ws/metrics`;
};

/**
 * Create WebSocket connection for real-time metrics
 */
export const useMetricsWebSocket = (
  onMessage: (message: WebSocketMessage) => void,
  options?: Partial<WebSocketConfig>
) => {
  const url = options?.url || getWebSocketURL();

  return useWebSocket({
    url,
    reconnect: options?.reconnect ?? true,
    reconnectInterval: options?.reconnectInterval ?? 3000,
    maxReconnectAttempts: options?.maxReconnectAttempts ?? 5,
    onMessage,
    onOpen: () => {
      console.log('[WebSocket] Connected to KumoMTA server');
    },
    onClose: () => {
      console.log('[WebSocket] Disconnected from server');
    },
    onError: (error) => {
      console.error('[WebSocket] Error:', error);
    },
  });
};

/**
 * Subscribe to specific message types
 */
export const subscribeToMetrics = (ws: ReturnType<typeof useWebSocket>) => {
  ws.send({
    type: 'subscribe',
    channel: 'metrics',
  });
};

export const subscribeToQueue = (ws: ReturnType<typeof useWebSocket>) => {
  ws.send({
    type: 'subscribe',
    channel: 'queue',
  });
};

export const subscribeToHealth = (ws: ReturnType<typeof useWebSocket>) => {
  ws.send({
    type: 'subscribe',
    channel: 'health',
  });
};

/**
 * Unsubscribe from message types
 */
export const unsubscribe = (
  ws: ReturnType<typeof useWebSocket>,
  channel: 'metrics' | 'queue' | 'health'
) => {
  ws.send({
    type: 'unsubscribe',
    channel,
  });
};
