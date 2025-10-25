# Production Deployment Infrastructure - Summary

## Overview

Production-ready deployment infrastructure has been created for KumoMTA UI Dashboard with comprehensive SSL, monitoring, health checks, and automation.

## Files Created

### 1. Production Docker Compose Configuration
**File**: `/home/ruhroh/kumo-mta-ui/docker-compose.prod.yml`

**Features**:
- Multi-service architecture (UI, Backend, Redis, Prometheus, Grafana, Certbot)
- SSL/TLS certificate management with auto-renewal
- Health checks for all services
- Volume mounts for persistence
- Network isolation
- Resource monitoring
- Automatic container restart policies
- Centralized logging with rotation

**Services**:
- `kumomta-ui`: Frontend with Nginx + SSL (ports 80, 443)
- `certbot`: Automatic SSL certificate renewal
- `kumomta-backend`: Email server backend (ports 8000, 25, 587, 465)
- `redis`: Caching and session management (port 6379)
- `prometheus`: Metrics collection (port 9090)
- `grafana`: Visualization dashboard (port 3001)

### 2. Production Nginx Configuration
**File**: `/home/ruhroh/kumo-mta-ui/config/nginx.prod.conf`

**Security Features**:
- TLS 1.2/1.3 only with strong cipher suites
- HSTS header support
- Content Security Policy (CSP)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- Rate limiting (10 req/s general, 50 req/s API)
- Connection limits

**Performance Features**:
- HTTP/2 support
- Gzip compression
- Static asset caching (1 year)
- Optimized buffer sizes
- Keep-alive connections
- WebSocket support

### 3. SSL Setup Script
**File**: `/home/ruhroh/kumo-mta-ui/scripts/ssl-setup.sh` (8.0K)

**Capabilities**:
- Automated Let's Encrypt certificate generation
- Self-signed certificates for initial setup
- Staging mode for testing
- Automatic renewal via cron
- Certificate verification
- Domain validation

**Usage**:
```bash
# Production
./scripts/ssl-setup.sh -d kumomta.example.com -e admin@example.com

# Testing
./scripts/ssl-setup.sh -d kumomta.example.com -e admin@example.com --staging

# Renewal
./scripts/ssl-setup.sh -d kumomta.example.com -e admin@example.com --renew
```

### 4. Production Deployment Script
**File**: `/home/ruhroh/kumo-mta-ui/scripts/deploy-production.sh` (12K)

**Pre-deployment Checks**:
- Docker and Docker Compose validation
- Environment variable verification
- SSL certificate validation
- Required ports availability

**Deployment Process**:
1. Create backup of existing deployment
2. Pull latest Docker images
3. Build application containers
4. Deploy containers with zero-downtime
5. Wait for services to become healthy
6. Run comprehensive health checks
7. Display deployment summary

**Rollback Support**:
- Automatic rollback on deployment failure
- Backup restoration capability
- Error handling and logging

**Usage**:
```bash
# Standard deployment
./scripts/deploy-production.sh

# Quick deployment (skip build)
./scripts/deploy-production.sh --skip-build

# CI/CD deployment (no confirmation)
./scripts/deploy-production.sh --force

# Skip specific checks
./scripts/deploy-production.sh --skip-ssl --skip-backup
```

### 5. Monitoring Setup Script
**File**: `/home/ruhroh/kumo-mta-ui/scripts/setup-monitoring.sh` (17K)

**Monitoring Components**:
1. **Health Check Script** (`monitoring/health-check.sh`)
   - Container status monitoring
   - UI/Backend endpoint health checks
   - Disk space monitoring (90% threshold)
   - Memory usage monitoring (90% threshold)
   - Automated alerts via email/Slack/Discord

2. **Cron Jobs**:
   - Health checks every 5 minutes
   - Certificate renewal daily at 2 AM
   - Container auto-restart every 10 minutes

3. **Log Rotation**:
   - Application logs: Daily, 14-day retention
   - Docker logs: Weekly, 4-week retention, 100MB max size
   - Compressed archives

4. **Monitoring Dashboard** (`monitoring/dashboard.sh`)
   - Real-time container status
   - Resource usage metrics
   - Recent error logs
   - Health status summary

