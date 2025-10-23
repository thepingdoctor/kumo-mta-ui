# Integration Test Plan - KumoMTA UI

## Test Framework: Vitest + MSW + React Testing Library

---

## 1. API Integration Tests

### 1.1 Queue Management Integration
**File**: `tests/integration/queue.integration.test.tsx`

```typescript
describe('Queue Management Integration', () => {
  beforeEach(() => {
    setupMockServer()
  })

  describe('Queue Listing', () => {
    it('should fetch and display queue items', async () => {
      // Mock API response with queue data
      // Render QueueManager component
      // Wait for data to load
      // Assert items are displayed
    })

    it('should apply status filter and refetch', async () => {
      // Render component
      // Click status filter
      // Verify API called with filter params
      // Assert filtered results displayed
    })

    it('should handle pagination', async () => {
      // Render with 100 items
      // Verify first page displayed
      // Click next page
      // Verify API called with page=2
      // Assert new items displayed
    })

    it('should handle empty results', async () => {
      // Mock empty response
      // Render component
      // Assert empty state displayed
    })
  })

  describe('Status Updates', () => {
    it('should update queue item status', async () => {
      // Render queue with items
      // Click status update button
      // Wait for mutation
      // Verify API called with new status
      // Assert UI updated optimistically
      // Verify cache invalidated
    })

    it('should rollback on update failure', async () => {
      // Mock failed update
      // Attempt status update
      // Verify error shown
      // Assert original status restored
    })

    it('should handle concurrent updates', async () => {
      // Initiate multiple updates
      // Verify all requests sent
      // Assert final state is correct
    })
  })

  describe('Add Customer', () => {
    it('should add new customer to queue', async () => {
      // Open add customer modal
      // Fill in form
      // Submit form
      // Verify API called
      // Assert new item in list
      // Verify cache invalidated
    })

    it('should validate form before submit', async () => {
      // Submit empty form
      // Assert validation errors
      // Verify API not called
    })

    it('should handle duplicate customer error', async () => {
      // Mock 409 conflict error
      // Submit form
      // Assert error message shown
      // Verify modal still open
    })
  })

  describe('Queue Metrics', () => {
    it('should fetch and display metrics', async () => {
      // Render Dashboard
      // Wait for metrics load
      // Verify API called
      // Assert metrics displayed
    })

    it('should refresh metrics on interval', async () => {
      // Render Dashboard
      // Wait for initial load
      // Advance timer 30 seconds
      // Verify API called again
      // Assert metrics updated
    })
  })

  describe('Error Handling', () => {
    it('should handle 401 unauthorized', async () => {
      // Mock 401 response
      // Attempt fetch
      // Verify redirected to login
      // Assert auth cleared
    })

    it('should handle 500 server error', async () => {
      // Mock 500 response
      // Attempt fetch
      // Assert error message shown
      // Verify retry button available
    })

    it('should handle network timeout', async () => {
      // Mock timeout
      // Attempt fetch
      // Assert timeout error shown
    })
  })
})
```

### 1.2 Configuration Management Integration
**File**: `tests/integration/config.integration.test.tsx`

```typescript
describe('Configuration Management Integration', () => {
  describe('Core Configuration', () => {
    it('should load current config', async () => {
      // Mock GET /config/core
      // Render ConfigEditor
      // Wait for load
      // Assert fields populated
    })

    it('should update core config', async () => {
      // Render ConfigEditor
      // Modify fields
      // Submit form
      // Verify PUT /config/core called
      // Assert success message
      // Verify form reset
    })

    it('should validate config before save', async () => {
      // Enter invalid values
      // Submit form
      // Assert validation errors
      // Verify API not called
    })

    it('should handle save failure', async () => {
      // Mock failed save
      // Submit valid form
      // Assert error message
      // Verify form not reset
      // Allow retry
    })
  })

  describe('Integration Configuration', () => {
    it('should update SMTP settings', async () => {
      // Navigate to integration tab
      // Modify SMTP fields
      // Submit
      // Verify API called
      // Assert success
    })

    it('should test SMTP connection', async () => {
      // Enter SMTP settings
      // Click test connection
      // Mock test endpoint
      // Assert connection result shown
    })

    it('should update webhook settings', async () => {
      // Modify webhook URL
      // Submit
      // Verify saved
    })
  })

  describe('Performance Configuration', () => {
    it('should update rate limits', async () => {
      // Modify rate limit fields
      // Submit
      // Verify API called
      // Assert updated
    })

    it('should validate numeric ranges', async () => {
      // Enter out-of-range value
      // Submit
      // Assert validation error
    })
  })

  describe('Concurrent Updates', () => {
    it('should handle concurrent config updates', async () => {
      // Open config in two tabs
      // Modify in first tab
      // Modify in second tab
      // Submit both
      // Assert last write wins
      // Show conflict warning
    })
  })
})
```

