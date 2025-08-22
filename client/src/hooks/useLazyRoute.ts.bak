/**
 * useLazyRoute Hook
 * 
 * A React hook for advanced lazy loading of routes with prefetching,
 * preloading, and loading state tracking.
 * 
 * Implementation of RF034 - Add lazy loading for routes and components
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { routeImports, prefetchRelatedRoutes } from '../utils/routeSplitting';
import { useAdvancedLazyLoad } from '../utils/lazyLoading';
import { codeSplittingConfig, LoadPriority } from '../utils/codeSplittingConfig';

// Type definitions
type RouteLoadingState = 'idle' | 'loading' | 'loaded' | 'error';

// Interface for route loading options
interface LazyRouteOptions {
  /**
   * Priority of the route loading
   */
  priority?: LoadPriority;
  
  /**
   * Whether to prefetch related routes
   */
  prefetchRelated?: boolean;
  
  /**
   * Whether to track loading metrics
   */
  trackMetrics?: boolean;
  
  /**
   * Callback when route module is loaded
   */
  onLoaded?: () => void;
  
  /**
   * Callback when route module fails to load
   */
  onError?: (error: Error) => void;
}

/**
 * Hook for lazy loading routes with advanced features
 * 
 * @param routePath Route path to lazy load
 * @param options Configuration options
 * @returns Object with route component and loading state
 */
export function useLazyRoute(
  routePath: string,
  options: LazyRouteOptions = {}
) {
  const {
    priority = LoadPriority.MEDIUM,
    prefetchRelated = true,
    trackMetrics = true,
    onLoaded,
    onError
  } = options;
  
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isCurrentRoute = routePath === currentPath;
  
  // Get the import function for this route
  const importFn = routeImports[routePath];
  
  if (!importFn) {
    console.error(`No import function found for route: ${routePath}`);
    return {
      component: null,
      state: 'error' as RouteLoadingState,
      error: new Error(`No import function found for route: ${routePath}`),
      isLoading: false,
      isLoaded: false,
      isError: true,
      navigateTo: () => navigate(routePath)
    };
  }
  
  // Use the advanced lazy load hook
  const {
    module,
    state,
    error,
    load,
    isLoading,
    isLoaded,
    isError
  } = useAdvancedLazyLoad(importFn, {
    key: `route-${routePath}`,
    priority: isCurrentRoute ? LoadPriority.CRITICAL : priority,
    loadImmediately: isCurrentRoute,
    onLoad: (module) => {
      if (trackMetrics) {
        // Record loading metrics
        if (typeof performance !== 'undefined') {
          performance.mark(`route-loaded-${routePath}`);
          
          // Measure time from navigation to route load
          if (performance.getEntriesByName(`route-change-${currentPath}`).length > 0) {
            performance.measure(
              `route-load-time-${routePath}`,
              `route-change-${currentPath}`,
              `route-loaded-${routePath}`
            );
            
            // Log the measurement in development
            if (process.env.NODE_ENV === 'development') {
              const measures = performance.getEntriesByName(`route-load-time-${routePath}`);
              if (measures.length > 0) {
                console.log(`Route ${routePath} loaded in ${measures[0].duration.toFixed(2)}ms`);
              }
            }
          }
        }
      }
      
      onLoaded?.();
    },
    onError: (err) => {
      console.error(`Failed to load route ${routePath}:`, err);
      onError?.(err);
    }
  });
  
  // Prefetch related routes when this route is loaded
  useEffect(() => {
    if (isLoaded && prefetchRelated) {
      prefetchRelatedRoutes(routePath);
    }
  }, [isLoaded, prefetchRelated, routePath]);
  
  // Function to navigate to this route
  const navigateTo = () => {
    // Start loading the route if not already loaded
    if (!isLoaded && !isLoading) {
      load().catch(() => {});
    }
    
    // Navigate to the route
    navigate(routePath);
  };
  
  return {
    component: module?.default || null,
    state,
    error,
    isLoading,
    isLoaded,
    isError,
    navigateTo
  };
}

/**
 * Hook to prefetch a route when a condition is met
 * 
 * @param routePath Route path to prefetch
 * @param condition Condition that triggers prefetching
 */
export function usePrefetchRouteOnCondition(
  routePath: string,
  condition: boolean
) {
  useEffect(() => {
    if (condition && codeSplittingConfig.enabled) {
      const importFn = routeImports[routePath];
      if (importFn) {
        // Use requestIdleCallback for low-priority prefetching
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            importFn().catch(() => {});
          });
        } else {
          // Fallback for browsers without requestIdleCallback
          setTimeout(() => {
            importFn().catch(() => {});
          }, 1000);
        }
      }
    }
  }, [condition, routePath]);
}

/**
 * Hook to prefetch routes on user hover
 * 
 * @param routePaths Array of route paths to prefetch
 * @returns Object with event handlers for hover
 */
export function usePrefetchRoutesOnHover(routePaths: string[]) {
  const [isPrefetching, setIsPrefetching] = useState(false);
  let hoverTimer: number | null = null;
  
  const handleMouseEnter = () => {
    if (isPrefetching || !codeSplittingConfig.enabled) return;
    
    // Use a delay to avoid prefetching on accidental hovers
    hoverTimer = window.setTimeout(() => {
      setIsPrefetching(true);
      
      routePaths.forEach(routePath => {
        const importFn = routeImports[routePath];
        if (importFn) {
          importFn().catch(() => {});
        }
      });
    }, codeSplittingConfig.preloading.hoverDelay);
  };
  
  const handleMouseLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  };
  
  return {
    hoverProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleMouseEnter,
      onTouchEnd: handleMouseLeave
    },
    isPrefetching
  };
}

export default {
  useLazyRoute,
  usePrefetchRouteOnCondition,
  usePrefetchRoutesOnHover
}; 