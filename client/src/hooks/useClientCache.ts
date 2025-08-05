/**
 * Custom hook for client-side data caching in React components
 * 
 * This hook provides a convenient API for using the client data cache
 * within React components, with built-in state management and re-render triggers.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import clientDataCache, { 
  CacheOptions, 
  CacheStrategy, 
  CachedResponse,
  DEFAULT_TTL
} from '../utils/clientDataCache';

export interface UseClientCacheOptions<T> extends CacheOptions {
  /**
   * Initial data to use while loading
   */
  initialData?: T;
  
  /**
   * Should the hook trigger a fetch on mount
   */
  fetchOnMount?: boolean;
  
  /**
   * Should loading state be set to true on initial fetch
   */
  skipLoadingOnInitialData?: boolean;
  
  /**
   * Function to determine if data should be refetched
   */
  shouldRefetch?: (data: T | undefined) => boolean;
  
  /**
   * Dependencies array that will trigger a refetch when changed
   */
  deps?: React.DependencyList;
  
  /**
   * Function to process data after fetching
   */
  processData?: (data: T) => T;
  
  /**
   * Object for automatic storage of paginated data
   */
  pagination?: {
    currentPage: number;
    totalPages?: number;
    pageSize: number;
    // If true, fetches will add to existing data rather than replace
    appendResults?: boolean;
  };
  
  /**
   * Error handler function
   */
  onError?: (error: Error) => void;
}

/**
 * Hook result containing data, loading state, and utility functions
 */
export interface UseClientCacheResult<T> {
  /**
   * The cached or fetched data
   */
  data: T | undefined;
  
  /**
   * Loading state
   */
  loading: boolean;
  
  /**
   * Error state
   */
  error: Error | null;
  
  /**
   * Function to trigger a refresh of the data
   */
  refresh: () => Promise<void>;
  
  /**
   * Clear the cached data
   */
  clearCache: () => Promise<void>;
  
  /**
   * Manually update the cached data
   */
  updateData: (newData: T | ((prev: T | undefined) => T)) => Promise<void>;
  
  /**
   * Whether the current data came from cache
   */
  isFromCache: boolean;
  
  /**
   * Timestamp of the last data update
   */
  lastUpdated: number | null;
  
  /**
   * Function to fetch more data (for pagination)
   */
  fetchMore?: () => Promise<void>;
  
  /**
   * Whether there is more data to fetch
   */
  hasMore?: boolean;
}

/**
 * Hook for client-side data caching in React components
 * 
 * @param key Unique key for the cache entry
 * @param fetchFn Function to fetch data
 * @param options Caching options
 * @returns Hook result with data, loading state, and utility functions
 */
