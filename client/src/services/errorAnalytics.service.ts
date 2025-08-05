/**
 * Error Analytics Service
 * 
 * Provides methods for retrieving error analytics data and managing error tracking.
 */

import api from './api';
import { captureError, initErrorTracking, reportPendingErrors } from '../utils/errorTracker';

// Error analytics service interface
interface ErrorAnalyticsService {
  getErrorAnalytics(period: string): Promise<any>;
  getErrorDetails(errorId: string): Promise<any>;
  initializeErrorTracking(options?: any): void;
  trackError(error: Error | string, componentStack?: string, metadata?: Record<string, any>): void;
  reportErrors(): void;
}

/**
 * Get error analytics data for the specified time period
 * @param period Time period (24h, 7d, 30d, 90d, all)
 * @returns Promise with error analytics data
 */
const getErrorAnalytics = async (period: string = '7d'): Promise<any> => {
  try {
    const response = await api.get(`/monitoring/error-analytics?period=${period}`);
    return response.data;
  } catch (_error) {
    console.error('Error fetching error analytics:', error);
    throw error;
  }
};

/**
 * Get detailed information about a specific error
 * @param errorId Error ID
 * @returns Promise with error details
 */
const getErrorDetails = async (errorId: string): Promise<any> => {
  try {
    const response = await api.get(`/monitoring/errors/${errorId}`);
    return response.data;
  } catch (_error) {
    console.error('Error fetching error details:', error);
    throw error;
  }
};

/**
 * Initialize error tracking with the specified options
 * @param options Error tracking options
 */
const initializeErrorTracking = (options?: any): void => {
  initErrorTracking(options);
};

/**
 * Track an error with optional component stack and metadata
 * @param error Error object or message
 * @param componentStack React component stack (from error boundary)
 * @param metadata Additional error context
 */
const trackError = (
  error: Error | string | { message: string; stack?: string; metadata?: Record<string, any> },
  componentStack?: string,
  metadata?: Record<string, any>
): void => {
  captureError(error, componentStack, metadata);
};

/**
 * Report all pending errors to the server
 */
const reportErrors = (): void => {
  reportPendingErrors();
};

// Create the error analytics service
const errorAnalyticsService: ErrorAnalyticsService = {
  getErrorAnalytics,
  getErrorDetails,
  initializeErrorTracking,
  trackError,
  reportErrors
};

export default errorAnalyticsService; 