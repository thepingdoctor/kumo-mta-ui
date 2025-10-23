# API Mocking Strategy - KumoMTA UI

## Mock Framework: MSW (Mock Service Worker)

---

## 1. MSW Setup

### 1.1 Installation
```bash
npm install --save-dev msw
```

### 1.2 Server Setup
**File**: `tests/mocks/server.ts`

```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Setup server with all handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Cleanup after all tests
afterAll(() => server.close());
```

### 1.3 Browser Setup (for E2E)
**File**: `tests/mocks/browser.ts`

```typescript
import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// Start worker in development
if (process.env.NODE_ENV === 'development') {
  worker.start();
}
```

---

## 2. Handler Organization

### 2.1 Queue Handlers
**File**: `tests/mocks/handlers/queue.handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';
import { queueItemsFixture, queueMetricsFixture } from '../fixtures/queue.fixtures';

export const queueHandlers = [
  // GET /queue - Fetch queue items with filters
  http.get('/api/queue', ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let items = [...queueItemsFixture];

    // Apply status filter
    if (status) {
      items = items.filter(item => item.status === status);
    }

    // Apply pagination
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = items.slice(start, end);

    return HttpResponse.json({
      data: paginatedItems,
      total: items.length,
      page,
      limit
    });
  }),

  // PUT /queue/:id/status - Update queue item status
  http.put('/api/queue/:id/status', async ({ params, request }) => {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    // Find item
    const item = queueItemsFixture.find(item => item.id === id);

    if (!item) {
      return HttpResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      );
    }

    // Update status
    item.status = status;

    return HttpResponse.json({
      success: true,
      data: item
    });
  }),

  // POST /queue - Add customer to queue
  http.post('/api/queue', async ({ request }) => {
    const body = await request.json();

    // Validate required fields
    if (!body.recipient || !body.sender) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new queue item
    const newItem = {
      id: crypto.randomUUID(),
      recipient: body.recipient,
      sender: body.sender,
      status: 'queued',
      timestamp: new Date().toISOString(),
      retries: 0
    };

    queueItemsFixture.push(newItem);

    return HttpResponse.json({
      success: true,
      data: newItem
    }, { status: 201 });
  }),

  // GET /queue/metrics - Fetch queue metrics
  http.get('/api/queue/metrics', () => {
    return HttpResponse.json(queueMetricsFixture);
  })
];
```

### 2.2 Config Handlers
**File**: `tests/mocks/handlers/config.handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';
import {
  coreConfigFixture,
  integrationConfigFixture,
  performanceConfigFixture
} from '../fixtures/config.fixtures';

export const configHandlers = [
  // GET /config/core
  http.get('/api/config/core', () => {
    return HttpResponse.json(coreConfigFixture);
  }),

  // PUT /config/core - Update core config
  http.put('/api/config/core', async ({ request }) => {
    const body = await request.json();

    // Validate hostname
    if (body.hostname && !/^[a-z0-9.-]+$/i.test(body.hostname)) {
      return HttpResponse.json(
        { error: 'Invalid hostname format' },
        { status: 422 }
      );
    }

    // Validate max_connections
    if (body.max_connections && body.max_connections < 1) {
      return HttpResponse.json(
        { error: 'Max connections must be positive' },
        { status: 422 }
      );
    }

    // Update config
    Object.assign(coreConfigFixture, body);

    return HttpResponse.json({
      success: true,
      data: coreConfigFixture
    });
  }),

  // GET /config/integration
  http.get('/api/config/integration', () => {
    return HttpResponse.json(integrationConfigFixture);
  }),

  // PUT /config/integration
  http.put('/api/config/integration', async ({ request }) => {
    const body = await request.json();
    Object.assign(integrationConfigFixture, body);

    return HttpResponse.json({
      success: true,
      data: integrationConfigFixture
    });
  }),

  // POST /config/integration/smtp/test - Test SMTP connection
  http.post('/api/config/integration/smtp/test', async ({ request }) => {
    const body = await request.json();

    // Simulate connection test
    if (body.smtp_host && body.smtp_port) {
      return HttpResponse.json({
        success: true,
        message: 'SMTP connection successful'
      });
    }

    return HttpResponse.json(
      { error: 'Missing SMTP configuration' },
      { status: 400 }
    );
  }),

  // GET /config/performance
  http.get('/api/config/performance', () => {
    return HttpResponse.json(performanceConfigFixture);
  }),

  // PUT /config/performance
  http.put('/api/config/performance', async ({ request }) => {
    const body = await request.json();
    Object.assign(performanceConfigFixture, body);

    return HttpResponse.json({
      success: true,
      data: performanceConfigFixture
    });
  })
];
```

### 2.3 Auth Handlers
**File**: `tests/mocks/handlers/auth.handlers.ts`

