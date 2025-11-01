# KumoMTA UI Compatibility Test Strategy

**Agent**: Tester
**Date**: 2025-11-01
**Mission**: Design comprehensive testing strategy for KumoMTA UI compatibility

---

## Executive Summary

This document outlines a complete testing strategy to validate the KumoMTA UI's compatibility with KumoMTA server API. The strategy identifies **122 additional tests** needed across 3 priority phases to achieve production-ready quality.

### Current State Analysis

**Existing Test Coverage**:
- ✅ **10 E2E tests** (Playwright) - Basic UI flows
- ✅ **5 Unit tests** (Vitest) - Component tests
- ❌ **0 Integration tests** - Critical gap
- ❌ **0 API contract tests** - Critical gap

**Test Frameworks in Use**:
- Playwright 1.56 (E2E)
- Vitest 1.6 (Unit/Integration)
- MSW 2.11 (API mocking)
- jest-axe 10.0 (Accessibility)
- @testing-library/react 16.3 (Component testing)

---

## Critical Test Gaps Identified

### 🚨 Critical Priority

1. **No KumoMTA API Contract Tests**
   - Missing validation of Prometheus metrics format
   - No tests for KumoMTA-specific endpoints
   - No schema validation for API responses

2. **Missing HTTP Basic Auth Flow Tests**
   - No test for `Basic ${base64(username:password)}` encoding
   - Missing auto-logout on 401 testing
   - No CSRF token injection validation

3. **No Prometheus Metrics Parsing Tests**
   - `/metrics.json` format parsing untested
   - Metric mapping to UI fields untested
   - No handling of missing/malformed metrics

4. **Missing Queue Operation Tests**
   - Suspend/resume operations untested
   - Message rebinding workflow untested
   - Bounce management untested

5. **No WebSocket Real-time Update Tests**
   - Live metric updates untested
   - Queue status changes untested
   - Connection recovery untested

---

## Comprehensive Test Strategy

### Phase 1: Critical Foundation (Priority: CRITICAL)
**Estimated Tests**: 55
**Target Completion**: Week 1-2

#### 1.1 KumoMTA API Contract Tests (15 tests)

**File**: `/tests/integration/kumomta-api-contracts.test.ts`

