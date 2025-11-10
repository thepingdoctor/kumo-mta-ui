/**
 * Slack Notification Channel
 */

import axios from 'axios';
import { NotificationPayload } from '../../types/index.js';
import { alertConfig } from '../../config/index.js';
import logger from '../../utils/logger.js';

export class SlackChannel {
  private webhookUrl: string | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Slack webhook
   */
  private initialize() {
    if (!alertConfig.slack?.webhookUrl) {
      logger.warn('Slack channel not configured - webhook URL missing');
      return;
    }

    this.webhookUrl = alertConfig.slack.webhookUrl;
    logger.info('Slack channel initialized');
  }

  /**
   * Send alert notification to Slack
   */
  async send(payload: NotificationPayload, channel?: string): Promise<boolean> {
    if (!this.webhookUrl) {
      logger.error('Slack channel not configured');
      return false;
    }

    const { rule } = payload;
    const message = this.formatSlackMessage(payload);

    try {
      const response = await axios.post(
        this.webhookUrl,
        {
          ...message,
          channel: channel || undefined,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        logger.info(`Slack alert sent for rule: ${rule.name}`);
        return true;
      } else {
        logger.error(`Slack API error: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (error) {
      logger.error('Failed to send Slack alert:', error);
      return false;
    }
  }

  /**
   * Format alert as Slack message
   */
  private formatSlackMessage(payload: NotificationPayload) {
    const { alert, rule } = payload;
    const emoji = this.getSeverityEmoji(alert.severity);
    const color = this.getSeverityColor(alert.severity);

    return {
      username: 'KumoMTA Alert System',
      icon_emoji: ':envelope:',
      attachments: [
        {
          color,
          title: `${emoji} ${rule.name}`,
          text: rule.description,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: 'Alert ID',
              value: alert.id,
              short: true,
            },
            {
              title: 'Message',
              value: alert.message,
              short: false,
            },
            {
              title: 'Current Value',
              value: alert.value.toFixed(2),
              short: true,
            },
            {
              title: 'Threshold',
              value: alert.threshold.toString(),
              short: true,
            },
            {
              title: 'Condition',
              value: `${rule.condition.type} ${rule.condition.operator} ${rule.condition.threshold}`,
              short: false,
            },
          ],
          footer: 'KumoMTA Alert System',
          footer_icon: 'https://www.kumomta.com/favicon.ico',
          ts: Math.floor(alert.timestamp / 1000),
        },
      ],
    };
  }

  /**
   * Get emoji for severity level
   */
  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🔴',
      critical: '🚨',
    };
    return emojis[severity] || '📢';
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      info: '#36a64f',
      warning: '#ff9900',
      error: '#ff0000',
      critical: '#990000',
    };
    return colors[severity] || '#808080';
  }

  /**
   * Verify Slack webhook
   */
  async verify(): Promise<boolean> {
    if (!this.webhookUrl) {
      return false;
    }

    try {
      const response = await axios.post(
        this.webhookUrl,
        {
          text: 'KumoMTA Alert System - Connection Test',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        logger.info('Slack channel verified successfully');
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Slack channel verification failed:', error);
      return false;
    }
  }
}

export default new SlackChannel();
