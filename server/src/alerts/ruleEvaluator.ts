/**
 * Alert Rule Evaluation Logic
 */

import { AlertRule, AlertCondition, MetricsUpdate, QueueUpdate } from '../types/index.js';
import logger from '../utils/logger.js';

export class RuleEvaluator {
  private metricsHistory: MetricsUpdate[] = [];
  private queueHistory: Map<string, QueueUpdate[]> = new Map();
  private readonly maxHistorySize = 1000;

  /**
   * Evaluate a rule against current data
   */
  evaluateRule(rule: AlertRule, currentData: MetricsUpdate | QueueUpdate): boolean {
    if (!rule.enabled) {
      return false;
    }

    const { condition } = rule;

    try {
      switch (condition.type) {
        case 'queue_depth':
          return this.evaluateQueueDepth(condition, currentData as QueueUpdate);
        case 'bounce_rate':
          return this.evaluateBounceRate(condition, currentData as MetricsUpdate);
        case 'delivery_rate':
          return this.evaluateDeliveryRate(condition, currentData as MetricsUpdate);
        case 'system_health':
          return this.evaluateSystemHealth(condition, currentData as MetricsUpdate);
        default:
          logger.warn(`Unknown condition type: ${condition.type}`);
          return false;
      }
    } catch (error) {
      logger.error(`Error evaluating rule ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * Evaluate queue depth condition
   */
  private evaluateQueueDepth(condition: AlertCondition, data: QueueUpdate): boolean {
    const value = data.size;
    return this.compareValue(value, condition.operator, condition.threshold);
  }

  /**
   * Evaluate bounce rate condition
   */
  private evaluateBounceRate(condition: AlertCondition, data: MetricsUpdate): boolean {
    this.addToMetricsHistory(data);

    if (condition.timeWindow) {
      const windowData = this.getMetricsInWindow(condition.timeWindow);
      if (windowData.length < 2) return false;

      const totalMessages = windowData.reduce((sum, m) => sum + m.delivered + m.bounced, 0);
      const totalBounced = windowData.reduce((sum, m) => sum + m.bounced, 0);

      if (totalMessages === 0) return false;

      const bounceRate = (totalBounced / totalMessages) * 100;
      return this.compareValue(bounceRate, condition.operator, condition.threshold);
    } else {
      const totalMessages = data.delivered + data.bounced;
      if (totalMessages === 0) return false;

      const bounceRate = (data.bounced / totalMessages) * 100;
      return this.compareValue(bounceRate, condition.operator, condition.threshold);
    }
  }

  /**
   * Evaluate delivery rate condition
   */
  private evaluateDeliveryRate(condition: AlertCondition, data: MetricsUpdate): boolean {
    this.addToMetricsHistory(data);

    if (condition.timeWindow) {
      const windowData = this.getMetricsInWindow(condition.timeWindow);
      if (windowData.length < 2) return false;

      const avgDeliveryRate = this.calculateAverageDeliveryRate(windowData);
      return this.compareValue(avgDeliveryRate, condition.operator, condition.threshold);
    } else {
      return this.compareValue(data.throughput, condition.operator, condition.threshold);
    }
  }

  /**
   * Evaluate system health condition
   */
  private evaluateSystemHealth(condition: AlertCondition, data: MetricsUpdate): boolean {
    // System health can be measured by deferred message ratio
    const totalMessages = data.delivered + data.bounced + data.deferred;
    if (totalMessages === 0) return false;

    const deferredRatio = (data.deferred / totalMessages) * 100;
    return this.compareValue(deferredRatio, condition.operator, condition.threshold);
  }

  /**
   * Compare value against threshold with operator
   */
  private compareValue(
    value: number,
    operator: AlertCondition['operator'],
    threshold: number
  ): boolean {
    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      default:
        return false;
    }
  }

  /**
   * Add metrics to history
   */
  private addToMetricsHistory(metrics: MetricsUpdate) {
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  /**
   * Get metrics within time window
   */
  private getMetricsInWindow(windowMs: number): MetricsUpdate[] {
    const now = Date.now();
    return this.metricsHistory.filter((m) => now - m.timestamp <= windowMs);
  }

  /**
   * Calculate average delivery rate
   */
  private calculateAverageDeliveryRate(metrics: MetricsUpdate[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.throughput, 0);
    return sum / metrics.length;
  }

  /**
   * Add queue update to history
   */
  addQueueUpdate(update: QueueUpdate) {
    if (!this.queueHistory.has(update.queueName)) {
      this.queueHistory.set(update.queueName, []);
    }

    const history = this.queueHistory.get(update.queueName)!;
    history.push(update);

    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Clear history (for testing)
   */
  clearHistory() {
    this.metricsHistory = [];
    this.queueHistory.clear();
  }
}

export default new RuleEvaluator();
