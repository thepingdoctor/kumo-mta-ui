/**
 * React hook for real-time queue updates via WebSocket
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketService } from '../services/websocketService';
import type { QueueUpdateEvent } from '../types/websocket-events';

export interface RealtimeQueueUpdate {
  queue_name: string;
  domain: string;
  message_count: number;
  status: string;
  timestamp: Date;
}

export interface UseRealtimeQueueOptions {
  domain?: string;
  enabled?: boolean;
  onUpdate?: (update: RealtimeQueueUpdate) => void;
}

export interface UseRealtimeQueueReturn {
  updates: RealtimeQueueUpdate[];
  lastUpdate: RealtimeQueueUpdate | null;
  isConnected: boolean;
  error: string | null;
  clearUpdates: () => void;
}

/**
 * Hook for subscribing to real-time queue updates
 */
export const useRealtimeQueue = (
  options: UseRealtimeQueueOptions = {}
): UseRealtimeQueueReturn => {
  const { domain, enabled = true, onUpdate } = options;

  const [updates, setUpdates] = useState<RealtimeQueueUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<RealtimeQueueUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsServiceRef = useRef(getWebSocketService());
  const maxUpdatesRef = useRef(100); // Keep last 100 updates

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setLastUpdate(null);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const wsService = wsServiceRef.current;

    // Connect to WebSocket
    wsService.connect();

    // Subscribe to state changes
    const unsubscribeState = wsService.onStateChange((state) => {
      setIsConnected(state.connected);
      setError(state.error);
    });

    // Subscribe to queue updates
    const unsubscribeEvents = wsService.subscribe('queue_update', (event) => {
      const queueEvent = event as QueueUpdateEvent;

      // Filter by domain if specified
      if (domain && queueEvent.data.domain !== domain) {
        return;
      }

      const update: RealtimeQueueUpdate = {
        queue_name: queueEvent.data.queue_name,
        domain: queueEvent.data.domain,
        message_count: queueEvent.data.message_count,
        status: queueEvent.data.status,
        timestamp: new Date(queueEvent.data.timestamp),
      };

      setLastUpdate(update);

      setUpdates((prev) => {
        const newUpdates = [update, ...prev].slice(0, maxUpdatesRef.current);
        return newUpdates;
      });

      // Call optional callback
      onUpdate?.(update);
    });

    // Set initial state
    const initialState = wsService.getState();
    setIsConnected(initialState.connected);
    setError(initialState.error);

    return () => {
      unsubscribeState();
      unsubscribeEvents();
    };
  }, [domain, enabled, onUpdate]);

  return {
    updates,
    lastUpdate,
    isConnected,
    error,
    clearUpdates,
  };
};
