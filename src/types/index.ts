import type { UserRole } from './roles';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export interface EmailMetrics {
  sent: number;
  bounced: number;
  delayed: number;
  throughput: number;
}

/**
 * @deprecated Hybrid queue model (mixing customer service + email MTA fields)
 *
 * This duplicate QueueItem definition in index.ts is deprecated.
 * Use the official definition from './queue' for legacy code,
 * or MessageQueueItem from './email-queue' for new email queue features.
 *
 * This interface will be removed in v3.0
 */
export interface QueueItem {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  recipient: string;
  sender: string;
  serviceType: string;
  priority: number;
  status: 'waiting' | 'in-progress' | 'completed' | 'cancelled' | 'queued' | 'sending' | 'failed';
  notes: string;
  estimatedWaitTime: number; // in minutes
  actualWaitTime?: number; // in minutes
  timestamp: string;
  retries: number;
  createdAt: string;
  updatedAt: string;
  notificationsSent: NotificationRecord[];
}

// Export new email queue types for KumoMTA integration
export type {
  MessageQueueItem,
  MessageQueueStatus,
  QueueState,
  BounceType,
  SmtpResponse,
  EmailQueueMetrics,
  DomainMetric,
  EmailQueueFilter,
  QueueOperationResult,
} from './email-queue';

// Export adapter utilities for backward compatibility
export {
  legacyToEmailQueue,
  emailQueueToLegacy,
  batchLegacyToEmailQueue,
  batchEmailQueueToLegacy,
} from '../adapters/queue-adapter';

export interface NotificationRecord {
  id: string;
  type: 'email' | 'sms';
  status: 'sent' | 'failed';
  timestamp: string;
}

export interface ServerStatus {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  activeConnections: number;
  queueSize: number;
}