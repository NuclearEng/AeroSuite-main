/**
 * API Response Types
 * Contains common interfaces for API responses across the application
 */

/**
 * Base API response interface
 * All API responses should extend this interface
 */
export interface ApiResponse<T = unknown> {
  /** Status of the API request */
  status: 'success' | 'error' | 'warning';
  /** Response data */
  data?: T;
  /** Error message if status is error */
  message?: string;
  /** Error code if applicable */
  errorCode?: string;
  /** Request timestamp */
  timestamp: string;
  /** Request ID for tracing */
  requestId?: string;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  /** Pagination metadata */
  pagination: {
    /** Current page number (1-based) */
    page: number;
    /** Number of items per page */
    pageSize: number;
    /** Total number of items across all pages */
    totalItems: number;
    /** Total number of pages */
    totalPages: number;
    /** Whether there is a next page */
    hasNext: boolean;
    /** Whether there is a previous page */
    hasPrevious: boolean;
  };
}

/**
 * Error response interface
 */
export interface ErrorResponse extends ApiResponse<never> {
  /** Status is always error for error responses */
  status: 'error';
  /** Error message */
  message: string;
  /** Validation errors if applicable */
  validationErrors?: Record<string, string[]>;
  /** Stack trace (only in development) */
  stack?: string;
}

/**
 * API request options interface
 */
export interface ApiRequestOptions {
  /** Whether to include authentication token */
  authenticated?: boolean;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to retry on failure */
  retry?: boolean;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Whether to show loading indicator */
  showLoading?: boolean;
  /** Whether to show error notifications */
  showErrors?: boolean;
  /** Whether to handle errors automatically */
  handleErrors?: boolean;
  /** Custom error handler */
  errorHandler?: (error: unknown) => void;
}

/**
 * API pagination parameters
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page?: number;
  /** Number of items per page */
  pageSize?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortDirection?: 'asc' | 'desc';
}

/**
 * API filter parameters
 */
export interface FilterParams {
  /** Search query */
  search?: string;
  /** Filter by status */
  status?: string;
  /** Filter by date range */
  dateRange?: {
    /** Start date */
    start?: string;
    /** End date */
    end?: string;
  };
  /** Custom filters */
  [key: string]: unknown;
}

/**
 * API request parameters
 */
export interface ApiRequestParams extends PaginationParams, FilterParams {
  /** Include related entities */
  include?: string[];
  /** Fields to include in the response */
  fields?: string[];
} 