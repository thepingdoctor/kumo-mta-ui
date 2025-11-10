import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../../services/analyticsService';
import { barChartConfig, chartColors } from '../../utils/chartConfigs';
import { LoadingSkeleton } from '../common/LoadingSkeleton';

/**
 * Campaign A/B comparison component
 */
export const CampaignComparison: React.FC = () => {
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([
    'campaign-1',
    'campaign-2',
  ]);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaign-comparison', selectedCampaigns],
    queryFn: () => analyticsService.compareCampaigns(selectedCampaigns),
    enabled: selectedCampaigns.length > 0,
  });

  const chartData = React.useMemo(() => {
    if (!campaigns) return null;

    return {
      labels: campaigns.map((c) => c.campaign_name),
      datasets: [
        {
          label: 'Sent',
          data: campaigns.map((c) => c.sent),
          backgroundColor: chartColors.primary,
        },
        {
          label: 'Delivered',
          data: campaigns.map((c) => c.delivered),
          backgroundColor: chartColors.success,
        },
        {
          label: 'Bounced',
          data: campaigns.map((c) => c.bounced),
          backgroundColor: chartColors.danger,
        },
      ],
    };
  }, [campaigns]);

  if (isLoading) {
    return <LoadingSkeleton type="card" count={1} />;
  }

  if (!chartData || !campaigns) {
    return (
      <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">
          Campaign Comparison
        </h3>
        <p className="text-gray-500 dark:text-gray-400">No campaign data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white dark:bg-dark-surface p-6 shadow-md dark:shadow-xl">
      <h3 className="text-lg font-medium text-gray-900 dark:text-dark-text mb-4">
        Campaign Comparison
      </h3>

      {/* Chart */}
      <div className="h-64 mb-6">
        <Bar data={chartData} options={barChartConfig} />
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Sent
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Delivered
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Bounced
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Success Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-dark-surface divide-y divide-gray-200 dark:divide-gray-700">
            {campaigns.map((campaign) => {
              const successRate = (campaign.delivered / campaign.sent) * 100;
              return (
                <tr key={campaign.campaign_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-dark-text">
                    {campaign.campaign_name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900 dark:text-dark-text">
                    {campaign.sent.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400">
                    {campaign.delivered.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-red-600 dark:text-red-400">
                    {campaign.bounced.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-dark-text">
                    {successRate.toFixed(2)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
