/**
 * Performance Monitoring Service
 * 
 * This service provides functionality for monitoring application performance
 * metrics, tracking performance budgets, and detecting regressions.
 */

import api from './api';

// Types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  threshold?: number;
  baseline?: number;
  change?: number;
  changePercent?: number;
  status?: 'good' | 'warning' | 'critical';
}

export interface PerformanceMetricsResponse {
  currentMetrics: {
    [key: string]: PerformanceMetric;
  };
  baselineMetrics: {
    [key: string]: PerformanceMetric;
  };
  historicalData: {
    dates: string[];
    metrics: {
      [key: string]: number[];
    };
  };
}

export interface PerformanceBudget {
  id: string;
  metric: string;
  threshold: number;
  unit: string;
  status: 'within-budget' | 'exceeding' | 'critical';
  current: number;
  trend: 'improving' | 'stable' | 'degrading';
}

export interface PerformanceRegression {
  id: string;
  metric: string;
  date: string;
  previousValue: number;
  currentValue: number;
  changePercent: number;
  severity: 'minor' | 'moderate' | 'severe';
  status: 'open' | 'investigating' | 'resolved' | 'false-positive';
  affectedComponents: string[];
}

// Initialize performance monitoring
export const initPerformanceMonitoring = (): void => {
  // In a real app, this would set up real-time performance monitoring
  console.log('Performance monitoring initialized');
  
  // Set up performance observers if in browser environment
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // Core Web Vitals
      const coreWebVitalsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          // Report entry to analytics
          console.debug('Core Web Vital:', entry.toJSON());
        });
      });
      
      coreWebVitalsObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      coreWebVitalsObserver.observe({ type: 'first-input', buffered: true });
      coreWebVitalsObserver.observe({ type: 'layout-shift', buffered: true });
      
      // Navigation timing
      const navigationObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          // Report navigation timing to analytics
          console.debug('Navigation timing:', entry.toJSON());
        });
      });
      
      navigationObserver.observe({ type: 'navigation', buffered: true });
      
      // Resource timing
      const resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          // Filter and report significant resource timing entries
          if ((entry as PerformanceResourceTiming).duration > 500) {
            console.debug('Slow resource:', entry.toJSON());
          }
        });
      });
      
      resourceObserver.observe({ type: 'resource', buffered: true });
      
    } catch (e) {
      console.error('Error setting up performance observers:', e);
    }
  }
};

class PerformanceMonitoringService {
  /**
   * Get performance metrics for a specified time period
   * @param period Time period ('24h', '7d', '30d', etc.)
   */
  async getPerformanceMetrics(period: string = '7d'): Promise<PerformanceMetricsResponse> {
    try {
      // In a real implementation, this would call the API
      // For now, return mock data
      return this.getMockPerformanceMetrics();
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      throw new Error('Failed to fetch performance metrics');
    }
  }
  
  /**
   * Get performance budgets
   */
  async getPerformanceBudgets(): Promise<PerformanceBudget[]> {
    try {
      // In a real implementation, this would call the API
      // For now, return mock data
      return this.getMockPerformanceBudgets();
    } catch (error) {
      console.error('Error fetching performance budgets:', error);
      throw new Error('Failed to fetch performance budgets');
    }
  }
  
  /**
   * Get performance regressions
   */
  async getPerformanceRegressions(): Promise<PerformanceRegression[]> {
    try {
      // In a real implementation, this would call the API
      // For now, return mock data
      return this.getMockPerformanceRegressions();
    } catch (error) {
      console.error('Error fetching performance regressions:', error);
      throw new Error('Failed to fetch performance regressions');
    }
  }
  
