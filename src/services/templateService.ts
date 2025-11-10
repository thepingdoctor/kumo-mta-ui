/**
 * Template Service
 *
 * API client for email template management
 */

import {
  EmailTemplate,
  TemplateVersion,
  TemplateABTest,
  TemplateCategory,
  TemplateSearchParams,
  TemplateExport
} from '../types/template';

const API_BASE = '/api/v1/templates';

/**
 * Template CRUD operations
 */
export const templateService = {
  /**
   * List templates with search/filter
   */
  async list(params?: TemplateSearchParams): Promise<{ templates: EmailTemplate[]; total: number }> {
    const queryParams = new URLSearchParams();
    if (params?.query) queryParams.set('query', params.query);
    if (params?.category) queryParams.set('category', params.category);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.format) queryParams.set('format', params.format);
    if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());

    const response = await fetch(`${API_BASE}?${queryParams}`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  /**
   * Get single template by ID
   */
  async get(id: string): Promise<EmailTemplate> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch template');
    return response.json();
  },

  /**
   * Create new template
   */
  async create(template: Omit<EmailTemplate, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    if (!response.ok) throw new Error('Failed to create template');
    return response.json();
  },

  /**
   * Update existing template
   */
  async update(id: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update template');
    return response.json();
  },

  /**
   * Delete template
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete template');
  },

  /**
   * Publish template
   */
  async publish(id: string): Promise<EmailTemplate> {
    const response = await fetch(`${API_BASE}/${id}/publish`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to publish template');
    return response.json();
  },

  /**
   * Archive template
   */
  async archive(id: string): Promise<EmailTemplate> {
    const response = await fetch(`${API_BASE}/${id}/archive`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to archive template');
    return response.json();
  },

  /**
   * Duplicate template
   */
  async duplicate(id: string, name: string): Promise<EmailTemplate> {
    const response = await fetch(`${API_BASE}/${id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw new Error('Failed to duplicate template');
    return response.json();
  },

  /**
   * Get template version history
   */
  async getVersions(id: string): Promise<TemplateVersion[]> {
    const response = await fetch(`${API_BASE}/${id}/versions`);
    if (!response.ok) throw new Error('Failed to fetch versions');
    return response.json();
  },

  /**
   * Get specific version
   */
  async getVersion(id: string, version: number): Promise<TemplateVersion> {
    const response = await fetch(`${API_BASE}/${id}/versions/${version}`);
    if (!response.ok) throw new Error('Failed to fetch version');
    return response.json();
  },

  /**
   * Restore to specific version
   */
  async restoreVersion(id: string, version: number): Promise<EmailTemplate> {
    const response = await fetch(`${API_BASE}/${id}/versions/${version}/restore`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to restore version');
    return response.json();
  },

  /**
   * Export template
   */
  async export(id: string): Promise<TemplateExport> {
    const response = await fetch(`${API_BASE}/${id}/export`);
    if (!response.ok) throw new Error('Failed to export template');
    return response.json();
  },

  /**
   * Import template
   */
  async import(data: TemplateExport): Promise<EmailTemplate> {
    const response = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to import template');
    return response.json();
  },
};

/**
 * A/B Test operations
 */
export const abTestService = {
  /**
   * List A/B tests
   */
  async list(): Promise<TemplateABTest[]> {
    const response = await fetch(`${API_BASE}/ab-tests`);
    if (!response.ok) throw new Error('Failed to fetch A/B tests');
    return response.json();
  },

  /**
   * Get A/B test details
   */
  async get(id: string): Promise<TemplateABTest> {
    const response = await fetch(`${API_BASE}/ab-tests/${id}`);
    if (!response.ok) throw new Error('Failed to fetch A/B test');
    return response.json();
  },

  /**
   * Create A/B test
   */
  async create(test: Omit<TemplateABTest, 'id' | 'metrics' | 'createdAt'>): Promise<TemplateABTest> {
    const response = await fetch(`${API_BASE}/ab-tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test),
    });
    if (!response.ok) throw new Error('Failed to create A/B test');
    return response.json();
  },

  /**
   * Update A/B test
   */
  async update(id: string, updates: Partial<TemplateABTest>): Promise<TemplateABTest> {
    const response = await fetch(`${API_BASE}/ab-tests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update A/B test');
    return response.json();
  },

  /**
   * Start A/B test
   */
  async start(id: string): Promise<TemplateABTest> {
    const response = await fetch(`${API_BASE}/ab-tests/${id}/start`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to start A/B test');
    return response.json();
  },

  /**
   * Stop A/B test
   */
  async stop(id: string): Promise<TemplateABTest> {
    const response = await fetch(`${API_BASE}/ab-tests/${id}/stop`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to stop A/B test');
    return response.json();
  },

  /**
   * Delete A/B test
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/ab-tests/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete A/B test');
  },
};

/**
 * Category operations
 */
export const categoryService = {
  /**
   * List categories
   */
  async list(): Promise<TemplateCategory[]> {
    const response = await fetch(`${API_BASE}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  /**
   * Create category
   */
  async create(category: Omit<TemplateCategory, 'id' | 'templateCount'>): Promise<TemplateCategory> {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
  },

  /**
   * Update category
   */
  async update(id: string, updates: Partial<TemplateCategory>): Promise<TemplateCategory> {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update category');
    return response.json();
  },

  /**
   * Delete category
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete category');
  },
};