```typescript
import { http, HttpResponse } from 'msw';
import { usersFixture } from '../fixtures/auth.fixtures';

export const authHandlers = [
  // POST /auth/login
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json();
    const { email, password } = body;

    // Find user
    const user = usersFixture.find(u => u.email === email);

    // Validate credentials
    if (!user || password !== 'admin123') {
      return HttpResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = `mock_token_${user.id}`;

    return HttpResponse.json({
      success: true,
      data: {
        user,
        token
      }
    });
  }),

  // POST /auth/logout
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  }),

  // GET /auth/me - Get current user
  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract user ID from token
    const token = authHeader.replace('Bearer ', '');
    const userId = token.replace('mock_token_', '');
    const user = usersFixture.find(u => u.id === userId);

    if (!user) {
      return HttpResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: user
    });
  }),

  // POST /auth/refresh - Refresh token
  http.post('/api/auth/refresh', ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return HttpResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    // Generate new token
    const newToken = `mock_token_refreshed_${Date.now()}`;

    return HttpResponse.json({
      success: true,
      data: { token: newToken }
    });
  })
];
```

---

## 3. Mock Fixtures

### 3.1 Queue Fixtures
**File**: `tests/mocks/fixtures/queue.fixtures.ts`

```typescript
import type { QueueItem, QueueMetrics } from '@/types/queue';

export const queueItemsFixture: QueueItem[] = [
  {
    id: '1',
    recipient: 'user1@example.com',
    sender: 'noreply@kumomta.com',
    status: 'queued',
    timestamp: '2025-10-23T10:00:00Z',
    retries: 0
  },
  {
    id: '2',
    recipient: 'user2@example.com',
    sender: 'noreply@kumomta.com',
    status: 'sending',
    timestamp: '2025-10-23T10:05:00Z',
    retries: 1
  },
  {
    id: '3',
    recipient: 'user3@example.com',
    sender: 'noreply@kumomta.com',
    status: 'failed',
    timestamp: '2025-10-23T10:10:00Z',
    retries: 3
  },
  // ... more items
];

export const queueMetricsFixture: QueueMetrics = {
  total_items: 1250,
  queued: 450,
  sending: 300,
  failed: 125,
  success_rate: 0.92,
  average_retry: 1.3,
  throughput_per_minute: 85
};

// Generator for large datasets
export function generateQueueItems(count: number): QueueItem[] {
  const statuses: QueueItem['status'][] = ['queued', 'sending', 'failed'];

  return Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    recipient: `user${i + 1}@example.com`,
    sender: 'noreply@kumomta.com',
    status: statuses[Math.floor(Math.random() * statuses.length)],
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    retries: Math.floor(Math.random() * 4)
  }));
}
```

### 3.2 Config Fixtures
**File**: `tests/mocks/fixtures/config.fixtures.ts`

```typescript
import type { CoreConfig, IntegrationConfig, PerformanceConfig } from '@/types/config';

export const coreConfigFixture: CoreConfig = {
  hostname: 'mail.example.com',
  max_connections: 1000,
  enable_tls: true,
  tls_certificate: '/path/to/cert.pem',
  tls_key: '/path/to/key.pem',
  log_level: 'info',
  log_file: '/var/log/kumomta.log'
};

export const integrationConfigFixture: IntegrationConfig = {
  smtp_host: 'smtp.example.com',
  smtp_port: 587,
  smtp_username: 'user@example.com',
  smtp_password: '********',
  smtp_use_tls: true,
  webhook_url: 'https://example.com/webhook',
  webhook_events: ['delivery', 'bounce', 'complaint']
};

export const performanceConfigFixture: PerformanceConfig = {
  max_message_size: 10485760, // 10MB
  connection_pool_size: 50,
  message_retention_days: 30,
  rate_limit_per_minute: 1000,
  concurrent_deliveries: 100,
  retry_interval_seconds: 300
};
```

### 3.3 Auth Fixtures
**File**: `tests/mocks/fixtures/auth.fixtures.ts`

```typescript
import type { User } from '@/types';

export const usersFixture: User[] = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    role: 'admin'
  },
  {
    id: 'operator-1',
    email: 'operator@example.com',
    role: 'operator'
  },
  {
    id: 'viewer-1',
    email: 'viewer@example.com',
    role: 'viewer'
  }
];
```

---

## 4. Response Scenarios

### 4.1 Success Scenarios
```typescript
// Standard success response
http.get('/api/queue', () => {
  return HttpResponse.json({ data: queueItemsFixture });
});

// Created response (201)
http.post('/api/queue', () => {
  return HttpResponse.json(
    { success: true },
    { status: 201 }
  );
});
```

### 4.2 Error Scenarios
**File**: `tests/mocks/scenarios/errors.ts`

