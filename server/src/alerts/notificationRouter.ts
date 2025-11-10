/**
 * Multi-Channel Notification Dispatcher
 */

import { NotificationPayload, AlertChannel } from '../types/index.js';
import emailChannel from './channels/emailChannel.js';
import slackChannel from './channels/slackChannel.js';
import webhookChannel from './channels/webhookChannel.js';
import logger from '../utils/logger.js';

export class NotificationRouter {
  /**
   * Route notification to appropriate channels
   */
  async route(
    payload: NotificationPayload,
    channels: AlertChannel[],
    config?: {
      emailRecipients?: string[];
      slackChannel?: string;
      webhookUrl?: string;
    }
  ): Promise<Map<AlertChannel, boolean>> {
    const results = new Map<AlertChannel, boolean>();

    const promises = channels.map(async (channel) => {
      try {
        const success = await this.sendToChannel(channel, payload, config);
        results.set(channel, success);

        if (success) {
          logger.info(`Alert sent via ${channel}: ${payload.alert.id}`);
        } else {
          logger.error(`Failed to send alert via ${channel}: ${payload.alert.id}`);
        }
      } catch (error) {
        logger.error(`Error sending to ${channel}:`, error);
        results.set(channel, false);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Send to specific channel
   */
  private async sendToChannel(
    channel: AlertChannel,
    payload: NotificationPayload,
    config?: {
      emailRecipients?: string[];
      slackChannel?: string;
      webhookUrl?: string;
    }
  ): Promise<boolean> {
    switch (channel) {
      case 'email':
        if (!config?.emailRecipients || config.emailRecipients.length === 0) {
          logger.warn('Email channel selected but no recipients configured');
          return false;
        }
        return emailChannel.send(payload, config.emailRecipients);

      case 'slack':
        return slackChannel.send(payload, config?.slackChannel);

      case 'webhook':
        return webhookChannel.send(payload, config?.webhookUrl);

      default:
        logger.warn(`Unknown notification channel: ${channel}`);
        return false;
    }
  }

  /**
   * Send batch notifications
   */
  async routeBatch(
    payloads: NotificationPayload[],
    channels: AlertChannel[],
    config?: {
      emailRecipients?: string[];
      slackChannel?: string;
      webhookUrl?: string;
    }
  ): Promise<Map<AlertChannel, boolean>> {
    const results = new Map<AlertChannel, boolean>();

    // For webhook, we can batch
    if (channels.includes('webhook')) {
      try {
        const success = await webhookChannel.sendBatch(payloads, config?.webhookUrl);
        results.set('webhook', success);
      } catch (error) {
        logger.error('Error sending webhook batch:', error);
        results.set('webhook', false);
      }
    }

    // For email and Slack, send individually
    const individualChannels = channels.filter((c) => c !== 'webhook');
    if (individualChannels.length > 0) {
      for (const payload of payloads) {
        const channelResults = await this.route(payload, individualChannels, config);
        channelResults.forEach((success, channel) => {
          const currentResult = results.get(channel);
          results.set(channel, currentResult !== false && success);
        });
      }
    }

    return results;
  }

  /**
   * Verify channel configurations
   */
  async verifyChannels(channels: AlertChannel[]): Promise<Map<AlertChannel, boolean>> {
    const results = new Map<AlertChannel, boolean>();

    const verificationPromises = channels.map(async (channel) => {
      try {
        let verified = false;

        switch (channel) {
          case 'email':
            verified = await emailChannel.verify();
            break;
          case 'slack':
            verified = await slackChannel.verify();
            break;
          case 'webhook':
            verified = await webhookChannel.verify();
            break;
        }

        results.set(channel, verified);
        logger.info(`Channel ${channel} verification: ${verified ? 'SUCCESS' : 'FAILED'}`);
      } catch (error) {
        logger.error(`Error verifying ${channel}:`, error);
        results.set(channel, false);
      }
    });

    await Promise.all(verificationPromises);
    return results;
  }
}

export default new NotificationRouter();
