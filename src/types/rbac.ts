/**
 * Enhanced RBAC Types
 *
 * Extended role-based access control with hierarchical permissions
 */

import { UserRole as BaseUserRole, Permission as BasePermission } from './roles';

/**
 * Extended user roles with super_admin
 */
export type UserRole = 'super_admin' | 'admin' | 'operator' | 'analyst' | 'viewer';

/**
 * Comprehensive permission set
 */
export enum Permission {
  // Queue Management
  QUEUE_VIEW = 'queue:view',
  QUEUE_SUSPEND = 'queue:suspend',
  QUEUE_BOUNCE = 'queue:bounce',
  QUEUE_REBIND = 'queue:rebind',
  QUEUE_DELETE = 'queue:delete',
  QUEUE_PURGE = 'queue:purge',

  // Configuration
  CONFIG_VIEW = 'config:view',
  CONFIG_EDIT = 'config:edit',
  CONFIG_DELETE = 'config:delete',
  CONFIG_IMPORT = 'config:import',
  CONFIG_EXPORT = 'config:export',

  // Metrics & Analytics
  METRICS_VIEW = 'metrics:view',
  METRICS_EXPORT = 'metrics:export',
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_ADVANCED = 'analytics:advanced',

  // User Management
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',
  USERS_ASSIGN_ROLES = 'users:assign_roles',

  // Template Management
  TEMPLATES_VIEW = 'templates:view',
  TEMPLATES_CREATE = 'templates:create',
  TEMPLATES_EDIT = 'templates:edit',
  TEMPLATES_DELETE = 'templates:delete',
  TEMPLATES_PUBLISH = 'templates:publish',
  TEMPLATES_VERSION = 'templates:version',

  // Alerts & Notifications
  ALERTS_VIEW = 'alerts:view',
  ALERTS_CONFIGURE = 'alerts:configure',
  ALERTS_DELETE = 'alerts:delete',

  // Audit & Security
  AUDIT_VIEW = 'audit:view',
  AUDIT_EXPORT = 'audit:export',
  SECURITY_MANAGE = 'security:manage',

  // System
  SYSTEM_HEALTH = 'system:health',
  SYSTEM_RESTART = 'system:restart',
  SYSTEM_SETTINGS = 'system:settings',

  // API Access
  API_READ = 'api:read',
  API_WRITE = 'api:write',
  API_ADMIN = 'api:admin',
}

/**
 * Permission metadata
 */
export interface PermissionMetadata {
  permission: Permission;
  label: string;
  description: string;
  category: PermissionCategory;
  risk: 'low' | 'medium' | 'high' | 'critical';
}

export type PermissionCategory =
  | 'queue'
  | 'config'
  | 'metrics'
  | 'users'
  | 'templates'
  | 'alerts'
  | 'audit'
  | 'system'
  | 'api';

/**
 * Role definition with metadata
 */
export interface Role {
  id: string;
  name: UserRole;
  label: string;
  description: string;
  permissions: Permission[];
  color: string;
  icon: string;
  level: number; // Hierarchy level (5 = super_admin, 1 = viewer)
  isSystem: boolean; // Cannot be modified/deleted
  createdAt: string;
  updatedAt: string;
}

/**
 * User with extended role information
 */
export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  customPermissions?: Permission[]; // Override/additional permissions
  teams: string[]; // Team IDs
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Team for user organization
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  members: string[]; // User IDs
  defaultRole?: UserRole;
  permissions?: Permission[]; // Team-level permissions
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Audit log entry for RBAC actions
 */
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  resource: string; // e.g., "user:123", "template:456"
  resourceType: string; // e.g., "user", "template", "config"
  permission?: Permission;
  status: 'success' | 'denied' | 'error';
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  changes?: AuditChange[];
}

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'permission_check'
  | 'role_change'
  | 'config_change'
  | 'queue_action';

export interface AuditChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

/**
 * Permission matrix for visual editing
 */
export interface PermissionMatrix {
  roles: Role[];
  permissions: Permission[];
  matrix: Record<UserRole, Record<Permission, boolean>>;
}

/**
 * Role assignment request
 */
export interface RoleAssignment {
  userId: string;
  newRole: UserRole;
  assignedBy: string;
  reason?: string;
  customPermissions?: Permission[];
}

/**
 * Audit log query parameters
 */
export interface AuditLogQuery {
  userId?: string;
  userRole?: UserRole;
  action?: AuditAction;
  resourceType?: string;
  status?: 'success' | 'denied' | 'error';
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'timestamp' | 'userId' | 'action';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  granted: boolean;
  permission: Permission;
  userId: string;
  userRole: UserRole;
  reason?: string;
  timestamp: string;
}
