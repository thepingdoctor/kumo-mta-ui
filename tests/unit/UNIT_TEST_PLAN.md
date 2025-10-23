# Unit Test Plan - KumoMTA UI

## Test Framework: Vitest + React Testing Library

---

## 1. Component Tests

### 1.1 Dashboard Component
**File**: `tests/unit/components/Dashboard.test.tsx`

```typescript
describe('Dashboard', () => {
  describe('Metrics Display', () => {
    it('should render all metric cards')
    it('should display correct metric values')
    it('should format large numbers with locale')
    it('should show zero values initially')
    it('should update metrics on data change')
  })

  describe('Chart Rendering', () => {
    it('should render Line chart component')
    it('should pass correct data to chart')
    it('should apply chart options')
    it('should handle empty data gracefully')
    it('should be responsive')
  })

  describe('Server Status', () => {
    it('should show waiting state initially')
    it('should display healthy status with green indicator')
    it('should display degraded status with yellow indicator')
    it('should display down status with red indicator')
    it('should show uptime information')
  })

  describe('Loading & Error States', () => {
    it('should show loading skeleton')
    it('should display error message on fetch failure')
    it('should show retry button on error')
    it('should hide error on successful retry')
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy')
    it('should include aria-hidden for decorative icons')
    it('should be keyboard navigable')
    it('should announce metric updates to screen readers')
  })
})
```

### 1.2 QueueManager Component
**File**: `tests/unit/components/QueueManager.test.tsx`

```typescript
describe('QueueManager', () => {
  describe('Queue Display', () => {
    it('should render queue items in table')
    it('should show empty state when no items')
    it('should display item properties correctly')
    it('should format timestamps properly')
    it('should show retry count')
  })

  describe('Filtering', () => {
    it('should filter by status')
    it('should filter by date range')
    it('should filter by recipient')
    it('should clear all filters')
    it('should maintain filters in URL')
    it('should debounce text input filters')
  })

  describe('Status Updates', () => {
    it('should update item status on action')
    it('should show optimistic update')
    it('should revert on failure')
    it('should disable actions during update')
    it('should show success notification')
  })

  describe('Pagination', () => {
    it('should paginate large datasets')
    it('should navigate between pages')
    it('should maintain filters across pages')
    it('should show total count')
    it('should allow page size change')
  })

  describe('Sorting', () => {
    it('should sort by timestamp')
    it('should sort by status')
    it('should toggle sort direction')
    it('should maintain sort across filters')
  })
})
```

### 1.3 ConfigEditor Component
**File**: `tests/unit/components/ConfigEditor.test.tsx`

```typescript
describe('ConfigEditor', () => {
  describe('Form Rendering', () => {
    it('should render all config sections')
    it('should display current values')
    it('should show field descriptions')
    it('should indicate required fields')
  })

  describe('Validation', () => {
    it('should validate required fields')
    it('should validate email format')
    it('should validate number ranges')
    it('should validate URL format')
    it('should show validation errors inline')
    it('should prevent submit with errors')
  })

  describe('Form Submission', () => {
    it('should submit valid form data')
    it('should show loading state during submit')
    it('should display success message')
    it('should handle submit errors')
    it('should reset form on successful submit')
  })

  describe('Unsaved Changes', () => {
    it('should detect form changes')
    it('should warn before navigation')
    it('should allow discard changes')
    it('should allow save changes')
  })

  describe('Reset Functionality', () => {
    it('should reset to initial values')
    it('should clear validation errors')
    it('should re-enable submit button')
  })
})
```

### 1.4 Layout Component
**File**: `tests/unit/components/Layout.test.tsx`

```typescript
describe('Layout', () => {
  describe('Navigation', () => {
    it('should render all nav items')
    it('should highlight active route')
    it('should navigate on click')
    it('should close mobile menu on selection')
  })

  describe('User Menu', () => {
    it('should display user name')
    it('should show user role badge')
    it('should toggle dropdown on click')
    it('should close on outside click')
    it('should logout on action')
  })

  describe('Mobile Responsiveness', () => {
    it('should show hamburger menu on mobile')
    it('should hide nav on mobile initially')
    it('should toggle nav on hamburger click')
    it('should close nav on overlay click')
  })

  describe('Accessibility', () => {
    it('should have proper landmark roles')
    it('should manage focus in mobile menu')
    it('should trap focus in open dropdown')
    it('should close menu on Escape key')
  })
})
```

### 1.5 ErrorBoundary Component
**File**: `tests/unit/components/ErrorBoundary.test.tsx`

```typescript
describe('ErrorBoundary', () => {
  describe('Error Catching', () => {
    it('should catch child component errors')
    it('should catch async errors')
    it('should log error to console')
    it('should report error to monitoring service')
  })

  describe('Error Display', () => {
    it('should show error message')
    it('should display error stack in dev mode')
    it('should hide stack in production')
    it('should show friendly error message')
  })

  describe('Recovery', () => {
    it('should show reset button')
    it('should reset error state on click')
    it('should re-render children after reset')
    it('should clear error from state')
  })

  describe('Error Types', () => {
    it('should handle network errors')
    it('should handle rendering errors')
    it('should handle state errors')
    it('should handle undefined errors')
  })
})
```

---

## 2. Hook Tests

### 2.1 useQueue Hook
**File**: `tests/unit/hooks/useQueue.test.tsx`

