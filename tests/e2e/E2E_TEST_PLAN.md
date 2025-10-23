# E2E Test Plan - KumoMTA UI

## Test Framework: Playwright

---

## 1. Critical User Flows

### 1.1 Admin Dashboard Workflow
**File**: `tests/e2e/admin-dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete admin workflow', async ({ page }) => {
    // Step 1: Login as admin
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Step 2: Verify dashboard loaded
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h2')).toContainText('Dashboard');

    // Step 3: Check metrics displayed
    await expect(page.locator('text=Emails Sent')).toBeVisible();
    await expect(page.locator('text=Bounces')).toBeVisible();
    await expect(page.locator('text=Delayed')).toBeVisible();
    await expect(page.locator('text=Throughput')).toBeVisible();

    // Step 4: Navigate to queue manager
    await page.click('text=Queue Management');
    await expect(page).toHaveURL('/queue');

    // Step 5: Filter queue by status
    await page.click('[aria-label="Filter by status"]');
    await page.click('text=Failed');
    await expect(page.locator('[data-status="failed"]')).toHaveCount.greaterThan(0);

    // Step 6: Update queue item status
    await page.click('[data-testid="queue-item"]:first-child [aria-label="Update status"]');
    await page.click('text=Retry');
    await expect(page.locator('text=Status updated successfully')).toBeVisible();

    // Step 7: Verify status updated
    await expect(page.locator('[data-testid="queue-item"]:first-child')).toContainText('sending');

    // Step 8: Logout
    await page.click('[aria-label="User menu"]');
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login');
  });

  test('should navigate between dashboard sections', async ({ page }) => {
    // Login
    await loginAsAdmin(page);

    // Navigate Dashboard -> Config -> Queue -> Dashboard
    await page.click('text=Configuration');
    await expect(page).toHaveURL('/config');

    await page.click('text=Queue Management');
    await expect(page).toHaveURL('/queue');

    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should display real-time metrics updates', async ({ page }) => {
    await loginAsAdmin(page);

    // Get initial metric value
    const sentMetric = page.locator('[data-metric="sent"]');
    const initialValue = await sentMetric.textContent();

    // Wait for update (assuming 30s refresh)
    await page.waitForTimeout(35000);

    // Verify metric updated
    const newValue = await sentMetric.textContent();
    expect(newValue).not.toBe(initialValue);
  });
});
```

### 1.2 Configuration Management Flow
**File**: `tests/e2e/configuration.spec.ts`

```typescript
test.describe('Configuration Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/config');
  });

  test('update core configuration', async ({ page }) => {
    // Step 1: Navigate to core config
    await page.click('text=Core Settings');

    // Step 2: Modify settings
    await page.fill('[name="hostname"]', 'mail.example.com');
    await page.fill('[name="max_connections"]', '1000');
    await page.check('[name="enable_tls"]');

    // Step 3: Save configuration
    await page.click('button:has-text("Save Changes")');

    // Step 4: Verify success notification
    await expect(page.locator('text=Configuration saved successfully')).toBeVisible();

    // Step 5: Reload page
    await page.reload();

    // Step 6: Verify settings persisted
    await expect(page.locator('[name="hostname"]')).toHaveValue('mail.example.com');
    await expect(page.locator('[name="max_connections"]')).toHaveValue('1000');
    await expect(page.locator('[name="enable_tls"]')).toBeChecked();
  });

  test('validate configuration fields', async ({ page }) => {
    // Try invalid hostname
    await page.fill('[name="hostname"]', 'invalid hostname!');
    await page.click('button:has-text("Save Changes")');

    // Verify validation error
    await expect(page.locator('text=Invalid hostname format')).toBeVisible();

    // Try negative number
    await page.fill('[name="max_connections"]', '-100');
    await page.click('button:has-text("Save Changes")');

    // Verify validation error
    await expect(page.locator('text=Value must be positive')).toBeVisible();
  });

  test('warn on unsaved changes', async ({ page }) => {
    // Modify field
    await page.fill('[name="hostname"]', 'new-hostname.com');

    // Attempt navigation
    await page.click('text=Dashboard');

    // Verify warning dialog
    await expect(page.locator('text=You have unsaved changes')).toBeVisible();

    // Cancel navigation
    await page.click('button:has-text("Cancel")');
    await expect(page).toHaveURL('/config');

    // Discard changes and navigate
    await page.click('text=Dashboard');
    await page.click('button:has-text("Discard")');
    await expect(page).toHaveURL('/dashboard');
  });

  test('test SMTP connection', async ({ page }) => {
    await page.click('text=Integration Settings');

    // Fill SMTP details
    await page.fill('[name="smtp_host"]', 'smtp.example.com');
    await page.fill('[name="smtp_port"]', '587');
    await page.fill('[name="smtp_username"]', 'user@example.com');
    await page.fill('[name="smtp_password"]', 'password123');

    // Test connection
    await page.click('button:has-text("Test Connection")');

    // Verify result
    await expect(page.locator('text=Connection successful')).toBeVisible();
  });
});
```

