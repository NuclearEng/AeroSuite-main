/**
 * Progressive Loading Utilities
 * 
 * This module provides utilities for progressively loading and rendering large datasets
 * to improve performance and user experience.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for progressive loading of large datasets
 * 
 * @param {Array} data - The complete dataset to progressively load
 * @param {Object} options - Configuration options
 * @param {number} options.initialBatchSize - Number of items to load initially (default: 20)
 * @param {number} options.batchSize - Number of items to load in each subsequent batch (default: 10)
 * @param {number} options.interval - Time in ms between loading batches when scrolling isn't detected (default: 100)
 * @param {number} options.maxItems - Maximum number of items to display (default: Infinity)
 * @param {Function} options.onLoadComplete - Callback function called when all data is loaded
 * @returns {Object} - The progressively loaded data and control functions
 */
export function useProgressiveLoading(data = [], options = {}) {
  const {
    initialBatchSize = 20,
    batchSize = 10,
    interval = 100,
    maxItems = Infinity,
    onLoadComplete = () => {},
  } = options;

  const [displayedData, setDisplayedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedAll, setLoadedAll] = useState(false);
  const timeoutRef = useRef(null);
  const loadedCountRef = useRef(0);

  // Function to load the next batch of data
  const loadNextBatch = useCallback(() => {
    if (loadedCountRef.current >= data.length || loadedCountRef.current >= maxItems) {
      setLoadedAll(true);
      setIsLoading(false);
      onLoadComplete();
      return;
    }

    setIsLoading(true);
    const nextBatchSize = loadedCountRef.current === 0 ? initialBatchSize : batchSize;
    const endIndex = Math.min(
      loadedCountRef.current + nextBatchSize,
      data.length,
      maxItems
    );

    const newBatch = data.slice(loadedCountRef.current, endIndex);
    loadedCountRef.current = endIndex;

    setDisplayedData(current => [...current, ...newBatch]);

    if (loadedCountRef.current >= data.length || loadedCountRef.current >= maxItems) {
      setLoadedAll(true);
      setIsLoading(false);
      onLoadComplete();
    } else {
      setIsLoading(false);
    }
  }, [data, initialBatchSize, batchSize, maxItems, onLoadComplete]);

  // Load initial batch
  useEffect(() => {
    loadedCountRef.current = 0;
    setDisplayedData([]);
    setLoadedAll(false);
    setIsLoading(true);
    loadNextBatch();
    
    // Cleanup function to clear any pending timeouts
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, loadNextBatch]);

  // Function to manually trigger loading more data
  const loadMore = useCallback(() => {
    if (!isLoading && !loadedAll) {
      loadNextBatch();
    }
  }, [isLoading, loadedAll, loadNextBatch]);

  // Auto-load function with delay
  const autoLoad = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (!loadedAll && !isLoading) {
      timeoutRef.current = setTimeout(() => {
        loadNextBatch();
      }, interval);
    }
  }, [loadedAll, isLoading, interval, loadNextBatch]);

  // Reset function to start over
  const reset = useCallback(() => {
    loadedCountRef.current = 0;
    setDisplayedData([]);
    setLoadedAll(false);
    loadNextBatch();
  }, [loadNextBatch]);

  return {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    autoLoad,
    reset,
    progress: data.length > 0 ? loadedCountRef.current / Math.min(data.length, maxItems) : 0,
    loadedCount: loadedCountRef.current,
    totalCount: Math.min(data.length, maxItems),
  };
}

/**
 * Custom hook for progressive loading with scroll detection
 * 
 * @param {Array} data - The complete dataset to progressively load
 * @param {Object} options - Configuration options (same as useProgressiveLoading)
 * @param {number} options.threshold - Distance in pixels from bottom to trigger loading (default: 200)
 * @returns {Object} - The progressively loaded data and control functions
 */
export function useScrollProgressiveLoading(data = [], options = {}) {
  const { threshold = 200, ...progressiveLoadingOptions } = options;
  const scrollRef = useRef(null);
  
  const {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    reset,
    progress,
    loadedCount,
    totalCount,
  } = useProgressiveLoading(data, progressiveLoadingOptions);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current || isLoading || loadedAll) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const scrolledToBottom = scrollHeight - scrollTop - clientHeight < threshold;
      
      if (scrolledToBottom) {
        loadMore();
      }
    };

    const currentRef = scrollRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [isLoading, loadedAll, loadMore, threshold]);

  return {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    reset,
    scrollRef,
    progress,
    loadedCount,
    totalCount,
  };
}

