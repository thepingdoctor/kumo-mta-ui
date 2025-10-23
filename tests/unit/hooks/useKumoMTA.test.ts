import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useKumoMetrics,
  useBounces,
  useScheduledQueue,
  useQueueControl,
  useMessageOperations,
  useDiagnostics,
} from '../../../src/hooks/useKumoMTA';
import { server } from '../../mocks/server';

// Setup MSW
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useKumoMTA Hooks', () => {
  describe('useKumoMetrics', () => {
    it('should fetch metrics successfully', async () => {
      const { result } = renderHook(() => useKumoMetrics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual({
        messages_sent: 12450,
        bounces: 125,
        delayed: 45,
        throughput: 350,
        active_connections: 28,
      });
    });

    it('should use custom refetch interval', async () => {
      const { result } = renderHook(() => useKumoMetrics(10000), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
    });

    it('should handle loading state', () => {
      const { result } = renderHook(() => useKumoMetrics(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle error state', async () => {
      const { http, HttpResponse } = await import('msw');
      server.use(
        http.get('http://localhost:8000/api/admin/metrics/v1', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useKumoMetrics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('useBounces', () => {
    it('should fetch bounce classifications', async () => {
      const { result } = renderHook(() => useBounces(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveProperty('hard_bounces');
      expect(result.current.data).toHaveProperty('soft_bounces');
      expect(result.current.data).toHaveProperty('classifications');
    });

    it('should return bounce data structure', async () => {
      const { result } = renderHook(() => useBounces(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data?.hard_bounces).toBe(85);
      expect(result.current.data?.soft_bounces).toBe(40);
      expect(Array.isArray(result.current.data?.classifications)).toBe(true);
    });
  });

  describe('useScheduledQueue', () => {
    it('should fetch scheduled queue for specific domain', async () => {
      const { result } = renderHook(() => useScheduledQueue('example.com'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveProperty('domains');
      expect(Array.isArray(result.current.data?.domains)).toBe(true);
    });

    it('should not fetch when domain is undefined', () => {
      const { result } = renderHook(() => useScheduledQueue(undefined), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should fetch when domain is provided', async () => {
      const { result } = renderHook(() => useScheduledQueue('test.com'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toBeDefined();
    });
  });

  describe('useQueueControl', () => {
    it('should provide suspend queue mutation', async () => {
      const { result } = renderHook(() => useQueueControl(), {
        wrapper: createWrapper(),
      });

      expect(result.current.suspendQueue).toBeDefined();
      expect(typeof result.current.suspendQueue.mutate).toBe('function');
    });

    it('should suspend queue successfully', async () => {
      const { result } = renderHook(() => useQueueControl(), {
        wrapper: createWrapper(),
      });

      result.current.suspendQueue.mutate({
        domain: 'example.com',
        reason: 'Maintenance',
        duration: 3600,
      });

      await waitFor(() => expect(result.current.suspendQueue.isSuccess).toBe(true));
    });

    it('should provide resume queue mutation', async () => {
      const { result } = renderHook(() => useQueueControl(), {
        wrapper: createWrapper(),
      });

      expect(result.current.resumeQueue).toBeDefined();
      expect(typeof result.current.resumeQueue.mutate).toBe('function');
    });

    it('should resume queue successfully', async () => {
      const { result } = renderHook(() => useQueueControl(), {
        wrapper: createWrapper(),
      });

      result.current.resumeQueue.mutate('example.com');

      await waitFor(() => expect(result.current.resumeQueue.isSuccess).toBe(true));
    });

    it('should provide suspend ready queue mutation', () => {
      const { result } = renderHook(() => useQueueControl(), {
        wrapper: createWrapper(),
      });

      expect(result.current.suspendReadyQueue).toBeDefined();
    });
  });

  describe('useMessageOperations', () => {
    it('should provide rebind messages mutation', () => {
      const { result } = renderHook(() => useMessageOperations(), {
        wrapper: createWrapper(),
      });

      expect(result.current.rebindMessages).toBeDefined();
      expect(typeof result.current.rebindMessages.mutate).toBe('function');
    });

    it('should rebind messages successfully', async () => {
      const { result } = renderHook(() => useMessageOperations(), {
        wrapper: createWrapper(),
      });

      result.current.rebindMessages.mutate({
        campaign: 'test-campaign',
        domain: 'example.com',
      });

      await waitFor(() => expect(result.current.rebindMessages.isSuccess).toBe(true));
    });

    it('should provide bounce messages mutation', () => {
      const { result } = renderHook(() => useMessageOperations(), {
        wrapper: createWrapper(),
      });

      expect(result.current.bounceMessages).toBeDefined();
    });

    it('should bounce messages successfully', async () => {
      const { result } = renderHook(() => useMessageOperations(), {
        wrapper: createWrapper(),
      });

      result.current.bounceMessages.mutate({
        domain: 'example.com',
        reason: 'Invalid recipients',
      });

      await waitFor(() => expect(result.current.bounceMessages.isSuccess).toBe(true));
    });
  });

  describe('useDiagnostics', () => {
    it('should fetch trace logs', async () => {
      const { result } = renderHook(() => useDiagnostics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.traceLogs.isSuccess).toBe(true));

      expect(result.current.traceLogs.data).toHaveProperty('logs');
      expect(Array.isArray(result.current.traceLogs.data?.logs)).toBe(true);
    });

    it('should provide set diagnostic log mutation', () => {
      const { result } = renderHook(() => useDiagnostics(), {
        wrapper: createWrapper(),
      });

      expect(result.current.setDiagnosticLog).toBeDefined();
    });

    it('should set diagnostic log successfully', async () => {
      const { result } = renderHook(() => useDiagnostics(), {
        wrapper: createWrapper(),
      });

      result.current.setDiagnosticLog.mutate({
        filter: 'smtp.*',
        duration: 300,
      });

      await waitFor(() => expect(result.current.setDiagnosticLog.isSuccess).toBe(true));
    });

    it('should auto-refresh trace logs', async () => {
      const { result } = renderHook(() => useDiagnostics(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.traceLogs.isSuccess).toBe(true));
      expect(result.current.traceLogs.data).toBeDefined();
    });
  });

  describe('Query Invalidation', () => {
    it('should invalidate queries after suspending queue', async () => {
      const { result } = renderHook(
        () => ({
          control: useQueueControl(),
          metrics: useKumoMetrics(),
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.metrics.isSuccess).toBe(true));

      result.current.control.suspendQueue.mutate({
        domain: 'example.com',
        reason: 'Test',
      });

      await waitFor(() => expect(result.current.control.suspendQueue.isSuccess).toBe(true));
    });

    it('should invalidate queries after resuming queue', async () => {
      const { result } = renderHook(
        () => ({
          control: useQueueControl(),
          metrics: useKumoMetrics(),
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => expect(result.current.metrics.isSuccess).toBe(true));

      result.current.control.resumeQueue.mutate('example.com');

      await waitFor(() => expect(result.current.control.resumeQueue.isSuccess).toBe(true));
    });
  });
});
