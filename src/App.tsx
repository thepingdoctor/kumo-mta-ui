import React, { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/common/OfflineIndicator';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import UpdatePrompt from './components/common/UpdatePrompt';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load routes for code splitting and better performance
// Use webpackChunkName for better debugging in production
const Layout = lazy(() => import(/* webpackChunkName: "layout" */ './components/Layout'));
const Dashboard = lazy(() => import(/* webpackChunkName: "dashboard" */ './components/Dashboard'));
const QueueManager = lazy(() => import(/* webpackChunkName: "queue" */ './components/queue/QueueManager'));
const ConfigEditor = lazy(() => import(/* webpackChunkName: "config" */ './components/config/ConfigEditor'));
const AdvancedAnalytics = lazy(() => import(/* webpackChunkName: "analytics" */ './components/analytics/AdvancedAnalytics'));
const HealthCheck = lazy(() => import(/* webpackChunkName: "health" */ './components/health/HealthCheck'));
const LoginPage = lazy(() => import(/* webpackChunkName: "auth" */ './components/auth/LoginPage'));
const ProtectedRoute = lazy(() => import(/* webpackChunkName: "auth" */ './components/auth/ProtectedRoute'));
const SecurityPage = lazy(() => import(/* webpackChunkName: "security" */ './components/security/SecurityPage'));

/**
 * Optimized QueryClient configuration
 * - Aggressive caching with staleTime for reduced API calls
 * - Exponential backoff retry strategy
 * - Network-aware refetching
 */
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000, // Consider data fresh for 5s
      gcTime: 300000, // Cache for 5 minutes (updated from cacheTime)
      refetchOnWindowFocus: false, // Prevent excessive refetches
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Always refetch on mount
    },
    mutations: {
      retry: 2, // Retry failed mutations
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

/**
 * Main App component with optimized routing and query management
 */
function App() {
  // Create QueryClient instance once per app lifecycle
  const queryClient = useMemo(() => createQueryClient(), []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {/* PWA Components */}
          <OfflineIndicator />
          <PWAInstallPrompt />
          <UpdatePrompt />

          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected Routes */}
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="queue" element={<QueueManager />} />
                <Route path="config" element={<ConfigEditor />} />
                <Route path="security" element={<SecurityPage />} />
                <Route path="analytics" element={<AdvancedAnalytics />} />
                <Route path="health" element={<HealthCheck />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;