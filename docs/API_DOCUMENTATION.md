# KumoMTA UI - API Documentation

## Overview

This document provides comprehensive documentation for the KumoMTA UI Dashboard API integration.

**Base URL**: `http://localhost:8000` (configurable via `VITE_API_URL`)
**Authentication**: HTTP Basic Auth
**Format**: JSON
**Content-Type**: `application/json`

---

## Authentication

### HTTP Basic Auth

The KumoMTA UI uses HTTP Basic Authentication compatible with KumoMTA servers.

**Header Format**:
```
Authorization: Basic <base64(username:password)>
```

**Example**:
```javascript
const credentials = btoa(`${username}:${password}`);
headers: {
  'Authorization': `Basic ${credentials}`
}
```

### CSRF Protection

CSRF tokens are automatically included when available:

```javascript
headers: {
  'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
}
```

---

## Endpoints

### 1. Metrics

#### GET `/metrics.json`

Get KumoMTA metrics in Prometheus JSON format.

**Authentication**: Trusted IP only (HTTP auth prohibited by KumoMTA)

**Response**:
```json
{
  "kumomta_messages_sent_total": { "value": 12450 },
  "kumomta_bounce_total": { "value": 125 },
  "kumomta_delayed_total": { "value": 45 },
  "kumomta_throughput": { "value": 350 },
  "kumomta_active_connections": { "value": 28 }
}
```

**UI Mapping**:
- `messages_sent` → `kumomta_messages_sent_total.value`
- `bounces` → `kumomta_bounce_total.value`
- `delayed` → `kumomta_delayed_total.value`
- `throughput` → `kumomta_throughput.value`
- `active_connections` → `kumomta_active_connections.value`

---

### 2. Queue Management

#### POST `/api/admin/suspend/v1`

Suspend message delivery for a domain.

**Request**:
```json
{
  "domain": "example.com",
  "reason": "Temporary maintenance",
  "duration": 3600
}
```

**Parameters**:
- `domain` (string, required): Domain to suspend
- `reason` (string, required): Reason for suspension
- `duration` (number, optional): Duration in seconds (default: 300)

**Response**:
```json
{
  "id": "uuid-here",
  "success": true
}
```

---

#### POST `/api/admin/suspend-ready-q/v1`

Suspend the ready queue for a domain.

**Request**:
```json
{
  "domain": "example.com",
  "reason": "Rate limiting"
}
```

**Response**:
```json
{
  "success": true,
  "domain": "example.com"
}
```

---

#### POST `/api/admin/resume/v1`

Resume message delivery for a suspended domain.

**Request**:
```json
{
  "domain": "example.com"
}
```

**Response**:
```json
{
  "success": true,
  "domain": "example.com"
}
```

---

#### POST `/api/admin/rebind/v1`

Move messages between queues.

**Request**:
```json
{
  "campaign": "newsletter",
  "tenant": "customer1",
  "domain": "example.com",
  "routing_domain": "smtp.example.com"
}
```

**Parameters** (all optional, but at least one required):
- `campaign` (string): Campaign identifier
- `tenant` (string): Tenant identifier
- `domain` (string): Destination domain
- `routing_domain` (string): Routing domain (v2023.08.22+)

**Response**:
```json
{
  "success": true,
  "rebounded": 150
}
```

---

### 3. Bounce Management

#### POST `/api/admin/bounce/v1`

Bounce messages matching criteria.

**Request**:
```json
{
  "domain": "example.com",
  "campaign": "newsletter",
  "tenant": "customer1",
  "reason": "550 Mailbox not found",
  "duration": "5m"
}
```

**Parameters** (all optional):
- `domain` (string): Domain filter
- `campaign` (string): Campaign filter
- `tenant` (string): Tenant filter
- `routing_domain` (string): Routing domain filter
- `reason` (string, required): Bounce reason
- `duration` (string, optional): Directive duration (e.g., "5m", "1h")

**⚠️ WARNING**: Omitting ALL filters bounces ALL queued messages!

**Response**:
```json
{
  "success": true,
  "bounced": 75
}
```

---

#### GET `/api/admin/bounce/v1`

Get bounce classifications.

**Response**:
```json
{
  "hard_bounces": 85,
  "soft_bounces": 40,
  "classifications": [
    {
      "code": "5.1.1",
      "count": 45,
      "description": "Bad destination mailbox address"
    },
    {
      "code": "5.7.1",
      "count": 25,
      "description": "Delivery not authorized"
    }
  ]
}
```

---

#### GET `/api/admin/bounce-list/v1`

Get scheduled queue details.

**Query Parameters**:
- `domain` (string, optional): Filter by domain

**Response**:
```json
{
  "domains": [
    {
      "domain": "example.com",
      "scheduled": 125,
      "ready": 45
    },
    {
      "domain": "test.com",
      "scheduled": 89,
      "ready": 23
    }
  ]
}
```

