import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import HelpPanel from './HelpPanel';

interface HelpButtonProps {
  contextPage?: string;
  className?: string;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ contextPage, className = '' }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Keyboard shortcut: F1 to open help
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <button
        onClick={() => setIsHelpOpen(true)}
        className={`inline-flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors ${className}`}
        aria-label="Open help panel (F1)"
        title="Help (F1)"
      >
        <HelpCircle className="w-5 h-5" />
        <span className="text-sm font-medium hidden md:inline">Help</span>
      </button>

      <HelpPanel
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        contextPage={contextPage}
      />
    </>
  );
};

export default HelpButton;
