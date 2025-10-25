import React, { useState, useEffect } from 'react';
import { X, Search, Book, Video, FileText, MessageCircle, ExternalLink } from 'lucide-react';

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  links?: { label: string; url: string }[];
}

interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  contextPage?: string;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({
  isOpen,
  onClose,
  contextPage = 'general',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const helpSections: Record<string, HelpSection[]> = {
    general: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        icon: <Book className="w-5 h-5" />,
        content: 'Learn the basics of navigating the KumoMTA UI Dashboard, understanding key metrics, and performing common tasks.',
        links: [
          { label: 'Video Tutorial: Getting Started', url: '/docs/tutorials/01-getting-started' },
          { label: 'User Guide', url: '/docs/USER_GUIDE.md' },
        ],
      },
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        icon: <FileText className="w-5 h-5" />,
        content: 'Press F to open filters, S to search, E to export, R to refresh, ? to show all shortcuts.',
        links: [
          { label: 'Quick Reference Guide', url: '/docs/QUICK_REFERENCE.md' },
        ],
      },
      {
        id: 'video-tutorials',
        title: 'Video Tutorials',
        icon: <Video className="w-5 h-5" />,
        content: 'Watch comprehensive video tutorials covering all dashboard features.',
        links: [
          { label: 'Tutorial 1: Getting Started', url: '/docs/tutorials/01-getting-started' },
          { label: 'Tutorial 2: Queue Management', url: '/docs/tutorials/02-queue-management' },
          { label: 'Tutorial 3: Security', url: '/docs/tutorials/03-security-configuration' },
          { label: 'Tutorial 4: Analytics', url: '/docs/tutorials/04-analytics-monitoring' },
          { label: 'Tutorial 5: Troubleshooting', url: '/docs/tutorials/05-troubleshooting' },
        ],
      },
    ],
    dashboard: [
      {
        id: 'metrics-explained',
        title: 'Understanding Dashboard Metrics',
        icon: <Book className="w-5 h-5" />,
        content: 'The dashboard shows real-time email delivery metrics. Emails Sent displays total successful deliveries. Bounce Rate indicates delivery failures (ideal: <5%). Delayed Messages shows queued emails. Throughput displays current sending rate.',
        links: [
          { label: 'Metrics Guide', url: '/docs/METRICS_GUIDE.md' },
        ],
      },
      {
        id: 'auto-refresh',
        title: 'Auto-Refresh',
        icon: <FileText className="w-5 h-5" />,
        content: 'Dashboard metrics refresh automatically every 5 seconds. Click the pause button to stop auto-refresh, or press R to refresh manually.',
      },
    ],
    queue: [
      {
        id: 'queue-management',
        title: 'Managing Email Queues',
        icon: <Book className="w-5 h-5" />,
        content: 'Monitor queue status, filter by status/service type, perform bulk operations, and export data. Queue updates in real-time every 5 seconds.',
        links: [
          { label: 'Video: Queue Management', url: '/docs/tutorials/02-queue-management' },
          { label: 'API Documentation', url: '/docs/API.md' },
        ],
      },
      {
        id: 'queue-status',
        title: 'Queue Status Meanings',
        icon: <FileText className="w-5 h-5" />,
        content: 'Waiting: Queued for processing. In Progress: Currently being sent. Completed: Successfully delivered. Failed: Delivery failed, may retry. Cancelled: Manually stopped.',
      },
      {
        id: 'bulk-operations',
        title: 'Bulk Operations',
        icon: <FileText className="w-5 h-5" />,
        content: 'Select multiple items with checkboxes, then use bulk actions to retry, cancel, or update status. Maximum 100 items per operation.',
      },
    ],
    security: [
      {
        id: 'authentication',
        title: 'Authentication & Access',
        icon: <Book className="w-5 h-5" />,
        content: 'Configure authentication methods, enable MFA, manage user roles, and review audit logs for security compliance.',
        links: [
          { label: 'Video: Security Configuration', url: '/docs/tutorials/03-security-configuration' },
          { label: 'Security Best Practices', url: '/docs/SECURITY_BEST_PRACTICES.md' },
        ],
      },
      {
        id: 'mfa-setup',
        title: 'Multi-Factor Authentication',
        icon: <FileText className="w-5 h-5" />,
        content: 'Enable MFA for enhanced security. Scan the QR code with an authenticator app like Google Authenticator or Authy. Save backup codes securely.',
      },
      {
        id: 'api-tokens',
        title: 'API Token Management',
        icon: <FileText className="w-5 h-5" />,
        content: 'Create API tokens for programmatic access. Set expiration dates (recommended: 90 days), limit permissions, and rotate tokens regularly.',
      },
    ],
    analytics: [
      {
        id: 'analytics-overview',
        title: 'Analytics & Reporting',
        icon: <Book className="w-5 h-5" />,
        content: 'View delivery performance, analyze bounce rates, compare domain performance, and create custom dashboards for your team.',
        links: [
          { label: 'Video: Analytics & Monitoring', url: '/docs/tutorials/04-analytics-monitoring' },
          { label: 'Analytics Best Practices', url: '/docs/ANALYTICS_BEST_PRACTICES.md' },
        ],
      },
      {
        id: 'custom-dashboards',
        title: 'Creating Custom Dashboards',
        icon: <FileText className="w-5 h-5" />,
        content: 'Click "Create Dashboard", add widgets for metrics you care about, drag to arrange, and share with your team via links.',
      },
      {
        id: 'alerts',
        title: 'Configuring Alerts',
        icon: <FileText className="w-5 h-5" />,
        content: 'Set threshold-based alerts for bounce rates, queue depth, or delivery rates. Configure notifications via email, Slack, or webhooks.',
      },
    ],
  };

  const sections = helpSections[contextPage] || helpSections.general;

  const filteredSections = sections.filter((section) =>
    searchQuery === ''
      ? true
      : section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        section.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-panel-title"
      >
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <h2 id="help-panel-title" className="text-lg font-semibold flex items-center gap-2">
            <Book className="w-5 h-5" />
            Help & Documentation
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded transition-colors"
            aria-label="Close help panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Search help topics"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredSections.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>No help topics found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-blue-600 hover:underline"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSections.map((section) => (
                <div
                  key={section.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() =>
                      setActiveSection(activeSection === section.id ? null : section.id)
                    }
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={activeSection === section.id}
                    aria-controls={`help-section-${section.id}`}
                  >
                    <div className="text-blue-600 mt-0.5">{section.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{section.title}</h3>
                      {activeSection !== section.id && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {section.content}
                        </p>
                      )}
                    </div>
                  </button>

                  {activeSection === section.id && (
                    <div
                      id={`help-section-${section.id}`}
                      className="p-4 pt-0 border-t bg-gray-50"
                    >
                      <p className="text-sm text-gray-700 mb-3">{section.content}</p>

                      {section.links && section.links.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold text-gray-600 uppercase">
                            Related Resources
                          </p>
                          {section.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link.url}
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="space-y-2 text-sm">
            <a
              href="/docs/FAQ.md"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <MessageCircle className="w-4 h-4" />
              Frequently Asked Questions
            </a>
            <a
              href="/docs/TROUBLESHOOTING.md"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <FileText className="w-4 h-4" />
              Troubleshooting Guide
            </a>
            <a
              href="/docs/QUICK_REFERENCE.md"
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Book className="w-4 h-4" />
              Quick Reference
            </a>
          </div>

          <div className="mt-4 pt-4 border-t text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded font-mono">F1</kbd> to toggle
            help panel
            <br />
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded font-mono">ESC</kbd> to close
          </div>
        </div>
      </div>
    </>
  );
};

export default HelpPanel;
