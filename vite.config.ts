import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Path aliases for cleaner imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@services': path.resolve(__dirname, './src/services'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'KumoMTA Dashboard',
        short_name: 'KumoMTA',
        description: 'Modern web interface for managing KumoMTA email servers',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.kumomta\..*\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
    // Sentry source maps upload plugin
    // Only runs in production builds when auth token is configured
    sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: './dist/**',
        filesToDeleteAfterUpload: './dist/**/*.map', // Delete source maps after upload for security
      },
      telemetry: false, // Disable telemetry for privacy
      // Only upload source maps if auth token is provided
      disable: !process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Optimized manual chunking strategy for better caching and parallel loading
        manualChunks: (id) => {
          // Vendor chunks for core libraries with strategic splitting
          if (id.includes('node_modules')) {
            // Core React libraries - cached separately for stability
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-core';
            }
            // React Router - separate for better caching
            if (id.includes('react-router-dom')) {
              return 'react-router';
            }
            // Data fetching library
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }
            // Charting libraries - loaded on-demand
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'chart-vendor';
            }
            // Large dependencies get their own chunks
            if (id.includes('html2canvas')) {
              return 'html2canvas-vendor';
            }
            // Form handling
            if (id.includes('react-hook-form')) {
              return 'form-vendor';
            }
            // Icons library
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // HTTP client
            if (id.includes('axios')) {
              return 'http-vendor';
            }
            // State management and utilities
            if (id.includes('zustand')) {
              return 'state-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Sanitization
            if (id.includes('dompurify')) {
              return 'security-vendor';
            }
            // CSV parsing
            if (id.includes('papaparse')) {
              return 'csv-vendor';
            }
            // All other node_modules go to shared vendor chunk
            return 'vendor-common';
          }

          // Application code splitting by route/feature
          if (id.includes('/src/components/queue/')) {
            return 'feature-queue';
          }
          if (id.includes('/src/components/analytics/')) {
            return 'feature-analytics';
          }
          if (id.includes('/src/components/config/')) {
            return 'feature-config';
          }
          if (id.includes('/src/components/auth/')) {
            return 'feature-auth';
          }
          if (id.includes('/src/components/security/')) {
            return 'feature-security';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Optimize bundle size with modern JavaScript target
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
        passes: 2, // Run compression twice for better results
      },
      mangle: {
        safari10: true, // Handle Safari 10+ bug
      },
      format: {
        comments: false, // Remove all comments
      },
    },
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
    // Optimize module preload for faster initial load
    modulePreload: {
      polyfill: true,
    },
    // Performance budget enforcement
    // Warn if any chunk exceeds 250KB (gzipped ~80KB)
    chunkSizeWarningLimit: 250,
    // Enable source maps for Sentry error tracking
    // Source maps are uploaded to Sentry and then deleted for security
    sourcemap: true,
    // Report compressed sizes
    reportCompressedSize: true,
  },
});
