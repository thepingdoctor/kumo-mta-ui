/**
 * Performance Monitoring Utilities
 * Tracks metrics, identifies bottlenecks, and provides performance insights
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    totalRequests: number;
    errorRate: number;
  };
  bottlenecks: string[];
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Store last 1000 metrics

  /**
   * Record a performance metric
   */
  record(name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms', metadata?: Record<string, unknown>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Measure execution time of a function
   */
  async measure<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.record(name, duration, 'ms', { success: true });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(name, duration, 'ms', { success: false, error: String(error) });
      throw error;
    }
  }

  /**
   * Get all metrics for a specific name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (!name) return [...this.metrics];
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const timingMetrics = this.metrics.filter(m => m.unit === 'ms');

    if (timingMetrics.length === 0) {
      return {
        metrics: [],
        summary: {
          avgResponseTime: 0,
          maxResponseTime: 0,
          minResponseTime: 0,
          totalRequests: 0,
          errorRate: 0,
        },
        bottlenecks: [],
        recommendations: [],
      };
    }

    const values = timingMetrics.map(m => m.value);
    const errors = timingMetrics.filter(m => m.metadata?.success === false).length;

    const avgResponseTime = values.reduce((a, b) => a + b, 0) / values.length;
    const maxResponseTime = Math.max(...values);
    const minResponseTime = Math.min(...values);
    const errorRate = (errors / timingMetrics.length) * 100;

    // Identify bottlenecks (operations > 1000ms)
    const bottlenecks = timingMetrics
      .filter(m => m.value > 1000)
      .map(m => `${m.name}: ${m.value.toFixed(2)}ms`)
      .filter((value, index, self) => self.indexOf(value) === index);

    // Generate recommendations
    const recommendations: string[] = [];

    if (avgResponseTime > 500) {
      recommendations.push('Average response time is high. Consider optimizing API calls or implementing caching.');
    }

    if (errorRate > 5) {
      recommendations.push(`Error rate is ${errorRate.toFixed(2)}%. Investigate failing requests.`);
    }

    if (bottlenecks.length > 0) {
      recommendations.push(`${bottlenecks.length} operations detected with >1s response time. Consider optimization.`);
    }

    return {
      metrics: this.metrics,
      summary: {
        avgResponseTime,
        maxResponseTime,
        minResponseTime,
        totalRequests: timingMetrics.length,
        errorRate,
      },
      bottlenecks,
      recommendations,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Record Web Vitals metrics
   */
  recordWebVitals(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    // Record navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.record('page_load', navigation.loadEventEnd - navigation.fetchStart, 'ms');
      this.record('dns_lookup', navigation.domainLookupEnd - navigation.domainLookupStart, 'ms');
      this.record('tcp_connection', navigation.connectEnd - navigation.connectStart, 'ms');
      this.record('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');
    }

    // Record resource timing
    const resources = performance.getEntriesByType('resource');
    const totalResourceSize = resources.reduce((acc, r: PerformanceResourceTiming) => acc + (r.transferSize || 0), 0);
    this.record('total_resource_size', totalResourceSize, 'bytes');

    // Record paint timing
    const paintEntries = performance.getEntriesByType('paint');
    paintEntries.forEach(entry => {
      this.record(entry.name, entry.startTime, 'ms');
    });
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Export convenience function for React components
export const usePerformanceMonitor = () => performanceMonitor;
