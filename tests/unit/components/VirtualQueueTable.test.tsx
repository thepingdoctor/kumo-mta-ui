import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VirtualQueueTable } from '../../../src/components/queue/VirtualQueueTable';
import type { QueueItem } from '../../../src/types/queue';

const mockQueueItems: QueueItem[] = [
  {
    id: '1',
    customerId: 'cust1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1234567890',
    recipient: 'recipient@example.com',
    sender: 'sender@example.com',
    serviceType: 'transactional',
    priority: 1,
    status: 'waiting',
    notes: 'Test note',
    estimatedWaitTime: 10,
    timestamp: '2024-01-01T12:00:00Z',
    retries: 0,
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    notificationsSent: [],
  },
  {
    id: '2',
    customerId: 'cust2',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerPhone: '+1234567891',
    recipient: 'recipient2@example.com',
    sender: 'sender2@example.com',
    serviceType: 'marketing',
    priority: 2,
    status: 'completed',
    notes: 'Test note 2',
    estimatedWaitTime: 5,
    timestamp: '2024-01-01T12:05:00Z',
    retries: 0,
    createdAt: '2024-01-01T12:05:00Z',
    updatedAt: '2024-01-01T12:10:00Z',
    notificationsSent: [],
  },
];

describe('VirtualQueueTable', () => {
  it('should render table headers', () => {
    const onStatusChange = vi.fn();
    render(<VirtualQueueTable items={mockQueueItems} onStatusChange={onStatusChange} isLoading={false} />);

    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Recipient')).toBeInTheDocument();
    expect(screen.getByText('Sender')).toBeInTheDocument();
    expect(screen.getByText('Service')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('should render empty state when no items', () => {
    const onStatusChange = vi.fn();
    render(<VirtualQueueTable items={[]} onStatusChange={onStatusChange} isLoading={false} />);

    expect(screen.getByText('No queue items found')).toBeInTheDocument();
  });

  it('should render virtual list with items', () => {
    const onStatusChange = vi.fn();
    const { container } = render(<VirtualQueueTable items={mockQueueItems} onStatusChange={onStatusChange} isLoading={false} />);

    // Virtual list should render - react-window creates a div with specific styling
    // Check for the presence of customer names which should be in the virtual list
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(container.querySelector('[style*="position"]')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const onStatusChange = vi.fn();
    render(<VirtualQueueTable items={mockQueueItems} onStatusChange={onStatusChange} isLoading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
