/**
 * useAlertRules Hook - Alert Rule Management
 * Manages alert rule CRUD operations and testing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../services/alertService';
import type { AlertRuleFormData } from '../types/alert';
import { toast } from 'react-hot-toast';

export interface UseAlertRulesFilters {
  status?: string;
  severity?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useAlertRules(filters?: UseAlertRulesFilters) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alert-rules', filters],
    queryFn: () => alertService.getAlertRules(filters),
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: AlertRuleFormData) => alertService.createAlertRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule created successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to create alert rule';
      toast.error(message);
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AlertRuleFormData> }) =>
      alertService.updateAlertRule(id, data),
    onSuccess: (updatedRule) => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      queryClient.invalidateQueries({ queryKey: ['alert-rule', updatedRule.id] });
      toast.success('Alert rule updated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to update alert rule';
      toast.error(message);
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: (id: string) => alertService.deleteAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule deleted successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to delete alert rule';
      toast.error(message);
    },
  });

  const toggleRuleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      alertService.toggleAlertRule(id, enabled),
    onSuccess: (updatedRule) => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      queryClient.invalidateQueries({ queryKey: ['alert-rule', updatedRule.id] });
      toast.success(`Alert rule ${updatedRule.status === 'enabled' ? 'enabled' : 'disabled'}`);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to toggle alert rule';
      toast.error(message);
    },
  });

  const testRuleMutation = useMutation({
    mutationFn: (id: string) => alertService.testAlertRule(id),
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to test alert rule';
      toast.error(message);
    },
  });

  const duplicateRuleMutation = useMutation({
    mutationFn: (id: string) => alertService.duplicateAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-rules'] });
      toast.success('Alert rule duplicated successfully');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error && 'response' in error &&
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data
        ? String(error.response.data.message)
        : 'Failed to duplicate alert rule';
      toast.error(message);
    },
  });

  return {
    rules: data?.rules || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    createRule: createRuleMutation.mutate,
    updateRule: updateRuleMutation.mutate,
    deleteRule: deleteRuleMutation.mutate,
    toggleRule: toggleRuleMutation.mutate,
    testRule: testRuleMutation.mutate,
    duplicateRule: duplicateRuleMutation.mutate,
    isCreating: createRuleMutation.isPending,
    isUpdating: updateRuleMutation.isPending,
    isDeleting: deleteRuleMutation.isPending,
    isToggling: toggleRuleMutation.isPending,
    isTesting: testRuleMutation.isPending,
    isDuplicating: duplicateRuleMutation.isPending,
    testResult: testRuleMutation.data,
  };
}

export function useAlertRule(id: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['alert-rule', id],
    queryFn: () => alertService.getAlertRule(id!),
    enabled: !!id,
  });

  return {
    rule: data,
    isLoading,
    error,
    refetch,
  };
}
