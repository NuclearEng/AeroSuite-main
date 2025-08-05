import { AppError, ErrorType, parseApiError } from './errorHandling';

/**
 * Form field error interface
 */
export interface FieldError {
  message: string;
  type: string;
}

/**
 * Form errors interface mapping field names to errors
 */
export interface FormErrors {
  [fieldName: string]: FieldError;
}

/**
 * Extract field errors from an API error
 * @param error - The error to extract field errors from
 * @returns Object mapping field names to error messages
 */
export const extractFieldErrors = (error: any): FormErrors => {
  const appError = parseApiError(error);
  const fieldErrors: FormErrors = {};
  
  // Handle validation errors
  if (appError.type === ErrorType.VALIDATION) {
    // If the error has a field property, add it to the field errors
    if (appError.field) {
      fieldErrors[appError.field] = {
        message: appError.message,
        type: 'validation'
      };
    }
    
    // If the error has a structured errors array in the original error
    if (appError.originalError?.response?.data?.errors) {
      const errors = appError.originalError.response.data.errors;
      
      // Handle array of error objects with field and message properties
      if (Array.isArray(errors)) {
        errors.forEach(err => {
          if (err.field && err.message) {
            fieldErrors[err.field] = {
              message: err.message,
              type: err.type || 'validation'
            };
          }
        });
      } 
      // Handle object with field names as keys
      else if (typeof errors === 'object') {
        Object.entries(errors).forEach(([field, message]) => {
          fieldErrors[field] = {
            message: typeof message === 'string' ? message : 'Invalid value',
            type: 'validation'
          };
        });
      }
    }
  }
  
  return fieldErrors;
};

/**
 * Handle form errors by extracting field errors and setting them in the form
 * @param error - The error to handle
 * @param setError - React Hook Form setError function
 * @returns The processed error
 */
export const handleFormErrors = (
  error: any,
  setError: (name: string, error: FieldError) => void
): AppError => {
  const appError = parseApiError(error);
  const fieldErrors = extractFieldErrors(error);
  
  // Set field errors in the form
  Object.entries(fieldErrors).forEach(([field, fieldError]) => {
    setError(field, fieldError);
  });
  
  return appError;
};

/**
 * Create a validation error with field errors
 * @param message - Main error message
 * @param fieldErrors - Object mapping field names to error messages
 * @returns Validation error
 */
export const createValidationError = (
  message: string,
  fieldErrors: Record<string, string>
): Error => {
  const error: any = new Error(message);
  
  error.response = {
    data: {
      message,
      errors: Object.entries(fieldErrors).map(([field, message]) => ({
        field,
        message,
        type: 'validation'
      }))
    },
    status: 422
  };
  
  return error;
};

/**
 * Format validation errors for display
 * @param errors - Form errors object
 * @returns Formatted error message
 */
export const formatValidationErrors = (errors: FormErrors): string => {
  return Object.entries(errors)
    .map(([field, error]) => `${field}: ${error.message}`)
    .join('\n');
}; 