import { useState, useCallback, useEffect } from 'react';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface LoadingStateOptions {
  /**
   * Initial loading state
   */
  initialState?: LoadingState;
  
  /**
   * Minimum loading time in milliseconds
   */
  minLoadingTime?: number;
  
  /**
   * Auto-reset to idle after success or error
   */
  autoReset?: boolean;
  
  /**
   * Auto-reset delay in milliseconds
   */
  resetDelay?: number;
  
  /**
   * Callback when loading state changes
   */
  onStateChange?: (state: LoadingState) => void;
}

/**
 * Hook for managing loading states
 * 
 * @param options - Loading state options
 * @returns Loading state utilities
 */
export function useLoadingState(options: LoadingStateOptions = {}) {
  const {
    initialState = 'idle',
    minLoadingTime = 0,
    autoReset = false,
    resetDelay = 3000,
    onStateChange
  } = options;
  
  const [state, setState] = useState<LoadingState>(initialState);
  const [error, setErrorState] = useState<Error | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Set loading state with minimum duration
  const setLoading = useCallback(() => {
    setState('loading');
    setStartTime(Date.now());
    setErrorState(null);
    onStateChange?.('loading');
  }, [onStateChange]);
  
  // Set success state with minimum loading time
  const setSuccess = useCallback(() => {
    if (startTime && minLoadingTime > 0) {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      
      if (remainingTime > 0) {
        setTimeout(() => {
          setState('success');
          onStateChange?.('success');
        }, remainingTime);
        return;
      }
    }
    
    setState('success');
    onStateChange?.('success');
  }, [startTime, minLoadingTime, onStateChange]);
  
  // Set error state with minimum loading time
  const setError = useCallback((err: Error) => {
    if (startTime && minLoadingTime > 0) {
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsed);
      
      if (remainingTime > 0) {
        setTimeout(() => {
          setState('error');
          setErrorState(err);
          onStateChange?.('error');
        }, remainingTime);
        return;
      }
    }
    
    setState('error');
    setErrorState(err);
    onStateChange?.('error');
  }, [startTime, minLoadingTime, onStateChange]);
  
  // Reset to idle state
  const reset = useCallback(() => {
    setState('idle');
    setStartTime(null);
    setErrorState(null);
    onStateChange?.('idle');
  }, [onStateChange]);
  
  // Auto-reset after success or error
  useEffect(() => {
    if (autoReset && (state === 'success' || state === 'error') && resetDelay > 0) {
      const timer = setTimeout(() => {
        reset();
      }, resetDelay);
      
      return () => clearTimeout(timer);
    }
  }, [state, autoReset, resetDelay, reset]);
  
  // Wrap an async function with loading state
  const wrapAsync = useCallback(<T>(asyncFn: () => Promise<T>): Promise<T> => {
    setLoading();
    
    return asyncFn()
      .then((result) => {
        setSuccess();
        return result;
      })
      .catch((err) => {
        setError(err);
        throw err;
      });
  }, [setLoading, setSuccess, setError]);
  
  return {
    state,
    error,
    isIdle: state === 'idle',
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    setLoading,
    setSuccess,
    setError,
    reset,
    wrapAsync
  };
}

export default useLoadingState; 