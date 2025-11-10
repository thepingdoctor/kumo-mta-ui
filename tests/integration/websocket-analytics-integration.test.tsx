import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../src/hooks/useWebSocket';
import { WS } from 'vitest-websocket-mock';

describe('WebSocket + Analytics Integration', () => {
  let server: WS;
  const url = 'ws://localhost:1234';

  beforeEach(() => {
    server = new WS(url);
  });

  afterEach(() => {
    WS.clean();
  });

  it('should update analytics dashboard with real-time WebSocket data', async () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    const metricsUpdate = {
      type: 'metrics',
      data: {
        messages_sent: 10000,
        bounces: 500,
        delayed: 100,
        throughput: 500,
        active_connections: 50,
      },
      timestamp: new Date().toISOString(),
    };

    server.send(JSON.stringify(metricsUpdate));

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(metricsUpdate);
      expect(result.current.lastMessage).toEqual(metricsUpdate);
    });

    // Verify analytics can consume this data
    const metrics = result.current.lastMessage?.data as any;
    expect(metrics.messages_sent).toBe(10000);
    expect(metrics.throughput).toBe(500);
  });

  it('should stream metrics and update trend charts', async () => {
    const messages: any[] = [];
    const onMessage = vi.fn((msg) => messages.push(msg));

    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    // Stream 5 metric updates
    for (let i = 0; i < 5; i++) {
      server.send(
        JSON.stringify({
          type: 'metrics',
          data: {
            messages_sent: 1000 + i * 100,
            bounces: 50 + i * 5,
            delayed: 10,
            throughput: 100 + i * 10,
            active_connections: 10 + i,
          },
          timestamp: new Date().toISOString(),
        })
      );
    }

    await waitFor(() => {
      expect(messages).toHaveLength(5);
    });

    // Verify trend data
    const throughputs = messages.map((m) => m.data.throughput);
    expect(throughputs).toEqual([100, 110, 120, 130, 140]);
  });

  it('should handle WebSocket reconnection and resume analytics', async () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: true,
        reconnectInterval: 100,
        maxReconnectAttempts: 3,
        onMessage,
      })
    );

    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Send initial data
    server.send(
      JSON.stringify({
        type: 'metrics',
        data: { messages_sent: 1000, bounces: 50, delayed: 10, throughput: 100, active_connections: 10 },
        timestamp: new Date().toISOString(),
      })
    );

    await waitFor(() => expect(onMessage).toHaveBeenCalledTimes(1));

    // Disconnect
    server.close();
    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // Reconnect
    server = new WS(url);
    vi.advanceTimersByTime(100);
    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Send new data after reconnection
    server.send(
      JSON.stringify({
        type: 'metrics',
        data: { messages_sent: 1100, bounces: 55, delayed: 10, throughput: 110, active_connections: 11 },
        timestamp: new Date().toISOString(),
      })
    );

    await waitFor(() => expect(onMessage).toHaveBeenCalledTimes(2));
  });
});
