import axios from 'axios';
import { getAuthToken } from '../utils/auth';
import type { QueueItem, QueueFilter, QueueMetrics } from '../types/queue';
import type { CoreConfig, IntegrationConfig, PerformanceConfig } from '../types/config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  config => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      if (status === 401) {
        // Handle unauthorized - clear auth and redirect
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        // Forbidden - insufficient permissions
        throw new Error('Access forbidden: You do not have permission to perform this action');
      } else if (status >= 500) {
        throw new Error(`Server error: ${error.response.data?.message || 'Internal server error'}`);
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error('Network error: Unable to connect to server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(`Request error: ${error.message}`);
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const apiService = {
  // Queue management endpoints
  queue: {
    getItems: (filters: QueueFilter) =>
      api.get<QueueItem[]>('/api/admin/queue/list', { params: filters }),
    updateStatus: (id: string, status: QueueItem['status']) =>
      api.put(`/api/admin/queue/${id}/status`, { status }),
    addCustomer: (data: Partial<QueueItem>) =>
      api.post('/api/admin/queue/add', data),
    getMetrics: () =>
      api.get<QueueMetrics>('/api/admin/metrics/queue'),
  },

  // KumoMTA-specific endpoints
  kumomta: {
    // Get server metrics
    getMetrics: () =>
      api.get('/api/admin/metrics/v1'),

    // Get bounce classifications
    getBounces: () =>
      api.get('/api/admin/bounce/v1'),

    // Get scheduled queue details
    getScheduledQueue: (domain?: string) =>
      api.get('/api/admin/bounce-list/v1', { params: { domain } }),

    // Suspend/Resume queues
    suspendQueue: (domain: string, reason: string, duration?: number) =>
      api.post('/api/admin/suspend/v1', { domain, reason, duration }),

    resumeQueue: (domain: string) =>
      api.post('/api/admin/resume/v1', { domain }),

    // Suspend/Resume ready queue
    suspendReadyQueue: (domain: string, reason: string) =>
      api.post('/api/admin/suspend-ready-q/v1', { domain, reason }),

    // Rebind messages
    rebindMessages: (data: { campaign?: string; tenant?: string; domain?: string; routing_domain?: string }) =>
      api.post('/api/admin/rebind/v1', data),

    // Bounce messages
    bounceMessages: (data: { campaign?: string; tenant?: string; domain?: string; reason: string }) =>
      api.post('/api/admin/bounce/v1', data),

    // Get trace logs
    getTraceLogs: () =>
      api.get('/api/admin/trace-smtp-server/v1'),

    // Set diagnostic logging
    setDiagnosticLog: (filter: string, duration?: number) =>
      api.post('/api/admin/set-diagnostic-log-filter/v1', { filter, duration }),
  },

  // Configuration endpoints
  config: {
    updateCore: (config: CoreConfig) =>
      api.put('/api/admin/config/core', config),
    updateIntegration: (config: IntegrationConfig) =>
      api.put('/api/admin/config/integration', config),
    updatePerformance: (config: PerformanceConfig) =>
      api.put('/api/admin/config/performance', config),

    // Get current configuration
    getCore: () =>
      api.get<CoreConfig>('/api/admin/config/core'),
    getIntegration: () =>
      api.get<IntegrationConfig>('/api/admin/config/integration'),
    getPerformance: () =>
      api.get<PerformanceConfig>('/api/admin/config/performance'),
  }
};