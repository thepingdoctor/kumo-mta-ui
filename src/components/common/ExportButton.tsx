import React, { useState } from 'react';
import { Download, FileText, File } from 'lucide-react';

export type ExportFormat = 'pdf' | 'csv';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
  formats?: ExportFormat[];
  label?: string;
  className?: string;
  showDropdown?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  disabled = false,
  formats = ['pdf', 'csv'],
  label = 'Export',
  className = '',
  showDropdown = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    setIsOpen(false);
  };

  // If only one format or dropdown disabled, show simple button
  if (!showDropdown || formats.length === 1) {
    const format = formats[0];
    return (
      <button
        onClick={() => handleExport(format)}
        disabled={disabled}
        className={`inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-label={`Export as ${format.toUpperCase()}`}
      >
        <Download className="h-4 w-4 mr-2" />
        {label} {formats.length === 1 ? format.toUpperCase() : ''}
      </button>
    );
  }

  // Dropdown menu for multiple formats
  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Download className="h-4 w-4 mr-2" />
        {label}
        <svg
          className="ml-2 -mr-1 h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown menu */}
          <div
            className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-1" role="none">
              {formats.includes('pdf') && (
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                  role="menuitem"
                >
                  <FileText className="h-4 w-4 mr-3 text-red-500" />
                  Export as PDF
                </button>
              )}
              {formats.includes('csv') && (
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                  role="menuitem"
                >
                  <File className="h-4 w-4 mr-3 text-green-500" />
                  Export as CSV
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
