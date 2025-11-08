import { captureException, captureMessage, addBreadcrumb } from './sentry';
import * as Sentry from '@sentry/react';

/**
 * Centralized logger utility that wraps Sentry and console
 *
 * Purpose:
 * - Standardize logging across the application
 * - Environment-aware logging (production vs development)
 * - Automatic integration with Sentry error tracking
 * - Structured logging with context
 * - Type-safe logging interfaces
 *
 * Usage:
 * ```typescript
 * import { logger } from '@/utils/logger';
 *
 * logger.error('Failed to fetch data', { userId: 123, endpoint: '/api/data' });
 * logger.warn('Slow API response', { duration: 5000 });
 * logger.info('User logged in', { username: 'john' });
 * logger.debug('Cache hit', { key: 'user-123' });
 * ```
 */

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  /**
   * Log error messages - captured by Sentry in production
   * @param message - Error message
   * @param context - Additional context for debugging
   * @param error - Optional Error object
   */
  error(message: string, context?: LogContext, error?: Error): void;

  /**
   * Log warning messages - captured by Sentry in production
   * @param message - Warning message
   * @param context - Additional context
   */
  warn(message: string, context?: LogContext): void;

  /**
   * Log informational messages
   * @param message - Info message
   * @param context - Additional context
   */
  info(message: string, context?: LogContext): void;

  /**
   * Log debug messages - only in development
   * @param message - Debug message
   * @param context - Additional context
   */
  debug(message: string, context?: LogContext): void;

  /**
   * Add breadcrumb for debugging trail
   * @param message - Breadcrumb message
   * @param category - Category for filtering
   */
  breadcrumb(message: string, category?: string): void;
}

/**
 * Logger implementation
 */
class LoggerImpl implements Logger {
  private get isProd(): boolean {
    return import.meta.env.PROD;
  }

  private get isDev(): boolean {
    return import.meta.env.DEV;
  }

  error(message: string, context?: LogContext, error?: Error): void {
    if (this.isProd) {
      // In production, send to Sentry
      if (error) {
        captureException(error, context);
      } else {
        captureMessage(message, 'error');
        if (context) {
          addBreadcrumb(JSON.stringify(context), 'error', 'error');
        }
      }
    } else {
      // In development, use console
      if (error) {
        console.error(`[ERROR] ${message}`, error, context);
      } else {
        console.error(`[ERROR] ${message}`, context);
      }
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isProd) {
      captureMessage(message, 'warning');
      if (context) {
        addBreadcrumb(JSON.stringify(context), 'warning', 'warning');
      }
    } else {
      console.warn(`[WARN] ${message}`, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isProd) {
      captureMessage(message, 'info');
      if (context) {
        addBreadcrumb(JSON.stringify(context), 'info', 'info');
      }
    } else {
      console.info(`[INFO] ${message}`, context);
    }
  }

  debug(message: string, context?: LogContext): void {
    // Debug logs only in development
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, context);
    }
  }

  breadcrumb(message: string, category: string = 'custom'): void {
    addBreadcrumb(message, category);
  }
}

/**
 * Singleton logger instance - created before other utilities that use it
 */
const loggerInstance: Logger = new LoggerImpl();
export const logger: Logger = loggerInstance;

/**
 * Performance logger for tracking operations
 */
export class PerformanceLogger {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = performance.now();
    loggerInstance.debug(`Starting: ${operation}`);
  }

  /**
   * End the performance measurement and log duration
   * @param context - Additional context
   */
  end(context?: LogContext): void {
    const duration = performance.now() - this.startTime;
    loggerInstance.debug(`Completed: ${this.operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...context,
    });

    // Log slow operations as warnings
    if (duration > 1000) {
      loggerInstance.warn(`Slow operation: ${this.operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        ...context,
      });
    }
  }
}

/**
 * API logger for tracking API calls
 */
export const apiLogger = {
  /**
   * Log API request
   * @param method - HTTP method
   * @param url - Request URL
   * @param context - Additional context
   */
  request(method: string, url: string, context?: LogContext): void {
    loggerInstance.debug(`API ${method} ${url}`, context);
    addBreadcrumb(`${method} ${url}`, 'api.request');
  },

  /**
   * Log API response
   * @param method - HTTP method
   * @param url - Request URL
   * @param status - HTTP status code
   * @param context - Additional context
   */
  response(method: string, url: string, status: number, context?: LogContext): void {
    const level = status >= 400 ? 'warning' : 'debug';
    const logFn = status >= 400 ? loggerInstance.warn.bind(loggerInstance) : loggerInstance.debug.bind(loggerInstance);

    logFn(`API ${method} ${url} - ${status}`, context);
    addBreadcrumb(`${method} ${url} - ${status}`, 'api.response', level as Sentry.SeverityLevel);
  },

  /**
   * Log API error
   * @param method - HTTP method
   * @param url - Request URL
   * @param error - Error object
   * @param context - Additional context
   */
  error(method: string, url: string, error: Error, context?: LogContext): void {
    loggerInstance.error(`API ${method} ${url} failed`, { ...context, url, method }, error);
  },
};

/**
 * WebSocket logger for tracking WebSocket events
 */
export const wsLogger = {
  /**
   * Log WebSocket connection
   * @param url - WebSocket URL
   */
  connect(url: string): void {
    loggerInstance.debug(`WebSocket connecting: ${url}`);
    addBreadcrumb(`Connecting to ${url}`, 'websocket');
  },

  /**
   * Log WebSocket disconnection
   * @param url - WebSocket URL
   * @param reason - Disconnection reason
   */
  disconnect(url: string, reason?: string): void {
    loggerInstance.debug(`WebSocket disconnected: ${url}`, { reason });
    addBreadcrumb(`Disconnected from ${url}`, 'websocket');
  },

  /**
   * Log WebSocket message
   * @param type - Message type
   * @param context - Additional context
   */
  message(type: string, context?: LogContext): void {
    loggerInstance.debug(`WebSocket message: ${type}`, context);
  },

  /**
   * Log WebSocket error
   * @param url - WebSocket URL
   * @param error - Error object
   */
  error(url: string, error: Error): void {
    loggerInstance.error(`WebSocket error: ${url}`, { url }, error);
  },
};

/**
 * Auth logger for tracking authentication events
 */
export const authLogger = {
  /**
   * Log login attempt
   * @param username - Username (not email for privacy)
   */
  login(username: string): void {
    loggerInstance.info('User login attempt', { username });
    addBreadcrumb(`Login: ${username}`, 'auth');
  },

  /**
   * Log successful login
   * @param username - Username
   */
  loginSuccess(username: string): void {
    loggerInstance.info('Login successful', { username });
    addBreadcrumb(`Login success: ${username}`, 'auth');
  },

  /**
   * Log failed login
   * @param username - Username
   * @param reason - Failure reason
   */
  loginFailure(username: string, reason: string): void {
    loggerInstance.warn('Login failed', { username, reason });
    addBreadcrumb(`Login failed: ${username} - ${reason}`, 'auth', 'warning');
  },

  /**
   * Log logout
   * @param username - Username
   */
  logout(username: string): void {
    loggerInstance.info('User logout', { username });
    addBreadcrumb(`Logout: ${username}`, 'auth');
  },

  /**
   * Log session expiry
   */
  sessionExpired(): void {
    loggerInstance.warn('Session expired');
    addBreadcrumb('Session expired', 'auth', 'warning');
  },
};

export default logger;
