/**
 * Email Notification Channel
 */

import nodemailer from 'nodemailer';
import { NotificationPayload } from '../../types/index.js';
import { alertConfig } from '../../config/index.js';
import logger from '../../utils/logger.js';

export class EmailChannel {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  private initialize() {
    if (!alertConfig.smtp) {
      logger.warn('Email channel not configured - SMTP settings missing');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: alertConfig.smtp.host,
        port: alertConfig.smtp.port,
        secure: alertConfig.smtp.port === 465,
        auth: {
          user: alertConfig.smtp.user,
          pass: alertConfig.smtp.pass,
        },
      });

      logger.info('Email channel initialized');
    } catch (error) {
      logger.error('Failed to initialize email channel:', error);
    }
  }

  /**
   * Send alert notification via email
   */
  async send(payload: NotificationPayload, recipients: string[]): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Email channel not configured');
      return false;
    }

    if (!recipients || recipients.length === 0) {
      logger.error('No email recipients specified');
      return false;
    }

    const { alert, rule } = payload;

    const subject = `[${alert.severity.toUpperCase()}] ${rule.name}`;
    const html = this.generateEmailHtml(payload);
    const text = this.generateEmailText(payload);

    try {
      const info = await this.transporter.sendMail({
        from: alertConfig.smtp!.from,
        to: recipients.join(', '),
        subject,
        text,
        html,
      });

      logger.info(`Email alert sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error('Failed to send email alert:', error);
      return false;
    }
  }

  /**
   * Generate HTML email content
   */
  private generateEmailHtml(payload: NotificationPayload): string {
    const { alert, rule } = payload;
    const severityColor = this.getSeverityColor(alert.severity);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
          .footer { background: #333; color: white; padding: 10px; text-align: center; border-radius: 0 0 5px 5px; font-size: 12px; }
          .metric { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid ${severityColor}; }
          .label { font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 KumoMTA Alert: ${rule.name}</h2>
          </div>
          <div class="content">
            <p><strong>Severity:</strong> <span style="color: ${severityColor}; font-weight: bold;">${alert.severity.toUpperCase()}</span></p>
            <p><strong>Description:</strong> ${rule.description}</p>

            <div class="metric">
              <p class="label">Alert Message:</p>
              <p>${alert.message}</p>
            </div>

            <div class="metric">
              <p class="label">Details:</p>
              <p>Current Value: <strong>${alert.value.toFixed(2)}</strong></p>
              <p>Threshold: <strong>${alert.threshold}</strong></p>
              <p>Time: <strong>${new Date(alert.timestamp).toLocaleString()}</strong></p>
            </div>

            <div class="metric">
              <p class="label">Rule Configuration:</p>
              <p>Condition: ${rule.condition.type} ${rule.condition.operator} ${rule.condition.threshold}</p>
              ${rule.condition.timeWindow ? `<p>Time Window: ${rule.condition.timeWindow / 1000}s</p>` : ''}
            </div>
          </div>
          <div class="footer">
            <p>KumoMTA Alert System | Automated Alert ID: ${alert.id}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate plain text email content
   */
  private generateEmailText(payload: NotificationPayload): string {
    const { alert, rule } = payload;

    return `
KumoMTA ALERT: ${rule.name}
Severity: ${alert.severity.toUpperCase()}

Description: ${rule.description}

Message: ${alert.message}

Details:
- Current Value: ${alert.value.toFixed(2)}
- Threshold: ${alert.threshold}
- Time: ${new Date(alert.timestamp).toLocaleString()}

Rule Configuration:
- Condition: ${rule.condition.type} ${rule.condition.operator} ${rule.condition.threshold}
${rule.condition.timeWindow ? `- Time Window: ${rule.condition.timeWindow / 1000}s` : ''}

Alert ID: ${alert.id}
    `.trim();
  }

  /**
   * Get color for severity level
   */
  private getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      info: '#3498db',
      warning: '#f39c12',
      error: '#e74c3c',
      critical: '#c0392b',
    };
    return colors[severity] || '#95a5a6';
  }

  /**
   * Verify email configuration
   */
  async verify(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      logger.info('Email channel verified successfully');
      return true;
    } catch (error) {
      logger.error('Email channel verification failed:', error);
      return false;
    }
  }
}

export default new EmailChannel();
