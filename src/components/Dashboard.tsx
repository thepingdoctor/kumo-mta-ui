import React, { useMemo } from 'react';
import { Activity, Mail, AlertTriangle, Clock, Server } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { useChartData } from '../hooks/useChartData';
import { LoadingSkeleton } from './common/LoadingSkeleton';
import { parsePrometheusMetrics } from '../utils/prometheusParser';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard: React.FC = () => {
  // Fetch real metrics from KumoMTA (Prometheus format)
  const { data: kumoMetrics, isLoading, error } = useQuery({
    queryKey: ['kumo-metrics'],
    queryFn: async () => {
      const response = await apiService.kumomta.getMetrics();
      // Parse Prometheus JSON format to standard metrics
      return parsePrometheusMetrics(response.data);
    },
    refetchInterval: 15000, // Refresh every 15 seconds (optimized from 5s)
    retry: 3,
  });

  const { data: queueMetrics } = useQuery({
    queryKey: ['queue-metrics'],
    queryFn: async () => {
      const response = await apiService.queue.getMetrics();
      return response.data;
    },
    refetchInterval: 15000, // Optimized from 5s
    retry: 3,
  });

  // Use real-time chart data hook
  const { chartData, isLoading: chartLoading } = useChartData('messages_sent', 24);

  const metrics = useMemo(() => ({
    sent: kumoMetrics?.messages_sent || 0,
    bounced: kumoMetrics?.bounces || 0,
    delayed: kumoMetrics?.delayed || 0,
    throughput: kumoMetrics?.throughput || 0
  }), [kumoMetrics]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Hourly Email Throughput (Last 24 Hours)',
        font: {
          size: 16,
          weight: 'bold' as const
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Messages Sent'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Time'
        }
      }
    }
  }), []);

  // Loading state with better UX
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Dashboard</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <LoadingSkeleton type="stat" count={4} />
        </div>
        <LoadingSkeleton type="card" count={2} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Dashboard</h2>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Failed to load metrics</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                Unable to connect to KumoMTA server. Please check your connection and try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Dashboard</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
          <div className="flex items-center">
            <Mail className="h-12 w-12 text-blue-500 dark:text-blue-400" aria-hidden="true" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Emails Sent</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text">{metrics.sent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
          <div className="flex items-center">
            <AlertTriangle className="h-12 w-12 text-red-500 dark:text-red-400" aria-hidden="true" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bounces</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text">{metrics.bounced.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
          <div className="flex items-center">
            <Clock className="h-12 w-12 text-yellow-500 dark:text-yellow-400" aria-hidden="true" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delayed</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text">{metrics.delayed.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
          <div className="flex items-center">
            <Activity className="h-12 w-12 text-green-500 dark:text-green-400" aria-hidden="true" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Throughput</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-dark-text">{metrics.throughput}/min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
        <div className="h-96">
          {chartLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 dark:text-gray-400">Loading chart data...</div>
            </div>
          ) : (
            <Line options={chartOptions} data={chartData} />
          )}
        </div>
      </div>

      {/* Server Status */}
      <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text">Server Status</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Server className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Connection Status</span>
            </div>
            <div className="flex items-center">
              <div className={`h-2.5 w-2.5 rounded-full ${kumoMetrics ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-300 dark:bg-gray-600'} mr-2`} aria-hidden="true"></div>
              <span className={`text-sm font-medium ${kumoMetrics ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-500'}`}>
                {kumoMetrics ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          {kumoMetrics && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Active Connections</span>
                <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                  {kumoMetrics.active_connections || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Queue Size</span>
                <span className="text-sm font-medium text-gray-900 dark:text-dark-text">
                  {queueMetrics?.totalWaiting || 0}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;