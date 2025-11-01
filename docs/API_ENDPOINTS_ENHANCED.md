# KumoMTA UI API Endpoints - Enhanced Documentation

**Version:** 2.0.0
**Last Updated:** 2025-11-01
**Base URL:** `http://localhost:8000` (configurable via `VITE_API_URL`)

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [Native KumoMTA Endpoints](#native-kumomta-endpoints)
6. [Custom Endpoints (Middleware Required)](#custom-endpoints-middleware-required)
7. [Integration Guide](#integration-guide)
8. [Common Pitfalls](#common-pitfalls)
9. [Testing Guide](#testing-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The KumoMTA UI interacts with two types of API endpoints:

1. **Native KumoMTA API** - Built-in endpoints provided by KumoMTA server
2. **Custom Middleware API** - Additional endpoints requiring middleware implementation

All endpoints follow RESTful conventions and return JSON responses unless otherwise specified.

### API Client Configuration

```typescript
// Default axios configuration
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // CSRF protection
});
```

---

## Authentication

### Authentication Method: HTTP Basic Auth

All API requests require HTTP Basic Authentication. The UI uses base64-encoded credentials.

#### Authentication Flow

```
1. User Login → 2. Create Token → 3. Store Token → 4. Add to Requests
```

#### Creating Auth Token

```typescript
// Client-side token creation
const email = "admin@example.com";
const password = "secure_password";
const token = btoa(`${email}:${password}`); // Base64 encode

// Token format: "YWRtaW5AZXhhbXBsZS5jb206c2VjdXJlX3Bhc3N3b3Jk"
```

#### Adding Token to Requests

```typescript
// Automatic via interceptor
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Basic ${token}`;
  }
  return config;
});
```

#### Manual cURL Example

```bash
# Create token
TOKEN=$(echo -n 'admin@example.com:password' | base64)

# Use in request
curl -H "Authorization: Basic $TOKEN" \
  http://localhost:8000/metrics.json
```

#### Authentication Headers

```http
Authorization: Basic YWRtaW5AZXhhbXBsZS5jb206c2VjdXJlX3Bhc3N3b3Jk
Content-Type: application/json
X-CSRF-Token: <csrf-token> (when available)
```

#### Token Storage

```typescript
// Stored in Zustand with persistence
interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

// Persisted to localStorage as 'kumomta-auth-storage'
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    },
    "timestamp": "2025-11-01T12:00:00Z"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | Process response |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Check request parameters |
| 401 | Unauthorized | Re-authenticate user |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Implement backoff |
| 500 | Internal Server Error | Retry with exponential backoff |
| 503 | Service Unavailable | Server maintenance |

### Error Interceptor

```typescript
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response) {
      const status = error.response.status;

      if (status === 401) {
        // Clear auth and redirect to login
        useAuthStore.getState().logout();
        window.location.href = '/login';
      } else if (status === 403) {
        throw new Error('Access forbidden: Insufficient permissions');
      } else if (status >= 500) {
        throw new Error(`Server error: ${error.response.data?.message}`);
      }
    } else if (error.request) {
      throw new Error('Network error: Unable to connect to server');
    }
    return Promise.reject(error);
  }
);
```

### Common Error Examples

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials or token expired",
    "timestamp": "2025-11-01T12:00:00Z"
  }
}
```

#### 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "domain": "Domain is required",
      "reason": "Reason must be between 1-255 characters"
    }
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": {
      "trace_id": "abc-123-def-456"
    }
  }
}
```

---

## Rate Limiting

### Default Limits

- **Per IP:** 1000 requests/hour
- **Per User:** 5000 requests/hour
- **Burst:** 50 requests/minute

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1635724800
```

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "retry_after": 3600
  }
}
```

### Handling Rate Limits

```typescript
const handleRateLimit = async (error) => {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'] || 60;
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    // Retry request
  }
};
```

---

## Native KumoMTA Endpoints

These endpoints are provided by KumoMTA server and work without middleware.

### 1. Metrics

#### GET /metrics.json

Get Prometheus-format server metrics including connections, queues, delivery stats, and errors.

**Request:**

```bash
curl -H "Authorization: Basic $TOKEN" \
  http://localhost:8000/metrics.json
```

**Response:** (200 OK)

```json
{
  "# HELP": "metric_name description",
  "# TYPE": "metric_name gauge",
  "connection_count{protocol=\"smtp\"}": 45,
  "connection_count{protocol=\"http\"}": 12,
  "queue_size{domain=\"gmail.com\"}": 1234,
  "queue_size{domain=\"yahoo.com\"}": 567,
  "message_rate{type=\"delivered\"}": 1500,
  "message_rate{type=\"bounced\"}": 23,
  "message_rate{type=\"deferred\"}": 89,
  "smtp_error_count{code=\"4xx\"}": 12,
  "smtp_error_count{code=\"5xx\"}": 5
}
```

**TypeScript Usage:**

```typescript
import { apiService } from './services/api';

// Get metrics
const response = await apiService.kumomta.getMetrics();
const metrics = response.data;

// Parse Prometheus format
import { parsePrometheusMetrics } from './utils/prometheusParser';
const parsed = parsePrometheusMetrics(metrics);
```

**Common Use Cases:**
- Real-time dashboard metrics
- Queue depth monitoring
- Performance analysis
- Alert threshold checks

**Error Responses:**

```json
// 401 Unauthorized
{
  "error": "Authentication required"
}

// 503 Service Unavailable
{
  "error": "Metrics collection temporarily unavailable"
}
```

---

### 2. Bounce Management

#### GET /api/admin/bounce/v1

Get bounce classifications and statistics.

