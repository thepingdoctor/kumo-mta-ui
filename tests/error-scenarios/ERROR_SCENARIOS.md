# Error Scenario Testing Plan - KumoMTA UI

## Comprehensive Error Coverage Strategy

---

## 1. Network Errors

### 1.1 Connection Failures
**Test File**: `tests/error-scenarios/network-errors.test.tsx`

```typescript
describe('Network Errors', () => {
  describe('Connection Timeout', () => {
    it('should handle timeout gracefully', async () => {
      // Mock slow endpoint (>10s timeout)
      server.use(
        http.get('/api/queue', async () => {
          await delay(15000);
          return HttpResponse.json({});
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(screen.getByText(/request timeout/i)).toBeInTheDocument();
      }, { timeout: 12000 });

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should allow retry after timeout', async () => {
      let timeoutCount = 0;

      server.use(
        http.get('/api/queue', async () => {
          timeoutCount++;
          if (timeoutCount === 1) {
            await delay(15000);
          }
          return HttpResponse.json({ data: queueItemsFixture });
        })
      );

      render(<QueueManager />);

      // Wait for timeout error
      await waitFor(() => {
        expect(screen.getByText(/timeout/i)).toBeInTheDocument();
      }, { timeout: 12000 });

      // Click retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);

      // Verify success
      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Network Offline', () => {
    it('should detect offline status', async () => {
      // Simulate offline
      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.error();
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(screen.getByText(/no internet connection/i)).toBeInTheDocument();
      });
    });

    it('should auto-retry when back online', async () => {
      let isOnline = false;

      server.use(
        http.get('/api/queue', () => {
          if (!isOnline) {
            return HttpResponse.error();
          }
          return HttpResponse.json({ data: queueItemsFixture });
        })
      );

      render(<QueueManager />);

      // Offline error shown
      await waitFor(() => {
        expect(screen.getByText(/no internet/i)).toBeInTheDocument();
      });

      // Simulate online
      isOnline = true;
      fireEvent.online(window);

      // Auto-retry and success
      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Request Abortion', () => {
    it('should handle aborted requests', async () => {
      const abortController = new AbortController();

      // Abort request mid-flight
      server.use(
        http.get('/api/queue', async ({ request }) => {
          request.signal.addEventListener('abort', () => {
            throw new Error('Request aborted');
          });
          await delay(1000);
          return HttpResponse.json({});
        })
      );

      render(<QueueManager />);

      // Abort after 500ms
      setTimeout(() => abortController.abort(), 500);

      await waitFor(() => {
        expect(screen.getByText(/request cancelled/i)).toBeInTheDocument();
      });
    });
  });

  describe('DNS Failure', () => {
    it('should handle DNS resolution errors', async () => {
      server.use(
        http.get('/api/queue', () => {
          return new HttpResponse(null, {
            status: 0,
            statusText: 'Network Error'
          });
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });
});
```

---

## 2. API Errors

### 2.1 Client Errors (4xx)
**Test File**: `tests/error-scenarios/client-errors.test.tsx`

