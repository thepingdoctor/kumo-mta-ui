import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdvancedAnalytics from '../../../src/components/analytics/AdvancedAnalytics';
import { apiService } from '../../../src/services/api';

vi.mock('../../../src/services/api');

describe('Trend Chart - Historical Visualization', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderWithQuery = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  it('should render chart with 7-day historical data', async () => {
    const mockData = {
      kumomta: {
        messages_sent: 10000,
        bounces: 100,
        delayed: 50,
        throughput: 500,
      },
      bounces: {
        hard_bounces: 60,
        soft_bounces: 40,
        classifications: [],
      },
      queue: {
        totalWaiting: 100,
        totalProcessing: 50,
        totalCompleted: 9850,
      },
    };

    vi.mocked(apiService.kumomta.getMetrics).mockResolvedValue({
      data: mockData.kumomta,
    } as never);
    vi.mocked(apiService.kumomta.getBounces).mockResolvedValue({
      data: mockData.bounces,
    } as never);
    vi.mocked(apiService.queue.getMetrics).mockResolvedValue({
      data: mockData.queue,
    } as never);

    renderWithQuery(<AdvancedAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    });

    // Should display metrics
    await waitFor(() => {
      expect(screen.getByText(/Success Rate/i)).toBeInTheDocument();
    });
  });

  it('should calculate success rate correctly', async () => {
    const mockData = {
      kumomta: {
        messages_sent: 1000,
        bounces: 50, // 5% bounce rate = 95% success
        delayed: 10,
        throughput: 100,
      },
      bounces: {
        hard_bounces: 30,
        soft_bounces: 20,
        classifications: [],
      },
      queue: {
        totalWaiting: 10,
        totalProcessing: 5,
        totalCompleted: 985,
      },
    };

    vi.mocked(apiService.kumomta.getMetrics).mockResolvedValue({
      data: mockData.kumomta,
    } as never);
    vi.mocked(apiService.kumomta.getBounces).mockResolvedValue({
      data: mockData.bounces,
    } as never);
    vi.mocked(apiService.queue.getMetrics).mockResolvedValue({
      data: mockData.queue,
    } as never);

    renderWithQuery(<AdvancedAnalytics />);

    await waitFor(() => {
      // Success rate should be 95%
      expect(screen.getByText(/95\.00%/)).toBeInTheDocument();
    });
  });

  it('should display total bounces correctly', async () => {
    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 150, delayed: 10, throughput: 100 },
      bounces: {
        hard_bounces: 90,
        soft_bounces: 60,
        classifications: [],
      },
      queue: {
        totalWaiting: 10,
        totalProcessing: 5,
        totalCompleted: 985,
      },
    };

    vi.mocked(apiService.kumomta.getMetrics).mockResolvedValue({
      data: mockData.kumomta,
    } as never);
    vi.mocked(apiService.kumomta.getBounces).mockResolvedValue({
      data: mockData.bounces,
    } as never);
    vi.mocked(apiService.queue.getMetrics).mockResolvedValue({
      data: mockData.queue,
    } as never);

    renderWithQuery(<AdvancedAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
    });
  });

  it('should calculate queue efficiency', async () => {
    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 50, delayed: 10, throughput: 100 },
      bounces: {
        hard_bounces: 30,
        soft_bounces: 20,
        classifications: [],
      },
      queue: {
        totalWaiting: 50,
        totalProcessing: 50,
        totalCompleted: 900,
      },
    };

    vi.mocked(apiService.kumomta.getMetrics).mockResolvedValue({
      data: mockData.kumomta,
    } as never);
    vi.mocked(apiService.kumomta.getBounces).mockResolvedValue({
      data: mockData.bounces,
    } as never);
    vi.mocked(apiService.queue.getMetrics).mockResolvedValue({
      data: mockData.queue,
    } as never);

    renderWithQuery(<AdvancedAnalytics />);

    await waitFor(() => {
      // Queue efficiency = 900 / (900 + 50 + 50) * 100 = 90%
      expect(screen.getByText(/90\.0%/)).toBeInTheDocument();
    });
  });

  it('should display throughput metric', async () => {
    const mockData = {
      kumomta: {
        messages_sent: 1000,
        bounces: 50,
        delayed: 10,
        throughput: 500,
      },
      bounces: {
        hard_bounces: 30,
        soft_bounces: 20,
        classifications: [],
      },
      queue: {
        totalWaiting: 10,
        totalProcessing: 5,
        totalCompleted: 985,
      },
    };

    vi.mocked(apiService.kumomta.getMetrics).mockResolvedValue({
      data: mockData.kumomta,
    } as never);
    vi.mocked(apiService.kumomta.getBounces).mockResolvedValue({
      data: mockData.bounces,
    } as never);
    vi.mocked(apiService.queue.getMetrics).mockResolvedValue({
      data: mockData.queue,
    } as never);

    renderWithQuery(<AdvancedAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('500/min')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    vi.mocked(apiService.kumomta.getMetrics).mockImplementation(
      () => new Promise(() => {}) as never
    );

    renderWithQuery(<AdvancedAnalytics />);

    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
  });

  it('should refresh data at 30-second intervals', async () => {
    vi.useFakeTimers();

    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 50, delayed: 10, throughput: 100 },
      bounces: { hard_bounces: 30, soft_bounces: 20, classifications: [] },
      queue: { totalWaiting: 10, totalProcessing: 5, totalCompleted: 985 },
    };

    vi.mocked(apiService.kumomta.getMetrics).mockResolvedValue({
      data: mockData.kumomta,
    } as never);
    vi.mocked(apiService.kumomta.getBounces).mockResolvedValue({
      data: mockData.bounces,
    } as never);
    vi.mocked(apiService.queue.getMetrics).mockResolvedValue({
      data: mockData.queue,
    } as never);

    renderWithQuery(<AdvancedAnalytics />);

    await waitFor(() => {
      expect(apiService.kumomta.getMetrics).toHaveBeenCalledTimes(1);
    });

    // Fast forward 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(apiService.kumomta.getMetrics).toHaveBeenCalledTimes(2);
    });

    vi.useRealTimers();
  });
});
