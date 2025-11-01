import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { QueueItem, QueueFilter, QueueMetrics } from '../types/queue';
import type { CoreConfig, IntegrationConfig, PerformanceConfig } from '../types/config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable CSRF protection
});

// Add auth token to requests - HTTP Basic Auth for KumoMTA compatibility
api.interceptors.request.use(
  config => {
    const authState = useAuthStore.getState();
    const token = authState.token;

    if (token) {
      // KumoMTA expects HTTP Basic Auth, not Bearer token
      // Format: username:password encoded in base64
      config.headers.Authorization = `Basic ${token}`;
    }

    // Add CSRF token if available
    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
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
  // Queue management endpoints (CUSTOM - not native KumoMTA endpoints)
  // These require middleware implementation
  queue: {
    getItems: (filters: QueueFilter) =>
      api.get<QueueItem[]>('/api/admin/queue/list', { params: filters }),
    updateStatus: (id: string, status: QueueItem['status']) =>
      api.put(`/api/admin/queue/${id}/status`, { status }),
    addCustomer: (data: Partial<QueueItem>) =>
      api.post('/api/admin/queue/add', data),
    // NOTE: Standardized to use KumoMTA's native /metrics.json endpoint
    getMetrics: () =>
      api.get<QueueMetrics>('/metrics.json'),
  },

  // KumoMTA-specific endpoints (VERIFIED - native KumoMTA API)
  kumomta: {
    // Get server metrics - KumoMTA uses /metrics.json (Prometheus format)
    // ✅ VERIFIED: Native KumoMTA endpoint
    getMetrics: () =>
      api.get('/metrics.json'),

    // ✅ VERIFIED: Get bounce classifications
    getBounces: () =>
      api.get('/api/admin/bounce/v1'),

    // ✅ VERIFIED: Get scheduled queue details
    getScheduledQueue: (domain?: string) =>
      api.get('/api/admin/bounce-list/v1', { params: { domain } }),

    // ✅ VERIFIED: Suspend queue
    suspendQueue: (domain: string, reason: string, duration?: number) =>
      api.post('/api/admin/suspend/v1', { domain, reason, duration }),

    // ✅ VERIFIED: Resume queue
    resumeQueue: (domain: string) =>
      api.post('/api/admin/resume/v1', { domain }),

    // ✅ VERIFIED: Suspend ready queue
    suspendReadyQueue: (domain: string, reason: string) =>
      api.post('/api/admin/suspend-ready-q/v1', { domain, reason }),

    // ✅ VERIFIED: Rebind messages
    rebindMessages: (data: { campaign?: string; tenant?: string; domain?: string; routing_domain?: string }) =>
      api.post('/api/admin/rebind/v1', data),

    // ✅ VERIFIED: Bounce messages
    bounceMessages: (data: { campaign?: string; tenant?: string; domain?: string; reason: string }) =>
      api.post('/api/admin/bounce/v1', data),

    // ✅ VERIFIED: Get SMTP trace logs
    getTraceLogs: () =>
      api.get('/api/admin/trace-smtp-server/v1'),

    // ✅ VERIFIED: Set diagnostic log filter
    setDiagnosticLog: (filter: string, duration?: number) =>
      api.post('/api/admin/set-diagnostic-log-filter/v1', { filter, duration }),
  },

  // Configuration endpoints (CUSTOM - requires middleware)
  // KumoMTA uses Lua-based configuration files, not REST API
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