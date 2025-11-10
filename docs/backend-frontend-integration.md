# Backend-Frontend Integration Guide

**For Frontend Developer** 📱 → 🔌 **From Backend Developer**

## 🎯 Backend is Ready!

The backend server is fully implemented and ready for frontend integration.

## 🔌 Connection Details

### WebSocket Server
- **URL:** `ws://localhost:3001`
- **Protocol:** Socket.io
- **Authentication:** JWT token required

### HTTP API
- **Base URL:** `http://localhost:3001`
- **CORS:** Configured for `http://localhost:5173`

## 🔐 Authentication

### Getting a JWT Token

For development/testing, you can generate a test token:

```typescript
// Backend provides generateToken utility
import { generateToken } from './server/src/websocket/authentication.js';

const token = generateToken('user-123', 'testuser', ['admin']);
```

For production, integrate with your auth service and include token in WebSocket connection:

```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001', {
  auth: {
    token: yourJwtToken
  }
});
```

## 📡 Real-Time WebSocket Events

### Step 1: Connect to WebSocket

```typescript
import { io, Socket } from 'socket.io-client';

let socket: Socket;

function connectWebSocket(token: string) {
  socket = io('ws://localhost:3001', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  return socket;
}
```

### Step 2: Subscribe to Events

```typescript
// Subscribe to queue updates
socket.emit('subscribe:queues');

// Subscribe to metrics
socket.emit('subscribe:metrics');

// Subscribe to message status
socket.emit('subscribe:messages');
```

### Step 3: Listen for Updates

```typescript
// Queue updates (every 5 seconds)
socket.on('queue:update', (data) => {
  /*
  data = {
    queueName: string;
    size: number;
    ready: number;
    scheduled: number;
    timestamp: number;
  }
  */
  updateQueueDisplay(data);
});

// Metrics updates (every 5 seconds)
socket.on('metrics:update', (data) => {
  /*
  data = {
    delivered: number;
    bounced: number;
    deferred: number;
    throughput: number;  // messages per second
    timestamp: number;
  }
  */
  updateMetricsDisplay(data);
});

// Message status updates
socket.on('message:status', (data) => {
  /*
  data = {
    messageId: string;
    status: 'queued' | 'delivered' | 'bounced' | 'deferred' | 'failed';
    queue: string;
    timestamp: number;
    details?: string;
  }
  */
  updateMessageStatus(data);
});

// Connection status
socket.on('connection:status', (status) => {
  /*
  status = {
    connected: boolean;
    kumoMtaStatus: 'healthy' | 'degraded' | 'down';
    timestamp: number;
  }
  */
  updateConnectionIndicator(status);
});

// Alert notifications
socket.on('alert:triggered', (alert) => {
  /*
  alert = {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    value: number;
    threshold: number;
    timestamp: number;
    acknowledged: boolean;
  }
  */
  showAlertNotification(alert);
});
```

### Step 4: Heartbeat (Optional)

```typescript
// Send heartbeat every 30 seconds
setInterval(() => {
  socket.emit('ping');
}, 30000);

socket.on('pong', (data) => {
  console.log('Heartbeat received:', data.timestamp);
});
```

## 🚨 Alert Management API

### Get All Alert Rules

```typescript
const response = await fetch('http://localhost:3001/api/alerts/rules');
const rules = await response.json();
/*
rules = [{
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  condition: {
    type: 'queue_depth' | 'bounce_rate' | 'delivery_rate' | 'system_health';
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    threshold: number;
    timeWindow?: number;
  };
  channels: ('email' | 'slack' | 'webhook')[];
  throttle?: {
    period: number;
    maxAlerts: number;
  };
}]
*/
```

### Get Active Alerts

```typescript
const response = await fetch('http://localhost:3001/api/alerts?acknowledged=false&limit=50');
const alerts = await response.json();
```

### Acknowledge an Alert

```typescript
await fetch(`http://localhost:3001/api/alerts/${alertId}/acknowledge`, {
  method: 'POST'
});
```

### Add Custom Alert Rule

```typescript
await fetch('http://localhost:3001/api/alerts/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: 'custom-rule-1',
    name: 'High Queue Alert',
    description: 'Alert when queue exceeds threshold',
    enabled: true,
    severity: 'warning',
    condition: {
      type: 'queue_depth',
      operator: '>',
      threshold: 5000
    },
    channels: ['slack'],
    throttle: {
      period: 300000,  // 5 minutes
      maxAlerts: 3
    }
  })
});
```

### Toggle Alert Rule

```typescript
await fetch(`http://localhost:3001/api/alerts/rules/${ruleId}/toggle`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ enabled: false })
});
```

### Delete Alert Rule

```typescript
await fetch(`http://localhost:3001/api/alerts/rules/${ruleId}`, {
  method: 'DELETE'
});
```

## 📊 TypeScript Types

All types are available in `/server/src/types/index.ts`. You can import or copy them:

```typescript
export interface QueueUpdate {
  queueName: string;
  size: number;
  ready: number;
  scheduled: number;
  timestamp: number;
}

