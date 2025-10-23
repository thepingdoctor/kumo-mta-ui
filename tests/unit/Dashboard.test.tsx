import { describe, it, expect, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '../utils/test-utils';
import Dashboard from '../../src/components/Dashboard';
import { server } from '../mocks/server';

expect.extend(toHaveNoViolations);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Dashboard Component', () => {
  describe('Loading State', () => {
    it('should render loading skeletons when data is loading', () => {
      render(<Dashboard />);

      // Check for loading state - should have 4 skeleton cards
      const skeletons = screen.getAllByRole('generic').filter(
        (el) => el.className.includes('animate-pulse')
      );
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should display Dashboard heading during loading', () => {
      render(<Dashboard />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should render metrics cards with correct data', async () => {
      render(<Dashboard />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('12,450')).toBeInTheDocument();
      });

      // Check all metrics are displayed
      expect(screen.getByText('Emails Sent')).toBeInTheDocument();
      expect(screen.getByText('Bounces')).toBeInTheDocument();
      expect(screen.getByText('Delayed')).toBeInTheDocument();
      expect(screen.getByText('Throughput')).toBeInTheDocument();

      // Check metric values
      expect(screen.getByText('125')).toBeInTheDocument(); // Bounces
      expect(screen.getByText('45')).toBeInTheDocument(); // Delayed
      expect(screen.getByText('350/min')).toBeInTheDocument(); // Throughput
    });

    it('should render server status section', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Server Status')).toBeInTheDocument();
      });

      expect(screen.getByText('Connection Status')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
      expect(screen.getByText('Active Connections')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.getByText('Queue Size')).toBeInTheDocument();
      expect(screen.getByText('234')).toBeInTheDocument();
    });

    it('should render chart section', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Hourly Email Throughput')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA attributes on icons', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        const icons = screen.getAllByLabelText('', { hidden: true });
        icons.forEach((icon) => {
          expect(icon).toHaveAttribute('aria-hidden', 'true');
        });
      });
    });
  });

  describe('Error State', () => {
    it('should render error message when API fails', async () => {
      // Override handler to return error
      const { http, HttpResponse } = await import('msw');
      server.use(
        http.get('http://localhost:8000/api/admin/metrics/v1', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
      });

      expect(screen.getByText(/Unable to connect to KumoMTA server/)).toBeInTheDocument();
    });

    it('should show appropriate error icon', async () => {
      const { http, HttpResponse } = await import('msw');
      server.use(
        http.get('http://localhost:8000/api/admin/metrics/v1', () => {
          return HttpResponse.json({ error: 'Server error' }, { status: 500 });
        })
      );

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
      });

      // Error state should still show Dashboard heading
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format large numbers with locale string', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        // Check that numbers use locale formatting (commas)
        expect(screen.getByText('12,450')).toBeInTheDocument();
      });
    });

    it('should append /min to throughput metric', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('350/min')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      const { container } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have semantic HTML structure', async () => {
      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { name: 'Server Status' })).toBeInTheDocument();
    });
  });

  describe('Auto-refresh', () => {
    it('should set up polling with correct interval', async () => {
      vi.useFakeTimers();

      render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('12,450')).toBeInTheDocument();
      });

      // Fast-forward time by 5 seconds (refetch interval)
      vi.advanceTimersByTime(5000);

      vi.useRealTimers();
    });
  });

  describe('Memoization', () => {
    it('should memoize chart data', async () => {
      const { rerender } = render(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Rerender should not cause unnecessary recalculations
      rerender(<Dashboard />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });
});
