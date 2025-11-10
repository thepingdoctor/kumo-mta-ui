/**
 * Alert Rule Evaluation Engine
 */

import { EventEmitter } from 'events';
import {
  AlertRule,
  Alert,
  MetricsUpdate,
  QueueUpdate,
  NotificationPayload,
} from '../types/index.js';
import ruleEvaluator from './ruleEvaluator.js';
import notificationRouter from './notificationRouter.js';
import logger from '../utils/logger.js';
import { randomUUID } from 'crypto';

interface ThrottleState {
  count: number;
  windowStart: number;
}

export class AlertEngine extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private throttleState: Map<string, ThrottleState> = new Map();

  constructor() {
    super();
    this.loadDefaultRules();
  }

  /**
   * Load default alert rules
   */
  private loadDefaultRules() {
    const defaultRules: AlertRule[] = [
      {
        id: 'queue-depth-critical',
        name: 'Critical Queue Depth',
        description: 'Alert when queue depth exceeds critical threshold',
        enabled: true,
        severity: 'critical',
        condition: {
          type: 'queue_depth',
          operator: '>',
          threshold: 10000,
        },
        channels: ['email', 'slack'],
        throttle: {
          period: 300000, // 5 minutes
          maxAlerts: 3,
        },
      },
      {
        id: 'bounce-rate-high',
        name: 'High Bounce Rate',
        description: 'Alert when bounce rate exceeds 5%',
        enabled: true,
        severity: 'warning',
        condition: {
          type: 'bounce_rate',
          operator: '>',
          threshold: 5,
          timeWindow: 300000, // 5 minutes
        },
        channels: ['slack', 'webhook'],
        throttle: {
          period: 600000, // 10 minutes
          maxAlerts: 2,
        },
      },
      {
        id: 'delivery-rate-low',
        name: 'Low Delivery Rate',
        description: 'Alert when delivery throughput drops below 100 msg/s',
        enabled: true,
        severity: 'warning',
        condition: {
          type: 'delivery_rate',
          operator: '<',
          threshold: 100,
          timeWindow: 60000, // 1 minute
        },
        channels: ['slack'],
        throttle: {
          period: 300000, // 5 minutes
          maxAlerts: 5,
        },
      },
      {
        id: 'system-health-degraded',
        name: 'System Health Degraded',
        description: 'Alert when deferred message ratio exceeds 10%',
        enabled: true,
        severity: 'error',
        condition: {
          type: 'system_health',
          operator: '>',
          threshold: 10,
        },
        channels: ['email', 'slack'],
        throttle: {
          period: 600000, // 10 minutes
          maxAlerts: 3,
        },
      },
    ];

    defaultRules.forEach((rule) => {
      this.addRule(rule);
    });

    logger.info(`Loaded ${defaultRules.length} default alert rules`);
  }

  /**
   * Add or update alert rule
   */
  addRule(rule: AlertRule) {
    this.rules.set(rule.id, rule);
    logger.info(`Alert rule added/updated: ${rule.name} (${rule.id})`);
    this.emit('rule:added', rule);
  }

  /**
   * Remove alert rule
   */
  removeRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      logger.info(`Alert rule removed: ${ruleId}`);
      this.emit('rule:removed', ruleId);
    }
    return deleted;
  }

  /**
   * Get all rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): AlertRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Enable/disable rule
   */
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    rule.enabled = enabled;
    logger.info(`Alert rule ${enabled ? 'enabled' : 'disabled'}: ${rule.name}`);
    this.emit('rule:toggled', rule);
    return true;
  }

  /**
   * Evaluate metrics update against all rules
   */
  async evaluateMetrics(metrics: MetricsUpdate) {
    const triggeredRules: AlertRule[] = [];

    for (const rule of this.rules.values()) {
      if (
        !rule.enabled ||
        (rule.condition.type !== 'bounce_rate' &&
          rule.condition.type !== 'delivery_rate' &&
          rule.condition.type !== 'system_health')
      ) {
        continue;
      }

      const triggered = ruleEvaluator.evaluateRule(rule, metrics);

      if (triggered) {
        if (this.shouldThrottle(rule)) {
          logger.debug(`Alert throttled: ${rule.name}`);
          continue;
        }

        triggeredRules.push(rule);
        await this.triggerAlert(rule, metrics);
      }
    }

    return triggeredRules;
  }

  /**
   * Evaluate queue update against all rules
   */
  async evaluateQueue(queueUpdate: QueueUpdate) {
    ruleEvaluator.addQueueUpdate(queueUpdate);
    const triggeredRules: AlertRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled || rule.condition.type !== 'queue_depth') {
        continue;
      }

      const triggered = ruleEvaluator.evaluateRule(rule, queueUpdate);

      if (triggered) {
        if (this.shouldThrottle(rule)) {
          logger.debug(`Alert throttled: ${rule.name}`);
          continue;
        }

        triggeredRules.push(rule);
        await this.triggerAlert(rule, queueUpdate);
      }
    }

    return triggeredRules;
  }

  /**
   * Trigger alert and send notifications
   */
  private async triggerAlert(
    rule: AlertRule,
    data: MetricsUpdate | QueueUpdate
  ): Promise<Alert> {
    const alert: Alert = {
      id: randomUUID(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      message: this.generateAlertMessage(rule, data),
      value: this.extractValue(rule, data),
      threshold: rule.condition.threshold,
      timestamp: Date.now(),
      acknowledged: false,
    };

    this.alerts.set(alert.id, alert);
    this.updateThrottle(rule);

    logger.warn(`ALERT TRIGGERED: ${alert.message}`);
    this.emit('alert:triggered', alert);

    // Send notifications
    const payload: NotificationPayload = { alert, rule };
    await notificationRouter.route(payload, rule.channels, {
      emailRecipients: ['admin@kumomta.local'], // TODO: Configure from rule
    });

    return alert;
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, data: MetricsUpdate | QueueUpdate): string {
    const value = this.extractValue(rule, data);
    const threshold = rule.condition.threshold;

    switch (rule.condition.type) {
      case 'queue_depth':
        return `Queue depth (${value}) exceeded threshold (${threshold})`;
      case 'bounce_rate':
        return `Bounce rate (${value.toFixed(2)}%) exceeded threshold (${threshold}%)`;
      case 'delivery_rate':
        return `Delivery rate (${value.toFixed(0)} msg/s) below threshold (${threshold} msg/s)`;
      case 'system_health':
        return `System health degraded: deferred ratio (${value.toFixed(2)}%) exceeded threshold (${threshold}%)`;
      default:
        return `Alert condition met: ${value} ${rule.condition.operator} ${threshold}`;
    }
  }

  /**
   * Extract value from data based on condition type
   */
  private extractValue(rule: AlertRule, data: MetricsUpdate | QueueUpdate): number {
    switch (rule.condition.type) {
      case 'queue_depth': {
        return (data as QueueUpdate).size;
      }
      case 'bounce_rate': {
        const metrics = data as MetricsUpdate;
        const total = metrics.delivered + metrics.bounced;
        return total > 0 ? (metrics.bounced / total) * 100 : 0;
      }
      case 'delivery_rate': {
        return (data as MetricsUpdate).throughput;
      }
      case 'system_health': {
        const m = data as MetricsUpdate;
        const totalMsgs = m.delivered + m.bounced + m.deferred;
        return totalMsgs > 0 ? (m.deferred / totalMsgs) * 100 : 0;
      }
      default:
        return 0;
    }
  }

  /**
   * Check if alert should be throttled
   */
  private shouldThrottle(rule: AlertRule): boolean {
    if (!rule.throttle) return false;

    const state = this.throttleState.get(rule.id);
    const now = Date.now();

    if (!state) return false;

    const windowElapsed = now - state.windowStart;
    if (windowElapsed > rule.throttle.period) {
      // Reset window
      return false;
    }

    return state.count >= rule.throttle.maxAlerts;
  }

  /**
   * Update throttle state
   */
  private updateThrottle(rule: AlertRule) {
    if (!rule.throttle) return;

    const now = Date.now();
    const state = this.throttleState.get(rule.id);

    if (!state || now - state.windowStart > rule.throttle.period) {
      this.throttleState.set(rule.id, {
        count: 1,
        windowStart: now,
      });
    } else {
      state.count++;
    }
  }

  /**
   * Get all alerts
   */
  getAlerts(options?: { acknowledged?: boolean; limit?: number }): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (options?.acknowledged !== undefined) {
      alerts = alerts.filter((a) => a.acknowledged === options.acknowledged);
    }

    alerts.sort((a, b) => b.timestamp - a.timestamp);

    if (options?.limit) {
      alerts = alerts.slice(0, options.limit);
    }

    return alerts;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    logger.info(`Alert acknowledged: ${alertId}`);
    this.emit('alert:acknowledged', alert);
    return true;
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(maxAge: number = 86400000) {
    // 24 hours default
    const now = Date.now();
    let cleared = 0;

    for (const [id, alert] of this.alerts.entries()) {
      if (now - alert.timestamp > maxAge) {
        this.alerts.delete(id);
        cleared++;
      }
    }

    if (cleared > 0) {
      logger.info(`Cleared ${cleared} old alerts`);
    }

    return cleared;
  }
}

export default new AlertEngine();