```typescript
describe('KumoMTA API Contract Tests', () => {
  describe('Metrics Endpoint', () => {
    it('GET /metrics.json returns Prometheus format', async () => {
      const response = await api.get('/metrics.json');
      expect(response.data).toHaveProperty('kumomta_messages_sent_total');
      expect(response.data.kumomta_messages_sent_total).toHaveProperty('value');
    });

    it('parses all required metrics', () => {
      const metrics = parsePrometheusMetrics(mockMetricsResponse);
      expect(metrics).toMatchObject({
        sent: expect.any(Number),
        bounced: expect.any(Number),
        delayed: expect.any(Number),
        throughput: expect.any(Number)
      });
    });

    it('handles missing metrics gracefully', () => {
      const partial = { kumomta_messages_sent_total: { value: 100 } };
      const metrics = parsePrometheusMetrics(partial);
      expect(metrics.sent).toBe(100);
      expect(metrics.bounced).toBe(0); // Default fallback
    });
  });

  describe('Queue Operations', () => {
    it('POST /api/admin/suspend/v1 with valid domain', async () => {
      const response = await api.post('/api/admin/suspend/v1', {
        domain: 'example.com',
        reason: 'Maintenance',
        duration: 3600
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('POST /api/admin/resume/v1 resumes queue', async () => {
      const response = await api.post('/api/admin/resume/v1', {
        domain: 'example.com'
      });
      expect(response.status).toBe(200);
    });

    it('POST /api/admin/suspend-ready-q/v1 with reason', async () => {
      const response = await api.post('/api/admin/suspend-ready-q/v1', {
        domain: 'example.com',
        reason: 'Rate limiting'
      });
      expect(response.data.success).toBe(true);
    });
  });

  describe('Message Operations', () => {
    it('POST /api/admin/rebind/v1 with campaign filter', async () => {
      const response = await api.post('/api/admin/rebind/v1', {
        campaign: 'newsletter',
        routing_domain: 'smtp.provider.com'
      });
      expect(response.data.rebounded).toBeGreaterThanOrEqual(0);
    });

    it('POST /api/admin/bounce/v1 with domain filter', async () => {
      const response = await api.post('/api/admin/bounce/v1', {
        domain: 'invalid.com',
        reason: '550 Domain does not exist'
      });
      expect(response.data.bounced).toBeGreaterThanOrEqual(0);
    });

    it('prevents bouncing all messages without filters', async () => {
      await expect(
        api.post('/api/admin/bounce/v1', { reason: 'Test' })
      ).rejects.toThrow(); // Should require at least one filter
    });
  });

  describe('Bounce Management', () => {
    it('GET /api/admin/bounce/v1 returns classifications', async () => {
      const response = await api.get('/api/admin/bounce/v1');
      expect(response.data).toHaveProperty('hard_bounces');
      expect(response.data).toHaveProperty('soft_bounces');
      expect(response.data.classifications).toBeArray();
    });

    it('GET /api/admin/bounce-list/v1 with domain filter', async () => {
      const response = await api.get('/api/admin/bounce-list/v1', {
        params: { domain: 'example.com' }
      });
      expect(response.data.domains).toBeArray();
    });
  });

  describe('Diagnostic Operations', () => {
    it('GET /api/admin/trace-smtp-server/v1 returns logs', async () => {
      const response = await api.get('/api/admin/trace-smtp-server/v1');
      expect(response.data.logs).toBeArray();
    });

    it('POST /api/admin/set-diagnostic-log-filter/v1', async () => {
      const response = await api.post('/api/admin/set-diagnostic-log-filter/v1', {
        filter: 'kumo=trace',
        duration: 300
      });
      expect(response.data.success).toBe(true);
    });
  });
});
```

#### 1.2 HTTP Basic Auth Flow Tests (8 tests)

**File**: `/tests/integration/auth-flow.test.ts`

```typescript
describe('HTTP Basic Auth Flow', () => {
  it('encodes credentials as base64', () => {
    const username = 'admin';
    const password = 'secret123';
    const encoded = btoa(`${username}:${password}`);
    const header = `Basic ${encoded}`;

    expect(header).toBe('Basic YWRtaW46c2VjcmV0MTIz');
  });

  it('injects auth header in all requests', async () => {
    const interceptor = jest.fn();
    api.interceptors.request.use(interceptor);

    await api.get('/api/admin/metrics/v1');

    expect(interceptor).toHaveBeenCalled();
    const config = interceptor.mock.calls[0][0];
    expect(config.headers.Authorization).toMatch(/^Basic /);
  });

  it('handles 401 by clearing auth and redirecting', async () => {
    const logoutSpy = jest.spyOn(authStore, 'logout');
    const navigateSpy = jest.spyOn(window.location, 'href', 'set');

    server.use(
      rest.get('/api/*', (req, res, ctx) => res(ctx.status(401)))
    );

    await expect(api.get('/api/admin/metrics/v1')).rejects.toThrow();

    expect(logoutSpy).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });

  it('includes CSRF token when available', async () => {
    const csrfToken = 'test-csrf-token';
    document.head.innerHTML = `<meta name="csrf-token" content="${csrfToken}">`;

    const interceptor = jest.fn();
    api.interceptors.request.use(interceptor);

    await api.post('/api/admin/config/core', {});

    const config = interceptor.mock.calls[0][0];
    expect(config.headers['X-CSRF-Token']).toBe(csrfToken);
  });

  it('handles missing CSRF token gracefully', async () => {
    document.head.innerHTML = '';

    const response = await api.get('/api/admin/metrics/v1');

    expect(response.status).toBe(200);
  });

  it('persists auth token across page refresh', () => {
    authStore.login({ username: 'admin', password: 'pass', token: 'xyz' });

    // Simulate page refresh
    const persistedState = localStorage.getItem('auth-storage');
    expect(persistedState).toContain('xyz');
  });

  it('handles 403 Forbidden with error message', async () => {
    server.use(
      rest.get('/api/*', (req, res, ctx) =>
        res(ctx.status(403), ctx.json({ message: 'Access denied' }))
      )
    );

    await expect(api.get('/api/admin/config/core')).rejects.toThrow('Access forbidden');
  });

  it('retries on network errors', async () => {
    let attempts = 0;
    server.use(
      rest.get('/api/*', (req, res, ctx) => {
        attempts++;
        if (attempts < 3) {
          return res.networkError('Connection failed');
        }
        return res(ctx.json({ success: true }));
      })
    );

    const response = await api.get('/api/admin/metrics/v1');

    expect(attempts).toBe(3);
    expect(response.data.success).toBe(true);
  });
});
```

#### 1.3 Queue Management Integration Tests (12 tests)

**File**: `/tests/integration/queue-operations.test.ts`

```typescript
describe('Queue Management Integration', () => {
  describe('Queue Listing', () => {
    it('fetches queue items with status filter', async () => {
      const { result } = renderHook(() => useQueue());

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      const items = result.current.data;
      expect(items).toBeArray();
      expect(items.length).toBeGreaterThan(0);
    });

    it('applies search query filter', async () => {
      const searchQuery = 'test@example.com';
      const { result } = renderHook(() => useQueue({ searchQuery }));

      await waitFor(() => expect(result.current.data).toBeDefined());

      const items = result.current.data;
      items.forEach(item => {
        expect(item.customerEmail.toLowerCase()).toContain('test');
      });
    });

    it('filters by service type', async () => {
      const { result } = renderHook(() =>
        useQueue({ serviceType: 'transactional' })
      );

      await waitFor(() => expect(result.current.data).toBeDefined());

      const items = result.current.data;
      items.forEach(item => {
        expect(item.serviceType).toBe('transactional');
      });
    });
  });

  describe('Queue Status Updates', () => {
    it('updates single queue item status', async () => {
      const { result } = renderHook(() => useQueue());

      await act(async () => {
        await result.current.updateStatus({
          id: '123',
          status: 'completed'
        });
      });

      expect(result.current.isSuccess).toBe(true);
    });

    it('invalidates cache after status update', async () => {
      const queryClient = new QueryClient();
      const { result } = renderHook(() => useQueue(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      });

      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      await act(async () => {
        await result.current.updateStatus({ id: '123', status: 'completed' });
      });

      expect(invalidateSpy).toHaveBeenCalledWith(['queue']);
    });

    it('handles concurrent status updates', async () => {
      const { result } = renderHook(() => useQueue());

      const updates = [
        result.current.updateStatus({ id: '1', status: 'completed' }),
        result.current.updateStatus({ id: '2', status: 'failed' }),
        result.current.updateStatus({ id: '3', status: 'completed' })
      ];

      await act(async () => {
        await Promise.all(updates);
      });

      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Queue Metrics', () => {
    it('calculates queue statistics', async () => {
      const { result } = renderHook(() => useQueue());

      await waitFor(() => expect(result.current.metrics).toBeDefined());

      const { metrics } = result.current;
      expect(metrics.totalWaiting).toBeNumber();
      expect(metrics.totalProcessing).toBeNumber();
      expect(metrics.totalCompleted).toBeNumber();
    });

    it('updates metrics on queue changes', async () => {
      const { result } = renderHook(() => useQueue());

      const initialMetrics = result.current.metrics;

      await act(async () => {
        await result.current.updateStatus({ id: '1', status: 'completed' });
      });

      await waitFor(() => {
        expect(result.current.metrics.totalCompleted)
          .toBe(initialMetrics.totalCompleted + 1);
      });
    });
  });

  describe('Queue Export', () => {
    it('exports queue data to CSV', async () => {
      const items = [
        { id: '1', customerName: 'John', status: 'waiting' },
        { id: '2', customerName: 'Jane', status: 'completed' }
      ];

      const csv = exportToCSV(items);

      expect(csv).toContain('customerName,status');
      expect(csv).toContain('John,waiting');
      expect(csv).toContain('Jane,completed');
    });

    it('sanitizes CSV content for security', () => {
      const items = [
        { id: '1', customerName: '=CMD|/C calc', status: 'waiting' }
      ];

      const csv = exportToCSV(items);

      expect(csv).not.toContain('=CMD');
      expect(csv).toContain("'=CMD|/C calc"); // Escaped
    });
  });

  describe('Error Handling', () => {
    it('shows error toast on failed update', async () => {
      const { result } = renderHook(() => useQueue());
      const toastSpy = jest.spyOn(toast, 'error');

      server.use(
        rest.put('/api/admin/queue/:id/status', (req, res, ctx) =>
          res(ctx.status(500))
        )
      );

      await act(async () => {
        await result.current.updateStatus({ id: '1', status: 'completed' });
      });

      expect(toastSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update')
      );
    });

    it('retries failed queue fetches', async () => {
      let attempts = 0;
      server.use(
        rest.get('/api/admin/queue/list', (req, res, ctx) => {
          attempts++;
          if (attempts < 3) {
            return res(ctx.status(500));
          }
          return res(ctx.json([]));
        })
      );

      const { result } = renderHook(() => useQueue());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(attempts).toBe(3);
    });
  });
});
```