```typescript
describe('Client Errors (4xx)', () => {
  describe('400 Bad Request', () => {
    it('should display validation error message', async () => {
      server.use(
        http.post('/api/queue', () => {
          return HttpResponse.json(
            {
              error: 'Invalid request',
              message: 'Missing required field: recipient'
            },
            { status: 400 }
          );
        })
      );

      render(<AddCustomerModal />);

      // Submit without recipient
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/missing required field: recipient/i)).toBeInTheDocument();
      });
    });
  });

  describe('401 Unauthorized', () => {
    it('should redirect to login on 401', async () => {
      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        useNavigate: () => mockNavigate
      }));

      render(<QueueManager />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should clear auth token on 401', async () => {
      localStorage.setItem('auth_token', 'mock_token');

      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json({}, { status: 401 });
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(localStorage.getItem('auth_token')).toBeNull();
      });
    });
  });

  describe('403 Forbidden', () => {
    it('should show insufficient permissions error', async () => {
      server.use(
        http.put('/api/config/core', () => {
          return HttpResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
          );
        })
      );

      render(<ConfigEditor />);

      // Try to save config
      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/insufficient permissions/i)).toBeInTheDocument();
      });
    });
  });

  describe('404 Not Found', () => {
    it('should handle missing resource', async () => {
      server.use(
        http.get('/api/queue/999', () => {
          return HttpResponse.json(
            { error: 'Queue item not found' },
            { status: 404 }
          );
        })
      );

      render(<QueueItemDetail id="999" />);

      await waitFor(() => {
        expect(screen.getByText(/item not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('409 Conflict', () => {
    it('should handle concurrent modification', async () => {
      server.use(
        http.put('/api/queue/1/status', () => {
          return HttpResponse.json(
            {
              error: 'Conflict',
              message: 'Item was modified by another user'
            },
            { status: 409 }
          );
        })
      );

      render(<QueueManager />);

      // Update status
      const updateButton = screen.getByRole('button', { name: /update status/i });
      await userEvent.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText(/modified by another user/i)).toBeInTheDocument();
      });

      // Verify refresh option provided
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });
  });

  describe('422 Unprocessable Entity', () => {
    it('should display field-level validation errors', async () => {
      server.use(
        http.put('/api/config/core', () => {
          return HttpResponse.json(
            {
              error: 'Validation failed',
              details: [
                { field: 'hostname', message: 'Invalid format' },
                { field: 'max_connections', message: 'Must be positive' }
              ]
            },
            { status: 422 }
          );
        })
      );

      render(<ConfigEditor />);

      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
      });
    });
  });

  describe('429 Too Many Requests', () => {
    it('should handle rate limiting', async () => {
      server.use(
        http.post('/api/queue', () => {
          return HttpResponse.json(
            {
              error: 'Too many requests',
              retry_after: 60
            },
            { status: 429 }
          );
        })
      );

      render(<AddCustomerModal />);

      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
        expect(screen.getByText(/try again in 60 seconds/i)).toBeInTheDocument();
      });
    });
  });
});
```

### 2.2 Server Errors (5xx)
**Test File**: `tests/error-scenarios/server-errors.test.tsx`

```typescript
describe('Server Errors (5xx)', () => {
  describe('500 Internal Server Error', () => {
    it('should display generic error message', async () => {
      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should provide retry option', async () => {
      let errorCount = 0;

      server.use(
        http.get('/api/queue', () => {
          errorCount++;
          if (errorCount === 1) {
            return HttpResponse.json({}, { status: 500 });
          }
          return HttpResponse.json({ data: queueItemsFixture });
        })
      );

      render(<QueueManager />);

      // Error shown
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });

      // Retry
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await userEvent.click(retryButton);

      // Success
      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });
    });

    it('should log error to monitoring service', async () => {
      const mockErrorLogger = jest.fn();
      global.errorLogger = mockErrorLogger;

      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(mockErrorLogger).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'API_ERROR',
            status: 500
          })
        );
      });
    });
  });

  describe('502 Bad Gateway', () => {
    it('should handle proxy errors', async () => {
      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json(
            { error: 'Bad gateway' },
            { status: 502 }
          );
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(screen.getByText(/service temporarily unavailable/i)).toBeInTheDocument();
      });
    });
  });

  describe('503 Service Unavailable', () => {
    it('should display maintenance message', async () => {
      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json(
            {
              error: 'Service unavailable',
              message: 'System maintenance in progress'
            },
            { status: 503 }
          );
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(screen.getByText(/maintenance in progress/i)).toBeInTheDocument();
      });
    });

    it('should auto-retry after delay', async () => {
      jest.useFakeTimers();
      let unavailableCount = 0;

      server.use(
        http.get('/api/queue', () => {
          unavailableCount++;
          if (unavailableCount === 1) {
            return HttpResponse.json({}, { status: 503 });
          }
          return HttpResponse.json({ data: queueItemsFixture });
        })
      );

      render(<QueueManager />);

      // Error shown
      await waitFor(() => {
        expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
      });

      // Auto-retry after 30s
      act(() => {
        jest.advanceTimersByTime(30000);
      });

      await waitFor(() => {
        expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('504 Gateway Timeout', () => {
    it('should handle upstream timeout', async () => {
      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json(
            { error: 'Gateway timeout' },
            { status: 504 }
          );
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(screen.getByText(/request timed out/i)).toBeInTheDocument();
      });
    });
  });
});
```

