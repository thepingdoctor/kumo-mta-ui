/**
 * Integration Tests for KumoMTA HTTP Basic Authentication Flow
 *
 * Tests the complete authentication workflow including:
 * - Login with HTTP Basic Auth token generation
 * - Token storage in Zustand
 * - Token injection in API requests
 * - Token validation and error handling
 * - Logout and token cleanup
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAuthStore } from '../../src/store/authStore';
import MockAdapter from 'axios-mock-adapter';
// Import the actual axios instances used by apiService and auditService
import { api } from '../../src/services/api';
import { auditApi } from '../../src/services/auditService';

describe('KumoMTA Authentication Flow Integration Tests', () => {
  let mockAxios: MockAdapter;
  let mockAuditAxios: MockAdapter;

  beforeEach(() => {
    // Clear auth store before each test
    useAuthStore.getState().logout();

    // Setup axios mocks on the ACTUAL axios instances
    // This ensures our mocks work with axios.create() instances
    mockAxios = new MockAdapter(api);
    mockAuditAxios = new MockAdapter(auditApi);
  });

  afterEach(() => {
    mockAxios.restore();
    mockAuditAxios.restore();
  });

  describe('HTTP Basic Auth Token Generation', () => {
    it('should generate correct base64 encoded token from credentials', () => {
      const email = 'admin@example.com';
      const password = 'secure_password_123';

      // Generate token using same method as LoginPage
      const token = btoa(`${email}:${password}`);

      // Verify token format
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Verify token can be decoded
      const decoded = atob(token);
      expect(decoded).toBe(`${email}:${password}`);
    });

    it('should generate different tokens for different credentials', () => {
      const token1 = btoa('user1@example.com:pass1');
      const token2 = btoa('user2@example.com:pass2');

      expect(token1).not.toBe(token2);
    });

    it('should handle special characters in password', () => {
      const email = 'admin@example.com';
      const password = 'p@$$w0rd!#$%^&*()';

      const token = btoa(`${email}:${password}`);
      const decoded = atob(token);

      expect(decoded).toBe(`${email}:${password}`);
    });
  });

  describe('Zustand Auth Store Integration', () => {
    it('should store token in Zustand on login', () => {
      const user = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin' as const,
      };
      const token = btoa('admin@example.com:password123');

      // Execute login
      useAuthStore.getState().login(user, token);

      // Verify state
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(user);
      expect(state.token).toBe(token);
    });

    it('should persist token to localStorage via Zustand middleware', () => {
      const user = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin' as const,
      };
      const token = btoa('admin@example.com:password123');

      useAuthStore.getState().login(user, token);

      // Check localStorage persistence
      const stored = localStorage.getItem('kumomta-auth-storage');
      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);
      expect(parsed.state.token).toBe(token);
      expect(parsed.state.isAuthenticated).toBe(true);
    });

    it('should clear token on logout', () => {
      // Setup authenticated state
      const user = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin' as const,
      };
      const token = btoa('admin@example.com:password123');
      useAuthStore.getState().login(user, token);

      // Execute logout
      useAuthStore.getState().logout();

      // Verify state cleared
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should allow token refresh without full login', () => {
      // Initial login
      const user = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin',
        role: 'admin' as const,
      };
      const oldToken = btoa('admin@example.com:oldpassword');
      useAuthStore.getState().login(user, oldToken);

      // Refresh token
      const newToken = btoa('admin@example.com:newpassword');
      useAuthStore.getState().refreshToken(newToken);

      // Verify token updated but user intact
      const state = useAuthStore.getState();
      expect(state.token).toBe(newToken);
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('API Request Authorization Header', () => {
    it('should inject Basic Auth header in API requests', async () => {
      const token = btoa('admin@example.com:password123');
      useAuthStore.getState().login(
        { id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
        token
      );

      // Mock API endpoint
      mockAxios.onGet('/metrics.json').reply((config) => {
        // Verify Authorization header
        expect(config.headers?.Authorization).toBe(`Basic ${token}`);
        return [200, { status: 'ok' }];
      });

      // Import API client that uses the interceptor
      const { apiService } = await import('../../src/services/api');

      // Make request
      await apiService.kumomta.getMetrics();

      // If no assertion error was thrown, header was correct
      expect(mockAxios.history.get.length).toBe(1);
    });

    it('should not include Authorization header when not authenticated', async () => {
      // Ensure logged out
      useAuthStore.getState().logout();

      mockAxios.onGet('/metrics.json').reply((config) => {
        expect(config.headers?.Authorization).toBeUndefined();
        return [200, { status: 'ok' }];
      });

      const { apiService } = await import('../../src/services/api');
      await apiService.kumomta.getMetrics();
    });

    it('should use correct Basic Auth format (not Bearer)', async () => {
      const token = btoa('admin@example.com:password123');
      useAuthStore.getState().login(
        { id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
        token
      );

      mockAxios.onGet('/metrics.json').reply((config) => {
        const authHeader = config.headers?.Authorization;

        // Verify it starts with "Basic " not "Bearer "
        expect(authHeader).toMatch(/^Basic /);
        expect(authHeader).not.toMatch(/^Bearer /);

        return [200, { status: 'ok' }];
      });

      const { apiService } = await import('../../src/services/api');
      await apiService.kumomta.getMetrics();
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle 401 Unauthorized and redirect to login', async () => {
      // First, login to set authenticated state
      const token = btoa('admin@example.com:wrongpassword');
      useAuthStore.getState().login(
        { id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
        token
      );

      // Verify we're authenticated before the test
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      // Mock window.location.href BEFORE making request
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: '' } as any;

      // Import apiService to get the axios instance with interceptors
      const { apiService } = await import('../../src/services/api');

      // Mock 401 response - do this AFTER import to ensure mock is on correct instance
      mockAxios.onGet('/metrics.json').reply(401, {
        error: 'Unauthorized',
      });

      // Make the request and catch the error
      let errorCaught = false;
      try {
        await apiService.kumomta.getMetrics();
      } catch (error: any) {
        errorCaught = true;
        // Verify it's a 401 error
        expect(error.response?.status).toBe(401);
      }

      // Verify request was made and failed
      expect(errorCaught).toBe(true);

      // Add small delay for interceptor to complete async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify logout was called and redirect happened
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(window.location.href).toBe('/login');

      // Restore original location
      window.location = originalLocation;
    });

    it('should handle 403 Forbidden with appropriate error', async () => {
      const token = btoa('viewer@example.com:password123');
      useAuthStore.getState().login(
        { id: '2', email: 'viewer@example.com', name: 'Viewer', role: 'viewer' },
        token
      );

      // Match the exact endpoint pattern that suspendQueue uses
      mockAxios.onPost('/api/admin/suspend/v1', {
        domain: 'example.com',
        reason: 'test',
        duration: 300
      }).reply(403, {
        error: 'Forbidden',
      });

      const { apiService } = await import('../../src/services/api');

      await expect(
        apiService.kumomta.suspendQueue('example.com', 'test', 300)
      ).rejects.toThrow(/Access forbidden/);
    });

    it('should handle network errors gracefully', async () => {
      const token = btoa('admin@example.com:password123');
      useAuthStore.getState().login(
        { id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
        token
      );

      // Use networkErrorOnce() instead of networkError()
      mockAxios.onGet('/metrics.json').networkErrorOnce();

      const { apiService } = await import('../../src/services/api');

      // MockAdapter networkErrorOnce() creates error.message = "Network Error"
      // which goes to the "else" block in api.ts interceptor
      await expect(
        apiService.kumomta.getMetrics()
      ).rejects.toThrow(/Request error.*Network Error/);
    });
  });

  describe('Multiple API Client Consistency', () => {
    it('should use same token source across all API clients', async () => {
      const token = btoa('admin@example.com:password123');
      useAuthStore.getState().login(
        { id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
        token
      );

      // Track authorization headers from different clients
      const authHeaders: string[] = [];

      // Mock endpoints used by different clients
      mockAxios.onGet('/metrics.json').reply((config) => {
        authHeaders.push(config.headers?.Authorization || '');
        return [200, {}];
      });

      mockAuditAxios.onPost('/api/admin/audit/log').reply((config) => {
        authHeaders.push(config.headers?.Authorization || '');
        return [200, { id: '1', timestamp: new Date().toISOString() }];
      });

      // Import different API clients
      const { apiService } = await import('../../src/services/api');
      const { auditService } = await import('../../src/services/auditService');

      // Make requests with different clients
      await apiService.kumomta.getMetrics();

      // auditService needs to fetch IP, mock that too
      global.fetch = vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ ip: '127.0.0.1' }),
        } as Response)
      );

      await auditService.logEvent('system', 'login', 'info', {
        message: 'Test login',
      });

      // Verify all use same token format
      expect(authHeaders).toHaveLength(2);
      expect(authHeaders[0]).toBe(`Basic ${token}`);
      expect(authHeaders[1]).toBe(`Basic ${token}`);
    });
  });

  describe('CSRF Token Integration', () => {
    it('should include CSRF token when available', async () => {
      const token = btoa('admin@example.com:password123');
      useAuthStore.getState().login(
        { id: '1', email: 'admin@example.com', name: 'Admin', role: 'admin' },
        token
      );

      // Create CSRF meta tag
      const meta = document.createElement('meta');
      meta.name = 'csrf-token';
      meta.content = 'test-csrf-token-123';
      document.head.appendChild(meta);

      mockAxios.onGet('/metrics.json').reply((config) => {
        expect(config.headers?.['X-CSRF-Token']).toBe('test-csrf-token-123');
        return [200, {}];
      });

      const { apiService } = await import('../../src/services/api');
      await apiService.kumomta.getMetrics();

      // Cleanup
      document.head.removeChild(meta);
    });
  });

  describe('Token Encoding Edge Cases', () => {
    it('should handle email addresses with special characters', () => {
      const email = 'user+test@example.com';
      const password = 'password123';
      const token = btoa(`${email}:${password}`);

      const decoded = atob(token);
      expect(decoded).toBe(`${email}:${password}`);
    });

    it('should handle passwords with colons', () => {
      const email = 'admin@example.com';
      const password = 'pass:word:123';
      const token = btoa(`${email}:${password}`);

      const decoded = atob(token);
      expect(decoded).toBe(`${email}:${password}`);
    });

    it('should handle Unicode characters in password', () => {
      const email = 'admin@example.com';
      const password = 'pâssw🔒rd';

      // btoa doesn't handle Unicode directly, but this tests the edge case
      expect(() => btoa(`${email}:${password}`)).toThrow();

      // Proper handling would use TextEncoder
      const encoder = new TextEncoder();
      const bytes = encoder.encode(`${email}:${password}`);
      expect(bytes.length).toBeGreaterThan(email.length + password.length);
    });
  });
});
