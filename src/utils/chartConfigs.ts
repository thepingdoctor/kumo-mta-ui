/**
 * Reusable Chart.js configurations for analytics
 */

import type { ChartOptions } from 'chart.js';

/**
 * Base chart configuration with dark mode support
 */
export const baseChartConfig: Partial<ChartOptions> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 15,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      displayColors: true,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: ${value.toLocaleString()}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        callback: (value) => {
          if (typeof value === 'number') {
            return value.toLocaleString();
          }
          return value;
        },
      },
    },
  },
};

/**
 * Line chart configuration for trends
 */
export const trendLineConfig: Partial<ChartOptions<'line'>> = {
  ...baseChartConfig,
  elements: {
    line: {
      tension: 0.4, // Smooth curves
      borderWidth: 2,
    },
    point: {
      radius: 3,
      hoverRadius: 6,
    },
  },
  plugins: {
    ...baseChartConfig.plugins,
    filler: {
      propagate: false,
    },
  },
};

/**
 * Bar chart configuration
 */
export const barChartConfig: Partial<ChartOptions<'bar'>> = {
  ...baseChartConfig,
  plugins: {
    ...baseChartConfig.plugins,
    legend: {
      display: false,
    },
  },
};

/**
 * Pie/Doughnut chart configuration
 */
export const pieChartConfig: Partial<ChartOptions<'pie' | 'doughnut'>> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        usePointStyle: true,
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      callbacks: {
        label: (context) => {
          const label = context.label || '';
          const value = context.parsed;
          const total = context.dataset.data.reduce((a, b) => a + (b as number), 0);
          const percentage = ((value / total) * 100).toFixed(1);
          return `${label}: ${value.toLocaleString()} (${percentage}%)`;
        },
      },
    },
  },
};

/**
 * Heatmap colors
 */
export const heatmapColors = {
  low: '#10B981', // Green
  medium: '#F59E0B', // Amber
  high: '#EF4444', // Red
};

/**
 * Color palette for charts
 */
export const chartColors = {
  primary: '#3B82F6', // Blue
  success: '#10B981', // Green
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  info: '#06B6D4', // Cyan
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  gray: '#6B7280',
};

/**
 * Get color by index (cycles through palette)
 */
export const getColorByIndex = (index: number): string => {
  const colors = Object.values(chartColors);
  return colors[index % colors.length];
};

/**
 * Generate gradient for area charts
 */
export const createGradient = (
  ctx: CanvasRenderingContext2D,
  color: string,
  alpha = 0.2
): CanvasGradient => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, `${color}${Math.floor(alpha * 255).toString(16)}`);
  gradient.addColorStop(1, `${color}00`);
  return gradient;
};

/**
 * Time range labels
 */
export const getTimeLabels = (hours: number): string[] => {
  const labels: string[] = [];
  const now = new Date();

  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    labels.push(
      time.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    );
  }

  return labels;
};

/**
 * Date range labels
 */
export const getDateLabels = (days: number): string[] => {
  const labels: string[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    labels.push(
      date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    );
  }

  return labels;
};
