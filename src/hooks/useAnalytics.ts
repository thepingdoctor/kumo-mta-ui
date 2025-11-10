/**
 * React hook for analytics data fetching and aggregation
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiService } from '../services/api';

export interface AnalyticsData {
  metrics: {
    messages_sent: number;
    bounces: number;
    delayed: number;
    throughput: number;
  };
  bounce_distribution: {
    hard_bounces: number;
    soft_bounces: number;
    block_bounces: number;
    complaint_bounces: number;
  };
  queue_status: {
    waiting: number;
    processing: number;
    completed: number;
  };
  top_domains: Array<{
    domain: string;
    message_count: number;
    success_rate: number;
  }>;
  time_series: Array<{
    timestamp: string;
    messages_sent: number;
    bounces: number;
  }>;
}

export interface UseAnalyticsOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export interface UseAnalyticsReturn extends UseQueryResult<AnalyticsData> {
  successRate: number;
  queueEfficiency: number;
}

/**
 * Hook for fetching comprehensive analytics data
 */
export const useAnalytics = (
  options: UseAnalyticsOptions = {}
): UseAnalyticsReturn => {
  const { refetchInterval = 30000, enabled = true } = options;

  const query = useQuery({
    queryKey: ['analytics-comprehensive'],
    queryFn: async () => {
      const [kumoMetrics, bounceData, queueMetrics] = await Promise.all([
        apiService.kumomta.getMetrics(),
        apiService.kumomta.getBounces(),
        apiService.queue.getMetrics(),
      ]);

      // Aggregate data
      const analyticsData: AnalyticsData = {
        metrics: {
          messages_sent: kumoMetrics.data.messages_sent || 0,
          bounces: kumoMetrics.data.bounces || 0,
          delayed: kumoMetrics.data.delayed || 0,
          throughput: kumoMetrics.data.throughput || 0,
        },
        bounce_distribution: {
          hard_bounces: bounceData.data.hard_bounces || 0,
          soft_bounces: bounceData.data.soft_bounces || 0,
          block_bounces: bounceData.data.block_bounces || 0,
          complaint_bounces: bounceData.data.complaint_bounces || 0,
        },
        queue_status: {
          waiting: queueMetrics.data.totalWaiting || 0,
          processing: queueMetrics.data.totalProcessing || 0,
          completed: queueMetrics.data.totalCompleted || 0,
        },
        top_domains: bounceData.data.top_domains || [],
        time_series: kumoMetrics.data.time_series || [],
      };

      return analyticsData;
    },
    refetchInterval,
    enabled,
    retry: 3,
  });

  // Calculate derived metrics
  const successRate =
    query.data
      ? ((query.data.metrics.messages_sent - query.data.metrics.bounces) /
          (query.data.metrics.messages_sent || 1)) *
        100
      : 0;

  const queueEfficiency =
    query.data
      ? (query.data.queue_status.completed /
          (query.data.queue_status.completed +
            query.data.queue_status.waiting +
            query.data.queue_status.processing || 1)) *
        100
      : 0;

  return {
    ...query,
    successRate,
    queueEfficiency,
  };
};
