import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebSocket } from '../../../src/hooks/useWebSocket';
import { WS } from 'vitest-websocket-mock';

describe('Real-Time Queue Updates', () => {
  let server: WS;
  const url = 'ws://localhost:1234';

  beforeEach(() => {
    server = new WS(url);
  });

  afterEach(() => {
    WS.clean();
  });

  it('should receive queue data updates on message event', async () => {
    const onMessage = vi.fn();
    const { result } = renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    const queueUpdate = {
      type: 'queue',
      data: {
        action: 'add',
        item: {
          id: 'msg-123',
          recipient: 'user@example.com',
          status: 'pending',
          priority: 'high',
        },
      },
      timestamp: new Date().toISOString(),
    };

    server.send(JSON.stringify(queueUpdate));

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(queueUpdate);
      expect(result.current.lastMessage).toEqual(queueUpdate);
    });
  });

  it('should handle queue item addition', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    const addMessage = {
      type: 'queue',
      data: {
        action: 'add',
        item: {
          id: 'msg-456',
          recipient: 'test@example.com',
          status: 'pending',
        },
      },
      timestamp: new Date().toISOString(),
    };

    server.send(JSON.stringify(addMessage));

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queue',
          data: expect.objectContaining({
            action: 'add',
          }),
        })
      );
    });
  });

  it('should handle queue item update', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    const updateMessage = {
      type: 'queue',
      data: {
        action: 'update',
        item: {
          id: 'msg-123',
          status: 'processing',
          progress: 50,
        },
      },
      timestamp: new Date().toISOString(),
    };

    server.send(JSON.stringify(updateMessage));

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queue',
          data: expect.objectContaining({
            action: 'update',
          }),
        })
      );
    });
  });

  it('should handle queue item removal', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    const removeMessage = {
      type: 'queue',
      data: {
        action: 'remove',
        item: {
          id: 'msg-789',
        },
      },
      timestamp: new Date().toISOString(),
    };

    server.send(JSON.stringify(removeMessage));

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queue',
          data: expect.objectContaining({
            action: 'remove',
          }),
        })
      );
    });
  });

  it('should handle multiple queue updates in sequence', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    const messages = [
      {
        type: 'queue',
        data: { action: 'add', item: { id: '1' } },
        timestamp: new Date().toISOString(),
      },
      {
        type: 'queue',
        data: { action: 'update', item: { id: '1', status: 'processing' } },
        timestamp: new Date().toISOString(),
      },
      {
        type: 'queue',
        data: { action: 'remove', item: { id: '1' } },
        timestamp: new Date().toISOString(),
      },
    ];

    for (const message of messages) {
      server.send(JSON.stringify(message));
    }

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledTimes(3);
    });
  });

  it('should handle malformed queue messages gracefully', async () => {
    const onMessage = vi.fn();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    // Send invalid JSON
    server.send('invalid-json-{]');

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
      expect(onMessage).not.toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('should batch process multiple queue updates efficiently', async () => {
    const onMessage = vi.fn();
    renderHook(() =>
      useWebSocket({
        url,
        reconnect: false,
        onMessage,
      })
    );

    await server.connected;

    // Simulate batch update
    const batchUpdate = {
      type: 'queue_batch',
      data: {
        updates: Array.from({ length: 100 }, (_, i) => ({
          action: 'add',
          item: { id: `msg-${i}` },
        })),
      },
      timestamp: new Date().toISOString(),
    };

    server.send(JSON.stringify(batchUpdate));

    await waitFor(() => {
      expect(onMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'queue_batch',
        })
      );
    });
  });
});
