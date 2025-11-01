import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/common/OfflineIndicator';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import UpdatePrompt from './components/common/UpdatePrompt';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load routes for code splitting and better performance
const Layout = lazy(() => import('./components/Layout'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const QueueManager = lazy(() => import('./components/queue/QueueManager'));
const ConfigEditor = lazy(() => import('./components/config/ConfigEditor'));
const AdvancedAnalytics = lazy(() => import('./components/analytics/AdvancedAnalytics'));
const HealthCheck = lazy(() => import('./components/health/HealthCheck'));
const LoginPage = lazy(() => import('./components/auth/LoginPage'));
const ProtectedRoute = lazy(() => import('./components/auth/ProtectedRoute'));
const SecurityPage = lazy(() => import('./components/security/SecurityPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000,
      gcTime: 300000, // Updated from deprecated cacheTime
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
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