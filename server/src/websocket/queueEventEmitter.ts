/**
 * KumoMTA Event Bridge
 * Polls KumoMTA API and emits events for real-time updates
 */

import { EventEmitter } from 'events';
import axios from 'axios';
import { serverConfig } from '../config/index.js';
import {
  QueueUpdate,
  MetricsUpdate,
  MessageStatus,
  ConnectionStatus,
  KumoQueueData,
  KumoMetrics,
} from '../types/index.js';
import logger from '../utils/logger.js';

export class QueueEventEmitter extends EventEmitter {
  private pollingInterval: NodeJS.Timeout | null = null;
  private readonly pollIntervalMs = 5000; // 5 seconds
  private connected = false;
  private lastMetrics: KumoMetrics | null = null;

  constructor() {
    super();
  }

  /**
   * Start polling KumoMTA API
   */
  start() {
    if (this.pollingInterval) {
      logger.warn('Queue event emitter already started');
      return;
    }

    logger.info('Starting KumoMTA event bridge');
    this.pollingInterval = setInterval(() => this.poll(), this.pollIntervalMs);
    this.poll(); // Initial poll
  }

  /**
   * Stop polling
   */
  stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      logger.info('KumoMTA event bridge stopped');
    }
  }

  /**
   * Poll KumoMTA API for updates
   */
  private async poll() {
    try {
      await Promise.all([this.pollQueues(), this.pollMetrics()]);

      if (!this.connected) {
        this.connected = true;
        this.emitConnectionStatus('healthy');
      }
    } catch (error) {
      logger.error('Error polling KumoMTA:', error);
      if (this.connected) {
        this.connected = false;
        this.emitConnectionStatus('down');
      }
    }
  }

  /**
   * Poll queue data
   */
  private async pollQueues() {
    const response = await axios.get<KumoQueueData[]>(
      `${serverConfig.kumoMtaApiUrl}/api/admin/bounce/v1`,
      {
        headers: this.getAuthHeaders(),
        timeout: 5000,
      }
    );

    const queues = response.data;

    queues.forEach((queue) => {
      const update: QueueUpdate = {
        queueName: queue.name,
        size: queue.size,
        ready: queue.ready,
        scheduled: queue.scheduled,
        timestamp: Date.now(),
      };

      this.emit('queue:update', update);
    });
  }

  /**
   * Poll metrics data
   */
  private async pollMetrics() {
    const response = await axios.get<KumoMetrics>(
      `${serverConfig.kumoMtaApiUrl}/api/admin/metrics/v1`,
      {
        headers: this.getAuthHeaders(),
        timeout: 5000,
      }
    );

    const metrics = response.data;
    const throughput = this.calculateThroughput(metrics);

    const update: MetricsUpdate = {
      delivered: metrics.counters.delivered,
      bounced: metrics.counters.bounced,
      deferred: metrics.counters.deferred,
      throughput,
      timestamp: Date.now(),
    };

    this.emit('metrics:update', update);
    this.lastMetrics = metrics;
  }

  /**
   * Calculate throughput (messages per second)
   */
  private calculateThroughput(currentMetrics: KumoMetrics): number {
    if (!this.lastMetrics) {
      return 0;
    }

    const timeDiff = (currentMetrics.timestamp - this.lastMetrics.timestamp) / 1000; // seconds
    if (timeDiff === 0) return 0;

    const deliveredDiff = currentMetrics.counters.delivered - this.lastMetrics.counters.delivered;
    return Math.round(deliveredDiff / timeDiff);
  }

  /**
   * Emit connection status update
   */
  private emitConnectionStatus(status: ConnectionStatus['kumoMtaStatus']) {
    const update: ConnectionStatus = {
      connected: this.connected,
      kumoMtaStatus: status,
      timestamp: Date.now(),
    };

    this.emit('connection:status', update);
    logger.info(`KumoMTA connection status: ${status}`);
  }

  /**
   * Emit message status (can be called from external sources)
   */
  emitMessageStatus(status: MessageStatus) {
    this.emit('message:status', status);
  }

  /**
   * Get authentication headers for KumoMTA API
   */
  private getAuthHeaders() {
    if (serverConfig.kumoMtaApiToken) {
      return {
        Authorization: `Bearer ${serverConfig.kumoMtaApiToken}`,
      };
    }
    return {};
  }
}

export default new QueueEventEmitter();
