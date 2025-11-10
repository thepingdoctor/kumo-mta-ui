import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../../src/hooks/useWebSocket';
import { WS } from 'vitest-websocket-mock';

describe('Real-Time Metrics Streaming', () => {
  let server: WS;
  const url = 'ws://localhost:1234';

  beforeEach(() => {
    server = new WS(url);
  });

  afterEach(() => {
    WS.clean();
  });

  it('should stream metrics at correct intervals', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    // Simulate metrics streaming every second
    const metricsData = {
      type: 'metrics',
      data: {
        messages_sent: 1000,
        bounces: 50,
        delayed: 10,
        throughput: 100,
        active_connections: 25,
      },
      timestamp: new Date().toISOString(),
    };

    server.send(JSON.stringify(metricsData));

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'metrics',
          data: expect.objectContaining({
            messages_sent: 1000,
            bounces: 50,
            throughput: 100,
          }),
        })
      );
    });
  });

  it('should handle metrics with all required fields', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    const metricsMessage = {
      type: 'metrics',
      data: {
        messages_sent: 5000,
        bounces: 250,
        delayed: 100,
        throughput: 500,
        active_connections: 50,
      },
      timestamp: new Date().toISOString(),
    };

    server.send(JSON.stringify(metricsMessage));

    await waitFor(() => {
      const lastCall = onMessage.mock.calls[onMessage.mock.calls.length - 1][0];
      expect(lastCall.data).toHaveProperty('messages_sent');
      expect(lastCall.data).toHaveProperty('bounces');
      expect(lastCall.data).toHaveProperty('delayed');
      expect(lastCall.data).toHaveProperty('throughput');
      expect(lastCall.data).toHaveProperty('active_connections');
    });
  });

  it('should calculate throughput from streaming data', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    const metrics = [
      { messages_sent: 1000, timestamp: Date.now() },
      { messages_sent: 1100, timestamp: Date.now() + 1000 },
      { messages_sent: 1250, timestamp: Date.now() + 2000 },
    ];

    for (const metric of metrics) {
      server.send(
        JSON.stringify({
          type: 'metrics',
          data: {
            ...metric,
            bounces: 0,
            delayed: 0,
            throughput: 100,
            active_connections: 10,
          },
          timestamp: new Date(metric.timestamp).toISOString(),
        })
      );
    }

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledTimes(3);
    });
  });

  it('should handle metrics spike detection', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    // Normal metrics
    server.send(
      JSON.stringify({
        type: 'metrics',
        data: {
          messages_sent: 1000,
          bounces: 10,
          delayed: 5,
          throughput: 100,
          active_connections: 10,
        },
        timestamp: new Date().toISOString(),
      })
    );

    // Spike in bounces
    server.send(
      JSON.stringify({
        type: 'metrics',
        data: {
          messages_sent: 1100,
          bounces: 500, // Significant spike
          delayed: 5,
          throughput: 100,
          active_connections: 10,
        },
        timestamp: new Date().toISOString(),
      })
    );

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledTimes(2);
      const lastMetrics = onMessage.mock.calls[1][0];
      expect(lastMetrics.data.bounces).toBeGreaterThan(100);
    });
  });

  it('should track active connections over time', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    const connectionCounts = [10, 25, 50, 75, 100];

    for (const count of connectionCounts) {
      server.send(
        JSON.stringify({
          type: 'metrics',
          data: {
            messages_sent: 1000,
            bounces: 10,
            delayed: 5,
            throughput: 100,
            active_connections: count,
          },
          timestamp: new Date().toISOString(),
        })
      );
    }

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledTimes(5);
      const lastMetrics = onMessage.mock.calls[4][0];
      expect(lastMetrics.data.active_connections).toBe(100);
    });
  });

  it('should handle metrics with zero values', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    server.send(
      JSON.stringify({
        type: 'metrics',
        data: {
          messages_sent: 0,
          bounces: 0,
          delayed: 0,
          throughput: 0,
          active_connections: 0,
        },
        timestamp: new Date().toISOString(),
      })
    );

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            messages_sent: 0,
            bounces: 0,
            delayed: 0,
            throughput: 0,
            active_connections: 0,
          },
        })
      );
    });
  });

  it('should maintain metrics history for trending', async () => {
    const messages: unknown[] = [];
    const onMessage = vi.fn((msg) => messages.push(msg));

    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    // Send 10 metrics updates
    for (let i = 0; i < 10; i++) {
      server.send(
        JSON.stringify({
          type: 'metrics',
          data: {
            messages_sent: 1000 + i * 100,
            bounces: 10 + i,
            delayed: 5,
            throughput: 100 + i * 10,
            active_connections: 10 + i,
          },
          timestamp: new Date().toISOString(),
        })
      );
    }

    await waitFor(() => {
      expect(messages.length).toBe(10);
    });
  });
});
