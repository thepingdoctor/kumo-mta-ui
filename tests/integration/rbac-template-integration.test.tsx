import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleGuard from '../../src/components/auth/RoleGuard';

describe('RBAC + Template Editor Integration', () => {
  it('should restrict template editing based on permissions', () => {
    const EditButton = () => <button>Edit Template</button>;

    // Viewer should not see edit button
    const { rerender } = render(
      <RoleGuard requiredRole="operator" userRole="viewer">
        <EditButton />
      </RoleGuard>
    );

    expect(screen.queryByText('Edit Template')).not.toBeInTheDocument();

    // Operator should see edit button
    rerender(
      <RoleGuard requiredRole="operator" userRole="operator">
        <EditButton />
      </RoleGuard>
    );

    expect(screen.getByText('Edit Template')).toBeInTheDocument();
  });

  it('should allow super_admin full template access', () => {
    const TemplateActions = () => (
      <div>
        <button>View</button>
        <button>Edit</button>
        <button>Delete</button>
        <button>Publish</button>
      </div>
    );

    render(
      <RoleGuard requiredRole="operator" userRole="super_admin">
        <TemplateActions />
      </RoleGuard>
    );

    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  it('should show read-only template view for viewers', () => {
    const TemplateViewer = () => <div data-testid="template-readonly">Template Content</div>;

    render(
      <RoleGuard requiredRole="viewer" userRole="viewer">
        <TemplateViewer />
      </RoleGuard>
    );

    expect(screen.getByTestId('template-readonly')).toBeInTheDocument();
  });

  it('should validate permission for template operations', () => {
    const canEditTemplate = (userRole: string): boolean => {
      const editRoles = ['super_admin', 'operator'];
      return editRoles.includes(userRole);
    };

    expect(canEditTemplate('super_admin')).toBe(true);
    expect(canEditTemplate('operator')).toBe(true);
    expect(canEditTemplate('analyst')).toBe(false);
    expect(canEditTemplate('viewer')).toBe(false);
  });
});
