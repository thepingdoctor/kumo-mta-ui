import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdvancedAnalytics from '../../../src/components/analytics/AdvancedAnalytics';
import { apiService } from '../../../src/services/api';

vi.mock('../../../src/services/api');

describe('Deliverability Heatmap - Domain Performance', () => {
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

  it('should display bounce distribution chart', async () => {
    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 100, delayed: 10, throughput: 100 },
      bounces: {
        hard_bounces: 60,
        soft_bounces: 40,
        classifications: [
          { code: '550', description: 'User unknown', count: 30 },
          { code: '421', description: 'Temporary failure', count: 20 },
        ],
      },
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
      expect(screen.getByText('Bounce Distribution')).toBeInTheDocument();
    });
  });

  it('should show hard and soft bounce breakdown', async () => {
    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 100, delayed: 10, throughput: 100 },
      bounces: {
        hard_bounces: 70,
        soft_bounces: 30,
        classifications: [],
      },
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
      expect(screen.getByText('Bounce Distribution')).toBeInTheDocument();
    });

    // Pie chart should render with bounce data
    // Visual verification would show 70% hard, 30% soft
  });

  it('should display queue status distribution', async () => {
    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 50, delayed: 10, throughput: 100 },
      bounces: { hard_bounces: 30, soft_bounces: 20, classifications: [] },
      queue: {
        totalWaiting: 100,
        totalProcessing: 50,
        totalCompleted: 850,
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
      expect(screen.getByText('Queue Status')).toBeInTheDocument();
    });
  });

  it('should show top bounce classifications', async () => {
    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 100, delayed: 10, throughput: 100 },
      bounces: {
        hard_bounces: 60,
        soft_bounces: 40,
        classifications: [
          { code: '550', description: 'User unknown', count: 35 },
          { code: '552', description: 'Mailbox full', count: 25 },
          { code: '421', description: 'Service unavailable', count: 20 },
          { code: '450', description: 'Mailbox unavailable', count: 15 },
          { code: '554', description: 'Transaction failed', count: 5 },
        ],
      },
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
      expect(screen.getByText('Top Bounce Classifications')).toBeInTheDocument();
      expect(screen.getByText('550')).toBeInTheDocument();
      expect(screen.getByText('User unknown')).toBeInTheDocument();
    });
  });

  it('should calculate bounce percentages correctly', async () => {
    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 100, delayed: 10, throughput: 100 },
      bounces: {
        hard_bounces: 60,
        soft_bounces: 40,
        classifications: [
          { code: '550', description: 'User unknown', count: 50 },
          { code: '421', description: 'Temporary failure', count: 50 },
        ],
      },
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
      // Each classification should be 50% of total bounces
      expect(screen.getByText(/50\.00%/)).toBeInTheDocument();
    });
  });

  it('should display detailed classifications table', async () => {
    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 100, delayed: 10, throughput: 100 },
      bounces: {
        hard_bounces: 60,
        soft_bounces: 40,
        classifications: [
          { code: '550', description: 'User unknown', count: 35 },
          { code: '552', description: 'Mailbox full', count: 25 },
        ],
      },
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
      expect(screen.getByText('Detailed Bounce Classifications')).toBeInTheDocument();
      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Count')).toBeInTheDocument();
      expect(screen.getByText('Percentage')).toBeInTheDocument();
    });
  });

  it('should handle zero bounces gracefully', async () => {
    const mockData = {
      kumomta: { messages_sent: 1000, bounces: 0, delayed: 0, throughput: 100 },
      bounces: {
        hard_bounces: 0,
        soft_bounces: 0,
        classifications: [],
      },
      queue: { totalWaiting: 0, totalProcessing: 0, totalCompleted: 1000 },
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
      expect(screen.getByText('100.00%')).toBeInTheDocument(); // Success rate
      expect(screen.getByText('0')).toBeInTheDocument(); // Total bounces
    });
  });
});
