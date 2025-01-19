import axios from 'axios';
import { getAuthToken } from '../utils/auth';
import type { QueueItem, QueueFilter, QueueMetrics } from '../types/queue';
import type { CoreConfig, IntegrationConfig, PerformanceConfig } from '../types/config';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// API endpoints
export const apiService = {
  queue: {
    getItems: (filters: QueueFilter) => 
      api.get<QueueItem[]>('/queue', { params: filters }),
    updateStatus: (id: string, status: QueueItem['status']) =>
      api.put(`/queue/${id}/status`, { status }),
    addCustomer: (data: Partial<QueueItem>) =>
      api.post('/queue', data),
    getMetrics: () =>
      api.get<QueueMetrics>('/queue/metrics'),
  },
  config: {
    updateCore: (config: CoreConfig) =>
      api.put('/config/core', config),
    updateIntegration: (config: IntegrationConfig) =>
      api.put('/config/integration', config),
    updatePerformance: (config: PerformanceConfig) =>
      api.put('/config/performance', config),
  }
};