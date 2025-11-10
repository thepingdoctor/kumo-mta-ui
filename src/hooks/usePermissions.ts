/**
 * usePermissions Hook
 *
 * React hook for permission checking and management
 */

import { useCallback } from 'react';
import { Permission, UserWithRole } from '../types/rbac';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getEffectivePermissions,
  isHighRiskPermission,
} from '../utils/permissionChecker';
import { useAuthStore } from '../store/authStore';

export interface UsePermissionsResult {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  isHighRisk: (permission: Permission) => boolean;
  getEffectivePermissions: () => Permission[];
  canPerform: (permission: Permission, onDenied?: () => void) => boolean;
}

export function usePermissions(): UsePermissionsResult {
  const user = useAuthStore(state => state.user) as UserWithRole | null;

  const checkPermission = useCallback((permission: Permission): boolean => {
    return hasPermission(user, permission);
  }, [user]);

  const checkAnyPermission = useCallback((permissions: Permission[]): boolean => {
    return hasAnyPermission(user, permissions);
  }, [user]);

  const checkAllPermissions = useCallback((permissions: Permission[]): boolean => {
    return hasAllPermissions(user, permissions);
  }, [user]);

  const checkHighRisk = useCallback((permission: Permission): boolean => {
    return isHighRiskPermission(permission);
  }, []);

  const getUserPermissions = useCallback((): Permission[] => {
    if (!user) return [];
    return getEffectivePermissions(user);
  }, [user]);

  const canPerform = useCallback((
    permission: Permission,
    onDenied?: () => void
  ): boolean => {
    const granted = hasPermission(user, permission);
    if (!granted && onDenied) {
      onDenied();
    }
    return granted;
  }, [user]);

  return {
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    isHighRisk: checkHighRisk,
    getEffectivePermissions: getUserPermissions,
    canPerform,
  };
}
