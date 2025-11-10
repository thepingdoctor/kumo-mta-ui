/**
 * useTemplates Hook
 *
 * React hook for template CRUD operations
 */

import { useState, useCallback } from 'react';
import { EmailTemplate, TemplateSearchParams } from '../types/template';
import { templateService } from '../services/templateService';

export interface UseTemplatesResult {
  templates: EmailTemplate[];
  total: number;
  loading: boolean;
  error: Error | null;
  fetchTemplates: (params?: TemplateSearchParams) => Promise<void>;
  getTemplate: (id: string) => Promise<EmailTemplate>;
  createTemplate: (template: Omit<EmailTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>) => Promise<EmailTemplate>;
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => Promise<EmailTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  publishTemplate: (id: string) => Promise<EmailTemplate>;
  archiveTemplate: (id: string) => Promise<EmailTemplate>;
  duplicateTemplate: (id: string, name: string) => Promise<EmailTemplate>;
  refresh: () => Promise<void>;
}

export function useTemplates(initialParams?: TemplateSearchParams): UseTemplatesResult {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentParams, setCurrentParams] = useState<TemplateSearchParams | undefined>(initialParams);

  const fetchTemplates = useCallback(async (params?: TemplateSearchParams) => {
    try {
      setLoading(true);
      setError(null);
      const searchParams = params || currentParams;
      setCurrentParams(searchParams);

      const result = await templateService.list(searchParams);
      setTemplates(result.templates);
      setTotal(result.total);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to fetch templates:', err);
    } finally {
      setLoading(false);
    }
  }, [currentParams]);

  const getTemplate = useCallback(async (id: string): Promise<EmailTemplate> => {
    try {
      setLoading(true);
      setError(null);
      const template = await templateService.get(id);
      return template;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTemplate = useCallback(async (
    template: Omit<EmailTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>
  ): Promise<EmailTemplate> => {
    try {
      setLoading(true);
      setError(null);
      const created = await templateService.create(template);
      await fetchTemplates(); // Refresh list
      return created;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  const updateTemplate = useCallback(async (
    id: string,
    updates: Partial<EmailTemplate>
  ): Promise<EmailTemplate> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await templateService.update(id, updates);
      await fetchTemplates(); // Refresh list
      return updated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await templateService.delete(id);
      await fetchTemplates(); // Refresh list
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  const publishTemplate = useCallback(async (id: string): Promise<EmailTemplate> => {
    try {
      setLoading(true);
      setError(null);
      const published = await templateService.publish(id);
      await fetchTemplates(); // Refresh list
      return published;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  const archiveTemplate = useCallback(async (id: string): Promise<EmailTemplate> => {
    try {
      setLoading(true);
      setError(null);
      const archived = await templateService.archive(id);
      await fetchTemplates(); // Refresh list
      return archived;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  const duplicateTemplate = useCallback(async (id: string, name: string): Promise<EmailTemplate> => {
    try {
      setLoading(true);
      setError(null);
      const duplicated = await templateService.duplicate(id, name);
      await fetchTemplates(); // Refresh list
      return duplicated;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchTemplates]);

  const refresh = useCallback(async () => {
    await fetchTemplates(currentParams);
  }, [fetchTemplates, currentParams]);

  return {
    templates,
    total,
    loading,
    error,
    fetchTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    publishTemplate,
    archiveTemplate,
    duplicateTemplate,
    refresh,
  };
}
