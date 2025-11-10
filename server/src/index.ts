/**
 * KumoMTA UI Backend Server
 * Express server with WebSocket integration and Alert System
 */

import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import { serverConfig } from './config/index.js';
import { WebSocketServer } from './websocket/server.js';
import alertEngine from './alerts/alertEngine.js';
import queueEventEmitter from './websocket/queueEventEmitter.js';
import logger from './utils/logger.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({ origin: serverConfig.corsOrigin, credentials: true }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

// API endpoints
app.get('/api/alerts/rules', (req, res) => {
  const rules = alertEngine.getRules();
  res.json(rules);
});

app.get('/api/alerts', (req, res) => {
  const { acknowledged, limit } = req.query;
  const alerts = alertEngine.getAlerts({
    acknowledged: acknowledged === 'true' ? true : acknowledged === 'false' ? false : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });
  res.json(alerts);
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const { id } = req.params;
  const success = alertEngine.acknowledgeAlert(id);

  if (success) {
    res.json({ success: true, message: 'Alert acknowledged' });
  } else {
    res.status(404).json({ success: false, message: 'Alert not found' });
  }
});

app.post('/api/alerts/rules', (req, res) => {
  try {
    const rule = req.body;
    alertEngine.addRule(rule);
    res.json({ success: true, rule });
  } catch (error) {
    logger.error('Error adding rule:', error);
    res.status(400).json({ success: false, message: 'Invalid rule configuration' });
  }
});

app.delete('/api/alerts/rules/:id', (req, res) => {
  const { id } = req.params;
  const success = alertEngine.removeRule(id);

  if (success) {
    res.json({ success: true, message: 'Rule removed' });
  } else {
    res.status(404).json({ success: false, message: 'Rule not found' });
  }
});

app.patch('/api/alerts/rules/:id/toggle', (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;
  const success = alertEngine.toggleRule(id, enabled);

  if (success) {
    res.json({ success: true, message: `Rule ${enabled ? 'enabled' : 'disabled'}` });
  } else {
    res.status(404).json({ success: false, message: 'Rule not found' });
  }
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response) => {
  logger.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Initialize WebSocket server
const wsServer = new WebSocketServer(httpServer);

// Connect alert engine to queue events
queueEventEmitter.on('metrics:update', (metrics) => {
  alertEngine.evaluateMetrics(metrics);
});

queueEventEmitter.on('queue:update', (queueUpdate) => {
  alertEngine.evaluateQueue(queueUpdate);
});

// Alert engine events
alertEngine.on('alert:triggered', (alert) => {
  // Broadcast alert to connected clients
  wsServer.broadcast('alert:triggered', alert);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Stop accepting new connections
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  // Shutdown WebSocket server
  await wsServer.shutdown();

  // Stop queue event emitter
  queueEventEmitter.stop();

  // Exit process
  logger.info('Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start server
httpServer.listen(serverConfig.port, () => {
  logger.info(`
  ╔═══════════════════════════════════════════╗
  ║   KumoMTA UI Backend Server Started      ║
  ╠═══════════════════════════════════════════╣
  ║  HTTP:       http://localhost:${serverConfig.port}    ║
  ║  WebSocket:  ws://localhost:${serverConfig.port}      ║
  ║  Environment: ${process.env.NODE_ENV || 'development'}              ║
  ╚═══════════════════════════════════════════╝
  `);
});

export { app, httpServer, wsServer };
