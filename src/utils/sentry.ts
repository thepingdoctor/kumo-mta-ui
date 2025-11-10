import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry for production error tracking and performance monitoring
 *
 * Features:
 * - Error tracking with context
 * - Performance monitoring (10% sample rate)
 * - Session replay for debugging (100% on errors, 10% normal sessions)
 * - Release tracking for version management
 * - Sensitive data filtering
 */
export function initSentry() {
  // Only initialize in production to avoid development noise
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,

      // Performance Monitoring
      integrations: [
        // Browser performance tracing
        Sentry.browserTracingIntegration(),
        // Session replay for debugging
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],

      // Performance Monitoring - 10% sample rate
      // Captures performance traces for 10% of transactions to balance cost/visibility
      tracesSampleRate: 0.1,

      // Session Replay Configuration
      // 10% of normal sessions get replayed
      replaysSessionSampleRate: 0.1,
      // 100% of sessions with errors get replayed for debugging
      replaysOnErrorSampleRate: 1.0,

      // Release tracking for version correlation
      release: import.meta.env.VITE_APP_VERSION || 'unknown',

      // Filter sensitive data before sending to Sentry
      beforeSend(event) {
        // Remove sensitive data from errors
        if (event.request) {
          // Remove cookies and auth headers
          delete event.request.cookies;
          delete event.request.headers?.Authorization;
          delete event.request.headers?.authorization;
          delete event.request.headers?.Cookie;

          // Sanitize query parameters that might contain tokens
          if (event.request.query_string) {
            const queryString = typeof event.request.query_string === 'string'
              ? event.request.query_string
              : '';
            const sanitized = queryString
              .replace(/([?&])(token|key|password|secret)=[^&]*/gi, '$1$2=***REDACTED***');
            event.request.query_string = sanitized;
          }
        }

        // Remove potential PII from user context
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
        }

        return event;
      },

      // Ignore common non-actionable errors
      ignoreErrors: [
        // Browser extension errors
        'top.GLOBALS',
        'chrome-extension://',
        'moz-extension://',
        // Network errors that are expected
        'NetworkError',
        'Failed to fetch',
        'Network request failed',
        // User-initiated navigation
        'Navigation cancelled',
        'AbortError',
      ],

      // Deny URLs - don't track errors from these sources
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
        // Development tools
        /^webpack-internal:\/\//i,
      ],
    });
  }
}

/**
 * Error boundary component for React error handling
 * Automatically captures React component errors and sends to Sentry
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Manually capture an exception with additional context
 *
 * @param error - Error to capture
 * @param context - Additional context for debugging
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.PROD) {
    if (context) {
      Sentry.captureException(error, {
        contexts: { custom: context },
      });
    } else {
      Sentry.captureException(error);
    }
  } else {
    console.error('Error (dev):', error, context);
  }
}

/**
 * Manually capture a message with severity level
 *
 * @param message - Message to capture
 * @param level - Severity level
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}] ${message}`);
  }
}

/**
 * Set user context for error tracking
 *
 * @param user - User information (should not include PII)
 */
export function setUser(user: { id: string; username?: string }) {
  if (import.meta.env.PROD) {
    Sentry.setUser(user);
  }
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUser() {
  if (import.meta.env.PROD) {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging context
 *
 * @param message - Breadcrumb message
 * @param category - Category for filtering
 * @param level - Severity level
 */
export function addBreadcrumb(
  message: string,
  category: string = 'custom',
  level: Sentry.SeverityLevel = 'info'
) {
  if (import.meta.env.PROD) {
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      timestamp: Date.now() / 1000,
    });
  }
}

/**
 * Set custom tag for filtering and grouping
 *
 * @param key - Tag key
 * @param value - Tag value
 */
export function setTag(key: string, value: string) {
  if (import.meta.env.PROD) {
    Sentry.setTag(key, value);
  }
}

/**
 * Set custom context for additional debugging information
 *
 * @param name - Context name
 * @param context - Context data
 */
export function setContext(name: string, context: Record<string, unknown>) {
  if (import.meta.env.PROD) {
    Sentry.setContext(name, context);
  }
}