**Request:**

```bash
curl -H "Authorization: Basic $TOKEN" \
  http://localhost:8000/api/admin/bounce/v1
```

**Response:** (200 OK)

```json
{
  "bounces": [
    {
      "id": "bounce-001",
      "domain": "example.com",
      "reason": "Mailbox full",
      "code": "552",
      "count": 45,
      "first_seen": "2025-11-01T08:00:00Z",
      "last_seen": "2025-11-01T12:00:00Z"
    }
  ],
  "total": 1,
  "classifications": {
    "hard_bounce": 23,
    "soft_bounce": 22
  }
}
```

**TypeScript Usage:**

```typescript
const response = await apiService.kumomta.getBounces();
const bounces = response.data.bounces;

// Filter hard bounces
const hardBounces = bounces.filter(b =>
  b.code.startsWith('5')
);
```

#### POST /api/admin/bounce/v1

Bounce messages with specified reason.

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "reason": "Policy violation",
    "campaign": "newsletter_2025"
  }' \
  http://localhost:8000/api/admin/bounce/v1
```

**Request Body:**

```typescript
interface BounceRequest {
  domain?: string;      // Target domain
  campaign?: string;    // Campaign identifier
  tenant?: string;      // Tenant identifier
  reason: string;       // Required: Bounce reason
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "bounced_count": 156,
  "domain": "example.com",
  "campaign": "newsletter_2025",
  "timestamp": "2025-11-01T12:30:00Z"
}
```

**TypeScript Usage:**

```typescript
await apiService.kumomta.bounceMessages({
  domain: 'spammer.com',
  reason: 'Spam detected',
  campaign: 'promo_2025'
});
```

**Error Responses:**

```json
// 400 Bad Request
{
  "error": "Reason is required"
}

// 404 Not Found
{
  "error": "No messages found matching criteria"
}
```

#### GET /api/admin/bounce-list/v1

Get scheduled queue details for a domain.

**Request:**

```bash
curl -H "Authorization: Basic $TOKEN" \
  "http://localhost:8000/api/admin/bounce-list/v1?domain=gmail.com"
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| domain | string | No | Filter by domain |

**Response:** (200 OK)

```json
{
  "scheduled_bounces": [
    {
      "id": "msg-12345",
      "domain": "gmail.com",
      "recipient": "user@gmail.com",
      "scheduled_time": "2025-11-01T13:00:00Z",
      "reason": "Temporary failure - will retry",
      "attempts": 3,
      "max_attempts": 5
    }
  ],
  "total": 1
}
```

---

### 3. Queue Management

#### POST /api/admin/suspend/v1

Suspend message delivery for a domain.

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "reason": "Maintenance window",
    "duration": 3600
  }' \
  http://localhost:8000/api/admin/suspend/v1
```

**Request Body:**

```typescript
interface SuspendRequest {
  domain: string;      // Required: Target domain
  reason: string;      // Required: Suspension reason
  duration?: number;   // Optional: Duration in seconds
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "domain": "example.com",
  "reason": "Maintenance window",
  "duration": 3600,
  "suspended_at": "2025-11-01T12:00:00Z",
  "expires_at": "2025-11-01T13:00:00Z",
  "affected_messages": 1234
}
```

**TypeScript Usage:**

```typescript
// Suspend for 1 hour
await apiService.kumomta.suspendQueue(
  'example.com',
  'Scheduled maintenance',
  3600
);

// Suspend indefinitely
await apiService.kumomta.suspendQueue(
  'problem-domain.com',
  'Spam complaints'
);
```

**Common Use Cases:**
- Scheduled maintenance windows
- Temporary recipient issues
- Rate limiting compliance
- Investigation of delivery problems

#### POST /api/admin/resume/v1

Resume suspended queue for a domain.

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com"
  }' \
  http://localhost:8000/api/admin/resume/v1
```

**Request Body:**

```typescript
interface ResumeRequest {
  domain: string;  // Required: Domain to resume
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "domain": "example.com",
  "resumed_at": "2025-11-01T13:00:00Z",
  "queued_messages": 1234
}
```

**TypeScript Usage:**

```typescript
await apiService.kumomta.resumeQueue('example.com');
```

#### POST /api/admin/suspend-ready-q/v1

Suspend ready queue (messages ready for immediate delivery).

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "reason": "Emergency stop"
  }' \
  http://localhost:8000/api/admin/suspend-ready-q/v1
```

**Response:** (200 OK)

```json
{
  "success": true,
  "domain": "example.com",
  "suspended_count": 45,
  "timestamp": "2025-11-01T12:00:00Z"
}
```

**Difference from Regular Suspend:**
- `suspend/v1` - Suspends entire scheduled queue
- `suspend-ready-q/v1` - Only suspends messages in ready state

---

### 4. Message Operations

#### POST /api/admin/rebind/v1

Rebind messages to different routing configuration.

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "campaign": "old_campaign",
    "routing_domain": "new-pool.example.com"
  }' \
  http://localhost:8000/api/admin/rebind/v1
```

**Request Body:**

```typescript
interface RebindRequest {
  campaign?: string;        // Filter by campaign
  tenant?: string;          // Filter by tenant
  domain?: string;          // Filter by domain
  routing_domain?: string;  // New routing domain
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "rebind_count": 5678,
  "from_campaign": "old_campaign",
  "to_routing_domain": "new-pool.example.com",
  "timestamp": "2025-11-01T12:00:00Z"
}
```

**TypeScript Usage:**

