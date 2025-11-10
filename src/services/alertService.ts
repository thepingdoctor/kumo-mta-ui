/**
 * Alert Service - API Client for Alert Management
 * Handles all HTTP requests for alerts, rules, and notification channels
 */

import axios, { AxiosInstance } from 'axios';
import type {
  Alert,
  AlertRule,
  AlertStats,
  AlertTestResult,
  NotificationChannel,
  AlertRuleFormData,
  NotificationChannelFormData,
} from '../types/alert';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class AlertService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== Alert Rules ====================

  async getAlertRules(filters?: {
    status?: string;
    severity?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ rules: AlertRule[]; total: number }> {
    const response = await this.client.get('/alerts/rules', { params: filters });
    return response.data;
  }

  async getAlertRule(id: string): Promise<AlertRule> {
    const response = await this.client.get(`/alerts/rules/${id}`);
    return response.data;
  }

  async createAlertRule(data: AlertRuleFormData): Promise<AlertRule> {
    const response = await this.client.post('/alerts/rules', data);
    return response.data;
  }

  async updateAlertRule(id: string, data: Partial<AlertRuleFormData>): Promise<AlertRule> {
    const response = await this.client.patch(`/alerts/rules/${id}`, data);
    return response.data;
  }

  async deleteAlertRule(id: string): Promise<void> {
    await this.client.delete(`/alerts/rules/${id}`);
  }

  async toggleAlertRule(id: string, enabled: boolean): Promise<AlertRule> {
    const response = await this.client.patch(`/alerts/rules/${id}/toggle`, { enabled });
    return response.data;
  }

  async testAlertRule(id: string): Promise<AlertTestResult> {
    const response = await this.client.post(`/alerts/rules/${id}/test`);
    return response.data;
  }

  async duplicateAlertRule(id: string): Promise<AlertRule> {
    const response = await this.client.post(`/alerts/rules/${id}/duplicate`);
    return response.data;
  }

  // ==================== Alerts (Instances) ====================

  async getAlerts(filters?: {
    status?: string;
    severity?: string;
    ruleId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: Alert[]; total: number }> {
    const response = await this.client.get('/alerts', { params: filters });
    return response.data;
  }

  async getAlert(id: string): Promise<Alert> {
    const response = await this.client.get(`/alerts/${id}`);
    return response.data;
  }

  async acknowledgeAlert(id: string, note?: string): Promise<Alert> {
    const response = await this.client.post(`/alerts/${id}/acknowledge`, { note });
    return response.data;
  }

  async snoozeAlert(id: string, duration: number): Promise<Alert> {
    const response = await this.client.post(`/alerts/${id}/snooze`, { duration });
    return response.data;
  }

  async resolveAlert(id: string, note?: string): Promise<Alert> {
    const response = await this.client.post(`/alerts/${id}/resolve`, { note });
    return response.data;
  }

  async dismissAlert(id: string): Promise<Alert> {
    const response = await this.client.post(`/alerts/${id}/dismiss`);
    return response.data;
  }

  async bulkUpdateAlerts(ids: string[], action: 'acknowledge' | 'snooze' | 'resolve' | 'dismiss', params?: Record<string, unknown>): Promise<void> {
    await this.client.post('/alerts/bulk', { ids, action, params });
  }

  // ==================== Notification Channels ====================

  async getNotificationChannels(filters?: {
    type?: string;
    enabled?: boolean;
  }): Promise<{ channels: NotificationChannel[]; total: number }> {
    const response = await this.client.get('/alerts/channels', { params: filters });
    return response.data;
  }

  async getNotificationChannel(id: string): Promise<NotificationChannel> {
    const response = await this.client.get(`/alerts/channels/${id}`);
    return response.data;
  }

  async createNotificationChannel(data: NotificationChannelFormData): Promise<NotificationChannel> {
    const response = await this.client.post('/alerts/channels', data);
    return response.data;
  }

  async updateNotificationChannel(id: string, data: Partial<NotificationChannelFormData>): Promise<NotificationChannel> {
    const response = await this.client.patch(`/alerts/channels/${id}`, data);
    return response.data;
  }

  async deleteNotificationChannel(id: string): Promise<void> {
    await this.client.delete(`/alerts/channels/${id}`);
  }

  async testNotificationChannel(id: string): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post(`/alerts/channels/${id}/test`);
    return response.data;
  }

  async toggleNotificationChannel(id: string, enabled: boolean): Promise<NotificationChannel> {
    const response = await this.client.patch(`/alerts/channels/${id}/toggle`, { enabled });
    return response.data;
  }

  // ==================== Statistics ====================

  async getAlertStats(timeRange?: '24h' | '7d' | '30d'): Promise<AlertStats> {
    const response = await this.client.get('/alerts/stats', { params: { timeRange } });
    return response.data;
  }

  async getAlertTrends(filters?: {
    metric?: string;
    groupBy?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<unknown[]> {
    const response = await this.client.get('/alerts/trends', { params: filters });
    return response.data;
  }

  // ==================== Utility Methods ====================

  async exportAlerts(filters?: Record<string, unknown>): Promise<Blob> {
    const response = await this.client.get('/alerts/export', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  }

  async importAlertRules(file: File): Promise<{ imported: number; errors: unknown[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await this.client.post('/alerts/rules/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}

export const alertService = new AlertService();
export default alertService;
