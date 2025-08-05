import { useState, useCallback } from 'react';
import { 
  AppError, 
  ErrorRecoveryAction, 
  handleError, 
  parseApiError,
  getErrorRecoveryActions
} from '../utils/errorHandling';

interface UseErrorHandlingOptions {
  context?: string;
  defaultRecoveryAction?: ErrorRecoveryAction;
  onError?: (error: AppError) => void;
}

/**
 * Custom hook for handling errors consistently across the application
 */
export const useErrorHandling = (options: UseErrorHandlingOptions = {}) => {
  const [error, setError] = useState<AppError | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Handle an error with consistent approach
   */
  const handleAppError = useCallback((err: any) => {
    const appError = handleError(err, {
      context: options.context,
      onError: options.onError
    });
    
    setError(appError);
    setIsDialogOpen(true);
    
    return appError;
  }, [options.context, options.onError]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
    setIsDialogOpen(false);
  }, []);

  /**
   * Close the error dialog
   */
  const closeErrorDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  /**
   * Get recovery actions for the current error
   */
  const getRecoveryActions = useCallback(() => {
    if (!error) return [];
    
    return getErrorRecoveryActions(error, options.defaultRecoveryAction);
  }, [error, options.defaultRecoveryAction]);

  /**
   * Wrap an async function with error handling
   */
  const withErrorHandling = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        return await fn(...args);
      } catch (_err) {
        handleAppError(err);
        return undefined;
      }
    };
  }, [handleAppError]);

  /**
   * Execute an async function with error handling
   */
  const executeWithErrorHandling = useCallback(async <T>(
    fn: () => Promise<T>
  ): Promise<T | undefined> => {
    try {
      return await fn();
    } catch (_err) {
      handleAppError(err);
      return undefined;
    }
  }, [handleAppError]);

  return {
    error,
    isDialogOpen,
    handleError: handleAppError,
    clearError,
    closeErrorDialog,
    getRecoveryActions,
    withErrorHandling,
    executeWithErrorHandling
  };
};

export default useErrorHandling; 