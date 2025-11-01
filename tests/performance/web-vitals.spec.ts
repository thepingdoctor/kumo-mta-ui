/**
 * Web Vitals Performance Tests
 *
 * Validates Core Web Vitals metrics meet Google's thresholds:
 * - LCP (Largest Contentful Paint): < 2.5s
 * - FID (First Input Delay): < 100ms
 * - CLS (Cumulative Layout Shift): < 0.1
 * - FCP (First Contentful Paint): < 1.8s
 * - TTFB (Time to First Byte): < 600ms
 *
 * @test-priority: HIGH
 * @run-on: pre-deployment, post-deployment
 */

import { test, expect, chromium } from '@playwright/test';

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://localhost:3000';

interface WebVitalsMetrics {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  tti: number; // Time to Interactive
}

test.describe('Web Vitals Performance Tests', () => {
  test('should meet LCP threshold (< 2.5s)', async ({ page }) => {
    let lcpValue = 0;

    // Collect LCP metric
    await page.evaluateOnNewDocument(() => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        (window as any).__lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');

    lcpValue = await page.evaluate(() => (window as any).__lcp || 0);

    console.log(`📊 LCP: ${lcpValue.toFixed(2)}ms`);
    expect(lcpValue).toBeGreaterThan(0);
    expect(lcpValue).toBeLessThan(2500);
  });

  test('should meet FID threshold (< 100ms)', async ({ page }) => {
    let fidValue = 0;

    // Collect FID metric
    await page.evaluateOnNewDocument(() => {
      new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0];
        if (firstInput && 'processingStart' in firstInput && 'startTime' in firstInput) {
          (window as any).__fid = (firstInput as any).processingStart - firstInput.startTime;
        }
      }).observe({ type: 'first-input', buffered: true });
    });

    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');

    // Trigger a user interaction
    const clickable = page.locator('button, a, input').first();
    if (await clickable.count() > 0) {
      await clickable.click();

      // Wait a bit for the observer to capture FID
      await page.waitForTimeout(100);

      fidValue = await page.evaluate(() => (window as any).__fid || 0);

      if (fidValue > 0) {
        console.log(`📊 FID: ${fidValue.toFixed(2)}ms`);
        expect(fidValue).toBeLessThan(100);
      } else {
        console.log('⚠️  FID not captured (requires real user interaction)');
      }
    }
  });

  test('should meet CLS threshold (< 0.1)', async ({ page }) => {
    let clsValue = 0;

    // Collect CLS metric
    await page.evaluateOnNewDocument(() => {
      let clsScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
            (window as any).__cls = clsScore;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');

    // Scroll to trigger any lazy-loaded content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);

    clsValue = await page.evaluate(() => (window as any).__cls || 0);

    console.log(`📊 CLS: ${clsValue.toFixed(4)}`);
    expect(clsValue).toBeLessThan(0.1);
  });

  test('should meet FCP threshold (< 1.8s)', async ({ page }) => {
    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');

    const fcpValue = await page.evaluate(() => {
      const entry = performance.getEntriesByName('first-contentful-paint')[0];
      return entry ? entry.startTime : 0;
    });

    console.log(`📊 FCP: ${fcpValue.toFixed(2)}ms`);
    expect(fcpValue).toBeGreaterThan(0);
    expect(fcpValue).toBeLessThan(1800);
  });

  test('should meet TTFB threshold (< 600ms)', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto(DEPLOYMENT_URL);
    const ttfb = Date.now() - startTime;

    console.log(`📊 TTFB: ${ttfb}ms`);
    expect(ttfb).toBeLessThan(600);
    expect(response?.status()).toBe(200);
  });

  test('should become interactive quickly (TTI < 3.8s)', async ({ page }) => {
    const startTime = Date.now();

    await page.goto(DEPLOYMENT_URL);

    // Wait for page to be interactive
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    });

    const tti = Date.now() - startTime;

    console.log(`📊 TTI: ${tti}ms`);
    expect(tti).toBeLessThan(3800);
  });

  test('should collect comprehensive metrics report', async ({ page }) => {
    const metrics: Partial<WebVitalsMetrics> = {};

    // Set up all observers
    await page.evaluateOnNewDocument(() => {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        (window as any).__metrics = (window as any).__metrics || {};
        (window as any).__metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // FID
      new PerformanceObserver((list) => {
        const firstInput = list.getEntries()[0];
        if (firstInput && 'processingStart' in firstInput && 'startTime' in firstInput) {
          (window as any).__metrics.fid = (firstInput as any).processingStart - firstInput.startTime;
        }
      }).observe({ type: 'first-input', buffered: true });

      // CLS
      let clsScore = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
            (window as any).__metrics.cls = clsScore;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    const startTime = Date.now();
    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');

    // Get FCP and TTFB
    const navigationMetrics = await page.evaluate(() => {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const navTiming = performance.getEntriesByType('navigation')[0] as any;

      return {
        fcp: fcp ? fcp.startTime : 0,
        ttfb: navTiming ? navTiming.responseStart : 0,
        tti: performance.now()
      };
    });

    // Get Web Vitals
    const webVitals = await page.evaluate(() => (window as any).__metrics || {});

    const report = {
      ...webVitals,
      ...navigationMetrics,
      timestamp: new Date().toISOString(),
      url: DEPLOYMENT_URL
    };

    console.log('\n📊 Performance Metrics Report:');
    console.log('================================');
    console.log(`LCP: ${report.lcp?.toFixed(2) || 'N/A'}ms (target: < 2500ms)`);
    console.log(`FID: ${report.fid?.toFixed(2) || 'N/A'}ms (target: < 100ms)`);
    console.log(`CLS: ${report.cls?.toFixed(4) || 'N/A'} (target: < 0.1)`);
    console.log(`FCP: ${report.fcp?.toFixed(2) || 'N/A'}ms (target: < 1800ms)`);
    console.log(`TTFB: ${report.ttfb?.toFixed(2) || 'N/A'}ms (target: < 600ms)`);
    console.log(`TTI: ${report.tti?.toFixed(2) || 'N/A'}ms (target: < 3800ms)`);
    console.log('================================\n');

    // Validate all metrics
    if (report.lcp) expect(report.lcp).toBeLessThan(2500);
    if (report.cls) expect(report.cls).toBeLessThan(0.1);
    if (report.fcp) expect(report.fcp).toBeLessThan(1800);
    if (report.ttfb) expect(report.ttfb).toBeLessThan(600);
    if (report.tti) expect(report.tti).toBeLessThan(3800);
  });

  test('should perform well on slow 3G network', async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();

    // Simulate slow 3G
    const client = await context.newCDPSession(await context.pages()[0]);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 400 * 1024 / 8, // 400 Kbps
      uploadThroughput: 400 * 1024 / 8,
      latency: 400
    });

    const page = await context.newPage();
    const startTime = Date.now();

    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`📊 Slow 3G load time: ${loadTime}ms`);

    // On slow 3G, we should still load within reasonable time
    expect(loadTime).toBeLessThan(10000); // 10 seconds max

    await browser.close();
  });
});
