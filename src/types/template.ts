/**
 * Email Template Types
 *
 * Defines types for email template management, versioning, and A/B testing
 */

export type TemplateFormat = 'mjml' | 'html' | 'text';
export type TemplateStatus = 'draft' | 'published' | 'archived';
export type EmailClient = 'gmail' | 'outlook' | 'apple-mail' | 'mobile' | 'webmail';

/**
 * Template variable for dynamic content
 */
export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'url';
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
  placeholder?: string;
}

/**
 * Email template definition
 */
export interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  format: TemplateFormat;
  subject: string;
  content: string; // MJML or HTML source
  compiledHtml?: string; // Compiled HTML (for MJML templates)
  textVersion?: string;
  variables: TemplateVariable[];
  category?: string;
  tags: string[];
  status: TemplateStatus;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Template version history entry
 */
export interface TemplateVersion {
  id: string;
  templateId: string;
  version: number;
  content: string;
  subject: string;
  changes: string; // Change description
  changedBy: string;
  changedAt: string;
  diff?: TemplateDiff;
}

/**
 * Diff between two template versions
 */
export interface TemplateDiff {
  additions: number;
  deletions: number;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'remove' | 'modify';
  lineNumber: number;
  oldContent?: string;
  newContent?: string;
}

/**
 * A/B Test configuration
 */
export interface TemplateABTest {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  variantA: {
    templateId: string;
    name: string;
    traffic: number; // Percentage 0-100
  };
  variantB: {
    templateId: string;
    name: string;
    traffic: number; // Percentage 0-100
  };
  startDate: string;
  endDate?: string;
  metrics: ABTestMetrics;
  createdBy: string;
  createdAt: string;
}

export interface ABTestMetrics {
  variantA: VariantMetrics;
  variantB: VariantMetrics;
  winner?: 'A' | 'B' | 'inconclusive';
}

export interface VariantMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

/**
 * Template category for organization
 */
export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parentId?: string;
  templateCount: number;
}

/**
 * Template preview configuration
 */
export interface TemplatePreviewConfig {
  client: EmailClient;
  width: number;
  height: number;
  darkMode?: boolean;
  testData?: Record<string, string | number | boolean>;
}

/**
 * MJML validation result
 */
export interface MJMLValidationResult {
  valid: boolean;
  errors: MJMLError[];
  warnings: MJMLWarning[];
  html?: string;
}

export interface MJMLError {
  line: number;
  message: string;
  tagName?: string;
}

export interface MJMLWarning {
  line: number;
  message: string;
  tagName?: string;
}

/**
 * Template search/filter parameters
 */
export interface TemplateSearchParams {
  query?: string;
  category?: string;
  tags?: string[];
  status?: TemplateStatus;
  format?: TemplateFormat;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'version';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Template export format
 */
export interface TemplateExport {
  template: EmailTemplate;
  versions?: TemplateVersion[];
  category?: TemplateCategory;
  exportedAt: string;
  exportedBy: string;
}