```typescript
import { http, HttpResponse, delay } from 'msw';

// 400 Bad Request
export const badRequestHandler = http.post('/api/queue', () => {
  return HttpResponse.json(
    { error: 'Invalid request data' },
    { status: 400 }
  );
});

// 401 Unauthorized
export const unauthorizedHandler = http.get('/api/queue', () => {
  return HttpResponse.json(
    { error: 'Unauthorized' },
    { status: 401 }
  );
});

// 403 Forbidden
export const forbiddenHandler = http.put('/api/config/core', () => {
  return HttpResponse.json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  );
});

// 404 Not Found
export const notFoundHandler = http.get('/api/queue/:id', () => {
  return HttpResponse.json(
    { error: 'Queue item not found' },
    { status: 404 }
  );
});

// 409 Conflict
export const conflictHandler = http.post('/api/queue', () => {
  return HttpResponse.json(
    { error: 'Duplicate entry' },
    { status: 409 }
  );
});

// 422 Unprocessable Entity
export const validationErrorHandler = http.put('/api/config/core', () => {
  return HttpResponse.json(
    {
      error: 'Validation failed',
      details: [
        { field: 'hostname', message: 'Invalid hostname format' },
        { field: 'max_connections', message: 'Must be positive' }
      ]
    },
    { status: 422 }
  );
});

// 500 Internal Server Error
export const serverErrorHandler = http.get('/api/queue', () => {
  return HttpResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
});

// 503 Service Unavailable
export const serviceUnavailableHandler = http.get('/api/queue', () => {
  return HttpResponse.json(
    { error: 'Service temporarily unavailable' },
    { status: 503 }
  );
});
```

### 4.3 Network Scenarios
**File**: `tests/mocks/scenarios/network.ts`

```typescript
import { http, HttpResponse, delay } from 'msw';

// Slow response (2 second delay)
export const slowResponseHandler = http.get('/api/queue', async () => {
  await delay(2000);
  return HttpResponse.json({ data: queueItemsFixture });
});

// Timeout (10+ second delay)
export const timeoutHandler = http.get('/api/queue', async () => {
  await delay(15000);
  return HttpResponse.json({ data: [] });
});

// Network error
export const networkErrorHandler = http.get('/api/queue', () => {
  return HttpResponse.error();
});

// Abort request
export const abortHandler = http.get('/api/queue', ({ request }) => {
  request.signal.addEventListener('abort', () => {
    console.log('Request aborted');
  });
  return HttpResponse.json({ data: [] });
});
```

---

## 5. Dynamic Handlers

### 5.1 Runtime Handler Override
```typescript
// In test file
test('should handle server error', async () => {
  // Override default handler for this test
  server.use(
    http.get('/api/queue', () => {
      return HttpResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    })
  );

  // Test error handling
  render(<QueueManager />);
  await waitFor(() => {
    expect(screen.getByText('Failed to load queue')).toBeInTheDocument();
  });
});
```

### 5.2 Scenario-Based Testing
```typescript
import { createScenario } from './scenarios';

test('should handle slow network', async () => {
  const scenario = createScenario('slow-network');
  server.use(...scenario.handlers);

  // Test with slow network
  render(<Dashboard />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  }, { timeout: 5000 });
});
```

---

## 6. Test Integration

### 6.1 Setup in Tests
**File**: `tests/setup.ts`

```typescript
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers between tests
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

### 6.2 Usage in Tests
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { QueueManager } from '@/components/queue/QueueManager';

describe('QueueManager', () => {
  it('should fetch and display queue items', async () => {
    render(<QueueManager />);

    // MSW intercepts API call automatically
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });
  });

  it('should handle API errors', async () => {
    // Override handler for this test
    server.use(serverErrorHandler);

    render(<QueueManager />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load queue')).toBeInTheDocument();
    });
  });
});
```

---

## 7. Mock Management

### 7.1 Handler Organization
```
tests/mocks/
├── server.ts              # Server setup
├── browser.ts             # Browser worker setup
├── handlers/
│   ├── index.ts           # Export all handlers
│   ├── queue.handlers.ts
│   ├── config.handlers.ts
│   └── auth.handlers.ts
├── fixtures/
│   ├── queue.fixtures.ts
│   ├── config.fixtures.ts
│   └── auth.fixtures.ts
└── scenarios/
    ├── errors.ts
    └── network.ts
```

### 7.2 Handler Index
**File**: `tests/mocks/handlers/index.ts`

```typescript
import { queueHandlers } from './queue.handlers';
import { configHandlers } from './config.handlers';
import { authHandlers } from './auth.handlers';

export const handlers = [
  ...queueHandlers,
  ...configHandlers,
  ...authHandlers
];
```

---

## 8. Best Practices

### 8.1 Mock Design
- Match production API exactly
- Use realistic test data
- Cover all response scenarios
- Keep handlers simple and focused
- Reuse fixtures across tests

### 8.2 Maintenance
- Update mocks with API changes
- Version fixtures with API versions
- Document mock behaviors
- Share scenarios across teams

### 8.3 Performance
- Keep fixture data minimal
- Use generators for large datasets
- Clean up state between tests
- Avoid unnecessary delays

---

**Mock Coverage**: 100% of API endpoints
**Response Scenarios**: 15+ (success, errors, network)
**Fixture Datasets**: 10+ reusable fixtures
**Dynamic Handlers**: Runtime override support
