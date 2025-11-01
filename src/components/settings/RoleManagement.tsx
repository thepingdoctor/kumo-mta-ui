/**
 * RoleManagement Component
 *
 * Admin-only page for managing user roles and permissions.
 * Allows viewing, editing, and auditing role assignments.
 */

import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { UserRole, Permission, ROLE_METADATA, ROLE_PERMISSIONS } from '../../types/roles';
import { hasPermission, getPermissionLabel } from '../../utils/permissions';
import RoleBadge from '../auth/RoleBadge';
import { PermissionDenied } from '../auth/ProtectedAction';
import {
  Shield,
  Users,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react';

interface UserRoleData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  lastLogin: string;
  createdAt: string;
}

// Mock user data - replace with actual API calls
const mockUsers: UserRoleData[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    lastLogin: '2024-01-15T10:30:00Z',
    createdAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Operations Manager',
    email: 'ops@example.com',
    role: 'operator',
    lastLogin: '2024-01-15T09:15:00Z',
    createdAt: '2023-03-15T00:00:00Z',
  },
  {
    id: '3',
    name: 'View Only User',
    email: 'viewer@example.com',
    role: 'viewer',
    lastLogin: '2024-01-14T16:45:00Z',
    createdAt: '2023-06-20T00:00:00Z',
  },
  {
    id: '4',
    name: 'Security Auditor',
    email: 'audit@example.com',
    role: 'auditor',
    lastLogin: '2024-01-15T08:00:00Z',
    createdAt: '2023-09-10T00:00:00Z',
  },
];

const RoleManagement: React.FC = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserRoleData[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedPermissionRole, setSelectedPermissionRole] = useState<UserRole>('admin');

  // Check if user has permission to manage roles
  const canManageRoles = hasPermission(user, Permission.ASSIGN_ROLES);

  if (!canManageRoles) {
    return (
      <div className="p-6">
        <PermissionDenied message="You do not have permission to manage user roles. This page is restricted to administrators." />
      </div>
    );
  }

  // Filter users based on search and role
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Handle role change
  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prevUsers =>
      prevUsers.map(u => (u.id === userId ? { ...u, role: newRole } : u))
    );
    // TODO: Add API call to update role
    console.log(`Updated user ${userId} to role ${newRole}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        </div>
        <p className="text-gray-600">
          Manage user roles and permissions across the KumoMTA Dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(ROLE_METADATA).map(([roleKey, metadata]) => {
          const count = users.filter(u => u.role === roleKey).length;
          return (
            <div
              key={roleKey}
              className="bg-white rounded-lg shadow p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-2">
                <RoleBadge role={roleKey as UserRole} size="sm" />
                <span className="text-2xl font-bold text-gray-900">{count}</span>
              </div>
              <p className="text-sm text-gray-600">{metadata.label}s</p>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={e => setSelectedRole(e.target.value as UserRole | 'all')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            {Object.entries(ROLE_METADATA).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>

          {/* View Permissions Button */}
          <button
            onClick={() => setShowPermissions(!showPermissions)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Info className="h-5 w-5" />
            {showPermissions ? 'Hide' : 'View'} Permissions
          </button>
        </div>
      </div>

      {/* Permissions Panel */}
      {showPermissions && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Role Permissions</h2>

          {/* Role Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Role
            </label>
            <div className="flex gap-2">
              {Object.keys(ROLE_METADATA).map(roleKey => (
                <button
                  key={roleKey}
                  onClick={() => setSelectedPermissionRole(roleKey as UserRole)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedPermissionRole === roleKey
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <RoleBadge role={roleKey as UserRole} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Permissions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(Permission).map(permission => {
              const hasPermission = ROLE_PERMISSIONS[selectedPermissionRole].includes(permission);
              return (
                <div
                  key={permission}
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    hasPermission
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  {hasPermission ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${hasPermission ? 'text-green-900' : 'text-gray-500'}`}>
                    {getPermissionLabel(permission)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map(userData => (
                <tr key={userData.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                        <div className="text-sm text-gray-500">{userData.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={userData.role}
                      onChange={e => handleRoleChange(userData.id, e.target.value as UserRole)}
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      disabled={userData.id === user?.id} // Can't change own role
                    >
                      {Object.entries(ROLE_METADATA).map(([key, meta]) => (
                        <option key={key} value={key}>
                          {meta.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(userData.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(userData.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit user"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {userData.id !== user?.id && (
                      <button
                        className="text-red-600 hover:text-red-900"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleManagement;
