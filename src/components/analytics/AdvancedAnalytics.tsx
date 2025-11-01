import React, { useMemo, useRef } from 'react';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../../services/api';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ExportButton } from '../common/ExportButton';
import { exportAnalyticsToPDF, exportToCSV } from '../../utils/exportUtils';
import type { ExportFormat } from '../common/ExportButton';

// Define Chart type for proper typing
interface ChartInstance {
  toBase64Image: () => string;
}

const AdvancedAnalytics: React.FC = () => {
  const bounceChartRef = useRef<ChartInstance | null>(null);
  const queueChartRef = useRef<ChartInstance | null>(null);
  const bounceClassificationChartRef = useRef<ChartInstance | null>(null);

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: async () => {
      const [kumoMetrics, bounceData, queueMetrics] = await Promise.all([
        apiService.kumomta.getMetrics(),
        apiService.kumomta.getBounces(),
        apiService.queue.getMetrics(),
      ]);
      return {
        kumomta: kumoMetrics.data,
        bounces: bounceData.data,
        queue: queueMetrics.data,
      };
    },
    refetchInterval: 30000, // 30 seconds
  });

  // Delivery success rate
  const successRate = useMemo(() => {
    if (!metrics?.kumomta) return 0;
    const total = metrics.kumomta.messages_sent || 1;
    const bounces = metrics.kumomta.bounces || 0;
    return ((total - bounces) / total) * 100;
  }, [metrics]);

  // Bounce rate distribution
  const bounceChartData = useMemo(() => {
    if (!metrics?.bounces) return null;

    return {
      labels: ['Hard Bounces', 'Soft Bounces'],
      datasets: [
        {
          data: [
            metrics.bounces.hard_bounces || 0,
            metrics.bounces.soft_bounces || 0,
          ],
          backgroundColor: ['#EF4444', '#F59E0B'],
          borderWidth: 0,
        },
      ],
    };
  }, [metrics]);

  // Queue status distribution
  const queueChartData = useMemo(() => {
    if (!metrics?.queue) return null;

    return {
      labels: ['Waiting', 'Processing', 'Completed'],
      datasets: [
        {
          data: [
            metrics.queue.totalWaiting || 0,
            metrics.queue.totalProcessing || 0,
            metrics.queue.totalCompleted || 0,
          ],
          backgroundColor: ['#FBBF24', '#3B82F6', '#10B981'],
          borderWidth: 0,
        },
      ],
    };
  }, [metrics]);

  // Bounce classifications
  const bounceClassificationData = useMemo(() => {
    if (!metrics?.bounces?.classifications) return null;

    const classifications = metrics.bounces.classifications.slice(0, 5);

    return {
      labels: classifications.map((c: { code: string }) => c.code),
      datasets: [
        {
          label: 'Count',
          data: classifications.map((c: { count: number }) => c.count),
          backgroundColor: '#8B5CF6',
        },
      ],
    };
  }, [metrics]);

  const handleExport = (format: ExportFormat) => {
    if (!metrics) return;

    try {
      if (format === 'pdf') {
        // Get chart images
        const chartImages: { [key: string]: string } = {};

        if (bounceChartRef.current) {
          chartImages['Bounce Distribution'] = bounceChartRef.current.toBase64Image();
        }
        if (queueChartRef.current) {
          chartImages['Queue Status'] = queueChartRef.current.toBase64Image();
        }
        if (bounceClassificationChartRef.current) {
          chartImages['Top Bounce Classifications'] = bounceClassificationChartRef.current.toBase64Image();
        }

        // Calculate metrics for export
        const exportMetrics = {
          successRate: successRate,
          bounces: metrics.bounces,
          queueEfficiency: metrics.queue
            ? ((metrics.queue.totalCompleted || 0) /
                ((metrics.queue.totalCompleted || 0) +
                  (metrics.queue.totalWaiting || 0) +
                  (metrics.queue.totalProcessing || 0) || 1)) *
              100
            : 0,
          throughput: metrics.kumomta?.throughput || 0,
        };

        exportAnalyticsToPDF(exportMetrics, chartImages);
      } else {
        // Export bounce classifications to CSV
        if (metrics.bounces?.classifications) {
          const totalBounces = (metrics.bounces.hard_bounces || 0) + (metrics.bounces.soft_bounces || 0);
          const csvData = metrics.bounces.classifications.map((c: { code: string; description: string; count: number }) => ({
            code: c.code,
            description: c.description,
            count: c.count,
            percentage: ((c.count / totalBounces) * 100).toFixed(2),
          }));

          exportToCSV(csvData, `analytics-export-${Date.now()}.csv`);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <LoadingSkeleton type="card" count={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="mt-1 text-sm text-gray-500">
            Detailed insights into your email delivery performance
          </p>
        </div>
        <ExportButton
          onExport={handleExport}
          disabled={!metrics}
          formats={['pdf', 'csv']}
          label="Export"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Success Rate */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className={`rounded-full p-3 ${successRate >= 95 ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {successRate >= 95 ? (
                <TrendingUp className={`h-6 w-6 ${successRate >= 95 ? 'text-green-600' : 'text-yellow-600'}`} />
              ) : (
                <TrendingDown className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{successRate.toFixed(2)}%</p>
            </div>
          </div>
        </div>

        {/* Total Bounces */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bounces</p>
              <p className="text-2xl font-semibold text-gray-900">
                {(metrics?.bounces?.hard_bounces || 0) + (metrics?.bounces?.soft_bounces || 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Queue Efficiency */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Queue Efficiency</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.queue
                  ? (
                      ((metrics.queue.totalCompleted || 0) /
                        ((metrics.queue.totalCompleted || 0) +
                          (metrics.queue.totalWaiting || 0) +
                          (metrics.queue.totalProcessing || 0) || 1)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Processing Rate */}
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Throughput</p>
              <p className="text-2xl font-semibold text-gray-900">
                {metrics?.kumomta?.throughput || 0}/min
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bounce Distribution */}
        {bounceChartData && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Bounce Distribution</h3>
            <div className="h-64">
              <Pie
                ref={bounceChartRef}
                data={bounceChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Queue Status */}
        {queueChartData && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-medium text-gray-900">Queue Status</h3>
            <div className="h-64">
              <Doughnut
                ref={queueChartRef}
                data={queueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {/* Top Bounce Classifications */}
        {bounceClassificationData && (
          <div className="rounded-lg bg-white p-6 shadow lg:col-span-2">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Top Bounce Classifications
            </h3>
            <div className="h-64">
              <Bar
                ref={bounceClassificationChartRef}
                data={bounceClassificationData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bounce Classifications Table */}
      {metrics?.bounces?.classifications && (
        <div className="rounded-lg bg-white shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Detailed Bounce Classifications</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.bounces.classifications.map((classification: { code: string; description: string; count: number }, index: number) => {
                  const totalBounces =
                    (metrics.bounces.hard_bounces || 0) + (metrics.bounces.soft_bounces || 0);
                  const percentage = (classification.count / totalBounces) * 100;

                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {classification.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {classification.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {classification.count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {percentage.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedAnalytics;