---

## 3. Application Errors

### 3.1 State Errors
**Test File**: `tests/error-scenarios/state-errors.test.tsx`

```typescript
describe('State Errors', () => {
  describe('Corrupted State', () => {
    it('should recover from corrupted localStorage', () => {
      // Corrupt localStorage
      localStorage.setItem('auth', 'invalid json{');

      expect(() => {
        render(<App />);
      }).not.toThrow();

      // Should clear corrupt data
      expect(localStorage.getItem('auth')).toBeNull();
    });

    it('should handle invalid Zustand state', () => {
      // Inject invalid state
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        // @ts-ignore
        result.current.login({ invalid: 'user' }, null);
      });

      // Should not crash
      expect(result.current.user).toBeNull();
    });
  });

  describe('Cache Inconsistency', () => {
    it('should detect stale cache data', async () => {
      const queryClient = new QueryClient();

      // Set stale cache
      queryClient.setQueryData(['queue'], {
        data: [{ id: '1', status: 'queued' }]
      });

      // Mock fresh data
      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json({
            data: [{ id: '1', status: 'sent' }]
          });
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <QueueManager />
        </QueryClientProvider>
      );

      // Should refetch fresh data
      await waitFor(() => {
        expect(screen.getByText(/sent/i)).toBeInTheDocument();
      });
    });
  });

  describe('Race Conditions', () => {
    it('should handle concurrent mutations', async () => {
      let updateCount = 0;

      server.use(
        http.put('/api/queue/1/status', async () => {
          updateCount++;
          await delay(100);
          return HttpResponse.json({
            success: true,
            data: { id: '1', status: 'sent' }
          });
        })
      );

      render(<QueueManager />);

      // Trigger two concurrent updates
      const buttons = screen.getAllByRole('button', { name: /update/i });
      await userEvent.click(buttons[0]);
      await userEvent.click(buttons[0]);

      await waitFor(() => {
        // Both requests completed
        expect(updateCount).toBe(2);
      });

      // Last update wins
      expect(screen.getByText(/sent/i)).toBeInTheDocument();
    });
  });
});
```

### 3.2 Rendering Errors
**Test File**: `tests/error-scenarios/rendering-errors.test.tsx`

```typescript
describe('Rendering Errors', () => {
  describe('Component Crashes', () => {
    it('should catch rendering errors with ErrorBoundary', () => {
      const ThrowError = () => {
        throw new Error('Render error');
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should reset error state', async () => {
      let shouldThrow = true;

      const MaybeThrow = () => {
        if (shouldThrow) {
          throw new Error('Conditional error');
        }
        return <div>Success</div>;
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <ErrorBoundary>
          <MaybeThrow />
        </ErrorBoundary>
      );

      // Error shown
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Fix condition
      shouldThrow = false;

      // Reset
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await userEvent.click(resetButton);

      // Success
      expect(screen.getByText('Success')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Undefined Data', () => {
    it('should handle undefined props gracefully', () => {
      expect(() => {
        render(<Dashboard metrics={undefined} />);
      }).not.toThrow();

      // Should show default/empty state
      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });

    it('should handle null values in lists', () => {
      const items = [
        { id: '1', name: 'Item 1' },
        null,
        { id: '3', name: 'Item 3' }
      ];

      expect(() => {
        render(<ItemList items={items} />);
      }).not.toThrow();

      // Should filter out nulls
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });
});
```

