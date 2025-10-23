# Test Implementation Guide - KumoMTA UI

## Quick Start Guide for Implementing Tests

---

## 1. Initial Setup

### 1.1 Install Dependencies
```bash
# Core testing libraries
npm install --save-dev vitest @vitest/ui @vitest/coverage-v8
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install --save-dev jsdom happy-dom

# E2E testing
npm install --save-dev @playwright/test

# API mocking
npm install --save-dev msw

# Accessibility testing
npm install --save-dev jest-axe @axe-core/react

# Additional utilities
npm install --save-dev @faker-js/faker
```

### 1.2 Configure Vitest
**File**: `/home/ruhroh/kumo-mta-ui/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{js,ts}',
        '**/types/**',
        '**/constants/**',
        '**/*.d.ts',
        'dist/'
      ],
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### 1.3 Configure Playwright
**File**: `/home/ruhroh/kumo-mta-ui/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 1.4 Test Setup File
**File**: `/home/ruhroh/kumo-mta-ui/tests/setup.ts`

```typescript
import { expect, afterEach, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './mocks/server';

// Extend Vitest matchers
expect.extend(matchers);

// Setup MSW server
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  }),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};
```

### 1.5 Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest run --testPathPattern=unit",
    "test:integration": "vitest run --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:a11y": "vitest run --testPathPattern=accessibility",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
  }
}
```

---

## 2. Implementing Unit Tests

### 2.1 Component Test Template
**File**: `/home/ruhroh/kumo-mta-ui/tests/unit/components/Example.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExampleComponent } from '@/components/Example';

