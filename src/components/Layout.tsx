import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Mail, Settings, Shield, BarChart3, LogOut, Menu, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ToastContainer } from './common/ToastContainer';

const Layout: React.FC = () => {
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Queue Manager', path: '/queue', icon: Mail },
    { name: 'Configuration', path: '/config', icon: Settings },
    { name: 'Security', path: '/security', icon: Shield },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
  ];

  const closeSidebar = () => setSidebarOpen(false);

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          ></div>
        )}

        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">KumoMTA Admin</h1>
            <button
              onClick={closeSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close sidebar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-6">
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
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
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
              className="flex w-full items-center px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" aria-hidden="true" />
              Logout
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile header */}
          <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Open sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="ml-4 text-lg font-semibold text-gray-900">KumoMTA Admin</h1>
          </header>

          {/* Scrollable content area */}
          <main className="flex-1 overflow-y-auto">
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
};

export default Layout;