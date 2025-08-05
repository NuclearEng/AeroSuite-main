import axios, { AxiosError } from 'axios';

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
  BUSINESS_LOGIC = 'business_logic'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Error interface with additional context
 */
export interface AppError {
  type: ErrorType;
  message: string;
  severity: ErrorSeverity;
  originalError?: any;
  code?: string;
  field?: string;
  recoveryPath?: string;
  timestamp: Date;
  requestId?: string;
}

/**
 * Error recovery actions
 */
export interface ErrorRecoveryAction {
  label: string;
  action: () => void;
  primary?: boolean;
}

/**
 * Parse API error response to get error details
 * @param error - The error object from API
 * @returns Parsed error details
 */
export const parseApiError = (error: any): AppError => {
  // Default error
  const defaultError: AppError = {
    type: ErrorType.UNKNOWN,
    message: 'An unexpected error occurred. Please try again.',
    severity: ErrorSeverity.ERROR,
    originalError: error,
    timestamp: new Date()
  };
  
  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Network errors
    if (!axiosError.response) {
      return {
        ...defaultError,
        type: ErrorType.NETWORK,
        message: 'Network error. Please check your connection and try again.',
        severity: ErrorSeverity.WARNING,
        code: 'NETWORK_ERROR'
      };
    }
    
    // Get response data if available
    const responseData = axiosError.response.data as any;
    const statusCode = axiosError.response.status;
    const requestId = axiosError.response.headers['x-request-id'];
    
    // Authentication errors (401)
    if (statusCode === 401) {
      return {
        type: ErrorType.AUTHENTICATION,
        message: 'Your session has expired. Please log in again.',
        severity: ErrorSeverity.WARNING,
        originalError: error,
        code: 'AUTH_REQUIRED',
        recoveryPath: '/auth/login',
        timestamp: new Date(),
        requestId
      };
    }
    
    // Authorization errors (403)
    if (statusCode === 403) {
      return {
        type: ErrorType.AUTHORIZATION,
        message: 'You do not have permission to perform this action.',
        severity: ErrorSeverity.WARNING,
        originalError: error,
        code: 'FORBIDDEN',
        timestamp: new Date(),
        requestId
      };
    }
    
    // Not found errors (404)
    if (statusCode === 404) {
      return {
        type: ErrorType.NOT_FOUND,
        message: responseData?.message || 'The requested resource was not found.',
        severity: ErrorSeverity.WARNING,
        originalError: error,
        code: 'NOT_FOUND',
        timestamp: new Date(),
        requestId
      };
    }
    
    // Validation errors (400, 422)
    if (statusCode === 400 || statusCode === 422) {
      const fieldErrors = responseData?.errors || [];
      const fieldErrorMessages = fieldErrors.map((e: any) => e.message || e).join('; ');
      
      return {
        type: ErrorType.VALIDATION,
        message: responseData?.message || fieldErrorMessages || 'Validation error. Please check your input.',
        severity: ErrorSeverity.WARNING,
        originalError: error,
        code: 'VALIDATION_ERROR',
        field: fieldErrors[0]?.field,
        timestamp: new Date(),
        requestId
      };
    }
    
    // Server errors (500+)
    if (statusCode >= 500) {
      return {
        type: ErrorType.SERVER,
        message: 'Server error. Our team has been notified and is working on a fix.',
        severity: ErrorSeverity.ERROR,
        originalError: error,
        code: 'SERVER_ERROR',
        timestamp: new Date(),
        requestId
      };
    }
    
    // Other HTTP errors
    return {
      type: ErrorType.UNKNOWN,
      message: responseData?.message || 'An error occurred.',
      severity: ErrorSeverity.ERROR,
      originalError: error,
      code: `HTTP_${statusCode}`,
      timestamp: new Date(),
      requestId
    };
  }
  
  // Handle timeout errors
  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT,
      message: 'The request timed out. Please try again.',
      severity: ErrorSeverity.WARNING,
      originalError: error,
      code: 'TIMEOUT',
      timestamp: new Date()
    };
  }
  
  // Handle business logic errors (custom errors from our application)
  if (error.isBusinessError) {
    return {
      type: ErrorType.BUSINESS_LOGIC,
      message: error.message || 'A business logic error occurred.',
      severity: error.severity || ErrorSeverity.WARNING,
      originalError: error,
      code: error.code || 'BUSINESS_ERROR',
      field: error.field,
      timestamp: new Date()
    };
  }
  
  // Default to unknown error
  return defaultError;
};

