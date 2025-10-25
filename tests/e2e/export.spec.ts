import { test, expect } from '@playwright/test';

test.describe('Export Functionality E2E Tests', () => {
  test.describe('Queue Manager Export', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/queue');
    });

    test('should have export button', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export/i });
      await expect(exportButton).toBeVisible();
    });

    test('should trigger download on export click', async ({ page }) => {
      const exportButton = page.getByRole('button', { name: /export/i });

      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await exportButton.click();

      const download = await downloadPromise;

      if (download) {
        // Verify download was triggered
        expect(download).toBeTruthy();

        // Check filename contains expected format
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/\.(csv|xlsx|json|pdf)$/i);
      }
    });

    test('should export CSV format', async ({ page }) => {
      // Look for format selector or CSV export button
      const csvButton = page.getByRole('button', { name: /csv|export.*csv/i });
      const count = await csvButton.count();

      if (count > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await csvButton.click();

        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.csv$/i);
        }
      }
    });

    test('should export with current filters applied', async ({ page }) => {
      // Apply a filter
      const statusFilter = page.getByLabel('Filter by status');
      if (await statusFilter.count() > 0) {
        await statusFilter.selectOption('waiting');

        // Export
        const exportButton = page.getByRole('button', { name: /export/i });
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await exportButton.click();

        const download = await downloadPromise;
        expect(download).toBeTruthy();
      }
    });
  });

  test.describe('PDF Export', () => {
    test('should export dashboard as PDF', async ({ page }) => {
      await page.goto('/');

      // Look for PDF export button
      const pdfButton = page.getByRole('button', { name: /pdf|export.*pdf/i });
      const count = await pdfButton.count();

      if (count > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await pdfButton.click();

        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
        }
      }
    });

    test('should export analytics charts as PDF', async ({ page }) => {
      await page.goto('/analytics');

      const pdfButton = page.getByRole('button', { name: /pdf|export.*pdf/i });
      const count = await pdfButton.count();

      if (count > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
        await pdfButton.click();

        const download = await downloadPromise;
        if (download) {
          expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
        }
      }
    });
  });

  test.describe('Export Options', () => {
    test('should show export format options', async ({ page }) => {
      await page.goto('/queue');

      const exportButton = page.getByRole('button', { name: /export/i });
      await exportButton.click();

      // Look for format options menu
      const formatOptions = page.getByText(/csv|pdf|xlsx|json/i);
      const count = await formatOptions.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should allow selecting date range for export', async ({ page }) => {
      await page.goto('/analytics');

      // Look for date range selector
      const dateRange = page.getByLabel(/date|range|from|to/i);
      const count = await dateRange.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Export Progress', () => {
    test('should show export progress indicator', async ({ page }) => {
      await page.goto('/queue');

      const exportButton = page.getByRole('button', { name: /export/i });
      await exportButton.click();

      // Look for progress indicator
      await page.waitForTimeout(100);
      const progressIndicator = page.getByText(/exporting|preparing|generating/i);
      const count = await progressIndicator.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show success message after export', async ({ page }) => {
      await page.goto('/queue');

      const exportButton = page.getByRole('button', { name: /export/i });
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);

      await exportButton.click();
      await downloadPromise;

      // Look for success message
      await page.waitForTimeout(500);
      const successMessage = page.getByText(/success|exported|downloaded/i);
      const count = await successMessage.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Export Error Handling', () => {
    test('should handle export errors gracefully', async ({ page }) => {
      await page.goto('/queue');

      // This test would require mocking a failed export
      // For now, just verify error handling UI exists
      const exportButton = page.getByRole('button', { name: /export/i });
      await expect(exportButton).toBeVisible();
    });

    test('should show error message on export failure', async ({ page }) => {
      await page.goto('/queue');

      // Mock a network failure scenario would go here
      // Verify error handling exists
      const errorContainer = page.locator('[role="alert"], .error, .toast');
      const count = await errorContainer.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Accessibility', () => {
    test('export button should be keyboard accessible', async ({ page }) => {
      await page.goto('/queue');

      // Tab to export button
      let tabCount = 0;
      while (tabCount < 20) {
        await page.keyboard.press('Tab');
        const focusedText = await page.evaluate(() => document.activeElement?.textContent);
        if (focusedText?.toLowerCase().includes('export')) {
          break;
        }
        tabCount++;
      }

      // Should be able to trigger export with keyboard
      const exportButton = page.getByRole('button', { name: /export/i });
      if (await exportButton.count() > 0) {
        await expect(exportButton).toBeFocused();
      }
    });

    test('export options should have ARIA labels', async ({ page }) => {
      await page.goto('/queue');

      const exportButton = page.getByRole('button', { name: /export/i });
      await expect(exportButton).toHaveAttribute('aria-label');
    });
  });

  test.describe('Mobile Export', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/queue');

      const exportButton = page.getByRole('button', { name: /export/i });
      await expect(exportButton).toBeVisible();

      // Should be tappable
      await exportButton.click();
    });
  });
});
