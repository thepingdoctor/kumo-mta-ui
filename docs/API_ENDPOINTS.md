# KumoMTA UI API Endpoints Documentation

## Overview

This document categorizes all API endpoints used by the KumoMTA UI, distinguishing between native KumoMTA endpoints and custom endpoints that require middleware implementation.

Last Updated: 2025-11-01 (Phase 1 Critical Fixes)

---

## ✅ Native KumoMTA API Endpoints (Verified)

These endpoints are provided natively by KumoMTA and work without middleware:

### Metrics
- `GET /metrics.json` - Prometheus-format metrics (primary monitoring endpoint)

### Bounce Management
- `GET /api/admin/bounce/v1` - Get bounce classifications
- `POST /api/admin/bounce/v1` - Bounce messages with reason
- `GET /api/admin/bounce-list/v1` - Get scheduled queue details for domain

### Queue Management
- `POST /api/admin/suspend/v1` - Suspend queue for domain
- `POST /api/admin/resume/v1` - Resume suspended queue
- `POST /api/admin/suspend-ready-q/v1` - Suspend ready queue

### Message Operations
- `POST /api/admin/rebind/v1` - Rebind messages to different routing

### Diagnostics & Logging
- `GET /api/admin/trace-smtp-server/v1` - Get SMTP server trace logs
- `POST /api/admin/set-diagnostic-log-filter/v1` - Set diagnostic log filter

---

## ⚠️ Custom Endpoints (Require Middleware)

These endpoints are custom to our UI and require middleware API layer implementation:

### Queue Operations
- `GET /api/admin/queue/list` - List queue items with filtering
- `PUT /api/admin/queue/{id}/status` - Update queue item status
- `POST /api/admin/queue/add` - Add customer to queue

**Middleware Required**:
- Implement queue management layer
- Parse KumoMTA internal queue data
- Transform to UI-friendly format

### Configuration Management
- `GET /api/admin/config/core` - Get core configuration
- `PUT /api/admin/config/core` - Update core configuration
- `GET /api/admin/config/integration` - Get integration config
- `PUT /api/admin/config/integration` - Update integration config
- `GET /api/admin/config/performance` - Get performance config
- `PUT /api/admin/config/performance` - Update performance config

**Middleware Required**:
- Parse KumoMTA Lua configuration files
- Transform to JSON for UI consumption
- Validate and apply configuration changes

### Audit Logging
- `POST /api/admin/audit/log` - Create audit log entry
- `GET /api/admin/audit/logs` - Retrieve audit logs with filtering
- `GET /api/admin/audit/stats` - Get audit log statistics
- `POST /api/admin/audit/export` - Export audit logs
- `GET /api/admin/audit/retention-policy` - Get retention policy
- `PUT /api/admin/audit/retention-policy` - Update retention policy
- `POST /api/admin/audit/search` - Search audit logs
- `GET /api/admin/audit/events/{id}` - Get event details
- `POST /api/admin/audit/bulk-log` - Bulk log events

**Middleware Required**:
- Implement PostgreSQL/database for audit storage
- Create audit logging service
- Implement export functionality

---

## 🔐 Authentication

All endpoints use **HTTP Basic Authentication**:

```
Authorization: Basic {base64(username:password)}
```

Token is created during login:
```typescript
const token = btoa(`${email}:${password}`);
```

### Authentication Flow
1. User submits credentials via LoginPage
2. Token created using base64 encoding: `btoa(email:password)`
3. Token stored in Zustand auth store (persisted to localStorage)
4. Token added to all API requests via axios interceptors

### Verified Authentication Handlers
- `src/services/api.ts` - ✅ Correct (uses Zustand, Basic Auth)
- `src/utils/apiClient.ts` - ✅ FIXED (now uses Zustand, Basic Auth)
- `src/services/auditService.ts` - ✅ FIXED (now uses Zustand, Basic Auth)

---

## 📊 Metrics Endpoint Details

KumoMTA's `/metrics.json` returns Prometheus-format metrics including:

- Connection metrics (SMTP, HTTP)
- Queue depths and rates
- Message delivery statistics
- Error rates and types
- Performance metrics

**Parser**: Implemented in `src/utils/prometheusParser.ts`

---

## 🚀 Missing Native Endpoints

These endpoints would be useful but don't exist in native KumoMTA:

1. `GET /api/admin/queue-summary/v1` - Structured queue overview
2. `GET /api/admin/provider-summary/v1` - Provider statistics
3. `POST /api/admin/suspend-cancel/v1` - Cancel suspension
4. `GET /api/admin/message-details/v1` - Message inspection
5. `GET /api/admin/config/v1` - Configuration retrieval
6. `POST /api/admin/config/v1` - Configuration updates

**Workaround**: Use `kcli` command-line tool via subprocess and parse output

---

## 📝 CLI Integration (kcli)

For features not available via REST API, integrate with kcli:

### Queue Management
```bash
kcli queue-summary
kcli queue-summary --domain example.com
kcli suspend --domain example.com --reason "maintenance"
kcli suspend-cancel --id <suspension-id>
```

### Message Operations
```bash
kcli rebind --campaign old --routing_domain new.example.com
kcli bounce --domain example.com --reason "policy"
kcli top-domains
```

### Diagnostics
```bash
kcli log-filter --filter "kumod=trace"
kcli trace-smtp-server --enable
```

---

## 🔄 Middleware Architecture

Recommended middleware stack:

```
React UI → API Gateway (Express/FastAPI) → KumoMTA
                ↓
        [Audit DB, Config Service, kcli Wrapper]
```

### Components to Build

1. **API Gateway** (Express/FastAPI)
   - Route custom endpoints
   - Proxy native KumoMTA endpoints
   - Handle authentication
   - CORS configuration

2. **Queue Management Service**
   - Parse kcli output
   - Transform to JSON
   - Implement queue operations

3. **Configuration Service**
   - Read/write Lua config files
   - Validate configuration
   - Apply changes safely

4. **Audit Service**
   - PostgreSQL database
   - CRUD operations
   - Export functionality
   - Retention policies

5. **kcli Wrapper**
   - Execute kcli commands
   - Parse text output
   - Error handling
   - Command queueing

---

## 🧪 Testing Endpoints

Test verified endpoints:

```bash
# Get metrics
curl -H "Authorization: Basic $(echo -n 'user:pass' | base64)" \
  http://localhost:8000/metrics.json

# Suspend queue
curl -X POST -H "Authorization: Basic $(echo -n 'user:pass' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"domain":"example.com","reason":"test"}' \
  http://localhost:8000/api/admin/suspend/v1

# Get bounces
curl -H "Authorization: Basic $(echo -n 'user:pass' | base64)" \
  http://localhost:8000/api/admin/bounce/v1
```

---

## 📚 References

- KumoMTA Documentation: https://docs.kumomta.com/
- kcli Reference: https://docs.kumomta.com/reference/kcli/
- API Reference: https://docs.kumomta.com/reference/http/

---

**Status**: Phase 1 Complete ✅
- Authentication standardized to HTTP Basic Auth
- Token storage unified to Zustand
- Endpoints documented and categorized
- Middleware requirements identified
