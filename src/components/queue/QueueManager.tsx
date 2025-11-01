import React, { useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useQueue } from '../../hooks/useQueue';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { QueueTable } from './QueueTable';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ExportButton } from '../common/ExportButton';
import { exportQueueToPDF, exportToCSV } from '../../utils/exportUtils';
import type { EmailQueueFilter, MessageQueueStatus, BounceType, MessageQueueItem } from '../../types/email-queue';
import type { ExportFormat } from '../common/ExportButton';

const QueueManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MessageQueueStatus | ''>('');
  const [domainFilter, setDomainFilter] = useState('');
  const [queueNameFilter, setQueueNameFilter] = useState('');
  const [bounceTypeFilter, setBounceTypeFilter] = useState<BounceType | ''>('');
  const toast = useToast();

  // Debounce search query to reduce API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters: EmailQueueFilter = {
    search_query: debouncedSearch || undefined,
    status: statusFilter || undefined,
    domain: domainFilter || undefined,
    bounce_type: bounceTypeFilter || undefined,
    limit: 100,
    sort_by: 'created_at',
    sort_order: 'desc',
  };

  const {
    data: queueItems,
    isLoading,
    error: queueError,
    refetch,
    updateStatus,
  } = useQueue(filters);

  const handleStatusChange = async (id: string, status: MessageQueueStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status. Please try again.');
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (!queueItems || queueItems.length === 0) {
      toast.warning('No data to export');
      return;
    }

    try {
      if (format === 'pdf') {
        exportQueueToPDF(queueItems);
        toast.success('Queue data exported to PDF successfully');
      } else {
        // Email queue CSV columns
        const columns = [
          { header: 'Message ID', dataKey: 'message_id' },
          { header: 'Recipient', dataKey: 'recipient' },
          { header: 'Sender', dataKey: 'sender' },
          { header: 'Domain', dataKey: 'domain' },
          { header: 'Queue Name', dataKey: 'queue_name' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Priority', dataKey: 'priority' },
          { header: 'Attempts', dataKey: 'num_attempts' },
          { header: 'Size (bytes)', dataKey: 'size_bytes' },
          { header: 'Campaign ID', dataKey: 'campaign_id' },
          { header: 'Bounce Type', dataKey: 'bounce_classification' },
          { header: 'Last Bounce', dataKey: 'last_bounce_reason' },
          { header: 'Created At', dataKey: 'created_at' },
          { header: 'Delivered At', dataKey: 'delivered_at' },
        ];
        exportToCSV(queueItems, `email-queue-export-${Date.now()}.csv`, columns);
        toast.success('Queue data exported to CSV successfully');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };

  // Calculate email queue metrics
  const calculateMetrics = (items: MessageQueueItem[]) => {
    const total = items.length;
    const queueDepth = items.filter(i =>
      i.status === 'ready' || i.status === 'scheduled' || i.status === 'deferred'
    ).length;
    const delivered = items.filter(i => i.status === 'delivered').length;
    const bounced = items.filter(i => i.status === 'bounced').length;
    const inDelivery = items.filter(i => i.status === 'in_delivery').length;
    const suspended = items.filter(i => i.status === 'suspended').length;

    const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';
    const bounceRate = total > 0 ? ((bounced / total) * 100).toFixed(1) : '0.0';

    return {
      total,
      queueDepth,
      delivered,
      bounced,
      inDelivery,
      suspended,
      deliveryRate,
      bounceRate,
    };
  };

  const metrics = queueItems ? calculateMetrics(queueItems) : null;

  if (queueError) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Email Queue Management</h2>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Error loading queue data. Please try again.</p>
          <button
            onClick={() => refetch()}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Queue Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage email messages in delivery queues
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Refresh queue data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <ExportButton
            onExport={handleExport}
            disabled={!queueItems || queueItems.length === 0}
            formats={['pdf', 'csv']}
            label="Export"
          />
        </div>
      </div>

      {/* Email Queue Metrics Dashboard */}
      {metrics && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{metrics.total}</div>
              <div className="text-sm text-gray-500">Total Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{metrics.queueDepth}</div>
              <div className="text-sm text-gray-500">Queue Depth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.inDelivery}</div>
              <div className="text-sm text-gray-500">In Delivery</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.delivered}</div>
              <div className="text-sm text-gray-500">Delivered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{metrics.bounced}</div>
              <div className="text-sm text-gray-500">Bounced</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{metrics.suspended}</div>
              <div className="text-sm text-gray-500">Suspended</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl font-semibold text-green-600">{metrics.deliveryRate}%</div>
              <div className="text-sm text-gray-500">Delivery Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-red-600">{metrics.bounceRate}%</div>
              <div className="text-sm text-gray-500">Bounce Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <label htmlFor="search" className="sr-only">Search</label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
            <input
              id="search"
              type="text"
              placeholder="Search recipient, sender, message ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as MessageQueueStatus | '')}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="scheduled">Scheduled</option>
                <option value="ready">Ready</option>
                <option value="in_delivery">In Delivery</option>
                <option value="suspended">Suspended</option>
                <option value="deferred">Deferred</option>
                <option value="bounced">Bounced</option>
                <option value="delivered">Delivered</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Domain Filter */}
          <div>
            <label htmlFor="domain-filter" className="sr-only">Filter by domain</label>
            <input
              id="domain-filter"
              type="text"
              placeholder="Filter by domain..."
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Bounce Type Filter */}
          <div>
            <label htmlFor="bounce-filter" className="sr-only">Filter by bounce type</label>
            <select
              id="bounce-filter"
              value={bounceTypeFilter}
              onChange={(e) => setBounceTypeFilter(e.target.value as BounceType | '')}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Bounce Types</option>
              <option value="hard">Hard Bounce</option>
              <option value="soft">Soft Bounce</option>
              <option value="block">Blocked</option>
              <option value="complaint">Complaint</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      {isLoading ? (
        <LoadingSkeleton type="table" />
      ) : (
        <QueueTable
          items={queueItems || []}
          onStatusChange={handleStatusChange}
          isLoading={updateStatus.isPending}
        />
      )}
    </div>
  );
};

export default QueueManager;
