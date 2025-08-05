/**
 * useRouteSplitting Hook
 * 
 * A React hook for route-based code splitting that integrates with React Router
 * to prefetch related routes and optimize loading performance.
 * 
 * Implementation of RF033 - Implement code splitting for frontend
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { prefetchRelatedRoutes } from '../utils/routeSplitting';
import { codeSplittingConfig } from '../utils/codeSplittingConfig';

/**
 * Hook that implements route-based code splitting optimizations
 * 
 * This hook:
 * 1. Tracks route changes
 * 2. Prefetches related routes based on the current route
 * 3. Updates metadata for analytics
 * 
 * @returns The current route path
 */
export function useRouteSplitting() {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Prefetch related routes when the current route changes
  useEffect(() => {
    if (!codeSplittingConfig.enabled) return;
    
    // Add route timing to performance marks
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`route-change-${currentPath}`);
    }
    
    // Update document metadata
    if (typeof document !== 'undefined') {
      const routeMeta = document.querySelector('meta[name="current-route"]');
      if (routeMeta) {
        routeMeta.setAttribute('content', currentPath);
      } else {
        const meta = document.createElement('meta');
        meta.name = 'current-route';
        meta.content = currentPath;
        document.head.appendChild(meta);
      }
    }
    
    // Prefetch related routes after a short delay to prioritize current route rendering
    const timer = setTimeout(() => {
      prefetchRelatedRoutes(currentPath);
    }, 300);
    
    return () => {
      clearTimeout(timer);
    };
  }, [currentPath]);
  
  return currentPath;
}

export default useRouteSplitting; 