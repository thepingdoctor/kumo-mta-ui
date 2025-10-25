/**
 * Role-Based Access Control (RBAC) Types
 *
 * Defines the role hierarchy and permission structure for the KumoMTA Dashboard.
 */

/**
 * Available user roles in the system
 * - Admin: Full system access, can manage users and all configurations
 * - Operator: Can manage queues, view analytics, moderate access to configs
 * - Viewer: Read-only access to dashboard and analytics
 * - Auditor: Access to security logs, audit trails, and compliance data
 */
export type UserRole = 'admin' | 'operator' | 'viewer' | 'auditor';

/**
 * System permissions mapped to specific actions
 */
export enum Permission {
  // Dashboard & Analytics
  VIEW_DASHBOARD = 'view:dashboard',
  VIEW_ANALYTICS = 'view:analytics',
  EXPORT_ANALYTICS = 'export:analytics',

  // Queue Management
  VIEW_QUEUE = 'view:queue',
  MANAGE_QUEUE = 'manage:queue',
  DELETE_QUEUE = 'delete:queue',
  PURGE_QUEUE = 'purge:queue',

  // Configuration
  VIEW_CONFIG = 'view:config',
  EDIT_CONFIG = 'edit:config',
  DELETE_CONFIG = 'delete:config',
  IMPORT_CONFIG = 'import:config',
  EXPORT_CONFIG = 'export:config',

  // Security
  VIEW_SECURITY = 'view:security',
  MANAGE_SECURITY = 'manage:security',
  VIEW_AUDIT_LOGS = 'view:audit_logs',
  EXPORT_AUDIT_LOGS = 'export:audit_logs',

  // User Management
  VIEW_USERS = 'view:users',
  MANAGE_USERS = 'manage:users',
  DELETE_USERS = 'delete:users',
  ASSIGN_ROLES = 'assign:roles',

  // System Health
  VIEW_HEALTH = 'view:health',
  MANAGE_HEALTH = 'manage:health',
  RESTART_SERVICES = 'restart:services',

  // Advanced Features
  ACCESS_API = 'access:api',
  MANAGE_WEBHOOKS = 'manage:webhooks',
  MANAGE_INTEGRATIONS = 'manage:integrations',
}

/**
 * Role metadata including display information
 */
export interface RoleMetadata {
  role: UserRole;
  label: string;
  description: string;
  color: string; // Tailwind color class
  icon: string; // Icon identifier
  level: number; // Hierarchy level (higher = more privileged)
}

/**
 * Role definitions with metadata
 */
export const ROLE_METADATA: Record<UserRole, RoleMetadata> = {
  admin: {
    role: 'admin',
    label: 'Administrator',
    description: 'Full system access with user management capabilities',
    color: 'purple',
    icon: 'Shield',
    level: 4,
  },
  operator: {
    role: 'operator',
    label: 'Operator',
    description: 'Can manage queues and view analytics',
    color: 'blue',
    icon: 'Settings',
    level: 3,
  },
  viewer: {
    role: 'viewer',
    label: 'Viewer',
    description: 'Read-only access to dashboard and reports',
    color: 'green',
    icon: 'Eye',
    level: 2,
  },
  auditor: {
    role: 'auditor',
    label: 'Auditor',
    description: 'Access to security logs and audit trails',
    color: 'orange',
    icon: 'FileSearch',
    level: 1,
  },
};

/**
 * Role-to-Permission mapping
 * Defines which permissions each role has access to
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // All permissions
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    Permission.VIEW_QUEUE,
    Permission.MANAGE_QUEUE,
    Permission.DELETE_QUEUE,
    Permission.PURGE_QUEUE,
    Permission.VIEW_CONFIG,
    Permission.EDIT_CONFIG,
    Permission.DELETE_CONFIG,
    Permission.IMPORT_CONFIG,
    Permission.EXPORT_CONFIG,
    Permission.VIEW_SECURITY,
    Permission.MANAGE_SECURITY,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_AUDIT_LOGS,
    Permission.VIEW_USERS,
    Permission.MANAGE_USERS,
    Permission.DELETE_USERS,
    Permission.ASSIGN_ROLES,
    Permission.VIEW_HEALTH,
    Permission.MANAGE_HEALTH,
    Permission.RESTART_SERVICES,
    Permission.ACCESS_API,
    Permission.MANAGE_WEBHOOKS,
    Permission.MANAGE_INTEGRATIONS,
  ],
  operator: [
    // Dashboard & Analytics
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_ANALYTICS,
    // Queue Management (full)
    Permission.VIEW_QUEUE,
    Permission.MANAGE_QUEUE,
    Permission.PURGE_QUEUE,
    // Config (view only)
    Permission.VIEW_CONFIG,
    Permission.EXPORT_CONFIG,
    // Security (view only)
    Permission.VIEW_SECURITY,
    // Health
    Permission.VIEW_HEALTH,
    Permission.MANAGE_HEALTH,
    // API Access
    Permission.ACCESS_API,
  ],
  viewer: [
    // Dashboard & Analytics (read-only)
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_ANALYTICS,
    // Queue (view only)
    Permission.VIEW_QUEUE,
    // Config (view only)
    Permission.VIEW_CONFIG,
    // Health (view only)
    Permission.VIEW_HEALTH,
  ],
  auditor: [
    // Dashboard (view only)
    Permission.VIEW_DASHBOARD,
    // Security & Audit (full access)
    Permission.VIEW_SECURITY,
    Permission.VIEW_AUDIT_LOGS,
    Permission.EXPORT_AUDIT_LOGS,
    // Config (view only, for audit)
    Permission.VIEW_CONFIG,
    Permission.EXPORT_CONFIG,
    // Queue (view only, for monitoring)
    Permission.VIEW_QUEUE,
  ],
};

/**
 * Extended User type with role information
 */
export interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt?: string;
  lastLogin?: string;
}
