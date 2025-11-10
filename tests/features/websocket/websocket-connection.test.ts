import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../../src/hooks/useWebSocket';
import { WS } from 'vitest-websocket-mock';

describe('WebSocket Connection', () => {
  let server: WS;
  const url = 'ws://localhost:1234';

  beforeEach(() => {
    server = new WS(url);
  });

  afterEach(() => {
    WS.clean();
  });

  it('should establish WebSocket connection on mount', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
      })
    );

    await server.connected;

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should authenticate with valid token', async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onOpen,
      })
    );

    await server.connected;

    // Simulate authentication
    result.current.send({
      type: 'auth',
      token: 'valid-token-123',
    });

    await waitFor(() => {
      expect(server).toReceiveMessage(
        JSON.stringify({ type: 'auth', token: 'valid-token-123' })
      );
    });

    expect(onOpen).toHaveBeenCalled();
  });

  it('should handle connection with invalid auth token', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onError,
      })
    );

    await server.connected;

    // Send invalid auth
    result.current.send({
      type: 'auth',
      token: 'invalid-token',
    });

    // Server sends error response
    server.send(
      JSON.stringify({
        type: 'error',
        data: { message: 'Invalid authentication token' },
        timestamp: new Date().toISOString(),
      })
    );

    await waitFor(() => {
      expect(result.current.lastMessage?.type).toBe('error');
    });
  });

  it('should update connection status on open', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
      })
    );

    expect(result.current.isConnected).toBe(false);

    await server.connected;

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should update connection status on close', async () => {
    const onClose = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onClose,
      })
    );

    await server.connected;
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    server.close();

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should handle connection errors gracefully', async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({
        url: 'ws://invalid-url',
        reconnect: false,
        onError,
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
  });

  it('should cleanup on unmount to prevent memory leaks', async () => {
    const onClose = vi.fn();
    const { result, unmount } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onClose,
      })
    );

    await server.connected;
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });

    unmount();

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should handle rapid connect/disconnect cycles', async () => {
    const { result, rerender } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
      })
    );

    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));

    server.close();
    await waitFor(() => expect(result.current.isConnected).toBe(false));

    // Reconnect
    rerender();
    await server.connected;
    await waitFor(() => expect(result.current.isConnected).toBe(true));
  });
});
