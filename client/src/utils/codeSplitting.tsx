/**
 * AeroSuite Code Splitting Utilities
 * 
 * This file contains utilities for implementing code splitting and dynamic imports
 * to optimize bundle size and loading performance.
 * 
 * Implementation of RF033 - Implement code splitting for frontend
 */

import React, { Suspense, ComponentType, lazy, useState, useEffect } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';
import { codeSplittingConfig, LoadPriority } from './codeSplittingConfig';
import { useInView } from 'react-intersection-observer';

/**
 * Default loading component shown while lazy-loaded components are being loaded
 */
export const DefaultLoading: React.FC<{
  message?: string;
  size?: 'small' | 'medium' | 'large';
}> = ({ message = 'Loading...', size = 'medium' }) => {
  const getSize = () => {
    switch (size) {
      case 'small':return { progressSize: 24, height: '100px' };
      case 'large':return { progressSize: 48, height: '300px' };
      default:return { progressSize: 36, height: '200px' };
    }
  };

  const { progressSize, height } = getSize();

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minHeight={height}
      width="100%">

      <CircularProgress size={progressSize} />
      {message &&
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      }
    </Box>);

};

/**
 * Options for creating a code-split component
 */
export interface CodeSplitOptions {
  /**
   * Custom loading component to show while the component is loading
   */
  fallback?: React.ReactNode;

  /**
   * Prefetch the component when the browser is idle
   */
  prefetch?: boolean;

  /**
   * Preload the component as soon as possible
   */
  preload?: boolean;

  /**
   * Retry loading the component if it fails to load
   */
  retry?: boolean;

  /**
   * Number of retries before giving up
   */
  retryCount?: number;

  /**
   * Loading priority
   */
  priority?: LoadPriority;

  /**
   * Timeout in ms before showing loading indicator
   */
  loadingDelay?: number;

  /**
   * Error component to show if loading fails
   */
  errorComponent?: React.ReactNode;

  /**
   * Chunk name for better debugging
   */
  chunkName?: string;

  /**
   * Whether to use preload link in document head
   */
  usePreloadLink?: boolean;
}

// Track which modules have been prefetched to avoid duplicate prefetching
const prefetchedModules = new Set<string>();

/**
 * Add a preload link to the document head
 * 
 * @param url URL to preload
 * @param as Resource type
 */
export function addPreloadLink(url: string, as: 'script' | 'style' = 'script'): void {
  if (!url || typeof document === 'undefined') return;

  // Check if link already exists
  const existingLink = document.querySelector(`link[href="${url}"]`);
  if (existingLink) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = url;

  document.head.appendChild(link);
}

/**
 * Prefetch a module when browser is idle
 * 
 * @param importFn Function that returns a dynamic import promise
 * @param chunkName Optional chunk name for tracking
 */
export function prefetchWhenIdle<T>(
importFn: () => Promise<T>,
chunkName?: string)
: void {
  const key = chunkName || importFn.toString();

  // Skip if already prefetched
  if (prefetchedModules.has(key)) return;

  // Mark as prefetched
  prefetchedModules.add(key);

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      importFn().catch(() => {
        // Silently catch errors during prefetching
        prefetchedModules.delete(key);
      });
    });
  }
}

/**
 * Create a lazy-loaded component with retry logic
 * 
 * @param importFn Function that returns a dynamic import promise
 * @param options Configuration options
 * @returns Lazy-loaded component
 */
export function createLazyComponent<T extends ComponentType<any>>(
importFn: () => Promise<{default: T;}>,
options: CodeSplitOptions = {})
: React.LazyExoticComponent<T> {
  const {
    prefetch = false,
    preload = false,
    retry = true,
    retryCount = 3,
    chunkName,
    usePreloadLink = codeSplittingConfig.preloading.usePreloadLinks,
    priority = LoadPriority.MEDIUM
  } = options;

  // Enhanced import function with retry logic
  const importWithRetry = async (): Promise<{default: T;}> => {
    let lastError: Error | null = null;
    let retriesLeft = retry ? retryCount : 0;

    // Try loading the module
    while (retriesLeft >= 0) {
      try {
        const module = await importFn();

        // If module has a webpack chunk name and usePreloadLink is enabled,
        // extract the chunk URL and add a preload link
        if (usePreloadLink && module.__webpackChunkName) {
          // This is a simplified approach - in a real app you'd need to
          // extract the actual chunk URL from webpack's manifest
          const chunkUrl = `/static/js/${module.__webpackChunkName}.chunk.js`;
          addPreloadLink(chunkUrl);
        }

        return module;
      } catch (_error) {
        lastError = _error as Error;
        retriesLeft--;

        if (retriesLeft >= 0) {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
          setTimeout(resolve, 1000 * Math.pow(2, retryCount - retriesLeft))
          );
        }
      }
    }

    // If we get here, all retries failed
    console.error('Failed to load module after multiple retries:', lastError);
    throw lastError;
  };

  // Create the lazy component
  const LazyComponent = lazy(importWithRetry);

  // Handle prefetching based on priority
  if (priority === LoadPriority.CRITICAL || priority === LoadPriority.HIGH) {
    // Preload immediately for critical and high priority components
    importFn().catch(() => {});
  } else if (prefetch) {
    // Prefetch when the browser is idle
    prefetchWhenIdle(importFn, chunkName);
  } else if (preload) {
    // Preload immediately
    importFn().catch(() => {});
  }

  return LazyComponent;
}

/**
 * Error component shown when lazy loading fails
 */
