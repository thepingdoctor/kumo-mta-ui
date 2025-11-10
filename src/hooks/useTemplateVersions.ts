/**
 * useTemplateVersions Hook
 *
 * React hook for template version history management
 */

import { useState, useCallback, useEffect } from 'react';
import { TemplateVersion, EmailTemplate } from '../types/template';
import { templateService } from '../services/templateService';

export interface UseTemplateVersionsResult {
  versions: TemplateVersion[];
  loading: boolean;
  error: Error | null;
  fetchVersions: (templateId: string) => Promise<void>;
  getVersion: (templateId: string, version: number) => Promise<TemplateVersion>;
  restoreVersion: (templateId: string, version: number) => Promise<EmailTemplate>;
  compareVersions: (version1: TemplateVersion, version2: TemplateVersion) => VersionComparison;
}

export interface VersionComparison {
  additions: number;
  deletions: number;
  changes: Array<{
    type: 'add' | 'remove' | 'modify';
    field: string;
    oldValue?: string;
    newValue?: string;
  }>;
}

export function useTemplateVersions(templateId?: string): UseTemplateVersionsResult {
  const [versions, setVersions] = useState<TemplateVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVersions = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await templateService.getVersions(id);
      setVersions(result);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch versions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getVersion = useCallback(async (
    id: string,
    version: number
  ): Promise<TemplateVersion> => {
    try {
      setLoading(true);
      setError(null);
      const result = await templateService.getVersion(id, version);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreVersion = useCallback(async (
    id: string,
    version: number
  ): Promise<EmailTemplate> => {
    try {
      setLoading(true);
      setError(null);
      const restored = await templateService.restoreVersion(id, version);
      await fetchVersions(id); // Refresh versions
      return restored;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchVersions]);

  const compareVersions = useCallback((
    version1: TemplateVersion,
    version2: TemplateVersion
  ): VersionComparison => {
    const changes: VersionComparison['changes'] = [];
    let additions = 0;
    let deletions = 0;

    // Compare content
    if (version1.content !== version2.content) {
      const lines1 = version1.content.split('\n');
      const lines2 = version2.content.split('\n');

      const added = lines2.length - lines1.length;
      if (added > 0) additions += added;
      else deletions += Math.abs(added);

      changes.push({
        type: 'modify',
        field: 'content',
        oldValue: `${lines1.length} lines`,
        newValue: `${lines2.length} lines`,
      });
    }

    // Compare subject
    if (version1.subject !== version2.subject) {
      changes.push({
        type: 'modify',
        field: 'subject',
        oldValue: version1.subject,
        newValue: version2.subject,
      });
    }

    return {
      additions,
      deletions,
      changes,
    };
  }, []);

  // Auto-fetch if templateId provided
  useEffect(() => {
    if (templateId) {
      fetchVersions(templateId);
    }
  }, [templateId, fetchVersions]);

  return {
    versions,
    loading,
    error,
    fetchVersions,
    getVersion,
    restoreVersion,
    compareVersions,
  };
}
