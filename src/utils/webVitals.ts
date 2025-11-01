/**
 * Web Vitals Performance Monitoring
 * Tracks Core Web Vitals and reports to analytics service
 *
 * Metrics tracked:
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Loading
 * - LCP (Largest Contentful Paint): Loading
 * - TTFB (Time to First Byte): Server responsiveness
 * - INP (Interaction to Next Paint): Responsiveness (replaces deprecated FID)
 *
 * Note: FID (First Input Delay) was deprecated in web-vitals v4+ in favor of INP
 */

import { onCLS, onFCP, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';
// Note: FID is deprecated in web-vitals v4+ in favor of INP

export interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
  navigationType: string;
}

/**
 * Analytics service interface for reporting Web Vitals
 */
interface AnalyticsService {
  trackEvent: (eventName: string, properties: Record<string, unknown>) => void;
}

/**
 * Simple in-memory analytics service for development
 * Replace with your actual analytics service (Google Analytics, Amplitude, etc.)
 */
class InMemoryAnalyticsService implements AnalyticsService {
  private events: Array<{ event: string; properties: Record<string, unknown>; timestamp: number }> = [];

  trackEvent(eventName: string, properties: Record<string, unknown>): void {
    const event = {
      event: eventName,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Web Vitals]', eventName, properties);
    }

    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events.shift();
    }
  }

  getEvents(): Array<{ event: string; properties: Record<string, unknown>; timestamp: number }> {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}

// Singleton analytics service
const analyticsService = new InMemoryAnalyticsService();

/**
 * Rating thresholds for Web Vitals metrics
 * Based on Chrome User Experience Report (CrUX) data
 * Note: FID removed in favor of INP (web-vitals v4+)
 */
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

/**
 * Determine rating based on metric value and thresholds
 */
function getRating(metricName: keyof typeof THRESHOLDS, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metricName];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric data to analytics service
 * Handles errors gracefully to prevent blocking
 */
function sendToAnalytics(metric: Metric): void {
  try {
    const webVitalsMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      rating: getRating(metric.name as keyof typeof THRESHOLDS, metric.value),
      delta: metric.delta,
      id: metric.id,
      navigationType: metric.navigationType,
    };

    // Send to analytics service
    analyticsService.trackEvent('web_vitals', {
      metric_name: webVitalsMetric.name,
      metric_value: webVitalsMetric.value,
      metric_rating: webVitalsMetric.rating,
      metric_delta: webVitalsMetric.delta,
      metric_id: webVitalsMetric.id,
      navigation_type: webVitalsMetric.navigationType,
      user_agent: navigator.userAgent,
      page_url: window.location.href,
      page_path: window.location.pathname,
    });

    // Log warning if metric is poor
    if (webVitalsMetric.rating === 'poor') {
      console.warn(
        `[Web Vitals] Poor ${webVitalsMetric.name}: ${webVitalsMetric.value.toFixed(2)}ms`,
        webVitalsMetric
      );
    }
  } catch (error) {
    // Silently fail to prevent blocking user experience
    if (import.meta.env.DEV) {
      console.error('[Web Vitals] Failed to send metric to analytics:', error);
    }
  }
}

/**
 * Initialize Web Vitals monitoring
 * Call this once when your application starts
 */
export function reportWebVitals(): void {
  try {
    // Cumulative Layout Shift (CLS)
    // Measures visual stability - good: < 0.1
    onCLS(sendToAnalytics);

    // First Contentful Paint (FCP)
    // Measures loading - good: < 1.8s
    onFCP(sendToAnalytics);

    // Largest Contentful Paint (LCP)
    // Measures loading - good: < 2.5s
    onLCP(sendToAnalytics);

    // Time to First Byte (TTFB)
    // Measures server responsiveness - good: < 800ms
    onTTFB(sendToAnalytics);

    // Interaction to Next Paint (INP)
    // Measures responsiveness - good: < 200ms
    // Note: INP replaces FID in web-vitals v4+
    onINP(sendToAnalytics);

    if (import.meta.env.DEV) {
      console.log('[Web Vitals] Monitoring initialized');
    }
  } catch (error) {
    // Silently fail if Web Vitals API is not available
    if (import.meta.env.DEV) {
      console.error('[Web Vitals] Failed to initialize monitoring:', error);
    }
  }
}

/**
 * Get all recorded Web Vitals events (for debugging)
 */
export function getWebVitalsEvents() {
  return analyticsService.getEvents();
}

/**
 * Clear all recorded Web Vitals events (for debugging)
 */
export function clearWebVitalsEvents() {
  analyticsService.clear();
}

/**
 * Export analytics service for custom integration
 */
export { analyticsService };

/**
 * Custom hook for React components to access Web Vitals data
 */
export function useWebVitals() {
  return {
    getEvents: getWebVitalsEvents,
    clearEvents: clearWebVitalsEvents,
  };
}
