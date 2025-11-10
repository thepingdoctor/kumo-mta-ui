/**
 * Client-side data aggregation utilities
 */

export interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
}

export interface AggregatedData {
  sum: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

/**
 * Aggregate time series data by time window
 */
export const aggregateByTimeWindow = (
  data: TimeSeriesDataPoint[],
  windowMinutes: number
): TimeSeriesDataPoint[] => {
  if (data.length === 0) return [];

  const windowMs = windowMinutes * 60 * 1000;
  const aggregated: TimeSeriesDataPoint[] = [];

  // Sort by timestamp
  const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  let currentWindow: TimeSeriesDataPoint[] = [];
  const firstPoint = sorted[0];
  if (!firstPoint) return [];

  let windowStart = new Date(
    Math.floor(firstPoint.timestamp.getTime() / windowMs) * windowMs
  );

  for (const point of sorted) {
    const pointWindow = new Date(
      Math.floor(point.timestamp.getTime() / windowMs) * windowMs
    );

    if (pointWindow.getTime() !== windowStart.getTime()) {
      // Process current window
      if (currentWindow.length > 0) {
        aggregated.push({
          timestamp: windowStart,
          value: currentWindow.reduce((sum, p) => sum + p.value, 0) / currentWindow.length,
        });
      }

      // Start new window
      windowStart = pointWindow;
      currentWindow = [];
    }

    currentWindow.push(point);
  }

  // Process final window
  if (currentWindow.length > 0) {
    aggregated.push({
      timestamp: windowStart,
      value: currentWindow.reduce((sum, p) => sum + p.value, 0) / currentWindow.length,
    });
  }

  return aggregated;
};

/**
 * Calculate statistics for a dataset
 */
export const calculateStatistics = (values: number[]): AggregatedData => {
  if (values.length === 0) {
    return { sum: 0, average: 0, min: 0, max: 0, count: 0 };
  }

  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  return {
    sum,
    average,
    min,
    max,
    count: values.length,
  };
};

/**
 * Calculate moving average
 */
export const calculateMovingAverage = (
  data: TimeSeriesDataPoint[],
  windowSize: number
): TimeSeriesDataPoint[] => {
  if (data.length < windowSize) return [];

  const result: TimeSeriesDataPoint[] = [];

  for (let i = windowSize - 1; i < data.length; i++) {
    const window = data.slice(i - windowSize + 1, i + 1);
    const average = window.reduce((sum, p) => sum + p.value, 0) / windowSize;
    const dataPoint = data[i];

    if (dataPoint) {
      result.push({
        timestamp: dataPoint.timestamp,
        value: average,
      });
    }
  }

  return result;
};

/**
 * Group data by key
 */
export const groupBy = <T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
};

/**
 * Calculate percentiles
 */
export const calculatePercentile = (values: number[], percentile: number): number => {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  const value = sorted[Math.max(0, index)];
  return value ?? 0;
};

/**
 * Detect outliers using IQR method
 */
export const detectOutliers = (values: number[]): number[] => {
  if (values.length < 4) return [];

  const q1 = calculatePercentile(values, 25);
  const q3 = calculatePercentile(values, 75);
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return values.filter((val) => val < lowerBound || val > upperBound);
};

/**
 * Fill missing time points with interpolation
 */
export const fillMissingTimePoints = (
  data: TimeSeriesDataPoint[],
  intervalMs: number
): TimeSeriesDataPoint[] => {
  if (data.length === 0) return [];

  const sorted = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const firstPoint = sorted[0];
  if (!firstPoint) return [];

  const result: TimeSeriesDataPoint[] = [firstPoint];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    if (!prev || !curr) continue;

    const gap = curr.timestamp.getTime() - prev.timestamp.getTime();

    if (gap > intervalMs) {
      // Fill missing points with linear interpolation
      const steps = Math.floor(gap / intervalMs);
      const valueStep = (curr.value - prev.value) / steps;

      for (let j = 1; j < steps; j++) {
        result.push({
          timestamp: new Date(prev.timestamp.getTime() + j * intervalMs),
          value: prev.value + j * valueStep,
        });
      }
    }

    result.push(curr);
  }

  return result;
};
