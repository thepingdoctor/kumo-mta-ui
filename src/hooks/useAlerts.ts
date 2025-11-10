/**
 * useAlerts Hook - Alert Instance Management
 * Manages triggered alerts with CRUD operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../services/alertService';
import { toast } from 'react-hot-toast';

export interface UseAlertsFilters {
  status?: string;
  severity?: string;
  ruleId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function useAlerts(filters?: UseAlertsFilters) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => alertService.getAlerts(filters),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const acknowledgeAlertMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      alertService.acknowledgeAlert(id, note),
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert', updatedAlert.id] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
      toast.success('Alert acknowledged');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to acknowledge alert';
      toast.error(message);
    },
  });

  const snoozeAlertMutation = useMutation({
    mutationFn: ({ id, duration }: { id: string; duration: number }) =>
      alertService.snoozeAlert(id, duration),
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert', updatedAlert.id] });
      toast.success('Alert snoozed');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to snooze alert';
      toast.error(message);
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      alertService.resolveAlert(id, note),
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert', updatedAlert.id] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
      toast.success('Alert resolved');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to resolve alert';
      toast.error(message);
    },
  });

  const dismissAlertMutation = useMutation({
    mutationFn: (id: string) => alertService.dismissAlert(id),
    onSuccess: (updatedAlert) => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert', updatedAlert.id] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
      toast.success('Alert dismissed');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to dismiss alert';
      toast.error(message);
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: ({ ids, action, params }: { ids: string[]; action: 'acknowledge' | 'snooze' | 'resolve' | 'dismiss'; params?: unknown }) =>
      alertService.bulkUpdateAlerts(ids, action, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-stats'] });
      toast.success('Alerts updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to update alerts';
      toast.error(message);
    },
  });

  return {
    alerts: data?.alerts || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    acknowledgeAlert: acknowledgeAlertMutation.mutate,
    snoozeAlert: snoozeAlertMutation.mutate,
    resolveAlert: resolveAlertMutation.mutate,
    dismissAlert: dismissAlertMutation.mutate,
    bulkUpdate: bulkUpdateMutation.mutate,
    isAcknowledging: acknowledgeAlertMutation.isPending,
    isSnoozing: snoozeAlertMutation.isPending,
    isResolving: resolveAlertMutation.isPending,
    isDismissing: dismissAlertMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
}

export function useAlert(id: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alert', id],
    queryFn: () => alertService.getAlert(id!),
    enabled: !!id,
  });

  return {
    alert: data,
    isLoading,
    error,
    refetch,
  };
}

export function useAlertStats(timeRange?: '24h' | '7d' | '30d') {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alert-stats', timeRange],
    queryFn: () => alertService.getAlertStats(timeRange),
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
}
