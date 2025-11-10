/**
 * Generic Webhook Notification Channel
 */

import axios from 'axios';
import { NotificationPayload } from '../../types/index.js';
import { alertConfig } from '../../config/index.js';
import logger from '../../utils/logger.js';

export class WebhookChannel {
  private webhookUrl: string | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize webhook
   */
  private initialize() {
    if (!alertConfig.webhook?.url) {
      logger.warn('Webhook channel not configured - URL missing');
      return;
    }

    this.webhookUrl = alertConfig.webhook.url;
    logger.info('Webhook channel initialized');
  }

  /**
   * Send alert notification via webhook
   */
  async send(payload: NotificationPayload, customUrl?: string): Promise<boolean> {
    const url = customUrl || this.webhookUrl;

    if (!url) {
      logger.error('Webhook URL not configured');
      return false;
    }

    const webhookPayload = this.formatWebhookPayload(payload);

    try {
      const response = await axios.post(url, webhookPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'KumoMTA-Alert-System/1.0',
        },
        timeout: 10000,
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info(`Webhook alert sent successfully: ${response.status}`);
        return true;
      } else {
        logger.error(`Webhook returned non-success status: ${response.status}`);
        return false;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(`Webhook request failed: ${error.message}`, {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        logger.error('Failed to send webhook alert:', error);
      }
      return false;
    }
  }

  /**
   * Format alert for webhook payload
   */
  private formatWebhookPayload(payload: NotificationPayload) {
    const { alert, rule } = payload;

    return {
      event: 'kumomta.alert',
      timestamp: alert.timestamp,
      alert: {
        id: alert.id,
        severity: alert.severity,
        message: alert.message,
        acknowledged: alert.acknowledged,
        value: alert.value,
        threshold: alert.threshold,
      },
      rule: {
        id: rule.id,
        name: rule.name,
        description: rule.description,
        condition: {
          type: rule.condition.type,
          operator: rule.condition.operator,
          threshold: rule.condition.threshold,
          timeWindow: rule.condition.timeWindow,
        },
      },
      metadata: {
        source: 'kumomta-alert-system',
        version: '1.0.0',
      },
    };
  }

  /**
   * Send batch alerts
   */
  async sendBatch(
    payloads: NotificationPayload[],
    customUrl?: string
  ): Promise<boolean> {
    const url = customUrl || this.webhookUrl;

    if (!url) {
      logger.error('Webhook URL not configured');
      return false;
    }

    const batchPayload = {
      event: 'kumomta.alerts.batch',
      timestamp: Date.now(),
      alerts: payloads.map((p) => this.formatWebhookPayload(p)),
      metadata: {
        source: 'kumomta-alert-system',
        version: '1.0.0',
        count: payloads.length,
      },
    };

    try {
      const response = await axios.post(url, batchPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'KumoMTA-Alert-System/1.0',
        },
        timeout: 15000,
      });

      if (response.status >= 200 && response.status < 300) {
        logger.info(`Webhook batch alert sent: ${payloads.length} alerts`);
        return true;
      } else {
        logger.error(`Webhook batch returned non-success status: ${response.status}`);
        return false;
      }
    } catch (error) {
      logger.error('Failed to send webhook batch alert:', error);
      return false;
    }
  }

  /**
   * Verify webhook endpoint
   */
  async verify(customUrl?: string): Promise<boolean> {
    const url = customUrl || this.webhookUrl;

    if (!url) {
      return false;
    }

    try {
      const response = await axios.post(
        url,
        {
          event: 'kumomta.test',
          message: 'KumoMTA Alert System - Connection Test',
          timestamp: Date.now(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'KumoMTA-Alert-System/1.0',
          },
          timeout: 10000,
        }
      );

      if (response.status >= 200 && response.status < 300) {
        logger.info('Webhook channel verified successfully');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Webhook channel verification failed:', error);
      return false;
    }
  }
}

export default new WebhookChannel();
