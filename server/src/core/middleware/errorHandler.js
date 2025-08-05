/**
 * errorHandler.js
 * 
 * Global error handling middleware
 */

const logger = require('../../infrastructure/logger');
const {
  ApplicationError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  BusinessRuleError,
  DomainError
} = require('../errors');

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function errorHandler(err, req, res, next) {
  // Default status code and error type
  let statusCode = 500;
  let errorType = 'ServerError';
  let errors = undefined;
  
  // Set status code based on error type
  if (err instanceof ValidationError) {
    statusCode = 400;
    errorType = 'ValidationError';
    errors = err.errors;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    errorType = 'NotFoundError';
  } else if (err instanceof AuthenticationError) {
    statusCode = 401;
    errorType = 'AuthenticationError';
  } else if (err instanceof AuthorizationError) {
    statusCode = 403;
    errorType = 'AuthorizationError';
  } else if (err instanceof BusinessRuleError || err instanceof DomainError) {
    statusCode = 422;
    errorType = 'BusinessRuleError';
  } else if (err instanceof ApplicationError) {
    statusCode = err.statusCode;
    errorType = err.name;
  }
  
  // Log the error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](`${errorType}: ${err.message}`, {
    error: err.stack,
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user ? req.user.id : undefined
  });
  
  // Send error response
  const errorResponse = {
    status: 'error',
    type: errorType,
    message: err.message,
    requestId: req.id
  };
  
  // Include validation errors if available
  if (errors) {
    errorResponse.errors = errors;
  }
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler; 