### 1.3 Authentication Flow Integration
**File**: `tests/integration/auth.integration.test.tsx`

```typescript
describe('Authentication Integration', () => {
  describe('Login Flow', () => {
    it('should login with valid credentials', async () => {
      // Render login form
      // Enter credentials
      // Submit
      // Mock POST /auth/login
      // Assert token stored
      // Assert redirected to dashboard
      // Verify user data in store
    })

    it('should reject invalid credentials', async () => {
      // Mock 401 response
      // Submit login
      // Assert error message
      // Verify no redirect
      // Assert no token stored
    })

    it('should handle network error', async () => {
      // Mock network failure
      // Submit login
      // Assert connection error shown
    })
  })

  describe('Session Management', () => {
    it('should persist session across refresh', async () => {
      // Login successfully
      // Reload page
      // Assert still logged in
      // Verify token sent with requests
    })

    it('should logout and clear session', async () => {
      // Login
      // Click logout
      // Assert token cleared
      // Assert redirected to login
      // Verify subsequent requests unauthorized
    })

    it('should handle token expiration', async () => {
      // Login with expiring token
      // Wait for expiration
      // Attempt API request
      // Assert auto-logout
      // Verify redirected to login
    })

    it('should refresh expired token', async () => {
      // Login
      // Mock refresh endpoint
      // Token near expiration
      // Make API request
      // Verify token refreshed
      // Assert request succeeds
    })
  })

  describe('Protected Routes', () => {
    it('should redirect unauthorized users', async () => {
      // Clear auth
      // Navigate to protected route
      // Assert redirected to login
    })

    it('should allow access with valid token', async () => {
      // Login
      // Navigate to protected route
      // Assert route rendered
    })

    it('should enforce role-based access', async () => {
      // Login as viewer
      // Attempt admin action
      // Assert 403 forbidden
      // Show insufficient permissions
    })
  })
})
```

---

## 2. State Management Integration

### 2.1 React Query Integration
**File**: `tests/integration/reactQuery.integration.test.tsx`

```typescript
describe('React Query Integration', () => {
  describe('Cache Management', () => {
    it('should cache query results', async () => {
      // Fetch queue items
      // Navigate away
      // Navigate back
      // Verify no new fetch (cache hit)
    })

    it('should invalidate cache on mutation', async () => {
      // Fetch queue
      // Update item
      // Verify refetch triggered
      // Assert fresh data
    })

    it('should deduplicate simultaneous queries', async () => {
      // Trigger multiple identical queries
      // Verify single network request
      // All queries receive same data
    })
  })

  describe('Optimistic Updates', () => {
    it('should update UI optimistically', async () => {
      // Display queue item
      // Update status
      // Assert immediate UI update
      // Verify API call in background
    })

    it('should rollback on error', async () => {
      // Mock failed mutation
      // Attempt update
      // Assert UI rolls back
      // Show error message
    })
  })

  describe('Background Refetching', () => {
    it('should refetch stale data on focus', async () => {
      // Fetch data
      // Blur window
      // Wait for stale time
      // Focus window
      // Verify refetch triggered
    })

    it('should refetch on network reconnect', async () => {
      // Fetch data
      // Simulate offline
      // Simulate online
      // Verify refetch triggered
    })
  })
})
```

### 2.2 Zustand Store Integration
**File**: `tests/integration/zustand.integration.test.tsx`

```typescript
describe('Zustand Store Integration', () => {
  describe('Cross-Component State', () => {
    it('should share auth state across components', async () => {
      // Login in one component
      // Verify user shown in header
      // Verify permissions in sidebar
    })

    it('should update all subscribers', async () => {
      // Render multiple components using store
      // Update store
      // Assert all components re-render
    })
  })

  describe('State Persistence', () => {
    it('should persist auth to localStorage', async () => {
      // Login
      // Verify localStorage updated
      // Reload page
      // Assert state restored
    })

    it('should handle storage events', async () => {
      // Open app in two tabs
      // Login in tab 1
      // Verify tab 2 updates
    })
  })
})
```

