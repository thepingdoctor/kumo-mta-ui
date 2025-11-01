/**
 * Permission Utilities Tests
 *
 * Comprehensive tests for RBAC permission checking
 */

import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
  hasMinimumRole,
  isAdmin,
  isOperatorOrHigher,
  requirePermission,
  PermissionError,
} from '../../utils/permissions';
import { Permission } from '../../types/roles';
import { User } from '../../types';

// Mock users
const adminUser: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin',
};

const operatorUser: User = {
  id: '2',
  email: 'operator@test.com',
  name: 'Operator User',
  role: 'operator',
};

const viewerUser: User = {
  id: '3',
  email: 'viewer@test.com',
  name: 'Viewer User',
  role: 'viewer',
};

const auditorUser: User = {
  id: '4',
  email: 'auditor@test.com',
  name: 'Auditor User',
  role: 'auditor',
};

describe('Permission Utilities', () => {
  describe('hasPermission', () => {
    it('should return true for admin with any permission', () => {
      expect(hasPermission(adminUser, Permission.EDIT_CONFIG)).toBe(true);
      expect(hasPermission(adminUser, Permission.MANAGE_QUEUE)).toBe(true);
      expect(hasPermission(adminUser, Permission.DELETE_USERS)).toBe(true);
    });

    it('should return true for operator with queue management permission', () => {
      expect(hasPermission(operatorUser, Permission.MANAGE_QUEUE)).toBe(true);
      expect(hasPermission(operatorUser, Permission.VIEW_QUEUE)).toBe(true);
    });

    it('should return false for operator with user management permission', () => {
      expect(hasPermission(operatorUser, Permission.MANAGE_USERS)).toBe(false);
      expect(hasPermission(operatorUser, Permission.DELETE_USERS)).toBe(false);
    });

    it('should return true for viewer with view permissions only', () => {
      expect(hasPermission(viewerUser, Permission.VIEW_DASHBOARD)).toBe(true);
      expect(hasPermission(viewerUser, Permission.VIEW_ANALYTICS)).toBe(true);
      expect(hasPermission(viewerUser, Permission.VIEW_QUEUE)).toBe(true);
    });

    it('should return false for viewer with edit permissions', () => {
      expect(hasPermission(viewerUser, Permission.EDIT_CONFIG)).toBe(false);
      expect(hasPermission(viewerUser, Permission.MANAGE_QUEUE)).toBe(false);
    });

    it('should return true for auditor with audit permissions', () => {
      expect(hasPermission(auditorUser, Permission.VIEW_AUDIT_LOGS)).toBe(true);
      expect(hasPermission(auditorUser, Permission.EXPORT_AUDIT_LOGS)).toBe(true);
      expect(hasPermission(auditorUser, Permission.VIEW_SECURITY)).toBe(true);
    });

    it('should return false for auditor with management permissions', () => {
      expect(hasPermission(auditorUser, Permission.MANAGE_SECURITY)).toBe(false);
      expect(hasPermission(auditorUser, Permission.MANAGE_USERS)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasPermission(null, Permission.VIEW_DASHBOARD)).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      expect(
        hasAnyPermission(viewerUser, [Permission.EDIT_CONFIG, Permission.VIEW_DASHBOARD])
      ).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(
        hasAnyPermission(viewerUser, [Permission.EDIT_CONFIG, Permission.MANAGE_USERS])
      ).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasAnyPermission(null, [Permission.VIEW_DASHBOARD])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      expect(
        hasAllPermissions(adminUser, [
          Permission.VIEW_DASHBOARD,
          Permission.EDIT_CONFIG,
          Permission.MANAGE_USERS,
        ])
      ).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      expect(
        hasAllPermissions(viewerUser, [Permission.VIEW_DASHBOARD, Permission.EDIT_CONFIG])
      ).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasAllPermissions(null, [Permission.VIEW_DASHBOARD])).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      expect(hasRole(adminUser, 'admin')).toBe(true);
      expect(hasRole(operatorUser, 'operator')).toBe(true);
      expect(hasRole(viewerUser, 'viewer')).toBe(true);
    });

    it('should return false for non-matching role', () => {
      expect(hasRole(adminUser, 'viewer')).toBe(false);
      expect(hasRole(viewerUser, 'admin')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasRole(null, 'admin')).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has any of the roles', () => {
      expect(hasAnyRole(adminUser, ['admin', 'operator'])).toBe(true);
      expect(hasAnyRole(viewerUser, ['viewer', 'auditor'])).toBe(true);
    });

    it('should return false if user has none of the roles', () => {
      expect(hasAnyRole(viewerUser, ['admin', 'operator'])).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasAnyRole(null, ['admin'])).toBe(false);
    });
  });

  describe('hasMinimumRole', () => {
    it('should return true for admin (highest level)', () => {
      expect(hasMinimumRole(adminUser, 'viewer')).toBe(true);
      expect(hasMinimumRole(adminUser, 'operator')).toBe(true);
      expect(hasMinimumRole(adminUser, 'admin')).toBe(true);
    });

    it('should return true for operator with minimum viewer', () => {
      expect(hasMinimumRole(operatorUser, 'viewer')).toBe(true);
      expect(hasMinimumRole(operatorUser, 'operator')).toBe(true);
    });

    it('should return false for viewer with minimum operator', () => {
      expect(hasMinimumRole(viewerUser, 'operator')).toBe(false);
      expect(hasMinimumRole(viewerUser, 'admin')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasMinimumRole(null, 'viewer')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      expect(isAdmin(adminUser)).toBe(true);
    });

    it('should return false for non-admin users', () => {
      expect(isAdmin(operatorUser)).toBe(false);
      expect(isAdmin(viewerUser)).toBe(false);
      expect(isAdmin(auditorUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isOperatorOrHigher', () => {
    it('should return true for admin and operator', () => {
      expect(isOperatorOrHigher(adminUser)).toBe(true);
      expect(isOperatorOrHigher(operatorUser)).toBe(true);
    });

    it('should return false for viewer and auditor', () => {
      expect(isOperatorOrHigher(viewerUser)).toBe(false);
      expect(isOperatorOrHigher(auditorUser)).toBe(false);
    });

    it('should return false for null user', () => {
      expect(isOperatorOrHigher(null)).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw for user with permission', () => {
      expect(() => requirePermission(adminUser, Permission.EDIT_CONFIG)).not.toThrow();
    });

    it('should throw PermissionError for user without permission', () => {
      expect(() => requirePermission(viewerUser, Permission.EDIT_CONFIG)).toThrow(
        PermissionError
      );
    });

    it('should throw PermissionError for null user', () => {
      expect(() => requirePermission(null, Permission.EDIT_CONFIG)).toThrow(PermissionError);
    });

    it('should include permission in error message', () => {
      try {
        requirePermission(viewerUser, Permission.EDIT_CONFIG);
      } catch (error) {
        expect(error).toBeInstanceOf(PermissionError);
        expect((error as PermissionError).permission).toBe(Permission.EDIT_CONFIG);
        expect((error as PermissionError).userRole).toBe('viewer');
      }
    });
  });

  describe('Role Hierarchy', () => {
    it('should respect role hierarchy for permissions', () => {
      // Admin has all permissions
      expect(hasPermission(adminUser, Permission.VIEW_DASHBOARD)).toBe(true);
      expect(hasPermission(adminUser, Permission.MANAGE_USERS)).toBe(true);

      // Operator has management but not user management
      expect(hasPermission(operatorUser, Permission.MANAGE_QUEUE)).toBe(true);
      expect(hasPermission(operatorUser, Permission.MANAGE_USERS)).toBe(false);

      // Viewer has only view permissions
      expect(hasPermission(viewerUser, Permission.VIEW_DASHBOARD)).toBe(true);
      expect(hasPermission(viewerUser, Permission.MANAGE_QUEUE)).toBe(false);

      // Auditor has security permissions
      expect(hasPermission(auditorUser, Permission.VIEW_AUDIT_LOGS)).toBe(true);
      expect(hasPermission(auditorUser, Permission.MANAGE_SECURITY)).toBe(false);
    });
  });
});
