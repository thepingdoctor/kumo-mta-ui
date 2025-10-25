# Rate Limiting Configuration Guide

Comprehensive guide for implementing rate limiting in KumoMTA UI to prevent abuse and DDoS attacks.

## Table of Contents

- [Overview](#overview)
- [Nginx Rate Limiting](#nginx-rate-limiting)
- [Application-Level Rate Limiting](#application-level-rate-limiting)
- [Fail2ban Integration](#fail2ban-integration)
- [Monitoring and Alerts](#monitoring-and-alerts)
- [Best Practices](#best-practices)

---

## Overview

### Why Rate Limiting?

Rate limiting protects your application from:
- **Brute Force Attacks:** Repeated login attempts
- **DDoS Attacks:** Overwhelming server resources
- **API Abuse:** Excessive API calls
- **Scraping:** Automated data harvesting
- **Resource Exhaustion:** Memory/CPU overload

### Multi-Layer Approach

Implement rate limiting at multiple layers:
1. **Network Level:** Firewall/UFW
2. **Web Server:** Nginx
3. **Application:** Express/Node.js middleware
4. **Monitoring:** Fail2ban

---

## Nginx Rate Limiting

### Basic Configuration

Add to `/etc/nginx/nginx.conf` (http block):

```nginx
http {
    # Define rate limit zones
    # Zone: api_limit - 10 requests/second per IP
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

    # Zone: login_limit - 5 requests/minute per IP
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    # Zone: upload_limit - 2 requests/minute per IP
    limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=2r/m;

    # Connection limiting - max 10 connections per IP
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Rate limit status codes
    limit_req_status 429;
    limit_conn_status 429;

    # Rest of configuration...
}
```

### Server Block Configuration

Add to `/etc/nginx/sites-available/kumomta-ui`:

```nginx
server {
    listen 443 ssl http2;
    server_name kumomta.example.com;

    # Global connection limit
    limit_conn conn_limit 10;

    # Login endpoint - strict rate limiting
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        limit_req_log_level warn;

        # Return custom error page
        error_page 429 /rate_limit.html;

        proxy_pass http://backend:8000;
        # ... proxy settings
    }

    # API endpoints - moderate rate limiting
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_log_level warn;

        proxy_pass http://backend:8000;
        # ... proxy settings
    }

    # File upload endpoints - strict limiting
    location /api/upload {
        limit_req zone=upload_limit burst=1 nodelay;

        # Also limit request body size
        client_max_body_size 10M;

        proxy_pass http://backend:8000;
        # ... proxy settings
    }

    # Static assets - no rate limiting
    location ~* \.(css|js|jpg|png|ico|svg|woff2)$ {
        # No limits for static content
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Rate Limit Parameters Explained

**`limit_req_zone` syntax:**
```nginx
limit_req_zone $key zone=name:size rate=rate;
```

- `$key`: Variable to track (usually `$binary_remote_addr` for IP)
- `zone=name:size`: Zone name and memory size
  - 10m = 10 megabytes (stores ~160,000 IP addresses)
- `rate`: Maximum request rate
  - `10r/s` = 10 requests per second
  - `5r/m` = 5 requests per minute

**`limit_req` syntax:**
```nginx
limit_req zone=name [burst=number] [nodelay|delay=number];
```

- `zone=name`: Which zone to use
- `burst=number`: Allow burst of requests
- `nodelay`: Process burst immediately (don't queue)
- `delay=number`: Delay processing after X requests

### Advanced Rate Limiting

**Per-User Rate Limiting (using cookie/header):**

```nginx
http {
    # Map user ID from cookie to variable
    map $cookie_user_id $rate_limit_key {
        default $binary_remote_addr;
        "~*^(.+)$" $1;
    }

    # Create zone using user ID when available
    limit_req_zone $rate_limit_key zone=user_limit:10m rate=20r/s;
}

server {
    location /api/ {
        limit_req zone=user_limit burst=30 nodelay;
        proxy_pass http://backend:8000;
    }
}
```

**Whitelist Trusted IPs:**

```nginx
http {
    # Create whitelist mapping
    geo $limit {
        default 1;
        # Trusted IPs
        10.0.0.0/8 0;
        192.168.1.100 0;
        203.0.113.50 0;
    }

    # Only apply limits to non-whitelisted IPs
    map $limit $limit_key {
        0 "";
        1 $binary_remote_addr;
    }

    limit_req_zone $limit_key zone=smart_limit:10m rate=10r/s;
}

server {
    location /api/ {
        limit_req zone=smart_limit burst=20 nodelay;
        proxy_pass http://backend:8000;
    }
}
```

**Different Limits for Different Methods:**

```nginx
http {
    # GET requests - more lenient
    limit_req_zone $binary_remote_addr zone=get_limit:10m rate=20r/s;

    # POST requests - stricter
    limit_req_zone $binary_remote_addr zone=post_limit:10m rate=5r/s;
}

server {
    location /api/ {
        # Apply different limits based on request method
        limit_req zone=get_limit burst=40 nodelay;

        if ($request_method = POST) {
            limit_req zone=post_limit burst=10 nodelay;
        }

        proxy_pass http://backend:8000;
    }
}
```

### Custom Rate Limit Response

Create custom error page `/usr/share/nginx/html/rate_limit.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rate Limit Exceeded</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #e74c3c; }
        p { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚠️ Rate Limit Exceeded</h1>
        <p>You have made too many requests. Please try again later.</p>
        <p>If you believe this is an error, please contact support.</p>
    </div>
</body>
</html>
```

Configure in Nginx:

```nginx
server {
    # Custom error page for 429
    error_page 429 /rate_limit.html;
    location = /rate_limit.html {
        root /usr/share/nginx/html;
        internal;
    }
}
```

---

## Application-Level Rate Limiting

### Express.js Rate Limiting

Install `express-rate-limit`:

```bash
npm install express-rate-limit
```

**Basic implementation:**

```javascript
const rateLimit = require('express-rate-limit');

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,
});

// Login rate limiter - stricter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again after 15 minutes.',
  skipSuccessfulRequests: true, // Don't count successful logins
});

// API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
});

// Apply limiters
app.use(globalLimiter);
app.post('/api/auth/login', loginLimiter, loginController);
app.use('/api/', apiLimiter);
```

**Advanced configuration with Redis:**

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

const redisClient = new Redis({
  host: 'localhost',
  port: 6379,
});

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:', // Rate limit prefix in Redis
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many requests',
    retryAfter: 900, // seconds
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

app.use(limiter);
```

**Per-user rate limiting:**

```javascript
const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Skip rate limiting for admins
    return req.user?.role === 'admin';
  },
});
```

### Rate Limit Headers

Standard rate limit headers:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1635724800
```

Client-side handling:

```javascript
async function apiCall() {
  const response = await fetch('/api/endpoint');

  if (response.status === 429) {
    const retryAfter = response.headers.get('RateLimit-Reset');
    console.log(`Rate limited. Retry after: ${retryAfter}`);

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return apiCall(); // Retry
  }

  return response.json();
}
```

---

## Fail2ban Integration

### Configuration

Add to `/etc/fail2ban/jail.d/kumomta-ui.conf`:

```ini
# Rate limit violations
[kumomta-rate-limit]
enabled = true
port = http,https
filter = kumomta-rate-limit
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 300
bantime = 3600
action = iptables-multiport[name=kumomta-rate, port="http,https"]
```

Add filter `/etc/fail2ban/filter.d/kumomta-rate-limit.conf`:

```ini
[Definition]
failregex = limiting requests, excess:.* by zone.*client: <HOST>
ignoreregex =
```

Restart Fail2ban:

```bash
sudo systemctl restart fail2ban
sudo fail2ban-client status kumomta-rate-limit
```

---

## Monitoring and Alerts

### Nginx Metrics

Monitor rate limiting in Nginx logs:

```bash
# Count rate limit violations
sudo grep "limiting requests" /var/log/nginx/error.log | wc -l

# Top offending IPs
sudo grep "limiting requests" /var/log/nginx/error.log | \
  grep -oP 'client: \K[0-9.]+' | sort | uniq -c | sort -rn | head -10

# Real-time monitoring
sudo tail -f /var/log/nginx/error.log | grep "limiting"
```

### Prometheus Monitoring

Export Nginx metrics with `nginx-prometheus-exporter`:

```yaml
# docker-compose.yml
services:
  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    ports:
      - "9113:9113"
    command:
      - -nginx.scrape-uri=http://nginx:80/stub_status

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
```

**Prometheus queries:**

```promql
# Rate limit violations per minute
rate(nginx_http_requests_total{status="429"}[1m])

# Top 10 IPs hitting rate limits
topk(10, sum by (remote_addr) (nginx_http_requests_total{status="429"}))
```

### Alert Configuration

**Alert when rate limits are hit frequently:**

```yaml
# prometheus-alerts.yml
groups:
  - name: rate_limiting
    interval: 30s
    rules:
      - alert: HighRateLimitViolations
        expr: rate(nginx_http_requests_total{status="429"}[5m]) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High rate limit violations"
          description: "{{ $value }} rate limit violations per second"

      - alert: PotentialDDoS
        expr: rate(nginx_http_requests_total{status="429"}[1m]) > 100
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Potential DDoS attack detected"
          description: "{{ $value }} rate limit violations per second"
```

---

## Best Practices

### 1. Tiered Rate Limiting

Implement multiple tiers based on endpoint sensitivity:

| Endpoint Type | Rate Limit | Burst | Window |
|--------------|------------|-------|--------|
| Static Assets | Unlimited | - | - |
| Public API | 60 req/min | 10 | 1 min |
| Authenticated API | 120 req/min | 20 | 1 min |
| Login | 5 req | 2 | 15 min |
| Password Reset | 3 req | 1 | 1 hour |
| File Upload | 5 req | 1 | 1 hour |

### 2. Graceful Degradation

```nginx
# Allow some burst traffic
location /api/ {
    limit_req zone=api_limit burst=20 nodelay;
    # nodelay: process immediately (best UX)
    # Without nodelay: queue requests (resource saving)
}
```

### 3. Informative Error Messages

```javascript
app.use((err, req, res, next) => {
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: err.retryAfter,
      limit: err.limit,
      current: err.current,
    });
  }
  next(err);
});
```

### 4. Whitelist Critical Services

```nginx
geo $is_whitelisted {
    default 0;
    10.0.0.0/8 1;          # Internal network
    192.168.1.100 1;       # Office IP
    203.0.113.50 1;        # Monitoring service
}

