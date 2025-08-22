/**
 * API Client Utility
 * 
 * A type-safe wrapper around axios for making API requests
 * with automatic error handling and response type validation.
 */

import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiResponse, ErrorResponse, ApiRequestOptions, PaginatedResponse } from '../types/api.types';

/**
 * Base API URL
 */
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

/**
 * Default request options
 */
const DEFAULT_OPTIONS: ApiRequestOptions = {
  authenticated: true,
  timeout: 30000,
  retry: true,
  maxRetries: 3,
  showLoading: true,
  showErrors: true,
  handleErrors: true
};

/**
 * Create axios instance with default configuration
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_OPTIONS.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Add authentication token to request headers
 */
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Type guard to check if response is a paginated response
 */
function isPaginatedResponse<T>(response: any): response is PaginatedResponse<T> {
  return response && 
    response.data && 
    Array.isArray(response.data) && 
    response.pagination && 
    typeof response.pagination.page === 'number';
}

/**
 * Type guard to check if response is an error response
 */
function isErrorResponse(response: any): response is ErrorResponse {
  return response && response.status === 'error' && typeof response.message === 'string';
}

/**
 * Handle API errors
 */
function handleApiError(error: AxiosError<ErrorResponse>, options: ApiRequestOptions): never {
  const errorResponse = error.response?.data;
  
  // Log the error
  console.error('API Error:', error);
  
  // Show error notification if enabled
  if (options.showErrors) {
    const errorMessage = errorResponse?.message || 'An unexpected error occurred';
    // Use your notification system here
    // e.g., notificationService.showError(errorMessage);
  }
  
  // Call custom error handler if provided
  if (options.errorHandler) {
    options.errorHandler(error);
  }
  
  // Throw a standardized error
  throw {
    message: errorResponse?.message || 'API request failed',
    code: errorResponse?.errorCode || 'UNKNOWN_ERROR',
    status: error.response?.status || 500,
    validationErrors: errorResponse?.validationErrors,
    originalError: error
  };
}

/**
 * Make a type-safe GET request
 * 
 * @param url - API endpoint URL
 * @param params - Query parameters
 * @param options - Request options
 * @returns Promise with the typed response data
 */
export async function get<T>(
  url: string,
  params?: Record<string, any>,
  options: ApiRequestOptions = {}
): Promise<T> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const response = await axiosInstance.get<ApiResponse<T>>(url, { 
      params,
      ...buildRequestConfig(mergedOptions)
    });
    
    return validateAndExtractResponse<T>(response, mergedOptions);
  } catch (error) {
    return handleApiError(error as AxiosError<ErrorResponse>, mergedOptions);
  }
}

/**
 * Make a type-safe POST request
 * 
 * @param url - API endpoint URL
 * @param data - Request payload
 * @param options - Request options
 * @returns Promise with the typed response data
 */
export async function post<T, D = any>(
  url: string,
  data?: D,
  options: ApiRequestOptions = {}
): Promise<T> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const response = await axiosInstance.post<ApiResponse<T>>(url, data, buildRequestConfig(mergedOptions));
    return validateAndExtractResponse<T>(response, mergedOptions);
  } catch (error) {
    return handleApiError(error as AxiosError<ErrorResponse>, mergedOptions);
  }
}

/**
 * Make a type-safe PUT request
 * 
 * @param url - API endpoint URL
 * @param data - Request payload
 * @param options - Request options
 * @returns Promise with the typed response data
 */
export async function put<T, D = any>(
  url: string,
  data?: D,
  options: ApiRequestOptions = {}
): Promise<T> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const response = await axiosInstance.put<ApiResponse<T>>(url, data, buildRequestConfig(mergedOptions));
    return validateAndExtractResponse<T>(response, mergedOptions);
  } catch (error) {
    return handleApiError(error as AxiosError<ErrorResponse>, mergedOptions);
  }
}

/**
 * Make a type-safe PATCH request
 * 
 * @param url - API endpoint URL
 * @param data - Request payload
 * @param options - Request options
 * @returns Promise with the typed response data
 */
export async function patch<T, D = any>(
  url: string,
  data?: D,
  options: ApiRequestOptions = {}
): Promise<T> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const response = await axiosInstance.patch<ApiResponse<T>>(url, data, buildRequestConfig(mergedOptions));
    return validateAndExtractResponse<T>(response, mergedOptions);
  } catch (error) {
    return handleApiError(error as AxiosError<ErrorResponse>, mergedOptions);
  }
}

/**
 * Make a type-safe DELETE request
 * 
 * @param url - API endpoint URL
 * @param options - Request options
 * @returns Promise with the typed response data
 */
export async function del<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const response = await axiosInstance.delete<ApiResponse<T>>(url, buildRequestConfig(mergedOptions));
    return validateAndExtractResponse<T>(response, mergedOptions);
  } catch (error) {
    return handleApiError(error as AxiosError<ErrorResponse>, mergedOptions);
  }
}

/**
 * Make a type-safe paginated GET request
 * 
 * @param url - API endpoint URL
 * @param params - Query parameters
 * @param options - Request options
 * @returns Promise with the typed paginated response
 */
export async function getPaginated<T>(
  url: string,
  params?: Record<string, any>,
  options: ApiRequestOptions = {}
): Promise<PaginatedResponse<T>> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    const response = await axiosInstance.get<PaginatedResponse<T>>(url, { 
      params,
      ...buildRequestConfig(mergedOptions)
    });
    
    // Validate that the response is a paginated response
    const data = response.data;
    if (!isPaginatedResponse<T>(data)) {
      throw new Error('Invalid paginated response format');
    }
    
    return data;
  } catch (error) {
    return handleApiError(error as AxiosError<ErrorResponse>, mergedOptions);
  }
}

/**
 * Build axios request config from options
 */
function buildRequestConfig(options: ApiRequestOptions): AxiosRequestConfig {
  const config: AxiosRequestConfig = {
    timeout: options.timeout
  };
  
  return config;
}

/**
 * Validate and extract the response data
 */
function validateAndExtractResponse<T>(
  response: AxiosResponse<ApiResponse<T>>,
  options: ApiRequestOptions
): T {
  const data = response.data;
  
  // Check if it's an error response
  if (isErrorResponse(data)) {
    throw {
      message: data.message,
      code: data.errorCode || 'API_ERROR',
      status: response.status,
      validationErrors: data.validationErrors
    };
  }
  
  // Validate that the response has the expected structure
  if (!data || data.status !== 'success') {
    throw new Error('Invalid API response format');
  }
  
  // Return the actual data
  return data.data as T;
}

/**
 * API client object with all methods
 */
const apiClient = {
  get,
  post,
  put,
  patch,
  delete: del,
  getPaginated
};

export default apiClient; 