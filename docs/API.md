# KumoMTA UI - API Documentation

## Overview

The KumoMTA UI communicates with the KumoMTA server through a REST API. All endpoints use JSON for request and response payloads.

## Base Configuration

```typescript
// API Configuration
baseURL: process.env.VITE_API_URL || 'http://localhost:3000'
timeout: 10000ms
```

## Authentication

All API requests require Bearer token authentication:

```typescript
headers: {
  'Authorization': 'Bearer <token>'
}
```

Tokens are managed through the auth utility (`src/utils/auth.ts`) and automatically attached via axios interceptors.

## API Endpoints

### Queue Management

#### Get Queue Items

```http
GET /queue
```

**Query Parameters:**
- `serviceType` (optional): Filter by service type
- `status` (optional): Filter by status (waiting | in-progress | completed | cancelled)
- `searchQuery` (optional): Search by customer name, email, or phone
- `dateRange.start` (optional): Start date filter (ISO 8601)
- `dateRange.end` (optional): End date filter (ISO 8601)

**Response:**
```json
[
  {
    "id": "string",
    "customerId": "string",
    "customerName": "string",
    "customerEmail": "string",
    "customerPhone": "string",
    "serviceType": "string",
    "priority": 1,
    "status": "waiting",
    "notes": "string",
    "estimatedWaitTime": 15,
    "actualWaitTime": 12,
    "createdAt": "2025-01-19T10:00:00Z",
    "updatedAt": "2025-01-19T10:12:00Z",
    "notificationsSent": [
      {
        "id": "string",
        "type": "email",
        "status": "sent",
        "timestamp": "2025-01-19T10:05:00Z"
      }
    ]
  }
]
```

#### Update Queue Item Status

```http
PUT /queue/:id/status
```

**Path Parameters:**
- `id`: Queue item ID

**Request Body:**
```json
{
  "status": "in-progress"
}
```

**Response:**
```json
{
  "id": "string",
  "status": "in-progress",
  "updatedAt": "2025-01-19T10:15:00Z"
}
```

#### Add Customer to Queue

```http
POST /queue
```

**Request Body:**
```json
{
  "customerId": "string",
  "customerName": "string",
  "customerEmail": "string",
  "customerPhone": "string",
  "serviceType": "string",
  "priority": 1,
  "notes": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "customerId": "string",
  "customerName": "string",
  "customerEmail": "string",
  "customerPhone": "string",
  "serviceType": "string",
  "priority": 1,
  "status": "waiting",
  "notes": "string",
  "estimatedWaitTime": 15,
  "createdAt": "2025-01-19T10:00:00Z",
  "updatedAt": "2025-01-19T10:00:00Z",
  "notificationsSent": []
}
```

#### Get Queue Metrics

```http
GET /queue/metrics
```

**Response:**
```json
{
  "totalWaiting": 5,
  "averageWaitTime": 12.5,
  "longestWaitTime": 25,
  "serviceUtilization": 0.85,
  "customersServedToday": 42
}
```

### Configuration Management

#### Update Core Configuration

```http
PUT /config/core
```

**Request Body:**
```json
{
  "serverName": "string",
  "maxConcurrentConnections": 1000,
  "defaultPort": 25,
  "ipv6Enabled": true,
  "dnsResolvers": ["8.8.8.8", "1.1.1.1"],
  "logLevel": "info",
  "maxMessageSize": 10485760,
  "queueRetryInterval": 300
}
```

**Response:**
```json
{
  "success": true,
  "message": "Core configuration updated successfully"
}
```

#### Update Integration Configuration

```http
PUT /config/integration
```

**Request Body:**
```json
{
  "apiEndpoint": "https://api.example.com",
  "apiVersion": "v1",
  "apiKey": "string",
  "webhookUrl": "https://webhook.example.com",
  "syncInterval": 300,
  "backupEnabled": true,
  "backupInterval": 86400,
  "backupLocation": "/var/backups/kumomta",
  "failoverEndpoint": "https://failover.example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Integration configuration updated successfully"
}
```

#### Update Performance Configuration

```http
PUT /config/performance
```

**Request Body:**
```json
{
  "cacheEnabled": true,
  "cacheSize": 512,
  "cacheExpiration": 3600,
  "loadBalancingStrategy": "round-robin",
  "maxMemoryUsage": 4096,
  "maxCpuUsage": 80,
  "connectionTimeout": 30,
  "readTimeout": 60,
  "writeTimeout": 60,
  "queueWorkers": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Performance configuration updated successfully"
}
```

## Error Handling

All API errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| AUTH_REQUIRED | 401 | Authentication token missing or invalid |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Request validation failed |
| SERVER_ERROR | 500 | Internal server error |
| QUEUE_FULL | 503 | Queue capacity exceeded |

## Rate Limiting

API requests are rate-limited to prevent abuse:

- **Limit**: 100 requests per minute per IP
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

## Usage Example

```typescript
import { apiService } from './services/api';

// Get queue items with filters
const filters = {
  status: 'waiting',
  serviceType: 'premium'
};

try {
  const response = await apiService.queue.getItems(filters);
  console.log('Queue items:', response.data);
} catch (error) {
  console.error('Error fetching queue:', error);
}

// Update queue item status
try {
  await apiService.queue.updateStatus('item-123', 'in-progress');
  console.log('Status updated successfully');
} catch (error) {
  console.error('Error updating status:', error);
}

// Update configuration
const coreConfig = {
  serverName: 'mail.example.com',
  maxConcurrentConnections: 2000,
  defaultPort: 25,
  ipv6Enabled: true,
  dnsResolvers: ['8.8.8.8'],
  logLevel: 'info',
  maxMessageSize: 10485760,
  queueRetryInterval: 300
};

try {
  await apiService.config.updateCore(coreConfig);
  console.log('Configuration updated successfully');
} catch (error) {
  console.error('Error updating configuration:', error);
}
```

## WebSocket Support (Future)

Real-time updates will be supported via WebSocket connections:

```typescript
// Future implementation
const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('queue:update', (data) => {
  console.log('Queue updated:', data);
});

ws.on('metrics:update', (data) => {
  console.log('Metrics updated:', data);
});
```
