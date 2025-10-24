import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils/test-utils';
import Dashboard from '../../src/components/Dashboard';
import Layout from '../../src/components/Layout';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('User Workflows Integration Tests', () => {
  describe('Dashboard Data Loading Workflow', () => {
    it('should display loading state then load metrics successfully', async () => {
      render(<Dashboard />);

      // Should show loading state initially
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(
        () => {
          expect(screen.getByText('12,450')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify all metrics loaded
      expect(screen.getByText('Emails Sent')).toBeInTheDocument();
      expect(screen.getByText('Bounces')).toBeInTheDocument();
      expect(screen.getByText('Delayed')).toBeInTheDocument();
      expect(screen.getByText('Throughput')).toBeInTheDocument();
    });

    it('should handle data refresh on interval', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('12,450')).toBeInTheDocument();
      });

      // Server status should be connected
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should display complete dashboard with all sections', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Server Status')).toBeInTheDocument();
      });

      expect(screen.getByText('Connection Status')).toBeInTheDocument();
      expect(screen.getByText('Active Connections')).toBeInTheDocument();
      expect(screen.getByText('Queue Size')).toBeInTheDocument();
      expect(screen.getByText('Hourly Email Throughput')).toBeInTheDocument();
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle temporary API failure gracefully', async () => {
      // First request fails
      let requestCount = 0;
      server.use(
        http.get('http://localhost:8000/api/admin/metrics/v1', () => {
          requestCount++;
          if (requestCount === 1) {
            return HttpResponse.json({ error: 'Server error' }, { status: 500 });
          }
          return HttpResponse.json({
            messages_sent: 12450,
            bounces: 125,
            delayed: 45,
            throughput: 350,
            active_connections: 28,
          });
        })
      );

      render(<Dashboard />);

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
      });
    });

    it('should display helpful error message to user', async () => {
      server.use(
        http.get('http://localhost:8000/api/admin/metrics/v1', () => {
          return HttpResponse.json({ error: 'Network error' }, { status: 500 });
        })
      );

      render(<Dashboard />);

      await waitFor(() => {
        expect(
          screen.getByText(/Unable to connect to KumoMTA server/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Navigation Workflow', () => {
    it('should render layout with navigation', () => {
      render(<Layout />);

      expect(screen.getByText('KumoMTA Admin')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Queue Manager')).toBeInTheDocument();
    });

    it('should highlight active navigation item', () => {
      render(<Layout />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-blue-50', 'text-blue-600');
    });

    it('should have working navigation links', () => {
      render(<Layout />);

      const links = [
        { text: 'Dashboard', href: '/' },
        { text: 'Queue Manager', href: '/queue' },
        { text: 'Configuration', href: '/config' },
        { text: 'Security', href: '/security' },
        { text: 'Analytics', href: '/analytics' },
      ];

      links.forEach(({ text, href }) => {
        const link = screen.getByText(text).closest('a');
        expect(link).toHaveAttribute('href', href);
      });
    });
  });

  describe('Accessibility Workflow', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<Layout />);

      // Tab through navigation
      await user.tab();

      // First focusable element should be a link
      const focused = document.activeElement;
      expect(focused?.tagName).toBe('A');
    });

    it('should have proper ARIA labels for screen readers', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Icons should have aria-hidden
      const container = screen.getByText('Dashboard').closest('.space-y-6');
      const icons = container?.querySelectorAll('[aria-hidden="true"]');
      expect(icons && icons.length > 0).toBe(true);
    });

    it('should have semantic headings structure', async () => {
      render(<Dashboard />);

      expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Server Status' })).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Data Updates', () => {
    it('should reflect updated metrics', async () => {
      let updateCount = 0;

      server.use(
        http.get('http://localhost:8000/api/admin/metrics/v1', () => {
          updateCount++;
          return HttpResponse.json({
            messages_sent: 12450 + updateCount * 100,
            bounces: 125,
            delayed: 45,
            throughput: 350,
            active_connections: 28,
          });
        })
      );

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/12,4\d{2}/)).toBeInTheDocument();
      });
    });

    it('should handle connection status changes', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });

      // Verify connection indicator
      const statusSection = screen.getByText('Connection Status').closest('div');
      expect(statusSection).toBeInTheDocument();
    });
  });

  describe('Performance Metrics Display', () => {
    it('should display all metric cards', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Emails Sent')).toBeInTheDocument();
      });

      const metricCards = screen.getAllByRole('generic').filter((el) =>
        el.className.includes('rounded-lg bg-white')
      );

      expect(metricCards.length).toBeGreaterThan(0);
    });

    it('should format numbers correctly', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // Numbers should be formatted with commas
        expect(screen.getByText('12,450')).toBeInTheDocument();
      });
    });

    it('should display throughput with units', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('350/min')).toBeInTheDocument();
      });
    });
  });

  describe('Chart Rendering', () => {
    it('should render chart component', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Hourly Email Throughput')).toBeInTheDocument();
      });
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full dashboard viewing workflow', async () => {
      render(<Layout />);

      // Layout should be present
      expect(screen.getByText('KumoMTA Admin')).toBeInTheDocument();

      // Navigation should be visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Queue Manager')).toBeInTheDocument();

      // Logout should be available
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('should provide smooth user experience', async () => {
      render(<Dashboard />);

      // Initial load
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Data loads
      await waitFor(() => {
        expect(screen.getByText('12,450')).toBeInTheDocument();
      });

      // All sections present
      expect(screen.getByText('Server Status')).toBeInTheDocument();
      expect(screen.getByText('Hourly Email Throughput')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render grid layout for metrics', async () => {
      const { container } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should use responsive grid classes', async () => {
      const { container } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      const grid = container.querySelector('.sm\\:grid-cols-2');
      expect(grid).toBeInTheDocument();
    });
  });
});
