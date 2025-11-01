/**
 * Queue Model Adapter
 *
 * Provides backward compatibility between the legacy customer service
 * queue model and the new email queue model.
 *
 * This adapter allows gradual migration without breaking existing code.
 */

import type { QueueItem } from '../types/queue';
import type { MessageQueueItem, MessageQueueStatus } from '../types/email-queue';

/**
 * Convert legacy QueueItem to new MessageQueueItem format
 */
export function legacyToEmailQueue(legacy: QueueItem): MessageQueueItem {
  return {
    // Core Identifiers
    id: legacy.id,
    message_id: legacy.id, // Use ID as message_id for legacy data
    queue_name: legacy.serviceType || 'default',

    // Message Routing
    recipient: legacy.customerEmail,
    sender: 'noreply@system.local', // Default sender for legacy data
    domain: extractDomain(legacy.customerEmail),
    routing_domain: undefined,

    // Campaign & Organization
    campaign_id: undefined,
    tenant_id: legacy.customerId,
    pool_name: undefined,

    // Queue State Management
    status: mapLegacyStatus(legacy.status),
    queue_state: 'active',
    priority: legacy.priority,

    // Delivery Metadata
    size_bytes: 0, // Unknown for legacy data
    num_attempts: 0,
    max_attempts: 20,
    last_attempt_at: undefined,
    next_attempt_at: undefined,

    // Error Handling
    last_bounce_reason: undefined,
    bounce_classification: undefined,

    // Timestamps
    created_at: legacy.createdAt,
    scheduled_at: undefined,
    delivered_at: legacy.status === 'completed' ? legacy.updatedAt : undefined,
    expires_at: undefined,

    // Response Tracking
    smtp_response: undefined,
    delivery_protocol: 'smtp',

    // Headers & Content References
    headers: undefined,
    body_hash: undefined,
    attachment_count: undefined,

    // Custom Metadata
    tags: [legacy.serviceType],
    metadata: {
      legacy: true,
      customer_name: legacy.customerName,
      customer_phone: legacy.customerPhone,
      notes: legacy.notes,
      estimated_wait_time: legacy.estimatedWaitTime,
      actual_wait_time: legacy.actualWaitTime,
    },
  };
}

/**
 * Convert new MessageQueueItem to legacy QueueItem format
 * Used for backward compatibility with existing components
 */
export function emailQueueToLegacy(email: MessageQueueItem): QueueItem {
  const legacyMetadata = email.metadata as Record<string, any> | undefined;

  return {
    id: email.id,
    customerId: email.tenant_id || '',
    customerName: (legacyMetadata?.customer_name as string) || extractNameFromEmail(email.recipient),
    customerEmail: email.recipient,
    customerPhone: (legacyMetadata?.customer_phone as string) || '',
    serviceType: email.queue_name,
    priority: email.priority,
    status: mapEmailStatusToLegacy(email.status),
    notes: (legacyMetadata?.notes as string) || '',
    estimatedWaitTime: (legacyMetadata?.estimated_wait_time as number) || 0,
    actualWaitTime: (legacyMetadata?.actual_wait_time as number) || undefined,
    createdAt: email.created_at,
    updatedAt: email.delivered_at || email.last_attempt_at || email.created_at,
    notificationsSent: [],
  };
}

/**
 * Map legacy status to email queue status
 */
function mapLegacyStatus(status: QueueItem['status']): MessageQueueStatus {
  const statusMap: Record<QueueItem['status'], MessageQueueStatus> = {
    'waiting': 'scheduled',
    'in-progress': 'in_delivery',
    'completed': 'delivered',
    'cancelled': 'cancelled',
  };
  return statusMap[status] || 'ready';
}

/**
 * Map email queue status to legacy status
 */
function mapEmailStatusToLegacy(status: MessageQueueStatus): QueueItem['status'] {
  if (status === 'delivered') return 'completed';
  if (status === 'in_delivery' || status === 'ready') return 'in-progress';
  if (status === 'cancelled' || status === 'expired') return 'cancelled';
  return 'waiting'; // scheduled, suspended, deferred, bounced
}

/**
 * Extract domain from email address
 */
function extractDomain(email: string): string {
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : 'unknown';
}

/**
 * Extract name from email address (before @)
 */
function extractNameFromEmail(email: string): string {
  const parts = email.split('@');
  return parts.length > 0 ? parts[0] : 'Unknown';
}

/**
 * Batch convert legacy queue items to email queue items
 */
export function batchLegacyToEmailQueue(items: QueueItem[]): MessageQueueItem[] {
  return items.map(legacyToEmailQueue);
}

/**
 * Batch convert email queue items to legacy queue items
 */
export function batchEmailQueueToLegacy(items: MessageQueueItem[]): QueueItem[] {
  return items.map(emailQueueToLegacy);
}