```typescript
describe('useQueue', () => {
  describe('Data Fetching', () => {
    it('should fetch queue items on mount')
    it('should apply filters to query')
    it('should set loading state')
    it('should update data on success')
    it('should set error on failure')
  })

  describe('Mutations', () => {
    it('should update status mutation')
    it('should add customer mutation')
    it('should invalidate cache after mutation')
    it('should show loading during mutation')
    it('should handle mutation errors')
  })

  describe('Cache Management', () => {
    it('should cache query results')
    it('should invalidate on mutation')
    it('should refetch stale data')
    it('should deduplicate requests')
  })

  describe('Error Handling', () => {
    it('should throw custom error message')
    it('should retry failed requests')
    it('should handle timeout errors')
    it('should handle network errors')
  })
})
```

---

## 3. Store Tests

### 3.1 authStore
**File**: `tests/unit/store/authStore.test.ts`

```typescript
describe('authStore', () => {
  describe('Initial State', () => {
    it('should have null user initially')
    it('should have null token initially')
  })

  describe('Login Action', () => {
    it('should set user on login')
    it('should set token on login')
    it('should update state atomically')
  })

  describe('Logout Action', () => {
    it('should clear user on logout')
    it('should clear token on logout')
    it('should reset to initial state')
  })

  describe('State Persistence', () => {
    it('should persist state to localStorage')
    it('should hydrate state from localStorage')
    it('should handle corrupt localStorage data')
    it('should clear localStorage on logout')
  })
})
```

---

## 4. Service Tests

### 4.1 API Service
**File**: `tests/unit/services/api.test.ts`

```typescript
describe('apiService', () => {
  describe('Request Interceptor', () => {
    it('should add auth token to headers')
    it('should not add token if not present')
    it('should handle expired tokens')
  })

  describe('Queue Endpoints', () => {
    it('should fetch queue items with filters')
    it('should update queue item status')
    it('should add new customer')
    it('should fetch queue metrics')
  })

  describe('Config Endpoints', () => {
    it('should update core config')
    it('should update integration config')
    it('should update performance config')
  })

  describe('Error Handling', () => {
    it('should handle 401 unauthorized')
    it('should handle 500 server error')
    it('should handle network timeout')
    it('should handle request abortion')
  })

  describe('Request Timeout', () => {
    it('should timeout after 10 seconds')
    it('should cancel in-flight requests')
  })
})
```

---

## 5. Utility Tests

### 5.1 Auth Utilities
**File**: `tests/unit/utils/auth.test.ts`

```typescript
describe('auth utils', () => {
  describe('getAuthToken', () => {
    it('should retrieve token from localStorage')
    it('should return null if no token')
    it('should handle localStorage errors')
  })

  describe('setAuthToken', () => {
    it('should store token in localStorage')
    it('should overwrite existing token')
  })

  describe('removeAuthToken', () => {
    it('should remove token from localStorage')
    it('should handle missing token gracefully')
  })

  describe('isTokenExpired', () => {
    it('should return true for expired token')
    it('should return false for valid token')
    it('should return true for malformed token')
  })

  describe('decodeToken', () => {
    it('should decode JWT token')
    it('should extract user data')
    it('should handle invalid token')
  })
})
```

---

## 6. Type Tests

### 6.1 Type Definitions
**File**: `tests/unit/types/index.test.ts`

```typescript
describe('Type Definitions', () => {
  describe('User Type', () => {
    it('should enforce required fields')
    it('should restrict role values')
    it('should allow valid user object')
  })

  describe('QueueItem Type', () => {
    it('should enforce required fields')
    it('should restrict status values')
    it('should validate timestamp format')
  })

  describe('Config Types', () => {
    it('should validate CoreConfig structure')
    it('should validate IntegrationConfig structure')
    it('should validate PerformanceConfig structure')
  })
})
```

---

## 7. Coverage Requirements

### 7.1 Minimum Coverage Thresholds
```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
      exclude: [
        'tests/**',
        '**/*.config.{js,ts}',
        '**/types/**',
        '**/constants/**'
      ]
    }
  }
})
```

### 7.2 Critical Path Coverage
- Authentication flow: 95%
- Queue management: 90%
- Configuration updates: 90%
- Error handling: 85%

---

## 8. Test Data Factories

### 8.1 Factory Pattern
**File**: `tests/unit/factories/index.ts`

```typescript
export const createUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  role: 'admin',
  ...overrides
})

export const createQueueItem = (overrides?: Partial<QueueItem>): QueueItem => ({
  id: faker.string.uuid(),
  recipient: faker.internet.email(),
  sender: faker.internet.email(),
  status: 'queued',
  timestamp: faker.date.recent().toISOString(),
  retries: 0,
  ...overrides
})
```

---

## 9. Test Execution

### 9.1 Commands
```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage

# Run specific file
npm run test:unit Dashboard.test.tsx

# Run in watch mode
npm run test:unit -- --watch

# Run with UI
npm run test:unit -- --ui
```

### 9.2 Expected Output
```
✓ tests/unit/components/Dashboard.test.tsx (25)
✓ tests/unit/components/QueueManager.test.tsx (30)
✓ tests/unit/hooks/useQueue.test.tsx (15)
✓ tests/unit/store/authStore.test.ts (8)
✓ tests/unit/services/api.test.ts (18)

Test Files: 12 passed (12)
Tests: 156 passed (156)
Coverage: 87.3%
```

---

**Total Unit Tests Planned**: 150+
**Estimated Coverage**: 85-90%
**Execution Time**: < 10 seconds
