import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import QueueManager from './components/queue/QueueManager';
import ConfigEditor from './components/config/ConfigEditor';
import ErrorBoundary from './components/ErrorBoundary';
import AdvancedAnalytics from './components/analytics/AdvancedAnalytics';
import HealthCheck from './components/health/HealthCheck';
import LoginPage from './components/auth/LoginPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SecurityPage from './components/security/SecurityPage';
import OfflineIndicator from './components/common/OfflineIndicator';
import PWAInstallPrompt from './components/common/PWAInstallPrompt';
import UpdatePrompt from './components/common/UpdatePrompt';

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
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;