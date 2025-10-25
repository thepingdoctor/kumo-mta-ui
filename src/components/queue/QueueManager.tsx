import React, { useState } from 'react';
import { Search, Filter, RefreshCw } from 'lucide-react';
import { useQueue } from '../../hooks/useQueue';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { QueueTable } from './QueueTable';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ExportButton } from '../common/ExportButton';
import { exportQueueToPDF, exportToCSV } from '../../utils/exportUtils';
import type { QueueFilter, QueueItem } from '../../types/queue';
import type { ExportFormat } from '../common/ExportButton';

const QueueManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<QueueItem['status'] | ''>('');
  const [serviceFilter, setServiceFilter] = useState('');
  const toast = useToast();

  // Debounce search query to reduce API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  const filters: QueueFilter = {
    searchQuery: debouncedSearch || undefined,
    status: statusFilter || undefined,
    serviceType: serviceFilter || undefined,
  };

  const {
    data: queueItems,
    isLoading,
    error: queueError,
    refetch,
    updateStatus,
  } = useQueue(filters);

  const handleStatusChange = async (id: string, status: QueueItem['status']) => {
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
        const columns = [
          { header: 'Customer', dataKey: 'customerName' },
          { header: 'Email', dataKey: 'customerEmail' },
          { header: 'Recipient', dataKey: 'recipient' },
          { header: 'Sender', dataKey: 'sender' },
          { header: 'Status', dataKey: 'status' },
          { header: 'Service Type', dataKey: 'serviceType' },
          { header: 'Created', dataKey: 'createdAt' },
        ];
        exportToCSV(queueItems, `queue-export-${Date.now()}.csv`, columns);
        toast.success('Queue data exported to CSV successfully');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    }
  };

  if (queueError) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Queue Management</h2>
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
          <h2 className="text-2xl font-bold text-gray-900">Queue Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage email queue items
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative">
            <label htmlFor="search" className="sr-only">Search</label>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
            <input
              id="search"
              type="text"
              placeholder="Search customers, emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" aria-hidden="true" />
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as QueueItem['status'] | '')}
                className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="in-progress">In Progress</option>
                <option value="queued">Queued</option>
                <option value="sending">Sending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="service-filter" className="sr-only">Filter by service</label>
            <select
              id="service-filter"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Services</option>
              <option value="transactional">Transactional</option>
              <option value="marketing">Marketing</option>
              <option value="notification">Notification</option>
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

      {/* Stats */}
      {queueItems && queueItems.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{queueItems.length}</div>
              <div className="text-sm text-gray-500">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {queueItems.filter(i => i.status === 'waiting').length}
              </div>
              <div className="text-sm text-gray-500">Waiting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {queueItems.filter(i => i.status === 'sending' || i.status === 'in-progress').length}
              </div>
              <div className="text-sm text-gray-500">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {queueItems.filter(i => i.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManager;