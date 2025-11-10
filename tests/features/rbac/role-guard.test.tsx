import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleGuard from '../../../src/components/auth/RoleGuard';

describe('RoleGuard - Component Rendering Based on Permissions', () => {
  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    role: 'viewer',
  };

  beforeEach(() => {
    // Reset any mocks
  });

  it('should hide component for unauthorized users', () => {
    render(
      <RoleGuard requiredRole="admin" userRole="viewer">
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should show component for authorized users', () => {
    render(
      <RoleGuard requiredRole="viewer" userRole="viewer">
        <div>Public Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Public Content')).toBeInTheDocument();
  });

  it('should show component for super_admin regardless of required role', () => {
    render(
      <RoleGuard requiredRole="operator" userRole="super_admin">
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should support multiple allowed roles', () => {
    render(
      <RoleGuard
        requiredRole={['operator', 'analyst']}
        userRole="analyst"
      >
        <div>Multi-Role Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Multi-Role Content')).toBeInTheDocument();
  });

  it('should render fallback UI for unauthorized access', () => {
    render(
      <RoleGuard
        requiredRole="admin"
        userRole="viewer"
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should handle null user gracefully', () => {
    render(
      <RoleGuard requiredRole="viewer" userRole={null as any}>
        <div>Protected Content</div>
      </RoleGuard>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should support permission-based access', () => {
    const hasPermission = (userRole: string, permission: string): boolean => {
      const rolePermissions: Record<string, string[]> = {
        super_admin: ['view:*', 'edit:*', 'manage:*'],
        operator: ['view:*', 'manage:queue', 'suspend:queue'],
        analyst: ['view:*'],
        viewer: ['view:metrics', 'view:queue'],
      };

      return rolePermissions[userRole]?.some((p) => {
        if (p.endsWith(':*')) {
          return permission.startsWith(p.slice(0, -1));
        }
        return p === permission;
      }) ?? false;
    };

    expect(hasPermission('viewer', 'view:metrics')).toBe(true);
    expect(hasPermission('viewer', 'edit:config')).toBe(false);
    expect(hasPermission('operator', 'manage:queue')).toBe(true);
  });
});
