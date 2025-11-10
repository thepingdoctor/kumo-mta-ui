/**
 * Permission Checker Utilities
 *
 * Client-side permission validation for RBAC
 */

import { Permission } from '../types/rbac';
import type { UserRole, UserWithRole } from '../types/rbac';

/**
 * Role hierarchy levels (higher = more privileged)
 */
const ROLE_LEVELS: Record<UserRole, number> = {
  super_admin: 5,
  admin: 4,
  operator: 3,
  analyst: 2,
  viewer: 1,
};

/**
 * Role to permissions mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: Object.values(Permission), // All permissions

  admin: [
    // Queue
    Permission.QUEUE_VIEW,
    Permission.QUEUE_SUSPEND,
    Permission.QUEUE_BOUNCE,
    Permission.QUEUE_REBIND,
    Permission.QUEUE_DELETE,
    Permission.QUEUE_PURGE,
    // Config
    Permission.CONFIG_VIEW,
    Permission.CONFIG_EDIT,
    Permission.CONFIG_DELETE,
    Permission.CONFIG_IMPORT,
    Permission.CONFIG_EXPORT,
    // Metrics
    Permission.METRICS_VIEW,
    Permission.METRICS_EXPORT,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_ADVANCED,
    // Users (view/edit only, not create/delete)
    Permission.USERS_VIEW,
    Permission.USERS_EDIT,
    // Templates
    Permission.TEMPLATES_VIEW,
    Permission.TEMPLATES_CREATE,
    Permission.TEMPLATES_EDIT,
    Permission.TEMPLATES_DELETE,
    Permission.TEMPLATES_PUBLISH,
    Permission.TEMPLATES_VERSION,
    // Alerts
    Permission.ALERTS_VIEW,
    Permission.ALERTS_CONFIGURE,
    Permission.ALERTS_DELETE,
    // Audit
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
    // System
    Permission.SYSTEM_HEALTH,
    // API
    Permission.API_READ,
    Permission.API_WRITE,
  ],

  operator: [
    // Queue
    Permission.QUEUE_VIEW,
    Permission.QUEUE_SUSPEND,
    Permission.QUEUE_BOUNCE,
    Permission.QUEUE_REBIND,
    // Config (view only)
    Permission.CONFIG_VIEW,
    Permission.CONFIG_EXPORT,
    // Metrics
    Permission.METRICS_VIEW,
    Permission.METRICS_EXPORT,
    Permission.ANALYTICS_VIEW,
    // Templates (view/edit)
    Permission.TEMPLATES_VIEW,
    Permission.TEMPLATES_EDIT,
    Permission.TEMPLATES_VERSION,
    // Alerts
    Permission.ALERTS_VIEW,
    Permission.ALERTS_CONFIGURE,
    // System
    Permission.SYSTEM_HEALTH,
    // API
    Permission.API_READ,
  ],

  analyst: [
    // Queue (view only)
    Permission.QUEUE_VIEW,
    // Config (view only)
    Permission.CONFIG_VIEW,
    // Metrics (full access)
    Permission.METRICS_VIEW,
    Permission.METRICS_EXPORT,
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_ADVANCED,
    // Templates (view only)
    Permission.TEMPLATES_VIEW,
    // Alerts (view only)
    Permission.ALERTS_VIEW,
    // Audit
    Permission.AUDIT_VIEW,
    Permission.AUDIT_EXPORT,
    // System
    Permission.SYSTEM_HEALTH,
    // API
    Permission.API_READ,
  ],

  viewer: [
    // Queue (view only)
    Permission.QUEUE_VIEW,
    // Config (view only)
    Permission.CONFIG_VIEW,
    // Metrics (view only)
    Permission.METRICS_VIEW,
    Permission.ANALYTICS_VIEW,
    // Templates (view only)
    Permission.TEMPLATES_VIEW,
    // Alerts (view only)
    Permission.ALERTS_VIEW,
    // System
    Permission.SYSTEM_HEALTH,
    // API
    Permission.API_READ,
  ],
};

/**
 * Check if user has specific permission
 */
