import { useState, useEffect, useRef, useCallback } from 'react';

interface MemoryOptimizerOptions {
  // Size threshold in MB to trigger cleanup
  threshold?: number;
  // Debug mode to log memory usage
  debug?: boolean;
  // Optional cleanup callback for custom cleanup
  cleanupCallback?: () => void;
  // How often to check memory in ms
  checkInterval?: number;
}

interface MemoryStats {
  // Total JS heap size limit in MB
  heapLimit: number;
  // Used JS heap size in MB
  heapUsed: number;
  // Percentage of heap used
  percentUsed: number;
  // Last time memory was checked
  lastChecked: Date;
  // Whether memory usage is high
  isHighMemoryUsage: boolean;
}

/**
 * A hook to monitor and optimize memory usage in components
 * that deal with large datasets or complex rendering
 */
function useMemoryOptimizer({
  threshold = 80, // Default to 80% of available heap
  debug = false,
  cleanupCallback,
  checkInterval = 5000 // Check every 5 seconds by default
}: MemoryOptimizerOptions = {}): [MemoryStats | null, () => void] {
  // Memory stats state
  const [memoryStats, setMemoryStats] = useState<MemoryStats | null>(null);
  
  // Interval ref to avoid memory leaks
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to get current memory usage
  const getMemoryUsage = useCallback((): MemoryStats | null => {
    // @ts-ignore - performance.memory is a Chrome-specific API
    if (window.performance && window.performance.memory) {
      // @ts-ignore
      const { jsHeapSizeLimit, usedJSHeapSize } = window.performance.memory;
      
      const heapLimit = jsHeapSizeLimit / (1024 * 1024); // Convert to MB
      const heapUsed = usedJSHeapSize / (1024 * 1024); // Convert to MB
      const percentUsed = (heapUsed / heapLimit) * 100;
      
      return {
        heapLimit,
        heapUsed,
        percentUsed,
        lastChecked: new Date(),
        isHighMemoryUsage: percentUsed > threshold
      };
    }
    
    return null;
  }, [threshold]);
  
  // Function to perform cleanup
  const performCleanup = useCallback(() => {
    // Call custom cleanup if provided
    if (cleanupCallback) {
      cleanupCallback();
    }
    
    // Internal cleanup actions
    // 1. Clear large objects in window
    if (window.gc) {
      try {
        // @ts-ignore - Not standard, but can be enabled with --expose-gc
        window.gc();
        if (debug) {
          console.log('Forced garbage collection');
        }
      } catch (_e) {
        if (debug) {
          console.warn('Failed to force garbage collection', e);
        }
      }
    }
    
    // 2. Clear console if in debug mode to free up memory
    if (debug) {
      console.clear();
      console.log('Memory cleanup performed');
    }
  }, [cleanupCallback, debug]);
  
  // Check memory usage periodically
  useEffect(() => {
    // Initial check
    const initialStats = getMemoryUsage();
    if (initialStats) {
      setMemoryStats(initialStats);
      
      if (initialStats.isHighMemoryUsage) {
        performCleanup();
      }
    }
    
    // Set up interval for checking memory
    intervalRef.current = setInterval(() => {
      const stats = getMemoryUsage();
      
      if (stats) {
        setMemoryStats(stats);
        
        if (debug) {
          console.log(`Memory Usage: ${stats.heapUsed.toFixed(2)}MB / ${stats.heapLimit.toFixed(2)}MB (${stats.percentUsed.toFixed(2)}%)`);
        }
        
        if (stats.isHighMemoryUsage) {
          if (debug) {
            console.warn(`High memory usage detected: ${stats.percentUsed.toFixed(2)}% (threshold: ${threshold}%)`);
          }
          performCleanup();
        }
      }
    }, checkInterval);
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Perform cleanup when component unmounts
      performCleanup();
    };
  }, [getMemoryUsage, performCleanup, debug, threshold, checkInterval]);
  
  // Manual cleanup function to expose
  const manualCleanup = useCallback(() => {
    performCleanup();
    
    // Refresh stats after cleanup
    const updatedStats = getMemoryUsage();
    if (updatedStats) {
      setMemoryStats(updatedStats);
    }
  }, [performCleanup, getMemoryUsage]);
  
  return [memoryStats, manualCleanup];
}

export default useMemoryOptimizer; 