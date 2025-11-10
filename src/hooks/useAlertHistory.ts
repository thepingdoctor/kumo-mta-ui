/**
 * useAlertHistory Hook - Historical Alert Data
 * Query historical alerts with filtering and pagination
 */

import { useQuery } from '@tanstack/react-query';
import { alertService } from '../services/alertService';

export interface UseAlertHistoryFilters {
  status?: string;
  severity?: string;
  ruleId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export function useAlertHistory(filters?: UseAlertHistoryFilters) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alert-history', filters],
    queryFn: () => alertService.getAlerts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    alerts: data?.alerts || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
  };
}

export function useAlertTrends(filters?: {
  metric?: string;
  groupBy?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alert-trends', filters],
    queryFn: () => alertService.getAlertTrends(filters),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    trends: data || [],
    isLoading,
    error,
    refetch,
  };
}
