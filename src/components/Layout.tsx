import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mail, Settings, Shield, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ToastContainer } from './common/ToastContainer';
import { ThemeToggle } from './common/ThemeToggle';

/**
 * Main application layout with sidebar navigation
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const Layout: React.FC = memo(() => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Memoize navigation array to prevent recreation on every render
  const navigation = React.useMemo(() => [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Queue Manager', path: '/queue', icon: Mail },
    { name: 'Configuration', path: '/config', icon: Settings },
    { name: 'Security', path: '/security', icon: Shield },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ], []);

  // Memoize callback to prevent recreation
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close sidebar on Escape key
      if (e.key === 'Escape' && sidebarOpen) {
        closeSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Focus trap for mobile sidebar
  useEffect(() => {
    if (!sidebarOpen || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    const focusableElements = sidebar.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    sidebar.addEventListener('keydown', handleTabKey as EventListener);
    firstElement.focus(); // Focus first element when sidebar opens

    return () => {
      sidebar.removeEventListener('keydown', handleTabKey as EventListener);
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors">
      <div className="flex h-screen overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          ></div>
        )}

        {/* Sidebar */}
        <nav
          ref={sidebarRef}
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-surface shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-label="Main navigation"
        >
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-dark-border">
            <h1 className="text-xl font-bold text-gray-900 dark:text-dark-text">KumoMTA Admin</h1>
            <div className="flex items-center gap-2">
              <ThemeToggle variant="dropdown" />
              <button
                onClick={closeSidebar}
                className="lg:hidden p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Close sidebar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          <div className="mt-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={closeSidebar}
                  className={`flex items-center px-6 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-l-4 border-blue-600'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="mr-3 h-5 w-5" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
            <button
              onClick={() => {
                logout();
                closeSidebar();
              }}
              className="flex w-full items-center px-6 py-3 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
              Logout
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="lg:hidden bg-white dark:bg-dark-surface border-b border-gray-200 dark:border-dark-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-4 text-lg font-semibold text-gray-900 dark:text-dark-text">KumoMTA Admin</h1>
            </div>
            <ThemeToggle variant="button" />
          </header>

          {/* Scrollable content area */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-bg">
            <div className="p-4 sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
});

// Add display name for debugging
Layout.displayName = 'Layout';

export default Layout;