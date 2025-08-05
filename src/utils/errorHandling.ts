import { AxiosError } from 'axios';

export interface AppError extends Error {
  code?: string;
  details?: unknown;
}

export function createAppError(message: string, code?: string, details?: unknown): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.details = details;
  return error;
}

export function handleError(error: unknown): AppError {
  if (error instanceof Error) {
    return error as AppError;
  }
  return createAppError(String(error));
}

export function handleApiError(error: unknown): AppError {
  if (error instanceof AxiosError) {
    return createAppError(
      error.response?.data?.message || error.message,
      error.response?.data?.code || error.code,
      error.response?.data
    );
  }
  return handleError(error);
}

export function logError(error: AppError): void {
  console.error('Application Error:', error);
  // Add any additional error logging logic here
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof Error && 'code' in error;
}

export function isAxiosError(error: unknown): error is AxiosError {
  return error instanceof AxiosError;
}

export function parseApiError(error: unknown): AppError {
  try {
    if (isAxiosError(error)) {
      return handleApiError(error);
    }
    return handleError(error);
  } catch (error) {
    return createAppError('Failed to parse error');
  }
}