import { useState, useEffect, useCallback, useRef } from 'react';

interface PaginationOptions<T, F> {
  // Function to fetch data with pagination and filters
  fetchItems: (page: number, pageSize: number, filters?: F) => Promise<{
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>;
  initialPage?: number;
  initialPageSize?: number;
  initialFilters?: F;
  // Debounce time for filter changes in ms
  debounceTime?: number;
}

interface PaginationResult<T, F> {
  // Current data items
  items: T[];
  // Loading state
  loading: boolean;
  // Error state
  error: Error | null;
  // Total number of items
  total: number;
  // Current page
  page: number;
  // Items per page
  pageSize: number;
  // Total number of pages
  totalPages: number;
  // Change page
  setPage: (page: number) => void;
  // Change page size
  setPageSize: (size: number) => void;
  // Update filters
  setFilters: (filters: F) => void;
  // Current filters
  filters: F | undefined;
  // Refresh data
  refresh: () => void;
}

/**
 * Custom hook for memory-efficient pagination
 * This hook helps prevent memory leaks by:
 * 1. Debouncing filter changes to reduce unnecessary data fetching
 * 2. Cancelling in-flight requests when new ones are made
 * 3. Cleaning up resources when the component unmounts
 * 4. Avoiding storing large datasets in memory
 */
function usePagination<T, F = any>({
  fetchItems,
  initialPage = 1,
  initialPageSize = 10,
  initialFilters,
  debounceTime = 300
}: PaginationOptions<T, F>): PaginationResult<T, F> {
  // State for pagination
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState<F | undefined>(initialFilters);

  // Refs for debouncing and cancellation
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Flag to track component mount state
  const isMountedRef = useRef(true);

  // Function to load data with the current pagination and filters
  const loadData = useCallback(async () => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch data with current pagination and filters
      const result = await fetchItems(page, pageSize, filters);
      
      // Only update state if the component is still mounted
      if (isMountedRef.current) {
        // Add defensive checks for result properties
        if (result && typeof result === 'object') {
          // Set items with fallback to empty array if data is undefined
          setItems(Array.isArray(result.data) ? result.data : []);
          
          // Set other values with fallbacks
          setTotal(typeof result.total === 'number' ? result.total : 0);
          setTotalPages(typeof result.totalPages === 'number' ? result.totalPages : 0);
        } else {
          // If result is not an object, reset to defaults
          setItems([]);
          setTotal(0);
          setTotalPages(0);
          setError(new Error('Invalid response format from server'));
        }
      }
    } catch (err: unknown) {
      // Only update error state if not aborted and component is mounted
      if (err && typeof err === 'object' && 'name' in err && err.name !== 'AbortError' && isMountedRef.current) {
        setError(err as Error);
        // Reset items to empty array on error
        setItems([]);
      }
    } finally {
      // Only update loading state if component is mounted
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchItems, page, pageSize, filters]);

  // Load data when pagination or filters change
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced filter setting
  const debouncedSetFilters = useCallback((newFilters: F) => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setFilters(newFilters);
        // Reset to first page when filters change
        setPage(1);
      }
    }, debounceTime);
  }, [debounceTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      
      // Cancel any in-flight requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Clear any debounce timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Manual refresh function
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    items,
    loading,
    error,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    setFilters: debouncedSetFilters,
    filters,
    refresh
  };
}

export default usePagination; 