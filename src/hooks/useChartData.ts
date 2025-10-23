import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';

interface MetricDataPoint {
  timestamp: string;
  value: number;
}

interface ChartDataReturn {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor?: string;
    tension: number;
  }[];
}

/**
 * Custom hook for managing real-time chart data with historical metrics
 */
export const useChartData = (metricKey: string = 'messages_sent', maxDataPoints: number = 24) => {
  const [historicalData, setHistoricalData] = useState<MetricDataPoint[]>([]);

  // Fetch current metrics every 5 seconds
  const { data: currentMetrics } = useQuery({
    queryKey: ['kumo-metrics-chart'],
    queryFn: async () => {
      const response = await apiService.kumomta.getMetrics();
      return response.data;
    },
    refetchInterval: 5000,
    retry: 3,
  });

  // Update historical data when new metrics arrive
  useEffect(() => {
    if (currentMetrics && currentMetrics[metricKey] !== undefined) {
      const now = new Date();
      const timestamp = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      setHistoricalData(prev => {
        const newData = [
          ...prev,
          { timestamp, value: currentMetrics[metricKey] }
        ];

        // Keep only the last maxDataPoints
        if (newData.length > maxDataPoints) {
          return newData.slice(newData.length - maxDataPoints);
        }
        return newData;
      });
    }
  }, [currentMetrics, metricKey, maxDataPoints]);

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo<ChartDataReturn>(() => {
    if (historicalData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Loading...',
          data: [],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        }],
      };
    }

    return {
      labels: historicalData.map(d => d.timestamp),
      datasets: [{
        label: 'Emails Sent',
        data: historicalData.map(d => d.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      }],
    };
  }, [historicalData]);

  return {
    chartData,
    isLoading: historicalData.length === 0,
    dataPointCount: historicalData.length,
  };
};
