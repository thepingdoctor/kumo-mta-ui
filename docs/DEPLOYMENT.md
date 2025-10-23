# KumoMTA UI - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Server Configuration](#server-configuration)
6. [Security Considerations](#security-considerations)
7. [Performance Optimization](#performance-optimization)
8. [Monitoring and Logging](#monitoring-and-logging)

---

## Prerequisites

### System Requirements

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Memory**: 2GB RAM minimum
- **Disk Space**: 500MB for build artifacts
- **Web Server**: Nginx, Apache, or similar

### KumoMTA Server

- Running KumoMTA instance
- API endpoint accessible from deployment server
- Valid authentication credentials

---

## Environment Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_URL=https://api.kumomta.example.com
VITE_API_TIMEOUT=10000

# Application Configuration
VITE_APP_NAME=KumoMTA Dashboard
VITE_APP_VERSION=1.0.0

# Feature Flags (optional)
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_ANALYTICS=false

# Security (optional)
VITE_ENABLE_CSP=true
VITE_ALLOWED_ORIGINS=https://dashboard.example.com
```

### Production Environment

For production deployments, use `.env.production`:

```env
VITE_API_URL=https://api.kumomta.example.com
NODE_ENV=production
```

### Validation

Verify environment variables are loaded:

```bash
npm run dev
# Check console for configuration warnings
```

---

## Build Process

### Development Build

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Access at http://localhost:5173
```

### Production Build

```bash
# Clean previous builds (optional)
rm -rf dist

# Create optimized production build
npm run build

# Output directory: dist/
```

### Build Output

The `dist/` directory contains:

```
dist/
├── assets/
│   ├── index-[hash].js       # Main bundle
│   ├── index-[hash].css      # Compiled styles
│   └── [other-chunks].js     # Code-split chunks
├── index.html                # Entry point
└── favicon.ico               # Application icon
```

### Build Optimization

**Vite Configuration** (`vite.config.ts`):

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,           // Disable in production
    minify: 'terser',           // Minification
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
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
```

### Build Verification

```bash
# Preview production build locally
npm run preview

# Access at http://localhost:4173
```

---

## Deployment Options

### Option 1: Static File Hosting

Deploy to static hosting services:

#### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

**netlify.toml**:
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

**vercel.json**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### AWS S3 + CloudFront

```bash
# Build application
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DIST_ID \
  --paths "/*"
```

---

### Option 2: Traditional Web Server

#### Nginx

**Installation**:
```bash
sudo apt update
sudo apt install nginx
```

**Configuration** (`/etc/nginx/sites-available/kumomta-ui`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name dashboard.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dashboard.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/dashboard.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dashboard.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory
    root /var/www/kumomta-ui/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Cache control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - redirect all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional)
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logging
    access_log /var/log/nginx/kumomta-ui-access.log;
    error_log /var/log/nginx/kumomta-ui-error.log;
}
```

**Enable and restart**:
```bash
sudo ln -s /etc/nginx/sites-available/kumomta-ui /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Apache

**Configuration** (`.htaccess`):

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

### Option 3: Docker Container

**Dockerfile**:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf** (for Docker):

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Build and run**:

```bash
# Build image
docker build -t kumomta-ui:latest .

# Run container
docker run -d \
  -p 80:80 \
  -e VITE_API_URL=https://api.kumomta.example.com \
  --name kumomta-ui \
  kumomta-ui:latest
```

**Docker Compose** (`docker-compose.yml`):

```yaml
version: '3.8'

services:
  kumomta-ui:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=https://api.kumomta.example.com
    restart: unless-stopped
```

---

## Security Considerations

### SSL/TLS Configuration

**Let's Encrypt with Certbot**:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d dashboard.example.com

# Auto-renewal (already configured by certbot)
sudo certbot renew --dry-run
```

### Content Security Policy

Add to Nginx configuration:

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  connect-src 'self' https://api.kumomta.example.com;
  frame-ancestors 'none';
" always;
```

### Environment Variables Security

Never commit `.env` files to version control:

```bash
# .gitignore
.env
.env.local
.env.production
```

---

## Performance Optimization

### Compression

**Nginx Gzip**:
```nginx
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

### Caching Strategy

**Browser caching**:
- Static assets: 1 year
- HTML files: No cache
- API responses: Controlled by API

### CDN Integration

Use CloudFlare or similar for:
- Global content delivery
- DDoS protection
- SSL/TLS termination
- Caching

---

## Monitoring and Logging

### Application Monitoring

**Error Tracking** (Sentry):

```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE,
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

### Server Logs

**Nginx logs**:
```bash
# Access logs
tail -f /var/log/nginx/kumomta-ui-access.log

# Error logs
tail -f /var/log/nginx/kumomta-ui-error.log
```

### Health Checks

Create a health check endpoint:

```nginx
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

---

## Troubleshooting

### Common Issues

**1. Blank page after deployment**
- Check browser console for errors
- Verify base URL in `vite.config.ts`
- Check nginx configuration for correct root path

**2. API connection errors**
- Verify VITE_API_URL is correct
- Check CORS configuration on API server
- Verify network connectivity

**3. 404 errors on refresh**
- Ensure nginx/apache has SPA routing configured
- Check `try_files` directive in nginx

**4. Build failures**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version: `node -v`
- Verify all environment variables are set

---

## Rollback Procedure

```bash
# Keep previous builds
mv dist dist.backup

# Deploy new build
npm run build

# If issues occur, rollback
rm -rf dist
mv dist.backup dist

# Restart server
sudo systemctl restart nginx
```

---

## Continuous Deployment

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: npm run build

      - name: Deploy to Server
        uses: easingthemes/ssh-deploy@v2.1.5
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: /var/www/kumomta-ui/dist
```
