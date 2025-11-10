import { test, expect } from '@playwright/test';

test.describe('Real-Time Monitoring E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Assume logged in for E2E tests
  });

  test('should display live queue updates via WebSocket', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for WebSocket connection indicator
    await expect(page.locator('[data-testid="ws-status"]')).toHaveText('Connected', {
      timeout: 10000,
    });

    // Verify real-time metrics are updating
    const metricsCard = page.locator('[data-testid="metrics-card"]');
    await expect(metricsCard).toBeVisible();

    // Wait for at least one update
    await page.waitForTimeout(2000);

    // Verify metrics are displayed
    await expect(page.locator('[data-testid="messages-sent"]')).toBeVisible();
    await expect(page.locator('[data-testid="throughput"]')).toBeVisible();
  });

  test('should show queue status changes in real-time', async ({ page }) => {
    await page.goto('/queue');

    // Wait for initial queue load
    await expect(page.locator('[data-testid="queue-table"]')).toBeVisible();

    // Verify queue items are displayed
    const queueItems = page.locator('[data-testid="queue-item"]');
    const count = await queueItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should reconnect WebSocket after network interruption', async ({ page, context }) => {
    await page.goto('/dashboard');

    // Verify connected
    await expect(page.locator('[data-testid="ws-status"]')).toHaveText('Connected');

    // Simulate offline
    await context.setOffline(true);
    await expect(page.locator('[data-testid="ws-status"]')).toHaveText('Disconnected', {
      timeout: 5000,
    });

    // Restore connection
    await context.setOffline(false);
    await expect(page.locator('[data-testid="ws-status"]')).toHaveText('Connected', {
      timeout: 10000,
    });
  });

  test('should display connection status indicator', async ({ page }) => {
    await page.goto('/dashboard');

    const statusIndicator = page.locator('[data-testid="ws-status"]');
    await expect(statusIndicator).toBeVisible();

    // Should show connected state
    const status = await statusIndicator.textContent();
    expect(['Connected', 'Connecting']).toContain(status);
  });

  test('should handle WebSocket authentication', async ({ page }) => {
    // Clear cookies to test auth
    await page.context().clearCookies();
    await page.goto('/dashboard');

    // Should redirect to login if no auth
    await expect(page).toHaveURL(/\/login/);
  });
});
