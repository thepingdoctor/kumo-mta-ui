/**
 * Template Validation Utilities
 *
 * Client-side validation for email templates
 */

import type { EmailTemplate, TemplateVariable } from '../types/template';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

/**
 * Validate email template
 */
export function validateTemplate(template: Partial<EmailTemplate>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!template.name || template.name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: 'Template name is required',
      code: 'REQUIRED_FIELD',
    });
  }

  if (template.name && template.name.length > 100) {
    errors.push({
      field: 'name',
      message: 'Template name must be 100 characters or less',
      code: 'MAX_LENGTH',
    });
  }

  if (!template.subject || template.subject.trim().length === 0) {
    errors.push({
      field: 'subject',
      message: 'Subject line is required',
      code: 'REQUIRED_FIELD',
    });
  }

  if (template.subject && template.subject.length > 200) {
    warnings.push({
      field: 'subject',
      message: 'Subject line over 60 characters may be truncated in some email clients',
      code: 'LONG_SUBJECT',
    });
  }

  if (!template.content || template.content.trim().length === 0) {
    errors.push({
      field: 'content',
      message: 'Template content is required',
      code: 'REQUIRED_FIELD',
    });
  }

  if (!template.format) {
    errors.push({
      field: 'format',
      message: 'Template format is required',
      code: 'REQUIRED_FIELD',
    });
  }

  // Content validation
  if (template.content) {
    const contentErrors = validateContent(template.content, template.format || 'html');
    errors.push(...contentErrors);
  }

  // Variable validation
  if (template.variables) {
    const variableErrors = validateVariables(template.variables);
    errors.push(...variableErrors);

    // Check if all variables in content are defined
    if (template.content) {
      const usedVariables = extractUsedVariables(template.content);
      const definedVariables = template.variables.map(v => v.name);

      usedVariables.forEach(varName => {
        if (!definedVariables.includes(varName)) {
          warnings.push({
            field: 'variables',
            message: `Variable "{{${varName}}}" is used but not defined`,
            code: 'UNDEFINED_VARIABLE',
          });
        }
      });

      definedVariables.forEach(varName => {
        if (!usedVariables.includes(varName)) {
          warnings.push({
            field: 'variables',
            message: `Variable "{{${varName}}}" is defined but not used`,
            code: 'UNUSED_VARIABLE',
          });
        }
      });
    }
  }

  // Category validation
  if (template.category && template.category.length > 50) {
    errors.push({
      field: 'category',
      message: 'Category name must be 50 characters or less',
      code: 'MAX_LENGTH',
    });
  }

  // Tags validation
  if (template.tags) {
    template.tags.forEach((tag, index) => {
      if (tag.length > 30) {
        errors.push({
          field: `tags[${index}]`,
          message: `Tag "${tag}" is too long (max 30 characters)`,
          code: 'MAX_LENGTH',
        });
      }
    });

    if (template.tags.length > 10) {
      warnings.push({
        field: 'tags',
        message: 'More than 10 tags may make organization difficult',
        code: 'TOO_MANY_TAGS',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate template content based on format
 */
function validateContent(content: string, format: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (format === 'mjml') {
    // Basic MJML validation
    if (!content.includes('<mjml>')) {
      errors.push({
        field: 'content',
        message: 'MJML template must contain <mjml> root element',
        code: 'INVALID_MJML',
      });
    }

    if (!content.includes('<mj-body>')) {
      errors.push({
        field: 'content',
        message: 'MJML template must contain <mj-body> element',
        code: 'INVALID_MJML',
      });
    }

    // Check for common MJML errors
    const mjmlTagPattern = /<mj-([a-z-]+)(?:\s|>)/gi;
    const validTags = [
      'mjml', 'mj-body', 'mj-head', 'mj-section', 'mj-column', 'mj-text',
      'mj-button', 'mj-image', 'mj-divider', 'mj-spacer', 'mj-social',
      'mj-social-element', 'mj-navbar', 'mj-navbar-link', 'mj-raw',
      'mj-title', 'mj-preview', 'mj-attributes', 'mj-all', 'mj-class',
      'mj-style', 'mj-font', 'mj-wrapper', 'mj-group', 'mj-hero',
      'mj-accordion', 'mj-accordion-element', 'mj-carousel',
      'mj-carousel-image', 'mj-table'
    ];

    let match;
    while ((match = mjmlTagPattern.exec(content)) !== null) {
      const tagName = match[1];
      if (tagName && !validTags.includes(tagName)) {
        errors.push({
          field: 'content',
          message: `Unknown MJML tag: <${tagName}>`,
          code: 'UNKNOWN_MJML_TAG',
        });
      }
    }
  } else if (format === 'html') {
    // Basic HTML validation
    if (!content.includes('<html') && !content.includes('<body')) {
      errors.push({
        field: 'content',
        message: 'HTML template should contain basic structure (html/body tags)',
        code: 'INVALID_HTML',
      });
    }

    // Check for unclosed tags
    const openTags = content.match(/<(?!\/|!)([a-z][a-z0-9]*)\b[^>]*(?<!\/|\?)>/gi) || [];
    const closeTags = content.match(/<\/([a-z][a-z0-9]*)>/gi) || [];

    if (Math.abs(openTags.length - closeTags.length) > 5) {
      errors.push({
        field: 'content',
        message: 'Possible unclosed HTML tags detected',
        code: 'UNCLOSED_TAGS',
      });
    }
  }

  return errors;
}

/**
 * Validate template variables
 */
function validateVariables(variables: TemplateVariable[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const names = new Set<string>();

  variables.forEach((variable, index) => {
    // Check required fields
    if (!variable.name || variable.name.trim().length === 0) {
      errors.push({
        field: `variables[${index}].name`,
        message: 'Variable name is required',
        code: 'REQUIRED_FIELD',
      });
    }

    // Check for duplicates
    if (variable.name && names.has(variable.name)) {
      errors.push({
        field: `variables[${index}].name`,
        message: `Duplicate variable name: ${variable.name}`,
        code: 'DUPLICATE_NAME',
      });
    }
    names.add(variable.name);

    // Validate variable name format (alphanumeric and underscores only)
    if (variable.name && !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
      errors.push({
        field: `variables[${index}].name`,
        message: `Invalid variable name: ${variable.name}. Use only letters, numbers, and underscores`,
        code: 'INVALID_NAME',
      });
    }

    // Check default value type matches
    if (variable.defaultValue !== undefined && variable.type) {
      const typeValid = validateVariableType(variable.defaultValue, variable.type);
      if (!typeValid) {
        errors.push({
          field: `variables[${index}].defaultValue`,
          message: `Default value type doesn't match variable type (${variable.type})`,
          code: 'TYPE_MISMATCH',
        });
      }
    }
  });

  return errors;
}

/**
 * Validate variable value type
 */
function validateVariableType(value: unknown, type: string): boolean {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      return typeof value === 'string' && /^https?:\/\/.+/.test(value);
    case 'date':
      return typeof value === 'string' && !isNaN(Date.parse(value));
    default:
      return true;
  }
}

/**
 * Extract variable names used in template content
 */
function extractUsedVariables(content: string): string[] {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const variables = new Set<string>();

  let match;
  while ((match = variablePattern.exec(content)) !== null) {
    const varName = match[1];
    if (varName) {
      variables.add(varName.trim());
    }
  }

  return Array.from(variables);
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

/**
 * Check if template is safe for preview
 */
export function isSafeForPreview(content: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(content));
}