```typescript
// Rebind campaign to new IP pool
await apiService.kumomta.rebindMessages({
  campaign: 'promo_2025',
  routing_domain: 'warm-ips.example.com'
});

// Rebind all messages for tenant
await apiService.kumomta.rebindMessages({
  tenant: 'customer-123',
  routing_domain: 'dedicated-pool.example.com'
});
```

**Common Use Cases:**
- IP warmup management
- Campaign routing changes
- Load balancing
- Deliverability optimization

---

### 5. Diagnostics & Logging

#### GET /api/admin/trace-smtp-server/v1

Get SMTP server trace logs for debugging.

**Request:**

```bash
curl -H "Authorization: Basic $TOKEN" \
  http://localhost:8000/api/admin/trace-smtp-server/v1
```

**Response:** (200 OK)

```json
{
  "traces": [
    {
      "timestamp": "2025-11-01T12:00:00.123Z",
      "connection_id": "conn-12345",
      "direction": "incoming",
      "command": "MAIL FROM:<sender@example.com>",
      "response": "250 OK"
    },
    {
      "timestamp": "2025-11-01T12:00:00.456Z",
      "connection_id": "conn-12345",
      "direction": "incoming",
      "command": "RCPT TO:<recipient@gmail.com>",
      "response": "250 OK"
    }
  ],
  "enabled": true,
  "log_level": "trace"
}
```

**TypeScript Usage:**

```typescript
const response = await apiService.kumomta.getTraceLogs();
const traces = response.data.traces;

// Filter by connection
const connTraces = traces.filter(t =>
  t.connection_id === 'conn-12345'
);
```

#### POST /api/admin/set-diagnostic-log-filter/v1

Set diagnostic log filter level.

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": "kumod=trace",
    "duration": 300
  }' \
  http://localhost:8000/api/admin/set-diagnostic-log-filter/v1
```

**Request Body:**

```typescript
interface DiagnosticLogRequest {
  filter: string;      // Log filter expression
  duration?: number;   // Duration in seconds (optional)
}
```

**Filter Examples:**

```
kumod=trace              // Trace all kumod logs
kumod=debug              // Debug level
smtp_server=trace        // SMTP server only
queue_manager=info       // Queue manager info
bounce_classifier=debug  // Bounce classification
```

**Response:** (200 OK)

```json
{
  "success": true,
  "filter": "kumod=trace",
  "duration": 300,
  "expires_at": "2025-11-01T12:05:00Z"
}
```

**TypeScript Usage:**

```typescript
// Enable trace logging for 5 minutes
await apiService.kumomta.setDiagnosticLog(
  'kumod=trace',
  300
);

// Enable permanently (until restart)
await apiService.kumomta.setDiagnosticLog(
  'smtp_server=debug'
);
```

**Warning:** High verbosity logging can impact performance and disk space.

---

## Custom Endpoints (Middleware Required)

These endpoints require middleware implementation as they're not native to KumoMTA.

### Architecture Requirements

```
React UI → Middleware API → KumoMTA Server
             ↓
     [Database, Config Files, kcli wrapper]
```

---

### 1. Queue Operations

#### GET /api/admin/queue/list

List queue items with filtering and pagination.

**Status:** ⚠️ Requires Middleware

**Request:**

```bash
curl -H "Authorization: Basic $TOKEN" \
  "http://localhost:8000/api/admin/queue/list?status=active&limit=50&offset=0"
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status (active, suspended, scheduled) |
| domain | string | No | Filter by domain |
| campaign | string | No | Filter by campaign |
| tenant | string | No | Filter by tenant |
| limit | number | No | Results per page (default: 50) |
| offset | number | No | Pagination offset (default: 0) |
| sortBy | string | No | Sort field (created_at, priority, etc.) |
| sortOrder | string | No | Sort order (asc, desc) |

**Response:** (200 OK)

```json
{
  "items": [
    {
      "id": "queue-001",
      "customer": "Acme Corp",
      "email": "contact@acme.com",
      "domain": "gmail.com",
      "status": "active",
      "priority": "high",
      "messages_count": 1234,
      "created_at": "2025-11-01T08:00:00Z",
      "updated_at": "2025-11-01T12:00:00Z",
      "metadata": {
        "campaign": "newsletter_2025",
        "tenant": "customer-123"
      }
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "has_more": true
}
```

**TypeScript Usage:**

```typescript
import { apiService } from './services/api';
import type { QueueFilter } from './types/queue';

const filters: QueueFilter = {
  status: 'active',
  domain: 'gmail.com',
  limit: 50,
  offset: 0
};

const response = await apiService.queue.getItems(filters);
const items = response.data;
```

**Middleware Implementation Needed:**

```python
# Example: Python/FastAPI middleware
from fastapi import APIRouter, Depends
import subprocess
import json

router = APIRouter()

@router.get("/api/admin/queue/list")
async def list_queue(status: str = None, domain: str = None):
    # Call kcli to get queue data
    cmd = ["kcli", "queue-summary"]
    if domain:
        cmd.extend(["--domain", domain])

    result = subprocess.run(cmd, capture_output=True, text=True)

    # Parse kcli output
    queue_data = parse_kcli_output(result.stdout)

    # Transform to API format
    items = transform_queue_data(queue_data)

    return {
        "items": items,
        "total": len(items)
    }
```

#### PUT /api/admin/queue/{id}/status

Update queue item status.

**Status:** ⚠️ Requires Middleware

**Request:**

```bash
curl -X PUT \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "suspended"
  }' \
  http://localhost:8000/api/admin/queue/queue-001/status
```

**Request Body:**

```typescript
interface StatusUpdate {
  status: 'active' | 'suspended' | 'scheduled';
  reason?: string;
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "id": "queue-001",
  "previous_status": "active",
  "new_status": "suspended",
  "updated_at": "2025-11-01T12:30:00Z"
}
```

