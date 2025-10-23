# KumoMTA UI - Configuration Guide

## Overview

This guide covers all configuration options for the KumoMTA UI application, including environment variables, application settings, and server configuration.

---

## Environment Variables

### Required Variables

#### VITE_API_URL
**Description**: KumoMTA API server endpoint
**Type**: String (URL)
**Required**: Yes
**Default**: None

**Examples**:
```env
# Development
VITE_API_URL=http://localhost:3000

# Production
VITE_API_URL=https://api.kumomta.example.com

# Docker internal network
VITE_API_URL=http://kumomta-server:3000
```

---

### Optional Variables

#### VITE_API_TIMEOUT
**Description**: API request timeout in milliseconds
**Type**: Number
**Required**: No
**Default**: 10000 (10 seconds)

```env
VITE_API_TIMEOUT=30000  # 30 seconds
```

#### VITE_APP_NAME
**Description**: Application display name
**Type**: String
**Required**: No
**Default**: "KumoMTA Dashboard"

```env
VITE_APP_NAME=My Email Server Dashboard
```

#### VITE_APP_VERSION
**Description**: Application version for display
**Type**: String
**Required**: No
**Default**: From package.json

```env
VITE_APP_VERSION=1.0.0
```

#### VITE_ENABLE_WEBSOCKET
**Description**: Enable WebSocket real-time updates
**Type**: Boolean
**Required**: No
**Default**: false

```env
VITE_ENABLE_WEBSOCKET=true
```

#### VITE_ENABLE_ANALYTICS
**Description**: Enable analytics tracking
**Type**: Boolean
**Required**: No
**Default**: false

```env
VITE_ENABLE_ANALYTICS=true
```

#### VITE_ENABLE_CSP
**Description**: Enable Content Security Policy headers
**Type**: Boolean
**Required**: No
**Default**: true

```env
VITE_ENABLE_CSP=true
```

#### VITE_ALLOWED_ORIGINS
**Description**: Comma-separated list of allowed CORS origins
**Type**: String
**Required**: No
**Default**: None

```env
VITE_ALLOWED_ORIGINS=https://dashboard.example.com,https://admin.example.com
```

---

## Environment File Templates

### Development (.env)

```env
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=10000

# Application Settings
VITE_APP_NAME=KumoMTA Dashboard (Dev)
VITE_APP_VERSION=1.0.0-dev

# Feature Flags
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_CSP=false

# Debug
NODE_ENV=development
```

### Production (.env.production)

```env
# API Configuration
VITE_API_URL=https://api.kumomta.example.com
VITE_API_TIMEOUT=30000

# Application Settings
VITE_APP_NAME=KumoMTA Dashboard
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CSP=true
VITE_ALLOWED_ORIGINS=https://dashboard.example.com

# Production
NODE_ENV=production
```

### Docker (.env.docker)

```env
# API Configuration (Docker internal network)
VITE_API_URL=http://kumomta-api:3000
VITE_API_TIMEOUT=15000

# Application Settings
VITE_APP_NAME=KumoMTA Dashboard
VITE_APP_VERSION=1.0.0

# Feature Flags
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_CSP=true

# Docker
NODE_ENV=production
```

---

## Application Configuration

### Core Settings

Managed via Configuration Editor UI or API endpoint: `PUT /config/core`

#### Server Name
**Field**: `serverName`
**Type**: String
**Description**: Display name for the mail server
**Example**: `mail.example.com`

#### Max Concurrent Connections
**Field**: `maxConcurrentConnections`
**Type**: Number
**Description**: Maximum simultaneous connections
**Default**: 1000
**Range**: 1-10000

#### Default Port
**Field**: `defaultPort`
**Type**: Number
**Description**: SMTP server port
**Default**: 25
**Common Values**: 25, 587, 465

#### IPv6 Enabled
**Field**: `ipv6Enabled`
**Type**: Boolean
**Description**: Enable IPv6 support
**Default**: false

