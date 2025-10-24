/**
 * Prometheus Metrics Parser for KumoMTA
 * Parses Prometheus JSON format from /metrics.json endpoint
 */

export interface PrometheusMetric {
  value: number;
  labels?: Record<string, string>;
}

export interface ParsedMetrics {
  messages_sent?: number;
  bounces?: number;
  delayed?: number;
  throughput?: number;
  active_connections?: number;
  [key: string]: number | undefined;
}

/**
 * Parses Prometheus JSON format into a flat metrics object
 */
export const parsePrometheusMetrics = (data: Record<string, PrometheusMetric | { value: number }>): ParsedMetrics => {
  const metrics: ParsedMetrics = {};

  for (const [key, metricData] of Object.entries(data)) {
    // Extract value from metric object
    const value = typeof metricData === 'object' && 'value' in metricData
      ? metricData.value
      : 0;

    // Map Prometheus metric names to UI-friendly names
    if (key.includes('messages_sent')) {
      metrics.messages_sent = value;
    } else if (key.includes('bounce')) {
      metrics.bounces = value;
    } else if (key.includes('delayed')) {
      metrics.delayed = value;
    } else if (key.includes('throughput')) {
      metrics.throughput = value;
    } else if (key.includes('connection') && key.includes('count')) {
      metrics.active_connections = value;
    }

    // Also store original metric name
    metrics[key] = value;
  }

  return metrics;
};

/**
 * Extracts specific metric by name from Prometheus data
 */
export const getMetricValue = (
  data: Record<string, PrometheusMetric | { value: number }>,
  metricName: string
): number => {
  const metric = data[metricName];
  if (!metric) return 0;

  return typeof metric === 'object' && 'value' in metric ? metric.value : 0;
};
