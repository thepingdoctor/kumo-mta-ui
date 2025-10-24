import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { QueueItem } from '../../types/queue';

interface VirtualQueueTableProps {
  items: QueueItem[];
  onStatusChange: (id: string, status: QueueItem['status']) => void;
  isLoading: boolean;
}

interface RowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: QueueItem[];
    onStatusChange: (id: string, status: QueueItem['status']) => void;
  };
}

const Row: React.FC<RowProps> = ({ index, style, data }) => {
  const item = data.items[index];

  const getStatusColor = (status: QueueItem['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
      case 'queued':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      style={style}
      className="flex items-center border-b border-gray-200 hover:bg-gray-50 px-6"
    >
      <div className="flex-1 min-w-0 grid grid-cols-7 gap-4 items-center">
        {/* Customer */}
        <div className="truncate">
          <div className="text-sm font-medium text-gray-900 truncate">
            {item.customerName}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {item.customerEmail}
          </div>
        </div>

        {/* Recipient */}
        <div className="truncate">
          <div className="text-sm text-gray-900 truncate">{item.recipient}</div>
        </div>

        {/* Sender */}
        <div className="truncate">
          <div className="text-sm text-gray-900 truncate">{item.sender}</div>
        </div>

        {/* Service */}
        <div>
          <div className="text-sm text-gray-900">{item.serviceType}</div>
        </div>

        {/* Status */}
        <div>
          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>

        {/* Created */}
        <div>
          <div className="text-sm text-gray-900">
            {new Date(item.createdAt).toLocaleDateString()}
          </div>
        </div>

        {/* Actions */}
        <div>
          <select
            value={item.status}
            onChange={(e) => data.onStatusChange(item.id, e.target.value as QueueItem['status'])}
            className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            aria-label={`Change status for ${item.customerName}`}
          >
            <option value="waiting">Waiting</option>
            <option value="in-progress">In Progress</option>
            <option value="sending">Sending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export const VirtualQueueTable: React.FC<VirtualQueueTableProps> = ({
  items,
  onStatusChange,
  isLoading,
}) => {
  const itemData = useMemo(
    () => ({ items, onStatusChange }),
    [items, onStatusChange]
  );

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-12 text-center">
          <p className="text-gray-500">No queue items found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Table Header */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="grid grid-cols-7 gap-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div>Customer</div>
          <div>Recipient</div>
          <div>Sender</div>
          <div>Service</div>
          <div>Status</div>
          <div>Created</div>
          <div>Actions</div>
        </div>
      </div>

      {/* Virtual List */}
      <List
        height={600}
        itemCount={items.length}
        itemSize={80}
        width="100%"
        itemData={itemData}
      >
        {Row}
      </List>

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}
    </div>
  );
};

export default VirtualQueueTable;