5. **Prometheus Configuration** (`config/prometheus.yml`)
   - KumoMTA backend metrics
   - Node exporter integration
   - Docker metrics
   - 30-day retention

6. **Grafana Datasource** (`config/grafana/datasources/prometheus.yml`)
   - Prometheus integration
   - Auto-provisioning

**Alert Channels**:
- Email notifications
- Slack webhooks
- Discord webhooks

**Usage**:
```bash
# Basic setup
./scripts/setup-monitoring.sh

# With email alerts
./scripts/setup-monitoring.sh --email alerts@example.com

# With Slack
./scripts/setup-monitoring.sh --slack-webhook https://hooks.slack.com/...

# With Discord
./scripts/setup-monitoring.sh --discord-webhook https://discord.com/...
```

### 6. Production Environment Configuration
**File**: `/home/ruhroh/kumo-mta-ui/.env.production.example`

**Configuration Categories**:
- Domain & SSL settings
- API endpoints (HTTPS/WSS)
- Authentication & session management
- Feature flags
- Logging levels
- Database & cache configuration
- Monitoring & alerting
- Security settings
- Performance tuning
- Docker configuration
- SMTP settings

**Key Variables**:
```bash
DOMAIN=kumomta.example.com
LETSENCRYPT_EMAIL=admin@example.com
VITE_API_URL=https://api.kumomta.example.com
VITE_ENABLE_WEBSOCKET=true
VITE_FORCE_HTTPS=true
JWT_SECRET=<generated>
REDIS_PASSWORD=<generated>
```

### 7. Comprehensive Deployment Documentation
**File**: `/home/ruhroh/kumo-mta-ui/docs/DEPLOYMENT.md`

**Sections**:
1. Prerequisites (system requirements, software)
2. Initial setup (clone, configure, permissions)
3. SSL certificate configuration (3 options)
4. Production deployment (standard, quick, force)
5. Monitoring setup (health checks, alerts, dashboards)
6. Maintenance (logs, containers, backup/restore, updates)
7. Troubleshooting (common issues, solutions)
8. Security best practices

## Quick Start Guide

### 1. Initial Configuration

```bash
# Navigate to project
cd /home/ruhroh/kumo-mta-ui

# Copy and configure environment
cp .env.production.example .env
nano .env  # Set DOMAIN, LETSENCRYPT_EMAIL, etc.

# Generate secrets
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" .env
sed -i "s/SESSION_SECRET=.*/SESSION_SECRET=$(openssl rand -hex 32)/" .env
sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$(openssl rand -hex 24)/" .env

# Make scripts executable (already done)
chmod +x scripts/*.sh
```

### 2. SSL Certificate Setup

```bash
# For production domain
./scripts/ssl-setup.sh \
  --domain kumomta.example.com \
  --email admin@example.com

# For testing (staging certificates)
./scripts/ssl-setup.sh \
  --domain kumomta.example.com \
  --email admin@example.com \
  --staging
```

### 3. Deploy to Production

```bash
# Full deployment with all checks
./scripts/deploy-production.sh

# View deployment status
docker-compose -f docker-compose.prod.yml ps
```

### 4. Setup Monitoring

```bash
# With email alerts
./scripts/setup-monitoring.sh --email alerts@example.com

# View monitoring dashboard
./monitoring/dashboard.sh

# Run manual health check
./monitoring/health-check.sh
```

## Access Points

After successful deployment:

- **KumoMTA UI**: https://kumomta.example.com
- **API Endpoint**: https://kumomta.example.com/api
- **Health Check**: https://kumomta.example.com/health
- **Prometheus**: http://kumomta.example.com:9090
- **Grafana**: http://kumomta.example.com:3001 (admin / GRAFANA_ADMIN_PASSWORD)

## Monitoring & Maintenance

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f kumomta-ui

# Errors only
docker-compose -f docker-compose.prod.yml logs | grep -i error
```

### Health Checks
```bash
# View monitoring dashboard
./monitoring/dashboard.sh

# Manual health check
./monitoring/health-check.sh

