/**
 * apiContract.js
 * 
 * Utility for standardizing API contracts across the application
 * Implements RF017 - Standardize API contracts
 */

const { validationResult } = require('express-validator');
const { AppError, errorHandler } = require('./errorHandler');

/**
 * Standard response structure for all API endpoints
 */
class ApiResponse {
  /**
   * Create a standard success response
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {Object} meta - Additional metadata
   * @returns {Object} Standardized response object
   */
  static success(data = null, message = 'Success', meta = {}) {
    return {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a standard error response
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {Object} errors - Validation errors
   * @param {Object} meta - Additional metadata
   * @returns {Object} Standardized error response object
   */
  static error(message = 'Error', code = 'INTERNAL_ERROR', errors = null, meta = {}) {
    return {
      success: false,
      message,
      code,
      errors,
      meta,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Create a standard paginated response
   * @param {Array} data - Array of items
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} total - Total number of items
   * @param {string} message - Success message
   * @param {Object} meta - Additional metadata
   * @returns {Object} Standardized paginated response object
   */
  static paginated(data = [], page = 1, limit = 10, total = 0, message = 'Success', meta = {}) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      message,
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      meta,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Standard middleware for handling validation errors
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().reduce((acc, error) => {
      const field = error.param;
      if (!acc[field]) {
        acc[field] = [];
      }
      acc[field].push(error.msg);
      return acc;
    }, {});
    
    return res.status(400).json(
      ApiResponse.error(
        'Validation failed',
        'VALIDATION_ERROR',
        formattedErrors
      )
    );
  }
  
  next();
};

/**
 * Standard controller wrapper to ensure consistent error handling and response format
 * @param {Function} handler - Controller handler function
 * @returns {Function} Wrapped controller handler
 */
const controllerHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

/**
 * Standard API contract schema definitions
 */
const contractSchemas = {
  // Common response schemas
  responses: {
    success: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: { type: 'object' },
        meta: { type: 'object' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
    error: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Error message' },
        code: { type: 'string', example: 'ERROR_CODE' },
        errors: { 
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        meta: { type: 'object' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
    paginated: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: { type: 'array' },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            total: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 10 },
            hasNextPage: { type: 'boolean', example: true },
            hasPrevPage: { type: 'boolean', example: false },
          },
        },
        meta: { type: 'object' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  },
  
  // Common parameter schemas
  parameters: {
    pagination: [
      {
        name: 'page',
        in: 'query',
        schema: { type: 'integer', default: 1, minimum: 1 },
        description: 'Page number',
      },
      {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 10, minimum: 1, maximum: 100 },
        description: 'Number of items per page',
      },
      {
        name: 'sort',
        in: 'query',
        schema: { type: 'string' },
        description: 'Sort field (prefix with - for descending)',
      },
    ],
    filtering: [
      {
        name: 'filter',
        in: 'query',
        schema: { type: 'string' },
        description: 'Filter criteria in format field:operator:value (e.g. status:eq:active)',
      },
      {
        name: 'search',
        in: 'query',
        schema: { type: 'string' },
        description: 'Search term for text search across multiple fields',
      },
    ],
  },
};

module.exports = {
  ApiResponse,
  validateRequest,
  controllerHandler,
  errorHandler,
  contractSchemas,
}; 