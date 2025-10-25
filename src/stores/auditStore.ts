/**
 * Audit Store for KumoMTA UI Dashboard
 * State management for audit logs using Zustand
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  AuditEvent,
  AuditLogFilter,
  AuditLogStats,
  AuditRetentionPolicy,
} from '../types/audit';
import { auditService } from '../services/auditService';

interface AuditState {
  // State
  events: AuditEvent[];
  filteredEvents: AuditEvent[];
  selectedEvent: AuditEvent | null;
  stats: AuditLogStats | null;
  retentionPolicy: AuditRetentionPolicy | null;
  filters: AuditLogFilter;
  isLoading: boolean;
  error: string | null;
  totalEvents: number;
  currentPage: number;
  pageSize: number;
  realtimeEnabled: boolean;

  // Actions
  fetchAuditLogs: (filters?: AuditLogFilter) => Promise<void>;
  fetchAuditStats: (filters?: AuditLogFilter) => Promise<void>;
  fetchRetentionPolicy: () => Promise<void>;
  updateRetentionPolicy: (policy: AuditRetentionPolicy) => Promise<void>;
  searchLogs: (query: string) => Promise<void>;
  setFilters: (filters: Partial<AuditLogFilter>) => void;
  clearFilters: () => void;
  selectEvent: (event: AuditEvent | null) => void;
  exportLogs: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
  addRealtimeEvent: (event: AuditEvent) => void;
  toggleRealtime: () => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  clearError: () => void;
}

const defaultFilters: AuditLogFilter = {
  limit: 50,
  offset: 0,
  sortBy: 'timestamp',
  sortOrder: 'desc',
};

export const useAuditStore = create<AuditState>()(
  devtools(
    (set, get) => ({
      // Initial state
      events: [],
      filteredEvents: [],
      selectedEvent: null,
      stats: null,
      retentionPolicy: null,
      filters: defaultFilters,
      isLoading: false,
      error: null,
      totalEvents: 0,
      currentPage: 1,
      pageSize: 50,
      realtimeEnabled: true,

      // Fetch audit logs
      fetchAuditLogs: async (filters) => {
        set({ isLoading: true, error: null });
        try {
          const currentFilters = filters || get().filters;
          const response = await auditService.getAuditLogs(currentFilters);

          set({
            events: response.events,
            filteredEvents: response.events,
            totalEvents: response.total,
            currentPage: response.page,
            pageSize: response.pageSize,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch audit logs',
            isLoading: false,
          });
        }
      },

      // Fetch audit statistics
      fetchAuditStats: async (filters) => {
        try {
          const stats = await auditService.getAuditStats(filters || get().filters);
          set({ stats });
        } catch (error) {
          console.error('Failed to fetch audit stats:', error);
        }
      },

      // Fetch retention policy
      fetchRetentionPolicy: async () => {
        try {
          const policy = await auditService.getRetentionPolicy();
          set({ retentionPolicy: policy });
        } catch (error) {
          console.error('Failed to fetch retention policy:', error);
        }
      },

      // Update retention policy
      updateRetentionPolicy: async (policy) => {
        set({ isLoading: true, error: null });
        try {
          const updatedPolicy = await auditService.updateRetentionPolicy(policy);
          set({ retentionPolicy: updatedPolicy, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update retention policy',
            isLoading: false,
          });
        }
      },

      // Search logs
      searchLogs: async (query) => {
        set({ isLoading: true, error: null });
        try {
          const response = await auditService.searchAuditLogs(query, get().filters);
          set({
            filteredEvents: response.events,
            totalEvents: response.total,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to search audit logs',
            isLoading: false,
          });
        }
      },

      // Set filters
      setFilters: (newFilters) => {
        const updatedFilters = { ...get().filters, ...newFilters };
        set({ filters: updatedFilters });
        get().fetchAuditLogs(updatedFilters);
      },

      // Clear filters
      clearFilters: () => {
        set({ filters: defaultFilters });
        get().fetchAuditLogs(defaultFilters);
      },

      // Select event
      selectEvent: (event) => {
        set({ selectedEvent: event });
      },

      // Export logs
      exportLogs: async (format) => {
        set({ isLoading: true, error: null });
        try {
          const blob = await auditService.exportAuditLog({
            format,
            filters: get().filters,
            includeDetails: true,
          });

          const timestamp = new Date().toISOString().split('T')[0];
          const filename = `audit-log-${timestamp}.${format}`;
          await auditService.downloadExport(blob, filename);

          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to export audit logs',
            isLoading: false,
          });
        }
      },

      // Add realtime event
      addRealtimeEvent: (event) => {
        if (!get().realtimeEnabled) return;

        set(state => ({
          events: [event, ...state.events].slice(0, state.pageSize),
          filteredEvents: [event, ...state.filteredEvents].slice(0, state.pageSize),
          totalEvents: state.totalEvents + 1,
        }));

        // Refresh stats
        get().fetchAuditStats();
      },

      // Toggle realtime updates
      toggleRealtime: () => {
        set(state => ({ realtimeEnabled: !state.realtimeEnabled }));
      },

      // Set current page
      setPage: (page) => {
        const offset = (page - 1) * get().pageSize;
        set({ currentPage: page });
        get().setFilters({ offset });
      },

      // Set page size
      setPageSize: (size) => {
        set({ pageSize: size, currentPage: 1 });
        get().setFilters({ limit: size, offset: 0 });
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'AuditStore' }
  )
);
