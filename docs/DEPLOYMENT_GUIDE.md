# KumoMTA UI Dashboard - Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Docker Deployment](#docker-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Production Checklist](#production-checklist)
6. [Monitoring](#monitoring)
7. [Backup and Recovery](#backup-and-recovery)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

**Minimum**:
- 2 CPU cores
- 4GB RAM
- 20GB disk space
- Ubuntu 20.04+ or Debian 11+

**Recommended**:
- 4 CPU cores
- 8GB RAM
- 50GB SSD
- Ubuntu 22.04 LTS

### Software Dependencies

- Node.js 20.x LTS
- npm 10.x
- Docker 24.x (for containerized deployment)
- Docker Compose 2.x (optional)
- Nginx 1.18+ (for manual deployment)
- KumoMTA server running and accessible

---

## Environment Configuration

### 1. Create Environment File

```bash
cp .env.example .env
```

### 2. Configure Variables

Edit `.env` with your production values:

```env
# Production API URL
VITE_API_URL=https://kumomta-api.yourdomain.com

# WebSocket URL (if different from API)
VITE_WS_URL=kumomta-api.yourdomain.com

# Session timeout (24 hours)
VITE_SESSION_TIMEOUT=86400000

# Polling intervals
VITE_METRICS_INTERVAL=15000
VITE_QUEUE_INTERVAL=10000

# Feature flags
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_TRACKING=true

# Production settings
VITE_DEV_MODE=false
VITE_ENABLE_DEVTOOLS=false
VITE_API_TIMEOUT=30000

# Security
VITE_ENABLE_CSRF=true
VITE_FORCE_HTTPS=true

# Logging
VITE_LOG_LEVEL=warn
```

### 3. Validate Configuration

```bash
# Check all required variables are set
node -e "require('dotenv').config(); console.log(process.env.VITE_API_URL || 'Missing VITE_API_URL')"
```

---

## Docker Deployment

### Option 1: Docker Compose (Recommended)

**1. Update docker-compose.yml**:

```yaml
version: '3.8'

services:
  kumomta-ui:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - kumomta-backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  kumomta-backend:
    image: kumomta/kumomta:latest
    ports:
      - "8000:8000"
    volumes:
      - kumomta-data:/var/spool/kumomta
      - kumomta-config:/etc/kumomta
    restart: unless-stopped

volumes:
  kumomta-data:
  kumomta-config:
```

**2. Deploy**:

```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f kumomta-ui

# Verify health
curl http://localhost:3000/health
```

**3. Update/Restart**:

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Verify deployment
docker-compose ps
```

### Option 2: Standalone Docker

**1. Build Image**:

```bash
docker build -t kumomta-ui:latest .
```

**2. Run Container**:

```bash
docker run -d \
  --name kumomta-ui \
  --restart unless-stopped \
  -p 3000:80 \
  -e NODE_ENV=production \
  -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
  kumomta-ui:latest
```

**3. Check Status**:

```bash
# View logs
docker logs -f kumomta-ui

# Check health
docker exec kumomta-ui wget -q --spider http://localhost/health && echo "Healthy"
```

---

## Manual Deployment

### 1. Build Application

```bash
# Install dependencies
npm ci --production=false

# Build for production
npm run build

# Verify build
ls -lh dist/
```

### 2. Install Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# Start and enable
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. Configure Nginx

Create `/etc/nginx/sites-available/kumomta-ui`:

```nginx
server {
    listen 80;
    server_name kumomta-ui.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kumomta-ui.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/kumomta-ui.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kumomta-ui.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Root directory
    root /var/www/kumomta-ui/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Static assets with caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Metrics endpoint (no auth required from trusted IPs)
    location /metrics.json {
        proxy_pass http://localhost:8000/metrics.json;

        # Allow from trusted IPs only
        allow 127.0.0.1;
        allow 10.0.0.0/8;
        deny all;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://localhost:8000/ws/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # WebSocket timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # SPA routing - all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**4. Enable Site**:

```bash
# Link configuration
sudo ln -s /etc/nginx/sites-available/kumomta-ui /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 5. Deploy Application

```bash
# Create directory
sudo mkdir -p /var/www/kumomta-ui

# Copy build files
sudo cp -r dist/* /var/www/kumomta-ui/

# Set permissions
sudo chown -R www-data:www-data /var/www/kumomta-ui
sudo chmod -R 755 /var/www/kumomta-ui
```

### 6. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d kumomta-ui.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## Production Checklist

### Pre-Deployment

- [ ] Set all environment variables
- [ ] Change default credentials
- [ ] Configure TLS/SSL certificates
- [ ] Set up DKIM signing
- [ ] Configure IP whitelist/blacklist
- [ ] Set appropriate rate limits
- [ ] Enable CSRF protection
- [ ] Configure CORS headers
- [ ] Set up monitoring alerts
- [ ] Create backup strategy

### Security

- [ ] Use HTTPS only
- [ ] Strong passwords (16+ characters)
- [ ] HTTP Basic Auth enabled
- [ ] CSRF tokens validated
- [ ] Security headers configured
- [ ] API rate limiting active
- [ ] Firewall rules configured
- [ ] Regular security audits scheduled

### Performance

- [ ] Gzip compression enabled
- [ ] Static asset caching (1 year)
- [ ] Connection pooling configured
- [ ] Database indexes optimized
- [ ] CDN configured (if applicable)
- [ ] Load balancing setup (if needed)

### Monitoring

- [ ] Health check endpoint active
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Log aggregation configured
- [ ] Uptime monitoring setup
- [ ] Alert notifications configured

---

## Monitoring

### Application Logs

**Docker**:
```bash
# View live logs
docker-compose logs -f kumomta-ui

# Last 100 lines
docker-compose logs --tail=100 kumomta-ui
```

**Manual**:
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Application logs (if using PM2)
pm2 logs kumomta-ui
```

### Health Monitoring

**Endpoint**:
```bash
curl http://your-domain/health
# Expected: "healthy"
```

**Automated Monitoring**:
```bash
# Crontab entry (check every 5 minutes)
*/5 * * * * curl -f http://localhost/health || echo "Health check failed" | mail -s "KumoMTA UI Down" admin@example.com
```

### Metrics Collection

Configure external monitoring:
- **Prometheus**: Scrape `/metrics.json` endpoint
- **Grafana**: Visualize metrics dashboards
- **Datadog**: APM and infrastructure monitoring
- **New Relic**: Application performance monitoring

---

## Backup and Recovery

### Database Backup

```bash
# Backup KumoMTA configuration
sudo tar -czf /backup/kumomta-config-$(date +%Y%m%d).tar.gz /etc/kumomta/

# Backup message queue data
sudo tar -czf /backup/kumomta-data-$(date +%Y%m%d).tar.gz /var/spool/kumomta/
```

### Application Backup

```bash
# Backup environment configuration
cp .env /backup/.env.$(date +%Y%m%d)

# Backup custom configuration
sudo tar -czf /backup/nginx-config-$(date +%Y%m%d).tar.gz /etc/nginx/sites-available/kumomta-ui
```

### Automated Backups

**Crontab**:
```bash
# Daily backup at 2 AM
0 2 * * * /opt/scripts/backup-kumomta.sh

# Weekly full backup on Sunday
0 3 * * 0 /opt/scripts/full-backup.sh
```

**Backup Script** (`/opt/scripts/backup-kumomta.sh`):
```bash
#!/bin/bash
BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup configuration
tar -czf $BACKUP_DIR/kumomta-config-$DATE.tar.gz /etc/kumomta/

# Backup data
tar -czf $BACKUP_DIR/kumomta-data-$DATE.tar.gz /var/spool/kumomta/

# Remove backups older than 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/kumomta-config-$DATE.tar.gz s3://your-bucket/backups/
```

### Recovery Procedure

**1. Stop Services**:
```bash
docker-compose down
# OR
sudo systemctl stop nginx
```

**2. Restore Data**:
```bash
# Restore configuration
sudo tar -xzf /backup/kumomta-config-YYYYMMDD.tar.gz -C /

# Restore data
sudo tar -xzf /backup/kumomta-data-YYYYMMDD.tar.gz -C /
```

**3. Start Services**:
```bash
docker-compose up -d
# OR
sudo systemctl start nginx
```

**4. Verify**:
```bash
curl http://localhost/health
```

---

## Troubleshooting

### Build Failures

**Issue**: `npm run build` fails

**Solutions**:
```bash
# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Try build again
npm run build
```

### Docker Issues

**Issue**: Container won't start

**Debug**:
```bash
# Check logs
docker-compose logs kumomta-ui

# Inspect container
docker inspect kumomta-ui

# Check resource usage
docker stats kumomta-ui
```

### Nginx Issues

**Issue**: 502 Bad Gateway

**Solutions**:
```bash
# Check backend is running
curl http://localhost:8000/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Performance Issues

**Issue**: Slow page loads

**Solutions**:
```bash
# Check server resources
htop

# Analyze bundle size
npm run build -- --analyze

# Enable Nginx caching
# Add to nginx.conf:
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;
```

### SSL/TLS Issues

**Issue**: Certificate errors

**Solutions**:
```bash
# Check certificate expiry
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal
```

---

## Updating

### Rolling Update (Zero Downtime)

**1. Pull Latest Code**:
```bash
git pull origin main
```

**2. Build New Version**:
```bash
npm run build
```

**3. Test Build**:
```bash
# Serve locally and test
npx serve -s dist -p 3001
curl http://localhost:3001/health
```

**4. Deploy**:
```bash
# Backup current version
sudo cp -r /var/www/kumomta-ui /var/www/kumomta-ui.bak

# Deploy new version
sudo rm -rf /var/www/kumomta-ui/*
sudo cp -r dist/* /var/www/kumomta-ui/

# No Nginx restart needed (static files)
```

**5. Rollback (if needed)**:
```bash
# Restore backup
sudo rm -rf /var/www/kumomta-ui
sudo mv /var/www/kumomta-ui.bak /var/www/kumomta-ui
```

---

## Support

- **Documentation**: Full docs in `/docs` directory
- **Issues**: Report bugs via GitHub Issues
- **Email**: support@example.com
- **Version**: 1.0.0

---

**Last Updated**: 2025-10-24
