import { describe, it, expect } from 'vitest';

describe('Role Hierarchy - Permission Inheritance', () => {
  const roleHierarchy = {
    super_admin: 4,
    operator: 3,
    analyst: 2,
    viewer: 1,
  } as const;

  const roleInherits = (
    userRole: keyof typeof roleHierarchy,
    requiredRole: keyof typeof roleHierarchy
  ): boolean => {
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  it('should enforce role hierarchy levels', () => {
    expect(roleHierarchy.super_admin).toBeGreaterThan(roleHierarchy.operator);
    expect(roleHierarchy.operator).toBeGreaterThan(roleHierarchy.analyst);
    expect(roleHierarchy.analyst).toBeGreaterThan(roleHierarchy.viewer);
  });

  it('should allow super_admin to inherit all permissions', () => {
    expect(roleInherits('super_admin', 'viewer')).toBe(true);
    expect(roleInherits('super_admin', 'analyst')).toBe(true);
    expect(roleInherits('super_admin', 'operator')).toBe(true);
    expect(roleInherits('super_admin', 'super_admin')).toBe(true);
  });

  it('should allow operator to inherit analyst and viewer permissions', () => {
    expect(roleInherits('operator', 'viewer')).toBe(true);
    expect(roleInherits('operator', 'analyst')).toBe(true);
    expect(roleInherits('operator', 'operator')).toBe(true);
    expect(roleInherits('operator', 'super_admin')).toBe(false);
  });

  it('should allow analyst to inherit viewer permissions', () => {
    expect(roleInherits('analyst', 'viewer')).toBe(true);
    expect(roleInherits('analyst', 'analyst')).toBe(true);
    expect(roleInherits('analyst', 'operator')).toBe(false);
    expect(roleInherits('analyst', 'super_admin')).toBe(false);
  });

  it('should restrict viewer to own permissions only', () => {
    expect(roleInherits('viewer', 'viewer')).toBe(true);
    expect(roleInherits('viewer', 'analyst')).toBe(false);
    expect(roleInherits('viewer', 'operator')).toBe(false);
    expect(roleInherits('viewer', 'super_admin')).toBe(false);
  });

  it('should validate role transitions', () => {
    const canPromote = (
      from: keyof typeof roleHierarchy,
      to: keyof typeof roleHierarchy
    ): boolean => {
      return roleHierarchy[to] > roleHierarchy[from];
    };

    expect(canPromote('viewer', 'analyst')).toBe(true);
    expect(canPromote('analyst', 'operator')).toBe(true);
    expect(canPromote('operator', 'super_admin')).toBe(true);
    expect(canPromote('super_admin', 'operator')).toBe(false);
  });

  it('should support role comparison', () => {
    const compareRoles = (
      role1: keyof typeof roleHierarchy,
      role2: keyof typeof roleHierarchy
    ): number => {
      return roleHierarchy[role1] - roleHierarchy[role2];
    };

    expect(compareRoles('super_admin', 'viewer')).toBeGreaterThan(0);
    expect(compareRoles('viewer', 'super_admin')).toBeLessThan(0);
    expect(compareRoles('operator', 'operator')).toBe(0);
  });

  it('should calculate effective permissions based on hierarchy', () => {
    type Permission = string;

    const basePermissions: Record<keyof typeof roleHierarchy, Permission[]> = {
      viewer: ['view:metrics', 'view:queue'],
      analyst: ['view:config', 'view:logs'],
      operator: ['manage:queue', 'suspend:queue'],
      super_admin: ['edit:config', 'manage:users'],
    };

    const getEffectivePermissions = (
      role: keyof typeof roleHierarchy
    ): Permission[] => {
      const permissions = new Set<Permission>();

      (Object.keys(roleHierarchy) as Array<keyof typeof roleHierarchy>)
        .filter((r) => roleHierarchy[r] <= roleHierarchy[role])
        .forEach((r) => {
          basePermissions[r].forEach((p) => permissions.add(p));
        });

      return Array.from(permissions);
    };

    const superAdminPerms = getEffectivePermissions('super_admin');
    expect(superAdminPerms).toContain('view:metrics'); // From viewer
    expect(superAdminPerms).toContain('view:config'); // From analyst
    expect(superAdminPerms).toContain('manage:queue'); // From operator
    expect(superAdminPerms).toContain('edit:config'); // Own permission

    const viewerPerms = getEffectivePermissions('viewer');
    expect(viewerPerms).toHaveLength(2);
    expect(viewerPerms).not.toContain('edit:config');
  });
});
