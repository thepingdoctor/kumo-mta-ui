/**
 * Error Tracking and Logging System
 * Captures, categorizes, and reports errors
 */

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  context?: Record<string, unknown>;
  userAgent?: string;
  url?: string;
}

export type ErrorHandler = (error: ErrorLog) => void;

class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 100;
  private handlers: ErrorHandler[] = [];

  /**
   * Track an error
   */
  track(
    error: Error | string,
    severity: ErrorLog['severity'] = 'medium',
    context?: Record<string, unknown>
  ): void {
    const errorLog: ErrorLog = {
      id: this.generateId(),
      message: error instanceof Error ? error.message : error,
      ...(error instanceof Error && error.stack && { stack: error.stack }),
      severity,
      timestamp: Date.now(),
      ...(context !== undefined && { context }),
      ...(typeof navigator !== 'undefined' && { userAgent: navigator.userAgent }),
      ...(typeof window !== 'undefined' && { url: window.location.href }),
    };

    this.errors.push(errorLog);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Notify handlers
    this.handlers.forEach(handler => handler(errorLog));

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[ErrorTracker] ${severity.toUpperCase()}:`, errorLog);
    }
  }

  /**
   * Track a critical error
   */
  trackCritical(error: Error | string, context?: Record<string, unknown>): void {
    this.track(error, 'critical', context);
  }

  /**
   * Track a high severity error
   */
  trackHigh(error: Error | string, context?: Record<string, unknown>): void {
    this.track(error, 'high', context);
  }

  /**
   * Track a medium severity error
   */
  trackMedium(error: Error | string, context?: Record<string, unknown>): void {
    this.track(error, 'medium', context);
  }

  /**
   * Track a low severity error
   */
  trackLow(error: Error | string, context?: Record<string, unknown>): void {
    this.track(error, 'low', context);
  }

  /**
   * Register an error handler
   */
  onError(handler: ErrorHandler): () => void {
    this.handlers.push(handler);

    // Return unsubscribe function
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  /**
   * Get all errors
   */
  getErrors(severity?: ErrorLog['severity']): ErrorLog[] {
    if (!severity) return [...this.errors];
    return this.errors.filter(e => e.severity === severity);
  }

  /**
   * Get error statistics
   */
  getStats() {
    const total = this.errors.length;
    const critical = this.errors.filter(e => e.severity === 'critical').length;
    const high = this.errors.filter(e => e.severity === 'high').length;
    const medium = this.errors.filter(e => e.severity === 'medium').length;
    const low = this.errors.filter(e => e.severity === 'low').length;

    return {
      total,
      critical,
      high,
      medium,
      low,
      criticalRate: (critical / total) * 100 || 0,
      highRate: (high / total) * 100 || 0,
    };
  }

  /**
   * Clear all errors
   */
  clear(): void {
    this.errors = [];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize global error handlers
   */
  initGlobalHandlers(): void {
    if (typeof window === 'undefined') return;

    // Handle unhandled errors
    window.addEventListener('error', (event) => {
      this.track(event.error || event.message, 'high', {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.track(
        event.reason instanceof Error ? event.reason : String(event.reason),
        'high',
        {
          type: 'unhandled_rejection',
        }
      );
    });

    // Handle React errors (if error boundary doesn't catch them)
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      if (errorMessage.includes('React')) {
        this.track(errorMessage, 'medium', {
          type: 'react_error',
          args,
        });
      }
      originalConsoleError.apply(console, args);
    };
  }
}

// Singleton instance
export const errorTracker = new ErrorTracker();

// Auto-initialize global handlers
if (typeof window !== 'undefined') {
  errorTracker.initGlobalHandlers();
}

// Export convenience function for React components
export const useErrorTracker = () => errorTracker;
