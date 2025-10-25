# KumoMTA UI Production Deployment Guide

Complete guide for production deployment with SSL, monitoring, and automation.

## Quick Start

```bash
# 1. Configure environment
cp .env.production.example .env
nano .env  # Edit DOMAIN, LETSENCRYPT_EMAIL, etc.

# 2. Setup SSL certificates
./scripts/ssl-setup.sh -d kumomta.example.com -e admin@example.com

# 3. Deploy to production
./scripts/deploy-production.sh

# 4. Setup monitoring
./scripts/setup-monitoring.sh --email alerts@example.com
```

## Files Created

### Deployment Infrastructure
- **docker-compose.prod.yml** - Production Docker Compose with SSL, health checks, Redis, Prometheus, Grafana
- **config/nginx.prod.conf** - Production Nginx with SSL, security headers, rate limiting, caching
- **.env.production.example** - Production environment variables template

### Deployment Scripts
- **scripts/ssl-setup.sh** - Let's Encrypt SSL automation with auto-renewal
- **scripts/deploy-production.sh** - Full deployment with validation, backup, health checks
- **scripts/setup-monitoring.sh** - Health checks, log rotation, alerting setup

### Documentation
- **docs/DEPLOYMENT.md** - Comprehensive deployment guide

## Deployment Steps

See full documentation in /home/ruhroh/kumo-mta-ui/docs/DEPLOYMENT.md
