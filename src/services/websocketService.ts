/**
 * WebSocket connection manager for KumoMTA real-time events
 */

import { WebSocketReconnectManager } from '../utils/websocketReconnect';
import type {
  WebSocketEvent,
  WebSocketMessage,
  WebSocketSubscription,
  WebSocketState,
} from '../types/websocket-events';

export type EventHandler = (event: WebSocketEvent) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectManager: WebSocketReconnectManager;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private state: WebSocketState = {
    connected: false,
    reconnecting: false,
    error: null,
    lastPing: null,
    subscriptions: [],
  };
  private pingInterval: NodeJS.Timeout | null = null;
  private stateChangeCallbacks: Set<(state: WebSocketState) => void> = new Set();

  constructor(url: string) {
    this.url = url;
    this.reconnectManager = new WebSocketReconnectManager();
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    if (this.ws?.readyState === WebSocket.CONNECTING) {
      console.log('[WebSocket] Connection in progress');
      return;
    }

    try {
      console.log(`[WebSocket] Connecting to ${this.url}`);
      this.ws = new WebSocket(this.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.updateState({ error: error instanceof Error ? error.message : 'Connection failed' });
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('[WebSocket] Disconnecting');
    this.reconnectManager.cancelReconnect();
    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateState({ connected: false, reconnecting: false });
  }

  /**
   * Subscribe to specific event type
   */
  subscribe(eventType: WebSocketEvent['type'] | 'all', handler: EventHandler): () => void {
    if (eventType === 'all') {
      this.globalHandlers.add(handler);
      return () => this.globalHandlers.delete(handler);
    }

    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    this.eventHandlers.get(eventType)!.add(handler);

    // Send subscription to server if connected
    if (this.state.connected) {
      this.sendSubscription(eventType);
    }

    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
      if (this.eventHandlers.get(eventType)?.size === 0) {
        this.sendUnsubscription(eventType);
      }
    };
  }

  /**
   * Send message to WebSocket server
   */
  send(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }

  /**
   * Get current connection state
   */
  getState(): WebSocketState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: WebSocketState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('[WebSocket] Connected');
    this.reconnectManager.reset();
    this.updateState({
      connected: true,
      reconnecting: false,
      error: null,
    });

    // Resubscribe to all active subscriptions
    this.resubscribeAll();

    // Start ping/pong keepalive
    this.startPing();
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[WebSocket] Disconnected (code: ${event.code}, reason: ${event.reason})`);
    this.stopPing();
    this.updateState({ connected: false });

    // Attempt reconnection unless it was a clean close
    if (!event.wasClean) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('[WebSocket] Error:', event);
    this.updateState({ error: 'WebSocket error occurred' });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      // Handle pong response
      if (message.event?.type === 'pong') {
        this.updateState({ lastPing: new Date() });
        return;
      }

      // Emit to global handlers
      this.globalHandlers.forEach((handler) => {
        try {
          handler(message.event);
        } catch (error) {
          console.error('[WebSocket] Global handler error:', error);
        }
      });

      // Emit to type-specific handlers
      const handlers = this.eventHandlers.get(message.event.type);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message.event);
          } catch (error) {
            console.error(`[WebSocket] Handler error for ${message.event.type}:`, error);
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (!this.reconnectManager.canReconnect()) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.updateState({ error: 'Connection failed - max attempts reached' });
      return;
    }

    this.updateState({ reconnecting: true });

    this.reconnectManager.scheduleReconnect(() => {
      this.connect();
    });
  }

  /**
   * Start ping/pong keepalive
   */
  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping/pong keepalive
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Send subscription request to server
   */
  private sendSubscription(eventType: string): void {
    const subscription: WebSocketSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      event_type: eventType as WebSocketEvent['type'],
    };

    this.subscriptions.set(eventType, subscription);
    this.send({
      type: 'subscribe',
      subscription,
    });

    this.updateState({
      subscriptions: Array.from(this.subscriptions.values()),
    });
  }

  /**
   * Send unsubscription request to server
   */
  private sendUnsubscription(eventType: string): void {
    const subscription = this.subscriptions.get(eventType);
    if (subscription) {
      this.send({
        type: 'unsubscribe',
        subscription_id: subscription.id,
      });
      this.subscriptions.delete(eventType);

      this.updateState({
        subscriptions: Array.from(this.subscriptions.values()),
      });
    }
  }

  /**
   * Resubscribe to all active subscriptions
   */
  private resubscribeAll(): void {
    const eventTypes = Array.from(this.eventHandlers.keys());
    eventTypes.forEach((eventType) => {
      this.sendSubscription(eventType);
    });
  }

  /**
   * Update internal state and notify callbacks
   */
  private updateState(updates: Partial<WebSocketState>): void {
    this.state = { ...this.state, ...updates };
    this.stateChangeCallbacks.forEach((callback) => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('[WebSocket] State change callback error:', error);
      }
    });
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

/**
 * Get or create WebSocket service instance
 */
export const getWebSocketService = (): WebSocketService => {
  if (!wsService) {
    const wsUrl =
      import.meta.env.VITE_WS_URL ||
      `ws://${window.location.hostname}:${import.meta.env.VITE_API_PORT || 8000}/ws`;
    wsService = new WebSocketService(wsUrl);
  }
  return wsService;
};
