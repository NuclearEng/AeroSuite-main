export interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: string;
  type: PerformanceMetricType;
  metadata?: Record<string, unknown>;
}

export enum PerformanceMetricType {
  NAVIGATION = 'navigation',
  RESOURCE = 'resource',
  PAINT = 'paint',
  LAYOUT = 'layout',
  FIRST_INPUT = 'first-input',
  LONG_TASK = 'long-task',
  MEMORY = 'memory',
  CUSTOM = 'custom'
}

export interface PerformanceMetricData {
  name: string;
  type: PerformanceMetricType;
  value: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceBudget {
  metric: string;
  threshold: number;
  condition: 'less-than' | 'greater-than' | 'equals';
}

export interface PerformanceMonitoringService {
  trackMetric: (metric: PerformanceMetricData) => Promise<void>;
  trackNavigationTiming: () => Promise<void>;
  trackResourceTiming: () => Promise<void>;
  trackPaintTiming: () => Promise<void>;
  trackLayoutShift: () => Promise<void>;
  trackFirstInput: () => Promise<void>;
  trackLongTasks: () => Promise<void>;
  trackMemoryUsage: () => Promise<void>;
  trackCustomMetric: (name: string, value: number, metadata?: Record<string, any>) => Promise<void>;
  getPerformanceMetrics: (period?: string) => Promise<any>;
  checkPerformanceBudgets: (metrics: Record<string, number>) => { passed: boolean; violations: any[] };
  detectRegressions: (currentMetrics: Record<string, number>, baselineMetrics: Record<string, number>, threshold?: number) => any[];
}