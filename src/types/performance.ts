/**
 * Performance monitoring types
 */

// Performance metric types
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

// Layout shift entry type
export interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

// Performance metric data
export interface PerformanceMetricData {
  name: string;
  type: PerformanceMetricType;
  value: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Performance monitoring service interface
export interface PerformanceMonitoringService {
  trackMetric(metric: PerformanceMetricData): Promise<void>;
  trackNavigationTiming(): Promise<void>;
  trackResourceTiming(): Promise<void>;
  trackPaintTiming(): Promise<void>;
  trackLayoutShift(): Promise<void>;
  trackFirstInput(): Promise<void>;
  trackLongTasks(): Promise<void>;
  trackMemoryUsage(): Promise<void>;
  trackCustomMetric(name: string, value: number, metadata?: Record<string, any>): Promise<void>;
  getPerformanceMetrics(period?: string): Promise<any>;
  checkPerformanceBudgets(metrics: Record<string, number>): { passed: boolean; violations: any[] };
  detectRegressions(currentMetrics: Record<string, number>, baselineMetrics: Record<string, number>, threshold?: number): any[];
  disconnect(): void;
}

// Performance budget condition type
export type BudgetCondition = 'less-than' | 'greater-than' | 'equals';

// Performance budget interface
export interface PerformanceBudget {
  metric: string;
  threshold: number;
  condition: BudgetCondition;
}

// Performance regression interface
export interface PerformanceRegression {
  metric: string;
  currentValue: number;
  baselineValue: number;
  percentChange: number;
  threshold: number;
}

// Performance metrics response interface
export interface PerformanceMetricsResponse {
  metrics: PerformanceMetricData[];
  summary: {
    averages: Record<string, number>;
    percentiles: Record<string, Record<string, number>>;
  };
  period: string;
}