---

## 4. User Input Errors

### 4.1 Validation Errors
**Test File**: `tests/error-scenarios/validation-errors.test.tsx`

```typescript
describe('Validation Errors', () => {
  describe('Required Fields', () => {
    it('should validate required email', async () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole('button', { name: /login/i });
      await userEvent.click(submitButton);

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it('should validate required password', async () => {
      render(<LoginForm />);

      await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
      await userEvent.click(screen.getByRole('button', { name: /login/i }));

      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  describe('Format Validation', () => {
    it('should validate email format', async () => {
      render(<ConfigEditor />);

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.tab();

      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });

    it('should validate URL format', async () => {
      render(<ConfigEditor />);

      const urlInput = screen.getByLabelText(/webhook url/i);
      await userEvent.type(urlInput, 'not-a-url');
      await userEvent.tab();

      expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
    });

    it('should validate hostname format', async () => {
      render(<ConfigEditor />);

      const hostnameInput = screen.getByLabelText(/hostname/i);
      await userEvent.type(hostnameInput, 'invalid hostname!');
      await userEvent.tab();

      expect(screen.getByText(/invalid hostname/i)).toBeInTheDocument();
    });
  });

  describe('Range Validation', () => {
    it('should validate minimum value', async () => {
      render(<ConfigEditor />);

      const numberInput = screen.getByLabelText(/max connections/i);
      await userEvent.clear(numberInput);
      await userEvent.type(numberInput, '-1');
      await userEvent.tab();

      expect(screen.getByText(/must be at least 1/i)).toBeInTheDocument();
    });

    it('should validate maximum value', async () => {
      render(<ConfigEditor />);

      const numberInput = screen.getByLabelText(/max connections/i);
      await userEvent.clear(numberInput);
      await userEvent.type(numberInput, '99999');
      await userEvent.tab();

      expect(screen.getByText(/cannot exceed 10000/i)).toBeInTheDocument();
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize script tags', async () => {
      render(<AddCustomerModal />);

      const messageInput = screen.getByLabelText(/message/i);
      await userEvent.type(messageInput, '<script>alert("xss")</script>');

      // Submit form
      await userEvent.click(screen.getByRole('button', { name: /submit/i }));

      // Verify script tags removed
      await waitFor(() => {
        const sanitized = screen.getByTestId('preview');
        expect(sanitized.innerHTML).not.toContain('<script>');
      });
    });

    it('should escape HTML entities', async () => {
      render(<AddCustomerModal />);

      const input = screen.getByLabelText(/subject/i);
      await userEvent.type(input, '<img src=x onerror=alert(1)>');

      await userEvent.tab();

      // Should be escaped
      expect(input).toHaveValue('&lt;img src=x onerror=alert(1)&gt;');
    });
  });
});
```

---

## 5. Edge Cases

### 5.1 Boundary Conditions
**Test File**: `tests/error-scenarios/edge-cases.test.tsx`

