/**
 * Global Error Handling Middleware
 * 
 * This middleware provides consistent error handling for all API routes.
 * It formats errors according to the standardized API contract.
 * 
 * Implements RF020 - Implement consistent error handling in APIs
 */

const { ApiResponse } = require('../utils/apiContract');
const logger = require('../infrastructure/logger');
const { AppError } = require('../utils/errorHandler');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let errorMessage = err.message || 'Something went wrong';
  let errorDetails = err.errors || null;
  
  // Generate request identifier if not already present
  const requestId = req.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  
  // Determine error type and format response accordingly
  if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    errorMessage = 'Validation failed';
    errorDetails = formatValidationErrors(err);
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    const field = Object.keys(err.keyValue)[0];
    errorMessage = `Duplicate value for ${field}`;
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ID)
    statusCode = 400;
    errorCode = 'INVALID_ID';
    errorMessage = `Invalid ${err.path}: ${err.value}`;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    errorMessage = 'Invalid authentication token';
    
    // Log security event for token issues
    logSecurityEvent(
      req.ip,
      SEC_EVENT_SEVERITY.MEDIUM,
      'Invalid authentication token',
      { 
        userId: req.user?.id || 'anonymous',
        path: req.path,
        method: req.method,
        requestId
      }
    );
  } else if (err.name === 'TokenExpiredError') {
    // JWT expiration error
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    errorMessage = 'Authentication token expired';
  } else if (err instanceof AppError) {
    // Our custom application errors
    // These already have statusCode and code set
  } else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    // JSON parsing error
    statusCode = 400;
    errorCode = 'INVALID_JSON';
    errorMessage = 'Invalid JSON payload';
  } else if (err instanceof URIError) {
    // URI encoding error
    statusCode = 400;
    errorCode = 'INVALID_URI';
    errorMessage = 'Invalid URI';
  } else {
    // Unhandled errors (500 Internal Server Error)
    statusCode = 500;
    errorCode = 'INTERNAL_SERVER_ERROR';
    errorMessage = process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message || 'Internal server error';
  }
  
  // Log the error with appropriate severity
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](`[${errorCode}] ${errorMessage}`, logger.withContext({
    statusCode,
    path: req.path,
    method: req.method,
    requestId,
    userId: req.user?.id || 'anonymous',
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    stack: err.stack
  }, req));
  
  // Log severe errors to security event log
  if (statusCode >= 500) {
    logSecurityEvent(
      req.ip,
      SEC_EVENT_SEVERITY.HIGH,
      `Server error: ${errorMessage}`,
      { 
        userId: req.user?.id || 'anonymous',
        path: req.path,
        method: req.method,
        requestId,
        errorCode
      }
    );
  }
  
  // Send standardized error response
  res.status(statusCode).json(
    ApiResponse.error(
      errorMessage,
      errorCode,
      errorDetails,
      {
        requestId,
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      }
    )
  );
};

/**
 * Format validation errors from Mongoose or Express Validator
 * @param {Error} err - Validation error
 * @returns {Object} - Formatted validation errors
 */
const formatValidationErrors = (err) => {
  // Handle Mongoose validation errors
  if (err.errors) {
    const formattedErrors = {};
    
    Object.keys(err.errors).forEach(key => {
      formattedErrors[key] = err.errors[key].message;
    });
    
    return formattedErrors;
  }
  
  // Handle Express Validator errors
  if (err.array && typeof err.array === 'function') {
    const formattedErrors = {};
    
    err.array().forEach(error => {
      if (!formattedErrors[error.param]) {
        formattedErrors[error.param] = [];
      }
      formattedErrors[error.param].push(error.msg);
    });
    
    return formattedErrors;
  }
  
  return err.errors || null;
};

module.exports = globalErrorHandler; 