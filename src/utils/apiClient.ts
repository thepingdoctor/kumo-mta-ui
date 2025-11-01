/**
 * Enhanced API client with offline support, request queuing, and intelligent caching
 *
 * @module apiClient
 *
 * @description
 * Axios-based HTTP client providing enterprise-grade features for the KumoMTA UI:
 * - HTTP Basic Authentication integration with localStorage token management
 * - Automatic offline detection and request queuing for mutations
 * - Intelligent GET request caching with 5-minute TTL
 * - Automatic 401 error handling with login redirect
 * - Request/response interceptors for auth injection and error handling
 * - Custom event dispatching for offline queue notifications
 *
 * @example
 * ```typescript
 * import { apiClient } from './utils/apiClient';
 *
 * // GET request with automatic caching
 * const data = await apiClient.get<User[]>('/users');
 *
 * // POST request with offline queue fallback
 * const result = await apiClient.post<CreateResponse>('/messages', {
 *   recipient: 'user@example.com',
 *   subject: 'Test'
 * });
 * ```
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { offlineStorage } from './offlineStorage';

/**
 * Base Axios instance with default configuration
 *
 * @constant
 * @type {AxiosInstance}
 *
 * @description
 * Configured with:
 * - Base URL from environment variable or '/api' fallback
 * - 30-second timeout for all requests
 * - JSON content type header by default
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor - HTTP Basic Authentication Token Injection
 *
 * @description
 * Automatically adds HTTP Basic Auth token to all outgoing requests by:
 * 1. Reading auth token from localStorage ('kumomta-auth-storage')
 * 2. Parsing Zustand store JSON structure
 * 3. Extracting token from state.token path
 * 4. Injecting as 'Authorization: Basic {token}' header
 *
 * This approach avoids circular dependencies with Zustand store by reading
 * localStorage directly instead of importing the store module.
 *
 * Authentication Flow:
 * - User logs in → Token stored in Zustand store → Persisted to localStorage
 * - Each request → Interceptor reads token → Adds to Authorization header
 * - KumoMTA validates HTTP Basic Auth → Returns authenticated response
 *
 * Error Handling:
 * - Silently ignores JSON parse errors (malformed localStorage data)
 * - Allows requests without token (for public endpoints like /login)
 *
 * @function
 * @param {InternalAxiosRequestConfig} config - Axios request configuration
 * @returns {InternalAxiosRequestConfig} Modified config with Authorization header
 *
 * @example
 * ```typescript
 * // localStorage content:
 * // { "state": { "token": "dXNlcjpwYXNzd29yZA==", "user": {...} } }
 *
 * // Interceptor automatically adds:
 * // headers: { Authorization: "Basic dXNlcjpwYXNzd29yZA==" }
 * ```
 */
