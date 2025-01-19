import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import QueueManager from './components/queue/QueueManager';
import ConfigEditor from './components/config/ConfigEditor';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  // Auto-login as admin for demo
  const user = useAuthStore((state) => state.user);
  if (!user) {
    useAuthStore.getState().login(
      { id: '1', email: 'admin@example.com', role: 'admin' },
      'demo-token'
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="queue" element={<QueueManager />} />
              <Route path="config" element={<ConfigEditor />} />
              <Route path="security" element={<div>Security (Coming Soon)</div>} />
              <Route path="analytics" element={<div>Analytics (Coming Soon)</div>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;