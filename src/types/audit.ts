/**
 * Audit Log Types for KumoMTA UI Dashboard
 * Comprehensive type definitions for security and compliance audit trail
 */

export enum AuditEventCategory {
  AUTH = 'AUTH',
  CONFIG = 'CONFIG',
  QUEUE = 'QUEUE',
  SECURITY = 'SECURITY',
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  API = 'API',
}

export enum AuditSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum AuditAction {
  // Authentication actions
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Configuration actions
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  CONFIG_VIEW = 'CONFIG_VIEW',
  CONFIG_EXPORT = 'CONFIG_EXPORT',
  CONFIG_IMPORT = 'CONFIG_IMPORT',

  // Queue actions
  QUEUE_SUSPEND = 'QUEUE_SUSPEND',
  QUEUE_RESUME = 'QUEUE_RESUME',
  MESSAGE_BOUNCE = 'MESSAGE_BOUNCE',
  MESSAGE_REBIND = 'MESSAGE_REBIND',
  QUEUE_PURGE = 'QUEUE_PURGE',

  // Security actions
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  ROLE_CHANGE = 'ROLE_CHANGE',
  SECURITY_SETTING_CHANGE = 'SECURITY_SETTING_CHANGE',
  API_KEY_CREATE = 'API_KEY_CREATE',
  API_KEY_REVOKE = 'API_KEY_REVOKE',

  // System actions
  SYSTEM_START = 'SYSTEM_START',
  SYSTEM_STOP = 'SYSTEM_STOP',
  BACKUP_CREATE = 'BACKUP_CREATE',
  BACKUP_RESTORE = 'BACKUP_RESTORE',

  // User management
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_DISABLE = 'USER_DISABLE',
  USER_ENABLE = 'USER_ENABLE',
}

export interface AuditEventDetails {
  [key: string]: unknown;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  duration?: number;
  affectedRecords?: number;
}

export interface AuditEvent {
  id: string;
  timestamp: Date | string;
  category: AuditEventCategory;
  action: AuditAction;
  severity: AuditSeverity;
  userId: string;
  username: string;
  userRole: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  details: AuditEventDetails;
  success: boolean;
  errorMessage?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
}

export interface AuditLogFilter {
  startDate?: Date | string;
  endDate?: Date | string;
  categories?: AuditEventCategory[];
  actions?: AuditAction[];
  severities?: AuditSeverity[];
  userIds?: string[];
  resourceTypes?: string[];
  resourceIds?: string[];
  success?: boolean;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'category' | 'action';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogExportOptions {
  format: 'csv' | 'json' | 'pdf';
  filters: AuditLogFilter;
  includeDetails?: boolean;
  filename?: string;
}

export interface AuditLogStats {
  totalEvents: number;
  eventsByCategory: Record<AuditEventCategory, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  failedEvents: number;
  uniqueUsers: number;
  dateRange: {
    start: Date | string;
    end: Date | string;
  };
}

export interface AuditRetentionPolicy {
  enabled: boolean;
  retentionDays: number;
  archiveEnabled: boolean;
  archiveLocation?: string;
  autoCleanup: boolean;
}

export interface AuditWebSocketMessage {
  type: 'new_event' | 'bulk_update' | 'stats_update';
  payload: AuditEvent | AuditEvent[] | AuditLogStats;
  timestamp: Date | string;
}
