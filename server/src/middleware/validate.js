const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errorHandler');

/**
 * Middleware to validate request data using express-validator
 * @param {Array} validations - Array of express-validator validation rules
 * @returns {Function} Express middleware
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Execute all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    // Check if there are validation errors
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format validation errors
    const formattedErrors = {};
    errors.array().forEach(error => {
      formattedErrors[error.path] = error.msg;
    });

    // Throw ValidationError with all errors
    return next(new ValidationError('Validation failed', formattedErrors));
  };
};

/**
 * Validation middleware
 * Standardizes validation error handling across all routes
 */
const { validationResult } = require('express-validator');

/**
 * Validation middleware that checks for validation errors
 * and returns a standardized error response
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (errors.isEmpty()) {
    return next();
  }
  
  // Format errors into a standardized object
  const formattedErrors = {};
  errors.array().forEach((error) => {
    formattedErrors[error.path] = error.msg;
  });
  
  // Return standardized error response
  return res.status(400).json({
    success: false,
    message: 'Validation error',
    code: 'VALIDATION_ERROR',
    errors: formattedErrors
  });
};

/**
 * Creates specific validation error handler for specific use cases
 * @param {string} customMessage - Custom error message
 */
exports.createValidator = (customMessage) => {
  return (req, res, next) => {
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }
    
    const formattedErrors = {};
    errors.array().forEach((error) => {
      formattedErrors[error.path] = error.msg;
    });
    
    return res.status(400).json({
      success: false,
      message: customMessage || 'Validation error',
      code: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  };
};

module.exports = validate; 