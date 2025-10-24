import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should display all metric cards', async ({ page }) => {
    await expect(page.getByText('Emails Sent')).toBeVisible();
    await expect(page.getByText('Bounces')).toBeVisible();
    await expect(page.getByText('Delayed')).toBeVisible();
    await expect(page.getByText('Throughput')).toBeVisible();
  });

  test('should display server status section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Server Status' })).toBeVisible();
    await expect(page.getByText('Connection Status')).toBeVisible();
  });

  test('should display chart with hourly throughput', async ({ page }) => {
    await expect(page.getByText('Hourly Email Throughput')).toBeVisible();
  });

  test('should handle loading state gracefully', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForLoadState('networkidle');

    // Verify no loading skeleton visible after load
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 5000 });
  });

  test('should navigate to queue manager', async ({ page }) => {
    await page.getByRole('link', { name: 'Queue Manager' }).click();
    await expect(page).toHaveURL(/.*queue/);
    await expect(page.getByRole('heading', { name: 'Queue Management' })).toBeVisible();
  });

  test('should navigate to configuration', async ({ page }) => {
    await page.getByRole('link', { name: 'Configuration' }).click();
    await expect(page).toHaveURL(/.*config/);
    await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu should be visible
    await expect(page.getByLabel('Open sidebar')).toBeVisible();

    // Click to open sidebar
    await page.getByLabel('Open sidebar').click();

    // Sidebar should be visible
    await expect(page.getByText('KumoMTA Admin')).toBeVisible();
  });

  test('should close sidebar on escape key', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open sidebar
    await page.getByLabel('Open sidebar').click();

    // Press escape
    await page.keyboard.press('Escape');

    // Sidebar should close
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).not.toBeVisible();
  });
});
