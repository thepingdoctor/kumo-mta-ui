/**
 * useNotificationChannels Hook - Notification Channel Management
 * Manages notification channel configuration and testing
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../services/alertService';
import type { NotificationChannel, NotificationChannelFormData } from '../types/alert';
import { toast } from 'react-hot-toast';

export interface UseNotificationChannelsFilters {
  type?: string;
  enabled?: boolean;
}

export function useNotificationChannels(filters?: UseNotificationChannelsFilters) {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notification-channels', filters],
    queryFn: () => alertService.getNotificationChannels(filters),
  });

  const createChannelMutation = useMutation({
    mutationFn: (data: NotificationChannelFormData) => alertService.createNotificationChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
      toast.success('Notification channel created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create notification channel');
    },
  });

  const updateChannelMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationChannelFormData> }) =>
      alertService.updateNotificationChannel(id, data),
    onSuccess: (updatedChannel) => {
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
      queryClient.invalidateQueries({ queryKey: ['notification-channel', updatedChannel.id] });
      toast.success('Notification channel updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update notification channel');
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: (id: string) => alertService.deleteNotificationChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
      toast.success('Notification channel deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete notification channel');
    },
  });

  const toggleChannelMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      alertService.toggleNotificationChannel(id, enabled),
    onSuccess: (updatedChannel) => {
      queryClient.invalidateQueries({ queryKey: ['notification-channels'] });
      queryClient.invalidateQueries({ queryKey: ['notification-channel', updatedChannel.id] });
      toast.success(`Notification channel ${updatedChannel.enabled ? 'enabled' : 'disabled'}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to toggle notification channel');
    },
  });

  const testChannelMutation = useMutation({
    mutationFn: (id: string) => alertService.testNotificationChannel(id),
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Test notification sent successfully');
      } else {
        toast.error(result.message || 'Test notification failed');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to test notification channel');
    },
  });

  return {
    channels: data?.channels || [],
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    createChannel: createChannelMutation.mutate,
    updateChannel: updateChannelMutation.mutate,
    deleteChannel: deleteChannelMutation.mutate,
    toggleChannel: toggleChannelMutation.mutate,
    testChannel: testChannelMutation.mutate,
    isCreating: createChannelMutation.isPending,
    isUpdating: updateChannelMutation.isPending,
    isDeleting: deleteChannelMutation.isPending,
    isToggling: toggleChannelMutation.isPending,
    isTesting: testChannelMutation.isPending,
  };
}

export function useNotificationChannel(id: string | undefined) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notification-channel', id],
    queryFn: () => alertService.getNotificationChannel(id!),
    enabled: !!id,
  });

  return {
    channel: data,
    isLoading,
    error,
    refetch,
  };
}
