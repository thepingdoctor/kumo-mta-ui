/**
 * MJML Renderer Service
 *
 * Converts MJML to responsive HTML email
 */

import { MJMLValidationResult, MJMLError, MJMLWarning } from '../types/template';

const API_BASE = '/api/v1/templates';

/**
 * MJML rendering and validation service
 */
export const mjmlRenderer = {
  /**
   * Convert MJML to HTML
   */
  async render(mjml: string): Promise<{ html: string; errors: MJMLError[] }> {
    const response = await fetch(`${API_BASE}/mjml/render`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mjml }),
    });

    if (!response.ok) {
      throw new Error('Failed to render MJML');
    }

    return response.json();
  },

  /**
   * Validate MJML syntax
   */
  async validate(mjml: string): Promise<MJMLValidationResult> {
    const response = await fetch(`${API_BASE}/mjml/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mjml }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate MJML');
    }

    return response.json();
  },

  /**
   * Render with test data
   */
  async renderWithData(
    mjml: string,
    data: Record<string, string | number | boolean>
  ): Promise<{ html: string; errors: MJMLError[] }> {
    const response = await fetch(`${API_BASE}/mjml/render-with-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mjml, data }),
    });

    if (!response.ok) {
      throw new Error('Failed to render MJML with data');
    }

    return response.json();
  },

  /**
   * Get MJML component suggestions
   */
  async getComponents(): Promise<MJMLComponent[]> {
    const response = await fetch(`${API_BASE}/mjml/components`);

    if (!response.ok) {
      throw new Error('Failed to fetch MJML components');
    }

    return response.json();
  },

  /**
   * Convert HTML to MJML (best effort)
   */
  async htmlToMjml(html: string): Promise<{ mjml: string; warnings: MJMLWarning[] }> {
    const response = await fetch(`${API_BASE}/mjml/html-to-mjml`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html }),
    });

    if (!response.ok) {
      throw new Error('Failed to convert HTML to MJML');
    }

    return response.json();
  },
};

/**
 * MJML component definition
 */
export interface MJMLComponent {
  name: string;
  description: string;
  category: 'layout' | 'content' | 'social' | 'advanced';
  attributes: MJMLAttribute[];
  example: string;
}

export interface MJMLAttribute {
  name: string;
  type: 'string' | 'number' | 'color' | 'url' | 'boolean';
  required: boolean;
  default?: string | number | boolean;
  description: string;
}

/**
 * Client-side MJML validation (basic syntax check)
 */
export function validateMJMLSyntax(mjml: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for required root element
  if (!mjml.includes('<mjml>')) {
    errors.push('Missing <mjml> root element');
  }

  // Check for mj-body
  if (!mjml.includes('<mj-body>')) {
    errors.push('Missing <mj-body> element');
  }

  // Check for proper closing tags
  const openTags = mjml.match(/<mj-[^/>]+>/g) || [];
  const closeTags = mjml.match(/<\/mj-[^>]+>/g) || [];

  if (openTags.length !== closeTags.length) {
    errors.push('Mismatched MJML tags');
  }

  // Check for unclosed self-closing tags
  const invalidSelfClosing = mjml.match(/<mj-[^>]+>[^<]*(?!<\/)/g);
  if (invalidSelfClosing && invalidSelfClosing.length > 0) {
    errors.push('Some tags are not properly closed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extract variables from MJML template
 */
export function extractVariables(mjml: string): string[] {
  const variablePattern = /\{\{([^}]+)\}\}/g;
  const variables = new Set<string>();

  let match;
  while ((match = variablePattern.exec(mjml)) !== null) {
    variables.add(match[1].trim());
  }

  return Array.from(variables);
}

/**
 * Replace variables in MJML with test data
 */
export function replaceVariables(
  mjml: string,
  data: Record<string, string | number | boolean>
): string {
  let result = mjml;

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, String(value));
  });

  return result;
}

/**
 * MJML starter template
 */
export const MJML_STARTER_TEMPLATE = `<mjml>
  <mj-head>
    <mj-title>Email Title</mj-title>
    <mj-preview>Preview text appears in inbox</mj-preview>
    <mj-attributes>
      <mj-all font-family="Arial, sans-serif" />
      <mj-text font-size="14px" color="#333333" line-height="1.6" />
      <mj-button background-color="#4F46E5" color="#ffffff" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f4f4f4">
    <mj-section background-color="#ffffff" padding="20px">
      <mj-column>
        <mj-text font-size="20px" font-weight="bold" color="#1f2937">
          Welcome {{first_name}}!
        </mj-text>
        <mj-text>
          This is a sample email template created with MJML.
        </mj-text>
        <mj-button href="https://example.com">
          Get Started
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