export interface MetricsUpdate {
  delivered: number;
  bounced: number;
  deferred: number;
  throughput: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  acknowledged: boolean;
}
```

## 🎨 UI Components to Build

Based on the backend capabilities, you should create:

### 1. Real-Time Dashboard
- **Queue Status Cards** - Display queue:update data
- **Metrics Charts** - Graph metrics:update throughput over time
- **Connection Indicator** - Show connection:status health

### 2. Alert System UI
- **Alert List** - Display active/acknowledged alerts
- **Alert Rules Manager** - CRUD for alert rules
- **Alert Notifications** - Toast/modal for alert:triggered events
- **Severity Badges** - Visual indicators for alert levels

### 3. Message Tracking
- **Message List** - Display message:status updates
- **Status Filters** - Filter by queued/delivered/bounced/etc.
- **Search** - Find messages by ID

## 🔄 Data Flow Example

```typescript
// 1. Backend polls KumoMTA every 5 seconds
// 2. Backend emits queue:update event
// 3. Frontend receives event via WebSocket
// 4. Frontend updates React state
// 5. React re-renders components with new data

// Example React Hook
function useQueueUpdates() {
  const [queues, setQueues] = useState<Map<string, QueueUpdate>>(new Map());

  useEffect(() => {
    socket.emit('subscribe:queues');

    socket.on('queue:update', (update: QueueUpdate) => {
      setQueues(prev => new Map(prev).set(update.queueName, update));
    });

    return () => {
      socket.emit('unsubscribe:queues');
      socket.off('queue:update');
    };
  }, []);

  return queues;
}
```

## 🏃 Getting Started

### Step 1: Start Backend Server

```bash
cd /home/ruhroh/kumo-mta-ui/server
npm install
npm run dev
```

Server will start on `http://localhost:3001`

### Step 2: Install Frontend Dependencies

```bash
npm install socket.io-client
```

### Step 3: Create WebSocket Service

Create `/src/services/websocket.ts` with connection logic

### Step 4: Create React Hooks

Create hooks like `useQueueUpdates`, `useMetrics`, `useAlerts`

### Step 5: Build UI Components

Use the hooks in your components to display real-time data

## 🐛 Debugging

### Check Backend Logs
```bash
# Backend outputs to console in development
# Look for connection/subscription messages
```

### Test WebSocket in Browser Console
```javascript
const socket = io('ws://localhost:3001', {
  auth: { token: 'test-token' }
});

socket.on('connect', () => console.log('Connected!'));
socket.emit('subscribe:metrics');
socket.on('metrics:update', console.log);
```

### Verify API Endpoints
```bash
curl http://localhost:3001/health
curl http://localhost:3001/api/alerts/rules
```

## 📚 Documentation

- **Backend README:** `/server/README.md`
- **Implementation Summary:** `/docs/backend-implementation-summary.md`
- **Quick Start:** `/docs/backend-quick-start.md`
- **Type Definitions:** `/server/src/types/index.ts`

## 🤝 Coordination

Memory keys available:
- `frontend/backend-ready` - Backend status
- `swarm/backend/server-implementation` - Server details
- `swarm/backend/websocket-implementation` - WebSocket details
- `swarm/backend/alert-implementation` - Alert system details

## ✅ Checklist for Frontend Integration

- [ ] Install `socket.io-client` dependency
- [ ] Create WebSocket connection service
- [ ] Implement JWT token handling
- [ ] Create React hooks for real-time data
- [ ] Build queue status display components
- [ ] Build metrics dashboard with charts
- [ ] Build alert management UI
- [ ] Implement alert notifications
- [ ] Add connection status indicator
- [ ] Test WebSocket reconnection
- [ ] Handle error states gracefully
- [ ] Add loading states during connection

## 🎯 Next Steps

**Backend Developer is ready to support you!**

If you need any clarification or additional backend features:
1. Check the memory coordination keys
2. Review the documentation in `/server/README.md`
3. Test endpoints with the Quick Start guide

**Happy coding!** 🚀

---

**Backend Developer Agent** - Standing by for coordination
