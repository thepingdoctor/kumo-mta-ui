/**
 * ProtectedAction Component
 *
 * Wraps actions/buttons/elements that require specific permissions.
 * Shows/hides or disables elements based on user permissions.
 */

import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { Permission } from '../../types/roles';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../../utils/permissions';
import { AlertCircle, Lock } from 'lucide-react';

export interface ProtectedActionProps {
  children: React.ReactNode;
  /** Single permission required */
  permission?: Permission;
  /** User needs ANY of these permissions */
  anyPermissions?: Permission[];
  /** User needs ALL of these permissions */
  allPermissions?: Permission[];
  /** What to render when permission is denied */
  fallback?: React.ReactNode;
  /** Show disabled state instead of hiding */
  showDisabled?: boolean;
  /** Show permission denied message */
  showDeniedMessage?: boolean;
  /** Custom denied message */
  deniedMessage?: string;
  /** Hide completely if no permission (default behavior) */
  hideIfDenied?: boolean;
  /** Custom className for denied state */
  deniedClassName?: string;
}

/**
 * Component that protects actions based on permissions
 *
 * Usage:
 * ```tsx
 * <ProtectedAction permission={Permission.EDIT_CONFIG}>
 *   <button>Edit Config</button>
 * </ProtectedAction>
 * ```
 */
const ProtectedAction: React.FC<ProtectedActionProps> = ({
  children,
  permission,
  anyPermissions,
  allPermissions,
  fallback,
  showDisabled = false,
  showDeniedMessage = false,
  deniedMessage,
  hideIfDenied = true,
  deniedClassName = 'opacity-50 cursor-not-allowed',
}) => {
  const { user } = useAuthStore();

  // Determine if user has required permissions
  const hasRequiredPermission = React.useMemo(() => {
    if (permission) {
      return hasPermission(user, permission);
    }
    if (anyPermissions && anyPermissions.length > 0) {
      return hasAnyPermission(user, anyPermissions);
    }
    if (allPermissions && allPermissions.length > 0) {
      return hasAllPermissions(user, allPermissions);
    }
    return false;
  }, [user, permission, anyPermissions, allPermissions]);

  // If user has permission, render children normally
  if (hasRequiredPermission) {
    return <>{children}</>;
  }

  // If user doesn't have permission and we should hide
  if (hideIfDenied && !showDisabled && !showDeniedMessage) {
    return fallback ? <>{fallback}</> : null;
  }

  // Show disabled state
  if (showDisabled) {
    return (
      <div className={deniedClassName} title="You don't have permission for this action">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              disabled: true,
              'aria-disabled': true,
            });
          }
          return child;
        })}
      </div>
    );
  }

  // Show denied message
  if (showDeniedMessage) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Lock className="h-4 w-4" />
        <span>{deniedMessage || 'You do not have permission to perform this action'}</span>
      </div>
    );
  }

  // Fallback
  return fallback ? <>{fallback}</> : null;
};

/**
 * Inline permission denied message component
 */
export const PermissionDenied: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Permission Denied', className = '' }) => (
  <div className={`flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
    <div className="flex-1">
      <h3 className="font-semibold text-red-900">Access Denied</h3>
      <p className="text-sm text-red-700">{message}</p>
    </div>
  </div>
);

export default ProtectedAction;
