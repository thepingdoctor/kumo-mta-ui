/**
 * @deprecated Legacy customer service queue model
 *
 * This interface is deprecated and maintained only for backward compatibility.
 * New code should use MessageQueueItem from './email-queue'
 *
 * Migration: Use the adapter in src/adapters/queue-adapter.ts to convert
 * between legacy and email queue formats.
 *
 * Will be removed in v3.0
 */
export interface QueueItem {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceType: string;
  priority: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled';
  notes: string;
  estimatedWaitTime: number; // in minutes
  actualWaitTime?: number; // in minutes
  createdAt: string;
  updatedAt: string;
  notificationsSent: NotificationRecord[];
}

export interface NotificationRecord {
  id: string;
  type: 'email' | 'sms';
  status: 'sent' | 'failed';
  timestamp: string;
}

export interface QueueService {
  id: string;
  name: string;
  description: string;
  averageServiceTime: number; // in minutes
  maxConcurrent: number;
  active: boolean;
}

export interface QueueMetrics {
  totalWaiting: number;
  averageWaitTime: number;
  longestWaitTime: number;
  serviceUtilization: number;
  customersServedToday: number;
}

export interface QueueFilter {
  serviceType?: string;
  status?: QueueItem['status'];
  searchQuery?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}