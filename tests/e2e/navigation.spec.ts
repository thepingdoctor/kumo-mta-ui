import { test, expect } from '@playwright/test';

test.describe('Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate through all main routes', async ({ page }) => {
    // Dashboard (default)
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

    // Queue Manager
    await page.getByRole('link', { name: 'Queue Manager' }).click();
    await expect(page).toHaveURL(/.*queue/);
    await expect(page.getByRole('heading', { name: 'Queue Management' })).toBeVisible();

    // Configuration
    await page.getByRole('link', { name: 'Configuration' }).click();
    await expect(page).toHaveURL(/.*config/);
    await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible();

    // Back to Dashboard
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Dashboard should be active
    const dashboardLink = page.getByRole('link', { name: 'Dashboard' });
    await expect(dashboardLink).toHaveClass(/bg-blue-50/);

    // Navigate to Queue Manager
    await page.getByRole('link', { name: 'Queue Manager' }).click();

    // Queue Manager should now be active
    const queueLink = page.getByRole('link', { name: 'Queue Manager' });
    await expect(queueLink).toHaveClass(/bg-blue-50/);
  });

  test('should handle mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open mobile menu
    await page.getByLabel('Open sidebar').click();

    // Sidebar should be visible
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

    // Navigate to Queue Manager
    await page.getByRole('link', { name: 'Queue Manager' }).click();

    // Should navigate and close sidebar
    await expect(page).toHaveURL(/.*queue/);
  });

  test('should close mobile sidebar with close button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open sidebar
    await page.getByLabel('Open sidebar').click();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();

    // Close with X button
    await page.getByLabel('Close sidebar').click();

    // Sidebar should be hidden
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).not.toBeVisible();
  });

  test('should close mobile sidebar with backdrop click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open sidebar
    await page.getByLabel('Open sidebar').click();

    // Click backdrop
    await page.locator('.bg-gray-600.bg-opacity-75').click();

    // Sidebar should close
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).not.toBeVisible();
  });

  test('should maintain focus within sidebar when open', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Open sidebar
    await page.getByLabel('Open sidebar').click();

    // First link should be focused
    const firstLink = page.getByRole('link', { name: 'Dashboard' });
    await expect(firstLink).toBeFocused();

    // Tab through navigation
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Queue Manager' })).toBeFocused();
  });

  test('should handle invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-123');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
  });
});