  /**
   * Mock performance metrics data
   */
  private getMockPerformanceMetrics(): PerformanceMetricsResponse {
    return {
      currentMetrics: {
        'ttfb': {
          name: 'Time to First Byte',
          value: 120,
          unit: 'ms',
          threshold: 200,
          baseline: 150,
          change: -30,
          changePercent: -20,
          status: 'good'
        },
        'fcp': {
          name: 'First Contentful Paint',
          value: 1200,
          unit: 'ms',
          threshold: 1800,
          baseline: 1100,
          change: 100,
          changePercent: 9.1,
          status: 'good'
        },
        'lcp': {
          name: 'Largest Contentful Paint',
          value: 2500,
          unit: 'ms',
          threshold: 2500,
          baseline: 2200,
          change: 300,
          changePercent: 13.6,
          status: 'warning'
        },
        'fid': {
          name: 'First Input Delay',
          value: 80,
          unit: 'ms',
          threshold: 100,
          baseline: 70,
          change: 10,
          changePercent: 14.3,
          status: 'good'
        },
        'cls': {
          name: 'Cumulative Layout Shift',
          value: 0.12,
          unit: '',
          threshold: 0.1,
          baseline: 0.08,
          change: 0.04,
          changePercent: 50,
          status: 'warning'
        },
        'bundle_size': {
          name: 'JS Bundle Size',
          value: 320,
          unit: 'KB',
          threshold: 350,
          baseline: 310,
          change: 10,
          changePercent: 3.2,
          status: 'good'
        }
      },
      baselineMetrics: {
        'ttfb': {
          name: 'Time to First Byte',
          value: 150,
          unit: 'ms'
        },
        'fcp': {
          name: 'First Contentful Paint',
          value: 1100,
          unit: 'ms'
        },
        'lcp': {
          name: 'Largest Contentful Paint',
          value: 2200,
          unit: 'ms'
        },
        'fid': {
          name: 'First Input Delay',
          value: 70,
          unit: 'ms'
        },
        'cls': {
          name: 'Cumulative Layout Shift',
          value: 0.08,
          unit: ''
        },
        'bundle_size': {
          name: 'JS Bundle Size',
          value: 310,
          unit: 'KB'
        }
      },
      historicalData: {
        dates: ['2023-01-01', '2023-01-08', '2023-01-15', '2023-01-22', '2023-01-29', '2023-02-05', '2023-02-12'],
        metrics: {
          'ttfb': [180, 165, 155, 160, 145, 135, 120],
          'fcp': [1300, 1250, 1200, 1150, 1180, 1220, 1200],
          'lcp': [2400, 2350, 2300, 2250, 2300, 2400, 2500],
          'fid': [90, 85, 75, 72, 78, 82, 80],
          'cls': [0.05, 0.06, 0.07, 0.08, 0.09, 0.11, 0.12],
          'bundle_size': [290, 295, 300, 305, 310, 315, 320]
        }
      }
    };
  }
  
  /**
   * Mock performance budgets data
   */
  private getMockPerformanceBudgets(): PerformanceBudget[] {
    return [
      {
        id: '1',
        metric: 'Time to First Byte',
        threshold: 200,
        unit: 'ms',
        status: 'within-budget',
        current: 120,
        trend: 'improving'
      },
      {
        id: '2',
        metric: 'First Contentful Paint',
        threshold: 1800,
        unit: 'ms',
        status: 'within-budget',
        current: 1200,
        trend: 'stable'
      },
      {
        id: '3',
        metric: 'Largest Contentful Paint',
        threshold: 2500,
        unit: 'ms',
        status: 'within-budget',
        current: 2500,
        trend: 'degrading'
      },
      {
        id: '4',
        metric: 'First Input Delay',
        threshold: 100,
        unit: 'ms',
        status: 'within-budget',
        current: 80,
        trend: 'stable'
      },
      {
        id: '5',
        metric: 'Cumulative Layout Shift',
        threshold: 0.1,
        unit: '',
        status: 'exceeding',
        current: 0.12,
        trend: 'degrading'
      },
      {
        id: '6',
        metric: 'JS Bundle Size',
        threshold: 350,
        unit: 'KB',
        status: 'within-budget',
        current: 320,
        trend: 'degrading'
      }
    ];
  }
  
  /**
   * Mock performance regressions data
   */
  private getMockPerformanceRegressions(): PerformanceRegression[] {
    return [
      {
        id: '1',
        metric: 'Largest Contentful Paint',
        date: '2023-02-10',
        previousValue: 2200,
        currentValue: 2500,
        changePercent: 13.6,
        severity: 'moderate',
        status: 'open',
        affectedComponents: ['Dashboard', 'Reports']
      },
      {
        id: '2',
        metric: 'Cumulative Layout Shift',
        date: '2023-02-08',
        previousValue: 0.08,
        currentValue: 0.12,
        changePercent: 50,
        severity: 'severe',
        status: 'investigating',
        affectedComponents: ['Supplier List', 'Navigation']
      },
      {
        id: '3',
        metric: 'JS Bundle Size',
        date: '2023-02-05',
        previousValue: 310,
        currentValue: 320,
        changePercent: 3.2,
        severity: 'minor',
        status: 'investigating',
        affectedComponents: ['Global']
      },
      {
        id: '4',
        metric: 'Time to Interactive',
        date: '2023-01-28',
        previousValue: 3200,
        currentValue: 3600,
        changePercent: 12.5,
        severity: 'moderate',
        status: 'resolved',
        affectedComponents: ['Authentication', 'User Profile']
      },
      {
        id: '5',
        metric: 'Server Response Time',
        date: '2023-01-20',
        previousValue: 250,
        currentValue: 320,
        changePercent: 28,
        severity: 'moderate',
        status: 'false-positive',
        affectedComponents: ['API', 'Database']
      }
    ];
  }
}

export default new PerformanceMonitoringService();