import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTrendData } from '../../hooks/useTrendData';
import { trendLineConfig, chartColors, getTimeLabels } from '../../utils/chartConfigs';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface TrendChartProps {
  metric: 'messages_sent' | 'bounces' | 'throughput' | 'queue_size';
  title: string;
  timeRange?: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Historical trend visualization component
 */
export const TrendChart: React.FC<TrendChartProps> = ({
  metric,
  title,
  timeRange = 'day',
}) => {
  const { data, isLoading, trend, percentChange, currentValue } = useTrendData({
    metric,
    timeRange,
  });

  const chartData = useMemo(() => {
    if (!data) return null;

    const timeData =
      timeRange === 'hour'
        ? data.hourly
        : timeRange === 'week'
        ? data.weekly
        : data.daily;

    return {
      labels: timeData.map((d) =>
        d.timestamp.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        })
      ),
      datasets: [
        {
          label: title,
          data: timeData.map((d) => d.value),
          borderColor: chartColors.primary,
          backgroundColor: `${chartColors.primary}33`,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [data, timeRange, title]);

  if (isLoading) {
    return <LoadingSkeleton type="card" count={1} />;
  }

  if (!chartData) {
    return (
      <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md">
        <p className="text-gray-500 dark:text-gray-400">No trend data available</p>
      </div>
    );
  }

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor =
    trend === 'up'
      ? 'text-green-600 dark:text-green-400'
      : trend === 'down'
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-600 dark:text-gray-400';

  return (
    <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl font-semibold text-gray-900 dark:text-dark-text">
            {currentValue.toLocaleString()}
          </span>
          <div className={`flex items-center ${trendColor}`}>
            <TrendIcon className="h-5 w-5" />
            <span className="ml-1 text-sm font-medium">
              {Math.abs(percentChange).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <Line data={chartData} options={trendLineConfig} />
      </div>
    </div>
  );
};