### 1.3 Queue Monitoring Flow
**File**: `tests/e2e/queue-monitoring.spec.ts`

```typescript
test.describe('Queue Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOperator(page);
    await page.goto('/queue');
  });

  test('filter and sort queue items', async ({ page }) => {
    // Step 1: Apply status filter
    await page.click('[aria-label="Filter by status"]');
    await page.check('text=Queued');
    await page.check('text=Sending');

    // Verify filtered results
    await expect(page.locator('[data-status="failed"]')).toHaveCount(0);
    await expect(page.locator('[data-status="queued"]')).toHaveCount.greaterThan(0);

    // Step 2: Apply date range filter
    await page.fill('[name="date_from"]', '2025-10-20');
    await page.fill('[name="date_to"]', '2025-10-23');
    await page.click('button:has-text("Apply")');

    // Step 3: Sort by timestamp
    await page.click('th:has-text("Timestamp")');

    // Verify descending order
    const timestamps = await page.locator('[data-testid="timestamp"]').allTextContents();
    expect(isSortedDescending(timestamps)).toBe(true);

    // Step 4: Sort ascending
    await page.click('th:has-text("Timestamp")');

    // Verify ascending order
    const timestampsAsc = await page.locator('[data-testid="timestamp"]').allTextContents();
    expect(isSortedAscending(timestampsAsc)).toBe(true);

    // Step 5: Clear filters
    await page.click('button:has-text("Clear Filters")');

    // Verify all statuses visible
    await expect(page.locator('[data-status="queued"]')).toHaveCount.greaterThan(0);
    await expect(page.locator('[data-status="failed"]')).toHaveCount.greaterThan(0);
  });

  test('view queue metrics', async ({ page }) => {
    // Verify metrics panel
    await expect(page.locator('[data-testid="queue-metrics"]')).toBeVisible();

    // Check metric values
    await expect(page.locator('text=Total Items')).toBeVisible();
    await expect(page.locator('text=Success Rate')).toBeVisible();
    await expect(page.locator('text=Average Retry')).toBeVisible();

    // Verify metric updates on filter
    const initialTotal = await page.locator('[data-metric="total"]').textContent();
    await page.click('[aria-label="Filter by status"]');
    await page.check('text=Failed');

    const filteredTotal = await page.locator('[data-metric="total"]').textContent();
    expect(filteredTotal).not.toBe(initialTotal);
  });

  test('pagination through large queue', async ({ page }) => {
    // Verify pagination controls
    await expect(page.locator('[aria-label="Pagination"]')).toBeVisible();

    // Check total pages
    const totalPages = await page.locator('[data-testid="total-pages"]').textContent();
    expect(parseInt(totalPages)).toBeGreaterThan(1);

    // Navigate to page 2
    await page.click('button:has-text("Next")');
    await expect(page.locator('[data-testid="current-page"]')).toContainText('2');

    // Navigate to last page
    await page.click('button:has-text("Last")');
    await expect(page.locator('[data-testid="current-page"]')).toContainText(totalPages);

    // Navigate back to first
    await page.click('button:has-text("First")');
    await expect(page.locator('[data-testid="current-page"]')).toContainText('1');
  });

  test('add customer to queue', async ({ page }) => {
    // Open add customer modal
    await page.click('button:has-text("Add Customer")');

    // Fill form
    await page.fill('[name="recipient"]', 'newcustomer@example.com');
    await page.fill('[name="sender"]', 'sender@example.com');
    await page.fill('[name="subject"]', 'Test Email');
    await page.fill('[name="message"]', 'This is a test message');

    // Submit
    await page.click('button:has-text("Add to Queue")');

    // Verify success
    await expect(page.locator('text=Customer added successfully')).toBeVisible();

    // Verify in queue
    await expect(page.locator('text=newcustomer@example.com')).toBeVisible();
  });
});
```

