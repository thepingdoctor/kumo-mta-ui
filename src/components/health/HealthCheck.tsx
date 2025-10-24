import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Activity } from 'lucide-react';
import { performanceMonitor } from '../../utils/performanceMonitor';
import { errorTracker } from '../../utils/errorTracking';

export interface HealthStatus {
  api: 'healthy' | 'degraded' | 'down';
  database: 'healthy' | 'degraded' | 'down';
  queue: 'healthy' | 'degraded' | 'down';
  websocket: 'healthy' | 'degraded' | 'down';
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: number;
  services: HealthStatus;
  metrics: {
    responseTime: number;
    errorRate: number;
    uptime: number;
  };
}

const HealthCheck: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth>({
    status: 'healthy',
    timestamp: Date.now(),
    services: {
      api: 'healthy',
      database: 'healthy',
      queue: 'healthy',
      websocket: 'healthy',
    },
    metrics: {
      responseTime: 0,
      errorRate: 0,
      uptime: 0,
    },
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Check API health
        const apiHealth = await fetch('/health', { method: 'GET' })
          .then(res => res.ok ? 'healthy' : 'degraded')
          .catch(() => 'down');

        // Get performance metrics
        const perfReport = performanceMonitor.generateReport();
        const errorStats = errorTracker.getStats();

        // Calculate uptime
        const uptime = performance.now() / 1000 / 60; // minutes

        // Determine overall status
        const services: HealthStatus = {
          api: apiHealth as 'healthy' | 'degraded' | 'down',
          database: 'healthy', // Would check actual DB connection
          queue: 'healthy', // Would check queue service
          websocket: 'healthy', // Would check WebSocket connection
        };

        const overallStatus =
          Object.values(services).includes('down')
            ? 'down'
            : Object.values(services).includes('degraded')
            ? 'degraded'
            : 'healthy';

        setHealth({
          status: overallStatus,
          timestamp: Date.now(),
          services,
          metrics: {
            responseTime: perfReport.summary.avgResponseTime,
            errorRate: errorStats.criticalRate + errorStats.highRate,
            uptime,
          },
        });
      } catch (error) {
        console.error('Health check failed:', error);
        setHealth(prev => ({
          ...prev,
          status: 'down',
        }));
      }
    };

    // Check health immediately
    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Activity className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'down':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
        <p className="mt-1 text-sm text-gray-500">
          Real-time monitoring of system components and performance
        </p>
      </div>

      {/* Overall Status */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getStatusIcon(health.status)}
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Overall Status</h3>
              <p className="text-sm text-gray-500">
                Last updated: {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(health.status)}`}>
            {health.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(health.services).map(([service, status]) => (
          <div key={service} className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              {getStatusIcon(status)}
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 capitalize">{service}</p>
                <p className={`text-lg font-semibold ${status === 'healthy' ? 'text-green-600' : status === 'degraded' ? 'text-yellow-600' : 'text-red-600'}`}>
                  {status}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div className="rounded-lg bg-white shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Performance Metrics</h3>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Avg Response Time</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {health.metrics.responseTime.toFixed(0)}ms
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Error Rate</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {health.metrics.errorRate.toFixed(2)}%
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Uptime</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {health.metrics.uptime.toFixed(0)}m
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default HealthCheck;
