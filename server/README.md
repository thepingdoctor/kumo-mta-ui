# KumoMTA UI Backend Server

Backend server for KumoMTA UI with real-time WebSocket capabilities and automated alert system.

## Features

### 🔌 Real-Time WebSocket Server
- **Socket.io integration** for bi-directional real-time communication
- **Authentication middleware** for secure WebSocket connections
- **KumoMTA event bridge** polling and emitting updates
- **Subscription-based** event streaming (queues, metrics, messages)
- **Automatic reconnection** support with heartbeat mechanism

### 🚨 Automated Alert System
- **Rule-based alert engine** with customizable conditions
- **Multi-channel notifications** (Email, Slack, Webhook)
- **Alert throttling** to prevent notification spam
- **Severity levels**: info, warning, error, critical
- **Time-window aggregation** for trend-based alerts

### 📊 Supported Alert Rules
1. **Queue Depth Monitoring** - Alert on queue size thresholds
2. **Bounce Rate Detection** - Spike detection with time windows
3. **Delivery Rate Monitoring** - Throughput drop detection
4. **System Health** - Overall system degradation alerts

## Installation

```bash
cd server
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Configuration
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - Frontend origin for CORS
- `JWT_SECRET` - Secret for JWT authentication
- `KUMOMTA_API_URL` - KumoMTA API endpoint

### Optional Alert Channels

#### Email (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_FROM_EMAIL=alerts@kumomta.local
```

#### Slack
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

#### Generic Webhook
```env
WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

## API Endpoints

### Health Check
```http
GET /health
```

### Alert Management

#### Get All Alert Rules
```http
GET /api/alerts/rules
```

#### Get Alerts
```http
GET /api/alerts?acknowledged=false&limit=50
```

#### Acknowledge Alert
```http
POST /api/alerts/:id/acknowledge
```

#### Add Alert Rule
```http
POST /api/alerts/rules
Content-Type: application/json

{
  "id": "custom-rule",
  "name": "Custom Alert",
  "description": "Custom alert description",
  "enabled": true,
  "severity": "warning",
  "condition": {
    "type": "queue_depth",
    "operator": ">",
    "threshold": 5000
  },
  "channels": ["slack", "webhook"],
  "throttle": {
    "period": 300000,
    "maxAlerts": 3
  }
}
```

#### Delete Alert Rule
```http
DELETE /api/alerts/rules/:id
```

#### Toggle Alert Rule
```http
PATCH /api/alerts/rules/:id/toggle
Content-Type: application/json

{
  "enabled": false
}
```

## WebSocket Events

### Client → Server

#### Subscribe to Events
```javascript
socket.emit('subscribe:queues');
socket.emit('subscribe:metrics');
socket.emit('subscribe:messages');
```

#### Unsubscribe from Events
```javascript
socket.emit('unsubscribe:queues');
socket.emit('unsubscribe:metrics');
socket.emit('unsubscribe:messages');
```

#### Heartbeat
```javascript
socket.emit('ping');
```

### Server → Client

#### Queue Updates
```javascript
socket.on('queue:update', (data) => {
  // { queueName, size, ready, scheduled, timestamp }
});
```

#### Metrics Updates
```javascript
socket.on('metrics:update', (data) => {
  // { delivered, bounced, deferred, throughput, timestamp }
});
```

#### Message Status
```javascript
socket.on('message:status', (data) => {
  // { messageId, status, queue, timestamp, details }
});
```

#### Connection Status
```javascript
socket.on('connection:status', (data) => {
  // { connected, kumoMtaStatus, timestamp }
});
```

#### Alert Triggered
```javascript
socket.on('alert:triggered', (alert) => {
  // { id, ruleId, ruleName, severity, message, value, threshold, timestamp }
});
```

#### Heartbeat Response
```javascript
socket.on('pong', (data) => {
  // { timestamp }
});
```

## Authentication

WebSocket connections require JWT authentication. Include token in handshake:

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Architecture

```
server/
├── src/
│   ├── alerts/
│   │   ├── alertEngine.ts          # Main alert evaluation engine
│   │   ├── ruleEvaluator.ts        # Rule matching logic
│   │   ├── notificationRouter.ts   # Multi-channel dispatcher
│   │   └── channels/
│   │       ├── emailChannel.ts     # Email notifications
│   │       ├── slackChannel.ts     # Slack integration
│   │       └── webhookChannel.ts   # Generic webhooks
│   ├── websocket/
│   │   ├── server.ts               # WebSocket server
│   │   ├── authentication.ts       # Auth middleware
│   │   └── queueEventEmitter.ts    # KumoMTA bridge
│   ├── config/
│   │   └── index.ts                # Configuration management
│   ├── types/
│   │   └── index.ts                # TypeScript definitions
│   ├── utils/
│   │   └── logger.ts               # Winston logger
│   └── index.ts                    # Express server
├── package.json
├── tsconfig.json
└── .env.example
```

## Default Alert Rules

1. **Critical Queue Depth** - Triggers when queue > 10,000 messages
2. **High Bounce Rate** - Triggers when bounce rate > 5% (5min window)
3. **Low Delivery Rate** - Triggers when throughput < 100 msg/s
4. **System Health Degraded** - Triggers when deferred ratio > 10%

## License

MIT
