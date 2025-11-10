/**
 * Email Client Preview Utilities
 *
 * Generate client-specific preview configurations
 */

import type { EmailClient, TemplatePreviewConfig } from '../types/template';

/**
 * Email client viewport configurations
 */
export const EMAIL_CLIENT_CONFIGS: Record<EmailClient, TemplatePreviewConfig> = {
  gmail: {
    client: 'gmail',
    width: 650,
    height: 800,
    darkMode: false,
  },
  outlook: {
    client: 'outlook',
    width: 680,
    height: 800,
    darkMode: false,
  },
  'apple-mail': {
    client: 'apple-mail',
    width: 600,
    height: 800,
    darkMode: false,
  },
  mobile: {
    client: 'mobile',
    width: 375,
    height: 667,
    darkMode: false,
  },
  webmail: {
    client: 'webmail',
    width: 700,
    height: 800,
    darkMode: false,
  },
};

/**
 * Client-specific CSS overrides
 */
export const CLIENT_CSS_OVERRIDES: Record<EmailClient, string> = {
  gmail: `
    /* Gmail-specific styles */
    .gmail-override {
      -webkit-text-size-adjust: 100%;
    }

    /* Gmail removes margins from some elements */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    /* Gmail strips font tags */
    font {
      font-family: inherit;
    }
  `,

  outlook: `
    /* Outlook-specific styles */
    .outlook-override {
      mso-line-height-rule: exactly;
    }

    /* Outlook uses Times New Roman as default */
    table {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }

    /* Prevent Outlook from adding spacing */
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
  `,

  'apple-mail': `
    /* Apple Mail specific styles */
    .apple-mail-override {
      -webkit-text-size-adjust: 100%;
    }

    /* Apple Mail link color override */
    a[x-apple-data-detectors] {
      color: inherit !important;
      text-decoration: none !important;
      font-size: inherit !important;
      font-family: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
  `,

  mobile: `
    /* Mobile responsive styles */
    @media only screen and (max-width: 480px) {
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }

      .mobile-hide {
        display: none !important;
      }

      .mobile-text-center {
        text-align: center !important;
      }

      .mobile-full-width {
        width: 100% !important;
        max-width: 100% !important;
      }
    }
  `,

  webmail: `
    /* Generic webmail styles */
    .webmail-override {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
  `,
};

/**
 * Dark mode CSS for email clients that support it
 */
export const DARK_MODE_CSS = `
  @media (prefers-color-scheme: dark) {
    .dark-mode-bg {
      background-color: #1a1a1a !important;
    }

    .dark-mode-text {
      color: #ffffff !important;
    }

    .dark-mode-secondary-text {
      color: #cccccc !important;
    }

    .dark-mode-border {
      border-color: #333333 !important;
    }

    .dark-mode-invert {
      filter: invert(1) hue-rotate(180deg);
    }
  }
`;

/**
 * Get preview configuration for specific client
 */
export function getClientConfig(client: EmailClient, darkMode?: boolean): TemplatePreviewConfig {
  return {
    ...EMAIL_CLIENT_CONFIGS[client],
    darkMode: darkMode ?? false,
  };
}

/**
 * Generate client-specific preview HTML
 */
export function generateClientPreview(
  html: string,
  client: EmailClient,
  darkMode: boolean = false
): string {
  const config = getClientConfig(client, darkMode);
  const cssOverride = CLIENT_CSS_OVERRIDES[client];
  const darkModeCSS = darkMode ? DARK_MODE_CSS : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Email Preview - ${client}</title>
  <style>
    /* Reset styles */
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      ${darkMode ? 'background-color: #1a1a1a; color: #ffffff;' : ''}
    }

    /* Client-specific overrides */
    ${cssOverride}

    /* Dark mode support */
    ${darkModeCSS}

    /* Preview container */
    .preview-container {
      max-width: ${config.width}px;
      margin: 0 auto;
      ${darkMode ? 'background-color: #1a1a1a;' : 'background-color: #ffffff;'}
    }
  </style>
</head>
<body>
  <div class="preview-container">
    ${html}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Client-specific rendering quirks
 */
export interface ClientQuirk {
  client: EmailClient;
  issue: string;
  description: string;
  workaround?: string;
}

export const KNOWN_CLIENT_QUIRKS: ClientQuirk[] = [
  {
    client: 'gmail',
    issue: 'CSS in <head> stripped',
    description: 'Gmail removes <style> tags from the <head> section',
    workaround: 'Use inline styles or <style> tags in <body>',
  },
  {
    client: 'gmail',
    issue: 'Margins removed',
    description: 'Gmail removes margin and padding from some elements',
    workaround: 'Use padding on table cells instead of margins',
  },
  {
    client: 'outlook',
    issue: 'Background images not supported',
    description: 'Outlook 2007+ does not support CSS background images',
    workaround: 'Use VML for background images or provide fallback color',
  },
  {
    client: 'outlook',
    issue: 'Limited CSS support',
    description: 'Outlook uses Word rendering engine with limited CSS',
    workaround: 'Use table-based layouts and inline styles',
  },
  {
    client: 'apple-mail',
    issue: 'Auto-link detection',
    description: 'Apple Mail auto-detects and styles phone numbers, addresses, dates',
    workaround: 'Use x-apple-data-detectors attribute to control styling',
  },
  {
    client: 'mobile',
    issue: 'Small viewport',
    description: 'Mobile devices have limited screen width',
    workaround: 'Use responsive design with media queries',
  },
  {
    client: 'mobile',
    issue: 'Touch targets',
    description: 'Buttons and links need to be large enough for touch',
    workaround: 'Use minimum 44x44px touch targets',
  },
];

/**
 * Get quirks for specific client
 */
export function getClientQuirks(client: EmailClient): ClientQuirk[] {
  return KNOWN_CLIENT_QUIRKS.filter(q => q.client === client);
}

/**
 * Test data for preview
 */
export const DEFAULT_PREVIEW_DATA: Record<string, string | number | boolean> = {
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@example.com',
  company: 'Acme Corp',
  phone: '+1 (555) 123-4567',
  date: new Date().toLocaleDateString(),
  year: new Date().getFullYear(),
  unsubscribe_url: 'https://example.com/unsubscribe',
  privacy_url: 'https://example.com/privacy',
  terms_url: 'https://example.com/terms',
};

/**
 * Generate screenshot-friendly HTML for email testing services
 */
export function generateTestingHTML(html: string): string {
  return `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Email Test</title>
</head>
<body style="margin: 0; padding: 0;">
  ${html}
</body>
</html>
  `.trim();
}
