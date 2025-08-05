import { 
  LayoutShift, 
  PerformanceMetricType,
  PerformanceMetricData,
  PerformanceMonitoringService,
  PerformanceBudget,
  PerformanceRegression,
  PerformanceMetricsResponse
} from '../types/performance';
import api from './api';

class PerformanceMonitor implements PerformanceMonitoringService {
  private cumulativeLayoutShift = 0;
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupLayoutShiftObserver();
    }
  }

  private setupLayoutShiftObserver(): void {
    if (!PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
      return;
    }

    try {
      const observer = new PerformanceObserver(this.handleLayoutShifts.bind(this));
      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (_error) {
      console.error('Failed to initialize layout shift observer:', _error);
    }
  }

  private handleLayoutShifts(list: PerformanceObserverEntryList): void {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'layout-shift') {
        this.processLayoutShift(entry as LayoutShift);
      }
    }
  }

  private processLayoutShift(layoutShift: LayoutShift): void {
    if (layoutShift.hadRecentInput) {
      return;
    }

    this.cumulativeLayoutShift += layoutShift.value;
    void this.trackMetric({
      name: 'layoutShift',
      type: PerformanceMetricType.LAYOUT,
      value: layoutShift.value,
      timestamp: new Date().toISOString(),
      metadata: {
        cumulativeLayoutShift: this.cumulativeLayoutShift
      }
    });
  }

  public async trackMetric(metric: PerformanceMetricData): Promise<void> {
    try {
      await api.post('/monitoring/performance', { metrics: [metric] });
    } catch (error) {
      console.error('Failed to track performance metric:', error);
      this.storeMetricForRetry(metric);
    }
  }

  public async trackNavigationTiming(): Promise<void> {
    try {
      if (!window.performance || !window.performance.timing) {
        console.warn('Performance API not supported');
        return;
      }

      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;

      const metrics = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        dom: timing.domComplete - timing.domLoading,
        domInteractive: timing.domInteractive - navigationStart,
        loadEvent: timing.loadEventEnd - timing.loadEventStart,
        total: timing.loadEventEnd - navigationStart
      };

      for (const [name, value] of Object.entries(metrics)) {
        if (value >= 0) {
          await this.trackMetric({
            name,
            type: PerformanceMetricType.NAVIGATION,
            value,
            timestamp: new Date().toISOString(),
            metadata: {
              url: window.location.href
            }
          });
        }
      }
    } catch (_error) {
      console.error('Error tracking navigation timing:', _error);
    }
  }

  public async trackResourceTiming(): Promise<void> {
    try {
      if (!window.performance || !window.performance.getEntriesByType) {
        console.warn('Performance API not supported');
        return;
      }

      const resources = window.performance.getEntriesByType('resource');
      
      for (const resource of resources) {
        await this.trackMetric({
          name: 'resourceTiming',
          type: PerformanceMetricType.RESOURCE,
          value: resource.duration,
          timestamp: new Date().toISOString(),
          metadata: {
            url: resource.name,
            initiatorType: (resource as any).initiatorType
          }
        });
      }

      window.performance.clearResourceTimings();
    } catch (_error) {
      console.error('Error tracking resource timing:', _error);
    }
  }

  public async trackPaintTiming(): Promise<void> {
    try {
      if (!window.performance || !window.performance.getEntriesByType) {
        console.warn('Performance API not supported');
        return;
      }

      const paintEntries = window.performance.getEntriesByType('paint');
      
      for (const entry of paintEntries) {
        await this.trackMetric({
          name: entry.name,
          type: PerformanceMetricType.PAINT,
          value: entry.startTime,
          timestamp: new Date().toISOString(),
          metadata: {
            url: window.location.href
          }
        });
      }
    } catch (_error) {
      console.error('Error tracking paint timing:', _error);
    }
  }

  public async trackLayoutShift(): Promise<void> {
    // Already handled by observer
  }

  public async trackFirstInput(): Promise<void> {
    try {
      if (!window.PerformanceObserver) {
        console.warn('PerformanceObserver not supported');
        return;
      }

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          void this.trackMetric({
            name: 'firstInputDelay',
            type: PerformanceMetricType.FIRST_INPUT,
            value: (entry as any).processingStart - entry.startTime,
            timestamp: new Date().toISOString(),
            metadata: {
              url: window.location.href
            }
          });
        }
        observer.disconnect();
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (_error) {
      console.error('Error tracking first input delay:', _error);
    }
  }

  public async trackLongTasks(): Promise<void> {
    try {
      if (!window.PerformanceObserver) {
        console.warn('PerformanceObserver not supported');
        return;
      }

      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          void this.trackMetric({
            name: 'longTask',
            type: PerformanceMetricType.LONG_TASK,
            value: entry.duration,
            timestamp: new Date().toISOString(),
            metadata: {
              url: window.location.href
            }
          });
        }
      });

      observer.observe({ type: 'longtask', buffered: true });
    } catch (_error) {
      console.error('Error tracking long tasks:', _error);
    }
  }

  public async trackMemoryUsage(): Promise<void> {
    try {
      if (!window.performance || !(window.performance as any).memory) {
        console.warn('Memory API not supported');
        return;
      }

      const memory = (window.performance as any).memory;
      
      await this.trackMetric({
        name: 'memoryUsage',
        type: PerformanceMetricType.MEMORY,
        value: memory.usedJSHeapSize,
        timestamp: new Date().toISOString(),
        metadata: {
          url: window.location.href,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        }
      });
    } catch (_error) {
      console.error('Error tracking memory usage:', _error);
    }
  }

  public async trackCustomMetric(
    name: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackMetric({
      name,
      type: PerformanceMetricType.CUSTOM,
      value,
      timestamp: new Date().toISOString(),
      metadata: {
        url: window.location.href,
        ...metadata
      }
    });
  }

  public async getPerformanceMetrics(period: string = '7d'): Promise<PerformanceMetricsResponse> {
    try {
      const response = await api.get<PerformanceMetricsResponse>(`/monitoring/performance-metrics?period=${period}`);
      return response;
    } catch (_error) {
      console.error('Error fetching performance metrics:', _error);
      throw _error;
    }
  }

  public checkPerformanceBudgets(metrics: Record<string, number>): { passed: boolean; violations: PerformanceBudget[] } {
    const budgets: PerformanceBudget[] = [
      { metric: 'firstContentfulPaint', threshold: 1000, condition: 'less-than' },
      { metric: 'largestContentfulPaint', threshold: 2500, condition: 'less-than' },
      { metric: 'firstInputDelay', threshold: 100, condition: 'less-than' },
      { metric: 'cumulativeLayoutShift', threshold: 0.1, condition: 'less-than' }
    ];

    const violations = budgets.filter(budget => {
      const value = metrics[budget.metric];
      if (value === undefined) return false;

      switch (budget.condition) {
        case 'less-than':
          return value >= budget.threshold;
        case 'greater-than':
          return value <= budget.threshold;
        case 'equals':
          return value !== budget.threshold;
        default:
          return false;
      }
    }).map(budget => ({
      metric: budget.metric,
      current: metrics[budget.metric],
      threshold: budget.threshold,
      condition: budget.condition
    }));

    return {
      passed: violations.length === 0,
      violations
    };
  }

  public detectRegressions(
    currentMetrics: Record<string, number>,
    baselineMetrics: Record<string, number>,
    threshold: number = 10
  ): PerformanceRegression[] {
    const regressions: PerformanceRegression[] = [];

    for (const [metric, baselineValue] of Object.entries(baselineMetrics)) {
      const currentValue = currentMetrics[metric];
      if (currentValue === undefined) continue;

      const percentChange = ((currentValue - baselineValue) / baselineValue) * 100;

      if (percentChange > threshold) {
        regressions.push({
          metric,
          currentValue,
          baselineValue,
          percentChange,
          threshold
        });
      }
    }

    return regressions;
  }

  private storeMetricForRetry(metric: PerformanceMetricData): void {
    try {
      const storedMetrics = localStorage.getItem('aerosuite_pending_metrics');
      const metrics = storedMetrics ? JSON.parse(storedMetrics) : [];
      metrics.push(metric);
      
      const limitedMetrics = metrics.slice(-100);
      localStorage.setItem('aerosuite_pending_metrics', JSON.stringify(limitedMetrics));
    } catch (_error) {
      console.error('Error storing metric for retry:', _error);
    }
  }

  public disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;