**TypeScript Usage:**

```typescript
await apiService.queue.updateStatus('queue-001', 'suspended');
```

#### POST /api/admin/queue/add

Add customer to queue.

**Status:** ⚠️ Requires Middleware

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "New Corp",
    "email": "admin@newcorp.com",
    "domain": "newcorp.com",
    "priority": "medium",
    "metadata": {
      "campaign": "onboarding",
      "source": "api"
    }
  }' \
  http://localhost:8000/api/admin/queue/add
```

**Request Body:**

```typescript
interface AddQueueItem {
  customer: string;
  email: string;
  domain: string;
  priority: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
}
```

**Response:** (201 Created)

```json
{
  "success": true,
  "id": "queue-152",
  "customer": "New Corp",
  "email": "admin@newcorp.com",
  "status": "active",
  "created_at": "2025-11-01T12:30:00Z"
}
```

---

### 2. Configuration Management

All configuration endpoints require middleware to read/write KumoMTA Lua configuration files.

#### GET /api/admin/config/core

Get core configuration settings.

**Status:** ⚠️ Requires Middleware

**Request:**

```bash
curl -H "Authorization: Basic $TOKEN" \
  http://localhost:8000/api/admin/config/core
```

**Response:** (200 OK)

```json
{
  "hostname": "mail.example.com",
  "max_connections": 1000,
  "smtp_port": 25,
  "smtp_tls_port": 587,
  "relay_hosts": ["relay1.example.com", "relay2.example.com"],
  "log_level": "info",
  "enable_dkim": true,
  "enable_spf": true,
  "enable_dmarc": true
}
```

**TypeScript Usage:**

```typescript
const config = await apiService.config.getCore();
console.log(config.data.hostname);
```

#### PUT /api/admin/config/core

Update core configuration.

**Status:** ⚠️ Requires Middleware

**Request:**

```bash
curl -X PUT \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "max_connections": 2000,
    "log_level": "debug"
  }' \
  http://localhost:8000/api/admin/config/core
```

**Request Body:**

```typescript
interface CoreConfig {
  hostname?: string;
  max_connections?: number;
  smtp_port?: number;
  smtp_tls_port?: number;
  relay_hosts?: string[];
  log_level?: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  enable_dkim?: boolean;
  enable_spf?: boolean;
  enable_dmarc?: boolean;
}
```

**Response:** (200 OK)

```json
{
  "success": true,
  "updated_fields": ["max_connections", "log_level"],
  "requires_restart": true,
  "timestamp": "2025-11-01T12:30:00Z"
}
```

**Middleware Implementation:**

```python
@router.put("/api/admin/config/core")
async def update_core_config(config: CoreConfig):
    # Read current Lua config
    with open("/opt/kumomta/etc/config.lua", "r") as f:
        lua_config = f.read()

    # Update configuration
    updated_lua = update_lua_config(lua_config, config)

    # Validate Lua syntax
    if not validate_lua_syntax(updated_lua):
        raise HTTPException(400, "Invalid Lua configuration")

    # Write back
    with open("/opt/kumomta/etc/config.lua", "w") as f:
        f.write(updated_lua)

    # Reload KumoMTA (HUP signal)
    subprocess.run(["systemctl", "reload", "kumomta"])

    return {"success": True, "requires_restart": True}
```

#### GET /api/admin/config/integration

Get integration configuration (webhooks, APIs).

**Status:** ⚠️ Requires Middleware

**Response:** (200 OK)

```json
{
  "webhooks": {
    "delivery_webhook": "https://api.example.com/webhooks/delivery",
    "bounce_webhook": "https://api.example.com/webhooks/bounce"
  },
  "api_keys": {
    "sendgrid_key": "SG.***",
    "mailgun_key": "key-***"
  },
  "integrations": {
    "slack_notifications": true,
    "pagerduty_alerts": false
  }
}
```

#### PUT /api/admin/config/integration

Update integration configuration.

**Request:**

```bash
curl -X PUT \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "webhooks": {
      "delivery_webhook": "https://new-api.example.com/delivery"
    }
  }' \
  http://localhost:8000/api/admin/config/integration
```

#### GET /api/admin/config/performance

Get performance tuning configuration.

**Status:** ⚠️ Requires Middleware

**Response:** (200 OK)

```json
{
  "max_delivery_rate": 10000,
  "connection_pool_size": 100,
  "retry_schedule": [60, 300, 900, 3600],
  "max_retries": 5,
  "queue_strategy": "priority",
  "enable_throttling": true,
  "throttle_rules": {
    "gmail.com": 100,
    "yahoo.com": 50
  }
}
```

#### PUT /api/admin/config/performance

Update performance configuration.

**Request Body:**

```typescript
interface PerformanceConfig {
  max_delivery_rate?: number;
  connection_pool_size?: number;
  retry_schedule?: number[];
  max_retries?: number;
  queue_strategy?: 'fifo' | 'priority' | 'weighted';
  enable_throttling?: boolean;
  throttle_rules?: Record<string, number>;
}
```

---

### 3. Audit Logging

All audit endpoints require PostgreSQL or similar database for storage.

#### POST /api/admin/audit/log

Create audit log entry.

**Status:** ⚠️ Requires Middleware + Database

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "queue_management",
    "action": "suspend_queue",
    "severity": "warning",
    "details": {
      "domain": "example.com",
      "reason": "Maintenance",
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0..."
    },
    "success": true
  }' \
  http://localhost:8000/api/admin/audit/log
```

**Request Body:**

