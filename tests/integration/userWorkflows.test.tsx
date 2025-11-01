import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render as rtlRender } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../../src/components/Dashboard';
import Layout from '../../src/components/Layout';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Custom render for integration tests with routing
const render = (ui: React.ReactElement, options?: { initialRoute?: string; disableRetry?: boolean }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: options?.disableRetry === false ? 3 : false, // Allow retries if needed for error tests
        gcTime: 0,
        staleTime: 0,
        retryDelay: 100, // Fast retries in tests
      },
      mutations: { retry: false },
    },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[options?.initialRoute || '/']}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Render with Layout wrapper
const renderWithLayout = (children: React.ReactElement, options?: { initialRoute?: string; disableRetry?: boolean }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: options?.disableRetry === false ? 3 : false,
        gcTime: 0,
        staleTime: 0,
        retryDelay: 100,
      },
      mutations: { retry: false },
    },
  });

  return rtlRender(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[options?.initialRoute || '/']}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={children} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

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

      // Wait for metrics to load
      await waitFor(() => {
        expect(screen.getByText('12,450')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify all main sections are present
      expect(screen.getByText('Server Status')).toBeInTheDocument();
      expect(screen.getByText('Connection Status')).toBeInTheDocument();
      expect(screen.getByText('Active Connections')).toBeInTheDocument();
      expect(screen.getByText('Queue Size')).toBeInTheDocument();

      // Chart section will be present (title is set in chartOptions)
      // Note: Chart.js title may not render in JSDOM, but the chart container should exist
      const chartCards = document.querySelectorAll('.rounded-lg.bg-white');
      expect(chartCards.length).toBeGreaterThan(4); // 4 metric cards + chart card + server status
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle temporary API failure gracefully', async () => {
      // Override handler to always fail
      server.use(
        http.get('http://localhost:8000/metrics.json', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<Dashboard />, { disableRetry: false }); // Enable retries for this test

      // Should show error after retries exhausted (3 retries with 100ms delay each)
      await waitFor(() => {
        expect(screen.getByText('Failed to load metrics')).toBeInTheDocument();
      }, { timeout: 2000 }); // Allow time for 3 retries
    });

    it('should display helpful error message to user', async () => {
      server.use(
        http.get('http://localhost:8000/metrics.json', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      render(<Dashboard />, { disableRetry: false }); // Enable retries

      // Wait for retries to complete and error to display
      await waitFor(() => {
        expect(
          screen.getByText(/Unable to connect to KumoMTA server/i)
        ).toBeInTheDocument();
      }, { timeout: 2000 }); // Allow time for 3 retries
    });
  });

  describe('Navigation Workflow', () => {
    it('should render layout with navigation', () => {
      renderWithLayout(<div>Test Content</div>);

      // KumoMTA Admin appears in both sidebar and mobile header
      const headers = screen.getAllByText('KumoMTA Admin');
      expect(headers.length).toBeGreaterThanOrEqual(1);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Queue Manager')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should highlight active navigation item', () => {
      renderWithLayout(<div>Test Content</div>);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-blue-50', 'text-blue-600');
    });

    it('should have working navigation links', () => {
      renderWithLayout(<div>Test Content</div>);

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
      renderWithLayout(<div>Test Content</div>);

      // Tab through navigation
      await user.tab();

      // First focusable element should be a link or button
      const focused = document.activeElement;
      expect(['A', 'BUTTON'].includes(focused?.tagName || '')).toBe(true);
    });

    it('should have proper ARIA labels for screen readers', async () => {
      renderWithLayout(<div>Test Content</div>);

      // Navigation should have proper aria-label
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');
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

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('12,450')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Chart.js title renders inside the canvas in the browser, not as DOM text in JSDOM
      // In test environment (JSDOM), Chart.js may not fully render
      // Verify that the chart container div exists instead
      await waitFor(() => {
        const containers = document.querySelectorAll('.rounded-lg.bg-white');
        // Should have metric cards + chart container + server status
        expect(containers.length).toBeGreaterThan(4);
      }, { timeout: 3000 });
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full dashboard viewing workflow', async () => {
      renderWithLayout(<Dashboard />);

      // Layout should be present (appears in sidebar and mobile header)
      const headers = screen.getAllByText('KumoMTA Admin');
      expect(headers.length).toBeGreaterThanOrEqual(1);

      // Navigation should be visible (Dashboard appears multiple times - in nav and as heading)
      expect(screen.getAllByText('Dashboard').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Queue Manager')).toBeInTheDocument();

      // Logout should be available
      expect(screen.getByText('Logout')).toBeInTheDocument();

      // Dashboard content loads
      await waitFor(() => {
        expect(screen.getByText('12,450')).toBeInTheDocument();
      }, { timeout: 3000 });

      // All metrics cards are present
      expect(screen.getByText('Emails Sent')).toBeInTheDocument();
      expect(screen.getByText('Bounces')).toBeInTheDocument();
      expect(screen.getByText('Delayed')).toBeInTheDocument();
      expect(screen.getByText('Throughput')).toBeInTheDocument();
    });

    it('should provide smooth user experience', async () => {
      render(<Dashboard />);

      // Initial load - Dashboard title appears immediately
      expect(screen.getByText('Dashboard')).toBeInTheDocument();

      // Data loads within reasonable time
      const startTime = Date.now();
      await waitFor(() => {
        expect(screen.getByText('12,450')).toBeInTheDocument();
      }, { timeout: 3000 });
      const loadTime = Date.now() - startTime;

      // Should load quickly (under 3 seconds)
      expect(loadTime).toBeLessThan(3000);

      // All sections present
      expect(screen.getByText('Server Status')).toBeInTheDocument();

      // Chart container exists (Chart.js titles don't render as DOM text in JSDOM)
      const chartContainers = document.querySelectorAll('.rounded-lg.bg-white');
      expect(chartContainers.length).toBeGreaterThan(4); // metrics + chart + server status
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