/**
 * Get user-friendly error message
 * @param error - The error object
 * @returns User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: AppError): string => {
  // Return the error message if it's already user-friendly
  if (error.message) {
    return error.message;
  }
  
  // Default messages based on error type
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Network connection issue. Please check your internet connection and try again.';
    case ErrorType.AUTHENTICATION:
      return 'Your session has expired. Please log in again.';
    case ErrorType.AUTHORIZATION:
      return 'You don\'t have permission to perform this action.';
    case ErrorType.VALIDATION:
      return 'Please check your input and try again.';
    case ErrorType.NOT_FOUND:
      return 'The requested item could not be found.';
    case ErrorType.SERVER:
      return 'We\'re experiencing technical difficulties. Please try again later.';
    case ErrorType.TIMEOUT:
      return 'The request took too long to complete. Please try again.';
    case ErrorType.BUSINESS_LOGIC:
      return 'There was an issue processing your request.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Get recovery actions based on error type
 * @param error - The error object
 * @param defaultAction - Default action to include
 * @returns Array of recovery actions
 */
export const getErrorRecoveryActions = (
  error: AppError,
  defaultAction?: ErrorRecoveryAction
): ErrorRecoveryAction[] => {
  const actions: ErrorRecoveryAction[] = [];
  
  // Add default action if provided
  if (defaultAction) {
    actions.push(defaultAction);
  }
  
  // Add specific actions based on error type
  switch (error.type) {
    case ErrorType.NETWORK:
      actions.push({
        label: 'Retry',
        action: () => window.location.reload(),
        primary: true
      });
      break;
    case ErrorType.AUTHENTICATION:
      actions.push({
        label: 'Log In',
        action: () => {
          // Save current URL to redirect back after login
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/auth/login';
        },
        primary: true
      });
      break;
    case ErrorType.NOT_FOUND:
      actions.push({
        label: 'Go Back',
        action: () => window.history.back(),
        primary: true
      });
      actions.push({
        label: 'Go to Dashboard',
        action: () => window.location.href = '/dashboard'
      });
      break;
    case ErrorType.TIMEOUT:
      actions.push({
        label: 'Retry',
        action: () => window.location.reload(),
        primary: true
      });
      break;
  }
  
  return actions;
};

/**
 * Log error to monitoring service
 * @param error - The error object
 */
export const logError = (error: AppError): void => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', error);
  }
  
  // In production, this would send to a monitoring service like Sentry
  // Example: Sentry.captureException(error.originalError || error);
};

/**
 * Handle error with consistent approach
 * @param error - The error that occurred
 * @param options - Options for error handling
 * @returns Processed app error
 */
export const handleError = (
  error: any,
  options?: {
    context?: string;
    onError?: (appError: AppError) => void;
  }
): AppError => {
  // Parse the error
  const appError = parseApiError(error);
  
  // Add context if provided
  if (options?.context) {
    appError.message = `${options.context}: ${appError.message}`;
  }
  
  // Log the error
  logError(appError);
  
  // Call custom error handler if provided
  if (options?.onError) {
    options.onError(appError);
  }
  
  return appError;
};

/**
 * Create a business logic error
 * @param message - Error message
 * @param options - Additional error options
 * @returns Business logic error
 */
export const createBusinessError = (
  message: string,
  options?: {
    severity?: ErrorSeverity;
    code?: string;
    field?: string;
    recoveryPath?: string;
  }
): Error => {
  const error: any = new Error(message);
  error.isBusinessError = true;
  error.severity = options?.severity || ErrorSeverity.WARNING;
  error.code = options?.code;
  error.field = options?.field;
  error.recoveryPath = options?.recoveryPath;
  
  return error;
};

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: AppError;
  resetErrorBoundary: () => void;
}

/**
 * Check if an error is retryable
 * @param error - The error to check
 * @returns Whether the error is retryable
 */
export const isRetryableError = (error: AppError): boolean => {
  return [
    ErrorType.NETWORK,
    ErrorType.TIMEOUT,
    ErrorType.SERVER
  ].includes(error.type);
};

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param options - Retry options
 * @returns Promise with the function result
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (attempt: number, delay: number) => void;
  }
): Promise<T> => {
  const maxRetries = options?.maxRetries || 3;
  const initialDelay = options?.initialDelay || 1000;
  const maxDelay = options?.maxDelay || 10000;
  const factor = options?.factor || 2;
  
  let attempt = 0;
  
  while (true) {
    try {
      return await fn();
    } catch (_error) {
      attempt++;
      
      // If we've reached max retries, throw the error
      if (attempt >= maxRetries) {
        throw _error;
      }
      
      // Parse the error to check if it's retryable
      const appError = parseApiError(_error);
      if (!isRetryableError(appError)) {
        throw _error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
      
      // Call onRetry callback if provided
      if (options?.onRetry) {
        options.onRetry(attempt, delay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}; 