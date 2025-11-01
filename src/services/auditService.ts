/**
 * Audit Service for KumoMTA UI Dashboard
 * Handles audit log creation, retrieval, and export functionality
 */

import axios from 'axios';
import type {
  AuditEvent,
  AuditLogFilter,
  AuditLogExportOptions,
  AuditLogStats,
  AuditRetentionPolicy,
  AuditEventCategory,
  AuditAction,
  AuditSeverity,
  AuditEventDetails,
} from '../types/audit';

// Export axios instance for testing
export const auditApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth interceptor - use Zustand store for consistency
auditApi.interceptors.request.use(
  config => {
    // Get token from Zustand persisted storage
    const authStorage = localStorage.getItem('kumomta-auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed?.state?.token;
        if (token) {
          config.headers.Authorization = `Basic ${token}`;
        }
      } catch (e) {
        // Ignore parse errors
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

export const auditService = {
  /**
   * Log a new audit event
   */
  async logEvent(
    category: AuditEventCategory,
    action: AuditAction,
    severity: AuditSeverity,
    details: AuditEventDetails,
    options?: {
      resourceType?: string;
      resourceId?: string;
      resourceName?: string;
      success?: boolean;
      errorMessage?: string;
    }
  ): Promise<AuditEvent> {
    try {
      const event: Partial<AuditEvent> = {
        timestamp: new Date().toISOString(),
        category,
        action,
        severity,
        details: {
          ...details,
          ipAddress: await this.getClientIp(),
          userAgent: navigator.userAgent,
        },
        success: options?.success ?? true,
        errorMessage: options?.errorMessage,
        resourceType: options?.resourceType,
        resourceId: options?.resourceId,
        resourceName: options?.resourceName,
        sessionId: this.getSessionId(),
      };

      const response = await auditApi.post<AuditEvent>('/api/admin/audit/log', event);
      return response.data;
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Store locally if API fails
      this.storeLocalAuditEvent(category, action, severity, details);
      throw error;
    }
  },

  /**
   * Retrieve audit logs with filtering
   */
  async getAuditLogs(filters: AuditLogFilter = {}): Promise<{
    events: AuditEvent[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    try {
      const response = await auditApi.get('/api/admin/audit/logs', {
        params: {
          ...filters,
          startDate: filters.startDate ? new Date(filters.startDate).toISOString() : undefined,
          endDate: filters.endDate ? new Date(filters.endDate).toISOString() : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      throw error;
    }
  },

  /**
   * Get audit log statistics
   */
  async getAuditStats(filters?: AuditLogFilter): Promise<AuditLogStats> {
    try {
      const response = await auditApi.get<AuditLogStats>('/api/admin/audit/stats', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to retrieve audit stats:', error);
      throw error;
    }
  },

  /**
   * Export audit logs
   */
  async exportAuditLog(options: AuditLogExportOptions): Promise<Blob> {
    try {
      const response = await auditApi.post('/api/admin/audit/export', options, {
        responseType: 'blob',
      });

      return response.data;
    } catch (error) {
      console.error('Failed to export audit log:', error);
      throw error;
    }
  },

  /**
   * Download exported audit log
   */
  async downloadExport(blob: Blob, filename: string): Promise<void> {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Get retention policy
   */
  async getRetentionPolicy(): Promise<AuditRetentionPolicy> {
    try {
      const response = await auditApi.get<AuditRetentionPolicy>('/api/admin/audit/retention-policy');
      return response.data;
    } catch (error) {
      console.error('Failed to get retention policy:', error);
      throw error;
    }
  },

  /**
   * Update retention policy
   */
  async updateRetentionPolicy(policy: AuditRetentionPolicy): Promise<AuditRetentionPolicy> {
    try {
      const response = await auditApi.put<AuditRetentionPolicy>(
        '/api/admin/audit/retention-policy',
        policy
      );
      return response.data;
    } catch (error) {
      console.error('Failed to update retention policy:', error);
      throw error;
    }
  },

  /**
   * Search audit logs with advanced query
   */
  async searchAuditLogs(
    query: string,
    filters?: AuditLogFilter
  ): Promise<{ events: AuditEvent[]; total: number }> {
    try {
      const response = await auditApi.post('/api/admin/audit/search', {
        query,
        ...filters,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to search audit logs:', error);
      throw error;
    }
  },

  /**
   * Get audit event details by ID
   */
  async getEventById(eventId: string): Promise<AuditEvent> {
    try {
      const response = await auditApi.get<AuditEvent>(`/api/admin/audit/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get audit event:', error);
      throw error;
    }
  },

  /**
   * Helper: Get client IP address
   */
  async getClientIp(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  },

  /**
   * Helper: Get or create session ID
   */
  getSessionId(): string {
    let sessionId = sessionStorage.getItem('audit_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('audit_session_id', sessionId);
    }
    return sessionId;
  },

  /**
   * Helper: Store audit event locally if API fails
   */
  storeLocalAuditEvent(
    category: AuditEventCategory,
    action: AuditAction,
    severity: AuditSeverity,
    details: AuditEventDetails
  ): void {
    try {
      const localEvents = JSON.parse(localStorage.getItem('local_audit_events') || '[]');
      localEvents.push({
        timestamp: new Date().toISOString(),
        category,
        action,
        severity,
        details,
      });
      // Keep only last 100 events locally
      if (localEvents.length > 100) {
        localEvents.shift();
      }
      localStorage.setItem('local_audit_events', JSON.stringify(localEvents));
    } catch (error) {
      console.error('Failed to store local audit event:', error);
    }
  },

  /**
   * Helper: Sync local audit events to server
   */
  async syncLocalEvents(): Promise<void> {
    try {
      const localEvents = JSON.parse(localStorage.getItem('local_audit_events') || '[]');
      if (localEvents.length > 0) {
        await auditApi.post('/api/admin/audit/bulk-log', { events: localEvents });
        localStorage.removeItem('local_audit_events');
      }
    } catch (error) {
      console.error('Failed to sync local audit events:', error);
    }
  },
};
