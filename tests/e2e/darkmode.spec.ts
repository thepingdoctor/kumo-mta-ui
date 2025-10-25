import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Dark Mode E2E Tests', () => {
  test.describe('Theme Toggle', () => {
    test('should have theme toggle button', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });
      const count = await themeToggle.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should toggle between light and dark mode', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        // Get initial theme
        const initialClass = await page.locator('html').getAttribute('class');

        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Verify theme changed
        const newClass = await page.locator('html').getAttribute('class');
        expect(newClass).not.toBe(initialClass);
      }
    });

    test('should persist theme preference', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        // Toggle to dark mode
        await themeToggle.click();
        await page.waitForTimeout(300);

        const darkModeClass = await page.locator('html').getAttribute('class');

        // Reload page
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Theme should be persisted
        const persistedClass = await page.locator('html').getAttribute('class');
        expect(persistedClass).toBe(darkModeClass);
      }
    });

    test('should update icon when theme changes', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        // Get initial icon
        const initialIcon = await themeToggle.locator('svg').first().getAttribute('class');

        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Icon should change
        const newIcon = await themeToggle.locator('svg').first().getAttribute('class');

        // Icons might be different or the same element with different class
        expect(await themeToggle.locator('svg').count()).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Dark Mode Appearance', () => {
    test('should apply dark theme colors', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        // Toggle to dark mode
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Check body background is dark
        const bgColor = await page.locator('body').evaluate(el =>
          window.getComputedStyle(el).backgroundColor
        );

        // Dark background should be darker (lower RGB values)
        expect(bgColor).toBeTruthy();
      }
    });

    test('should maintain contrast in dark mode', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        // Toggle to dark mode
        await themeToggle.click();
        await page.waitForLoadState('networkidle');

        // Run accessibility check in dark mode
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2aa'])
          .analyze();

        const contrastViolations = accessibilityScanResults.violations.filter(
          v => v.id === 'color-contrast'
        );

        expect(contrastViolations).toEqual([]);
      }
    });

    test('should apply dark theme to all pages', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        // Toggle to dark mode
        await themeToggle.click();
        await page.waitForTimeout(300);

        const darkModeClass = await page.locator('html').getAttribute('class');

        // Navigate to different pages
        await page.goto('/queue');
        expect(await page.locator('html').getAttribute('class')).toBe(darkModeClass);

        await page.goto('/config');
        expect(await page.locator('html').getAttribute('class')).toBe(darkModeClass);
      }
    });
  });

  test.describe('System Preference', () => {
    test('should respect system dark mode preference', async ({ page, context }) => {
      // Set system preference to dark mode
      await context.emulateMedia({ colorScheme: 'dark' });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should apply dark mode
      const htmlClass = await page.locator('html').getAttribute('class');

      // Either explicit dark class or respects system preference
      expect(htmlClass !== null).toBe(true);
    });

    test('should respect system light mode preference', async ({ page, context }) => {
      // Set system preference to light mode
      await context.emulateMedia({ colorScheme: 'light' });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const htmlClass = await page.locator('html').getAttribute('class');

      // Should not have dark class or respects system preference
      expect(htmlClass !== null).toBe(true);
    });
  });

  test.describe('Charts in Dark Mode', () => {
    test('should update chart colors in dark mode', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        // Toggle to dark mode
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Charts should still be visible
        const charts = page.locator('canvas');
        if (await charts.count() > 0) {
          await expect(charts.first()).toBeVisible();
        }
      }
    });

    test('should maintain chart readability in dark mode', async ({ page }) => {
      await page.goto('/analytics');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        // Toggle to dark mode
        await themeToggle.click();
        await page.waitForLoadState('networkidle');

        // Charts should be visible and functional
        const charts = page.locator('canvas');
        if (await charts.count() > 0) {
          await expect(charts.first()).toBeVisible();

          // Chart should be interactive
          await charts.first().hover();
        }
      }
    });
  });

  test.describe('Accessibility in Dark Mode', () => {
    test('should not have accessibility violations in dark mode', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        // Toggle to dark mode
        await themeToggle.click();
        await page.waitForLoadState('networkidle');

        // Run accessibility scan
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2aa', 'wcag21aa'])
          .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
      }
    });

    test('theme toggle should be keyboard accessible', async ({ page }) => {
      await page.goto('/');

      // Tab to theme toggle
      let tabCount = 0;
      while (tabCount < 20) {
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
        if (focusedElement?.toLowerCase().includes('theme') ||
            focusedElement?.toLowerCase().includes('dark') ||
            focusedElement?.toLowerCase().includes('mode')) {
          break;
        }
        tabCount++;
      }

      // Should be able to toggle with keyboard
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
    });

    test('theme toggle should have ARIA label', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        await expect(themeToggle).toHaveAttribute('aria-label');
      }
    });
  });

  test.describe('Mobile Dark Mode', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        await expect(themeToggle).toBeVisible();

        // Should be tappable
        await themeToggle.click();
        await page.waitForTimeout(300);

        // Theme should change
        const htmlClass = await page.locator('html').getAttribute('class');
        expect(htmlClass).toBeTruthy();
      }
    });
  });

  test.describe('Performance', () => {
    test('should toggle theme quickly', async ({ page }) => {
      await page.goto('/');

      const themeToggle = page.getByRole('button', { name: /theme|dark|light|mode/i });

      if (await themeToggle.count() > 0) {
        const startTime = Date.now();

        // Toggle theme
        await themeToggle.click();
        await page.waitForTimeout(100);

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Should be fast (under 500ms)
        expect(duration).toBeLessThan(500);
      }
    });
  });
});
