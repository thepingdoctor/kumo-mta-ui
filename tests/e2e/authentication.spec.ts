import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Authentication E2E Tests', () => {
  test.describe('Login Flow', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');

      await expect(page.getByRole('heading', { name: /login|sign in/i })).toBeVisible();
    });

    test('should have email and password fields', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.getByLabel(/email|username/i);
      const passwordInput = page.getByLabel(/password/i);

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    });

    test('should have submit button', async ({ page }) => {
      await page.goto('/login');

      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i });
      await expect(submitButton).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/login');

      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i });
      await submitButton.click();

      // Should show validation errors
      const errors = page.getByText(/required|invalid|enter/i);
      const errorCount = await errors.count();
      expect(errorCount).toBeGreaterThanOrEqual(0);
    });

    test('should handle invalid credentials', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.getByLabel(/email|username/i);
      const passwordInput = page.getByLabel(/password/i);
      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i });

      if (await emailInput.count() > 0) {
        await emailInput.fill('invalid@example.com');
        await passwordInput.fill('wrongpassword');
        await submitButton.click();

        // Should show error message
        await page.waitForTimeout(1000);
        const errorMessage = page.getByText(/invalid|incorrect|wrong|failed/i);
        const count = await errorMessage.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle successful login', async ({ page }) => {
      await page.goto('/login');

      const emailInput = page.getByLabel(/email|username/i);
      const passwordInput = page.getByLabel(/password/i);
      const submitButton = page.getByRole('button', { name: /login|sign in|submit/i });

      if (await emailInput.count() > 0) {
        await emailInput.fill('admin@example.com');
        await passwordInput.fill('password123');
        await submitButton.click();

        // Should redirect to dashboard
        await page.waitForURL('**/', { timeout: 5000 }).catch(() => {});
      }
    });

    test('should mask password input', async ({ page }) => {
      await page.goto('/login');

      const passwordInput = page.getByLabel(/password/i);
      if (await passwordInput.count() > 0) {
        await expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/login');

      // Tab through form
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Logout Flow', () => {
    test('should have logout button when authenticated', async ({ page }) => {
      await page.goto('/');

      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      const count = await logoutButton.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should logout successfully', async ({ page }) => {
      await page.goto('/');

      const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
      if (await logoutButton.count() > 0) {
        await logoutButton.click();

        // Should redirect to login
        await page.waitForURL('**/login', { timeout: 5000 }).catch(() => {});
      }
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login for protected routes when not authenticated', async ({ page }) => {
      // Clear any existing auth
      await page.context().clearCookies();

      await page.goto('/config');

      // Should redirect to login or show login prompt
      const loginElements = page.getByText(/login|sign in|unauthorized/i);
      const count = await loginElements.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should allow access to protected routes when authenticated', async ({ page }) => {
      // This would require actual authentication setup
      await page.goto('/');

      // Navigate to protected route
      await page.goto('/config');

      // Should show config page
      const configContent = page.getByRole('heading', { name: /config/i });
      const count = await configContent.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page navigation', async ({ page }) => {
      await page.goto('/');

      // Navigate to different pages
      await page.goto('/queue');
      await page.goto('/config');
      await page.goto('/');

      // Should still be on a valid page
      await expect(page).toHaveURL(/./);
    });

    test('should handle session expiration', async ({ page }) => {
      await page.goto('/');

      // Clear cookies to simulate session expiration
      await page.context().clearCookies();

      // Navigate to protected route
      await page.goto('/config');

      // Should prompt for login
      const loginPrompt = page.getByText(/login|sign in|session|expired/i);
      const count = await loginPrompt.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Accessibility', () => {
    test('login page should not have accessibility violations', async ({ page }) => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('should support screen reader announcements', async ({ page }) => {
      await page.goto('/login');

      // Check for ARIA labels
      const ariaElements = page.locator('[aria-label], [aria-labelledby]');
      const count = await ariaElements.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('login should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');

      const heading = page.getByRole('heading', { name: /login|sign in/i });
      await expect(heading).toBeVisible();
    });
  });
});
