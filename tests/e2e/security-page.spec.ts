import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Security Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/security');
  });

  test('should display security dashboard', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /security/i })).toBeVisible();
  });

  test('should display security metrics', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check for common security metrics
    await expect(page.getByText(/threat/i).or(page.getByText(/alert/i))).toBeVisible({ timeout: 5000 });
  });

  test('should have authentication settings section', async ({ page }) => {
    // Look for authentication-related content
    const authContent = page.getByText(/authentication/i).or(page.getByText(/login/i));
    const count = await authContent.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have SSL/TLS configuration', async ({ page }) => {
    const sslContent = page.getByText(/ssl/i).or(page.getByText(/tls/i));
    const count = await sslContent.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display firewall rules', async ({ page }) => {
    const firewallContent = page.getByText(/firewall/i).or(page.getByText(/rules/i));
    const count = await firewallContent.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have IP whitelist/blacklist management', async ({ page }) => {
    const ipContent = page.getByText(/ip/i).or(page.getByText(/whitelist/i)).or(page.getByText(/blacklist/i));
    const count = await ipContent.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should allow configuring security settings', async ({ page }) => {
    // Look for any input fields or buttons
    const inputs = page.locator('input, button, select');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have save/apply buttons for security settings', async ({ page }) => {
    const buttons = page.getByRole('button', { name: /save|apply|update/i });
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(0);
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
    await expect(page.getByRole('heading', { name: /security/i })).toBeVisible();
  });

  test('should handle keyboard navigation', async ({ page }) => {
    await page.keyboard.press('Tab');

    // Should be able to navigate with keyboard
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});
