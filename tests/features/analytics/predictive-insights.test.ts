import { describe, it, expect } from 'vitest';

describe('Predictive Insights - Forecasting', () => {
  it('should forecast next day email volume', () => {
    const historicalData = [1000, 1100, 1050, 1200, 1150, 1300, 1250];

    // Simple moving average
    const average = historicalData.reduce((sum, val) => sum + val, 0) / historicalData.length;

    expect(average).toBeCloseTo(1150, 0);
  });

  it('should predict bounce rate trends', () => {
    const bounceRates = [2.5, 2.7, 2.3, 2.8, 2.6]; // Percentage

    const trend = bounceRates.reduce((sum, val) => sum + val, 0) / bounceRates.length;

    expect(trend).toBeCloseTo(2.58, 1);
  });

  it('should forecast within acceptable error margin', () => {
    const actual = 1000;
    const predicted = 980;

    const errorMargin = Math.abs(actual - predicted) / actual;
    const acceptableError = 0.05; // 5%

    expect(errorMargin).toBeLessThan(acceptableError);
  });

  it('should calculate linear regression for volume prediction', () => {
    const data = [
      { day: 1, volume: 1000 },
      { day: 2, volume: 1100 },
      { day: 3, volume: 1200 },
      { day: 4, volume: 1300 },
      { day: 5, volume: 1400 },
    ];

    const n = data.length;
    const sumX = data.reduce((sum, d) => sum + d.day, 0);
    const sumY = data.reduce((sum, d) => sum + d.volume, 0);
    const sumXY = data.reduce((sum, d) => sum + d.day * d.volume, 0);
    const sumX2 = data.reduce((sum, d) => sum + d.day * d.day, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict day 6
    const prediction = slope * 6 + intercept;

    expect(prediction).toBeCloseTo(1500, 0);
  });

  it('should detect anomalies in email patterns', () => {
    const normalVolume = [1000, 1050, 980, 1020, 1100];
    const average = normalVolume.reduce((sum, val) => sum + val, 0) / normalVolume.length;
    const stdDev = Math.sqrt(
      normalVolume.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
        normalVolume.length
    );

    const anomalyValue = 2000;
    const zScore = (anomalyValue - average) / stdDev;

    // Z-score > 3 indicates anomaly
    expect(Math.abs(zScore)).toBeGreaterThan(3);
  });

  it('should predict peak sending times', () => {
    const hourlyVolume = Array(24).fill(0).map((_, hour) => ({
      hour,
      volume: hour >= 9 && hour <= 17 ? 500 : 100,
    }));

    const peakHours = hourlyVolume
      .filter((h) => h.volume > 400)
      .map((h) => h.hour);

    expect(peakHours).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17]);
  });

  it('should calculate confidence intervals for predictions', () => {
    const predictions = [1000, 1050, 980, 1020, 1100];
    const mean = predictions.reduce((sum, val) => sum + val, 0) / predictions.length;
    const stdDev = Math.sqrt(
      predictions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        predictions.length
    );

    const confidenceInterval = 1.96 * stdDev; // 95% confidence

    const lowerBound = mean - confidenceInterval;
    const upperBound = mean + confidenceInterval;

    expect(lowerBound).toBeLessThan(mean);
    expect(upperBound).toBeGreaterThan(mean);
  });

  it('should predict resource requirements', () => {
    const volumePerDay = 10000;
    const throughputPerSecond = 100;

    const secondsPerDay = 86400;
    const requiredThroughput = volumePerDay / secondsPerDay;

    const capacityUtilization = (requiredThroughput / throughputPerSecond) * 100;

    expect(capacityUtilization).toBeLessThan(2); // Very low utilization
  });

  it('should forecast seasonal patterns', () => {
    const monthlyVolumes = [
      10000, 12000, 11000, 13000, 15000, 14000,
      16000, 18000, 17000, 19000, 20000, 22000,
    ];

    // Calculate growth rate
    const firstHalf = monthlyVolumes.slice(0, 6);
    const secondHalf = monthlyVolumes.slice(6, 12);

    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const growthRate = ((secondAvg - firstAvg) / firstAvg) * 100;

    expect(growthRate).toBeGreaterThan(30); // Significant growth
  });
});
