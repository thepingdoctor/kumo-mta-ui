import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, PerformanceLogger, apiLogger, wsLogger, authLogger } from '../logger';
import * as sentry from '../sentry';

// Mock Sentry utilities
vi.mock('../sentry', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe('Logger Utility', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Spy on console methods
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe('logger.error', () => {
    it('should log error with message and context', () => {
      const message = 'Test error';
      const context = { userId: 123 };

      logger.error(message, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[ERROR] ${message}`,
        context
      );
    });

    it('should log error with Error object', () => {
      const message = 'Test error';
      const error = new Error('Actual error');
      const context = { endpoint: '/api/test' };

      logger.error(message, context, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[ERROR] ${message}`,
        error,
        context
      );
    });
  });

  describe('logger.warn', () => {
    it('should log warning with message and context', () => {
      const message = 'Test warning';
      const context = { duration: 5000 };

      logger.warn(message, context);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `[WARN] ${message}`,
        context
      );
    });
  });

  describe('logger.info', () => {
    it('should log info with message and context', () => {
      const message = 'Test info';
      const context = { action: 'login' };

      logger.info(message, context);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        `[INFO] ${message}`,
        context
      );
    });
  });

  describe('logger.debug', () => {
    it('should log debug message in development', () => {
      const message = 'Test debug';
      const context = { cacheKey: 'user-123' };

      logger.debug(message, context);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `[DEBUG] ${message}`,
        context
      );
    });
  });

  describe('logger.breadcrumb', () => {
    it('should add breadcrumb with default category', () => {
      const message = 'Test breadcrumb';

      logger.breadcrumb(message);

      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(message, 'custom');
    });

    it('should add breadcrumb with custom category', () => {
      const message = 'Test breadcrumb';
      const category = 'navigation';

      logger.breadcrumb(message, category);

      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(message, category);
    });
  });

  describe('PerformanceLogger', () => {
    it('should log operation start', () => {
      const operation = 'fetchData';

      new PerformanceLogger(operation);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `[DEBUG] Starting: ${operation}`,
        undefined
      );
    });

    it('should log operation completion with duration', () => {
      const operation = 'fetchData';
      const perfLogger = new PerformanceLogger(operation);

      // Wait a bit to ensure some time passes
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Wait ~10ms
      }

      perfLogger.end();

      // Should have called debug twice: start + completion
      expect(consoleDebugSpy).toHaveBeenCalledTimes(2);

      // Check that the second call includes "Completed"
      const completedCall = consoleDebugSpy.mock.calls.find(
        (call) => call[0].includes('Completed')
      );
      expect(completedCall).toBeDefined();
    });

    it('should warn on slow operations (>1000ms)', () => {
      vi.clearAllMocks(); // Clear previous debug calls

      const operation = 'slowOperation';

      // Mock performance.now before creating PerformanceLogger
      let callCount = 0;
      const nowSpy = vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 1500; // 1500ms duration
      });

      const perfLogger = new PerformanceLogger(operation);
      perfLogger.end();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `[WARN] Slow operation: ${operation}`,
        expect.objectContaining({
          duration: expect.stringContaining('ms'),
        })
      );

      // Restore
      nowSpy.mockRestore();
    });
  });

  describe('apiLogger', () => {
    it('should log API request', () => {
      const method = 'GET';
      const url = '/api/users';
      const context = { params: { id: 123 } };

      apiLogger.request(method, url, context);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `[DEBUG] API ${method} ${url}`,
        context
      );
      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
        `${method} ${url}`,
        'api.request'
      );
    });

    it('should log successful API response', () => {
      const method = 'POST';
      const url = '/api/users';
      const status = 201;

      apiLogger.response(method, url, status);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `[DEBUG] API ${method} ${url} - ${status}`,
        undefined
      );
    });

    it('should warn on error status code', () => {
      const method = 'DELETE';
      const url = '/api/users/123';
      const status = 404;

      apiLogger.response(method, url, status);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        `[WARN] API ${method} ${url} - ${status}`,
        undefined
      );
    });

    it('should log API error', () => {
      const method = 'GET';
      const url = '/api/users';
      const error = new Error('Network error');
      const context = { timeout: true };

      apiLogger.error(method, url, error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        `[ERROR] API ${method} ${url} failed`,
        error,
        expect.objectContaining({ url, method, ...context })
      );
    });
  });

  describe('wsLogger', () => {
    it('should log WebSocket connection', () => {
      const url = 'ws://localhost:8080';

      wsLogger.connect(url);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `[DEBUG] WebSocket connecting: ${url}`,
        undefined
      );
      expect(sentry.addBreadcrumb).toHaveBeenCalledWith(
        `Connecting to ${url}`,
        'websocket'
      );
    });

    it('should log WebSocket disconnection', () => {
      const url = 'ws://localhost:8080';
      const reason = 'Connection closed by server';

      wsLogger.disconnect(url, reason);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `[DEBUG] WebSocket disconnected: ${url}`,
        { reason }
      );
    });

    it('should log WebSocket message', () => {
      const type = 'metrics';
      const context = { queueId: 'default' };

      wsLogger.message(type, context);

      expect(consoleDebugSpy).toHaveBeenCalledWith(
        `[DEBUG] WebSocket message: ${type}`,
        context
      );
    });

    it('should log WebSocket error', () => {
      const url = 'ws://localhost:8080';
      const error = new Error('Connection failed');

      wsLogger.error(url, error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[ERROR] WebSocket error: ws://localhost:8080',
        error,
        expect.objectContaining({ url })
      );
    });
  });

  describe('authLogger', () => {
    it('should log login attempt', () => {
      const username = 'testuser';

      authLogger.login(username);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] User login attempt',
        { username }
      );
    });

    it('should log successful login', () => {
      const username = 'testuser';

      authLogger.loginSuccess(username);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] Login successful',
        { username }
      );
    });

    it('should log failed login', () => {
      const username = 'testuser';
      const reason = 'Invalid credentials';

      authLogger.loginFailure(username, reason);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Login failed',
        { username, reason }
      );
    });

    it('should log logout', () => {
      const username = 'testuser';

      authLogger.logout(username);

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        '[INFO] User logout',
        { username }
      );
    });

    it('should log session expiry', () => {
      authLogger.sessionExpired();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[WARN] Session expired',
        undefined
      );
    });
  });
});
