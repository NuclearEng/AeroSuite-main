/**
 * Application Enhancement Utilities
 * Provides best-in-class functionality for the entire application
 */

import { lazy, Suspense, ComponentType } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

/**
 * Global Query Client Configuration
 * Implements best practices for data fetching and caching
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep cache for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error) => {
        if (error instanceof AxiosError) {
          // Don't retry on 4xx errors
          if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
            return false;
          }
        }
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Error Boundary Configuration
 */
export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Performance Monitoring
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceEntry[]> = new Map();

  private constructor() {
    // Enable performance observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric(entry);
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(entry: PerformanceEntry) {
    const metrics = this.metrics.get(entry.entryType) || [];
    metrics.push(entry);
    this.metrics.set(entry.entryType, metrics);
  }

  getMetrics(type?: string): PerformanceEntry[] {
    if (type) {
      return this.metrics.get(type) || [];
    }
    return Array.from(this.metrics.values()).flat();
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

/**
 * Accessibility Utilities
 */
export const a11y = {
  /**
   * Announce message to screen readers
   */
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },

  /**
   * Focus management
   */
  focusTrap: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select'
    );
    const firstFocusableElement = focusableElements[0] as HTMLElement;
    const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    element.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus();
            e.preventDefault();
          }
        }
      }
    });

    firstFocusableElement?.focus();
  },
};

/**
 * Security Utilities
 */
export const security = {
  /**
   * Sanitize HTML to prevent XSS
   */
  sanitizeHtml: (html: string): string => {
    const temp = document.createElement('div');
    temp.textContent = html;
    return temp.innerHTML;
  },

  /**
   * Generate CSRF token
   */
  generateCSRFToken: (): string => {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  },

  /**
   * Validate input against common attack patterns
   */
  validateInput: (input: string): boolean => {
    const dangerousPatterns = [
      /<script[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[\s\S]*?<\/iframe>/gi,
    ];

    return !dangerousPatterns.some(pattern => pattern.test(input));
  },
};

/**
 * Optimistic Updates Configuration
 */
export const optimisticUpdate = {
  /**
   * Perform optimistic update with rollback on failure
   */
  async perform<T>(
    updateFn: () => Promise<T>,
    optimisticData: T,
    rollbackFn: () => void,
    successFn?: (data: T) => void
  ): Promise<T> {
    try {
      const result = await updateFn();
      successFn?.(result);
      return result;
    } catch (error) {
      rollbackFn();
      throw error;
    }
  },
};

/**
 * Feature Flags
 */
export const featureFlags = {
  // Performance features
  enableLazyLoading: true,
  enableCodeSplitting: true,
  enableServiceWorker: true,
  enablePrefetching: true,
  
  // UI features
  enableDarkMode: true,
  enableAnimations: true,
  enableAdvancedFilters: true,
  enableBulkOperations: true,
  
  // Data features
  enableOfflineMode: true,
  enableDataExport: true,
  enableRealtimeUpdates: true,
  
  // Analytics
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,
  enableUserAnalytics: true,
};

/**
 * Best Practices Checklist
 */
export const bestPractices = {
  // Component best practices
  components: {
    useErrorBoundaries: true,
    useSuspense: true,
    useMemo: true,
    useCallback: true,
    avoidInlineStyles: true,
    avoidInlineFunctions: true,
  },
  
  // Performance best practices
  performance: {
    lazyLoadImages: true,
    virtualizeListsOver: 50,
    debounceSearchInput: 300,
    throttleScrollEvents: 100,
    useCSSTransitions: true,
    minimizeReRenders: true,
  },
  
  // Accessibility best practices
  accessibility: {
    useSemanticHTML: true,
    provideAltText: true,
    useARIALabels: true,
    ensureKeyboardNavigation: true,
    maintainFocusOrder: true,
    provideSkipLinks: true,
  },
  
  // Security best practices
  security: {
    sanitizeUserInput: true,
    useHTTPS: true,
    implementCSRF: true,
    validateOnBackend: true,
    useSecureHeaders: true,
    implementRateLimiting: true,
  },
};

/**
 * Global Error Handler
 */
export const globalErrorHandler = {
  handle: (error: Error, errorInfo?: any) => {
    // Log to monitoring service
    console.error('Global error:', error, errorInfo);
    
    // Send to error tracking service (e.g., Sentry)
    if (featureFlags.enableErrorTracking) {
      // Sentry.captureException(error, { extra: errorInfo });
    }
    
    // Show user-friendly error message
    a11y.announce('An error occurred. Please try again.', 'assertive');
  },
};

/**
 * Network Status Monitor
 */
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private isOnline: boolean = navigator.onLine;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  private constructor() {
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));
  }

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  private updateStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    this.listeners.forEach(listener => listener(isOnline));
  }

  subscribe(listener: (isOnline: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): boolean {
    return this.isOnline;
  }
}

export default {
  queryClient,
  PerformanceMonitor,
  a11y,
  security,
  optimisticUpdate,
  featureFlags,
  bestPractices,
  globalErrorHandler,
  NetworkMonitor,
};