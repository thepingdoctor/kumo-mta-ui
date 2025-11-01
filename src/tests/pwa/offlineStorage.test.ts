import { describe, it, expect, beforeEach } from 'vitest';
import { offlineStorage } from '../../utils/offlineStorage';

// Mock IndexedDB
import 'fake-indexeddb/auto';

describe('OfflineStorage', () => {
  beforeEach(async () => {
    await offlineStorage.clear('DASHBOARD');
    await offlineStorage.clear('QUEUE');
    await offlineStorage.clear('PENDING_REQUESTS');
  });

  describe('Basic Operations', () => {
    it('should store and retrieve items', async () => {
      const testData = { name: 'test', value: 123 };
      await offlineStorage.setItem('DASHBOARD', 'test-key', testData);

      const retrieved = await offlineStorage.getItem('DASHBOARD', 'test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent items', async () => {
      const retrieved = await offlineStorage.getItem('DASHBOARD', 'non-existent');
      expect(retrieved).toBeNull();
    });

    it('should remove items', async () => {
      await offlineStorage.setItem('DASHBOARD', 'test-key', { data: 'test' });
      await offlineStorage.removeItem('DASHBOARD', 'test-key');

      const retrieved = await offlineStorage.getItem('DASHBOARD', 'test-key');
      expect(retrieved).toBeNull();
    });

    it('should clear all items in a store', async () => {
      await offlineStorage.setItem('DASHBOARD', 'key1', { data: 'test1' });
      await offlineStorage.setItem('DASHBOARD', 'key2', { data: 'test2' });

      await offlineStorage.clear('DASHBOARD');

      const keys = await offlineStorage.getAllKeys('DASHBOARD');
      expect(keys).toHaveLength(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire items after TTL', async () => {
      // Set item with 0.001 minute TTL (60ms)
      await offlineStorage.setItem('DASHBOARD', 'expiring-key', { data: 'test' }, 0.001);

      // Should be available immediately
      let retrieved = await offlineStorage.getItem('DASHBOARD', 'expiring-key');
      expect(retrieved).toEqual({ data: 'test' });

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be expired
      retrieved = await offlineStorage.getItem('DASHBOARD', 'expiring-key');
      expect(retrieved).toBeNull();
    });

    it('should not expire items without TTL', async () => {
      await offlineStorage.setItem('DASHBOARD', 'persistent-key', { data: 'test' });

      await new Promise(resolve => setTimeout(resolve, 100));

      const retrieved = await offlineStorage.getItem('DASHBOARD', 'persistent-key');
      expect(retrieved).toEqual({ data: 'test' });
    });
  });

  describe('Pending Requests Queue', () => {
    it('should queue requests', async () => {
      const requestId = await offlineStorage.queueRequest({
        url: '/api/test',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });

      expect(requestId).toMatch(/^req_/);

      const pendingRequests = await offlineStorage.getPendingRequests();
      expect(pendingRequests).toHaveLength(1);
      expect(pendingRequests[0].url).toBe('/api/test');
    });

    it('should retrieve all pending requests', async () => {
      await offlineStorage.queueRequest({
        url: '/api/test1',
        method: 'POST',
        headers: {},
      });

      await offlineStorage.queueRequest({
        url: '/api/test2',
        method: 'PUT',
        headers: {},
      });

      const pendingRequests = await offlineStorage.getPendingRequests();
      expect(pendingRequests).toHaveLength(2);
    });

    it('should remove pending requests', async () => {
      const requestId = await offlineStorage.queueRequest({
        url: '/api/test',
        method: 'POST',
        headers: {},
      });

      await offlineStorage.removePendingRequest(requestId);

      const pendingRequests = await offlineStorage.getPendingRequests();
      expect(pendingRequests).toHaveLength(0);
    });

    it('should increment retry count', async () => {
      const requestId = await offlineStorage.queueRequest({
        url: '/api/test',
        method: 'POST',
        headers: {},
      });

      await offlineStorage.incrementRetryCount(requestId);
      await offlineStorage.incrementRetryCount(requestId);

      const pendingRequests = await offlineStorage.getPendingRequests();
      expect(pendingRequests[0].retryCount).toBe(2);
    });
  });

  describe('Cleanup', () => {
    it('should clean up expired items', async () => {
      // Add expired item
      await offlineStorage.setItem('DASHBOARD', 'expired', { data: 'old' }, 0.001);

      // Add non-expired item
      await offlineStorage.setItem('DASHBOARD', 'current', { data: 'new' }, 10);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Run cleanup
      await offlineStorage.cleanupExpired();

      // Check that expired item is gone
      const expired = await offlineStorage.getItem('DASHBOARD', 'expired');
      expect(expired).toBeNull();

      // Check that current item remains
      const current = await offlineStorage.getItem('DASHBOARD', 'current');
      expect(current).toEqual({ data: 'new' });
    });
  });

  describe('Multiple Stores', () => {
    it('should keep data isolated between stores', async () => {
      await offlineStorage.setItem('DASHBOARD', 'key', { type: 'dashboard' });
      await offlineStorage.setItem('QUEUE', 'key', { type: 'queue' });

      const dashboardData = await offlineStorage.getItem('DASHBOARD', 'key');
      const queueData = await offlineStorage.getItem('QUEUE', 'key');

      expect(dashboardData).toEqual({ type: 'dashboard' });
      expect(queueData).toEqual({ type: 'queue' });
    });
  });
});
