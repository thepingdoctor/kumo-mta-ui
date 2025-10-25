/**
 * RoleGuard Component
 *
 * Route-level security component that restricts access based on user roles.
 * Used to protect entire pages/routes.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { UserRole, Permission } from '../../types/roles';
import { hasRole, hasAnyRole, hasPermission, hasMinimumRole } from '../../utils/permissions';
import { ShieldAlert, Lock } from 'lucide-react';

export interface RoleGuardProps {
  children: React.ReactNode;
  /** Specific role required */
  role?: UserRole;
  /** User needs ANY of these roles */
  anyRoles?: UserRole[];
  /** User needs minimum role level */
  minimumRole?: UserRole;
  /** Single permission required */
  permission?: Permission;
  /** Redirect path if access denied */
  redirectTo?: string;
  /** Show access denied page instead of redirect */
  showAccessDenied?: boolean;
}

/**
 * Access Denied Page Component
 */
const AccessDeniedPage: React.FC<{
  userRole?: string;
  requiredRole?: string;
}> = ({ userRole, requiredRole }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
      <div className="flex flex-col items-center text-center">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page.
        </p>

        {userRole && (
          <div className="w-full bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Your Role:</span>
              <span className="font-semibold text-gray-900 capitalize">{userRole}</span>
            </div>
            {requiredRole && (
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Required Role:</span>
                <span className="font-semibold text-gray-900 capitalize">{requiredRole}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 w-full">
          <a
            href="/"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            Return to Dashboard
          </a>
          <a
            href="/settings"
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            Go to Settings
          </a>
        </div>

        <div className="mt-6 flex items-start gap-2 text-sm text-gray-500">
          <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="text-left">
            If you believe you should have access to this page, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  </div>
);

/**
 * Component that guards routes based on roles and permissions
 *
 * Usage:
 * ```tsx
 * <RoleGuard role="admin">
 *   <AdminPage />
 * </RoleGuard>
 *
 * <RoleGuard anyRoles={['admin', 'operator']}>
 *   <QueueManagement />
 * </RoleGuard>
 *
 * <RoleGuard minimumRole="operator">
 *   <OperatorDashboard />
 * </RoleGuard>
 *
 * <RoleGuard permission={Permission.EDIT_CONFIG}>
 *   <ConfigEditor />
 * </RoleGuard>
 * ```
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  role,
  anyRoles,
  minimumRole,
  permission,
  redirectTo = '/unauthorized',
  showAccessDenied = true,
}) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Determine if user has required access
  const hasAccess = React.useMemo(() => {
    // Check specific role
    if (role && hasRole(user, role)) {
      return true;
    }

    // Check any of the roles
    if (anyRoles && anyRoles.length > 0 && hasAnyRole(user, anyRoles)) {
      return true;
    }

    // Check minimum role level
    if (minimumRole && hasMinimumRole(user, minimumRole)) {
      return true;
    }

    // Check permission
    if (permission && hasPermission(user, permission)) {
      return true;
    }

    // No access criteria met
    return false;
  }, [user, role, anyRoles, minimumRole, permission]);

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show access denied page
  if (showAccessDenied) {
    return (
      <AccessDeniedPage
        userRole={user.role}
        requiredRole={role || (anyRoles && anyRoles[0])}
      />
    );
  }

  // Redirect to specified path
  return <Navigate to={redirectTo} state={{ from: location }} replace />;
};

export default RoleGuard;
