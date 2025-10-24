/**
 * CSV Sanitization Utilities
 * Prevents CSV injection attacks and ensures proper formatting
 */

/**
 * Sanitizes a value for safe CSV export
 * Prevents formula injection by escaping special characters
 */
export const sanitizeCSVValue = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check for formula injection characters
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  const startsWithDangerous = dangerousChars.some(char => stringValue.startsWith(char));

  let sanitized = stringValue;

  // Prepend with single quote to prevent formula execution
  if (startsWithDangerous) {
    sanitized = "'" + sanitized;
  }

  // Escape double quotes by doubling them (CSV standard)
  sanitized = sanitized.replace(/"/g, '""');

  // Wrap in quotes if contains comma, newline, or quote
  if (sanitized.includes(',') || sanitized.includes('\n') || sanitized.includes('"')) {
    sanitized = `"${sanitized}"`;
  }

  return sanitized;
};

/**
 * Escapes a CSV value (legacy method for backward compatibility)
 */
export const escapeCSVValue = (value: string | number | null | undefined): string => {
  return sanitizeCSVValue(value);
};

/**
 * Converts an array of rows to a safe CSV string
 */
export const generateSafeCSV = (headers: string[], rows: (string | number | null | undefined)[][]): string => {
  const sanitizedHeaders = headers.map(sanitizeCSVValue);
  const sanitizedRows = rows.map(row => row.map(sanitizeCSVValue));

  return [
    sanitizedHeaders.join(','),
    ...sanitizedRows.map(row => row.join(','))
  ].join('\n');
};
