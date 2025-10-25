/**
 * RoleBadge Component
 *
 * Displays a user's role as a styled badge.
 * Can be used in headers, profiles, or anywhere role display is needed.
 */

import React from 'react';
import { UserRole, ROLE_METADATA } from '../../types/roles';
import { Shield, Settings, Eye, FileSearch } from 'lucide-react';

export interface RoleBadgeProps {
  role: UserRole;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show icon */
  showIcon?: boolean;
  /** Custom className */
  className?: string;
  /** Show full label or abbreviated */
  abbreviated?: boolean;
}

/**
 * Get the icon component for a role
 */
const getRoleIcon = (role: UserRole): React.ReactNode => {
  const iconMap: Record<UserRole, React.ReactNode> = {
    admin: <Shield className="h-4 w-4" />,
    operator: <Settings className="h-4 w-4" />,
    viewer: <Eye className="h-4 w-4" />,
    auditor: <FileSearch className="h-4 w-4" />,
  };
  return iconMap[role] || null;
};

/**
 * Get color classes for a role
 */
const getRoleColorClasses = (role: UserRole): string => {
  const colorMap: Record<UserRole, string> = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    operator: 'bg-blue-100 text-blue-800 border-blue-200',
    viewer: 'bg-green-100 text-green-800 border-green-200',
    auditor: 'bg-orange-100 text-orange-800 border-orange-200',
  };
  return colorMap[role] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get size classes
 */
const getSizeClasses = (size: 'sm' | 'md' | 'lg'): string => {
  const sizeMap = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  return sizeMap[size];
};

/**
 * Badge component showing user role
 *
 * Usage:
 * ```tsx
 * <RoleBadge role="admin" />
 * <RoleBadge role="operator" size="lg" showIcon />
 * <RoleBadge role="viewer" abbreviated />
 * ```
 */
const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  className = '',
  abbreviated = false,
}) => {
  const metadata = ROLE_METADATA[role];

  if (!metadata) {
    return null;
  }

  const colorClasses = getRoleColorClasses(role);
  const sizeClasses = getSizeClasses(size);
  const icon = showIcon ? getRoleIcon(role) : null;
  const label = abbreviated ? role.toUpperCase() : metadata.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${colorClasses} ${sizeClasses} ${className}`}
      title={metadata.description}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
};

/**
 * Role badge with tooltip showing full description
 */
export const RoleBadgeWithTooltip: React.FC<RoleBadgeProps> = (props) => {
  const metadata = ROLE_METADATA[props.role];
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <RoleBadge {...props} />
      </div>

      {showTooltip && metadata && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
          <div className="font-semibold">{metadata.label}</div>
          <div className="text-gray-300 mt-1">{metadata.description}</div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact role indicator (just icon and color)
 */
export const RoleIndicator: React.FC<{ role: UserRole; className?: string }> = ({
  role,
  className = '',
}) => {
  const colorClasses = getRoleColorClasses(role);
  const icon = getRoleIcon(role);
  const metadata = ROLE_METADATA[role];

  return (
    <div
      className={`inline-flex items-center justify-center h-8 w-8 rounded-full border-2 ${colorClasses} ${className}`}
      title={metadata?.label}
    >
      {icon}
    </div>
  );
};

export default RoleBadge;
