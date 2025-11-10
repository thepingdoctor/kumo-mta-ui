import React, { useState } from 'react';
import { Search, Filter, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useQueue } from '../../hooks/useQueue';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { useRealtimeQueue } from '../../hooks/useRealtimeQueue';
import { QueueTable } from './QueueTable';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ExportButton } from '../common/ExportButton';
import { exportQueueToPDF, exportToCSV } from '../../utils/exportUtils';
import type { EmailQueueFilter, MessageQueueStatus, BounceType, MessageQueueItem } from '../../types/email-queue';
import type { ExportFormat } from '../common/ExportButton';

/**
 * QueueManager Component
 *
 * Main queue management component for monitoring and managing email messages in delivery queues.
 * Provides real-time queue metrics, filtering capabilities, status updates, and data export functionality.
 *
 * @component
 * @returns {React.ReactElement} The rendered queue management interface
 *
 * @description
 * This component serves as the central dashboard for email queue operations, offering:
 * - Real-time metrics dashboard showing queue depth, delivery rates, and message statuses
 * - Advanced filtering by search query (recipient/sender/message ID), status, domain, and bounce type
 * - Status update capabilities for individual queue items
 * - Export functionality for PDF and CSV formats
 * - Automatic data refresh and debounced search optimization
 *
 * @example
 * ```tsx
 * import QueueManager from './components/queue/QueueManager';
 *
 * function App() {
 *   return (
 *     <div className="container">
 *       <QueueManager />
 *     </div>
 *   );
 * }
 * ```
 *
 * @remarks
 * - Search queries are debounced by 300ms to reduce API calls
 * - Queue data refreshes automatically via React Query with 30s stale time
 * - Supports real-time status updates with optimistic UI updates
 * - Handles offline scenarios gracefully with cached data fallback
 */
const QueueManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MessageQueueStatus | ''>('');
  const [domainFilter, setDomainFilter] = useState('');
  const [bounceTypeFilter, setBounceTypeFilter] = useState<BounceType | ''>('');
  const toast = useToast();

  // Real-time queue updates via WebSocket
  const { isConnected: wsConnected } = useRealtimeQueue({
    domain: domainFilter || undefined,
    onUpdate: (update) => {
      // Show toast notification for queue changes
      toast.info(`Queue ${update.queue_name}: ${update.message_count} messages`);
    },
  });

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

  /**
   * Handle queue item status change
   *
   * Updates the status of a specific queue item and provides user feedback via toast notifications.
   * Uses React Query mutations for optimistic updates and automatic cache invalidation.
   *
   * @async
   * @function handleStatusChange
   * @param {string} id - The unique identifier of the queue item to update
   * @param {MessageQueueStatus} status - The new status to set for the queue item
   * @returns {Promise<void>} Resolves when the status update is complete
   * @throws {Error} When the API request fails (caught internally and displayed as toast)
   *
   * @description
   * Status change flow:
   * 1. Initiates mutation request to update queue item status
   * 2. React Query performs optimistic update in UI
   * 3. On success: Shows success toast and invalidates related queries
   * 4. On error: Reverts optimistic update and shows error toast
   *
   * Supported status transitions:
   * - scheduled → ready (manual queue activation)
   * - ready → suspended (pause delivery)
   * - suspended → ready (resume delivery)
   * - deferred → ready (retry delivery)
   * - * → cancelled (cancel message)
   *
   * @example
   * ```tsx
   * // Resume a suspended message
   * await handleStatusChange('msg-123', 'ready');
   *
   * // Cancel a scheduled message
   * await handleStatusChange('msg-456', 'cancelled');
   * ```
   */
  const handleStatusChange = async (id: string, status: MessageQueueStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status. Please try again.');
    }
  };

  /**
   * Handle queue data export
   *
   * Exports the current queue data to either PDF or CSV format with comprehensive column mapping.
   * Includes validation, error handling, and user feedback via toast notifications.
   *
   * @function handleExport
   * @param {ExportFormat} format - The export format ('pdf' | 'csv')
   * @returns {void}
   * @throws {Error} When export utility functions fail (caught internally)
   *
   * @description
   * Export process:
   * 1. Validates that queue data exists and is not empty
   * 2. For PDF: Generates formatted PDF document with tables and metrics
   * 3. For CSV: Maps queue items to CSV columns with proper headers
   * 4. Triggers browser download with timestamped filename
   * 5. Shows success/error feedback to user
   *
   * CSV Export Columns (14 fields):
   * - Message ID: Unique message identifier
   * - Recipient: Email recipient address
   * - Sender: Email sender address
   * - Domain: Recipient domain
   * - Queue Name: Name of the delivery queue
   * - Status: Current message status (scheduled, ready, delivered, etc.)
   * - Priority: Message priority level
   * - Attempts: Number of delivery attempts
   * - Size (bytes): Message size in bytes
   * - Campaign ID: Associated campaign identifier
   * - Bounce Type: Classification of bounce (hard, soft, block, complaint)
   * - Last Bounce: Reason for most recent bounce
   * - Created At: Timestamp when message was created
   * - Delivered At: Timestamp when message was delivered
   *
   * @example
   * ```tsx
   * // Export to PDF
   * handleExport('pdf');
   *
   * // Export to CSV with timestamp
   * handleExport('csv'); // Generates: email-queue-export-1699999999999.csv
   * ```
   *
   * @remarks
   * - CSV filename includes Unix timestamp for uniqueness
   * - PDF export includes metrics dashboard and full table
   * - Empty datasets trigger warning toast instead of export
   * - Export errors are logged to console for debugging
   */
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
        // Email queue CSV columns - 14 comprehensive fields for detailed analysis
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

  /**
   * Calculate email queue metrics
   *
   * Computes comprehensive metrics from queue items for dashboard display.
   * Provides counts by status and calculates delivery/bounce rate percentages.
   *
   * @function calculateMetrics
   * @param {MessageQueueItem[]} items - Array of queue items to analyze
   * @returns {Object} Calculated metrics object
   * @returns {number} return.total - Total number of messages in queue
   * @returns {number} return.queueDepth - Count of messages pending delivery (ready + scheduled + deferred)
   * @returns {number} return.delivered - Count of successfully delivered messages
   * @returns {number} return.bounced - Count of bounced messages
   * @returns {number} return.inDelivery - Count of messages currently being delivered
   * @returns {number} return.suspended - Count of suspended messages
   * @returns {string} return.deliveryRate - Percentage of delivered messages (1 decimal place)
   * @returns {string} return.bounceRate - Percentage of bounced messages (1 decimal place)
   *
   * @description
   * Metric Calculations:
   *
   * 1. Queue Depth = ready + scheduled + deferred messages
   *    - Represents messages waiting to be delivered
   *    - Critical metric for queue backlog monitoring
   *
   * 2. Delivery Rate = (delivered / total) × 100
   *    - Percentage of messages successfully delivered
   *    - Formatted to 1 decimal place (e.g., "95.3%")
   *    - Returns "0.0" for empty queues to prevent division by zero
   *
   * 3. Bounce Rate = (bounced / total) × 100
   *    - Percentage of messages that bounced
   *    - Formatted to 1 decimal place (e.g., "2.5%")
   *    - Returns "0.0" for empty queues to prevent division by zero
   *
   * Status Categorization:
   * - Queue Depth: scheduled, ready, deferred (awaiting delivery)
   * - In Delivery: in_delivery (actively sending)
   * - Delivered: delivered (successfully sent)
   * - Bounced: bounced (failed delivery)
   * - Suspended: suspended (paused delivery)
   *
   * @example
   * ```tsx
   * const items = [
   *   { status: 'delivered', ... },
   *   { status: 'delivered', ... },
   *   { status: 'bounced', ... },
   *   { status: 'ready', ... },
   * ];
   *
   * const metrics = calculateMetrics(items);
   * // {
   * //   total: 4,
   * //   queueDepth: 1,
   * //   delivered: 2,
   * //   bounced: 1,
   * //   inDelivery: 0,
   * //   suspended: 0,
   * //   deliveryRate: "50.0",
   * //   bounceRate: "25.0"
   * // }
   * ```
   *
   * @remarks
   * - All percentage calculations use toFixed(1) for consistent formatting
   * - Empty queue safeguard prevents division by zero errors
   * - Queue depth includes scheduled and deferred to show total pending
   * - Metrics are recalculated on every render for real-time accuracy
   */
  const calculateMetrics = (items: MessageQueueItem[]) => {
    const total = items.length;
    // Queue depth: messages waiting to be delivered (pending states)
    const queueDepth = items.filter(i =>
      i.status === 'ready' || i.status === 'scheduled' || i.status === 'deferred'
    ).length;
    const delivered = items.filter(i => i.status === 'delivered').length;
    const bounced = items.filter(i => i.status === 'bounced').length;
    const inDelivery = items.filter(i => i.status === 'in_delivery').length;
    const suspended = items.filter(i => i.status === 'suspended').length;

    // Calculate delivery rate: (delivered / total) × 100, with safeguard for empty queue
    const deliveryRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';
    // Calculate bounce rate: (bounced / total) × 100, with safeguard for empty queue
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
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Email Queue Management</h2>
            {/* WebSocket Connection Indicator */}
            <div className="flex items-center space-x-1">
              {wsConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-500 dark:text-green-400" />
                  <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">Polling</span>
                </>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and manage email messages in delivery queues
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-surface hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