#### 1.4 Error Scenario Tests (20 tests)

**File**: `/tests/integration/error-scenarios.test.ts`

```typescript
describe('Error Scenario Handling', () => {
  describe('Network Errors', () => {
    it('handles connection timeout', async () => {
      server.use(
        rest.get('/api/*', async (req, res, ctx) => {
          await delay(15000); // Exceeds 10s timeout
          return res(ctx.json({}));
        })
      );

      await expect(api.get('/api/admin/metrics/v1'))
        .rejects.toThrow('timeout');
    });

    it('handles DNS resolution failure', async () => {
      server.use(
        rest.get('/api/*', (req, res) =>
          res.networkError('DNS resolution failed')
        )
      );

      await expect(api.get('/api/admin/metrics/v1'))
        .rejects.toThrow('Network error');
    });

    it('handles offline network', async () => {
      window.navigator.onLine = false;

      const { result } = renderHook(() => useKumoMTA());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });
    });

    it('retries with exponential backoff', async () => {
      const delays = [];
      let attempts = 0;

      server.use(
        rest.get('/api/*', (req, res, ctx) => {
          attempts++;
          delays.push(Date.now());
          if (attempts < 3) {
            return res(ctx.status(500));
          }
          return res(ctx.json({ success: true }));
        })
      );

      await api.get('/api/admin/metrics/v1');

      // Verify exponential backoff (1s, 2s, 4s...)
      const delay1 = delays[1] - delays[0];
      const delay2 = delays[2] - delays[1];
      expect(delay2).toBeGreaterThan(delay1 * 1.5);
    });
  });

  describe('API Error Codes', () => {
    it('handles 400 Bad Request', async () => {
      server.use(
        rest.post('/api/admin/suspend/v1', (req, res, ctx) =>
          res(ctx.status(400), ctx.json({
            error: { message: 'Domain is required' }
          }))
        )
      );

      await expect(api.post('/api/admin/suspend/v1', {}))
        .rejects.toThrow('Domain is required');
    });

    it('handles 404 Not Found', async () => {
      server.use(
        rest.get('/api/admin/queue/:id', (req, res, ctx) =>
          res(ctx.status(404))
        )
      );

      await expect(api.get('/api/admin/queue/999'))
        .rejects.toThrow('Not Found');
    });

    it('handles 409 Conflict', async () => {
      server.use(
        rest.put('/api/admin/config/core', (req, res, ctx) =>
          res(ctx.status(409), ctx.json({
            error: { message: 'Concurrent modification detected' }
          }))
        )
      );

      const toastSpy = jest.spyOn(toast, 'error');

      try {
        await api.put('/api/admin/config/core', {});
      } catch (error) {
        expect(error.message).toContain('Concurrent');
      }
    });

    it('handles 422 Validation Error', async () => {
      server.use(
        rest.post('/api/admin/suspend/v1', (req, res, ctx) =>
          res(ctx.status(422), ctx.json({
            errors: [
              { field: 'duration', message: 'Must be positive' }
            ]
          }))
        )
      );

      await expect(api.post('/api/admin/suspend/v1', {
        domain: 'test.com',
        reason: 'Test',
        duration: -1
      })).rejects.toThrow();
    });

    it('handles 500 Internal Server Error', async () => {
      server.use(
        rest.get('/api/*', (req, res, ctx) =>
          res(ctx.status(500), ctx.json({
            error: { message: 'Database connection failed' }
          }))
        )
      );

      await expect(api.get('/api/admin/metrics/v1'))
        .rejects.toThrow('Server error');
    });

    it('handles 503 Service Unavailable', async () => {
      server.use(
        rest.get('/api/*', (req, res, ctx) =>
          res(ctx.status(503), ctx.json({
            error: { message: 'Maintenance mode' }
          }))
        )
      );

      const { result } = renderHook(() => useKumoMTA());

      await waitFor(() => {
        expect(result.current.error).toContain('Maintenance');
      });
    });
  });

  describe('Data Validation Errors', () => {
    it('handles malformed JSON response', async () => {
      server.use(
        rest.get('/api/*', (req, res, ctx) =>
          res(ctx.body('invalid json{'))
        )
      );

      await expect(api.get('/api/admin/metrics/v1'))
        .rejects.toThrow();
    });

    it('handles missing required fields', () => {
      const invalidMetrics = { /* missing required fields */ };

      expect(() => parsePrometheusMetrics(invalidMetrics))
        .toThrow('Missing required metrics');
    });

    it('handles invalid data types', () => {
      const invalidData = {
        kumomta_messages_sent_total: { value: 'not-a-number' }
      };

      expect(() => parsePrometheusMetrics(invalidData))
        .toThrow('Invalid metric value');
    });
  });

  describe('Race Conditions', () => {
    it('handles concurrent config updates', async () => {
      let updateCount = 0;
      server.use(
        rest.put('/api/admin/config/core', async (req, res, ctx) => {
          updateCount++;
          await delay(100);
          return res(ctx.json({ success: true, version: updateCount }));
        })
      );

      const [res1, res2] = await Promise.all([
        api.put('/api/admin/config/core', { setting: 'value1' }),
        api.put('/api/admin/config/core', { setting: 'value2' })
      ]);

      expect(res1.data.version).toBeLessThan(res2.data.version);
    });

    it('prevents duplicate queue status updates', async () => {
      const updateSpy = jest.fn();

      const { result } = renderHook(() => useQueue());

      await act(async () => {
        const promise1 = result.current.updateStatus({ id: '1', status: 'completed' });
        const promise2 = result.current.updateStatus({ id: '1', status: 'failed' });

        await Promise.all([promise1, promise2]);
      });

      // Should only make one request due to deduplication
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cache Invalidation', () => {
    it('invalidates queue cache on status update', async () => {
      const queryClient = new QueryClient();
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useQueue(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      });

      await act(async () => {
        await result.current.updateStatus({ id: '1', status: 'completed' });
      });

      expect(invalidateSpy).toHaveBeenCalledWith(['queue']);
    });

    it('refetches after invalidation', async () => {
      let fetchCount = 0;
      server.use(
        rest.get('/api/admin/queue/list', (req, res, ctx) => {
          fetchCount++;
          return res(ctx.json([]));
        })
      );

      const { result } = renderHook(() => useQueue());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const initialFetchCount = fetchCount;

      await act(async () => {
        await result.current.refetch();
      });

      expect(fetchCount).toBe(initialFetchCount + 1);
    });
  });

  describe('Memory Management', () => {
    it('cleans up query subscriptions on unmount', () => {
      const queryClient = new QueryClient();
      const unsubscribeSpy = jest.fn();

      const { unmount } = renderHook(() => useQueue(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      });

      unmount();

      // Verify no memory leaks
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });

    it('cancels in-flight requests on unmount', async () => {
      const abortSpy = jest.fn();

      server.use(
        rest.get('/api/admin/queue/list', async (req, res, ctx) => {
          req.signal.addEventListener('abort', abortSpy);
          await delay(5000);
          return res(ctx.json([]));
        })
      );

      const { unmount } = renderHook(() => useQueue());

      unmount();

      await waitFor(() => expect(abortSpy).toHaveBeenCalled());
    });
  });
});
```

