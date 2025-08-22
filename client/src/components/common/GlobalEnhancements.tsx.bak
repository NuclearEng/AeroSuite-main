import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NetworkMonitor, PerformanceMonitor, a11y } from '../../utils/enhance-application';
import { useSnackbar } from 'notistack';

/**
 * Global Enhancements Component
 * Provides application-wide enhancements for performance, accessibility, and UX
 */
const GlobalEnhancements: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  
  // Network status monitoring
  useEffect(() => {
    const networkMonitor = NetworkMonitor.getInstance();
    
    const unsubscribe = networkMonitor.subscribe((isOnline) => {
      if (isOnline) {
        enqueueSnackbar('Connection restored', { variant: 'success' });
        a11y.announce('Internet connection restored');
      } else {
        enqueueSnackbar('No internet connection', { variant: 'warning' });
        a11y.announce('Lost internet connection');
      }
    });
    
    return unsubscribe;
  }, [enqueueSnackbar]);
  
  // Route change announcements for screen readers
  useEffect(() => {
    const pageName = location.pathname.split('/')[1] || 'home';
    const formattedPageName = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    a11y.announce(`Navigated to ${formattedPageName} page`);
  }, [location]);
  
  // Performance monitoring
  useEffect(() => {
    const performanceMonitor = PerformanceMonitor.getInstance();
    
    // Log navigation timing
    if ('performance' in window && 'timing' in window.performance) {
      const navTiming = window.performance.timing;
      const pageLoadTime = navTiming.loadEventEnd - navTiming.navigationStart;
      console.log(`Page load time: ${pageLoadTime}ms`);
    }
    
    // Clean up old metrics periodically
    const interval = setInterval(() => {
      performanceMonitor.clearMetrics();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Trigger search modal
        document.dispatchEvent(new CustomEvent('openSearch'));
      }
      
      // Ctrl/Cmd + / for help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        // Navigate to help
        window.location.href = '/help';
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
  
  // Detect and warn about performance issues
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
            // Warn if any operation takes more than 1 second
            if (entry.duration > 1000) {
              console.warn(`Slow operation detected: ${entry.name} took ${entry.duration}ms`);
            }
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['measure', 'navigation'] });
      } catch (e) {
        // Some browsers don't support all entry types
      }
      
      return () => observer.disconnect();
    }
  }, []);
  
  // Prefetch critical resources
  useEffect(() => {
    // Prefetch key API endpoints
    const criticalEndpoints = [
      '/api/auth/me',
      '/api/suppliers',
      '/api/customers',
      '/api/inspections',
    ];
    
    criticalEndpoints.forEach(endpoint => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = endpoint;
      document.head.appendChild(link);
    });
  }, []);
  
  return <>{children}</>;
};

export default GlobalEnhancements;