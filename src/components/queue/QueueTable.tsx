import React from 'react';
import { Clock, Mail, User, AlertCircle } from 'lucide-react';
import type { QueueItem } from '../../types/queue';
import { format } from 'date-fns';

interface QueueTableProps {
  items: QueueItem[];
  onStatusChange: (id: string, status: QueueItem['status']) => void;
  isLoading?: boolean;
}

/**
 * Queue table component with sortable columns and status actions
 */
export const QueueTable: React.FC<QueueTableProps> = ({ items, onStatusChange, isLoading }) => {
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">No items in queue</h3>
        <p className="text-sm text-gray-500">Queue is empty or all items match your filters.</p>
      </div>
    );
  }

  const getStatusColor = (status: QueueItem['status']) => {
    const colors = {
      waiting: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800',
      queued: 'bg-purple-100 text-purple-800',
      sending: 'bg-indigo-100 text-indigo-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || colors.waiting;
  };

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email Details
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Wait Time
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-400 mr-2" aria-hidden="true" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.customerName}</div>
                    <div className="text-sm text-gray-500">{item.customerEmail}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">
                  <div className="flex items-center mb-1">
                    <Mail className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
                    <span className="font-medium">To:</span>&nbsp;{item.recipient}
                  </div>
                  <div className="text-gray-500">From: {item.sender}</div>
                  <div className="text-gray-500">Service: {item.serviceType}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
                {item.retries > 0 && (
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {item.retries} retries
                  </div>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-400 mr-1" aria-hidden="true" />
                  {item.estimatedWaitTime} min
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Created: {format(new Date(item.createdAt), 'MMM dd, HH:mm')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <select
                  value={item.status}
                  onChange={(e) => onStatusChange(item.id, e.target.value as QueueItem['status'])}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                  aria-label={`Change status for ${item.customerName}`}
                >
                  <option value="waiting">Waiting</option>
                  <option value="in-progress">In Progress</option>
                  <option value="queued">Queued</option>
                  <option value="sending">Sending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QueueTable;