---

### Phase 2: High Priority (Priority: HIGH)
**Estimated Tests**: 38
**Target Completion**: Week 3-4

#### 2.1 Data Validation Tests (10 tests)
#### 2.2 Performance Benchmarks (5 tests)
#### 2.3 Network Error Scenarios (8 tests)
#### 2.4 Accessibility Compliance (15 tests)

---

### Phase 3: Medium Priority (Priority: MEDIUM)
**Estimated Tests**: 29
**Target Completion**: Week 5-6

#### 3.1 Security Testing (10 tests)
#### 3.2 Race Condition Handling (6 tests)
#### 3.3 Memory Leak Detection (5 tests)
#### 3.4 Mobile Responsiveness (8 tests)

---

## Test Data Requirements

### Mock Fixtures Needed

**Create**: `/tests/fixtures/`

1. **prometheus-metrics-sample.txt**
   ```
   kumomta_messages_sent_total 12450
   kumomta_bounce_total 125
   kumomta_delayed_total 45
   kumomta_throughput 350
   ```

2. **bounce-list-response.json**
   ```json
   {
     "domains": [
       { "domain": "example.com", "scheduled": 125, "ready": 45 }
     ]
   }
   ```

3. **queue-items-large.json** (1000+ items for performance testing)

4. **error-responses.json** (All error codes 400-503)

