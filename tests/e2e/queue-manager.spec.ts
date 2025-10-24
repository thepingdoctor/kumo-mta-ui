import { test, expect } from '@playwright/test';

test.describe('Queue Manager E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/queue');
  });

  test('should display queue manager interface', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Queue Management' })).toBeVisible();
    await expect(page.getByText('Monitor and manage email queue items')).toBeVisible();
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Search customers, emails...');
    await expect(searchInput).toBeVisible();

    // Test search input
    await searchInput.fill('test@example.com');
    await expect(searchInput).toHaveValue('test@example.com');
  });

  test('should have status filter dropdown', async ({ page }) => {
    const statusFilter = page.getByLabel('Filter by status');
    await expect(statusFilter).toBeVisible();

    // Should have default "All Statuses" option
    await expect(statusFilter).toHaveValue('');

    // Should be able to select different statuses
    await statusFilter.selectOption('waiting');
    await expect(statusFilter).toHaveValue('waiting');
  });

  test('should have service filter dropdown', async ({ page }) => {
    const serviceFilter = page.getByLabel('Filter by service');
    await expect(serviceFilter).toBeVisible();

    // Should have all service options
    await expect(serviceFilter).toContainText('All Services');
    await expect(serviceFilter).toContainText('Transactional');
    await expect(serviceFilter).toContainText('Marketing');
    await expect(serviceFilter).toContainText('Notification');
  });

  test('should have refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: 'Refresh queue data' });
    await expect(refreshButton).toBeVisible();

    // Should be clickable
    await refreshButton.click();
  });

  test('should have export button', async ({ page }) => {
    const exportButton = page.getByRole('button', { name: 'Export queue data' });
    await expect(exportButton).toBeVisible();
  });

  test('should display queue statistics', async ({ page }) => {
    // Wait for data to load
    await page.waitForLoadState('networkidle');

    // Should show statistics
    await expect(page.getByText('Total Items')).toBeVisible();
    await expect(page.getByText('Waiting')).toBeVisible();
    await expect(page.getByText('Processing')).toBeVisible();
    await expect(page.getByText('Completed')).toBeVisible();
  });

  test('should handle keyboard navigation in filters', async ({ page }) => {
    const statusFilter = page.getByLabel('Filter by status');

    // Focus on filter
    await statusFilter.focus();
    await expect(statusFilter).toBeFocused();

    // Navigate with keyboard
    await page.keyboard.press('Tab');

    // Next element should be focused
    const serviceFilter = page.getByLabel('Filter by service');
    await expect(serviceFilter).toBeFocused();
  });

  test('should be accessible', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.getByLabel('Search')).toBeVisible();
    await expect(page.getByLabel('Filter by status')).toBeVisible();
    await expect(page.getByLabel('Filter by service')).toBeVisible();
    await expect(page.getByLabel('Refresh queue data')).toBeVisible();
    await expect(page.getByLabel('Export queue data')).toBeVisible();
  });
});
