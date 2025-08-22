import { useEffect, useRef, useState } from 'react';

/**
 * Performance metric types that can be tracked
 */
export type PerformanceMetricType = 
  | 'render' 
  | 'mount' 
  | 'update' 
  | 'unmount' 
  | 'load' 
  | 'interaction';

/**
 * Performance metric record
 */
export interface PerformanceMetric {
  componentName: string;
  type: PerformanceMetricType;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// Global store for metrics
const performanceStore: {
  metrics: PerformanceMetric[];
  enabled: boolean;
  listeners: ((metrics: PerformanceMetric[]) => void)[];
} = {
  metrics: [],
  enabled: process.env.NODE_ENV !== 'production',
  listeners: [],
};

/**
 * Add a performance metric to the store
 */
export const addPerformanceMetric = (metric: PerformanceMetric) => {
  if (!performanceStore.enabled) return;
  
  performanceStore.metrics.push(metric);
  performanceStore.listeners.forEach(listener => listener(performanceStore.metrics));
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.debug(
      `%c[Performance] ${metric.componentName} - ${metric.type}`,
      'color: #8b5cf6; font-weight: bold;',
      `${metric.duration.toFixed(2)}ms`,
      metric.metadata || ''
    );
  }
};

/**
 * Enable or disable performance monitoring
 */
export const setPerformanceMonitoring = (enabled: boolean) => {
  performanceStore.enabled = enabled;
};

/**
 * Hook for monitoring component performance
 * 
 * @param componentName - Name of the component being monitored
 * @param trackUpdates - Whether to track component updates (re-renders)
 * @returns Performance monitoring utilities
 */
export const usePerformanceMonitor = (
  componentName: string,
  trackUpdates = false
) => {
  const mountTimeRef = useRef<number>(0);
  const renderStartTimeRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  
  // Start measuring render time
  renderStartTimeRef.current = performance.now();
  
  // Track component mount
  useEffect(() => {
    if (!performanceStore.enabled) return;
    
    const mountDuration = performance.now() - mountTimeRef.current;
    
    addPerformanceMetric({
      componentName,
      type: 'mount',
      duration: mountDuration,
      timestamp: Date.now(),
    });
    
    return () => {
      if (!performanceStore.enabled) return;
      
      const unmountTime = performance.now();
      
      addPerformanceMetric({
        componentName,
        type: 'unmount',
        duration: 0, // Unmount time is instantaneous
        timestamp: Date.now(),
        metadata: {
          lifetimeDuration: unmountTime - mountTimeRef.current,
          updateCount: updateCountRef.current,
        },
      });
    };
  }, [componentName]);
  
  // Track component updates
  useEffect(() => {
    if (!performanceStore.enabled || !trackUpdates) return;
    
    // Skip the initial mount
    if (updateCountRef.current > 0) {
      addPerformanceMetric({
        componentName,
        type: 'update',
        duration: performance.now() - renderStartTimeRef.current,
        timestamp: Date.now(),
        metadata: {
          updateCount: updateCountRef.current,
        },
      });
    }
    
    updateCountRef.current += 1;
  });
  
  // Log render time after component has rendered
  useEffect(() => {
    if (!performanceStore.enabled) return;
    
    const renderDuration = performance.now() - renderStartTimeRef.current;
    
    // Only log initial render
    if (updateCountRef.current <= 1) {
      addPerformanceMetric({
        componentName,
        type: 'render',
        duration: renderDuration,
        timestamp: Date.now(),
      });
    }
  });
  
  // Measure load time (e.g., for lazy-loaded components)
  const markLoad = (metadata?: Record<string, any>) => {
    if (!performanceStore.enabled) return;
    
    addPerformanceMetric({
      componentName,
      type: 'load',
      duration: performance.now() - mountTimeRef.current,
      timestamp: Date.now(),
      metadata,
    });
  };
  
  // Measure user interaction time
  const measureInteraction = (
    interactionName: string, 
    startTime: number,
    metadata?: Record<string, any>
  ) => {
    if (!performanceStore.enabled) return;
    
    const duration = performance.now() - startTime;
    
    addPerformanceMetric({
      componentName: `${componentName}:${interactionName}`,
      type: 'interaction',
      duration,
      timestamp: Date.now(),
      metadata,
    });
    
    return duration;
  };
  
  // Set mount time when component is first rendered
  if (mountTimeRef.current === 0) {
    mountTimeRef.current = performance.now();
  }
  
  return {
    markLoad,
    measureInteraction,
    startInteractionTimer: () => performance.now(),
  };
};

/**
 * Subscribe to performance metrics updates
 */
export const subscribeToPerformanceMetrics = (
  callback: (metrics: PerformanceMetric[]) => void
) => {
  performanceStore.listeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    const index = performanceStore.listeners.indexOf(callback);
    if (index !== -1) {
      performanceStore.listeners.splice(index, 1);
    }
  };
};

/**
 * Get all collected performance metrics
 */
export const getPerformanceMetrics = () => {
  return [...performanceStore.metrics];
};

/**
 * Clear all collected performance metrics
 */
export const clearPerformanceMetrics = () => {
  performanceStore.metrics = [];
  performanceStore.listeners.forEach(listener => listener(performanceStore.metrics));
};

export default usePerformanceMonitor; 