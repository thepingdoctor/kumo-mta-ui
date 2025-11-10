/**
 * useTemplatePreview Hook
 *
 * React hook for template preview rendering
 */

import { useState, useCallback } from 'react';
import { EmailClient } from '../types/template';
import { mjmlRenderer } from '../services/mjmlRenderer';
import {
  generateClientPreview,
} from '../utils/emailClientPreview';

export interface UseTemplatePreviewResult {
  html: string | null;
  loading: boolean;
  error: Error | null;
  preview: (content: string, format: 'mjml' | 'html') => Promise<void>;
  previewWithData: (content: string, format: 'mjml' | 'html', data: Record<string, string | number | boolean>) => Promise<void>;
  generatePreview: (client: EmailClient, darkMode?: boolean) => string | null;
  setClient: (client: EmailClient) => void;
  setDarkMode: (enabled: boolean) => void;
  client: EmailClient;
  darkMode: boolean;
}

export function useTemplatePreview(
  initialClient: EmailClient = 'gmail',
  initialDarkMode: boolean = false
): UseTemplatePreviewResult {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [client, setClient] = useState<EmailClient>(initialClient);
  const [darkMode, setDarkMode] = useState(initialDarkMode);

  const preview = useCallback(async (content: string, format: 'mjml' | 'html') => {
    try {
      setLoading(true);
      setError(null);

      if (format === 'mjml') {
        const result = await mjmlRenderer.render(content);
        setHtml(result.html);
      } else {
        setHtml(content);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const previewWithData = useCallback(async (
    content: string,
    format: 'mjml' | 'html',
    data: Record<string, string | number | boolean>
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (format === 'mjml') {
        const result = await mjmlRenderer.renderWithData(content, data);
        setHtml(result.html);
      } else {
        // Replace variables in HTML
        let processedHtml = content;
        Object.entries(data).forEach(([key, value]) => {
          const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
          processedHtml = processedHtml.replace(regex, String(value));
        });
        setHtml(processedHtml);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Preview with data error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const generatePreview = useCallback((
    previewClient: EmailClient = client,
    previewDarkMode: boolean = darkMode
  ): string | null => {
    if (!html) return null;
    return generateClientPreview(html, previewClient, previewDarkMode);
  }, [html, client, darkMode]);

  return {
    html,
    loading,
    error,
    preview,
    previewWithData,
    generatePreview,
    setClient,
    setDarkMode,
    client,
    darkMode,
  };
}
