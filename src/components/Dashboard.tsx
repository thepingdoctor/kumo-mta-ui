import React, { useMemo } from 'react';
import { Activity, Mail, AlertTriangle, Clock, Server } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  // Fetch real metrics from KumoMTA
  const { data: kumoMetrics, isLoading, error } = useQuery({
    queryKey: ['kumo-metrics'],
    queryFn: async () => {
      const response = await apiService.kumomta.getMetrics();
      return response.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    retry: 3,
  });

  const { data: queueMetrics } = useQuery({
    queryKey: ['queue-metrics'],
    queryFn: async () => {
      const response = await apiService.queue.getMetrics();
      return response.data;
    },
    refetchInterval: 5000,
    retry: 3,
  });

  const metrics = useMemo(() => ({
    sent: kumoMetrics?.messages_sent || 0,
    bounced: kumoMetrics?.bounces || 0,
    delayed: kumoMetrics?.delayed || 0,
    throughput: kumoMetrics?.throughput || 0
  }), [kumoMetrics]);

  const chartData = useMemo(() => ({
    labels: [],
    datasets: [
      {
        label: 'Emails Sent',
        data: [],
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.4
      }
    ]
  }), []);

  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Hourly Email Throughput'
      }
    }
  }), []);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg bg-white p-6 shadow animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded"></div>
              <div className="mt-4 h-4 bg-gray-200 rounded w-24"></div>
              <div className="mt-2 h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <div className="rounded-lg bg-red-50 border border-red-200 p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Failed to load metrics</h3>
              <p className="mt-1 text-sm text-red-700">
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
      <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <Mail className="h-12 w-12 text-blue-500" aria-hidden="true" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Emails Sent</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.sent.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-12 w-12 text-red-500" aria-hidden="true" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Bounces</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.bounced.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <Clock className="h-12 w-12 text-yellow-500" aria-hidden="true" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delayed</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.delayed.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center">
            <Activity className="h-12 w-12 text-green-500" aria-hidden="true" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Throughput</p>
              <p className="text-2xl font-semibold text-gray-900">{metrics.throughput}/min</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg bg-white p-6 shadow">
        <Line options={chartOptions} data={chartData} />
      </div>

      {/* Server Status */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-medium text-gray-900">Server Status</h3>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Server className="h-5 w-5 text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Connection Status</span>
            </div>
            <div className="flex items-center">
              <div className={`h-2.5 w-2.5 rounded-full ${kumoMetrics ? 'bg-green-500' : 'bg-gray-300'} mr-2`} aria-hidden="true"></div>
              <span className={`text-sm font-medium ${kumoMetrics ? 'text-green-700' : 'text-gray-500'}`}>
                {kumoMetrics ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          {kumoMetrics && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Connections</span>
                <span className="text-sm font-medium text-gray-900">
                  {kumoMetrics.active_connections || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Queue Size</span>
                <span className="text-sm font-medium text-gray-900">
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