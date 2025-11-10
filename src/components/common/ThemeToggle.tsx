import React, { useState, useRef, useEffect, useCallback, useMemo, memo } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, Theme } from '../../stores/themeStore';

interface ThemeToggleProps {
  variant?: 'button' | 'dropdown';
  className?: string;
}

/**
 * Theme toggle component with button and dropdown variants
 * Optimized with React.memo to prevent unnecessary re-renders
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = memo(({
  variant = 'button',
  className = ''
}) => {
  const { theme, actualTheme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoize event handlers to prevent recreation
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const handleEscape = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, handleClickOutside]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  // Memoize icon rendering to prevent recreation
  const currentIcon = useMemo(() => {
    const iconProps = { size: 20, 'aria-hidden': 'true' as const };
    return actualTheme === 'dark' ? <Moon {...iconProps} /> : <Sun {...iconProps} />;
  }, [actualTheme]);

  // Memoize theme options to prevent recreation
  const themeOptions = useMemo<{ value: Theme; label: string; icon: React.ReactNode }[]>(() => [
    { value: 'light', label: 'Light', icon: <Sun size={16} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={16} /> },
    { value: 'system', label: 'System', icon: <Monitor size={16} /> },
  ], []);

  if (variant === 'button') {
    return (
      <button
        onClick={() => {
          const newTheme = actualTheme === 'light' ? 'dark' : 'light';
          setTheme(newTheme);
        }}
        className={`p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        aria-label={`Switch to ${actualTheme === 'light' ? 'dark' : 'light'} mode`}
        title={`Current theme: ${theme}${theme === 'system' ? ` (${actualTheme})` : ''}`}
      >
        {currentIcon}
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Theme options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {currentIcon}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="py-1">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                  theme === option.value
                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                role="menuitem"
              >
                <span className="mr-2">{option.icon}</span>
                {option.label}
                {theme === option.value && (
                  <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// Add display name for debugging
ThemeToggle.displayName = 'ThemeToggle';