```typescript
interface AuditLogRequest {
  category: AuditEventCategory;
  action: AuditAction;
  severity: 'info' | 'warning' | 'error' | 'critical';
  details: {
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };
  success?: boolean;
  errorMessage?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
}
```

**Response:** (201 Created)

```json
{
  "id": "audit-12345",
  "timestamp": "2025-11-01T12:30:00Z",
  "user": "admin@example.com",
  "category": "queue_management",
  "action": "suspend_queue",
  "severity": "warning",
  "success": true,
  "sessionId": "session_1635724800_abc123"
}
```

**TypeScript Usage:**

```typescript
import { auditService } from './services/auditService';

await auditService.logEvent(
  'queue_management',
  'suspend_queue',
  'warning',
  {
    domain: 'example.com',
    reason: 'Maintenance'
  }
);
```

#### GET /api/admin/audit/logs

Retrieve audit logs with filtering.

**Status:** ⚠️ Requires Middleware + Database

**Request:**

```bash
curl -H "Authorization: Basic $TOKEN" \
  "http://localhost:8000/api/admin/audit/logs?category=queue_management&limit=50&page=1"
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| action | string | Filter by action |
| severity | string | Filter by severity |
| user | string | Filter by user |
| startDate | string | ISO 8601 start date |
| endDate | string | ISO 8601 end date |
| limit | number | Results per page (default: 50) |
| page | number | Page number (default: 1) |
| success | boolean | Filter by success status |

**Response:** (200 OK)

```json
{
  "events": [
    {
      "id": "audit-12345",
      "timestamp": "2025-11-01T12:30:00Z",
      "user": "admin@example.com",
      "category": "queue_management",
      "action": "suspend_queue",
      "severity": "warning",
      "details": {
        "domain": "example.com",
        "reason": "Maintenance",
        "ipAddress": "192.168.1.100"
      },
      "success": true,
      "sessionId": "session_abc123"
    }
  ],
  "total": 1250,
  "page": 1,
  "pageSize": 50
}
```

**TypeScript Usage:**

```typescript
const logs = await auditService.getAuditLogs({
  category: 'queue_management',
  startDate: new Date('2025-11-01'),
  endDate: new Date('2025-11-02'),
  limit: 100
});
```

#### GET /api/admin/audit/stats

Get audit log statistics.

**Status:** ⚠️ Requires Middleware + Database

**Response:** (200 OK)

```json
{
  "total_events": 125000,
  "events_by_category": {
    "queue_management": 45000,
    "configuration": 12000,
    "authentication": 68000
  },
  "events_by_severity": {
    "info": 100000,
    "warning": 20000,
    "error": 4500,
    "critical": 500
  },
  "success_rate": 0.98,
  "top_users": [
    {"user": "admin@example.com", "count": 5000},
    {"user": "operator@example.com", "count": 3000}
  ],
  "time_range": {
    "start": "2025-10-01T00:00:00Z",
    "end": "2025-11-01T23:59:59Z"
  }
}
```

#### POST /api/admin/audit/export

Export audit logs to file.

**Status:** ⚠️ Requires Middleware + Database

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "filters": {
      "startDate": "2025-11-01T00:00:00Z",
      "endDate": "2025-11-01T23:59:59Z"
    },
    "fields": ["timestamp", "user", "action", "details"]
  }' \
  http://localhost:8000/api/admin/audit/export \
  --output audit-export.csv
```

**Request Body:**

```typescript
interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  filters?: AuditLogFilter;
  fields?: string[];
  compress?: boolean;
}
```

**Response:** Binary file (CSV/JSON/XLSX)

**TypeScript Usage:**

```typescript
const blob = await auditService.exportAuditLog({
  format: 'csv',
  filters: {
    startDate: new Date('2025-11-01'),
    endDate: new Date('2025-11-02')
  }
});

await auditService.downloadExport(blob, 'audit-export.csv');
```

#### GET /api/admin/audit/retention-policy

Get audit retention policy.

**Response:** (200 OK)

```json
{
  "retention_days": 90,
  "archive_enabled": true,
  "archive_location": "s3://audit-archives/",
  "auto_delete": true,
  "compression": "gzip"
}
```

#### PUT /api/admin/audit/retention-policy

Update retention policy.

**Request Body:**

```typescript
interface RetentionPolicy {
  retention_days: number;
  archive_enabled: boolean;
  archive_location?: string;
  auto_delete: boolean;
  compression?: 'gzip' | 'bzip2' | 'none';
}
```

#### POST /api/admin/audit/search

Advanced search with query language.

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "action:suspend_queue AND severity:warning",
    "limit": 50
  }' \
  http://localhost:8000/api/admin/audit/search
```

**Query Syntax:**

```
action:suspend_queue           # Exact match
severity:warning OR error      # OR condition
user:admin* AND success:true   # Wildcard + AND
timestamp:[2025-11-01 TO 2025-11-02]  # Range
```

#### GET /api/admin/audit/events/{id}

Get detailed event information.

**Response:** (200 OK)

```json
{
  "id": "audit-12345",
  "timestamp": "2025-11-01T12:30:00Z",
  "user": "admin@example.com",
  "category": "queue_management",
  "action": "suspend_queue",
  "severity": "warning",
  "details": {
    "domain": "example.com",
    "reason": "Maintenance",
    "duration": 3600,
    "affected_messages": 1234,
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "geoLocation": {
      "country": "US",
      "city": "New York"
    }
  },
  "success": true,
  "sessionId": "session_abc123",
  "correlationId": "req-xyz789"
}
```

#### POST /api/admin/audit/bulk-log

Bulk log multiple events (for syncing offline events).

**Request:**

```bash
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [
      {
        "category": "queue_management",
        "action": "suspend_queue",
        "severity": "warning",
        "details": {...}
      },
      {
        "category": "configuration",
        "action": "update_config",
        "severity": "info",
        "details": {...}
      }
    ]
  }' \
  http://localhost:8000/api/admin/audit/bulk-log
