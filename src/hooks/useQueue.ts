import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { EmailQueueFilter, MessageQueueItem } from '../types/email-queue';
import type { QueueFilter, QueueItem } from '../types/queue';
import { ERROR_MESSAGES } from '../constants';

/**
 * Email Queue Hook - Enhanced for KumoMTA Integration
 *
 * Supports both legacy QueueFilter and new EmailQueueFilter
 * Returns MessageQueueItem[] with backward compatibility
 */

/**
 * Adapter to convert legacy QueueItem to MessageQueueItem
 */
const adaptLegacyQueueItem = (item: QueueItem): MessageQueueItem => ({
  id: item.id,
  message_id: item.email || `msg-${item.id}`,
  queue_name: item.priority,
  recipient: item.email,
  sender: item.name, // Using name as sender (legacy mapping)
  domain: item.email.split('@')[1] || 'unknown',
  status: adaptLegacyStatus(item.status),
  queue_state: 'active',
  priority: item.priority === 'high' ? 8 : item.priority === 'medium' ? 5 : 2,
  size_bytes: 0, // Not available in legacy
  num_attempts: 0,
  max_attempts: 20,
  created_at: item.createdAt,
});

/**
 * Adapter to convert legacy status to MessageQueueStatus
 */
const adaptLegacyStatus = (status: QueueItem['status']): MessageQueueItem['status'] => {
  const statusMap: Record<string, MessageQueueItem['status']> = {
    'pending': 'ready',
    'active': 'in_delivery',
    'resolved': 'delivered',
    'cancelled': 'cancelled',
  };
  return statusMap[status] || 'ready';
};

/**
 * Main useQueue hook with EmailQueueFilter support
 */
export const useQueue = (filters: EmailQueueFilter | QueueFilter) => {
  const queryClient = useQueryClient();

  // Determine if using legacy or new filter type
  const isLegacyFilter = 'status' in filters &&
    (filters.status === 'pending' || filters.status === 'active' ||
     filters.status === 'resolved' || filters.status === 'cancelled');

  const query = useQuery({
    queryKey: ['queue', filters],
    queryFn: async (): Promise<MessageQueueItem[]> => {
      try {
        if (isLegacyFilter) {
          // Legacy path - use existing API endpoint
          const response = await apiService.queue.getItems(filters as QueueFilter);
          // Adapt legacy QueueItem[] to MessageQueueItem[]
          return response.data.map(adaptLegacyQueueItem);
        } else {
          // New email queue path - TODO: implement new endpoint
          // For now, use legacy endpoint and adapt
          const response = await apiService.queue.getItems(filters as QueueFilter);
          return response.data.map(adaptLegacyQueueItem);
        }
      } catch {
        throw new Error(ERROR_MESSAGES.QUEUE_LOAD_FAILED);
      }
    }
  });

  // Legacy mutation - update status
  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QueueItem['status'] }) =>
      apiService.queue.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }
  });

  // Legacy mutation - add customer
  const addCustomer = useMutation({
    mutationFn: (data: Partial<QueueItem>) =>
      apiService.queue.addCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }
  });

  // New mutation - suspend queue
  const suspendQueue = useMutation({
    mutationFn: ({ domain, reason, duration }: { domain: string; reason: string; duration?: number }) =>
      apiService.kumomta.suspendQueue(domain, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }
  });

  // New mutation - resume queue
  const resumeQueue = useMutation({
    mutationFn: ({ domain }: { domain: string }) =>
      apiService.kumomta.resumeQueue(domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }
  });

  // New mutation - suspend ready queue
  const suspendReadyQueue = useMutation({
    mutationFn: ({ domain, reason }: { domain: string; reason: string }) =>
      apiService.kumomta.suspendReadyQueue(domain, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }
  });

  // New mutation - rebind messages
  const rebindMessages = useMutation({
    mutationFn: (data: {
      campaign?: string;
      tenant?: string;
      domain?: string;
      routing_domain?: string
    }) =>
      apiService.kumomta.rebindMessages(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }
  });

  // New mutation - bounce messages
  const bounceMessages = useMutation({
    mutationFn: (data: {
      campaign?: string;
      tenant?: string;
      domain?: string;
      reason: string
    }) =>
      apiService.kumomta.bounceMessages(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }
  });

  return {
    ...query,
    // Legacy mutations (backward compatibility)
    updateStatus,
    addCustomer,
    // New email queue operations
    suspendQueue,
    resumeQueue,
    suspendReadyQueue,
    rebindMessages,
    bounceMessages,
  };
};
