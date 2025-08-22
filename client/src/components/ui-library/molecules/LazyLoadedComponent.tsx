import React, { useState, useRef, useEffect } from 'react';
import { CircularProgress, Box } from '@mui/material';
import { useVisibilityLazyLoad } from '../../../utils/lazyLoading';

/**
 * LazyLoadedComponent
 * 
 * A generic wrapper component that lazy loads any component when it becomes
 * visible in the viewport. This helps improve initial page load performance
 * by deferring the loading of off-screen components.
 * 
 * Implementation of RF034 - Add lazy loading for routes and components
 */

interface LazyLoadedComponentProps<T = any> {
  /**
   * Import function that returns the component to lazy load
   */
  importFn: () => Promise<{ default: React.ComponentType<T> }>;
  
  /**
   * Props to pass to the loaded component
   */
  componentProps?: T;
  
  /**
   * Height of the placeholder while loading
   */
  height?: string | number;
  
  /**
   * Width of the placeholder while loading
   */
  width?: string | number;
  
  /**
   * Custom placeholder to show while loading
   */
  placeholder?: React.ReactNode;
  
  /**
   * Root margin for the intersection observer
   */
  rootMargin?: string;
  
  /**
   * Threshold for the intersection observer
   */
  threshold?: number;
  
  /**
   * Whether to show a loading indicator
   */
  showLoading?: boolean;
  
  /**
   * Whether to show an error if loading fails
   */
  showError?: boolean;
  
  /**
   * Called when the component becomes visible
   */
  onVisible?: () => void;
  
  /**
   * Called when the component is loaded
   */
  onLoad?: (component: React.ComponentType<T>) => void;
  
  /**
   * Called when the component fails to load
   */
  onError?: (error: Error) => void;
  
  /**
   * CSS class name for the container
   */
  className?: string;
}

/**
 * Default loading placeholder
 */
const DefaultPlaceholder = ({ height, width }: { height?: string | number, width?: string | number }) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    height={height || 200}
    width={width || '100%'}
    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
  >
    <CircularProgress size={40} />
  </Box>
);

/**
 * Default error display
 */
const DefaultError = ({ message }: { message: string }) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    height={200}
    width="100%"
    sx={{ bgcolor: '#fff8f8', border: '1px solid #ffcdd2', borderRadius: 1, color: '#d32f2f', p: 2 }}
  >
    <p>Error loading component: {message}</p>
  </Box>
);

/**
 * LazyLoadedComponent implementation
 */
export function LazyLoadedComponent<T = any>({
  importFn,
  componentProps,
  height,
  width,
  placeholder,
  rootMargin = '100px',
  threshold = 0,
  showLoading = true,
  showError = true,
  onVisible,
  onLoad,
  onError,
  className = ''
}: LazyLoadedComponentProps<T>) {
  const defaultPlaceholderHeight = height || 200;
  const defaultFallback = placeholder || (showLoading ? <DefaultPlaceholder height={height} width={width} /> : null);
  
  const {
    ref,
    Component,
    isVisible,
    isLoaded,
    placeholderHeight = defaultPlaceholderHeight,
    fallback = defaultFallback
  } = useVisibilityLazyLoad<T>(importFn, {
    rootMargin,
    threshold,
    placeholderHeight: defaultPlaceholderHeight,
    fallback: defaultFallback,
    onVisible,
    onLoad
  });
  
  const [error, setError] = useState<any>(null);
  
  // Handle errors during rendering
  useEffect(() => {
    const errorHandler = (event: ErrorEvent) => {
      if (isLoaded && Component) {
        setError(new Error(event.message));
        onError?.(new Error(event.message));
      }
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, [Component, isLoaded, onError]);
  
  return (
    <div 
      ref={ref}
      className={`lazy-component-container ${className}`}
      style={{ 
        minHeight: isLoaded ? 'auto' : placeholderHeight,
        width: width || '100%'
      }}
    >
      {!isLoaded && isVisible && fallback}
      
      {isLoaded && Component && !error && (
        <Component {...(componentProps as any)} />
      )}
      
      {error && showError && (
        <DefaultError message={error.message} />
      )}
    </div>
  );
}

export default LazyLoadedComponent; 