api.interceptors.request.use(
  (config) => {
    // Get token from Zustand store (avoid circular dependency by importing lazily)
    const authStorage = localStorage.getItem('kumomta-auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed?.state?.token;
        if (token && config.headers) {
          // KumoMTA expects HTTP Basic Auth format
          config.headers.Authorization = `Basic ${token}`;
        }
      } catch (e) {
        // Ignore parse errors - allows requests to proceed without auth
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor - Offline Request Queuing and Error Handling
 *
 * @description
 * Comprehensive error handling and offline support with three main responsibilities:
 *
 * 1. **Offline Mutation Queuing** (POST/PUT/PATCH/DELETE):
 *    - Detects network errors via navigator.onLine or error.message
 *    - Queues mutation requests to offlineStorage for retry when online
 *    - Dispatches 'request-queued' custom event for UI notifications
 *    - Prevents data loss during temporary network outages
 *
 * 2. **Cached Data Fallback** (GET):
 *    - Returns cached data from offlineStorage if network unavailable
 *    - Provides seamless offline read experience
 *    - Response marked with 'OK (Cached)' status text
 *    - 5-minute cache TTL (set during successful GET responses)
 *
 * 3. **Authentication Error Handling** (401):
 *    - Clears invalid auth token from localStorage
 *    - Redirects to /login for re-authentication
 *    - Prevents cascade of failed authenticated requests
 *
 * @function
 * @param {AxiosResponse} response - Successful response (passed through unchanged)
 * @param {AxiosError} error - Failed request error
 * @returns {Promise<AxiosResponse>} Successful response or cached fallback
 * @throws {AxiosError} Re-throws error if not handled by offline/auth logic
 *
 * @example
 * ```typescript
 * // Offline POST - queued for retry
 * try {
 *   await apiClient.post('/messages', data);
 * } catch (error) {
 *   // Error thrown, but request queued for retry
 *   // UI receives 'request-queued' event
 * }
 *
 * // Offline GET - returns cached data
 * const data = await apiClient.get('/metrics');
 * // Returns cached data with statusText: 'OK (Cached)'
 *
 * // 401 Error - auto redirect
 * await apiClient.get('/protected');
 * // Automatically redirects to /login
 * ```
 *
 * @remarks
 * Offline Detection Logic:
 * - Primary: navigator.onLine === false (browser offline detection)
 * - Fallback: error.message === 'Network Error' (Axios network errors)
 *
 * Mutation Queuing:
 * - Only queues state-changing operations (POST, PUT, PATCH, DELETE)
 * - GET requests use cache fallback instead of queuing
 * - Queue stored in IndexedDB via offlineStorage module
 *
 * Cache Strategy:
 * - Cache key format: 'api-cache:{url}'
 * - Stored in ANALYTICS IndexedDB table
 * - 5-minute TTL (300 seconds)
 */
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Check if it's a network error (offline) - supports both offline detection methods
    if (!navigator.onLine || error.message === 'Network Error') {
      const config = error.config as AxiosRequestConfig;

      // Only queue mutation requests (POST, PUT, DELETE, PATCH) - read operations use cache
      const mutationMethods = ['post', 'put', 'delete', 'patch'];
      if (config && config.method && mutationMethods.includes(config.method.toLowerCase())) {
        try {
          // Queue the request for later - will be retried when connection restored
          await offlineStorage.queueRequest({
            url: config.baseURL ? `${config.baseURL}${config.url}` : config.url || '',
            method: config.method.toUpperCase(),
            headers: (config.headers as Record<string, string>) || {},
            body: config.data ? JSON.stringify(config.data) : undefined,
          });

          // Notify user that request was queued - UI can show toast/banner
          const event = new CustomEvent('request-queued', {
            detail: {
              url: config.url,
              method: config.method,
            },
          });
          window.dispatchEvent(event);
        } catch (queueError) {
          console.error('Failed to queue offline request:', queueError);
        }
      }

      // Try to get cached data for GET requests - provides offline read capability
      if (config && config.method?.toLowerCase() === 'get' && config.url) {
        try {
          const cacheKey = `api-cache:${config.url}`;
          const cachedData = await offlineStorage.getItem('ANALYTICS', cacheKey);

          if (cachedData) {
            // Return cached response with special status text indicator
            return Promise.resolve({
              data: cachedData,
              status: 200,
              statusText: 'OK (Cached)',
              headers: {},
              config,
            } as AxiosResponse);
          }
        } catch (cacheError) {
          console.error('Failed to retrieve cached data:', cacheError);
        }
      }
    }

    // For 401 errors, redirect to login - handles session expiration
    if (error.response?.status === 401) {
      localStorage.removeItem('kumomta-auth-storage');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

/**
 * Cache successful GET responses for offline access
 *
 * @async
 * @function cacheResponse
 * @param {string} url - The request URL to use as cache key
 * @param {unknown} data - The response data to cache
 * @returns {Promise<void>} Resolves when caching is complete
 *
 * @description
 * Stores API response data in IndexedDB for offline fallback access.
 * Used exclusively for successful GET requests to enable read operations when offline.
 *
 * Cache Configuration:
 * - Storage: IndexedDB via offlineStorage module
 * - Table: ANALYTICS
 * - Key Format: 'api-cache:{url}'
 * - TTL: 5 minutes (300 seconds)
 * - Error Handling: Fails silently (logs to console)
 *
 * Cache Invalidation:
 * - Automatic expiration after 5 minutes
 * - Can be manually cleared via offlineStorage.clearExpired()
 * - Overwritten on subsequent successful requests to same URL
 *
 * @example
 * ```typescript
 * // After successful GET /api/metrics
 * await cacheResponse('/api/metrics', {
 *   delivered: 1000,
 *   bounced: 50,
 *   queued: 200
 * });
 *
 * // Cache stored as:
 * // Key: 'api-cache:/api/metrics'
 * // Value: { delivered: 1000, bounced: 50, queued: 200 }
 * // Expires: Date.now() + 300000 (5 minutes)
 * ```
 *
 * @remarks
 * - Only caches when navigator.onLine is true (online)
 * - Silently fails if IndexedDB unavailable (privacy mode, quota exceeded)
 * - Cache is shared across all tabs/windows of same origin
 * - Used by response interceptor for offline GET fallback
 */
const cacheResponse = async (url: string, data: unknown) => {
  try {
    const cacheKey = `api-cache:${url}`;
    await offlineStorage.setItem('ANALYTICS', cacheKey, data, 5); // 5 minute TTL
  } catch (error) {
    console.error('Failed to cache response:', error);
  }
};

/**
 * Enhanced API client with offline support and intelligent caching
 *
 * @namespace apiClient
 *
 * @description
 * Type-safe HTTP client wrapper providing:
 * - Automatic response caching for GET requests (5-minute TTL)
 * - Offline request queuing for mutations (POST, PUT, PATCH, DELETE)
 * - HTTP Basic Authentication via interceptors
 * - Generic TypeScript typing for response data
 * - Consistent error handling across all methods
 *
 * All methods automatically benefit from:
 * - Auth token injection (request interceptor)
 * - Offline detection and queuing (response interceptor)
 * - 401 auto-redirect to login
 * - 30-second timeout
 *
 * @example
 * ```typescript
 * import { apiClient } from './utils/apiClient';
 *
 * // Type-safe GET with caching
 * const users = await apiClient.get<User[]>('/users');
 *
 * // POST with offline queue fallback
 * const created = await apiClient.post<Message>('/messages', {
 *   recipient: 'user@example.com',
 *   subject: 'Test',
 *   body: 'Hello'
 * });
 *
 * // PUT with custom headers
 * const updated = await apiClient.put<Message>('/messages/123', data, {
 *   headers: { 'X-Custom': 'value' }
 * });
 * ```
 */
export const apiClient = {
  /**
   * Perform GET request with automatic response caching
   *
   * @async
   * @template T - Expected response data type (defaults to unknown)
   * @param {string} url - Request URL (relative to baseURL or absolute)
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration
   * @returns {Promise<T>} Parsed response data
   * @throws {AxiosError} On network errors, timeouts, or non-2xx status codes
   *
   * @description
   * Caching Behavior:
   * - Successful responses (2xx) are cached for 5 minutes when online
   * - Offline requests return cached data if available
   * - Cache key format: 'api-cache:{url}'
   * - Cache stored in IndexedDB ANALYTICS table
   *
   * Error Handling:
   * - Network errors: Returns cached data if available, otherwise throws
   * - 401 errors: Auto-redirects to /login
   * - Other errors: Throws AxiosError for handling by caller
   *
   * @example
   * ```typescript
   * // Simple GET
   * const metrics = await apiClient.get<Metrics>('/api/metrics');
   *
   * // GET with query params
   * const filtered = await apiClient.get<Message[]>('/api/messages', {
   *   params: { status: 'delivered', limit: 100 }
   * });
   *
   * // GET with custom headers
   * const data = await apiClient.get<Data>('/api/data', {
   *   headers: { 'X-Custom-Header': 'value' }
   * });
   * ```
   */
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.get<T>(url, config);
    // Cache response when online for offline fallback
    if (navigator.onLine) {
      await cacheResponse(url, response.data);
    }
    return response.data;
  },

  /**
   * Perform POST request with offline queuing
   *
   * @async
   * @template T - Expected response data type (defaults to unknown)
   * @param {string} url - Request URL (relative to baseURL or absolute)
   * @param {unknown} [data] - Request body data (auto-serialized to JSON)
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration
   * @returns {Promise<T>} Parsed response data
   * @throws {AxiosError} On network errors, timeouts, or non-2xx status codes
   *
   * @description
   * Offline Behavior:
   * - Network errors trigger automatic request queuing
   * - Queued requests are retried when connection restored
   * - 'request-queued' event dispatched for UI notifications
   *
   * Common Use Cases:
   * - Create new resources (messages, users, configs)
   * - Submit forms and data
   * - Trigger actions and operations
   *
   * @example
   * ```typescript
   * // Create new message
   * const message = await apiClient.post<Message>('/api/messages', {
   *   recipient: 'user@example.com',
   *   subject: 'Test',
   *   body: 'Hello world'
   * });
   *
   * // Submit form data
   * const result = await apiClient.post<Result>('/api/submit', formData);
   *
   * // Trigger action
   * await apiClient.post<void>('/api/queue/123/retry');
   * ```
   */
  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  /**
   * Perform PUT request with offline queuing
   *
   * @async
   * @template T - Expected response data type (defaults to unknown)
   * @param {string} url - Request URL (relative to baseURL or absolute)
   * @param {unknown} [data] - Request body data (auto-serialized to JSON)
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration
   * @returns {Promise<T>} Parsed response data
   * @throws {AxiosError} On network errors, timeouts, or non-2xx status codes
   *
   * @description
   * Offline Behavior:
   * - Network errors trigger automatic request queuing
   * - Queued requests are retried when connection restored
   * - 'request-queued' event dispatched for UI notifications
   *
   * Common Use Cases:
   * - Full resource replacement
   * - Update entire entities
   * - Idempotent updates
   *
   * @example
   * ```typescript
   * // Replace entire message
   * const updated = await apiClient.put<Message>('/api/messages/123', {
   *   recipient: 'new@example.com',
   *   subject: 'Updated',
   *   body: 'New content'
   * });
   *
   * // Update configuration
   * await apiClient.put<Config>('/api/config/smtp', newConfig);
   * ```
   */
  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },

  /**
   * Perform PATCH request with offline queuing
   *
   * @async
   * @template T - Expected response data type (defaults to unknown)
   * @param {string} url - Request URL (relative to baseURL or absolute)
   * @param {unknown} [data] - Partial update data (auto-serialized to JSON)
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration
   * @returns {Promise<T>} Parsed response data
   * @throws {AxiosError} On network errors, timeouts, or non-2xx status codes
   *
   * @description
   * Offline Behavior:
   * - Network errors trigger automatic request queuing
   * - Queued requests are retried when connection restored
   * - 'request-queued' event dispatched for UI notifications
   *
   * Common Use Cases:
   * - Partial resource updates (only changed fields)
   * - Status changes
   * - Incremental modifications
   *
   * @example
   * ```typescript
   * // Update message status only
   * await apiClient.patch<Message>('/api/queue/123', {
   *   status: 'cancelled'
   * });
   *
   * // Partial user update
   * const user = await apiClient.patch<User>('/api/users/456', {
   *   email: 'new@example.com'
   * });
   * ```
   */
  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  },

  /**
   * Perform DELETE request with offline queuing
   *
   * @async
   * @template T - Expected response data type (defaults to unknown, often void)
   * @param {string} url - Request URL (relative to baseURL or absolute)
   * @param {AxiosRequestConfig} [config] - Optional Axios request configuration
   * @returns {Promise<T>} Parsed response data (often empty for DELETE)
   * @throws {AxiosError} On network errors, timeouts, or non-2xx status codes
   *
   * @description
   * Offline Behavior:
   * - Network errors trigger automatic request queuing
   * - Queued requests are retried when connection restored
   * - 'request-queued' event dispatched for UI notifications
   *
   * Common Use Cases:
   * - Remove resources
   * - Cancel operations
   * - Clear data
   *
   * @example
   * ```typescript
   * // Delete message
   * await apiClient.delete<void>('/api/messages/123');
   *
   * // Cancel queued item
   * await apiClient.delete<void>('/api/queue/456');
   *
   * // Clear cache
   * const result = await apiClient.delete<ClearResult>('/api/cache');
   * ```
   */
  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.delete<T>(url, config);
    return response.data;
  },
};

export default api;
