/**
 * React hook for real-time metrics updates via WebSocket
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketService } from '../services/websocketService';
import type { MetricUpdateEvent, SystemMetricEvent } from '../types/websocket-events';

export interface RealtimeMetric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

export interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  active_connections: number;
  messages_per_second: number;
  timestamp: Date;
}

export interface UseRealtimeMetricsOptions {
  metricName?: string;
  enabled?: boolean;
  aggregateWindow?: number; // Milliseconds to aggregate metrics
  onMetricUpdate?: (metric: RealtimeMetric) => void;
  onSystemMetric?: (metrics: SystemMetrics) => void;
}

export interface UseRealtimeMetricsReturn {
  metrics: Map<string, RealtimeMetric>;
  systemMetrics: SystemMetrics | null;
  latestMetric: RealtimeMetric | null;
  isConnected: boolean;
  error: string | null;
  clearMetrics: () => void;
}

/**
 * Hook for subscribing to real-time metrics updates
 */
export const useRealtimeMetrics = (
  options: UseRealtimeMetricsOptions = {}
): UseRealtimeMetricsReturn => {
  const { metricName, enabled = true, onMetricUpdate, onSystemMetric } = options;

  const [metrics, setMetrics] = useState<Map<string, RealtimeMetric>>(new Map());
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [latestMetric, setLatestMetric] = useState<RealtimeMetric | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsServiceRef = useRef(getWebSocketService());

  const clearMetrics = useCallback(() => {
    setMetrics(new Map());
    setLatestMetric(null);
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

    // Subscribe to metric updates
    const unsubscribeMetrics = wsService.subscribe('metric_update', (event) => {
      const metricEvent = event as MetricUpdateEvent;

      // Filter by metric name if specified
      if (metricName && metricEvent.data.metric_name !== metricName) {
        return;
      }

      const metric: RealtimeMetric = {
        name: metricEvent.data.metric_name,
        value: metricEvent.data.value,
        labels: metricEvent.data.labels,
        timestamp: new Date(metricEvent.data.timestamp),
      };

      setLatestMetric(metric);

      setMetrics((prev) => {
        const updated = new Map(prev);
        updated.set(metric.name, metric);
        return updated;
      });

      // Call optional callback
      onMetricUpdate?.(metric);
    });

    // Subscribe to system metrics
    const unsubscribeSystem = wsService.subscribe('system_metric', (event) => {
      const systemEvent = event as SystemMetricEvent;

      const sysMetrics: SystemMetrics = {
        cpu_usage: systemEvent.data.cpu_usage,
        memory_usage: systemEvent.data.memory_usage,
        active_connections: systemEvent.data.active_connections,
        messages_per_second: systemEvent.data.messages_per_second,
        timestamp: new Date(systemEvent.data.timestamp),
      };

      setSystemMetrics(sysMetrics);

      // Call optional callback
      onSystemMetric?.(sysMetrics);
    });

    // Set initial state
    const initialState = wsService.getState();
    setIsConnected(initialState.connected);
    setError(initialState.error);

    return () => {
      unsubscribeState();
      unsubscribeMetrics();
      unsubscribeSystem();
    };
  }, [metricName, enabled, onMetricUpdate, onSystemMetric]);

  return {
    metrics,
    systemMetrics,
    latestMetric,
    isConnected,
    error,
    clearMetrics,
  };
};
