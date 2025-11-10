/**
 * React hook for predictive analytics
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useTrendData } from './useTrendData';

export interface Prediction {
  timestamp: Date;
  predicted_value: number;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  confidence: number; // 0-1
}

export interface PredictiveInsights {
  next_hour: Prediction[];
  next_day: Prediction[];
  recommendations: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    action?: string;
  }>;
  anomalies: Array<{
    timestamp: Date;
    metric: string;
    value: number;
    expected_range: { min: number; max: number };
  }>;
}

export interface UsePredictionsOptions {
  metric: 'messages_sent' | 'bounces' | 'throughput' | 'queue_size';
  enabled?: boolean;
}

export interface UsePredictionsReturn extends UseQueryResult<PredictiveInsights> {
  nextHourPrediction: Prediction | null;
  nextDayPrediction: Prediction | null;
}

/**
 * Simple linear regression for predictions
 */
const linearRegression = (
  data: Array<{ x: number; y: number }>
): { slope: number; intercept: number } => {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
};

/**
 * Hook for fetching predictive analytics
 */
export const usePredictions = (
  options: UsePredictionsOptions
): UsePredictionsReturn => {
  const { metric, enabled = true } = options;

  // Get historical trend data
  const { data: trendData } = useTrendData({ metric, timeRange: 'day' });

  const query = useQuery({
    queryKey: ['predictions', metric],
    queryFn: async () => {
      if (!trendData?.hourly) {
        throw new Error('No trend data available');
      }

      // Prepare data for regression
      const regressionData = trendData.hourly.map((point, index) => ({
        x: index,
        y: point.value,
      }));

      const { slope, intercept } = linearRegression(regressionData);

      // Calculate standard deviation for confidence intervals
      const mean =
        regressionData.reduce((sum, p) => sum + p.y, 0) / regressionData.length;
      const variance =
        regressionData.reduce((sum, p) => sum + Math.pow(p.y - mean, 2), 0) /
        regressionData.length;
      const stdDev = Math.sqrt(variance);

      // Generate predictions for next hour
      const now = new Date();
      const nextHourPredictions: Prediction[] = Array.from({ length: 6 }, (_, i) => {
        const futureX = regressionData.length + i;
        const predictedValue = slope * futureX + intercept;
        const confidence = Math.max(0.6, 1 - i * 0.05); // Decreasing confidence

        return {
          timestamp: new Date(now.getTime() + (i + 1) * 10 * 60 * 1000), // 10-minute intervals
          predicted_value: Math.max(0, predictedValue),
          confidence_interval: {
            lower: Math.max(0, predictedValue - 1.96 * stdDev),
            upper: predictedValue + 1.96 * stdDev,
          },
          confidence,
        };
      });

      // Generate daily predictions
      const nextDayPredictions: Prediction[] = Array.from({ length: 24 }, (_, i) => {
        const futureX = regressionData.length + i * 4; // Every 4 hours
        const predictedValue = slope * futureX + intercept;
        const confidence = Math.max(0.5, 1 - i * 0.02);

        return {
          timestamp: new Date(now.getTime() + (i + 1) * 60 * 60 * 1000), // Hourly
          predicted_value: Math.max(0, predictedValue),
          confidence_interval: {
            lower: Math.max(0, predictedValue - 1.96 * stdDev),
            upper: predictedValue + 1.96 * stdDev,
          },
          confidence,
        };
      });

      // Detect anomalies
      const anomalies = trendData.hourly
        .filter((point) => {
          const expectedMin = mean - 2 * stdDev;
          const expectedMax = mean + 2 * stdDev;
          return point.value < expectedMin || point.value > expectedMax;
        })
        .map((point) => ({
          timestamp: point.timestamp,
          metric,
          value: point.value,
          expected_range: {
            min: mean - 2 * stdDev,
            max: mean + 2 * stdDev,
          },
        }));

      // Generate recommendations
      const recommendations: PredictiveInsights['recommendations'] = [];

      if (slope > 0) {
        recommendations.push({
          type: 'info',
          message: `${metric.replace('_', ' ')} trending upward. Consider scaling resources.`,
          action: 'Review capacity',
        });
      } else if (slope < 0) {
        recommendations.push({
          type: 'warning',
          message: `${metric.replace('_', ' ')} trending downward. Monitor for issues.`,
          action: 'Check system health',
        });
      }

      if (anomalies.length > 0) {
        recommendations.push({
          type: 'warning',
          message: `${anomalies.length} anomalies detected in the last 24 hours.`,
          action: 'View details',
        });
      }

      const insights: PredictiveInsights = {
        next_hour: nextHourPredictions,
        next_day: nextDayPredictions,
        recommendations,
        anomalies,
      };

      return insights;
    },
    enabled: enabled && !!trendData?.hourly,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  return {
    ...query,
    nextHourPrediction: query.data?.next_hour?.[0] || null,
    nextDayPrediction: query.data?.next_day?.[0] || null,
  };
};