export const DefaultErrorComponent: React.FC<{
  error?: Error;
  retry?: () => void;
}> = ({ error, retry }) =>
<Box
  display="flex"
  flexDirection="column"
  justifyContent="center"
  alignItems="center"
  minHeight="200px"
  width="100%"
  sx={{ p: 2, border: '1px solid #f44336', borderRadius: 1 }}>

    <Typography variant="h6" color="error" gutterBottom>
      Failed to load component
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {error?.message || 'An unexpected error occurred'}
    </Typography>
    {retry &&
  <button onClick={retry} style={{ marginTop: 16 }}>
        Retry
      </button>
  }
  </Box>;


/**
 * Wrap a component with Suspense and a loading fallback
 * 
 * @param Component The component to wrap
 * @param options Configuration options
 * @returns Wrapped component with Suspense
 */
export function WithSuspense<T extends ComponentType<any>>(
Component: T,
options: CodeSplitOptions = {})
: React.FC<React.ComponentProps<T>> {
  const {
    fallback = <DefaultLoading />,
    loadingDelay = 200
  } = options;

  return (props: React.ComponentProps<T>) => {
    const [showLoading, setShowLoading] = useState(loadingDelay === 0);

    useEffect(() => {
      if (loadingDelay > 0) {
        const timer = setTimeout(() => {
          setShowLoading(true);
        }, loadingDelay);

        return () => clearTimeout(timer);
      }
    }, [loadingDelay]);

    return (
      <Suspense fallback={showLoading ? fallback : null}>
        <Component {...props} />
      </Suspense>);

  };
}

/**
 * Create a lazy-loaded route component with Suspense
 * 
 * @param importFn Function that returns a dynamic import promise
 * @param options Configuration options
 * @returns Lazy-loaded component wrapped with Suspense
 */
export function lazyRoute<T extends ComponentType<any>>(
importFn: () => Promise<{default: T;}>,
options: CodeSplitOptions = {})
: React.FC<React.ComponentProps<T>> {
  const LazyComponent = createLazyComponent(importFn, options);
  return WithSuspense(LazyComponent, options);
}

/**
 * Dynamically import a module only when it's needed
 * 
 * @param importFn Function that returns a dynamic import promise
 * @returns Object with the import function and loading status
 */
export function useDynamicImport<T>(importFn: () => Promise<T>) {
  const [module, setModule] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    if (module) return module;

    setLoading(true);
    setError(null);

    try {
      const result = await importFn();
      setModule(result);
      return result;
    } catch (_err) {
      const error = _err instanceof Error ? _err : new Error(String(_err));
      setError(error);
      throw _err;
    } finally {
      setLoading(false);
    }
  }, [importFn, module]);

  return { module, loading, error, load };
}

/**
 * Utility to load multiple modules in parallel
 * 
 * @param imports Object with import functions
 * @returns Promise that resolves when all imports are complete
 */
export async function loadModules<T extends Record<string, () => Promise<any>>>(
imports: T)
: Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const keys = Object.keys(imports);
  const importPromises = keys.map((key) => imports[key]());

  const modules = await Promise.all(importPromises);

  return keys.reduce((result, key, index) => {
    result[key as keyof T] = modules[index];
    return result;
  }, {} as { [K in keyof T]: Awaited<ReturnType<T[K]>> });
}

/**
 * Hook to load a component when it comes into view
 * 
 * @param importFn Function that returns a dynamic import promise
 * @param options Configuration options
 * @returns [ref, component] - Ref to attach to container and the loaded component
 */
export function useInViewLazyLoad<T extends ComponentType<any>>(
importFn: () => Promise<{default: T;}>,
options: CodeSplitOptions & {rootMargin?: string;} = {})
{
  const {
    rootMargin = '200px',
    fallback = <DefaultLoading size="small" />,
    loadingDelay = 500
  } = options;

  const [loaded, setLoaded] = useState(false);
  const [Component, setComponent] = useState<React.FC<React.ComponentProps<T>> | null>(null);
  const { ref, inView } = useInView({ rootMargin, triggerOnce: true });

  useEffect(() => {
    if (inView && !loaded) {
      setLoaded(true);

      const LazyComponent = createLazyComponent(importFn, options);
      const WrappedComponent = WithSuspense(LazyComponent, {
        fallback,
        loadingDelay
      });

      setComponent(() => WrappedComponent);
    }
  }, [inView, loaded, importFn, options, fallback, loadingDelay]);

  return [ref, Component];
}

/**
 * Preload all routes configured for prefetching
 */
export function preloadConfiguredRoutes(): void {
  if (!codeSplittingConfig.enabled) return;

  const { routes } = codeSplittingConfig;

  // Prefetch routes configured in the config
  routes.prefetch.forEach((route) => {
    // This is just a placeholder - in a real implementation,
    // you would need to map routes to their import functions
    console.log(`Would prefetch route: ${route}`);
  });

  // Prefetch custom configured routes
  routes.custom.forEach((routeConfig) => {
    if (routeConfig.prefetch) {
      console.log(`Would prefetch custom route: ${routeConfig.path}`);
    }
  });
}

// Initialize prefetching when this module is imported
if (typeof window !== 'undefined' && codeSplittingConfig.enabled) {
  window.addEventListener('load', () => {
    // Wait until the page has loaded before prefetching additional resources
    setTimeout(preloadConfiguredRoutes, 2000);
  });
}

export default {
  DefaultLoading,
  DefaultErrorComponent,
  createLazyComponent,
  withSuspense: WithSuspense,
  lazyRoute,
  useDynamicImport,
  loadModules,
  useInViewLazyLoad,
  addPreloadLink,
  prefetchWhenIdle,
  preloadConfiguredRoutes
};

// Alias for backward compatibility
export { WithSuspense as withSuspense };
