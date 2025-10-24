import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '../utils/test-utils';
import Layout from '../../src/components/Layout';
import { useAuthStore } from '../../src/store/authStore';

expect.extend(toHaveNoViolations);

describe('Layout Component', () => {
  describe('Rendering', () => {
    it('should render the main layout structure', () => {
      render(<Layout />);

      expect(screen.getByText('KumoMTA Admin')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      render(<Layout />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Queue Manager')).toBeInTheDocument();
      expect(screen.getByText('Configuration')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Analytics')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should render navigation icons', () => {
      const { container } = render(<Layout />);

      // Check that icons are rendered (lucide-react icons have specific classes)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Navigation', () => {
    it('should highlight active route', () => {
      render(<Layout />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-blue-50', 'text-blue-600');
    });

    it('should have correct href attributes', () => {
      render(<Layout />);

      expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/');
      expect(screen.getByText('Queue Manager').closest('a')).toHaveAttribute('href', '/queue');
      expect(screen.getByText('Configuration').closest('a')).toHaveAttribute('href', '/config');
      expect(screen.getByText('Security').closest('a')).toHaveAttribute('href', '/security');
      expect(screen.getByText('Analytics').closest('a')).toHaveAttribute('href', '/analytics');
    });

    it('should apply hover styles to navigation links', () => {
      render(<Layout />);

      const queueLink = screen.getByText('Queue Manager').closest('a');
      expect(queueLink).toHaveClass('hover:bg-gray-50');
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout when logout button is clicked', async () => {
      const user = userEvent.setup();
      const logoutMock = vi.fn();

      // Mock the auth store
      vi.spyOn(useAuthStore, 'getState').mockReturnValue({
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
        token: 'mock-token',
        login: vi.fn(),
        logout: logoutMock,
        isAuthenticated: true,
      });

      render(<Layout />);

      const logoutButton = screen.getByText('Logout');
      await user.click(logoutButton);

      expect(logoutMock).toHaveBeenCalledTimes(1);
    });

    it('should have logout button with correct styling', () => {
      render(<Layout />);

      const logoutButton = screen.getByText('Logout').closest('button');
      expect(logoutButton).toHaveClass('hover:bg-gray-50');
    });
  });

  describe('Layout Structure', () => {
    it('should have sidebar with correct width', () => {
      const { container } = render(<Layout />);

      const sidebar = container.querySelector('.w-64');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render outlet for child routes', () => {
      const { container } = render(<Layout />);

      // The Outlet component from react-router-dom should be present
      expect(container.querySelector('.flex-1')).toBeInTheDocument();
    });

    it('should have proper padding on main content area', () => {
      const { container } = render(<Layout />);

      const mainContent = container.querySelector('.p-8');
      expect(mainContent).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have overflow-auto on main content', () => {
      const { container } = render(<Layout />);

      const mainContent = container.querySelector('.overflow-auto');
      expect(mainContent).toBeInTheDocument();
    });

    it('should have min-height on container', () => {
      const { container } = render(<Layout />);

      const container_div = container.querySelector('.min-h-screen');
      expect(container_div).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Layout />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have semantic navigation element', () => {
      const { container } = render(<Layout />);

      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('should have accessible heading for branding', () => {
      render(<Layout />);

      expect(screen.getByRole('heading', { name: 'KumoMTA Admin' })).toBeInTheDocument();
    });

    it('should have accessible button for logout', () => {
      render(<Layout />);

      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });
  });

  describe('Visual Design', () => {
    it('should apply shadow to sidebar', () => {
      const { container } = render(<Layout />);

      const sidebar = container.querySelector('.shadow-lg');
      expect(sidebar).toBeInTheDocument();
    });

    it('should have gray background on main container', () => {
      const { container } = render(<Layout />);

      const main = container.querySelector('.bg-gray-50');
      expect(main).toBeInTheDocument();
    });

    it('should display navigation icons with correct size', () => {
      const { container } = render(<Layout />);

      const icons = container.querySelectorAll('.h-5.w-5');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
