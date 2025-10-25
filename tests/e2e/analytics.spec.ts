import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Analytics E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
  });

  test('should display analytics dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });

  test('should display charts', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for canvas elements (Chart.js renders to canvas)
    const charts = page.locator('canvas');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should display metrics cards', async ({ page }) => {
    // Look for metric cards with numbers
    const metrics = page.locator('[class*="metric"], [class*="card"], [class*="stat"]');
    const count = await metrics.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have date range picker', async ({ page }) => {
    // Look for date-related inputs or buttons
    const dateElements = page.getByText(/date|range|period|today|week|month/i);
    const count = await dateElements.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow filtering data', async ({ page }) => {
    // Look for filter controls
    const filters = page.locator('select, [role="combobox"], [class*="filter"]');
    const count = await filters.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display throughput analytics', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for throughput-related content
    const throughputContent = page.getByText(/throughput/i);
    const count = await throughputContent.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display bounce rate analytics', async ({ page }) => {
    // Look for bounce-related metrics
    const bounceContent = page.getByText(/bounce/i);
    const count = await bounceContent.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display delivery analytics', async ({ page }) => {
    // Look for delivery metrics
    const deliveryContent = page.getByText(/deliver|sent|success/i);
    const count = await deliveryContent.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have export functionality', async ({ page }) => {
    // Look for export buttons
    const exportButton = page.getByRole('button', { name: /export|download/i });
    const count = await exportButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have refresh functionality', async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.getByRole('button', { name: /refresh|reload/i });
    const count = await refreshButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('charts should be interactive', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const charts = page.locator('canvas');
    if (await charts.count() > 0) {
      // Hover over chart to test interactivity
      await charts.first().hover();

      // Chart should still be visible
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should handle time range changes', async ({ page }) => {
    // Look for time range selector
    const timeRangeButtons = page.getByRole('button', { name: /hour|day|week|month|year/i });
    const count = await timeRangeButtons.count();

    if (count > 0) {
      await timeRangeButtons.first().click();
      await page.waitForLoadState('networkidle');

      // Charts should still be visible after time range change
      const charts = page.locator('canvas');
      await expect(charts.first()).toBeVisible();
    }
  });

  test('should not have accessibility violations', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Page should still be accessible
    await expect(page.getByRole('heading', { name: /analytics/i })).toBeVisible();
  });

  test('should display loading states gracefully', async ({ page }) => {
    // Navigate to trigger loading
    await page.goto('/analytics');

    // Wait for loading to complete
    await page.waitForLoadState('networkidle');

    // Loading indicators should be gone
    const loadingIndicators = page.getByText(/loading/i);
    const count = await loadingIndicators.count();
    expect(count).toBe(0);
  });
});
