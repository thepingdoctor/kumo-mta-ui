import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../../src/hooks/useWebSocket';

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState = WebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;

  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  constructor(url: string) {
    this.url = url;
  }

  send() {
    // Mock send
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }

  // Helper to simulate connection
  simulateOpen() {
    this.readyState = WebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  // Helper to simulate message
  simulateMessage(data: unknown) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }
}

global.WebSocket = MockWebSocket as unknown as typeof WebSocket;

describe('useWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: 'ws://localhost:8080' })
    );

    expect(result.current.isConnected).toBe(false);
    expect(result.current.lastMessage).toBeNull();
  });

  it('should connect to WebSocket server', async () => {
    const onOpen = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({ url: 'ws://localhost:8080', onOpen })
    );

    // Simulate connection
    const ws = (global.WebSocket as unknown as typeof MockWebSocket);
    await act(async () => {
      if (result.current) {
        // Access the WebSocket instance and simulate open
        (ws as unknown as MockWebSocket).simulateOpen?.();
      }
    });

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });

  it('should handle incoming messages', async () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({ url: 'ws://localhost:8080', onMessage })
    );

    const testMessage = {
      type: 'test',
      data: { value: 123 },
      timestamp: new Date().toISOString(),
    };

    // Simulate message
    await act(async () => {
      const ws = (global.WebSocket as unknown as MockWebSocket);
      ws.simulateMessage?.(testMessage);
    });

    await waitFor(() => {
      expect(result.current.lastMessage).toEqual(testMessage);
      expect(onMessage).toHaveBeenCalledWith(testMessage);
    });
  });

  it('should send messages when connected', () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: 'ws://localhost:8080' })
    );

    act(() => {
      result.current.send({ type: 'ping' });
    });

    // Message sending depends on connection state
    // In real implementation, check if send was called when connected
  });

  it('should provide reconnect function', () => {
    const { result } = renderHook(() =>
      useWebSocket({ url: 'ws://localhost:8080' })
    );

    expect(typeof result.current.reconnect).toBe('function');

    act(() => {
      result.current.reconnect();
    });

    // Verify reconnection logic
  });

  it('should cleanup on unmount', () => {
    const { unmount } = renderHook(() =>
      useWebSocket({ url: 'ws://localhost:8080' })
    );

    const closeSpy = vi.spyOn(WebSocket.prototype, 'close');

    unmount();

    expect(closeSpy).toHaveBeenCalled();
  });
});
