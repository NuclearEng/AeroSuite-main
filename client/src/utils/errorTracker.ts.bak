/**
 * @task TS008 - Client error reporting to server
 */
/**
 * Error Tracking Utility
 * 
 * This utility provides error tracking functionality for the client application,
 * capturing and reporting errors to the server and optionally to external services.
 */

interface ErrorDetails {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Maximum number of errors to store locally
const MAX_STORED_ERRORS = 50;

// Storage key for errors
const ERROR_STORAGE_KEY = 'aerosuite_error_logs';

// Error tracking configuration
let config = {
  captureGlobalErrors: true,
  reportToServer: true,
  serverEndpoint: '/api/monitoring/errors',
  batchReporting: true,
  reportingInterval: 60000, // 1 minute
  includeMetadata: true
};

// Error tracking state
let initialized = false;
let reportingIntervalId: number | null = null;
let pendingErrors: ErrorDetails[] = [];

/**
 * Initializes the error tracking system with the provided configuration options
 * 
 * @param {Partial<typeof config>} options - Configuration options to override defaults
 * @returns {void}
 * 
 * @description
 * Sets up global error handlers, configures batch reporting, and restores any pending errors
 * from local storage. This function should be called early in your application lifecycle,
 * typically in the main entry point or during app initialization.
 * 
 * @example
 * // Basic initialization with defaults
 * initErrorTracking();
 * 
 * @example
 * // Custom configuration
 * initErrorTracking({
 *   reportToServer: true,
 *   serverEndpoint: '/api/custom/error-endpoint',
 *   batchReporting: true,
 *   reportingInterval: 30000 // 30 seconds
 * });
 */
export function initErrorTracking(options: Partial<typeof config> = {}): void {
  if (initialized) {
    return;
  }
  
  // Merge options with defaults
  config = { ...config, ...options };
  
  // Restore any errors from local storage
  _loadPendingErrors();
  
  // Set up global error handlers
  if (config.captureGlobalErrors && typeof window !== 'undefined') {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      captureError({
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
      
      // Don't prevent default handling
      return false;
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      
      captureError({
        message: error.message || 'Unhandled Promise Rejection',
        stack: error.stack,
        metadata: {
          reason: error
        }
      });
      
      // Don't prevent default handling
      return false;
    });
    
    // Set up batch reporting if enabled
    if (config.batchReporting) {
      reportingIntervalId = window.setInterval(
        reportPendingErrors,
        config.reportingInterval
      );
      
      // Report errors before page unload
      window.addEventListener('beforeunload', () => {
        if (pendingErrors.length > 0) {
          // Use synchronous reporting on unload
          reportPendingErrors(true);
        }
      });
    }
  }
  
  initialized = true;
  console.log('Error tracking initialized');
}

/**
 * Captures and tracks an error with detailed information
 * 
 * @param {Error | string | { message: string; stack?: string; metadata?: Record<string, any> }} error - 
 *   The error to capture. Can be an Error object, a string message, or an object with error details
 * @param {string} [componentStack] - React component stack trace for component errors
 * @param {Record<string, any>} [metadata] - Additional contextual information about the error
 * @returns {void}
 * 
 * @description
 * Captures error information, enriches it with metadata, and queues it for reporting.
 * The error is stored locally and, depending on configuration, may be reported immediately
 * or batched for later reporting.
 * 
 * @example
 * // Capture a simple error message
 * captureError('Failed to load user data');
 * 
 * @example
 * // Capture an Error object with metadata
 * try {
 *   throw new Error('API request failed');
 * } catch (_error) {
 *   captureError(error, undefined, { 
 *     userId: '123', 
 *     requestUrl: '/api/users',
 *     statusCode: 500
 *   });
 * }
 * 
 * @example
 * // Capture a React error with component stack
 * componentDidCatch(error, errorInfo) {
 *   captureError(error, errorInfo.componentStack);
 * }
 */
export function captureError(
  error: Error | string | { message: string; stack?: string; metadata?: Record<string, any> },
  componentStack?: string,
  metadata?: Record<string, any>
): void {
  // Format error information
  const errorDetails: ErrorDetails = {
    message: '',
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    sessionId: _getSessionId(),
    userId: _getUserId()
  };
  
  // Extract error information based on input type
  if (typeof error === 'string') {
    errorDetails.message = error;
  } else if (error instanceof Error) {
    errorDetails.message = error.message;
    errorDetails.stack = error.stack;
  } else {
    errorDetails.message = error.message;
    errorDetails.stack = error.stack;
    errorDetails.metadata = { ...error.metadata };
  }
  
  // Add component stack if available
  if (componentStack) {
    errorDetails.componentStack = componentStack;
  }
  
  // Add additional metadata if provided and enabled
  if (config.includeMetadata && metadata) {
    errorDetails.metadata = { ...errorDetails.metadata, ...metadata };
  }
  
  // Add to pending errors
  pendingErrors.push(errorDetails);
  
  // Store in local storage
  _savePendingErrors();
  
  // Report immediately if batch reporting is disabled
  if (config.reportToServer && !config.batchReporting) {
    reportPendingErrors();
  }
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error captured:', errorDetails);
  }
}