export function useClientCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseClientCacheOptions<T> = {}
): UseClientCacheResult<T> {
  const {
    initialData,
    fetchOnMount = true,
    skipLoadingOnInitialData = false,
    shouldRefetch,
    deps = [],
    processData,
    pagination,
    onError,
    ...cacheOptions
  } = options;
  
  // Set up state
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(fetchOnMount && !(initialData && skipLoadingOnInitialData));
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState<boolean | undefined>(undefined);
  
  // Use refs for mutable values that shouldn't trigger re-renders
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);
  const paginatedDataRef = useRef<Record<number, T[]>>({});
  
  // Create a stable cache key that includes pagination if present
  const cacheKey = pagination 
    ? `${key}:page:${pagination.currentPage}:size:${pagination.pageSize}` 
    : key;
  
  // Function to fetch data and update state
  const fetchData = useCallback(async (forceFetch = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    // Skip if not mounted
    if (!mountedRef.current) {
      fetchingRef.current = false;
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the client data cache to fetch with the appropriate strategy
      const response = await clientDataCache.fetch<T>(
        fetchFn,
        { 
          ...cacheOptions,
          key: cacheKey,
          // Force network fetch if requested
          strategy: forceFetch ? CacheStrategy.NETWORK_ONLY : cacheOptions.strategy
        }
      );
      
      // Skip updating state if component unmounted during fetch
      if (!mountedRef.current) {
        fetchingRef.current = false;
        return;
      }
      
      // Process data if needed
      const processedData = processData ? processData(response.data) : response.data;
      
      // Handle pagination if configured
      if (pagination && pagination.appendResults && Array.isArray(processedData)) {
        // Store this page in the paginated data reference
        paginatedDataRef.current[pagination.currentPage] = processedData as unknown as T[];
        
        // Combine all pages up to the current page
        const allData: any[] = [];
        for (let i = 1; i <= pagination.currentPage; i++) {
          if (paginatedDataRef.current[i]) {
            allData.push(...paginatedDataRef.current[i]);
          }
        }
        
        setData(allData as unknown as T);
        
        // Update hasMore state
        if (pagination.totalPages !== undefined) {
          setHasMore(pagination.currentPage < pagination.totalPages);
        } else if (Array.isArray(processedData)) {
          // If no totalPages provided, assume there's more if we got a full page
          setHasMore((processedData as any).length >= pagination.pageSize);
        }
      } else {
        // Standard non-paginated update
        setData(processedData);
      }
      
      setIsFromCache(response.source === 'cache');
      setLastUpdated(response.timestamp);
    } catch (_err) {
      // Skip updating state if component unmounted during fetch
      if (!mountedRef.current) {
        fetchingRef.current = false;
        return;
      }
      
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (onError) {
        onError(error);
      } else {
        console.error('Error fetching data:', error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [
    fetchFn, 
    cacheKey, 
    cacheOptions, 
    processData, 
    pagination, 
    onError
  ]);
  
  // Function to manually refresh the data
  const refresh = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);
  
  // Function to clear the cache
  const clearCache = useCallback(async () => {
    await clientDataCache.invalidate(cacheKey);
    
    // Reset paginated data if using pagination
    if (pagination) {
      paginatedDataRef.current = {};
    }
    
    // Don't need to set data to undefined here as this doesn't
    // change the component state, just clears the cache for next fetch
  }, [cacheKey, pagination]);
  
  // Function to manually update the cached data
  const updateData = useCallback(async (newData: T | ((prev: T | undefined) => T)) => {
    const updatedData = typeof newData === 'function'
      ? (newData as Function)(data)
      : newData;
    
    // Update local state
    setData(updatedData);
    setLastUpdated(Date.now());
    setIsFromCache(false);
    
    // Update cache
    await clientDataCache.set(cacheKey, updatedData, cacheOptions);
  }, [data, cacheKey, cacheOptions]);
  
  // Function to fetch the next page of data
  const fetchMore = useCallback(async () => {
    if (!pagination || !hasMore || loading) return;
    
    // Create a function that fetches the next page
    const nextPageFn = async () => {
      // We're creating a temporary function that calls the original fetchFn
      // but with a modified URL or parameters for the next page
      const result = await fetchFn();
      return result;
    };
    
    // Use the client data cache to fetch the next page
    try {
      setLoading(true);
      
      const response = await clientDataCache.fetch<T>(
        nextPageFn,
        { 
          ...cacheOptions,
          key: `${key}:page:${pagination.currentPage + 1}:size:${pagination.pageSize}`
        }
      );
      
      if (!mountedRef.current) return;
      
      // Process data if needed
      const processedData = processData ? processData(response.data) : response.data;
      
      // Store this page in the paginated data reference
      paginatedDataRef.current[pagination.currentPage + 1] = processedData as unknown as T[];
      
      // Combine all pages up to the current page
      const allData: any[] = [];
      for (let i = 1; i <= pagination.currentPage + 1; i++) {
        if (paginatedDataRef.current[i]) {
          allData.push(...paginatedDataRef.current[i]);
        }
      }
      
      setData(allData as unknown as T);
      
      // Update hasMore state
      if (pagination.totalPages !== undefined) {
        setHasMore((pagination.currentPage + 1) < pagination.totalPages);
      } else if (Array.isArray(processedData)) {
        // If no totalPages provided, assume there's more if we got a full page
        setHasMore((processedData as any).length >= pagination.pageSize);
      }
      
      setLastUpdated(response.timestamp);
    } catch (_err) {
      if (!mountedRef.current) return;
      
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      
      if (onError) {
        onError(error);
      } else {
        console.error('Error fetching more data:', error);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    pagination,
    hasMore,
    loading,
    fetchFn, 
    cacheOptions,
    key,
    processData,
    onError
  ]);
  
  // Set up automatic fetching on mount
  useEffect(() => {
    mountedRef.current = true;
    
    if (fetchOnMount) {
      fetchData();
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData, fetchOnMount]);
  
  // Set up automatic refetching when dependencies change
  useEffect(() => {
    // Skip the initial render
    if (deps.length > 0) {
      // If shouldRefetch function is provided, use it to determine if we should refetch
      if (shouldRefetch) {
        if (shouldRefetch(data)) {
          fetchData();
        }
      } else {
        // Otherwise, always refetch when deps change
        fetchData();
      }
    }
  }, deps);
  
  return {
    data,
    loading,
    error,
    refresh,
    clearCache,
    updateData,
    isFromCache,
    lastUpdated,
    fetchMore: pagination ? fetchMore : undefined,
    hasMore: pagination ? hasMore : undefined
  };
}

/**
 * Simplified hook for client-side data caching when you just need basic functionality
 * 
 * @param key Unique key for the cache entry
 * @param fetchFn Function to fetch data
 * @param ttl Time-to-live in milliseconds
 * @returns Data, loading state, and a refresh function
 */
export function useSimpleCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl = DEFAULT_TTL.MEDIUM
): { data: T | undefined; loading: boolean; refresh: () => Promise<void> } {
  const { data, loading, refresh } = useClientCache(key, fetchFn, { ttl });
  return { data, loading, refresh };
}

/**
 * Hook to cache user preferences persistently
 * 
 * @param key Preference key
 * @param defaultValue Default value if not found in cache
 * @returns Current value and setter function
 */
export function useClientPreference<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => Promise<void>] {
  const [value, setValue] = useState<T>(defaultValue);
  const initialized = useRef(false);
  
  // Load the value from cache on mount
  useEffect(() => {
    if (!initialized.current) {
      const loadValue = async () => {
        try {
          const cachedValue = await clientDataCache.get<T>(key, {
            strategy: CacheStrategy.LOCAL_STORAGE,
            ttl: DEFAULT_TTL.PERMANENT
          });
          
          if (cachedValue !== undefined) {
            setValue(cachedValue);
          }
        } catch (_error) {
          console.warn(`Failed to load preference: ${key}`, error);
        }
        
        initialized.current = true;
      };
      
      loadValue();
    }
  }, [key]);
  
  // Function to update the value
  const updateValue = useCallback(async (newValue: T) => {
    setValue(newValue);
    
    try {
      await clientDataCache.set(key, newValue, {
        strategy: CacheStrategy.LOCAL_STORAGE,
        ttl: DEFAULT_TTL.PERMANENT
      });
    } catch (_error) {
      console.warn(`Failed to save preference: ${key}`, error);
    }
  }, [key]);
  
  return [value, updateValue];
}

export default useClientCache; 