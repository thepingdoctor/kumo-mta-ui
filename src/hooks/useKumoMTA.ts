import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';

/**
 * Hook for KumoMTA server metrics
 */
export const useKumoMetrics = (refetchInterval = 5000) => {
  return useQuery({
    queryKey: ['kumomta-metrics'],
    queryFn: async () => {
      const response = await apiService.kumomta.getMetrics();
      return response.data;
    },
    refetchInterval,
    retry: 3,
    staleTime: 3000,
  });
};

/**
 * Hook for bounce classifications
 */
export const useBounces = () => {
  return useQuery({
    queryKey: ['kumomta-bounces'],
    queryFn: async () => {
      const response = await apiService.kumomta.getBounces();
      return response.data;
    },
    retry: 2,
  });
};

/**
 * Hook for scheduled queue details
 */
export const useScheduledQueue = (domain?: string) => {
  return useQuery({
    queryKey: ['kumomta-scheduled-queue', domain],
    queryFn: async () => {
      const response = await apiService.kumomta.getScheduledQueue(domain);
      return response.data;
    },
    enabled: !!domain,
    retry: 2,
  });
};

/**
 * Hook for queue suspension operations
 */
export const useQueueControl = () => {
  const queryClient = useQueryClient();

  const suspendQueue = useMutation({
    mutationFn: ({ domain, reason, duration }: { domain: string; reason: string; duration?: number }) =>
      apiService.kumomta.suspendQueue(domain, reason, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kumomta-scheduled-queue'] });
      queryClient.invalidateQueries({ queryKey: ['kumomta-metrics'] });
    },
  });

  const resumeQueue = useMutation({
    mutationFn: (domain: string) => apiService.kumomta.resumeQueue(domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kumomta-scheduled-queue'] });
      queryClient.invalidateQueries({ queryKey: ['kumomta-metrics'] });
    },
  });

  const suspendReadyQueue = useMutation({
    mutationFn: ({ domain, reason }: { domain: string; reason: string }) =>
      apiService.kumomta.suspendReadyQueue(domain, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kumomta-scheduled-queue'] });
    },
  });

  return {
    suspendQueue,
    resumeQueue,
    suspendReadyQueue,
  };
};

/**
 * Hook for message operations (rebind, bounce)
 */
export const useMessageOperations = () => {
  const queryClient = useQueryClient();

  const rebindMessages = useMutation({
    mutationFn: (data: { campaign?: string; tenant?: string; domain?: string; routing_domain?: string }) =>
      apiService.kumomta.rebindMessages(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kumomta-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
  });

  const bounceMessages = useMutation({
    mutationFn: (data: { campaign?: string; tenant?: string; domain?: string; reason: string }) =>
      apiService.kumomta.bounceMessages(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kumomta-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['kumomta-bounces'] });
    },
  });

  return {
    rebindMessages,
    bounceMessages,
  };
};

/**
 * Hook for diagnostic logging
 */
export const useDiagnostics = () => {
  const queryClient = useQueryClient();

  const traceLogs = useQuery({
    queryKey: ['kumomta-trace-logs'],
    queryFn: async () => {
      const response = await apiService.kumomta.getTraceLogs();
      return response.data;
    },
    refetchInterval: 10000,
    retry: 2,
  });

  const setDiagnosticLog = useMutation({
    mutationFn: ({ filter, duration }: { filter: string; duration?: number }) =>
      apiService.kumomta.setDiagnosticLog(filter, duration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kumomta-trace-logs'] });
    },
  });

  return {
    traceLogs,
    setDiagnosticLog,
  };
};