### 1.4 Error Recovery Flow
**File**: `tests/e2e/error-recovery.spec.ts`

```typescript
test.describe('Error Recovery', () => {
  test('handle network errors gracefully', async ({ page }) => {
    await loginAsAdmin(page);

    // Simulate offline
    await page.context().setOffline(true);

    // Attempt navigation
    await page.click('text=Queue Management');

    // Verify error message
    await expect(page.locator('text=Network error')).toBeVisible();

    // Go back online
    await page.context().setOffline(false);

    // Retry action
    await page.click('button:has-text("Retry")');

    // Verify success
    await expect(page).toHaveURL('/queue');
  });

  test('recover from API errors', async ({ page, context }) => {
    // Intercept and fail API request
    await context.route('**/api/queue', route => {
      route.fulfill({ status: 500, body: 'Internal Server Error' });
    });

    await loginAsAdmin(page);
    await page.goto('/queue');

    // Verify error shown
    await expect(page.locator('text=Failed to load queue')).toBeVisible();

    // Stop intercepting
    await context.unroute('**/api/queue');

    // Retry
    await page.click('button:has-text("Retry")');

    // Verify data loaded
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount.greaterThan(0);
  });

  test('handle session expiration', async ({ page, context }) => {
    await loginAsAdmin(page);

    // Clear auth token
    await context.clearCookies();
    await page.evaluate(() => localStorage.removeItem('auth_token'));

    // Attempt action
    await page.click('text=Configuration');

    // Verify redirected to login
    await expect(page).toHaveURL('/login');
    await expect(page.locator('text=Session expired')).toBeVisible();
  });

  test('handle validation errors', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/config');

    // Submit invalid form
    await page.fill('[name="max_connections"]', 'invalid');
    await page.click('button:has-text("Save Changes")');

    // Verify error
    await expect(page.locator('text=Must be a number')).toBeVisible();

    // Fix error
    await page.fill('[name="max_connections"]', '1000');

    // Verify error cleared
    await expect(page.locator('text=Must be a number')).not.toBeVisible();

    // Submit successfully
    await page.click('button:has-text("Save Changes")');
    await expect(page.locator('text=Configuration saved')).toBeVisible();
  });
});
```

---

## 2. Cross-Browser Testing

### 2.1 Browser Matrix
```typescript
// playwright.config.ts
export default defineConfig({
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
      name: 'edge',
      use: { ...devices['Desktop Edge'] },
    }
  ]
});
```

### 2.2 Browser-Specific Tests
```typescript
test.describe('Browser Compatibility', () => {
  test('chart rendering in all browsers', async ({ page, browserName }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');

    // Verify chart renders
    await expect(page.locator('canvas')).toBeVisible();

    // Screenshot for visual comparison
    await expect(page.locator('[data-testid="chart"]')).toHaveScreenshot(
      `chart-${browserName}.png`
    );
  });
});
```

---

## 3. Responsive Testing

### 3.1 Device Matrix
```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'Desktop 1080p',
      use: { viewport: { width: 1920, height: 1080 } },
    },
    {
      name: 'Laptop',
      use: { viewport: { width: 1366, height: 768 } },
    },
    {
      name: 'Tablet Landscape',
      use: { ...devices['iPad Pro landscape'] },
    },
    {
      name: 'Tablet Portrait',
      use: { ...devices['iPad Pro'] },
    },
    {
      name: 'Mobile',
      use: { ...devices['iPhone 12'] },
    }
  ]
});
```

### 3.2 Responsive Behavior Tests
**File**: `tests/e2e/responsive.spec.ts`

```typescript
test.describe('Responsive Design', () => {
  test('mobile navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsAdmin(page);

    // Verify hamburger menu visible
    await expect(page.locator('[aria-label="Menu"]')).toBeVisible();

    // Open menu
    await page.click('[aria-label="Menu"]');

    // Verify nav items
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Click nav item
    await page.click('text=Queue Management');

    // Verify menu closed
    await expect(page.locator('nav')).not.toBeVisible();
  });

  test('table responsiveness', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/queue');

    // Desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('table')).toBeVisible();

    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('[data-testid="card-view"]')).toBeVisible();
  });

  test('dashboard metrics on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsAdmin(page);

    // Verify metrics stack vertically
    const metrics = page.locator('[data-testid="metric-card"]');
    const count = await metrics.count();

    for (let i = 0; i < count; i++) {
      await expect(metrics.nth(i)).toBeVisible();
    }
  });
});
```

