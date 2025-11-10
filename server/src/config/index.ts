/**
 * Configuration Management for KumoMTA UI Backend
 */

import dotenv from 'dotenv';
import { ServerConfig, AlertConfig } from '../types/index.js';

dotenv.config();

export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'development-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  kumoMtaApiUrl: process.env.KUMOMTA_API_URL || 'http://localhost:8000',
  kumoMtaApiToken: process.env.KUMOMTA_API_TOKEN,
};

export const alertConfig: AlertConfig = {
  smtp: process.env.SMTP_HOST
    ? {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
        from: process.env.ALERT_FROM_EMAIL || 'alerts@kumomta.local',
      }
    : undefined,
  slack: process.env.SLACK_WEBHOOK_URL
    ? {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
      }
    : undefined,
  webhook: process.env.WEBHOOK_URL
    ? {
        url: process.env.WEBHOOK_URL,
      }
    : undefined,
};

export const wsConfig = {
  heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL || '30000', 10),
  maxReconnectAttempts: parseInt(process.env.WS_MAX_RECONNECT_ATTEMPTS || '5', 10),
};

export const logConfig = {
  level: process.env.LOG_LEVEL || 'info',
  file: process.env.LOG_FILE || 'logs/server.log',
};

// Validation
if (!serverConfig.jwtSecret || serverConfig.jwtSecret === 'development-secret-key') {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  console.warn('⚠️  Using default JWT secret - NOT SECURE FOR PRODUCTION');
}

export default {
  server: serverConfig,
  alert: alertConfig,
  websocket: wsConfig,
  logging: logConfig,
};
