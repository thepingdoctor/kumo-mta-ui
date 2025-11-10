# Backend Quick Start Guide

## 🚀 Installation

```bash
cd /home/ruhroh/kumo-mta-ui/server
npm install
```

## ⚙️ Configuration

1. Copy environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your settings:
```bash
# Required
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key-change-in-production
KUMOMTA_API_URL=http://localhost:8000

# Optional - Email alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_FROM_EMAIL=alerts@kumomta.local

# Optional - Slack alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Optional - Generic webhook
WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
```

## 🏃 Running

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run typecheck
```

## 🧪 Testing WebSocket Connection

### Using JavaScript
```javascript
import { io } from 'socket.io-client';

// Generate test token (in production, get from auth service)
const token = 'your-jwt-token';

const socket = io('ws://localhost:3001', {
  auth: { token }
});

// Subscribe to events
socket.emit('subscribe:queues');
socket.emit('subscribe:metrics');

// Listen for updates
socket.on('queue:update', (data) => {
  console.log('Queue update:', data);
});

socket.on('metrics:update', (data) => {
  console.log('Metrics:', data);
});

socket.on('alert:triggered', (alert) => {
  console.log('ALERT:', alert);
});
```

### Using curl (REST API)
```bash
# Health check
curl http://localhost:3001/health

# Get alert rules
curl http://localhost:3001/api/alerts/rules

# Get active alerts
curl http://localhost:3001/api/alerts?acknowledged=false

# Acknowledge alert
curl -X POST http://localhost:3001/api/alerts/ALERT_ID/acknowledge
```

## 📋 Alert Rule Example

```bash
curl -X POST http://localhost:3001/api/alerts/rules \
  -H "Content-Type: application/json" \
  -d '{
    "id": "custom-queue-alert",
    "name": "Custom Queue Alert",
    "description": "Alert when queue exceeds 5000",
    "enabled": true,
    "severity": "warning",
    "condition": {
      "type": "queue_depth",
      "operator": ">",
      "threshold": 5000
    },
    "channels": ["slack"],
    "throttle": {
      "period": 300000,
      "maxAlerts": 3
    }
  }'
```

## 🔍 Logs

Logs are output to console (development) or file (production):
- **Level:** info (default)
- **File:** logs/server.log (production)
- **Format:** `[timestamp] [level]: message`

## 🐛 Troubleshooting

### WebSocket Connection Fails
- Check JWT token is valid
- Verify CORS_ORIGIN matches frontend URL
- Ensure port 3001 is not blocked

### Alerts Not Sending
- **Email:** Verify SMTP credentials and settings
- **Slack:** Check webhook URL is valid
- **Webhook:** Test endpoint with curl first

### KumoMTA Connection Issues
- Verify KUMOMTA_API_URL is accessible
- Check if API token is required
- Review server logs for error details

## 📁 Key Files

- `/server/src/index.ts` - Main server entry point
- `/server/src/websocket/server.ts` - WebSocket server
- `/server/src/alerts/alertEngine.ts` - Alert system
- `/server/src/config/index.ts` - Configuration
- `/server/.env` - Environment variables (create from .env.example)

## 🔗 Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/alerts/rules` | List alert rules |
| GET | `/api/alerts` | Get alerts (with filters) |
| POST | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/api/alerts/rules` | Add alert rule |
| DELETE | `/api/alerts/rules/:id` | Remove alert rule |
| PATCH | `/api/alerts/rules/:id/toggle` | Enable/disable rule |

## 🎯 WebSocket Events

### Subscribe
- `subscribe:queues` - Queue updates
- `subscribe:metrics` - Metrics updates
- `subscribe:messages` - Message status

### Receive
- `queue:update` - Queue state changes
- `metrics:update` - Real-time metrics
- `message:status` - Individual messages
- `connection:status` - Server health
- `alert:triggered` - Alerts fired
- `pong` - Heartbeat response

## 📚 Full Documentation

See `/server/README.md` for complete documentation.
