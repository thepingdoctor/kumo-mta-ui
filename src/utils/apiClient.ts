/**
 * Enhanced API client with offline support
 */

import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { offlineStorage } from './offlineStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token (HTTP Basic Auth for KumoMTA)
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
        // Ignore parse errors
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle offline and queue failed requests
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Check if it's a network error (offline)
    if (!navigator.onLine || error.message === 'Network Error') {
      const config = error.config as AxiosRequestConfig;

      // Only queue mutation requests (POST, PUT, DELETE, PATCH)
      const mutationMethods = ['post', 'put', 'delete', 'patch'];
      if (config && config.method && mutationMethods.includes(config.method.toLowerCase())) {
        try {
          // Queue the request for later
          await offlineStorage.queueRequest({
            url: config.baseURL ? `${config.baseURL}${config.url}` : config.url || '',
            method: config.method.toUpperCase(),
            headers: (config.headers as Record<string, string>) || {},
            body: config.data ? JSON.stringify(config.data) : undefined,
          });

          // Notify user that request was queued
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

      // Try to get cached data for GET requests
      if (config && config.method?.toLowerCase() === 'get' && config.url) {
        try {
          const cacheKey = `api-cache:${config.url}`;
          const cachedData = await offlineStorage.getItem('ANALYTICS', cacheKey);

          if (cachedData) {
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

    // For 401 errors, redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('kumomta-auth-storage');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Helper function to cache successful GET responses
const cacheResponse = async (url: string, data: unknown) => {
  try {
    const cacheKey = `api-cache:${url}`;
    await offlineStorage.setItem('ANALYTICS', cacheKey, data, 5); // 5 minute TTL
  } catch (error) {
    console.error('Failed to cache response:', error);
  }
};

// Enhanced API methods with caching
export const apiClient = {
  async get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.get<T>(url, config);
    if (navigator.onLine) {
      await cacheResponse(url, response.data);
    }
    return response.data;
  },

  async post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  async put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.put<T>(url, data, config);
    return response.data;
  },

  async patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.patch<T>(url, data, config);
    return response.data;
  },

  async delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await api.delete<T>(url, config);
    return response.data;
  },
};

export default api;
