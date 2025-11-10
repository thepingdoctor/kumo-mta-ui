import React from 'react';
import { Line } from 'react-chartjs-2';
import { Brain, AlertTriangle, Info, TrendingUp } from 'lucide-react';
import { usePredictions } from '../../hooks/usePredictions';
import { trendLineConfig, chartColors } from '../../utils/chartConfigs';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

interface PredictiveInsightsProps {
  metric: 'messages_sent' | 'bounces' | 'throughput' | 'queue_size';
}

/**
 * Predictive insights and forecasting component
 */
export const PredictiveInsights: React.FC<PredictiveInsightsProps> = ({ metric }) => {
  const { data: insights, isLoading, nextHourPrediction } = usePredictions({ metric });

  const chartData = React.useMemo(() => {
    if (!insights) return null;

    const labels = insights.next_hour.map((p) =>
      p.timestamp.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    );

    return {
      labels,
      datasets: [
        {
          label: 'Predicted',
          data: insights.next_hour.map((p) => p.predicted_value),
          borderColor: chartColors.purple,
          backgroundColor: `${chartColors.purple}33`,
          fill: false,
          borderDash: [5, 5],
        },
        {
          label: 'Upper Bound',
          data: insights.next_hour.map((p) => p.confidence_interval.upper),
          borderColor: `${chartColors.purple}44`,
          backgroundColor: 'transparent',
          fill: '+1',
          borderWidth: 1,
        },
        {
          label: 'Lower Bound',
          data: insights.next_hour.map((p) => p.confidence_interval.lower),
          borderColor: `${chartColors.purple}44`,
          backgroundColor: `${chartColors.purple}22`,
          fill: false,
          borderWidth: 1,
        },
      ],
    };
  }, [insights]);

  if (isLoading) {
    return <LoadingSkeleton type="card" count={1} />;
  }

  if (!insights || !chartData) {
    return (
      <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md">
        <div className="flex items-center mb-4">
          <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">
            Predictive Insights
          </h3>
        </div>
        <p className="text-gray-500 dark:text-gray-400">
          Insufficient data for predictions
        </p>
      </div>
    );
  }

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      case 'success':
        return <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Prediction Chart */}
      <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">
              Next Hour Forecast
            </h3>
          </div>
          {nextHourPrediction && (
            <div className="text-right">
              <div className="text-2xl font-semibold text-gray-900 dark:text-dark-text">
                {Math.round(nextHourPrediction.predicted_value).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {(nextHourPrediction.confidence * 100).toFixed(0)}% confidence
              </div>
            </div>
          )}
        </div>
        <div className="h-64">
          <Line data={chartData} options={trendLineConfig} />
        </div>
      </div>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
          <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">
            Recommendations
          </h4>
          <div className="space-y-3">
            {insights.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 ${getRecommendationColor(rec.type)}`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">{getRecommendationIcon(rec.type)}</div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-dark-text">
                      {rec.message}
                    </p>
                    {rec.action && (
                      <button className="mt-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {rec.action}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anomalies */}
      {insights.anomalies.length > 0 && (
        <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
          <h4 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">
            Detected Anomalies
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Time
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Value
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Expected Range
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
                {insights.anomalies.map((anomaly, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-dark-text">
                      {anomaly.timestamp.toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-red-600 dark:text-red-400">
                      {anomaly.value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                      {anomaly.expected_range.min.toFixed(0)} -{' '}
                      {anomaly.expected_range.max.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