# View health check logs
tail -f logs/health-check.log
```

### Container Management
```bash
# Status
docker-compose -f docker-compose.prod.yml ps

# Restart
docker-compose -f docker-compose.prod.yml restart

# Stop
docker-compose -f docker-compose.prod.yml down

# Start
docker-compose -f docker-compose.prod.yml up -d
```

### Backups
```bash
# List backups (created automatically during deployment)
ls -lh backups/

# Manual backup
docker run --rm \
  -v kumomta-data:/data \
  -v kumomta-logs:/logs \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/manual-$(date +%Y%m%d-%H%M%S).tar.gz /data /logs
```

## Security Features

1. **SSL/TLS**:
   - Automatic certificate generation and renewal
   - TLS 1.2/1.3 only
   - Strong cipher suites
   - HSTS support

2. **Network Security**:
   - Rate limiting (10-50 req/s)
   - Connection limits
   - Isolated Docker network
   - Firewall-ready configuration

3. **Application Security**:
   - CSP headers
   - XSS protection
   - CSRF protection
   - Security headers
   - No server tokens

4. **Monitoring Security**:
   - Health check alerts
   - Resource usage monitoring
   - Automated restarts on failure
   - Log rotation and retention

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Internet (HTTPS)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │  Nginx  │ (SSL Termination, Rate Limiting)
                    │  :443   │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐    ┌────▼────┐     ┌────▼────┐
   │ UI React │    │   API   │     │   WS    │
   │  Assets  │    │ Proxy   │     │  Proxy  │
   └──────────┘    └────┬────┘     └────┬────┘
                        │                │
                   ┌────▼────────────────▼────┐
                   │   KumoMTA Backend        │
                   │   :8000, :25, :587, :465 │
                   └────┬─────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
   │  Redis  │    │  Data   │    │  Logs   │
   │  Cache  │    │ Volume  │    │ Volume  │
   └─────────┘    └─────────┘    └─────────┘

Monitoring Stack:
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Prometheus  │───▶│   Grafana    │    │   Certbot    │
│    :9090     │    │    :3001     │    │  (renewal)   │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Performance Optimizations

1. **Nginx**:
   - 2048 worker connections
   - HTTP/2 enabled
   - Gzip compression (level 6)
   - Static asset caching (1 year)
   - Connection keep-alive

2. **Docker**:
   - Multi-stage builds
   - Optimized base images (Alpine)
   - Volume mounts for data persistence
   - Health checks for all services

3. **Application**:
   - Redis caching
   - WebSocket support
   - Asset optimization
   - Production build

## Troubleshooting

Common issues and solutions are documented in:
- `/home/ruhroh/kumo-mta-ui/docs/DEPLOYMENT.md`

Quick troubleshooting commands:
```bash
# Container logs
docker-compose -f docker-compose.prod.yml logs [service]

# Container status
docker-compose -f docker-compose.prod.yml ps

# Nginx configuration test
docker-compose -f docker-compose.prod.yml exec kumomta-ui nginx -t

# SSL certificate check
openssl x509 -in certs/live/kumomta/fullchain.pem -text -noout

# Health endpoints
curl -k https://localhost/health
curl http://localhost:8000/api/v1/health
```

## Next Steps

1. **Configure Environment**: Update `.env` with your domain and settings
2. **Setup SSL**: Run `./scripts/ssl-setup.sh` with your domain
3. **Deploy**: Execute `./scripts/deploy-production.sh`
4. **Configure Monitoring**: Run `./scripts/setup-monitoring.sh` with alert settings
5. **Verify**: Access https://your-domain and check all services
6. **Documentation**: Review `/home/ruhroh/kumo-mta-ui/docs/DEPLOYMENT.md` for details

## Support & Resources

- **Full Documentation**: `/home/ruhroh/kumo-mta-ui/docs/DEPLOYMENT.md`
- **KumoMTA Docs**: https://kumomta.com/docs
- **Docker Docs**: https://docs.docker.com/
- **Let's Encrypt**: https://letsencrypt.org/docs/

---

**Created**: 2025-01-25  
**Status**: Production Ready  
**Version**: 1.0.0
