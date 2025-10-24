import { test, expect } from '@playwright/test';

test.describe('Configuration Editor E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/config');
  });

  test('should display configuration editor', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Configuration' })).toBeVisible();
    await expect(page.getByText('Manage your KumoMTA server settings')).toBeVisible();
  });

  test('should have reset and save buttons', async ({ page }) => {
    const resetButton = page.getByRole('button', { name: /Reset/i });
    const saveButton = page.getByRole('button', { name: /Save Changes/i });

    await expect(resetButton).toBeVisible();
    await expect(saveButton).toBeVisible();

    // Buttons should be disabled initially (no changes)
    await expect(resetButton).toBeDisabled();
    await expect(saveButton).toBeDisabled();
  });

  test('should enable buttons when form is dirty', async ({ page }) => {
    // Find any input field and modify it
    const inputs = page.locator('input[type="text"], input[type="number"]').first();

    if (await inputs.count() > 0) {
      await inputs.fill('test-value');

      // Buttons should now be enabled
      const saveButton = page.getByRole('button', { name: /Save Changes/i });
      await expect(saveButton).toBeEnabled({ timeout: 2000 });
    }
  });

  test('should display configuration sections', async ({ page }) => {
    // Wait for form to load
    await page.waitForLoadState('networkidle');

    // Check for configuration sections (these may vary based on configData)
    const sections = page.locator('h3');
    await expect(sections.first()).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab');

    // Should be able to navigate with keyboard
    await expect(page.locator(':focus')).toBeVisible();
  });

  test('should be accessible', async ({ page }) => {
    // Check for proper form structure
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Buttons should have accessible labels
    await expect(page.getByRole('button', { name: /Reset/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Changes/i })).toBeVisible();
  });
});
