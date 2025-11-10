/**
 * RBAC Service
 *
 * API client for role-based access control operations
 */

import {
  Role,
  UserWithRole,
  Team,
  AuditLogEntry,
  AuditLogQuery,
  RoleAssignment,
  PermissionCheckResult,
  Permission,
  UserRole,
} from '../types/rbac';

const API_BASE = '/api/v1/rbac';

/**
 * Role management operations
 */
export const roleService = {
  /**
   * List all roles
   */
  async list(): Promise<Role[]> {
    const response = await fetch(`${API_BASE}/roles`);
    if (!response.ok) throw new Error('Failed to fetch roles');
    return response.json();
  },

  /**
   * Get role details
   */
  async get(roleId: string): Promise<Role> {
    const response = await fetch(`${API_BASE}/roles/${roleId}`);
    if (!response.ok) throw new Error('Failed to fetch role');
    return response.json();
  },

  /**
   * Create custom role
   */
  async create(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<Role> {
    const response = await fetch(`${API_BASE}/roles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(role),
    });
    if (!response.ok) throw new Error('Failed to create role');
    return response.json();
  },

  /**
   * Update role
   */
  async update(roleId: string, updates: Partial<Role>): Promise<Role> {
    const response = await fetch(`${API_BASE}/roles/${roleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update role');
    return response.json();
  },

  /**
   * Delete role
   */
  async delete(roleId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/roles/${roleId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete role');
  },

  /**
   * Assign role to user
   */
  async assignRole(assignment: RoleAssignment): Promise<UserWithRole> {
    const response = await fetch(`${API_BASE}/roles/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignment),
    });
    if (!response.ok) throw new Error('Failed to assign role');
    return response.json();
  },
};

/**
 * User management operations
 */
export const userService = {
  /**
   * List users with roles
   */
  async list(params?: { role?: UserRole; team?: string; active?: boolean }): Promise<UserWithRole[]> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.set('role', params.role);
    if (params?.team) queryParams.set('team', params.team);
    if (params?.active !== undefined) queryParams.set('active', String(params.active));

    const response = await fetch(`${API_BASE}/users?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  /**
   * Get user details
   */
  async get(userId: string): Promise<UserWithRole> {
    const response = await fetch(`${API_BASE}/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  /**
   * Create user
   */
  async create(user: Omit<UserWithRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserWithRole> {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  /**
   * Update user
   */
  async update(userId: string, updates: Partial<UserWithRole>): Promise<UserWithRole> {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  /**
   * Delete user
   */
  async delete(userId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete user');
  },

  /**
   * Activate/deactivate user
   */
  async setActive(userId: string, active: boolean): Promise<UserWithRole> {
    const response = await fetch(`${API_BASE}/users/${userId}/active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    });
    if (!response.ok) throw new Error('Failed to update user status');
    return response.json();
  },

  /**
   * Grant custom permission to user
   */
  async grantPermission(userId: string, permission: Permission): Promise<UserWithRole> {
    const response = await fetch(`${API_BASE}/users/${userId}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission }),
    });
    if (!response.ok) throw new Error('Failed to grant permission');
    return response.json();
  },

  /**
   * Revoke custom permission from user
   */
  async revokePermission(userId: string, permission: Permission): Promise<UserWithRole> {
    const response = await fetch(`${API_BASE}/users/${userId}/permissions/${permission}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to revoke permission');
    return response.json();
  },
};

/**
 * Team management operations
 */
export const teamService = {
  /**
   * List teams
   */
  async list(): Promise<Team[]> {
    const response = await fetch(`${API_BASE}/teams`);
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  },

  /**
   * Get team details
   */
  async get(teamId: string): Promise<Team> {
    const response = await fetch(`${API_BASE}/teams/${teamId}`);
    if (!response.ok) throw new Error('Failed to fetch team');
    return response.json();
  },

  /**
   * Create team
   */
  async create(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const response = await fetch(`${API_BASE}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(team),
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
  },

  /**
   * Update team
   */
  async update(teamId: string, updates: Partial<Team>): Promise<Team> {
    const response = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update team');
    return response.json();
  },

  /**
   * Delete team
   */
  async delete(teamId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/teams/${teamId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete team');
  },

  /**
   * Add member to team
   */
  async addMember(teamId: string, userId: string): Promise<Team> {
    const response = await fetch(`${API_BASE}/teams/${teamId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Failed to add team member');
    return response.json();
  },

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, userId: string): Promise<Team> {
    const response = await fetch(`${API_BASE}/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove team member');
    return response.json();
  },
};

/**
 * Audit log operations
 */
export const auditService = {
  /**
   * Query audit logs
   */
  async query(params: AuditLogQuery): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params.userId) queryParams.set('userId', params.userId);
    if (params.userRole) queryParams.set('userRole', params.userRole);
    if (params.action) queryParams.set('action', params.action);
    if (params.resourceType) queryParams.set('resourceType', params.resourceType);
    if (params.status) queryParams.set('status', params.status);
    if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.set('dateTo', params.dateTo);
    if (params.search) queryParams.set('search', params.search);
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.pageSize) queryParams.set('pageSize', params.pageSize.toString());
    if (params.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);

    const response = await fetch(`${API_BASE}/audit?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    return response.json();
  },

  /**
   * Get single audit entry
   */
  async get(entryId: string): Promise<AuditLogEntry> {
    const response = await fetch(`${API_BASE}/audit/${entryId}`);
    if (!response.ok) throw new Error('Failed to fetch audit entry');
    return response.json();
  },

  /**
   * Export audit logs
   */
  async export(params: AuditLogQuery, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryParams.set(key, String(value));
    });
    queryParams.set('format', format);

    const response = await fetch(`${API_BASE}/audit/export?${queryParams}`);
    if (!response.ok) throw new Error('Failed to export audit logs');
    return response.blob();
  },

  /**
   * Get audit statistics
   */
  async getStats(dateFrom?: string, dateTo?: string): Promise<AuditStats> {
    const queryParams = new URLSearchParams();
    if (dateFrom) queryParams.set('dateFrom', dateFrom);
    if (dateTo) queryParams.set('dateTo', dateTo);

    const response = await fetch(`${API_BASE}/audit/stats?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch audit stats');
    return response.json();
  },
};

export interface AuditStats {
  totalEvents: number;
  successCount: number;
  deniedCount: number;
  errorCount: number;
  byAction: Record<string, number>;
  byUser: Record<string, number>;
  byResource: Record<string, number>;
  timeline: Array<{ date: string; count: number }>;
}

/**
 * Permission checking operations
 */
export const permissionService = {
  /**
   * Check if current user has permission
   */
  async check(permission: Permission, resource?: string): Promise<PermissionCheckResult> {
    const response = await fetch(`${API_BASE}/permissions/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission, resource }),
    });
    if (!response.ok) throw new Error('Failed to check permission');
    return response.json();
  },

  /**
   * Get user's effective permissions
   */
  async getEffectivePermissions(userId?: string): Promise<Permission[]> {
    const url = userId ? `${API_BASE}/permissions/${userId}` : `${API_BASE}/permissions`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch permissions');
    return response.json();
  },

  /**
   * Get permission matrix for all roles
   */
  async getMatrix(): Promise<Record<UserRole, Permission[]>> {
    const response = await fetch(`${API_BASE}/permissions/matrix`);
    if (!response.ok) throw new Error('Failed to fetch permission matrix');
    return response.json();
  },
};
