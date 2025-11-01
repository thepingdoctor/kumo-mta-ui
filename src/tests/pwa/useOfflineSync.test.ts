import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { offlineStorage } from '../../utils/offlineStorage';

// Mock IndexedDB
import 'fake-indexeddb/auto';

// Mock fetch
global.fetch = vi.fn();

describe('useOfflineSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    offlineStorage.clear('PENDING_REQUESTS');

    // Reset navigator.onLine
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useOfflineSync());

    expect(result.current.syncStatus.isSyncing).toBe(false);
    expect(result.current.syncStatus.pendingCount).toBe(0);
    expect(result.current.syncStatus.lastSyncTime).toBeNull();
    expect(result.current.syncStatus.error).toBeNull();
  });

  it('should queue a request', async () => {
    const { result } = renderHook(() => useOfflineSync());

    const requestId = await result.current.queueRequest(
      '/api/test',
      'POST',
      { 'Content-Type': 'application/json' },
      JSON.stringify({ data: 'test' })
    );

    expect(requestId).toBeDefined();

    await waitFor(() => {
      expect(result.current.syncStatus.pendingCount).toBe(1);
    });
  });

  it('should sync pending requests when online', async () => {
    const mockResponse = { ok: true, status: 200 };
    (global.fetch as unknown as jest.Mock).mockResolvedValue(mockResponse);

    // Queue a request first
    await offlineStorage.queueRequest({
      url: '/api/test',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: 'test' }),
    });

    const { result } = renderHook(() => useOfflineSync());

    await result.current.syncPendingRequests();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result.current.syncStatus.pendingCount).toBe(0);
    });
  });

  it('should not sync when offline', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result } = renderHook(() => useOfflineSync());

    await result.current.syncPendingRequests();

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.syncStatus.isSyncing).toBe(false);
  });

  it('should retry failed requests up to max retries', async () => {
    const mockResponse = { ok: false, status: 500 };
    (global.fetch as any).mockResolvedValue(mockResponse);

    const requestId = await offlineStorage.queueRequest({
      url: '/api/test',
      method: 'POST',
      headers: {},
    });

    const { result } = renderHook(() => useOfflineSync());

    // Sync multiple times to trigger retries
    await result.current.syncPendingRequests();
    await result.current.syncPendingRequests();
    await result.current.syncPendingRequests();
    await result.current.syncPendingRequests(); // This should remove after max retries

    await waitFor(() => {
      expect(result.current.syncStatus.pendingCount).toBe(0);
    });
  });

  it('should handle sync errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    await offlineStorage.queueRequest({
      url: '/api/test',
      method: 'POST',
      headers: {},
    });

    const { result } = renderHook(() => useOfflineSync());

    await result.current.syncPendingRequests();

    await waitFor(() => {
      expect(result.current.syncStatus.isSyncing).toBe(false);
      expect(result.current.syncStatus.pendingCount).toBeGreaterThan(0);
    });
  });

  it('should update lastSyncTime after successful sync', async () => {
    const mockResponse = { ok: true, status: 200 };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await offlineStorage.queueRequest({
      url: '/api/test',
      method: 'POST',
      headers: {},
    });

    const { result } = renderHook(() => useOfflineSync());

    await result.current.syncPendingRequests();

    await waitFor(() => {
      expect(result.current.syncStatus.lastSyncTime).not.toBeNull();
    });
  });

  it('should dispatch custom events for pending request count', async () => {
    const eventListener = vi.fn();
    window.addEventListener('sw-pending-requests', eventListener);

    const { result } = renderHook(() => useOfflineSync());

    await result.current.queueRequest('/api/test', 'POST', {});

    await waitFor(() => {
      expect(eventListener).toHaveBeenCalled();
    });

    window.removeEventListener('sw-pending-requests', eventListener);
  });

  it('should sync when coming back online', async () => {
    const mockResponse = { ok: true, status: 200 };
    (global.fetch as any).mockResolvedValue(mockResponse);

    await offlineStorage.queueRequest({
      url: '/api/test',
      method: 'POST',
      headers: {},
    });

    const { result } = renderHook(() => useOfflineSync());

    // Simulate coming back online
    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });
  });
});
