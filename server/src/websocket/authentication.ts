/**
 * WebSocket Authentication Middleware
 */

import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { serverConfig } from '../config/index.js';
import { AuthToken } from '../types/index.js';
import logger from '../utils/logger.js';

export interface AuthenticatedSocket extends Socket {
  user?: AuthToken;
}

/**
 * Verify JWT token from WebSocket handshake
 */
export function verifyToken(token: string): AuthToken | null {
  try {
    const decoded = jwt.verify(token, serverConfig.jwtSecret) as AuthToken;
    return decoded;
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
}

/**
 * WebSocket authentication middleware
 */
export function authenticateSocket(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
) {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    logger.warn(`WebSocket connection rejected: No token provided from ${socket.handshake.address}`);
    return next(new Error('Authentication token required'));
  }

  const user = verifyToken(token as string);

  if (!user) {
    logger.warn(`WebSocket connection rejected: Invalid token from ${socket.handshake.address}`);
    return next(new Error('Invalid authentication token'));
  }

  socket.user = user;
  logger.info(`WebSocket authenticated: ${user.username} (${user.userId})`);
  next();
}

/**
 * Generate JWT token for testing/development
 */
export function generateToken(userId: string, username: string, roles: string[] = ['user']): string {
  const payload: AuthToken = {
    userId,
    username,
    roles,
  };

  return jwt.sign(payload, serverConfig.jwtSecret, {
    expiresIn: serverConfig.jwtExpiresIn,
  });
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(socket: AuthenticatedSocket, requiredRole: string): boolean {
  if (!socket.user) {
    return false;
  }

  return socket.user.roles.includes(requiredRole) || socket.user.roles.includes('admin');
}
