import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerPWA } from './utils/pwaRegistration';
import { reportWebVitals } from './utils/webVitals';
import { performanceMonitor } from './utils/performanceMonitor';
import { initSentry } from './utils/sentry';

// Initialize Sentry FIRST - must be before any other initialization
// This ensures error tracking is active from the very beginning
initSentry();

// Register PWA service worker
registerPWA();

// Initialize Web Vitals monitoring
reportWebVitals();

// Record initial Web Vitals from Performance API
performanceMonitor.recordWebVitals();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
