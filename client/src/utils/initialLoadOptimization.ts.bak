/**
 * Initial Page Load Optimization Utilities
 * 
 * This file contains utilities for optimizing the initial page load time
 * to improve Core Web Vitals and user experience.
 */

// Constants for resource hints
const CRITICAL_RESOURCES = [
  // Navigation critical resources
  '/static/js/main.chunk.js',
  '/static/js/vendors-mui.chunk.js',
  '/static/js/vendors-react.chunk.js',
  '/static/css/main.chunk.css',
  '/fonts/roboto-v20-latin-regular.woff2',
  '/fonts/roboto-v20-latin-500.woff2',
  '/api/auth/me', // For authentication check
  '/api/dashboard/stats', // For dashboard quick stats
];

/**
 * Adds preload/prefetch resource hints to the document head
 * to improve loading performance of critical resources.
 */
export function addCriticalResourceHints(): void {
  if (typeof document === 'undefined') return;

  CRITICAL_RESOURCES.forEach((resource, index) => {
    // First 3 resources get preload (highest priority)
    // Others get prefetch (lower priority)
    const hint = index < 3 ? 'preload' : 'prefetch';
    
    // Skip if we already have this resource hint
    const existingHint = document.querySelector(`link[rel="${hint}"][href="${resource}"]`);
    if (existingHint) return;

    // Create and append resource hint
    const link = document.createElement('link');
    link.rel = hint;
    link.href = resource;
    
    // Set correct as attribute based on resource type
    if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.endsWith('.woff2')) {
      link.as = 'font';
      link.type = 'font/woff2';
      link.crossOrigin = 'anonymous';
    } else if (resource.startsWith('/api/')) {
      link.as = 'fetch';
      link.crossOrigin = 'same-origin';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Prioritizes main thread tasks to improve TTI (Time to Interactive)
 * by deferring non-critical work.
 */
export function prioritizeMainThread(): void {
  // Store tasks to be executed when browser is idle
  const deferredTasks: Array<() => void> = [];
  
  // Add a task to be executed when the browser is idle
  window.deferTask = (task: () => void) => {
    deferredTasks.push(task);
  };
  
  // Execute deferred tasks during idle time
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      while (deferredTasks.length > 0) {
        const task = deferredTasks.shift();
        if (task) task();
      }
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      while (deferredTasks.length > 0) {
        const task = deferredTasks.shift();
        if (task) task();
      }
    }, 2000); // 2 seconds after load
  }
}

/**
 * Optimizes image loading strategy across the application
 */
export function optimizeImageLoading(): void {
  // Check for browsers that support loading="lazy"
  const supportsLazyLoading = 'loading' in HTMLImageElement.prototype;
  
  // Apply lazy loading to all images not in viewport
  if (supportsLazyLoading) {
    setTimeout(() => {
      document.querySelectorAll('img:not([loading])').forEach(img => {
        if (!isInViewport(img)) {
          (img as HTMLImageElement).loading = 'lazy';
        }
      });
    }, 100);
  }
}

/**
 * Checks if an element is in the viewport
 */
function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Enhance font loading performance with font-display
 */
export function optimizeFontLoading(): void {
  // Create a style element for optimized font display
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'Roboto';
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initializes all load optimization techniques
 */
export function initializeLoadOptimizations(): void {
  addCriticalResourceHints();
  prioritizeMainThread();
  optimizeImageLoading();
  optimizeFontLoading();
  
  // Add event listener for load event to optimize after load
  window.addEventListener('load', () => {
    // Set priority for resource fetching post-load
    if ('connection' in navigator && (navigator as any).connection.saveData) {
      // If data saver is enabled, be more conservative with prefetching
      return;
    }
    
    // Prefetch resources for routes the user is likely to visit next
    const likelyRoutes = ['/dashboard', '/inspections', '/suppliers'];
    likelyRoutes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  });
}

// Extend window interface to add deferTask function
declare global {
  interface Window {
    deferTask: (task: () => void) => void;
  }
} 