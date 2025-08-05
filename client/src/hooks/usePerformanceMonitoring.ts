import { useEffect, useRef } from 'react';
import performanceMonitoringService, { 
  initPerformanceMonitoring,
  PerformanceMetricType
} from '../services/performanceMonitoring.service';

/**
 * Hook for using performance monitoring in components
 * 
 * @param componentName Name of the component for tracking
 * @param options Configuration options
 * @returns Performance monitoring methods
 */
export const usePerformanceMonitoring = (
  componentName: string,
  options: {
    trackResourceTiming?: boolean;
    trackPaintTiming?: boolean;
    trackLayoutShift?: boolean;
    trackLongTasks?: boolean;
    trackMemoryUsage?: boolean;
  } = {}
) => {
  const {
    trackResourceTiming = false,
    trackPaintTiming = false,
    trackLayoutShift = false,
    trackLongTasks = false,
    trackMemoryUsage = false
  } = options;
  
  const mountTimeRef = useRef<number>(performance.now());
  const renderStartTimeRef = useRef<number>(performance.now());
  const interactionTimerRef = useRef<Record<string, number>>({});
  
  // Track component mount and unmount
  useEffect(() => {
    // Track component mount time
    const mountDuration = performance.now() - mountTimeRef.current;
    performanceMonitoringService.trackCustomMetric(
      `${componentName}:mount`,
      mountDuration,
      { componentName }
    );
    
    // Track resource timing if enabled
    if (trackResourceTiming) {
      performanceMonitoringService.trackResourceTiming();
    }
    
    // Track paint timing if enabled
    if (trackPaintTiming) {
      performanceMonitoringService.trackPaintTiming();
    }
    
    // Track layout shifts if enabled
    if (trackLayoutShift) {
      performanceMonitoringService.trackLayoutShift();
    }
    
    // Track long tasks if enabled
    if (trackLongTasks) {
      performanceMonitoringService.trackLongTasks();
    }
    
    // Track memory usage if enabled
    if (trackMemoryUsage) {
      performanceMonitoringService.trackMemoryUsage();
    }
    
    // Track component unmount
    return () => {
      const unmountTime = performance.now();
      const lifetimeDuration = unmountTime - mountTimeRef.current;
      
      performanceMonitoringService.trackCustomMetric(
        `${componentName}:unmount`,
        lifetimeDuration,
        { 
          componentName,
          lifetimeDuration
        }
      );
    };
  }, [componentName, trackResourceTiming, trackPaintTiming, trackLayoutShift, trackLongTasks, trackMemoryUsage]);
  
  // Track initial render time
  useEffect(() => {
    const renderDuration = performance.now() - renderStartTimeRef.current;
    
    performanceMonitoringService.trackCustomMetric(
      `${componentName}:render`,
      renderDuration,
      { componentName }
    );
  }, [componentName]);
  
  /**
   * Start timing an interaction
   * @param interactionName Name of the interaction
   * @returns Interaction ID
   */
  const startInteractionTimer = (interactionName: string): string => {
    const interactionId = `${componentName}:${interactionName}:${Date.now()}`;
    interactionTimerRef.current[interactionId] = performance.now();
    return interactionId;
  };
  
  /**
   * End timing an interaction and track the metric
   * @param interactionId ID of the interaction
   * @param metadata Additional metadata
   * @returns Duration of the interaction in milliseconds
   */
  const endInteractionTimer = (interactionId: string, metadata?: Record<string, any>): number | undefined => {
    const startTime = interactionTimerRef.current[interactionId];
    
    if (!startTime) {
      console.warn(`Interaction timer not found: ${interactionId}`);
      return undefined;
    }
    
    const duration = performance.now() - startTime;
    
    // Remove the timer
    delete interactionTimerRef.current[interactionId];
    
    // Track the interaction
    performanceMonitoringService.trackCustomMetric(
      interactionId,
      duration,
      {
        componentName,
        interactionType: 'user',
        ...metadata
      }
    );
    
    return duration;
  };
  
  /**
   * Track a custom performance metric
   * @param name Metric name
   * @param value Metric value
   * @param metadata Additional metadata
   */
  const trackMetric = (name: string, value: number, metadata?: Record<string, any>) => {
    performanceMonitoringService.trackCustomMetric(
      `${componentName}:${name}`,
      value,
      {
        componentName,
        ...metadata
      }
    );
  };
  
  /**
   * Track a component update
   * @param dependencies Dependencies that triggered the update
   * @param metadata Additional metadata
   */
  const trackUpdate = (dependencies: any[], metadata?: Record<string, any>) => {
    const updateStartTime = performance.now();
    
    // Return a function to be called after the update
    return () => {
      const updateDuration = performance.now() - updateStartTime;
      
      performanceMonitoringService.trackCustomMetric(
        `${componentName}:update`,
        updateDuration,
        {
          componentName,
          dependenciesCount: dependencies.length,
          ...metadata
        }
      );
    };
  };
  
  return {
    startInteractionTimer,
    endInteractionTimer,
    trackMetric,
    trackUpdate
  };
};

/**
 * Initialize performance monitoring
 * This should be called once at the application root
 */
export const initializePerformanceMonitoring = () => {
  initPerformanceMonitoring();
};

export default usePerformanceMonitoring; 