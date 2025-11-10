/**
 * WebSocket Server with Socket.io
 */

import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { serverConfig, wsConfig } from '../config/index.js';
import { authenticateSocket, AuthenticatedSocket } from './authentication.js';
import queueEventEmitter from './queueEventEmitter.js';
import logger from '../utils/logger.js';
import {
  QueueUpdate,
  MetricsUpdate,
  MessageStatus,
  ConnectionStatus,
} from '../types/index.js';

export class WebSocketServer {
  private io: Server;
  private clients = new Map<string, AuthenticatedSocket>();

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: serverConfig.corsOrigin,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingInterval: wsConfig.heartbeatInterval,
      pingTimeout: wsConfig.heartbeatInterval * 2,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    this.startQueueBridge();
  }

  /**
   * Setup authentication middleware
   */
  private setupMiddleware() {
    this.io.use(authenticateSocket);
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  /**
   * Handle new client connection
   */
  private handleConnection(socket: AuthenticatedSocket) {
    const user = socket.user!;
    logger.info(`WebSocket client connected: ${user.username} (${socket.id})`);

    this.clients.set(socket.id, socket);

    // Send initial connection status
    socket.emit('connection:status', {
      connected: true,
      kumoMtaStatus: 'healthy',
      timestamp: Date.now(),
    });

    // Handle client subscriptions
    socket.on('subscribe:queues', () => {
      socket.join('queues');
      logger.debug(`${user.username} subscribed to queue updates`);
    });

    socket.on('subscribe:metrics', () => {
      socket.join('metrics');
      logger.debug(`${user.username} subscribed to metrics updates`);
    });

    socket.on('subscribe:messages', () => {
      socket.join('messages');
      logger.debug(`${user.username} subscribed to message status updates`);
    });

    // Handle unsubscriptions
    socket.on('unsubscribe:queues', () => {
      socket.leave('queues');
      logger.debug(`${user.username} unsubscribed from queue updates`);
    });

    socket.on('unsubscribe:metrics', () => {
      socket.leave('metrics');
      logger.debug(`${user.username} unsubscribed from metrics updates`);
    });

    socket.on('unsubscribe:messages', () => {
      socket.leave('messages');
      logger.debug(`${user.username} unsubscribed from message status updates`);
    });

    // Handle heartbeat
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${user.username} (${socket.id}) - ${reason}`);
      this.clients.delete(socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error for ${user.username}:`, error);
    });
  }

  /**
   * Start KumoMTA event bridge
   */
  private startQueueBridge() {
    // Queue updates
    queueEventEmitter.on('queue:update', (update: QueueUpdate) => {
      this.io.to('queues').emit('queue:update', update);
    });

    // Metrics updates
    queueEventEmitter.on('metrics:update', (update: MetricsUpdate) => {
      this.io.to('metrics').emit('metrics:update', update);
    });

    // Message status updates
    queueEventEmitter.on('message:status', (status: MessageStatus) => {
      this.io.to('messages').emit('message:status', status);
    });

    // Connection status updates
    queueEventEmitter.on('connection:status', (status: ConnectionStatus) => {
      this.io.emit('connection:status', status);
    });

    // Start polling
    queueEventEmitter.start();
    logger.info('KumoMTA event bridge started');
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(event: string, data: unknown) {
    this.io.emit(event, data);
  }

  /**
   * Broadcast to specific room
   */
  broadcastToRoom(room: string, event: string, data: unknown) {
    this.io.to(room).emit(event, data);
  }

  /**
   * Get connected clients count
   */
  getClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Shutdown WebSocket server
   */
  async shutdown() {
    logger.info('Shutting down WebSocket server...');
    queueEventEmitter.stop();

    // Disconnect all clients gracefully
    this.clients.forEach((socket) => {
      socket.emit('server:shutdown', { message: 'Server is shutting down' });
      socket.disconnect(true);
    });

    await new Promise<void>((resolve) => {
      this.io.close(() => {
        logger.info('WebSocket server closed');
        resolve();
      });
    });
  }
}