### MSW Handlers Needed

**Create**: `/tests/mocks/handlers/`

1. `kumomta-metrics-handler.ts`
2. `queue-operations-handler.ts`
3. `auth-handler.ts`
4. `config-handler.ts`
5. `error-simulation-handler.ts`

---

## Success Criteria

✅ **Code Coverage**: >85% overall
✅ **Contract Tests**: 100% pass rate
✅ **E2E Tests**: 100% pass rate
✅ **Accessibility**: 0 critical violations
✅ **Performance**: FCP <1.8s, LCP <2.5s
✅ **Error Recovery**: 100% graceful handling

---

## Testing Commands

```bash
# Run all tests
npm run test

# Run integration tests only
npm run test -- --grep "integration"

# Run contract tests only
npm run test -- --grep "contract"

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run accessibility tests
npm run test -- --grep "accessibility"

# Watch mode
npm run test:watch
```

---

## Compatibility Matrix

| Component | Versions | Status |
|-----------|----------|--------|
| KumoMTA Server | latest, 1.0.x | To Test |
| Browsers | Chrome, Firefox, Safari, Edge | To Test |
| Screen Sizes | Desktop, Tablet, Mobile | To Test |
| Auth Methods | HTTP Basic Auth | To Test |

---

## Next Steps

1. **Week 1-2**: Implement Phase 1 critical tests (55 tests)
2. **Week 3-4**: Implement Phase 2 high priority tests (38 tests)
3. **Week 5-6**: Implement Phase 3 medium priority tests (29 tests)
4. **Week 7**: Integration and E2E testing across all scenarios
5. **Week 8**: Performance optimization and final validation

---

**Total Additional Tests Needed**: 122
**Current Test Coverage**: 15
**Target Test Coverage**: 137 tests

**Estimated Effort**: 6-8 weeks for full implementation
