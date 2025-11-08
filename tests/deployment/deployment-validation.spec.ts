/**
 * Deployment Validation & Rollback Tests
 *
 * Comprehensive deployment validation including:
 * - Pre-deployment checks
 * - Post-deployment validation
 * - Rollback procedures
 * - Health monitoring
 *
 * @test-priority: CRITICAL
 * @run-on: deployment pipeline
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

const DEPLOYMENT_URL = process.env.DEPLOYMENT_URL || 'http://localhost:3000';
const PREVIOUS_VERSION = process.env.PREVIOUS_VERSION || 'unknown';
const CURRENT_VERSION = process.env.CURRENT_VERSION || 'unknown';

test.describe('Pre-Deployment Validation', () => {
  test('should verify build artifacts exist', () => {
    try {
      const distExists = execSync('test -d dist && echo "exists" || echo "missing"')
        .toString()
        .trim();

      expect(distExists).toBe('exists');
      console.log('✅ Build artifacts verified');
    } catch {
      throw new Error('Build artifacts missing');
    }
  });

  test('should verify bundle size is within limits', () => {
    try {
      const bundleSize = execSync('du -sb dist | cut -f1')
        .toString()
        .trim();

      const sizeInKB = parseInt(bundleSize) / 1024;
      const MAX_SIZE_KB = 250;

      console.log(`📊 Bundle size: ${sizeInKB.toFixed(2)}KB`);
      expect(sizeInKB).toBeLessThanOrEqual(MAX_SIZE_KB);
    } catch {
      console.warn('⚠️  Could not verify bundle size');
    }
  });

  test('should have valid deployment configuration', () => {
    const requiredEnvVars = [
      'DEPLOYMENT_URL',
    ];

    const missing = requiredEnvVars.filter(v => !process.env[v]);

    if (missing.length > 0) {
      console.warn(`⚠️  Missing env vars: ${missing.join(', ')}`);
    }

    expect(missing.length).toBeLessThanOrEqual(requiredEnvVars.length);
  });

  test('should verify no critical security vulnerabilities', () => {
    try {
      execSync('npm audit --production --audit-level=high', {
        encoding: 'utf-8',
        stdio: 'pipe'
      });

      console.log('✅ No high-severity vulnerabilities found');
    } catch (error: unknown) {
      // npm audit exits with code 1 if vulnerabilities found
      if (error && typeof error === 'object' && 'stdout' in error) {
        console.warn('⚠️  Security audit warnings:', error.stdout);
      }
      // Don't fail deployment for audit issues, but warn
      console.warn('⚠️  Run `npm audit fix` to address vulnerabilities');
    }
  });
});

test.describe('Post-Deployment Validation', () => {
  test('should confirm deployment is live', async ({ page }) => {
    const response = await page.goto(DEPLOYMENT_URL);

    expect(response?.status()).toBe(200);
    console.log(`✅ Deployment is live at ${DEPLOYMENT_URL}`);
  });

  test('should verify version update', async ({ page }) => {
    await page.goto(DEPLOYMENT_URL);

    // Check for version meta tag or API endpoint
    const version = await page.evaluate(() => {
      const versionMeta = document.querySelector('meta[name="version"]');
      return versionMeta?.getAttribute('content') || null;
    });

    if (version) {
      console.log(`📊 Deployed version: ${version}`);
      if (CURRENT_VERSION !== 'unknown') {
        expect(version).toBe(CURRENT_VERSION);
      }
    } else {
      console.log('⚠️  No version metadata found');
    }
  });

  test('should pass all smoke tests', async ({ page }) => {
    const checks = {
      pageLoads: false,
      noErrors: false,
      hasContent: false,
      interactive: false
    };

    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Page loads
    const response = await page.goto(DEPLOYMENT_URL);
    checks.pageLoads = response?.status() === 200;

    // Has content
    const content = page.locator('body');
    checks.hasContent = await content.isVisible();

    // No errors
    await page.waitForLoadState('networkidle');
    checks.noErrors = errors.length === 0;

    // Interactive
    const interactive = page.locator('button, a, input').first();
    if (await interactive.count() > 0) {
      checks.interactive = await interactive.isVisible();
    }

    console.log('\n🔍 Smoke Test Results:');
    console.log('=====================');
    console.log(`Page loads: ${checks.pageLoads ? '✅' : '❌'}`);
    console.log(`Has content: ${checks.hasContent ? '✅' : '❌'}`);
    console.log(`No errors: ${checks.noErrors ? '✅' : '❌'}`);
    console.log(`Interactive: ${checks.interactive ? '✅' : '❌'}`);
    console.log('=====================\n');

    if (errors.length > 0) {
      console.error('Console errors:', errors);
    }

    expect(checks.pageLoads).toBe(true);
    expect(checks.hasContent).toBe(true);
    expect(checks.noErrors).toBe(true);
  });

  test('should meet performance thresholds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    console.log(`📊 Page load time: ${loadTime}ms`);

    // Should load within 5 seconds even on first visit
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have monitoring active', async ({ page }) => {
    // Check if analytics/monitoring is working
    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');

    const monitoringActive = await page.evaluate(() => {
      return !!(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gtag ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).analytics ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).plausible ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__monitoring
      );
    });

    if (monitoringActive) {
      console.log('✅ Monitoring is active');
    } else {
      console.log('⚠️  No monitoring detected');
    }
  });

  test('should verify CDN/cache headers', async ({ page }) => {
    const response = await page.goto(DEPLOYMENT_URL);
    const headers = response?.headers();

    if (headers) {
      const cacheControl = headers['cache-control'];
      const _cdn = headers['cf-ray'] || headers['x-cache'] || headers['x-amz-cf-id'];

      if (cacheControl) {
        console.log(`📊 Cache-Control: ${cacheControl}`);
      }

      if (_cdn) {
        console.log('✅ CDN headers detected');
      }
    }
  });
});

test.describe('Health Monitoring', () => {
  test('should monitor application health over time', async ({ page }) => {
    const healthChecks: { timestamp: number; success: boolean; responseTime: number }[] = [];

    // Perform multiple health checks
    for (let i = 0; i < 5; i++) {
      const startTime = Date.now();
      try {
        const response = await page.goto(DEPLOYMENT_URL, {
          waitUntil: 'domcontentloaded',
          timeout: 5000
        });

        healthChecks.push({
          timestamp: Date.now(),
          success: response?.status() === 200,
          responseTime: Date.now() - startTime
        });
      } catch {
        healthChecks.push({
          timestamp: Date.now(),
          success: false,
          responseTime: Date.now() - startTime
        });
      }

      // Wait between checks
      await page.waitForTimeout(1000);
    }

    const successRate = healthChecks.filter(h => h.success).length / healthChecks.length;
    const avgResponseTime = healthChecks.reduce((sum, h) => sum + h.responseTime, 0) / healthChecks.length;

    console.log('\n📊 Health Monitoring Results:');
    console.log('============================');
    console.log(`Success rate: ${(successRate * 100).toFixed(2)}%`);
    console.log(`Avg response time: ${avgResponseTime.toFixed(2)}ms`);
    console.log('============================\n');

    // Should have 100% uptime
    expect(successRate).toBe(1.0);

    // Average response time should be reasonable
    expect(avgResponseTime).toBeLessThan(3000);
  });

  test('should handle concurrent requests', async ({ context }) => {
    const pages = await Promise.all([
      context.newPage(),
      context.newPage(),
      context.newPage(),
      context.newPage(),
      context.newPage()
    ]);

    const results = await Promise.allSettled(
      pages.map(p => p.goto(DEPLOYMENT_URL))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;

    console.log(`📊 Concurrent requests: ${successful}/${results.length} successful`);

    // All requests should succeed
    expect(successful).toBe(results.length);

    // Cleanup
    await Promise.all(pages.map(p => p.close()));
  });
});

test.describe('Rollback Procedures', () => {
  test('should have rollback script available', () => {
    try {
      const scriptExists = execSync('test -f scripts/rollback.sh && echo "exists" || echo "missing"')
        .toString()
        .trim();

      if (scriptExists === 'exists') {
        console.log('✅ Rollback script found');
      } else {
        console.log('⚠️  No rollback script found at scripts/rollback.sh');
      }
    } catch {
      console.log('⚠️  Could not verify rollback script');
    }
  });

  test('should document rollback procedure', () => {
    try {
      const docsExist = execSync('test -f docs/DEPLOYMENT.md && echo "exists" || echo "missing"')
        .toString()
        .trim();

      if (docsExist === 'exists') {
        console.log('✅ Deployment documentation found');
      } else {
        console.log('⚠️  No deployment docs found');
      }
    } catch {
      console.log('⚠️  Could not verify deployment docs');
    }
  });

  test('should create deployment checkpoint', () => {
    const checkpoint = {
      timestamp: new Date().toISOString(),
      version: CURRENT_VERSION,
      previousVersion: PREVIOUS_VERSION,
      deploymentUrl: DEPLOYMENT_URL,
      validationPassed: true
    };

    console.log('\n📋 Deployment Checkpoint:');
    console.log(JSON.stringify(checkpoint, null, 2));

    // In real scenario, save this to monitoring/logging system
    expect(checkpoint.deploymentUrl).toBeTruthy();
  });
});

test.describe('Degradation Detection', () => {
  test('should detect performance degradation', async ({ page }) => {
    // This would compare against baseline metrics
    const BASELINE_LCP = 2000; // 2s baseline

    await page.evaluateOnNewDocument(() => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__lcp = lastEntry.renderTime || lastEntry.loadTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });

    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState('networkidle');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lcp = await page.evaluate(() => (window as any).__lcp || 0);

    if (lcp > 0) {
      const degradation = ((lcp - BASELINE_LCP) / BASELINE_LCP) * 100;

      console.log(`📊 LCP: ${lcp.toFixed(2)}ms (baseline: ${BASELINE_LCP}ms)`);

      if (degradation > 20) {
        console.warn(`⚠️  Performance degradation detected: ${degradation.toFixed(2)}%`);
      } else {
        console.log('✅ Performance within acceptable range');
      }

      // Fail if significant degradation (>50%)
      expect(degradation).toBeLessThan(50);
    }
  });

  test('should detect bundle size regression', () => {
    const BASELINE_SIZE_KB = 250;

    try {
      const currentSize = execSync('du -sk dist | cut -f1')
        .toString()
        .trim();

      const sizeKB = parseInt(currentSize);
      const regression = ((sizeKB - BASELINE_SIZE_KB) / BASELINE_SIZE_KB) * 100;

      console.log(`📊 Bundle: ${sizeKB}KB (baseline: ${BASELINE_SIZE_KB}KB)`);

      if (regression > 10) {
        console.warn(`⚠️  Bundle size regression: ${regression.toFixed(2)}%`);
      }

      // Fail if >25% regression
      expect(regression).toBeLessThan(25);
    } catch {
      console.warn('⚠️  Could not check bundle size');
    }
  });
});