#### DNS Resolvers
**Field**: `dnsResolvers`
**Type**: Array of strings
**Description**: DNS resolver addresses
**Example**: `["8.8.8.8", "1.1.1.1"]`

#### Log Level
**Field**: `logLevel`
**Type**: Enum
**Options**: `debug`, `info`, `warn`, `error`
**Default**: `info`

#### Max Message Size
**Field**: `maxMessageSize`
**Type**: Number (bytes)
**Description**: Maximum email size
**Default**: 10485760 (10 MB)

#### Queue Retry Interval
**Field**: `queueRetryInterval`
**Type**: Number (seconds)
**Description**: Retry interval for failed emails
**Default**: 300 (5 minutes)

**Example Configuration**:
```json
{
  "serverName": "mail.example.com",
  "maxConcurrentConnections": 2000,
  "defaultPort": 25,
  "ipv6Enabled": true,
  "dnsResolvers": ["8.8.8.8", "1.1.1.1"],
  "logLevel": "info",
  "maxMessageSize": 10485760,
  "queueRetryInterval": 300
}
```

---

### Integration Settings

Managed via Configuration Editor UI or API endpoint: `PUT /config/integration`

#### API Endpoint
**Field**: `apiEndpoint`
**Type**: String (URL)
**Description**: External API endpoint
**Example**: `https://api.service.com`

#### API Version
**Field**: `apiVersion`
**Type**: String
**Description**: API version identifier
**Example**: `v1`

#### API Key
**Field**: `apiKey`
**Type**: String (sensitive)
**Description**: API authentication key
**Security**: Encrypt in storage

#### Webhook URL
**Field**: `webhookUrl`
**Type**: String (URL)
**Description**: Webhook notification endpoint
**Example**: `https://webhook.example.com/notify`

#### Sync Interval
**Field**: `syncInterval`
**Type**: Number (seconds)
**Description**: Data synchronization interval
**Default**: 300 (5 minutes)

#### Backup Enabled
**Field**: `backupEnabled`
**Type**: Boolean
**Description**: Enable automatic backups
**Default**: true

#### Backup Interval
**Field**: `backupInterval`
**Type**: Number (seconds)
**Description**: Backup frequency
**Default**: 86400 (24 hours)

#### Backup Location
**Field**: `backupLocation`
**Type**: String (path)
**Description**: Backup storage path
**Example**: `/var/backups/kumomta`

#### Failover Endpoint
**Field**: `failoverEndpoint`
**Type**: String (URL)
**Description**: Failover server endpoint
**Example**: `https://failover.example.com`

**Example Configuration**:
```json
{
  "apiEndpoint": "https://api.service.com",
  "apiVersion": "v1",
  "apiKey": "sk_live_abc123...",
  "webhookUrl": "https://webhook.example.com/notify",
  "syncInterval": 300,
  "backupEnabled": true,
  "backupInterval": 86400,
  "backupLocation": "/var/backups/kumomta",
  "failoverEndpoint": "https://failover.example.com"
}
```

---

### Performance Settings

Managed via Configuration Editor UI or API endpoint: `PUT /config/performance`

#### Cache Enabled
**Field**: `cacheEnabled`
**Type**: Boolean
**Description**: Enable caching layer
**Default**: true

#### Cache Size
**Field**: `cacheSize`
**Type**: Number (MB)
**Description**: Cache memory allocation
**Default**: 512
**Range**: 64-4096

#### Cache Expiration
**Field**: `cacheExpiration`
**Type**: Number (seconds)
**Description**: Cache entry TTL
**Default**: 3600 (1 hour)

#### Load Balancing Strategy
**Field**: `loadBalancingStrategy`
**Type**: Enum
**Options**: `round-robin`, `least-connections`, `ip-hash`
**Default**: `round-robin`

