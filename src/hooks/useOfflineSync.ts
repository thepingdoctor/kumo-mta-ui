import { useEffect, useState } from 'react';
import { offlineStorage, PendingRequest } from '../utils/offlineStorage';

interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: number | null;
  error: string | null;
}

export const useOfflineSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    error: null,
  });

  const syncPendingRequests = async () => {
    if (!navigator.onLine) {
      return;
    }

    setSyncStatus((prev) => ({ ...prev, isSyncing: true, error: null }));

    try {
      const pendingRequests = await offlineStorage.getPendingRequests();

      for (const request of pendingRequests) {
        try {
          const response = await fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.body,
          });

          if (response.ok) {
            await offlineStorage.removePendingRequest(request.id);
          } else if (request.retryCount < 3) {
            await offlineStorage.incrementRetryCount(request.id);
          } else {
            // Max retries reached, remove the request
            await offlineStorage.removePendingRequest(request.id);
            console.error(`Request ${request.id} failed after max retries`);
          }
        } catch (error) {
          console.error(`Failed to sync request ${request.id}:`, error);
          if (request.retryCount < 3) {
            await offlineStorage.incrementRetryCount(request.id);
          }
        }
      }

      const remainingRequests = await offlineStorage.getPendingRequests();

      setSyncStatus({
        isSyncing: false,
        pendingCount: remainingRequests.length,
        lastSyncTime: Date.now(),
        error: null,
      });

      // Dispatch event for UI updates
      window.dispatchEvent(
        new CustomEvent('sw-pending-requests', {
          detail: { count: remainingRequests.length },
        })
      );
    } catch (error) {
      setSyncStatus((prev) => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      }));
    }
  };

  const queueRequest = async (
    url: string,
    method: string,
    headers: Record<string, string> = {},
    body?: string
  ) => {
    try {
      const requestId = await offlineStorage.queueRequest({
        url,
        method,
        headers,
        body,
      });

      const pendingRequests = await offlineStorage.getPendingRequests();
      setSyncStatus((prev) => ({
        ...prev,
        pendingCount: pendingRequests.length,
      }));

      // Dispatch event for UI updates
      window.dispatchEvent(
        new CustomEvent('sw-pending-requests', {
          detail: { count: pendingRequests.length },
        })
      );

      return requestId;
    } catch (error) {
      console.error('Failed to queue request:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Initial pending count
    offlineStorage.getPendingRequests().then((requests) => {
      setSyncStatus((prev) => ({
        ...prev,
        pendingCount: requests.length,
      }));
    });

    // Sync when coming back online
    const handleOnline = () => {
      syncPendingRequests();
    };

    window.addEventListener('online', handleOnline);

    // Periodic cleanup of expired items
    const cleanupInterval = setInterval(() => {
      offlineStorage.cleanupExpired();
    }, 60 * 60 * 1000); // Every hour

    return () => {
      window.removeEventListener('online', handleOnline);
      clearInterval(cleanupInterval);
    };
  }, []);

  return {
    syncStatus,
    syncPendingRequests,
    queueRequest,
  };
};