describe('ExampleComponent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ExampleComponent {...props} />
      </QueryClientProvider>
    );
  };

  describe('Rendering', () => {
    it('should render component', () => {
      renderComponent();
      expect(screen.getByRole('heading')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should handle button click', async () => {
      renderComponent();

      const button = screen.getByRole('button', { name: /click me/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error States', () => {
    it('should display error message', async () => {
      server.use(
        http.get('/api/data', () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });
});
```

### 2.2 Hook Test Template
**File**: `/home/ruhroh/kumo-mta-ui/tests/unit/hooks/useExample.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExample } from '@/hooks/useExample';

describe('useExample', () => {
  const wrapper = ({ children }) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('should fetch data successfully', async () => {
    const { result } = renderHook(() => useExample(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });

  it('should handle errors', async () => {
    server.use(
      http.get('/api/data', () => {
        return HttpResponse.json({}, { status: 500 });
      })
    );

    const { result } = renderHook(() => useExample(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});
```

---

## 3. Implementing Integration Tests

### 3.1 API Integration Template
**File**: `/home/ruhroh/kumo-mta-ui/tests/integration/api.integration.test.tsx`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '@/App';

describe('API Integration', () => {
  beforeEach(() => {
    // Reset MSW handlers
    server.resetHandlers();
  });

  it('should complete full workflow', async () => {
    render(<App />);

    // Step 1: Login
    await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'admin123');
    await userEvent.click(screen.getByRole('button', { name: /login/i }));

    // Step 2: Navigate
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    // Step 3: Fetch data
    await waitFor(() => {
      expect(screen.getByText(/emails sent/i)).toBeInTheDocument();
    });

    // Step 4: Perform action
    await userEvent.click(screen.getByRole('link', { name: /queue/i }));

    // Step 5: Verify result
    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});
```

---

## 4. Implementing E2E Tests

### 4.1 E2E Test Template
**File**: `/home/ruhroh/kumo-mta-ui/tests/e2e/workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete user journey', async ({ page }) => {
    // Login
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Verify navigation
    await expect(page).toHaveURL('/dashboard');

    // Interact with UI
    await page.click('text=Queue Management');
    await expect(page).toHaveURL('/queue');

    // Verify content
    await expect(page.locator('table')).toBeVisible();
  });

  test('handle errors gracefully', async ({ page, context }) => {
    // Intercept API and return error
    await context.route('**/api/queue', route => {
      route.fulfill({ status: 500 });
    });

    await page.goto('/queue');

    // Verify error handling
    await expect(page.locator('text=/error/i')).toBeVisible();
    await expect(page.locator('button', { hasText: /retry/i })).toBeVisible();
  });
});
```

---

## 5. Implementing Mock Handlers

### 5.1 Mock Handler Template
**File**: `/home/ruhroh/kumo-mta-ui/tests/mocks/handlers/example.handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';
import { exampleFixture } from '../fixtures/example.fixtures';

export const exampleHandlers = [
  // GET endpoint
  http.get('/api/example', ({ request }) => {
    const url = new URL(request.url);
    const filter = url.searchParams.get('filter');

    let data = [...exampleFixture];

    if (filter) {
      data = data.filter(item => item.status === filter);
    }

    return HttpResponse.json({ data });
  }),

  // POST endpoint
  http.post('/api/example', async ({ request }) => {
    const body = await request.json();

    // Validate
    if (!body.name) {
      return HttpResponse.json(
        { error: 'Name required' },
        { status: 400 }
      );
    }

    // Create item
    const newItem = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString()
    };

    return HttpResponse.json(
      { data: newItem },
      { status: 201 }
    );
  }),

  // PUT endpoint
  http.put('/api/example/:id', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();

    const item = exampleFixture.find(i => i.id === id);

    if (!item) {
      return HttpResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    Object.assign(item, body);

    return HttpResponse.json({ data: item });
  }),

  // DELETE endpoint
  http.delete('/api/example/:id', ({ params }) => {
    const { id } = params;

    const index = exampleFixture.findIndex(i => i.id === id);

    if (index === -1) {
      return HttpResponse.json(
        { error: 'Not found' },
        { status: 404 }
      );
    }

    exampleFixture.splice(index, 1);

    return HttpResponse.json({ success: true });
  })
];
```

---

## 6. Test Data Factories

### 6.1 Factory Pattern
**File**: `/home/ruhroh/kumo-mta-ui/tests/factories/index.ts`

```typescript
import { faker } from '@faker-js/faker';
import type { User, QueueItem } from '@/types';

export const createUser = (overrides?: Partial<User>): User => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  role: 'admin',
  ...overrides
});

export const createQueueItem = (overrides?: Partial<QueueItem>): QueueItem => ({
  id: faker.string.uuid(),
  recipient: faker.internet.email(),
  sender: faker.internet.email(),
  status: 'queued',
  timestamp: faker.date.recent().toISOString(),
  retries: faker.number.int({ min: 0, max: 3 }),
  ...overrides
});

export const createQueueItems = (count: number): QueueItem[] => {
  return Array.from({ length: count }, () => createQueueItem());
};
```

---

## 7. Running Tests

### 7.1 Development Workflow
```bash
# Watch mode during development
npm run test -- --watch

# Run specific test file
npm run test Dashboard.test.tsx

# Run tests matching pattern
npm run test -- --grep "login"

# Update snapshots
npm run test -- -u
```

### 7.2 CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 8. Best Practices

### 8.1 Test Organization
```
tests/
├── unit/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
├── integration/
│   ├── api.integration.test.tsx
│   └── workflow.integration.test.tsx
├── e2e/
│   ├── admin.spec.ts
│   ├── operator.spec.ts
│   └── viewer.spec.ts
├── mocks/
│   ├── handlers/
│   ├── fixtures/
│   └── server.ts
├── factories/
│   └── index.ts
├── accessibility/
│   └── a11y.test.tsx
└── setup.ts
```

### 8.2 Naming Conventions
- Test files: `*.test.tsx` or `*.spec.ts`
- Mock handlers: `*.handlers.ts`
- Fixtures: `*.fixtures.ts`
- Factories: `*.factory.ts`
- Test suites: Use descriptive `describe()` blocks
- Test cases: Start with "should" for clarity

### 8.3 Writing Good Tests
```typescript
// ✅ Good: Clear, focused, independent
it('should display error message on failed login', async () => {
  render(<LoginForm />);
  await userEvent.click(screen.getByRole('button', { name: /login/i }));
  expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
});

// ❌ Bad: Unclear, tests multiple things
it('login works', async () => {
  // Tests too many things at once
});
```

---

## 9. Debugging Tests

### 9.1 Vitest Debugging
```bash
# Run with debug output
npm run test -- --reporter=verbose

# Run single test
npm run test -- -t "should display error"

# Open UI
npm run test:ui
```

### 9.2 Playwright Debugging
```bash
# Run in headed mode
npm run test:e2e -- --headed

# Debug mode with inspector
npm run test:e2e:debug

# Show trace
npx playwright show-trace trace.zip
```

---

## 10. Coverage Requirements

### 10.1 Minimum Thresholds
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### 10.2 Generating Reports
```bash
# Generate HTML coverage report
npm run test:coverage

# View report
open coverage/index.html
```

---

## Quick Reference

**Unit Tests**: Fast, isolated component tests
**Integration Tests**: Test component + API interactions
**E2E Tests**: Full user workflows in real browser
**Mocks**: MSW for API mocking
**Factories**: faker.js for test data
**A11y**: jest-axe for accessibility
**Coverage**: vitest/coverage-v8

---

**Implementation Priority:**
1. Setup test infrastructure (Day 1)
2. Implement MSW mocks (Day 1-2)
3. Write unit tests for critical components (Day 2-3)
4. Add integration tests (Day 3-4)
5. Implement E2E tests (Day 4-5)
6. Add accessibility tests (Day 5)
7. Achieve coverage targets (Day 6-7)
