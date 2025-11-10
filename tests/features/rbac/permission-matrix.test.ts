import { describe, it, expect } from 'vitest';

describe('Permission Matrix - Permission Editor UI Logic', () => {
  type Permission = {
    id: string;
    resource: string;
    action: string;
    description: string;
  };

  type Role = {
    name: string;
    permissions: string[];
  };

  const permissions: Permission[] = [
    { id: 'view:metrics', resource: 'metrics', action: 'view', description: 'View system metrics' },
    { id: 'view:queue', resource: 'queue', action: 'view', description: 'View message queue' },
    { id: 'manage:queue', resource: 'queue', action: 'manage', description: 'Manage message queue' },
    { id: 'suspend:queue', resource: 'queue', action: 'suspend', description: 'Suspend message queue' },
    { id: 'view:config', resource: 'config', action: 'view', description: 'View configuration' },
    { id: 'edit:config', resource: 'config', action: 'edit', description: 'Edit configuration' },
    { id: 'view:logs', resource: 'logs', action: 'view', description: 'View system logs' },
    { id: 'manage:users', resource: 'users', action: 'manage', description: 'Manage users' },
  ];

  const roles: Role[] = [
    {
      name: 'super_admin',
      permissions: permissions.map((p) => p.id),
    },
    {
      name: 'operator',
      permissions: ['view:metrics', 'view:queue', 'manage:queue', 'suspend:queue', 'view:config', 'view:logs'],
    },
    {
      name: 'analyst',
      permissions: ['view:metrics', 'view:queue', 'view:config', 'view:logs'],
    },
    {
      name: 'viewer',
      permissions: ['view:metrics', 'view:queue'],
    },
  ];

  it('should create permission matrix structure', () => {
    const matrix = permissions.map((permission) => ({
      permission: permission.id,
      description: permission.description,
      roles: roles.reduce((acc, role) => {
        acc[role.name] = role.permissions.includes(permission.id);
        return acc;
      }, {} as Record<string, boolean>),
    }));

    expect(matrix).toHaveLength(permissions.length);
    expect(matrix[0]).toHaveProperty('permission');
    expect(matrix[0]).toHaveProperty('roles');
  });

  it('should toggle permission for role', () => {
    const togglePermission = (
      role: Role,
      permissionId: string
    ): Role => {
      const hasPermission = role.permissions.includes(permissionId);

      return {
        ...role,
        permissions: hasPermission
          ? role.permissions.filter((p) => p !== permissionId)
          : [...role.permissions, permissionId],
      };
    };

    const viewer = roles.find((r) => r.name === 'viewer')!;
    const updatedViewer = togglePermission(viewer, 'view:config');

    expect(updatedViewer.permissions).toContain('view:config');

    const removedPermission = togglePermission(updatedViewer, 'view:config');
    expect(removedPermission.permissions).not.toContain('view:config');
  });

  it('should group permissions by resource', () => {
    const groupedByResource = permissions.reduce((acc, permission) => {
      if (!acc[permission.resource]) {
        acc[permission.resource] = [];
      }
      acc[permission.resource].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);

    expect(groupedByResource).toHaveProperty('queue');
    expect(groupedByResource).toHaveProperty('config');
    expect(groupedByResource.queue.length).toBeGreaterThan(1);
  });

  it('should validate permission changes', () => {
    const validatePermissionChange = (
      role: string,
      permissionId: string,
      isGranting: boolean
    ): { valid: boolean; reason?: string } => {
      // Viewer cannot have edit permissions
      if (role === 'viewer' && permissionId.startsWith('edit:')) {
        return { valid: false, reason: 'Viewers cannot have edit permissions' };
      }

      // Super admin cannot have permissions removed
      if (role === 'super_admin' && !isGranting) {
        return { valid: false, reason: 'Cannot remove permissions from super admin' };
      }

      return { valid: true };
    };

    expect(validatePermissionChange('viewer', 'edit:config', true).valid).toBe(false);
    expect(validatePermissionChange('super_admin', 'view:metrics', false).valid).toBe(false);
    expect(validatePermissionChange('operator', 'manage:queue', true).valid).toBe(true);
  });

  it('should calculate permission coverage for role', () => {
    const calculateCoverage = (role: Role): number => {
      return (role.permissions.length / permissions.length) * 100;
    };

    const superAdmin = roles.find((r) => r.name === 'super_admin')!;
    const viewer = roles.find((r) => r.name === 'viewer')!;

    expect(calculateCoverage(superAdmin)).toBe(100);
    expect(calculateCoverage(viewer)).toBeLessThan(50);
  });

  it('should find roles with specific permission', () => {
    const findRolesWithPermission = (permissionId: string): string[] => {
      return roles
        .filter((role) => role.permissions.includes(permissionId))
        .map((role) => role.name);
    };

    const rolesWithEditConfig = findRolesWithPermission('edit:config');
    expect(rolesWithEditConfig).toContain('super_admin');
    expect(rolesWithEditConfig).not.toContain('viewer');
  });

  it('should detect permission conflicts', () => {
    const hasConflict = (
      role: Role,
      newPermission: string
    ): boolean => {
      // Cannot have both view and edit for same resource
      const resource = newPermission.split(':')[1];
      const conflictingActions = ['view', 'edit'];

      return role.permissions.some((p) => {
        const [action, res] = p.split(':');
        return (
          res === resource &&
          action !== newPermission.split(':')[0] &&
          conflictingActions.includes(action)
        );
      });
    };

    const testRole: Role = {
      name: 'test',
      permissions: ['view:config'],
    };

    // This is actually not a conflict in our model, but demonstrates the check
    expect(hasConflict(testRole, 'edit:config')).toBe(true);
  });

  it('should export permission matrix to CSV format', () => {
    const exportToCSV = () => {
      const header = ['Permission', 'Description', ...roles.map((r) => r.name)];
      const rows = permissions.map((permission) => [
        permission.id,
        permission.description,
        ...roles.map((role) =>
          role.permissions.includes(permission.id) ? 'Yes' : 'No'
        ),
      ]);

      return [header, ...rows];
    };

    const csv = exportToCSV();
    expect(csv[0]).toContain('Permission');
    expect(csv[0]).toContain('super_admin');
    expect(csv.length).toBe(permissions.length + 1);
  });
});