---

## 3. Router Integration

### 3.1 Navigation Integration
**File**: `tests/integration/router.integration.test.tsx`

```typescript
describe('Router Integration', () => {
  describe('Route Navigation', () => {
    it('should navigate between routes', async () => {
      // Click dashboard link
      // Assert dashboard rendered
      // Click queue link
      // Assert queue rendered
      // Verify URL updated
    })

    it('should handle browser back/forward', async () => {
      // Navigate to multiple routes
      // Click browser back
      // Assert previous route
      // Click browser forward
      // Assert next route
    })

    it('should handle direct URL access', async () => {
      // Navigate directly to /queue
      // Assert queue rendered
    })
  })

  describe('Route Parameters', () => {
    it('should pass URL params to components', async () => {
      // Navigate to /queue?status=failed
      // Assert filter applied
    })

    it('should update URL on filter change', async () => {
      // Apply filter
      // Assert URL updated
      // Verify shareable URL
    })
  })

  describe('404 Handling', () => {
    it('should show 404 for invalid routes', async () => {
      // Navigate to /invalid
      // Assert 404 page shown
    })

    it('should provide navigation from 404', async () => {
      // On 404 page
      // Click home link
      // Assert dashboard rendered
    })
  })
})
```

---

## 4. Form Integration

### 4.1 React Hook Form Integration
**File**: `tests/integration/forms.integration.test.tsx`

```typescript
describe('Form Integration', () => {
  describe('Form Validation', () => {
    it('should validate on submit', async () => {
      // Submit empty form
      // Assert validation errors
      // Fill required fields
      // Submit
      // Assert success
    })

    it('should validate on blur', async () => {
      // Focus email field
      // Enter invalid email
      // Blur field
      // Assert error shown immediately
    })

    it('should clear errors on fix', async () => {
      // Trigger validation error
      // Fix the error
      // Assert error cleared
    })
  })

  describe('Form State', () => {
    it('should track dirty state', async () => {
      // Modify form
      // Assert dirty flag set
      // Warn on navigation
    })

    it('should reset form state', async () => {
      // Modify form
      // Click reset
      // Assert original values
      // Assert pristine state
    })
  })

  describe('Form Submission', () => {
    it('should disable submit during request', async () => {
      // Submit form
      // Assert button disabled
      // Wait for response
      // Assert button re-enabled
    })

    it('should show loading indicator', async () => {
      // Submit form
      // Assert loading spinner
      // Wait for response
      // Assert spinner removed
    })
  })
})
```

---

## 5. WebSocket Integration (Future)

### 5.1 Real-time Updates
**File**: `tests/integration/websocket.integration.test.tsx`

```typescript
describe('WebSocket Integration', () => {
  describe('Connection Management', () => {
    it('should establish WebSocket connection')
    it('should reconnect on disconnect')
    it('should handle connection errors')
  })

  describe('Real-time Queue Updates', () => {
    it('should receive queue status updates')
    it('should update UI on message')
    it('should handle concurrent updates')
  })

  describe('Live Metrics', () => {
    it('should stream metric updates')
    it('should update chart in real-time')
  })
})
```

---

## 6. Test Execution

### 6.1 Commands
```bash
# Run all integration tests
npm run test:integration

# Run with coverage
npm run test:integration -- --coverage

# Run specific suite
npm run test:integration queue.integration

# Run in watch mode
npm run test:integration -- --watch
```

### 6.2 Expected Output
```
✓ tests/integration/queue.integration.test.tsx (24)
✓ tests/integration/config.integration.test.tsx (18)
✓ tests/integration/auth.integration.test.tsx (15)
✓ tests/integration/reactQuery.integration.test.tsx (12)

Test Files: 8 passed (8)
Tests: 89 passed (89)
Duration: 4.2s
```

---

## 7. Integration Test Best Practices

### 7.1 Setup Guidelines
- Use MSW for API mocking
- Reset mocks between tests
- Clean up side effects
- Use realistic test data
- Test user workflows, not implementation

### 7.2 Performance
- Keep tests fast (< 5s total)
- Avoid unnecessary waits
- Use efficient queries
- Parallelize when possible

### 7.3 Reliability
- Avoid flaky tests
- Use waitFor properly
- Handle async operations
- Clean up timers/subscriptions

---

**Total Integration Tests Planned**: 85+
**Estimated Coverage**: 75-80%
**Execution Time**: < 5 seconds
