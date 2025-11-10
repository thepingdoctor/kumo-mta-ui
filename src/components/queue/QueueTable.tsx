import React, { memo, useCallback } from 'react';
import { Clock, Mail, AlertCircle, Server, ArrowRight, AlertTriangle } from 'lucide-react';
import type { MessageQueueItem, MessageQueueStatus } from '../../types/email-queue';
import { format } from 'date-fns';

interface QueueTableProps {
  items: MessageQueueItem[];
  onStatusChange: (id: string, status: MessageQueueStatus) => void;
  isLoading?: boolean;
}

/**
 * Queue table component for email message queue with KumoMTA integration
 * Displays comprehensive email delivery information with 9-state status tracking
 * Optimized with React.memo to prevent unnecessary re-renders
 */
export const QueueTable: React.FC<QueueTableProps> = memo(({ items, onStatusChange, isLoading }) => {
  /**
   * Get status badge color based on 9-state email queue status
   * Memoized to prevent recalculation on every render
   */
  const getStatusColor = useCallback((status: MessageQueueStatus): string => {
    const colors: Record<MessageQueueStatus, string> = {
      scheduled: 'bg-purple-100 text-purple-800',
      ready: 'bg-blue-100 text-blue-800',
      in_delivery: 'bg-indigo-100 text-indigo-800',
      suspended: 'bg-yellow-100 text-yellow-800',
      deferred: 'bg-orange-100 text-orange-800',
      bounced: 'bg-red-100 text-red-800',
      delivered: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || colors.ready;
  }, []);

  /**
   * Format timestamp to human-readable format
   * Memoized to prevent recalculation
   */
  const formatTimestamp = useCallback((timestamp?: string): string => {
    if (!timestamp) return 'N/A';
    try {
      return format(new Date(timestamp), 'MMM dd, HH:mm:ss');
    } catch {
      return 'Invalid date';
    }
  }, []);

  /**
   * Get bounce classification badge color
   * Memoized to prevent recalculation
   */
  const getBounceColor = useCallback((type?: string): string => {
    const colors: Record<string, string> = {
      hard: 'bg-red-100 text-red-800',
      soft: 'bg-orange-100 text-orange-800',
      block: 'bg-yellow-100 text-yellow-800',
      complaint: 'bg-purple-100 text-purple-800',
      unknown: 'bg-gray-100 text-gray-800',
    };
    return type ? (colors[type] || colors.unknown) : '';
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg bg-white shadow overflow-hidden">
        <div className="animate-pulse p-4">
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg bg-white shadow p-8 text-center">
        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No messages in queue</h3>
        <p className="text-sm text-gray-500">Queue is empty or all messages match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Message ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Recipient Details
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Queue Info
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Attempts
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamps
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                {/* Message ID Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-mono text-xs text-gray-600 mb-1" title={item.message_id}>
                      {item.message_id.length > 20
                        ? `${item.message_id.substring(0, 20)}...`
                        : item.message_id}
                    </div>
                    <div className="text-xs text-gray-400">
                      Size: {(item.size_bytes / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </td>

                {/* Recipient Details Column */}
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="flex items-center mb-1">
                      <Mail className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
                      <span className="font-medium text-gray-900">{item.recipient}</span>
                    </div>
                    <div className="flex items-center text-gray-500 mb-1">
                      <ArrowRight className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs">{item.sender}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Server className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs font-medium">{item.domain}</span>
                    </div>
                  </div>
                </td>

                {/* Queue Info Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-medium text-gray-900 mb-1">{item.queue_name}</div>
                    <div className="text-xs text-gray-500">
                      Priority: {item.priority}/10
                    </div>
                    {item.pool_name && (
                      <div className="text-xs text-gray-500">
                        Pool: {item.pool_name}
                      </div>
                    )}
                  </div>
                </td>

                {/* Status Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    {item.bounce_classification && (
                      <div className="mt-1">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBounceColor(item.bounce_classification)}`}>
                          {item.bounce_classification} bounce
                        </span>
                      </div>
                    )}
                    {item.smtp_response && (
                      <div className="mt-1 text-xs text-gray-500" title={item.smtp_response.message}>
                        SMTP: {item.smtp_response.code}
                        {item.smtp_response.enhanced_code && ` (${item.smtp_response.enhanced_code})`}
                      </div>
                    )}
                  </div>
                </td>

                {/* Delivery Attempts Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {item.num_attempts > 0 ? (
                      <div className="flex items-center mb-1">
                        <AlertCircle className={`h-4 w-4 mr-1 ${
                          item.num_attempts >= item.max_attempts * 0.8 ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                        <span className={`font-medium ${
                          item.num_attempts >= item.max_attempts * 0.8 ? 'text-red-600' : 'text-gray-900'
                        }`}>
                          {item.num_attempts} / {item.max_attempts}
                        </span>
                      </div>
                    ) : (
                      <div className="text-gray-500">No attempts</div>
                    )}
                    {item.last_attempt_at && (
                      <div className="text-xs text-gray-500">
                        Last: {formatTimestamp(item.last_attempt_at)}
                      </div>
                    )}
                    {item.next_attempt_at && (
                      <div className="text-xs text-blue-600">
                        Next: {formatTimestamp(item.next_attempt_at)}
                      </div>
                    )}
                    {item.last_bounce_reason && (
                      <div className="mt-1 flex items-start">
                        <AlertTriangle className="h-3 w-3 text-orange-500 mr-1 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600 line-clamp-2" title={item.last_bounce_reason}>
                          {item.last_bounce_reason.length > 50
                            ? `${item.last_bounce_reason.substring(0, 50)}...`
                            : item.last_bounce_reason}
                        </span>
                      </div>
                    )}
                  </div>
                </td>

                {/* Timestamps Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center mb-1">
                    <Clock className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
                    <div>
                      <div className="text-xs font-medium text-gray-700">Created</div>
                      <div className="text-xs">{formatTimestamp(item.created_at)}</div>
                    </div>
                  </div>
                  {item.scheduled_at && (
                    <div className="text-xs text-purple-600 mb-1">
                      Scheduled: {formatTimestamp(item.scheduled_at)}
                    </div>
                  )}
                  {item.delivered_at && (
                    <div className="text-xs text-green-600 mb-1">
                      Delivered: {formatTimestamp(item.delivered_at)}
                    </div>
                  )}
                  {item.expires_at && (
                    <div className="text-xs text-red-600">
                      Expires: {formatTimestamp(item.expires_at)}
                    </div>
                  )}
                </td>

                {/* Actions Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={item.status}
                    onChange={(e) => onStatusChange(item.id, e.target.value as MessageQueueStatus)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                    aria-label={`Change status for message ${item.message_id}`}
                  >
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

// Add display name for debugging
QueueTable.displayName = 'QueueTable';

export default QueueTable;