export function hasPermission(user: UserWithRole | null, permission: Permission): boolean {
  if (!user) return false;

  // Check custom permissions first
  if (user.customPermissions?.includes(permission)) {
    return true;
  }

  // Check role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has ANY of the specified permissions
 */
export function hasAnyPermission(user: UserWithRole | null, permissions: Permission[]): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has ALL of the specified permissions
 */
export function hasAllPermissions(user: UserWithRole | null, permissions: Permission[]): boolean {
  if (!user || permissions.length === 0) return false;
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user has specific role
 */
export function hasRole(user: UserWithRole | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user has ANY of the specified roles
 */
export function hasAnyRole(user: UserWithRole | null, roles: UserRole[]): boolean {
  if (!user || roles.length === 0) return false;
  return roles.includes(user.role);
}

/**
 * Check if user has minimum role level
 */
export function hasMinimumRole(user: UserWithRole | null, minimumRole: UserRole): boolean {
  if (!user) return false;

  const userLevel = ROLE_LEVELS[user.role] || 0;
  const minimumLevel = ROLE_LEVELS[minimumRole] || 0;

  return userLevel >= minimumLevel;
}

/**
 * Get user's role level
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_LEVELS[role] || 0;
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Get user's effective permissions (role + custom)
 */
export function getEffectivePermissions(user: UserWithRole): Permission[] {
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  const customPermissions = user.customPermissions || [];

  return Array.from(new Set([...rolePermissions, ...customPermissions]));
}

/**
 * Check if permission is high-risk
 */
export function isHighRiskPermission(permission: Permission): boolean {
  const highRiskPermissions = [
    Permission.USERS_DELETE,
    Permission.CONFIG_DELETE,
    Permission.QUEUE_PURGE,
    Permission.SYSTEM_RESTART,
    Permission.SECURITY_MANAGE,
    Permission.API_ADMIN,
  ];

  return highRiskPermissions.includes(permission);
}

/**
 * Get permission category
 */
export function getPermissionCategory(permission: Permission): string {
  const prefix = permission.split(':')[0] as string | undefined;
  return prefix ?? '';
}

/**
 * Get permission label
 */
export function getPermissionLabel(permission: Permission): string {
  const labels: Partial<Record<Permission, string>> = {
    [Permission.QUEUE_VIEW]: 'View Queue',
    [Permission.QUEUE_SUSPEND]: 'Suspend Queue',
    [Permission.QUEUE_BOUNCE]: 'Bounce Messages',
    [Permission.QUEUE_REBIND]: 'Rebind Messages',
    [Permission.QUEUE_DELETE]: 'Delete Queue Items',
    [Permission.QUEUE_PURGE]: 'Purge Queue',
    [Permission.CONFIG_VIEW]: 'View Configuration',
    [Permission.CONFIG_EDIT]: 'Edit Configuration',
    [Permission.CONFIG_DELETE]: 'Delete Configuration',
    [Permission.CONFIG_IMPORT]: 'Import Configuration',
    [Permission.CONFIG_EXPORT]: 'Export Configuration',
    [Permission.METRICS_VIEW]: 'View Metrics',
    [Permission.METRICS_EXPORT]: 'Export Metrics',
    [Permission.ANALYTICS_VIEW]: 'View Analytics',
    [Permission.ANALYTICS_ADVANCED]: 'Advanced Analytics',
    [Permission.USERS_VIEW]: 'View Users',
    [Permission.USERS_CREATE]: 'Create Users',
    [Permission.USERS_EDIT]: 'Edit Users',
    [Permission.USERS_DELETE]: 'Delete Users',
    [Permission.USERS_ASSIGN_ROLES]: 'Assign User Roles',
    [Permission.TEMPLATES_VIEW]: 'View Templates',
    [Permission.TEMPLATES_CREATE]: 'Create Templates',
    [Permission.TEMPLATES_EDIT]: 'Edit Templates',
    [Permission.TEMPLATES_DELETE]: 'Delete Templates',
    [Permission.TEMPLATES_PUBLISH]: 'Publish Templates',
    [Permission.TEMPLATES_VERSION]: 'Manage Template Versions',
    [Permission.ALERTS_VIEW]: 'View Alerts',
    [Permission.ALERTS_CONFIGURE]: 'Configure Alerts',
    [Permission.ALERTS_DELETE]: 'Delete Alerts',
    [Permission.AUDIT_VIEW]: 'View Audit Logs',
    [Permission.AUDIT_EXPORT]: 'Export Audit Logs',
    [Permission.SECURITY_MANAGE]: 'Manage Security',
    [Permission.SYSTEM_HEALTH]: 'View System Health',
    [Permission.SYSTEM_RESTART]: 'Restart System',
    [Permission.SYSTEM_SETTINGS]: 'Manage System Settings',
    [Permission.API_READ]: 'API Read Access',
    [Permission.API_WRITE]: 'API Write Access',
    [Permission.API_ADMIN]: 'API Admin Access',
  };

  return labels[permission] || permission;
}

/**
 * Get role label
 */
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super Administrator',
    admin: 'Administrator',
    operator: 'Operator',
    analyst: 'Analyst',
    viewer: 'Viewer',
  };

  return labels[role];
}

/**
 * Get role color for UI
 */
export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    super_admin: 'purple',
    admin: 'red',
    operator: 'blue',
    analyst: 'green',
    viewer: 'gray',
  };

  return colors[role];
}

/**
 * Check if user can assign role to another user
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  // Only super_admin can assign super_admin role
  if (targetRole === 'super_admin') {
    return assignerRole === 'super_admin';
  }

  // User can only assign roles below their own level
  return getRoleLevel(assignerRole) > getRoleLevel(targetRole);
}

/**
 * Validate permission check and log for audit
 */
export function validatePermissionWithAudit(
  user: UserWithRole,
  permission: Permission,
  resource?: string
): { granted: boolean; reason?: string } {
  const granted = hasPermission(user, permission);

  // This would typically send to audit service
  const auditData = {
    userId: user.id,
    userRole: user.role,
    permission,
    resource,
    granted,
    timestamp: new Date().toISOString(),
  };

  // In production, send to audit service
  console.log('[Permission Check]', auditData);

  if (granted) {
    return { granted };
  }

  return {
    granted,
    reason: 'Insufficient permissions',
  };
}
