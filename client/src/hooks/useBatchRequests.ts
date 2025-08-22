import { useState, useCallback } from 'react';
import {
  batchGet,
  batchPost,
  batchPut,
  batchDelete,
  defaultBatcher,
  BatchRequestItem
} from '../utils/requestBatching';

/**
 * Custom hook for making batched API requests
 * 
 * @returns Object with methods for batched API calls and loading state
 */
export function useBatchRequests() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Batch multiple GET requests into a single network request
   * 
   * @param requests Array of requests with endpoint and optional parameters
   * @returns Array of responses in the same order as the requests
   */
  const batchGetRequests = useCallback(async <T = any>(
    requests: Array<{
      endpoint: string;
      params?: Record<string, any>;
    }>
  ): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // Execute all requests in parallel through the batcher
      const results = await Promise.all(
        requests.map(request => 
          batchGet<T>(request.endpoint, request.params)
        )
      );
      
      return results;
    } catch (_err) {
      const error = _err instanceof Error ? _err : new Error(String(_err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Batch multiple POST requests into a single network request
   * 
   * @param requests Array of requests with endpoint and data
   * @returns Array of responses in the same order as the requests
   */
  const batchPostRequests = useCallback(async <T = any>(
    requests: Array<{
      endpoint: string;
      data?: any;
    }>
  ): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // Execute all requests in parallel through the batcher
      const results = await Promise.all(
        requests.map(request => 
          batchPost<T>(request.endpoint, request.data)
        )
      );
      
      return results;
    } catch (_err) {
      const error = _err instanceof Error ? _err : new Error(String(_err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Batch multiple requests of any type into a single network request
   * 
   * @param requests Array of request objects
   * @returns Array of responses in the same order as the requests
   */
  const batchMixedRequests = useCallback(async <T = any>(
    requests: Array<Omit<BatchRequestItem, 'id'>>
  ): Promise<T[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // Add requests to the batcher and execute them
      const promiseQueue = requests.map(request => 
        defaultBatcher.add<T>(request)
      );
      
      // Wait for all requests to complete and return results
      const results = await Promise.all(promiseQueue);
      
      // Force the batcher to flush any remaining requests
      await defaultBatcher.flush();
      
      return results;
    } catch (_err) {
      const error = _err instanceof Error ? _err : new Error(String(_err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch data from multiple endpoints with a single network request
   * 
   * @param endpoints Array of API endpoints to fetch
   * @returns Object with data mapped to each endpoint
   */
  const fetchMultipleEndpoints = useCallback(async <T extends Record<string, any>>(
    endpoints: string[]
  ): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      // Create a request for each endpoint
      const requests = endpoints.map(endpoint => ({
        endpoint,
        method: 'GET' as const
      }));
      
      // Execute all requests in parallel
      const results = await batchMixedRequests(requests);
      
      // Map results to endpoints
      const mappedResults = endpoints.reduce((acc, endpoint, index) => {
        // Extract the last part of the endpoint as the key
        const key = endpoint.split('/').pop() || endpoint;
        acc[key] = results[index];
        return acc;
      }, {} as Record<string, any>);
      
      return mappedResults as T;
    } catch (_err) {
      const error = _err instanceof Error ? _err : new Error(String(_err));
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [batchMixedRequests]);

  /**
   * Cancel all pending batch requests
   */
  const cancelAllRequests = useCallback(() => {
    defaultBatcher.cancelAll();
    setLoading(false);
    setError(null);
  }, []);

  return {
    // Batch request methods
    batchGet: batchGetRequests,
    batchPost: batchPostRequests,
    batchMixed: batchMixedRequests,
    fetchMultiple: fetchMultipleEndpoints,
    cancelAll: cancelAllRequests,
    
    // State
    loading,
    error
  };
}

export default useBatchRequests; 