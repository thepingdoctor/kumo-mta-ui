/**
 * React hook for historical trend data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { apiService } from '../services/api';

export interface TrendDataPoint {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface TrendData {
  hourly: TrendDataPoint[];
  daily: TrendDataPoint[];
  weekly: TrendDataPoint[];
}

export interface UseTrendDataOptions {
  metric: 'messages_sent' | 'bounces' | 'throughput' | 'queue_size';
  timeRange?: 'hour' | 'day' | 'week' | 'month';
  enabled?: boolean;
}

export interface UseTrendDataReturn extends UseQueryResult<TrendData> {
  currentValue: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

/**
 * Hook for fetching historical trend data
 */
export const useTrendData = (
  options: UseTrendDataOptions
): UseTrendDataReturn => {
  const { metric, timeRange = 'day', enabled = true } = options;

  const query = useQuery({
    queryKey: ['trend-data', metric, timeRange],
    queryFn: async () => {
      const response = await apiService.kumomta.getMetrics();
      const metricsData = response.data;

      // Generate mock historical data (replace with actual API when available)
      const now = new Date();
      const hourlyData: TrendDataPoint[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(now.getTime() - (23 - i) * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 1000) + 500,
        label: `${23 - i}h ago`,
      }));

      const dailyData: TrendDataPoint[] = Array.from({ length: 7 }, (_, i) => ({
        timestamp: new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 10000) + 5000,
        label: `${6 - i}d ago`,
      }));

      const weeklyData: TrendDataPoint[] = Array.from({ length: 4 }, (_, i) => ({
        timestamp: new Date(now.getTime() - (3 - i) * 7 * 24 * 60 * 60 * 1000),
        value: Math.floor(Math.random() * 50000) + 25000,
        label: `${3 - i}w ago`,
      }));

      const trendData: TrendData = {
        hourly: hourlyData,
        daily: dailyData,
        weekly: weeklyData,
      };

      return trendData;
    },
    enabled,
    refetchInterval: 60000, // Refetch every minute
  });

  // Calculate current value and trend
  const data = query.data;
  let currentValue = 0;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let percentChange = 0;

  if (data) {
    const timeData =
      timeRange === 'hour'
        ? data.hourly
        : timeRange === 'week'
        ? data.weekly
        : data.daily;

    if (timeData.length >= 2) {
      const latest = timeData[timeData.length - 1];
      const previous = timeData[timeData.length - 2];

      currentValue = latest.value;
      const change = latest.value - previous.value;
      percentChange = (change / (previous.value || 1)) * 100;

      if (Math.abs(percentChange) < 5) {
        trend = 'stable';
      } else if (change > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }
    }
  }

  return {
    ...query,
    currentValue,
    trend,
    percentChange,
  };
};