/**
 * Custom hook for progressive loading with intersection observer
 * 
 * @param {Array} data - The complete dataset to progressively load
 * @param {Object} options - Configuration options (same as useProgressiveLoading)
 * @returns {Object} - The progressively loaded data, control functions, and sentinel ref
 */
export function useIntersectionProgressiveLoading(data = [], options = {}) {
  const sentinelRef = useRef(null);
  
  const {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    reset,
    progress,
    loadedCount,
    totalCount,
  } = useProgressiveLoading(data, options);

  // Set up intersection observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && !loadedAll) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sentinelRef.current);

    return () => {
      if (sentinelRef.current) {
        observer.unobserve(sentinelRef.current);
      }
    };
  }, [isLoading, loadedAll, loadMore]);

  return {
    data: displayedData,
    isLoading,
    loadedAll,
    loadMore,
    reset,
    sentinelRef,
    progress,
    loadedCount,
    totalCount,
  };
}

/**
 * Creates a paginated version of a large dataset with progressive loading capabilities
 * 
 * @param {Array} data - The complete dataset to paginate
 * @param {Object} options - Configuration options
 * @param {number} options.pageSize - Number of items per page (default: 20)
 * @param {number} options.maxLoadedPages - Maximum number of pages to keep in memory (default: 5)
 * @returns {Object} - Pagination state and control functions
 */
export function useProgressivePagination(data = [], options = {}) {
  const { pageSize = 20, maxLoadedPages = 5 } = options;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [loadedPages, setLoadedPages] = useState([1]);
  const [isLoading, setIsLoading] = useState(false);
  
  const totalPages = Math.ceil(data.length / pageSize);
  
  // Get current page data
  const getCurrentPageData = useCallback(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [currentPage, data, pageSize]);
  
  const [currentPageData, setCurrentPageData] = useState(getCurrentPageData());
  
  // Update page data when current page or data changes
  useEffect(() => {
    setCurrentPageData(getCurrentPageData());
  }, [currentPage, data, getCurrentPageData]);
  
  // Load a specific page
  const goToPage = useCallback(async (page) => {
    if (page < 1 || page > totalPages) return;
    
    setIsLoading(true);
    
    // Simulate network delay for remote data fetching
    if (!loadedPages.includes(page)) {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Add to loaded pages and maintain max loaded pages limit
      setLoadedPages(prevPages => {
        const newPages = [...prevPages, page];
        if (newPages.length > maxLoadedPages) {
          // Remove pages that are furthest from the current page
          // but keep the first and last pages
          return newPages
            .sort((a, b) => Math.abs(page - a) - Math.abs(page - b))
            .slice(0, maxLoadedPages);
        }
        return newPages;
      });
    }
    
    setCurrentPage(page);
    setIsLoading(false);
  }, [totalPages, loadedPages, maxLoadedPages]);
  
  // Navigation functions
  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);
  
  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);
  
  const firstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);
  
  const lastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);
  
  return {
    currentPage,
    totalPages,
    pageSize,
    isLoading,
    data: currentPageData,
    loadedPages,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * Utility to create chunked versions of large arrays for progressive rendering
 * 
 * @param {Array} array - The array to chunk
 * @param {number} size - The size of each chunk
 * @returns {Array} - Array of chunks
 */
export function chunkArray(array, size) {
  if (!array || !Array.isArray(array)) return [];
  
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Utility to create a delayed rendering component
 * This is useful for progressively rendering large lists
 * 
 * @param {Function} callback - Function to call after delay
 * @param {number} delay - Delay in milliseconds
 */
export function useDelayedRender(callback, delay = 0) {
  useEffect(() => {
    const timer = setTimeout(() => {
      callback();
    }, delay);
    
    return () => clearTimeout(timer);
  }, [callback, delay]);
}

/**
 * Utility to throttle a function call
 * Useful for handling scroll events in progressive loading
 * 
 * @param {Function} func - Function to throttle
 * @param {number} limit - Throttle limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
} 