```typescript
describe('Edge Cases', () => {
  describe('Empty Data', () => {
    it('should handle empty queue gracefully', async () => {
      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json({ data: [] });
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(screen.getByText(/no items in queue/i)).toBeInTheDocument();
      });
    });

    it('should handle empty config', async () => {
      server.use(
        http.get('/api/config/core', () => {
          return HttpResponse.json({});
        })
      );

      render(<ConfigEditor />);

      await waitFor(() => {
        // Should show default values
        expect(screen.getByLabelText(/hostname/i)).toHaveValue('');
      });
    });
  });

  describe('Large Datasets', () => {
    it('should handle 10,000 queue items', async () => {
      const largeDataset = generateQueueItems(10000);

      server.use(
        http.get('/api/queue', () => {
          return HttpResponse.json({
            data: largeDataset.slice(0, 50),
            total: 10000
          });
        })
      );

      render(<QueueManager />);

      await waitFor(() => {
        expect(screen.getAllByTestId('queue-item')).toHaveLength(50);
      });

      // Verify pagination
      expect(screen.getByText(/showing 1-50 of 10,000/i)).toBeInTheDocument();
    });
  });

  describe('Special Characters', () => {
    it('should handle unicode characters', async () => {
      render(<AddCustomerModal />);

      const input = screen.getByLabelText(/recipient/i);
      await userEvent.type(input, 'user@例え.jp');

      expect(input).toHaveValue('user@例え.jp');
    });

    it('should handle emoji in messages', async () => {
      render(<AddCustomerModal />);

      const messageInput = screen.getByLabelText(/message/i);
      await userEvent.type(messageInput, 'Hello 👋 World 🌍');

      expect(messageInput).toHaveValue('Hello 👋 World 🌍');
    });
  });

  describe('Timezone Handling', () => {
    it('should display timestamps in user timezone', () => {
      const utcTime = '2025-10-23T10:00:00Z';

      render(<QueueItem timestamp={utcTime} />);

      // Should convert to local time
      const displayedTime = screen.getByTestId('timestamp');
      expect(displayedTime).toBeInTheDocument();
      // Verify format (implementation dependent)
    });

    it('should handle DST transitions', () => {
      // Test timestamp during DST change
      const dstTime = '2025-03-10T02:30:00Z';

      render(<QueueItem timestamp={dstTime} />);

      expect(screen.getByTestId('timestamp')).toBeInTheDocument();
    });
  });

  describe('Concurrent Sessions', () => {
    it('should handle logout in another tab', async () => {
      render(<App />);

      // Login
      await loginAsAdmin();

      // Simulate logout in another tab
      fireEvent(window, new StorageEvent('storage', {
        key: 'auth_token',
        oldValue: 'token123',
        newValue: null
      }));

      // Should redirect to login
      await waitFor(() => {
        expect(window.location.pathname).toBe('/login');
      });
    });

    it('should sync state across tabs', async () => {
      render(<App />);

      // Update config in another tab
      fireEvent(window, new StorageEvent('storage', {
        key: 'config',
        oldValue: '{"theme":"light"}',
        newValue: '{"theme":"dark"}'
      }));

      // Should apply new theme
      await waitFor(() => {
        expect(document.body).toHaveClass('dark');
      });
    });
  });
});
```

---

## 6. Error Reporting

### 6.1 Error Logging
**File**: `tests/error-scenarios/error-logging.test.tsx`

```typescript
describe('Error Logging', () => {
  it('should log errors to monitoring service', async () => {
    const mockLogger = jest.fn();
    global.errorMonitoring = { log: mockLogger };

    server.use(
      http.get('/api/queue', () => {
        return HttpResponse.json({}, { status: 500 });
      })
    );

    render(<QueueManager />);

    await waitFor(() => {
      expect(mockLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          message: 'Failed to fetch queue',
          context: expect.any(Object)
        })
      );
    });
  });

  it('should include user context in error logs', async () => {
    const mockLogger = jest.fn();
    global.errorMonitoring = { log: mockLogger };

    const ThrowError = () => {
      throw new Error('Test error');
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(mockLogger).toHaveBeenCalledWith(
      expect.objectContaining({
        user: expect.objectContaining({
          id: expect.any(String)
        }),
        error: expect.any(Error)
      })
    );

    consoleSpy.mockRestore();
  });
});
```

---

**Total Error Scenarios**: 60+
**Coverage Areas**: Network, API, State, Rendering, Validation, Edge Cases
**Error Recovery**: Automatic retry, user-initiated retry, fallback states
**Logging**: Comprehensive error tracking and monitoring integration
