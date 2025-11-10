import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { WS } from 'vitest-websocket-mock';

describe('Alerts + WebSocket Integration', () => {
  let server: WS;
  const url = 'ws://localhost:1234';

  beforeEach(() => {
    server = new WS(url);
  });

  afterEach(() => {
    WS.clean();
  });

  it('should trigger alert on queue depth threshold via WebSocket', async () => {
    const alerts: any[] = [];
    const onMessage = vi.fn((msg) => {
      if (msg.type === 'queue') {
        const queueDepth = msg.data.depth;
        if (queueDepth > 1000) {
          alerts.push({
            type: 'queue_depth_exceeded',
            threshold: 1000,
            actual: queueDepth,
            timestamp: new Date(),
          });
        }
      }
    });

    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    // Send queue update that exceeds threshold
    server.send(
      JSON.stringify({
        type: 'queue',
        data: { depth: 1500, processing: 500, completed: 9000 },
        timestamp: new Date().toISOString(),
      })
    );

    await waitFor(() => {
      expect(alerts).toHaveLength(1);
      expect(alerts[0].actual).toBe(1500);
    });
  });

  it('should trigger alert on bounce rate spike', async () => {
    const alerts: any[] = [];
    let previousBounceRate = 2.0;

    const onMessage = vi.fn((msg) => {
      if (msg.type === 'metrics') {
        const bounceRate = (msg.data.bounces / msg.data.messages_sent) * 100;
        const spike = bounceRate - previousBounceRate;

        if (spike > 5) {
          // 5% spike
          alerts.push({
            type: 'bounce_rate_spike',
            previous: previousBounceRate,
            current: bounceRate,
            spike,
            timestamp: new Date(),
          });
        }

        previousBounceRate = bounceRate;
      }
    });

    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    // Normal bounce rate
    server.send(
      JSON.stringify({
        type: 'metrics',
        data: {
          messages_sent: 1000,
          bounces: 20, // 2%
          delayed: 10,
          throughput: 100,
          active_connections: 10,
        },
        timestamp: new Date().toISOString(),
      })
    );

    // Spike in bounce rate
    server.send(
      JSON.stringify({
        type: 'metrics',
        data: {
          messages_sent: 1000,
          bounces: 100, // 10% - 8% spike!
          delayed: 10,
          throughput: 100,
          active_connections: 10,
        },
        timestamp: new Date().toISOString(),
      })
    );

    await waitFor(() => {
      expect(alerts).toHaveLength(1);
      expect(alerts[0].spike).toBeGreaterThan(5);
    });
  });

  it('should send real-time alert notifications via WebSocket', async () => {
    const notifications: any[] = [];
    const onMessage = vi.fn((msg) => {
      if (msg.type === 'alert') {
        notifications.push(msg.data);
      }
    });

    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    // Server sends alert
    server.send(
      JSON.stringify({
        type: 'alert',
        data: {
          id: 'alert-123',
          severity: 'critical',
          message: 'Queue depth exceeded 1000',
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      })
    );

    await waitFor(() => {
      expect(notifications).toHaveLength(1);
      expect(notifications[0].severity).toBe('critical');
    });
  });
});
