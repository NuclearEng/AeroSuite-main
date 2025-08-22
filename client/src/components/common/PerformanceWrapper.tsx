import React, { memo, useCallback, useMemo, ReactNode } from 'react';
import { useInView, InViewHookResponse } from 'react-intersection-observer';

interface PerformanceWrapperProps {
  children: ReactNode;
  /**
   * Enable intersection observer for lazy rendering
   */
  lazyRender?: boolean;
  /**
   * Threshold for intersection observer (0-1)
   */
  threshold?: number;
  /**
   * Root margin for intersection observer
   */
  rootMargin?: string;
  /**
   * Placeholder to show while content is not in view
   */
  placeholder?: ReactNode;
  /**
   * Enable memoization
   */
  memoize?: boolean;
  /**
   * Dependencies for memoization
   */
  memoDeps?: any[];
}

/**
 * Performance wrapper component that provides:
 * - Lazy rendering with intersection observer
 * - Automatic memoization
 * - Render performance tracking
 */
const PerformanceWrapper: React.FC<PerformanceWrapperProps> = ({
  children,
  lazyRender = false,
  threshold = 0.1,
  rootMargin = '100px',
  placeholder = null,
  memoize = true,
  memoDeps = [],
}) => {
  const [ref, inView] = useInView({
    threshold,
    rootMargin,
    triggerOnce: true,
    skip: !lazyRender,
  });

  // Memoize children if enabled
  const memoizedChildren = useMemo(
    () => children,
    memoize ? memoDeps : [children]
  );

  // Track render performance in development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark('component-render-start');
      
      return () => {
        performance.mark('component-render-end');
        performance.measure(
          'component-render',
          'component-render-start',
          'component-render-end'
        );
      };
    }
  }, []);

  if (lazyRender && !inView) {
    return <div ref={ref}>{placeholder}</div>;
  }

  return <div ref={lazyRender ? ref : undefined}>{memoizedChildren}</div>;
};

// Export memoized version
export default memo(PerformanceWrapper);

/**
 * Higher-order component for automatic performance optimization
 */
export function withPerformance<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<PerformanceWrapperProps, 'children'> = {}
): React.FC<P> {
  const WrappedComponent = (props: P) => (
    <PerformanceWrapper {...options}>
      <Component {...props} />
    </PerformanceWrapper>
  );

  WrappedComponent.displayName = `withPerformance(${Component.displayName || Component.name})`;

  return memo(WrappedComponent) as unknown as React.FC<P>;
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttling callbacks
 */
export function useThrottle(callback: (...args: any[]) => void, delay: number) {
  const lastRun = React.useRef(Date.now());

  return useCallback(
    (...args: any[]) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    },
    [callback, delay]
  );
}

/**
 * Virtual list component for rendering large lists efficiently
 */
interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = React.useState(0);
  const scrollElementRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = useThrottle(() => {
    if (scrollElementRef.current) {
      setScrollTop(scrollElementRef.current.scrollTop);
    }
  }, 100);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + height) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={scrollElementRef}
      style={{
        height,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index: any) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}