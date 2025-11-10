/**
 * useAuditLog Hook
 *
 * React hook for audit log queries and statistics
 */

import { useState, useCallback } from 'react';
import { AuditLogEntry, AuditLogQuery } from '../types/rbac';
import { auditService, AuditStats } from '../services/rbacService';

export interface UseAuditLogResult {
  entries: AuditLogEntry[];
  total: number;
  stats: AuditStats | null;
  loading: boolean;
  error: Error | null;
  query: (params: AuditLogQuery) => Promise<void>;
  getEntry: (id: string) => Promise<AuditLogEntry>;
  exportLogs: (params: AuditLogQuery, format?: 'csv' | 'json') => Promise<void>;
  fetchStats: (dateFrom?: string, dateTo?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useAuditLog(initialQuery?: AuditLogQuery): UseAuditLogResult {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentQuery, setCurrentQuery] = useState<AuditLogQuery | undefined>(initialQuery);

  const query = useCallback(async (params: AuditLogQuery) => {
    try {
      setLoading(true);
      setError(null);
      setCurrentQuery(params);
      const result = await auditService.query(params);
      setEntries(result.entries);
      setTotal(result.total);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to query audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getEntry = useCallback(async (id: string): Promise<AuditLogEntry> => {
    try {
      setLoading(true);
      setError(null);
      const entry = await auditService.get(id);
      return entry;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportLogs = useCallback(async (
    params: AuditLogQuery,
    format: 'csv' | 'json' = 'csv'
  ) => {
    try {
      setLoading(true);
      setError(null);
      const blob = await auditService.export(params, format);

      // Download file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-log-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to export audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (dateFrom?: string, dateTo?: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await auditService.getStats(dateFrom, dateTo);
      setStats(result);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch audit stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (currentQuery) {
      await query(currentQuery);
    }
  }, [query, currentQuery]);

  return {
    entries,
    total,
    stats,
    loading,
    error,
    query,
    getEntry,
    exportLogs,
    fetchStats,
    refresh,
  };
}