```

**Response:** (201 Created)

```json
{
  "success": true,
  "created_count": 2,
  "failed_count": 0,
  "ids": ["audit-12345", "audit-12346"]
}
```

---

## Integration Guide

### Complete Integration Example

#### 1. Setup Authentication

```typescript
// Login and store token
import { useAuthStore } from './store/authStore';

const login = async (email: string, password: string) => {
  const token = btoa(`${email}:${password}`);

  // Test token validity
  try {
    const response = await axios.get('/metrics.json', {
      headers: { Authorization: `Basic ${token}` }
    });

    // Store in Zustand
    useAuthStore.getState().login({
      email,
      name: email.split('@')[0]
    }, token);

    return true;
  } catch (error) {
    throw new Error('Invalid credentials');
  }
};
```

#### 2. Initialize API Client

```typescript
// api.ts
import axios from 'axios';
import { useAuthStore } from './store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth to all requests
api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Basic ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### 3. Create Service Layer

```typescript
// services/queueService.ts
import { api } from './api';

export const queueService = {
  async getMetrics() {
    const response = await api.get('/metrics.json');
    return parsePrometheusMetrics(response.data);
  },

  async suspendQueue(domain: string, reason: string) {
    return api.post('/api/admin/suspend/v1', {
      domain,
      reason
    });
  },

  async resumeQueue(domain: string) {
    return api.post('/api/admin/resume/v1', { domain });
  }
};
```

#### 4. Use in Components

```typescript
// components/QueueManager.tsx
import { useState, useEffect } from 'react';
import { queueService } from '../services/queueService';

export const QueueManager = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await queueService.getMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  const handleSuspend = async (domain: string) => {
    try {
      await queueService.suspendQueue(domain, 'Manual suspension');
      // Refresh metrics
      const data = await queueService.getMetrics();
      setMetrics(data);
    } catch (error) {
      alert('Failed to suspend queue');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Render metrics and controls */}
    </div>
  );
};
```

#### 5. Error Handling Best Practices

```typescript
// utils/errorHandler.ts
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;

    switch (status) {
      case 400:
        return `Invalid request: ${data.error?.message || 'Check parameters'}`;
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access forbidden';
      case 404:
        return 'Resource not found';
      case 429:
        return 'Too many requests - please wait';
      case 500:
        return 'Server error - please try again later';
      default:
        return `Error ${status}: ${data.error?.message || 'Unknown error'}`;
    }
  } else if (error.request) {
    return 'Network error - check your connection';
  } else {
    return `Request error: ${error.message}`;
  }
};

// Usage
try {
  await queueService.suspendQueue(domain, reason);
} catch (error) {
  const message = handleApiError(error);
  toast.error(message);
}
```

#### 6. Retry Logic

```typescript
// utils/retry.ts
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: any;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Usage
const metrics = await retryWithBackoff(() =>
  queueService.getMetrics()
);
```

---

## Common Pitfalls

### 1. Authentication Token Format

**❌ Wrong:**

```typescript
// Bearer token (not supported by KumoMTA)
headers: { Authorization: `Bearer ${token}` }

// Plain credentials
headers: { Authorization: `${email}:${password}` }
```

**✅ Correct:**

```typescript
// HTTP Basic Auth with base64 encoding
const token = btoa(`${email}:${password}`);
headers: { Authorization: `Basic ${token}` }
```

### 2. Metrics Parsing

**❌ Wrong:**

```typescript
// Trying to access as JSON object directly
const queueSize = metrics.queue_size;
```

**✅ Correct:**

```typescript
// Parse Prometheus format first
import { parsePrometheusMetrics } from './utils/prometheusParser';
const parsed = parsePrometheusMetrics(metricsText);
const queueSize = parsed.queue_size?.['gmail.com'] || 0;
```

### 3. Middleware Endpoints

**❌ Wrong:**

```typescript
// Calling custom endpoints without middleware
await api.get('/api/admin/queue/list'); // Will fail - 404
```

**✅ Correct:**

```typescript
// Either implement middleware OR use native alternatives
await api.get('/metrics.json'); // Native - works
// OR implement middleware for /api/admin/queue/list
```

### 4. Error Handling

**❌ Wrong:**

```typescript
// Not handling network errors
try {
  await api.get('/metrics.json');
} catch (error) {
  console.log(error); // Silent failure
}
```

**✅ Correct:**

```typescript
// Comprehensive error handling
try {
  await api.get('/metrics.json');
} catch (error) {
  if (error.response) {
    // Handle HTTP errors
  } else if (error.request) {
    // Handle network errors
  }
  throw error; // Re-throw or handle appropriately
}
```

### 5. Concurrent Requests

**❌ Wrong:**

```typescript
// Sequential requests (slow)
const metrics = await getMetrics();
const bounces = await getBounces();
const logs = await getLogs();
```

**✅ Correct:**

```typescript
// Parallel requests (fast)
const [metrics, bounces, logs] = await Promise.all([
  getMetrics(),
  getBounces(),
  getLogs()
]);
```

### 6. Token Expiration

**❌ Wrong:**

```typescript
// Never refreshing token
localStorage.setItem('token', token); // Stored forever
```

**✅ Correct:**