---

## 4. Performance Testing

### 4.1 Load Time Tests
**File**: `tests/e2e/performance.spec.ts`

```typescript
test.describe('Performance', () => {
  test('dashboard load performance', async ({ page }) => {
    const start = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000); // < 3s
  });

  test('queue with 1000 items', async ({ page }) => {
    // Mock 1000 queue items
    await mockLargeQueue(page, 1000);

    await loginAsAdmin(page);
    await page.goto('/queue');

    // Verify renders without lag
    await expect(page.locator('[data-testid="queue-item"]')).toHaveCount(50); // First page
  });

  test('chart rendering performance', async ({ page }) => {
    await loginAsAdmin(page);

    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForSelector('canvas');

    const chartLoadTime = Date.now() - start;
    expect(chartLoadTime).toBeLessThan(2000);
  });
});
```

---

## 5. Accessibility E2E Tests

### 5.1 Keyboard Navigation
**File**: `tests/e2e/accessibility.spec.ts`

```typescript
test.describe('Accessibility', () => {
  test('keyboard navigation throughout app', async ({ page }) => {
    await page.goto('/login');

    // Tab through login form
    await page.keyboard.press('Tab'); // Email field
    await expect(page.locator('[name="email"]')).toBeFocused();

    await page.keyboard.press('Tab'); // Password field
    await expect(page.locator('[name="password"]')).toBeFocused();

    await page.keyboard.press('Tab'); // Submit button
    await expect(page.locator('button[type="submit"]')).toBeFocused();

    // Submit with Enter
    await page.keyboard.press('Enter');
  });

  test('screen reader announcements', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/queue');

    // Update status
    await page.click('[aria-label="Update status"]');

    // Verify live region updated
    const announcement = page.locator('[role="status"]');
    await expect(announcement).toContainText('Status updated successfully');
  });

  test('focus management in modals', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/queue');

    // Open modal
    await page.click('button:has-text("Add Customer")');

    // Verify focus moved to modal
    await expect(page.locator('[role="dialog"] input:first-child')).toBeFocused();

    // Tab stays in modal
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify still in modal
    const focusedElement = await page.evaluateHandle(() => document.activeElement);
    const modalElement = await page.locator('[role="dialog"]').elementHandle();
    const isFocusInModal = await page.evaluate(
      ([modal, focused]) => modal.contains(focused),
      [modalElement, focusedElement]
    );
    expect(isFocusInModal).toBe(true);

    // Escape closes modal
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });
});
```

---

## 6. Visual Regression Testing

### 6.1 Screenshot Comparison
**File**: `tests/e2e/visual.spec.ts`

```typescript
test.describe('Visual Regression', () => {
  test('dashboard visual consistency', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await expect(page).toHaveScreenshot('dashboard.png', {
      fullPage: true,
      maxDiffPixels: 100
    });
  });

  test('queue manager visual consistency', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/queue');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('queue.png', {
      fullPage: true
    });
  });

  test('configuration visual consistency', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/config');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('config.png', {
      fullPage: true
    });
  });
});
```

---

## 7. Test Execution

### 7.1 Commands
```bash
# Run all E2E tests
npm run test:e2e

# Run on specific browser
npm run test:e2e -- --project=chromium

# Run specific test file
npm run test:e2e admin-dashboard.spec.ts

# Run in headed mode
npm run test:e2e -- --headed

# Run in debug mode
npm run test:e2e -- --debug

# Update screenshots
npm run test:e2e -- --update-snapshots

# Generate HTML report
npm run test:e2e -- --reporter=html
```

### 7.2 CI Configuration
```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Upload report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 8. Test Helpers

### 8.1 Common Test Utilities
**File**: `tests/e2e/helpers/auth.ts`

```typescript
export async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'admin@example.com');
  await page.fill('[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function loginAsOperator(page: Page) {
  await page.goto('/login');
  await page.fill('[name="email"]', 'operator@example.com');
  await page.fill('[name="password"]', 'operator123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function mockLargeQueue(page: Page, count: number) {
  await page.route('**/api/queue', route => {
    route.fulfill({
      status: 200,
      body: JSON.stringify(generateQueueItems(count))
    });
  });
}
```

---

**Total E2E Tests Planned**: 45+
**Test Coverage**: All critical user journeys
**Browsers**: Chrome, Firefox, Safari, Edge
**Devices**: Desktop, Tablet, Mobile
**Execution Time**: < 3 minutes (parallel)
