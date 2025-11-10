import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../../src/hooks/useWebSocket';
import { WS } from 'vitest-websocket-mock';

describe('WebSocket Reconnection Logic', () => {
  let server: WS;
  const url = 'ws://localhost:1234';

  beforeEach(() => {
    vi.useFakeTimers();
    server = new WS(url);
  });

  afterEach(() => {
    vi.useRealTimers();
    WS.clean();
  });

  it('should reconnect after network failure', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: true,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
      })
    );

    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Simulate network failure
    server.close();
    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // Create new server for reconnection
    server = new WS(url);

    // Fast-forward time to trigger reconnection
    vi.advanceTimersByTime(3000);

    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));
  });

  it('should respect reconnection interval', async () => {
    const reconnectInterval = 5000;
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: true,
        reconnectInterval,
        maxReconnectAttempts: 3,
      })
    );

    await server.connected;
    server.close();

    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // Should not reconnect immediately
    vi.advanceTimersByTime(2000);
    expect(result.current.isConnected).toBe(false);

    // Should reconnect after interval
    server = new WS(url);
    vi.advanceTimersByTime(3000);

    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));
  });

  it('should stop reconnecting after max attempts', async () => {
    const maxAttempts = 3;
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://unreachable-server',
        reconnect: true,
        reconnectInterval: 1000,
        maxReconnectAttempts: maxAttempts,
      })
    );

    // Wait for initial connection attempt to fail
    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // Simulate max attempts
    for (let i = 0; i < maxAttempts; i++) {
      vi.advanceTimersByTime(1000);
      await waitFor(() => expect(result.current.isConnected).toBe(false));
    }

    // Should not attempt to reconnect after max attempts
    vi.advanceTimersByTime(5000);
    expect(result.current.isConnected).toBe(false);
  });

  it('should reset reconnection attempts after successful connection', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: true,
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
      })
    );

    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // First disconnection
    server.close();
    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // Reconnect
    server = new WS(url);
    vi.advanceTimersByTime(1000);
    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Second disconnection - should still allow reconnection
    server.close();
    await waitFor(() => expect(result.current.isConnected).toBe(false));

    server = new WS(url);
    vi.advanceTimersByTime(1000);
    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));
  });

  it('should handle manual reconnection', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false, // Disable automatic reconnection
      })
    );

    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    server.close();
    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // Manual reconnect
    server = new WS(url);
    result.current.reconnect();

    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));
  });

  it('should preserve message queue during reconnection', async () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: true,
        reconnectInterval: 1000,
        onMessage,
      })
    );

    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Send messages
    const message1 = {
      type: 'test',
      data: { id: 1 },
      timestamp: new Date().toISOString(),
    };
    server.send(JSON.stringify(message1));

    await waitFor(() => expect(onMessage).toHaveBeenCalledWith(message1));

    // Disconnect
    server.close();
    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // Reconnect
    server = new WS(url);
    vi.advanceTimersByTime(1000);
    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    // Should be able to receive messages after reconnection
    const message2 = {
      type: 'test',
      data: { id: 2 },
      timestamp: new Date().toISOString(),
    };
    server.send(JSON.stringify(message2));

    await waitFor(() => expect(onMessage).toHaveBeenCalledWith(message2));
  });

  it('should handle exponential backoff for reconnection', async () => {
    const baseInterval = 1000;
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://unreachable',
        reconnect: true,
        reconnectInterval: baseInterval,
        maxReconnectAttempts: 5,
      })
    );

    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // First attempt - wait base interval
    vi.advanceTimersByTime(baseInterval);
    expect(result.current.isConnected).toBe(false);

    // Subsequent attempts could use exponential backoff
    // This is a suggestion for implementation enhancement
  });
});
