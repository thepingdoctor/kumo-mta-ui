import React, { useMemo } from 'react';
import { Activity, Mail, AlertTriangle, Clock } from 'lucide-react';
import { Line } from 'react-chartjs-2';
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
  const metrics = useMemo(() => ({
    sent: 0,
    bounced: 0,
    delayed: 0,
    throughput: 0
  }), []);

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
        <div className="mt-4">
          <div className="flex items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-gray-300" aria-hidden="true"></div>
            <span className="ml-2 text-sm text-gray-600">Waiting for server connection...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;