```typescript
// Handle 401 and re-authenticate
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

## Testing Guide

### Testing with cURL

#### 1. Basic Metrics Test

```bash
#!/bin/bash
# test-api.sh

BASE_URL="http://localhost:8000"
EMAIL="admin@example.com"
PASSWORD="your_password"
TOKEN=$(echo -n "$EMAIL:$PASSWORD" | base64)

echo "Testing /metrics.json..."
curl -s -H "Authorization: Basic $TOKEN" \
  "$BASE_URL/metrics.json" | jq .

echo -e "\nTesting /api/admin/bounce/v1..."
curl -s -H "Authorization: Basic $TOKEN" \
  "$BASE_URL/api/admin/bounce/v1" | jq .
```

#### 2. Queue Suspension Test

```bash
#!/bin/bash
# suspend-queue.sh

TOKEN=$(echo -n 'admin@example.com:password' | base64)

echo "Suspending queue for example.com..."
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "example.com",
    "reason": "Test suspension",
    "duration": 300
  }' \
  http://localhost:8000/api/admin/suspend/v1

echo -e "\n\nResuming queue..."
sleep 5
curl -X POST \
  -H "Authorization: Basic $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}' \
  http://localhost:8000/api/admin/resume/v1
```

#### 3. Complete Test Suite

```bash
#!/bin/bash
# test-all-endpoints.sh

BASE_URL="http://localhost:8000"
TOKEN=$(echo -n 'admin@example.com:password' | base64)

test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3

  echo "Testing $method $endpoint..."

  if [ "$method" = "GET" ]; then
    curl -s -H "Authorization: Basic $TOKEN" \
      "$BASE_URL$endpoint" | jq .
  else
    curl -s -X $method \
      -H "Authorization: Basic $TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data" \
      "$BASE_URL$endpoint" | jq .
  fi

  echo -e "\n---\n"
}

# Test all native endpoints
test_endpoint GET "/metrics.json"
test_endpoint GET "/api/admin/bounce/v1"
test_endpoint GET "/api/admin/bounce-list/v1?domain=gmail.com"
test_endpoint POST "/api/admin/suspend/v1" '{"domain":"test.com","reason":"test"}'
test_endpoint POST "/api/admin/resume/v1" '{"domain":"test.com"}'
test_endpoint GET "/api/admin/trace-smtp-server/v1"
```

### Testing with Postman

#### 1. Environment Setup

```json
{
  "name": "KumoMTA Dev",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:8000",
      "enabled": true
    },
    {
      "key": "email",
      "value": "admin@example.com",
      "enabled": true
    },
    {
      "key": "password",
      "value": "your_password",
      "enabled": true
    }
  ]
}
```

#### 2. Pre-request Script

```javascript
// Auto-generate Basic Auth token
const email = pm.environment.get("email");
const password = pm.environment.get("password");
const token = btoa(`${email}:${password}`);

pm.environment.set("auth_token", token);
```

#### 3. Authorization Header

```
Authorization: Basic {{auth_token}}
```

### Automated Testing

#### Jest Test Example

```typescript
// __tests__/api/queueService.test.ts
import { queueService } from '../../services/queueService';
import { useAuthStore } from '../../store/authStore';

describe('Queue Service', () => {
  beforeAll(() => {
    // Setup auth
    const token = btoa('test@example.com:password');
    useAuthStore.setState({ token });
  });

  it('should fetch metrics', async () => {
    const metrics = await queueService.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.connection_count).toBeGreaterThan(0);
  });

  it('should suspend queue', async () => {
    const result = await queueService.suspendQueue(
      'test.com',
      'Test suspension'
    );
    expect(result.data.success).toBe(true);
  });

  it('should handle errors', async () => {
    await expect(
      queueService.suspendQueue('', '')
    ).rejects.toThrow();
  });
});
```

#### Integration Test

```typescript
// __tests__/integration/workflow.test.ts
describe('Queue Management Workflow', () => {
  it('should complete suspend-resume cycle', async () => {
    const domain = 'workflow-test.com';

    // 1. Suspend queue
    const suspend = await queueService.suspendQueue(
      domain,
      'Integration test'
    );
    expect(suspend.data.success).toBe(true);

    // 2. Verify suspension in metrics
    const metrics = await queueService.getMetrics();
    expect(metrics.suspended_domains).toContain(domain);

    // 3. Resume queue
    const resume = await queueService.resumeQueue(domain);
    expect(resume.data.success).toBe(true);

    // 4. Verify resumption
    const updatedMetrics = await queueService.getMetrics();
    expect(updatedMetrics.suspended_domains).not.toContain(domain);
  });
});
```

---

## Troubleshooting

### Issue: 401 Unauthorized

**Symptoms:**
```json
{
  "error": "Authentication required"
}
```

**Solutions:**

1. **Check token format:**
   ```typescript
   // Must be base64 encoded
   const token = btoa(`${email}:${password}`);
   console.log(token); // Should be alphanumeric string
   ```

2. **Verify credentials:**
   ```bash
   # Test manually
   echo -n 'your_email:your_password' | base64
   ```

3. **Check header:**
   ```typescript
   // Should be "Basic" not "Bearer"
   headers: { Authorization: `Basic ${token}` }
   ```

4. **Clear storage:**
   ```typescript
   localStorage.clear();
   sessionStorage.clear();
   // Re-login
   ```

### Issue: Network Error / CORS

**Symptoms:**
```
Network error: Unable to connect to server
```

**Solutions:**

1. **Check server is running:**
   ```bash
   curl http://localhost:8000/metrics.json
   ```

2. **Verify VITE_API_URL:**
   ```bash
   # .env
   VITE_API_URL=http://localhost:8000
   ```

3. **Enable CORS on server:**
   ```python
   # FastAPI example
   from fastapi.middleware.cors import CORSMiddleware

   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Issue: 404 Not Found

