import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analyticsService';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * Domain performance heatmap component
 */
export const DeliverabilityHeatmap: React.FC = () => {
  const { data: domainPerformance, isLoading } = useQuery({
    queryKey: ['domain-performance'],
    queryFn: () => analyticsService.getDomainPerformance(15),
    refetchInterval: 60000, // Refetch every minute
  });

  const getHeatmapColor = (successRate: number): string => {
    if (successRate >= 95) return 'bg-green-500';
    if (successRate >= 90) return 'bg-green-400';
    if (successRate >= 85) return 'bg-yellow-400';
    if (successRate >= 80) return 'bg-orange-400';
    return 'bg-red-500';
  };

  const getTextColor = (successRate: number): string => {
    if (successRate >= 85) return 'text-white';
    return 'text-gray-900';
  };

  if (isLoading) {
    return <LoadingSkeleton type="card" count={1} />;
  }

  if (!domainPerformance || domainPerformance.length === 0) {
    return (
      <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">
          Domain Deliverability Heatmap
        </h3>
        <p className="text-gray-500 dark:text-gray-400">No domain data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
      <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">
        Domain Deliverability Heatmap
      </h3>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {domainPerformance.map((domain) => (
          <div
            key={domain.domain}
            className={`
              ${getHeatmapColor(domain.success_rate)}
              ${getTextColor(domain.success_rate)}
              rounded-lg p-3 text-center transition-transform hover:scale-105 cursor-pointer
            `}
            title={`${domain.domain}\nSuccess Rate: ${domain.success_rate.toFixed(1)}%\nSent: ${domain.total_sent.toLocaleString()}\nDelivered: ${domain.total_delivered.toLocaleString()}\nBounced: ${domain.total_bounced.toLocaleString()}`}
          >
            <div className="text-xs font-medium truncate mb-1">{domain.domain}</div>
            <div className="text-lg font-bold">{domain.success_rate.toFixed(1)}%</div>
            <div className="text-xs opacity-90">{domain.total_sent.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">&gt;95%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-400 rounded mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">85-95%</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">&lt;85%</span>
          </div>
        </div>
        <span className="text-gray-500 dark:text-gray-400">Hover for details</span>
      </div>
    </div>
  );
};
