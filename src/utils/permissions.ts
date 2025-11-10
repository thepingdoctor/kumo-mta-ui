/**
 * Permission Utilities
 *
 * Centralized permission checking and role validation utilities.
 */

import { Permission, ROLE_PERMISSIONS, ROLE_METADATA } from '../types/roles';
import type { UserRole } from '../types/roles';
import type { User } from '../types';

/**
 * Check if a user has a specific permission
 *
 * @param user - The user object (must have a role property)
 * @param permission - The permission to check
 * @returns true if user has the permission, false otherwise
 */
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user || !user.role) {
    return false;
  }

  const userRole = user.role as UserRole;
  const permissions = ROLE_PERMISSIONS[userRole];

  return permissions.includes(permission);
};

/**
 * Check if a user has ANY of the specified permissions
 *
 * @param user - The user object
 * @param permissions - Array of permissions to check
 * @returns true if user has at least one of the permissions
 */
export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user || !user.role) {
    return false;
  }

  return permissions.some(permission => hasPermission(user, permission));
};

/**
 * Check if a user has ALL of the specified permissions
 *
 * @param user - The user object
 * @param permissions - Array of permissions to check
 * @returns true if user has all of the permissions
 */
export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user || !user.role) {
    return false;
  }

  return permissions.every(permission => hasPermission(user, permission));
};

/**
 * Get all permissions for a specific role
 *
 * @param role - The role to get permissions for
 * @returns Array of permissions
 */
export const getRolePermissions = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if a user has a specific role
 *
 * @param user - The user object
 * @param role - The role to check
 * @returns true if user has the specified role
 */
export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user || !user.role) {
    return false;
  }

  return user.role === role;
};

/**
 * Check if a user has any of the specified roles
 *
 * @param user - The user object
 * @param roles - Array of roles to check
 * @returns true if user has at least one of the roles
 */
export const hasAnyRole = (user: User | null, roles: UserRole[]): boolean => {
  if (!user || !user.role) {
    return false;
  }

  return roles.includes(user.role as UserRole);
};

/**
 * Check if a user's role is at least the specified level
 * Used for hierarchical role checks
 *
 * @param user - The user object
 * @param minimumRole - The minimum role required
 * @returns true if user's role level is >= minimum role level
 */
export const hasMinimumRole = (user: User | null, minimumRole: UserRole): boolean => {
  if (!user || !user.role) {
    return false;
  }

  const userRoleLevel = ROLE_METADATA[user.role as UserRole]?.level || 0;
  const minimumRoleLevel = ROLE_METADATA[minimumRole]?.level || 0;

  return userRoleLevel >= minimumRoleLevel;
};

/**
 * Check if a user is an admin
 *
 * @param user - The user object
 * @returns true if user is an admin
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin');
};

/**
 * Check if a user is an operator or higher
 *
 * @param user - The user object
 * @returns true if user is operator or admin
 */
export const isOperatorOrHigher = (user: User | null): boolean => {
  return hasAnyRole(user, ['operator', 'admin']);
};

/**
 * Get a human-readable permission name
 *
 * @param permission - The permission enum value
 * @returns Human-readable permission name
 */
export const getPermissionLabel = (permission: Permission): string => {
  const labels: Record<Permission, string> = {
    [Permission.VIEW_DASHBOARD]: 'View Dashboard',
    [Permission.VIEW_ANALYTICS]: 'View Analytics',
    [Permission.EXPORT_ANALYTICS]: 'Export Analytics',
    [Permission.VIEW_QUEUE]: 'View Queue',
    [Permission.MANAGE_QUEUE]: 'Manage Queue',
    [Permission.DELETE_QUEUE]: 'Delete Queue Items',
    [Permission.PURGE_QUEUE]: 'Purge Queue',
    [Permission.VIEW_CONFIG]: 'View Configuration',
    [Permission.EDIT_CONFIG]: 'Edit Configuration',
    [Permission.DELETE_CONFIG]: 'Delete Configuration',
    [Permission.IMPORT_CONFIG]: 'Import Configuration',
    [Permission.EXPORT_CONFIG]: 'Export Configuration',
    [Permission.VIEW_SECURITY]: 'View Security Settings',
    [Permission.MANAGE_SECURITY]: 'Manage Security',
    [Permission.VIEW_AUDIT_LOGS]: 'View Audit Logs',
    [Permission.EXPORT_AUDIT_LOGS]: 'Export Audit Logs',
    [Permission.VIEW_USERS]: 'View Users',
    [Permission.MANAGE_USERS]: 'Manage Users',
    [Permission.DELETE_USERS]: 'Delete Users',
    [Permission.ASSIGN_ROLES]: 'Assign User Roles',
    [Permission.VIEW_HEALTH]: 'View Health Status',
    [Permission.MANAGE_HEALTH]: 'Manage Health',
    [Permission.RESTART_SERVICES]: 'Restart Services',
    [Permission.ACCESS_API]: 'Access API',
    [Permission.MANAGE_WEBHOOKS]: 'Manage Webhooks',
    [Permission.MANAGE_INTEGRATIONS]: 'Manage Integrations',
  };

  return labels[permission] || permission;
};

/**
 * Permission check error with detailed information
 */
export class PermissionError extends Error {
  constructor(
    public permission: Permission,
    public userRole?: UserRole,
    message?: string
  ) {
    super(message || `Permission denied: ${getPermissionLabel(permission)}`);
    this.name = 'PermissionError';
  }
}

/**
 * Throw an error if user doesn't have permission
 * Useful for API calls and critical operations
 *
 * @param user - The user object
 * @param permission - The required permission
 * @throws PermissionError if user doesn't have permission
 */
export const requirePermission = (user: User | null, permission: Permission): void => {
  if (!hasPermission(user, permission)) {
    throw new PermissionError(
      permission,
      user?.role as UserRole,
      `This action requires the "${getPermissionLabel(permission)}" permission`
    );
  }
};

/**
 * Audit log entry for permission checks
 * Can be used to track permission denials
 */
export interface PermissionAuditEntry {
  timestamp: string;
  userId: string;
  userRole: UserRole;
  permission: Permission;
  granted: boolean;
  resource?: string;
  action?: string;
}

/**
 * Create an audit log entry for a permission check
 *
 * @param user - The user object
 * @param permission - The permission checked
 * @param granted - Whether permission was granted
 * @param resource - Optional resource being accessed
 * @param action - Optional action being performed
 * @returns Audit log entry
 */
export const createAuditEntry = (
  user: User | null,
  permission: Permission,
  granted: boolean,
  resource?: string,
  action?: string
): PermissionAuditEntry | null => {
  if (!user) return null;

  const entry: PermissionAuditEntry = {
    timestamp: new Date().toISOString(),
    userId: user.id,
    userRole: user.role as UserRole,
    permission,
    granted,
  };

  if (resource !== undefined) {
    entry.resource = resource;
  }

  if (action !== undefined) {
    entry.action = action;
  }

  return entry;
};