**Symptoms:**
```json
{
  "error": "Resource not found"
}
```

**Solutions:**

1. **Check if endpoint requires middleware:**
   - Native KumoMTA: ✅ Works immediately
   - Custom endpoint: ⚠️ Needs middleware

2. **Verify endpoint path:**
   ```typescript
   // Correct
   '/api/admin/suspend/v1'

   // Wrong
   '/api/suspend/v1'
   ```

3. **Check API version:**
   ```bash
   # Some endpoints use /v1 suffix
   /api/admin/bounce/v1  # Correct
   /api/admin/bounce     # Wrong
   ```

### Issue: Request Timeout

**Symptoms:**
```
Error: timeout of 10000ms exceeded
```

**Solutions:**

1. **Increase timeout:**
   ```typescript
   const api = axios.create({
     timeout: 30000 // 30 seconds
   });
   ```

2. **Check server performance:**
   ```bash
   # Monitor server load
   top
   # Check KumoMTA status
   systemctl status kumomta
   ```

3. **Implement retry logic:**
   ```typescript
   await retryWithBackoff(() => api.get('/metrics.json'));
   ```

### Issue: Invalid Metrics Format

**Symptoms:**
```
Cannot read property of undefined
```

**Solutions:**

1. **Use parser:**
   ```typescript
   import { parsePrometheusMetrics } from './utils/prometheusParser';
   const parsed = parsePrometheusMetrics(response.data);
   ```

2. **Handle missing metrics:**
   ```typescript
   const queueSize = parsed.queue_size?.['gmail.com'] || 0;
   ```

3. **Check response format:**
   ```bash
   curl http://localhost:8000/metrics.json | head -20
   ```

### Issue: Middleware Not Implemented

**Symptoms:**
```json
{
  "error": "Not implemented"
}
```

**Solutions:**

1. **Identify custom endpoints:**
   - See "Custom Endpoints" section
   - These require middleware

2. **Use alternatives:**
   ```bash
   # Instead of /api/admin/queue/list (custom)
   # Use native /metrics.json + kcli
   kcli queue-summary
   ```

3. **Implement middleware:**
   - See "Middleware Architecture" section
   - Example implementations provided

### Debug Logging

```typescript
// Enable debug logging
api.interceptors.request.use(config => {
  console.log('Request:', {
    method: config.method,
    url: config.url,
    headers: config.headers,
    data: config.data
  });
  return config;
});

api.interceptors.response.use(
  response => {
    console.log('Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('Error:', {
      message: error.message,
      response: error.response?.data,
      config: error.config
    });
    return Promise.reject(error);
  }
);
```

---

## API Reference Summary

### Quick Reference Table

| Endpoint | Method | Auth | Status | Purpose |
|----------|--------|------|--------|---------|
| `/metrics.json` | GET | ✅ | Native | Server metrics |
| `/api/admin/bounce/v1` | GET | ✅ | Native | List bounces |
| `/api/admin/bounce/v1` | POST | ✅ | Native | Bounce messages |
| `/api/admin/bounce-list/v1` | GET | ✅ | Native | Scheduled bounces |
| `/api/admin/suspend/v1` | POST | ✅ | Native | Suspend queue |
| `/api/admin/resume/v1` | POST | ✅ | Native | Resume queue |
| `/api/admin/suspend-ready-q/v1` | POST | ✅ | Native | Suspend ready queue |
| `/api/admin/rebind/v1` | POST | ✅ | Native | Rebind messages |
| `/api/admin/trace-smtp-server/v1` | GET | ✅ | Native | SMTP traces |
| `/api/admin/set-diagnostic-log-filter/v1` | POST | ✅ | Native | Set log filter |
| `/api/admin/queue/list` | GET | ✅ | Middleware | List queue |
| `/api/admin/queue/{id}/status` | PUT | ✅ | Middleware | Update status |
| `/api/admin/queue/add` | POST | ✅ | Middleware | Add to queue |
| `/api/admin/config/core` | GET/PUT | ✅ | Middleware | Core config |
| `/api/admin/config/integration` | GET/PUT | ✅ | Middleware | Integration config |
| `/api/admin/config/performance` | GET/PUT | ✅ | Middleware | Performance config |
| `/api/admin/audit/log` | POST | ✅ | Middleware | Log audit event |
| `/api/admin/audit/logs` | GET | ✅ | Middleware | Get audit logs |
| `/api/admin/audit/stats` | GET | ✅ | Middleware | Audit statistics |
| `/api/admin/audit/export` | POST | ✅ | Middleware | Export logs |

---

## Additional Resources

### Documentation
- [KumoMTA Official Docs](https://docs.kumomta.com/)
- [kcli Reference](https://docs.kumomta.com/reference/kcli/)
- [HTTP API Reference](https://docs.kumomta.com/reference/http/)
- [Prometheus Metrics Guide](https://prometheus.io/docs/concepts/data_model/)

### Code Examples
- Implementation: `/src/services/api.ts`
- Audit Service: `/src/services/auditService.ts`
- Metrics Parser: `/src/utils/prometheusParser.ts`
- Auth Store: `/src/store/authStore.ts`

### Support
- GitHub Issues: [KumoMTA UI Issues](https://github.com/kumomta/kumomta-ui/issues)
- Community: [KumoMTA Discussions](https://github.com/kumomta/kumomta/discussions)

---

**Document Version:** 2.0.0
**Last Updated:** 2025-11-01
**Maintained By:** KumoMTA UI Team
