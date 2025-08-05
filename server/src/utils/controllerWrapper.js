/**
 * Controller Wrapper Utility
 * 
 * This utility provides a wrapper for controller methods to ensure consistent
 * error handling and response formatting across all API endpoints.
 * 
 * Implements RF020 - Implement consistent error handling in APIs
 */

const { ApiResponse } = require('./apiContract');
const logger = require('./logger');

/**
 * Wraps a controller method with standardized error handling
 * 
 * @param {Function} controller - Controller method to wrap
 * @returns {Function} - Express middleware function with error handling
 */
const controllerWrapper = (controller) => {
  return async (req, res, next) => {
    try {
      // Generate a request ID if not already present
      req.id = req.id || `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Add request ID to response headers
      res.setHeader('X-Request-ID', req.id);
      
      // Execute the controller method
      await controller(req, res, next);
    } catch (error) {
      // Pass the error to the global error handler
      next(error);
    }
  };
};

/**
 * Wraps a controller method with standardized success response
 * 
 * @param {Function} controller - Controller method that returns data
 * @param {string} successMessage - Success message to include in response
 * @returns {Function} - Express middleware function with standardized response
 */
const asyncHandler = (controller, successMessage = 'Success') => {
  return controllerWrapper(async (req, res, next) => {
    // Execute the controller method and get the result
    const result = await controller(req, res, next);
    
    // If the response has already been sent, return
    if (res.headersSent) {
      return;
    }
    
    // Send standardized success response
    res.status(200).json(
      ApiResponse.success(result, successMessage)
    );
  });
};

/**
 * Wraps a controller method with standardized paginated response
 * 
 * @param {Function} controller - Controller method that returns paginated data
 * @param {string} successMessage - Success message to include in response
 * @returns {Function} - Express middleware function with standardized paginated response
 */
const paginatedHandler = (controller, successMessage = 'Success') => {
  return controllerWrapper(async (req, res, next) => {
    // Execute the controller method and get the result
    const { data, page, limit, total } = await controller(req, res, next);
    
    // If the response has already been sent, return
    if (res.headersSent) {
      return;
    }
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const currentPage = parseInt(page, 10) || 1;
    
    // Send standardized paginated response
    res.status(200).json(
      ApiResponse.paginated(
        data,
        currentPage,
        parseInt(limit, 10),
        total,
        successMessage
      )
    );
  });
};

/**
 * Wraps a controller method for create operations with standardized response
 * 
 * @param {Function} controller - Controller method that creates a resource
 * @param {string} successMessage - Success message to include in response
 * @returns {Function} - Express middleware function with standardized response
 */
const createHandler = (controller, successMessage = 'Resource created successfully') => {
  return controllerWrapper(async (req, res, next) => {
    // Execute the controller method and get the result
    const result = await controller(req, res, next);
    
    // If the response has already been sent, return
    if (res.headersSent) {
      return;
    }
    
    // Send standardized created response
    res.status(201).json(
      ApiResponse.success(result, successMessage)
    );
  });
};

/**
 * Wraps a controller method for update operations with standardized response
 * 
 * @param {Function} controller - Controller method that updates a resource
 * @param {string} successMessage - Success message to include in response
 * @returns {Function} - Express middleware function with standardized response
 */
const updateHandler = (controller, successMessage = 'Resource updated successfully') => {
  return controllerWrapper(async (req, res, next) => {
    // Execute the controller method and get the result
    const result = await controller(req, res, next);
    
    // If the response has already been sent, return
    if (res.headersSent) {
      return;
    }
    
    // Send standardized success response
    res.status(200).json(
      ApiResponse.success(result, successMessage)
    );
  });
};

/**
 * Wraps a controller method for delete operations with standardized response
 * 
 * @param {Function} controller - Controller method that deletes a resource
 * @param {string} successMessage - Success message to include in response
 * @returns {Function} - Express middleware function with standardized response
 */
const deleteHandler = (controller, successMessage = 'Resource deleted successfully') => {
  return controllerWrapper(async (req, res, next) => {
    // Execute the controller method and get the result
    await controller(req, res, next);
    
    // If the response has already been sent, return
    if (res.headersSent) {
      return;
    }
    
    // Send standardized success response
    res.status(200).json(
      ApiResponse.success(null, successMessage)
    );
  });
};

module.exports = {
  controllerWrapper,
  asyncHandler,
  paginatedHandler,
  createHandler,
  updateHandler,
  deleteHandler
}; 