#### Max Memory Usage
**Field**: `maxMemoryUsage`
**Type**: Number (MB)
**Description**: Maximum memory limit
**Default**: 4096 (4 GB)

#### Max CPU Usage
**Field**: `maxCpuUsage`
**Type**: Number (percentage)
**Description**: Maximum CPU utilization
**Default**: 80
**Range**: 1-100

#### Connection Timeout
**Field**: `connectionTimeout`
**Type**: Number (seconds)
**Description**: Connection establishment timeout
**Default**: 30

#### Read Timeout
**Field**: `readTimeout`
**Type**: Number (seconds)
**Description**: Socket read timeout
**Default**: 60

#### Write Timeout
**Field**: `writeTimeout`
**Type**: Number (seconds)
**Description**: Socket write timeout
**Default**: 60

#### Queue Workers
**Field**: `queueWorkers`
**Type**: Number
**Description**: Worker thread count
**Default**: 4
**Range**: 1-32

**Example Configuration**:
```json
{
  "cacheEnabled": true,
  "cacheSize": 1024,
  "cacheExpiration": 3600,
  "loadBalancingStrategy": "least-connections",
  "maxMemoryUsage": 8192,
  "maxCpuUsage": 80,
  "connectionTimeout": 30,
  "readTimeout": 60,
  "writeTimeout": 60,
  "queueWorkers": 8
}
```

---

## Vite Configuration

### Basic Configuration

**File**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // Server configuration
  server: {
    port: 5173,
    host: true, // Listen on all addresses
    strictPort: false, // Try next port if occupied

    // Proxy API requests in development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'query-vendor': ['@tanstack/react-query']
        }
      }
    }
  },

  // Preview server
  preview: {
    port: 4173,
    host: true
  }
});
```

### Advanced Configuration

```typescript
export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Environment-specific settings
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },

  // Path aliases
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@hooks': '/src/hooks',
      '@services': '/src/services',
      '@types': '/src/types'
    }
  },

  // Build optimizations
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          if (id.includes('components')) {
            return 'components';
          }
        }
      }
    }
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['react', 'react-dom', '@tanstack/react-query']
  }
}));
```

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@types/*": ["src/types/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## TailwindCSS Configuration

### tailwind.config.js

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
        // Add custom colors
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        // Custom spacing
      }
    },
  },
  plugins: [
    // Add plugins if needed
  ],
}
```

---

## Best Practices

### Security
1. **Never commit .env files** to version control
2. **Use different API keys** for dev/staging/production
3. **Rotate secrets regularly**
4. **Enable CSP** in production
5. **Use HTTPS** for all production endpoints

### Performance
1. **Enable caching** appropriately
2. **Use code splitting** for large bundles
3. **Optimize images** before deployment
4. **Enable compression** on web server
5. **Use CDN** for static assets

### Configuration Management
1. **Document all variables** in this guide
2. **Validate environment** on startup
3. **Provide sensible defaults**
4. **Test configuration changes** before deployment
5. **Keep production config secure**

---

## Troubleshooting

### Environment Variables Not Loading

**Issue**: Variables undefined at runtime

**Solutions**:
1. Verify variable prefix is `VITE_`
2. Restart development server after changes
3. Check `.env` file location (project root)
4. Ensure no syntax errors in `.env` file

### Configuration Not Saving

**Issue**: Changes not persisted

**Solutions**:
1. Verify API endpoint is accessible
2. Check authentication token
3. Review server logs for errors
4. Test with curl or Postman

### Cache Issues

**Issue**: Old configuration persisting

**Solutions**:
1. Clear browser cache
2. Restart application
3. Check cache expiration settings
4. Verify cache invalidation logic

---

## Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [TypeScript Configuration](https://www.typescriptlang.org/tsconfig)
- [TailwindCSS Configuration](https://tailwindcss.com/docs/configuration)
- [React Environment Best Practices](https://create-react-app.dev/docs/adding-custom-environment-variables/)
