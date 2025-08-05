/**
 * @task TS008 - Client error reporting to server
 * @task RF020 - Implement consistent error handling in APIs
 */
/**
 * Comprehensive error handling system for standardized API error responses
 */

/**
 * Error Handler Utility
 * 
 * Provides custom error classes and error handling middleware
 */

/**
 * Base application error class
 */
class AppError extends Error {
  /**
   * Create a new application error
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Bad request error (400)
 */
class BadRequestError extends AppError {
  /**
   * Create a bad request error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

/**
 * Validation error (400)
 */
class ValidationError extends AppError {
  /**
   * Create a validation error
   * @param {string} message - Error message
   * @param {Object} errors - Validation errors
   * @param {string} code - Error code
   */
  constructor(message = 'Validation failed', errors = {}, code = 'VALIDATION_ERROR') {
    super(message, 400, code, null);
    this.errors = errors;
  }
}

/**
 * Unauthorized error (401)
 */
class UnauthorizedError extends AppError {
  /**
   * Create an unauthorized error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * Forbidden error (403)
 */
class ForbiddenError extends AppError {
  /**
   * Create a forbidden error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/**
 * Not found error (404)
 */
class NotFoundError extends AppError {
  /**
   * Create a not found error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Method not allowed error (405)
 */
class MethodNotAllowedError extends AppError {
  /**
   * Create a method not allowed error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Method not allowed', code = 'METHOD_NOT_ALLOWED', details = null) {
    super(message, 405, code, details);
  }
}

/**
 * Conflict error (409)
 */
class ConflictError extends AppError {
  /**
   * Create a conflict error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Resource conflict', code = 'RESOURCE_CONFLICT', details = null) {
    super(message, 409, code, details);
  }
}

/**
 * Too many requests error (429)
 */
class TooManyRequestsError extends AppError {
  /**
   * Create a too many requests error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED', details = null) {
    super(message, 429, code, details);
  }
}

/**
 * Server error (500)
 */
class ServerError extends AppError {
  /**
   * Create a server error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Internal server error') {
    super(message, 500);
  }
}

/**
 * Service unavailable error (503)
 */
class ServiceUnavailableError extends AppError {
  /**
   * Create a service unavailable error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE', details = null) {
    super(message, 503, code, details);
  }
}

/**
 * Business logic error (422)
 */
class BusinessLogicError extends AppError {
  /**
   * Create a business logic error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Business logic error', code = 'BUSINESS_LOGIC_ERROR', details = null) {
    super(message, 422, code, details);
  }
}

/**
 * API version error (400)
 */
class ApiVersionError extends AppError {
  /**
   * Create an API version error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} details - Additional error details
   */
  constructor(message = 'Invalid API version', code = 'INVALID_API_VERSION', details = null) {
    super(message, 400, code, details);
  }
}

/**
 * Create an error from a known HTTP status code
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {AppError} - Appropriate error instance
 */
const createErrorFromStatusCode = (statusCode, message, code, details = null) => {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, code, details);
    case 401:
      return new UnauthorizedError(message, code, details);
    case 403:
      return new ForbiddenError(message, code, details);
    case 404:
      return new NotFoundError(message, code, details);
    case 405:
      return new MethodNotAllowedError(message, code, details);
    case 409:
      return new ConflictError(message, code, details);
    case 422:
      return new BusinessLogicError(message, code, details);
    case 429:
      return new TooManyRequestsError(message, code, details);
    case 503:
      return new ServiceUnavailableError(message, code, details);
    default:
      return new ServerError(message, code, details);
  }
};

/**
 * Error codes by category
 */
const ERROR_CODES = {
  // Authentication errors
  AUTHENTICATION_REQUIRED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid credentials',
  INVALID_TOKEN: 'Invalid token',
  TOKEN_EXPIRED: 'Token expired',
  
  // Authorization errors
  ACCESS_DENIED: 'Access denied',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'Resource not found',
  RESOURCE_ALREADY_EXISTS: 'Resource already exists',
  RESOURCE_CONFLICT: 'Resource conflict',
  
  // Validation errors
  VALIDATION_ERROR: 'Validation error',
  INVALID_INPUT: 'Invalid input',
  MISSING_REQUIRED_FIELD: 'Missing required field',
  INVALID_FORMAT: 'Invalid format',
  
  // Business logic errors
  BUSINESS_LOGIC_ERROR: 'Business logic error',
  OPERATION_NOT_ALLOWED: 'Operation not allowed',
  PRECONDITION_FAILED: 'Precondition failed',
  
  // API errors
  INVALID_API_VERSION: 'Invalid API version',
  UNSUPPORTED_API_VERSION: 'Unsupported API version',
  DEPRECATED_API_VERSION: 'Deprecated API version',
  
  // Server errors
  INTERNAL_SERVER_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  DATABASE_ERROR: 'Database error',
  EXTERNAL_SERVICE_ERROR: 'External service error',
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  
  // Request errors
  BAD_REQUEST: 'Bad request',
  METHOD_NOT_ALLOWED: 'Method not allowed',
  UNSUPPORTED_MEDIA_TYPE: 'Unsupported media type',
  INVALID_CONTENT_TYPE: 'Invalid content type'
};

/**
 * Global error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  console.error('ERROR:', err);

  // Send error response
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  MethodNotAllowedError,
  ConflictError,
  TooManyRequestsError,
  ServerError,
  ServiceUnavailableError,
  BusinessLogicError,
  ApiVersionError,
  createErrorFromStatusCode,
  ERROR_CODES,
  errorHandler
}; 