map $is_whitelisted $limit_key {
    0 $binary_remote_addr;
    1 "";
}

limit_req_zone $limit_key zone=smart_limit:10m rate=10r/s;
```

### 5. Logging and Monitoring

```nginx
# Log rate limit events
limit_req_log_level warn;

# Custom log format with rate limit info
log_format rate_limit '$remote_addr - [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" rate_limited="$limit_req_status"';

access_log /var/log/nginx/rate_limit.log rate_limit;
```

### 6. Progressive Rate Limiting

Start lenient, tighten over time:

**Week 1-2: Monitor**
```nginx
# High limits, just monitor
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
```

**Week 3-4: Soft Limits**
```nginx
# Moderate limits
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
```

**Production: Strict Limits**
```nginx
# Production limits
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

### 7. Document Rate Limits

Publish rate limits in API documentation:

```yaml
# OpenAPI/Swagger
paths:
  /api/endpoint:
    get:
      summary: Get data
      responses:
        '200':
          description: Success
        '429':
          description: Rate limit exceeded
          headers:
            RateLimit-Limit:
              schema:
                type: integer
              description: Request limit per window
            RateLimit-Remaining:
              schema:
                type: integer
              description: Remaining requests
            RateLimit-Reset:
              schema:
                type: integer
              description: Unix timestamp when limit resets
```

