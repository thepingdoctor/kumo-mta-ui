import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { QueueFilter, QueueItem } from '../types/queue';
import { ERROR_MESSAGES } from '../constants';

export const useQueue = (filters: QueueFilter) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['queue', filters],
    queryFn: async () => {
      try {
        const response = await apiService.queue.getItems(filters);
        return response.data;
      } catch (error) {
        throw new Error(ERROR_MESSAGES.QUEUE_LOAD_FAILED);
      }
    }
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: QueueItem['status'] }) =>
      apiService.queue.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }
  });

  const addCustomer = useMutation({
    mutationFn: (data: Partial<QueueItem>) =>
      apiService.queue.addCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    }
  });

  return {
    ...query,
    updateStatus,
    addCustomer
  };
};