/**
 * Reports all pending errors to the configured server endpoint
 * 
 * @param {boolean} [synchronous=false] - Whether to use synchronous reporting (important for beforeunload events)
 * @returns {void}
 * 
 * @description
 * Sends all pending errors to the server using either fetch API or navigator.sendBeacon for synchronous reporting.
 * This function is called automatically on a timer when batch reporting is enabled, but can also be called
 * manually to force immediate reporting of all pending errors.
 * 
 * If the server request fails, the errors are added back to the pending queue for a future retry.
 * 
 * @example
 * // Report all pending errors asynchronously
 * reportPendingErrors();
 * 
 * @example
 * // Report all pending errors synchronously (e.g., before page unload)
 * window.addEventListener('beforeunload', () => {
 *   reportPendingErrors(true);
 * });
 */
export function reportPendingErrors(synchronous = false): void {
  if (!config.reportToServer || pendingErrors.length === 0) {
    return;
  }
  
  // Clone and clear pending errors
  const errors = [...pendingErrors];
  pendingErrors = [];
  _savePendingErrors();
  
  // Report to server
  if (synchronous && typeof navigator !== 'undefined' && navigator.sendBeacon) {
    // Use sendBeacon for synchronous reporting (especially on page unload)
    navigator.sendBeacon(
      config.serverEndpoint,
      JSON.stringify({ errors })
    );
  } else {
    // Use fetch for normal reporting
    fetch(config.serverEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ errors }),
      // Don't wait for response when unloading
      keepalive: synchronous
    }).catch(err => {
      console.error('Error reporting failed:', err);
      // Add back to pending errors
      pendingErrors.push(...errors);
      _savePendingErrors();
    });
  }
}

/**
 * Cleans up the error tracking system and reports any pending errors
 * 
 * @returns {void}
 * 
 * @description
 * Stops the reporting interval timer and reports any pending errors.
 * This function should be called when the application is shutting down or
 * when the error tracking functionality is no longer needed.
 * 
 * @example
 * // In a React application, call in componentWillUnmount or useEffect cleanup
 * useEffect(() => {
 *   initErrorTracking();
 *   return () => {
 *     cleanupErrorTracking();
 *   };
 * }, []);
 */
export function cleanupErrorTracking(): void {
  if (reportingIntervalId !== null) {
    clearInterval(reportingIntervalId);
    reportingIntervalId = null;
  }
  
  // Report any pending errors
  if (pendingErrors.length > 0) {
    reportPendingErrors();
  }
  
  initialized = false;
}

/**
 * Get the user ID if available
 * @returns User ID or undefined
 */
function _getUserId(): string | undefined {
  try {
    // Implement based on your authentication system
    // Example: return localStorage.getItem('user_id');
    return undefined;
  } catch (_err) {
    return undefined;
  }
}

/**
 * Get or create a session ID
 * @returns Session ID
 */
function _getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem('aerosuite_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem('aerosuite_session_id', sessionId);
    }
    return sessionId;
  } catch (_err) {
    return `fallback-${Date.now()}`;
  }
}

/**
 * Save pending errors to local storage
 */
function _savePendingErrors(): void {
  try {
    // Limit the number of stored errors
    const errorsToStore = pendingErrors.slice(-MAX_STORED_ERRORS);
    localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(errorsToStore));
  } catch (_err) {
    // Storage might be full or disabled
    console.error('Failed to save errors to local storage:', _err);
  }
}

/**
 * Load pending errors from local storage
 */
function _loadPendingErrors(): void {
  try {
    const storedErrors = localStorage.getItem(ERROR_STORAGE_KEY);
    if (storedErrors) {
      pendingErrors = JSON.parse(storedErrors);
    }
  } catch (_err) {
    console.error('Failed to load errors from local storage:', _err);
  }
}

export default {
  initErrorTracking,
  captureError,
  reportPendingErrors,
  cleanupErrorTracking
}; 