---

## Testing Rate Limits

### Manual Testing

```bash
# Test with curl
for i in {1..20}; do
  curl -w "%{http_code}\n" -o /dev/null -s https://your-domain.com/api/endpoint
  sleep 0.1
done

# Expected output: 200 200 200 ... 429 429 429
```

### Load Testing with Apache Bench

```bash
# Send 100 requests with 10 concurrent connections
ab -n 100 -c 10 https://your-domain.com/api/endpoint

# Check for 429 responses
```

### Automated Testing

```javascript
// Jest test
describe('Rate Limiting', () => {
  it('should rate limit after 5 login attempts', async () => {
    const requests = [];

    // Send 6 requests
    for (let i = 0; i < 6; i++) {
      requests.push(
        fetch('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
        })
      );
    }

    const responses = await Promise.all(requests);
    const statuses = responses.map(r => r.status);

    // First 5 should be 401, 6th should be 429
    expect(statuses.filter(s => s === 429).length).toBeGreaterThan(0);
  });
});
```

---

## Example Configurations

### Conservative (High Traffic)

```nginx
# For public-facing APIs
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=3r/m;

server {
    location /api/ {
        limit_req zone=api burst=40 nodelay;
    }

    location /api/auth/login {
        limit_req zone=login burst=1 nodelay;
    }
}
```

### Moderate (Internal Apps)

```nginx
# For internal/authenticated users
limit_req_zone $binary_remote_addr zone=api:10m rate=50r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=10r/m;

server {
    location /api/ {
        limit_req zone=api burst=100 nodelay;
    }

    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
    }
}
```

### Aggressive (Under Attack)

```nginx
# Emergency DDoS mitigation
limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/m;
limit_conn_zone $binary_remote_addr zone=conn:10m;

server {
    limit_conn conn 5;

    location /api/ {
        limit_req zone=api burst=10 nodelay;
    }

    location /api/auth/login {
        limit_req zone=login burst=0 nodelay;
    }
}
```

---

## Quick Reference

### Common Rate Limit Patterns

```nginx
# 10 requests per second
limit_req_zone $binary_remote_addr zone=name:10m rate=10r/s;

# 100 requests per minute
limit_req_zone $binary_remote_addr zone=name:10m rate=100r/m;

# 1000 requests per hour
limit_req_zone $binary_remote_addr zone=name:10m rate=1000r/h;

# Apply with burst
limit_req zone=name burst=20 nodelay;
```

### Testing Commands

```bash
# Check Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Monitor rate limiting
sudo tail -f /var/log/nginx/error.log | grep "limiting"

# Check current limits
sudo nginx -T | grep limit_req
```

---

**Last Updated:** 2025-10-25
**Version:** 1.0
**Maintained By:** Infrastructure Team
