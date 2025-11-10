/**
 * useRoles Hook
 *
 * React hook for role management operations
 */

import { useState, useCallback } from 'react';
import { Role, UserWithRole, UserRole, RoleAssignment } from '../types/rbac';
import { roleService, userService } from '../services/rbacService';

export interface UseRolesResult {
  roles: Role[];
  users: UserWithRole[];
  loading: boolean;
  error: Error | null;
  fetchRoles: () => Promise<void>;
  fetchUsers: (params?: { role?: UserRole; team?: string; active?: boolean }) => Promise<void>;
  createRole: (role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Role>;
  updateRole: (roleId: string, updates: Partial<Role>) => Promise<Role>;
  deleteRole: (roleId: string) => Promise<void>;
  assignRole: (assignment: RoleAssignment) => Promise<UserWithRole>;
  createUser: (user: Omit<UserWithRole, 'id' | 'createdAt' | 'updatedAt'>) => Promise<UserWithRole>;
  updateUser: (userId: string, updates: Partial<UserWithRole>) => Promise<UserWithRole>;
  deleteUser: (userId: string) => Promise<void>;
  setUserActive: (userId: string, active: boolean) => Promise<UserWithRole>;
}

export function useRoles(): UseRolesResult {
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await roleService.list();
      setRoles(result);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async (params?: { role?: UserRole; team?: string; active?: boolean }) => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.list(params);
      setUsers(result);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = useCallback(async (
    role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Role> => {
    try {
      setLoading(true);
      setError(null);
      const created = await roleService.create(role);
      await fetchRoles(); // Refresh list
      return created;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  const updateRole = useCallback(async (
    roleId: string,
    updates: Partial<Role>
  ): Promise<Role> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await roleService.update(roleId, updates);
      await fetchRoles(); // Refresh list
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  const deleteRole = useCallback(async (roleId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await roleService.delete(roleId);
      await fetchRoles(); // Refresh list
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchRoles]);

  const assignRole = useCallback(async (assignment: RoleAssignment): Promise<UserWithRole> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await roleService.assignRole(assignment);
      await fetchUsers(); // Refresh users list
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const createUser = useCallback(async (
    user: Omit<UserWithRole, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserWithRole> => {
    try {
      setLoading(true);
      setError(null);
      const created = await userService.create(user);
      await fetchUsers(); // Refresh list
      return created;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (
    userId: string,
    updates: Partial<UserWithRole>
  ): Promise<UserWithRole> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await userService.update(userId, updates);
      await fetchUsers(); // Refresh list
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await userService.delete(userId);
      await fetchUsers(); // Refresh list
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const setUserActive = useCallback(async (
    userId: string,
    active: boolean
  ): Promise<UserWithRole> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await userService.setActive(userId, active);
      await fetchUsers(); // Refresh list
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  return {
    roles,
    users,
    loading,
    error,
    fetchRoles,
    fetchUsers,
    createRole,
    updateRole,
    deleteRole,
    assignRole,
    createUser,
    updateUser,
    deleteUser,
    setUserActive,
  };
}
