/**
 * Alert Condition Builder Utilities
 * DSL builder for constructing alert conditions
 */

import type {
  AlertCondition,
  CompositeCondition,
  ComparisonOperator,
  TimeWindow,
} from '../types/alert';

export class ConditionBuilder {
  private conditions: (AlertCondition | CompositeCondition)[] = [];

  /**
   * Add a simple condition
   */
  when(metric: string, operator: ComparisonOperator, threshold: number, timeWindow?: TimeWindow): this {
    const condition: AlertCondition = {
      id: crypto.randomUUID(),
      metric,
      operator,
      threshold,
      ...(timeWindow !== undefined && { timeWindow }),
    };
    this.conditions.push(condition);
    return this;
  }

  /**
   * Combine conditions with AND
   */
  and(): this {
    if (this.conditions.length < 2) {
      throw new Error('AND requires at least 2 conditions');
    }
    const composite: CompositeCondition = {
      type: 'AND',
      conditions: [...this.conditions],
    };
    this.conditions = [composite];
    return this;
  }

  /**
   * Combine conditions with OR
   */
  or(): this {
    if (this.conditions.length < 2) {
      throw new Error('OR requires at least 2 conditions');
    }
    const composite: CompositeCondition = {
      type: 'OR',
      conditions: [...this.conditions],
    };
    this.conditions = [composite];
    return this;
  }

  /**
   * Build the final condition
   */
  build(): AlertCondition | CompositeCondition {
    if (this.conditions.length === 0) {
      throw new Error('No conditions defined');
    }
    if (this.conditions.length === 1) {
      const condition = this.conditions[0];
      if (!condition) {
        throw new Error('No conditions defined');
      }
      return condition;
    }
    // Default to AND if multiple conditions without explicit combinator
    return {
      type: 'AND',
      conditions: this.conditions,
    };
  }

  /**
   * Reset the builder
   */
  reset(): this {
    this.conditions = [];
    return this;
  }
}

/**
 * Helper function to create a condition builder
 */
export function createCondition(): ConditionBuilder {
  return new ConditionBuilder();
}

/**
 * Convert condition to human-readable string
 */
export function conditionToString(condition: AlertCondition | CompositeCondition): string {
  if ('type' in condition) {
    // Composite condition
    const subConditions = condition.conditions.map(c => conditionToString(c));
    return `(${subConditions.join(` ${condition.type} `)})`;
  } else {
    // Simple condition
    const timeWindow = condition.timeWindow ? ` for ${condition.timeWindow}` : '';
    return `${condition.metric} ${condition.operator} ${condition.threshold}${timeWindow}`;
  }
}

/**
 * Convert condition to query parameters
 */
export function conditionToQuery(condition: AlertCondition | CompositeCondition): Record<string, unknown> {
  if ('type' in condition) {
    // Composite condition
    return {
      type: 'composite',
      operator: condition.type,
      conditions: condition.conditions.map(c => conditionToQuery(c)),
    };
  } else {
    // Simple condition
    return {
      type: 'simple',
      metric: condition.metric,
      operator: condition.operator,
      threshold: condition.threshold,
      timeWindow: condition.timeWindow,
      groupBy: condition.groupBy,
    };
  }
}

/**
 * Validate condition structure
 */
export function isValidCondition(condition: unknown): condition is (AlertCondition | CompositeCondition) {
  if (!condition) return false;

  if (typeof condition !== 'object' || condition === null) return false;

  if ('type' in condition && (condition.type === 'AND' || condition.type === 'OR')) {
    // Composite condition
    return 'conditions' in condition && Array.isArray(condition.conditions) && condition.conditions.every(isValidCondition);
  } else {
    // Simple condition
    return (
      'metric' in condition &&
      'operator' in condition &&
      'threshold' in condition &&
      typeof (condition as Record<string, unknown>).metric === 'string' &&
      typeof (condition as Record<string, unknown>).operator === 'string' &&
      typeof (condition as Record<string, unknown>).threshold === 'number'
    );
  }
}

/**
 * Deep clone a condition
 */
export function cloneCondition(condition: AlertCondition | CompositeCondition): AlertCondition | CompositeCondition {
  return JSON.parse(JSON.stringify(condition));
}

/**
 * Preset condition templates
 */
export const CONDITION_TEMPLATES = {
  highQueueDepth: (): AlertCondition => ({
    id: crypto.randomUUID(),
    metric: 'queue_depth',
    operator: '>',
    threshold: 1000,
    timeWindow: '15m',
  }),

  highBounceRate: (): AlertCondition => ({
    id: crypto.randomUUID(),
    metric: 'bounce_rate',
    operator: '>',
    threshold: 5,
    timeWindow: '1h',
  }),

  lowDeliveryRate: (): AlertCondition => ({
    id: crypto.randomUUID(),
    metric: 'delivery_rate',
    operator: '<',
    threshold: 95,
    timeWindow: '1h',
  }),

  highSystemCPU: (): AlertCondition => ({
    id: crypto.randomUUID(),
    metric: 'system_cpu',
    operator: '>',
    threshold: 80,
    timeWindow: '5m',
  }),

  highSystemMemory: (): AlertCondition => ({
    id: crypto.randomUUID(),
    metric: 'system_memory',
    operator: '>',
    threshold: 85,
    timeWindow: '5m',
  }),

  highErrorRate: (): AlertCondition => ({
    id: crypto.randomUUID(),
    metric: 'error_rate',
    operator: '>',
    threshold: 1,
    timeWindow: '15m',
  }),
};