---

### 4. Diagnostic Logging

#### POST `/api/admin/set-diagnostic-log-filter/v1`

Set diagnostic log filter.

**Request**:
```json
{
  "filter": "kumo=trace",
  "duration": 300
}
```

**Parameters**:
- `filter` (string, required): Log filter expression
- `duration` (number, optional): Duration in seconds

**Response**:
```json
{
  "success": true,
  "filter": "kumo=trace",
  "duration": 300
}
```

---

### 5. Trace Logs

#### GET `/api/admin/trace-smtp-server/v1`

Get SMTP server trace logs.

**Response**:
```json
{
  "logs": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "level": "INFO",
      "message": "SMTP connection established"
    },
    {
      "timestamp": "2024-01-01T12:01:00Z",
      "level": "DEBUG",
      "message": "Message received"
    }
  ]
}
```

---

### 6. Configuration

#### GET `/api/admin/config/core`

Get core configuration.

**Response**:
```json
{
  "maxConcurrentDeliveries": 1000,
  "messageRetention": 7,
  "defaultDomain": "example.com"
}
```

---

#### PUT `/api/admin/config/core`

Update core configuration.

**Request**:
```json
{
  "maxConcurrentDeliveries": 1000,
  "messageRetention": 7,
  "defaultDomain": "example.com"
}
```

**Response**:
```json
{
  "success": true,
  "config": { ... }
}
```

---

#### GET `/api/admin/config/integration`

Get integration configuration.

**Response**:
```json
{
  "webhookUrl": "https://example.com/webhook",
  "apiKey": "your-api-key"
}
```

---

#### PUT `/api/admin/config/integration`

Update integration configuration.

**Request**:
```json
{
  "webhookUrl": "https://example.com/webhook",
  "apiKey": "your-api-key"
}
```

**Response**:
```json
{
  "success": true,
  "config": { ... }
}
```

---

#### GET `/api/admin/config/performance`

Get performance configuration.

**Response**:
```json
{
  "connectionPoolSize": 100,
  "maxRetries": 3
}
```

---

#### PUT `/api/admin/config/performance`

Update performance configuration.

**Request**:
```json
{
  "connectionPoolSize": 100,
  "maxRetries": 3
}
```

**Response**:
```json
{
  "success": true,
  "config": { ... }
}
```

---

### 7. Queue Items

#### GET `/api/admin/queue/list`

Get queue items with filters.

**Query Parameters**:
- `searchQuery` (string, optional): Search term
- `status` (string, optional): Filter by status
- `serviceType` (string, optional): Filter by service type

**Response**:
```json
[
  {
    "id": "1",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "recipient": "recipient@example.com",
    "sender": "sender@example.com",
    "status": "waiting",
    "serviceType": "transactional",
    "createdAt": "2024-01-01T12:00:00Z"
  }
]
```

---

#### PUT `/api/admin/queue/:id/status`

Update queue item status.

**Request**:
```json
{
  "status": "completed"
}
```

**Response**:
```json
{
  "success": true,
  "item": { ... }
}
```

---

#### GET `/api/admin/metrics/queue`

Get queue metrics.

**Response**:
```json
{
  "totalWaiting": 234,
  "totalProcessing": 15,
  "totalCompleted": 10239
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Domain is required",
    "details": { ... }
  }
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Burst**: Up to 200 requests
- **Headers**:
  - `X-RateLimit-Limit`: Requests allowed per period
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets

---

## WebSocket API

### Connection

**URL**: `ws://localhost:8000/ws/metrics`

**Authentication**: Send auth token in first message

**Message Format**:
```json
{
  "type": "subscribe",
  "channel": "metrics",
  "data": {}
}
```

### Channels

- `metrics`: Real-time metrics updates
- `queue`: Queue status changes
- `logs`: Live log streaming

---

## Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Authorization': `Basic ${btoa('username:password')}`,
    'Content-Type': 'application/json'
  }
});

// Get metrics
const metrics = await api.get('/metrics.json');

// Suspend domain
await api.post('/api/admin/suspend/v1', {
  domain: 'example.com',
  reason: 'Maintenance',
  duration: 3600
});
```

### cURL

```bash
# Get metrics
curl -X GET http://localhost:8000/metrics.json

# Suspend domain
curl -X POST http://localhost:8000/api/admin/suspend/v1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $(echo -n 'username:password' | base64)" \
  -d '{"domain":"example.com","reason":"Maintenance","duration":3600}'
```

---

## Support

For issues or questions:
- KumoMTA Docs: https://docs.kumomta.com/
- GitHub Issues: https://github.com/KumoCorp/kumomta/issues

---

**Last Updated**: 2025-10-24
**Version**: 1.0.0
