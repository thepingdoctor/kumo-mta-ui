/**
 * RBAC Component Tests
 *
 * Tests for ProtectedAction, RoleGuard, and RoleBadge components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import ProtectedAction, { PermissionDenied } from '../../components/auth/ProtectedAction';
import RoleGuard from '../../components/auth/RoleGuard';
import RoleBadge from '../../components/auth/RoleBadge';
import { Permission } from '../../types/roles';
import { User } from '../../types';

// Mock users
const adminUser: User = {
  id: '1',
  email: 'admin@test.com',
  name: 'Admin User',
  role: 'admin',
};

const viewerUser: User = {
  id: '2',
  email: 'viewer@test.com',
  name: 'Viewer User',
  role: 'viewer',
};

// Wrapper component with router
const RouterWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ProtectedAction Component', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('should render children when user has permission', () => {
    useAuthStore.setState({ user: adminUser, token: 'token', isAuthenticated: true });

    render(
      <ProtectedAction permission={Permission.EDIT_CONFIG}>
        <button>Edit Config</button>
      </ProtectedAction>
    );

    expect(screen.getByRole('button', { name: /edit config/i })).toBeInTheDocument();
  });

  it('should not render children when user lacks permission', () => {
    useAuthStore.setState({ user: viewerUser, token: 'token', isAuthenticated: true });

    render(
      <ProtectedAction permission={Permission.EDIT_CONFIG}>
        <button>Edit Config</button>
      </ProtectedAction>
    );

    expect(screen.queryByRole('button', { name: /edit config/i })).not.toBeInTheDocument();
  });

  it('should render fallback when permission denied', () => {
    useAuthStore.setState({ user: viewerUser, token: 'token', isAuthenticated: true });

    render(
      <ProtectedAction permission={Permission.EDIT_CONFIG} fallback={<div>No Access</div>}>
        <button>Edit Config</button>
      </ProtectedAction>
    );

    expect(screen.getByText(/no access/i)).toBeInTheDocument();
  });

  it('should show disabled state when showDisabled is true', () => {
    useAuthStore.setState({ user: viewerUser, token: 'token', isAuthenticated: true });

    render(
      <ProtectedAction permission={Permission.EDIT_CONFIG} showDisabled>
        <button>Edit Config</button>
      </ProtectedAction>
    );

    const button = screen.getByRole('button', { name: /edit config/i });
    expect(button).toBeDisabled();
  });

  it('should show denied message when showDeniedMessage is true', () => {
    useAuthStore.setState({ user: viewerUser, token: 'token', isAuthenticated: true });

    render(
      <ProtectedAction
        permission={Permission.EDIT_CONFIG}
        showDeniedMessage
        deniedMessage="Custom denied message"
        hideIfDenied={false}
      >
        <button>Edit Config</button>
      </ProtectedAction>
    );

    expect(screen.getByText(/custom denied message/i)).toBeInTheDocument();
  });

  it('should work with anyPermissions', () => {
    useAuthStore.setState({ user: viewerUser, token: 'token', isAuthenticated: true });

    render(
      <ProtectedAction
        anyPermissions={[Permission.VIEW_DASHBOARD, Permission.VIEW_ANALYTICS]}
      >
        <div>Dashboard Content</div>
      </ProtectedAction>
    );

    expect(screen.getByText(/dashboard content/i)).toBeInTheDocument();
  });

  it('should work with allPermissions', () => {
    useAuthStore.setState({ user: adminUser, token: 'token', isAuthenticated: true });

    render(
      <ProtectedAction
        allPermissions={[Permission.VIEW_DASHBOARD, Permission.EDIT_CONFIG]}
      >
        <div>Admin Content</div>
      </ProtectedAction>
    );

    expect(screen.getByText(/admin content/i)).toBeInTheDocument();
  });
});

describe('PermissionDenied Component', () => {
  it('should render with default message', () => {
    render(<PermissionDenied />);
    expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
  });

  it('should render with custom message', () => {
    render(<PermissionDenied message="You cannot access this resource" />);
    expect(screen.getByText(/you cannot access this resource/i)).toBeInTheDocument();
  });
});

describe('RoleGuard Component', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false });
  });

  it('should render children when user has required role', () => {
    useAuthStore.setState({ user: adminUser, token: 'token', isAuthenticated: true });

    render(
      <RouterWrapper>
        <RoleGuard role="admin">
          <div>Admin Content</div>
        </RoleGuard>
      </RouterWrapper>
    );

    expect(screen.getByText(/admin content/i)).toBeInTheDocument();
  });

  it('should show access denied when user lacks role', () => {
    useAuthStore.setState({ user: viewerUser, token: 'token', isAuthenticated: true });

    render(
      <RouterWrapper>
        <RoleGuard role="admin" showAccessDenied>
          <div>Admin Content</div>
        </RoleGuard>
      </RouterWrapper>
    );

    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(screen.queryByText(/admin content/i)).not.toBeInTheDocument();
  });

  it('should work with anyRoles', () => {
    useAuthStore.setState({ user: viewerUser, token: 'token', isAuthenticated: true });

    render(
      <RouterWrapper>
        <RoleGuard anyRoles={['admin', 'viewer']}>
          <div>Content for Admin or Viewer</div>
        </RoleGuard>
      </RouterWrapper>
    );

    expect(screen.getByText(/content for admin or viewer/i)).toBeInTheDocument();
  });

  it('should work with permission', () => {
    useAuthStore.setState({ user: adminUser, token: 'token', isAuthenticated: true });

    render(
      <RouterWrapper>
        <RoleGuard permission={Permission.MANAGE_USERS}>
          <div>User Management</div>
        </RoleGuard>
      </RouterWrapper>
    );

    expect(screen.getByText(/user management/i)).toBeInTheDocument();
  });

  it('should work with minimumRole', () => {
    useAuthStore.setState({ user: adminUser, token: 'token', isAuthenticated: true });

    render(
      <RouterWrapper>
        <RoleGuard minimumRole="operator">
          <div>Operator or Higher</div>
        </RoleGuard>
      </RouterWrapper>
    );

    expect(screen.getByText(/operator or higher/i)).toBeInTheDocument();
  });
});

describe('RoleBadge Component', () => {
  it('should render admin badge correctly', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText(/administrator/i)).toBeInTheDocument();
  });

  it('should render operator badge correctly', () => {
    render(<RoleBadge role="operator" />);
    expect(screen.getByText(/operator/i)).toBeInTheDocument();
  });

  it('should render viewer badge correctly', () => {
    render(<RoleBadge role="viewer" />);
    expect(screen.getByText(/viewer/i)).toBeInTheDocument();
  });

  it('should render auditor badge correctly', () => {
    render(<RoleBadge role="auditor" />);
    expect(screen.getByText(/auditor/i)).toBeInTheDocument();
  });

  it('should render abbreviated version', () => {
    render(<RoleBadge role="admin" abbreviated />);
    expect(screen.getByText(/ADMIN/i)).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { rerender } = render(<RoleBadge role="admin" size="sm" />);
    expect(screen.getByText(/administrator/i)).toHaveClass('text-xs');

    rerender(<RoleBadge role="admin" size="md" />);
    expect(screen.getByText(/administrator/i)).toHaveClass('text-sm');

    rerender(<RoleBadge role="admin" size="lg" />);
    expect(screen.getByText(/administrator/i)).toHaveClass('text-base');
  });

  it('should show icon by default', () => {
    const { container } = render(<RoleBadge role="admin" showIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    const { container } = render(<RoleBadge role="admin" showIcon={false} />);
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });
});
