/**
 * Advanced Lazy Loading Strategies
 * 
 * This file provides enhanced lazy loading strategies that build upon
 * the code splitting foundation implemented in RF033.
 * 
 * Implementation of RF034 - Add lazy loading for routes and components
 */

import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { prefetchWhenIdle, useDynamicImport } from './codeSplitting';
import { codeSplittingConfig, LoadPriority } from './codeSplittingConfig';
import { routeImports, prefetchRelatedRoutes } from './routeSplitting';
import { componentImports, prefetchComponents } from './componentSplitting';

// Type definitions
type ImportFunction<T> = () => Promise<T>;
type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Interface for tracking module loading status
 */
interface ModuleLoadingStatus {
  state: LoadingState;
  timestamp: number;
  error?: Error;
}

// Global registry to track loading status of modules
const moduleRegistry: Record<string, ModuleLoadingStatus> = {};

/**
 * Register a module's loading status
 * 
 * @param key Unique identifier for the module
 * @param state Current loading state
 * @param error Optional error if loading failed
 */
function registerModuleStatus(key: string, state: LoadingState, error?: Error): void {
  moduleRegistry[key] = {
    state,
    timestamp: Date.now(),
    error
  };
  
  // Log for debugging in development
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[LazyLoading] Module ${key} is now ${state}${error ? ': ' + error.message : ''}`);
  }
}

/**
 * Get a module's loading status
 * 
 * @param key Unique identifier for the module
 * @returns Module loading status or undefined if not registered
 */
export function getModuleStatus(key: string): ModuleLoadingStatus | undefined {
  return moduleRegistry[key];
}

/**
 * Hook to track user interaction patterns for predictive loading
 * 
 * @returns Object with interaction tracking methods
 */
export function useInteractionTracking() {
  const interactionHistory = useRef<Array<{ element: string; timestamp: number }>>([]);
  const location = useLocation();
  
  // Track user navigation patterns
  useEffect(() => {
    const path = location.pathname;
    interactionHistory.current.push({
      element: `route:${path}`,
      timestamp: Date.now()
    });
    
    // Limit history size
    if (interactionHistory.current.length > 50) {
      interactionHistory.current = interactionHistory.current.slice(-50);
    }
    
    // Analyze patterns and preload likely next routes
    analyzeAndPreload();
  }, [location]);
  
  // Record a user interaction with a component
  const trackInteraction = useCallback((componentId: string) => {
    interactionHistory.current.push({
      element: `component:${componentId}`,
      timestamp: Date.now()
    });
    
    // Analyze patterns after new interaction
    analyzeAndPreload();
  }, []);
  
  // Analyze interaction patterns and preload likely next components/routes
  const analyzeAndPreload = useCallback(() => {
    const history = interactionHistory.current;
    if (history.length < 3) return;
    
    // Simple pattern: if user navigated A -> B -> C multiple times,
    // when they navigate A -> B, preload C
    const patterns: Record<string, string[]> = {};
    
    // Build pattern map (very simplified ML)
    for (let i = 0; i < history.length - 2; i++) {
      const sequence = `${history[i].element},${history[i+1].element}`;
      const next = history[i+2].element;
      
      if (!patterns[sequence]) {
        patterns[sequence] = [];
      }
      
      if (!patterns[sequence].includes(next)) {
        patterns[sequence].push(next);
      }
    }
    
    // Check current pattern
    if (history.length >= 2) {
      const currentSequence = `${history[history.length-2].element},${history[history.length-1].element}`;
      const predictions = patterns[currentSequence];
      
      if (predictions && predictions.length > 0) {
        // Preload predicted routes/components
        predictions.forEach(prediction => {
          if (prediction.startsWith('route:')) {
            const route = prediction.substring(6);
            const importFn = routeImports[route];
            if (importFn) {
              prefetchWhenIdle(importFn, `route-${route}`);
            }
          } else if (prediction.startsWith('component:')) {
            const component = prediction.substring(10);
            prefetchComponents([component]);
          }
        });
      }
    }
  }, []);
  
  return { trackInteraction };
}

/**
 * Hook for advanced lazy loading of any module
 * 
 * @param importFn Function that returns a dynamic import promise
 * @param options Configuration options
 * @returns Object with loading state and loaded module
 */
export function useAdvancedLazyLoad<T>(
  importFn: ImportFunction<T>,
  options: {
    key?: string;
    priority?: LoadPriority;
    loadImmediately?: boolean;
    onLoad?: (module: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    key = importFn.toString(),
    priority = LoadPriority.MEDIUM,
    loadImmediately = false,
    onLoad,
    onError
  } = options;
  
  const [state, setState] = useState<LoadingState>('idle');
  const [module, setModule] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const load = useCallback(async () => {
    // Don't reload if already loaded or loading
    if (state === 'loading' || state === 'loaded') return module;
    
    setState('loading');
    registerModuleStatus(key, 'loading');
    
    try {
      const result = await importFn();
      setModule(result);
      setState('loaded');
      registerModuleStatus(key, 'loaded');
      onLoad?.(result);
      return result;
    } catch (_err) {
      const error = _err instanceof Error ? _err : new Error(String(_err));
      setError(error);
      setState('error');
      registerModuleStatus(key, 'error', error);
      onError?.(error);
      throw _err;
    }
  }, [importFn, key, module, onLoad, onError, state]);
  
  // Load immediately if configured or if high priority
  useEffect(() => {
    if (loadImmediately || priority === LoadPriority.CRITICAL || priority === LoadPriority.HIGH) {
      load().catch(() => {});
    } else if (priority === LoadPriority.MEDIUM) {
      // Medium priority: load when browser is idle
      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const handle = (window as any).requestIdleCallback(() => {
          load().catch(() => {});
        });
        
        return () => {
          if ('cancelIdleCallback' in window) {
            (window as any).cancelIdleCallback(handle);
          }
        };
      }
    }
    // Low priority and on-demand are loaded explicitly by calling load()
  }, [load, loadImmediately, priority]);
  
  return { 
    module, 
    state, 
    error, 
    load, 
    isLoading: state === 'loading',
    isLoaded: state === 'loaded',
    isError: state === 'error'
  };
}

/**
 * Hook for lazy loading a component when it's visible in the viewport
 * with enhanced features beyond the basic implementation in RF033
 * 
 * @param options Configuration options
 * @returns Object with ref to attach to container and component status
 */
export function useVisibilityLazyLoad<T>(
  importFn: ImportFunction<{ default: React.ComponentType<T> }>,
  options: {
    key?: string;
    rootMargin?: string;
    threshold?: number;
    triggerOnce?: boolean;
    placeholderHeight?: string | number;
    fallback?: React.ReactNode;
    onVisible?: () => void;
    onLoad?: (component: React.ComponentType<T>) => void;
  } = {}
) {
  const {
    key = importFn.toString(),
    rootMargin = '100px',
    threshold = 0,
    triggerOnce = true,
    placeholderHeight = 200,
    fallback = null,
    onVisible,
    onLoad
  } = options;
  
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [Component, setComponent] = useState<React.ComponentType<T> | null>(null);
  
  // Create ref to attach to the container element
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Set up intersection observer
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        const wasVisible = isVisible;
        const nowVisible = entry.isIntersecting;
        
        if (nowVisible && !wasVisible) {
          setIsVisible(true);
          onVisible?.();
          
          // Load the component when visible
          importFn()
            .then((module) => {
              setComponent(() => module.default);
              setIsLoaded(true);
              onLoad?.(module.default);
              registerModuleStatus(key, 'loaded');
            })
            .catch((error) => {
              console.error(`Failed to load component: ${error}`);
              registerModuleStatus(key, 'error', error instanceof Error ? error : new Error(String(error)));
            });
          
          // Unobserve if triggerOnce is true
          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!nowVisible && wasVisible && !triggerOnce) {
          setIsVisible(false);
        }
      },
      { rootMargin, threshold }
    );
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [importFn, isVisible, key, onLoad, onVisible, rootMargin, threshold, triggerOnce]);
  
  return {
    ref: containerRef,
    Component,
    isVisible,
    isLoaded,
    placeholderHeight,
    fallback
  };
}

/**
 * Prefetch all routes and components based on the current route
 * with advanced prioritization logic
 * 
 * @param currentRoute Current route path
 */
export function prefetchRelatedContent(currentRoute: string): void {
  if (!codeSplittingConfig.enabled) return;
  
  // First prefetch direct child routes
  prefetchRelatedRoutes(currentRoute);
  
  // Then prefetch components that are likely to be needed on this route
  const routeToComponentsMap: Record<string, string[]> = {
    '/dashboard': ['StatCard', 'ActivityFeed', 'NotificationList'],
    '/customers': ['CustomerCard', 'DataTable', 'SearchBar', 'FilterPanel'],
    '/suppliers': ['SupplierCard', 'SupplierRiskIndicator', 'DataTable'],
    '/inspections': ['InspectionCard', 'InspectionForm', 'DataTable'],
    '/reports': ['LineChart', 'BarChart', 'PieChart', 'DataGrid'],
    '/settings': ['FormBuilder']
  };
  
  // Prefetch components for the current route
  const componentsToLoad = routeToComponentsMap[currentRoute];
  if (componentsToLoad) {
    prefetchComponents(componentsToLoad);
  }
  
  // Prefetch components for potential next routes
  // This is a simplified version of predictive loading
  const potentialNextRoutes: Record<string, string[]> = {
    '/dashboard': ['/customers', '/suppliers', '/inspections'],
    '/customers': ['/customers/create', '/inspections'],
    '/suppliers': ['/suppliers/create', '/components'],
    '/inspections': ['/inspections/schedule', '/reports']
  };
  
  const nextRoutes = potentialNextRoutes[currentRoute];
  if (nextRoutes) {
    // Delay loading potential next routes to prioritize current route content
    setTimeout(() => {
      nextRoutes.forEach(route => {
        const componentsForRoute = routeToComponentsMap[route];
        if (componentsForRoute) {
          // Use lower priority for potential next routes
          prefetchComponents(componentsForRoute);
        }
      });
    }, 2000);
  }
}

// Export default for the lazyRoute function
export default {
  useAdvancedLazyLoad,
  useVisibilityLazyLoad,
  useInteractionTracking,
  getModuleStatus,
  prefetchRelatedContent
}; 