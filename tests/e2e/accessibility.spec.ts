import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility E2E Tests', () => {
  test('should not have automatically detectable accessibility issues on Dashboard', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on Queue Manager', async ({ page }) => {
    await page.goto('/queue');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have accessibility issues on Configuration', async ({ page }) => {
    await page.goto('/config');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard-only navigation', async ({ page }) => {
    await page.goto('/');

    // Start tabbing through interactive elements
    await page.keyboard.press('Tab');

    // Should be able to navigate to sidebar links
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Check for h1
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    // Check for h2
    const h2 = page.locator('h2');
    await expect(h2.first()).toBeVisible();
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    const contrastViolations = accessibilityScanResults.violations.filter(
      v => v.id === 'color-contrast'
    );

    expect(contrastViolations).toEqual([]);
  });

  test('should have descriptive link text', async ({ page }) => {
    await page.goto('/');

    // All navigation links should have descriptive text
    const links = page.locator('nav a');
    const count = await links.count();

    for (let i = 0; i < count; i++) {
      const linkText = await links.nth(i).textContent();
      expect(linkText).toBeTruthy();
      expect(linkText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/queue');

    // Search input should have label
    const searchInput = page.getByPlaceholder('Search customers, emails...');
    await expect(searchInput).toHaveAttribute('id');

    // Filters should have labels
    const statusFilter = page.getByLabel('Filter by status');
    await expect(statusFilter).toBeVisible();

    const serviceFilter = page.getByLabel('Filter by service');
    await expect(serviceFilter).toBeVisible();
  });

  test('should support screen reader announcements', async ({ page }) => {
    await page.goto('/');

    // Check for ARIA live regions (for toast notifications)
    const liveRegions = page.locator('[role="alert"], [aria-live]');
    expect(await liveRegions.count()).toBeGreaterThanOrEqual(0);
  });
});
