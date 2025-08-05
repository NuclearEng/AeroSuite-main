/**
 * Controller.js
 * 
 * Base class for all API controllers
 * Controllers handle HTTP requests and responses
 */

const { ValidationError } = require('./errors');

class Controller {
  /**
   * Create a new Controller
   * @param {Object} dependencies - Dependencies for the controller
   */
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.logger = dependencies.logger || console;
  }

  /**
   * Get a dependency
   * @param {string} name - Name of the dependency
   * @returns {Object} - Dependency
   * @throws {Error} - If the dependency is not found
   */
  getDependency(name) {
    if (!this.dependencies[name]) {
      throw new Error(`Dependency ${name} not found`);
    }
    
    return this.dependencies[name];
  }

  /**
   * Create an async handler that catches errors
   * @param {Function} fn - Function to wrap
   * @returns {Function} - Express middleware function
   */
  asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Validate request data against a schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Schema to validate against
   * @throws {ValidationError} - If validation fails
   */
  validateRequest(data, schema) {
    if (!schema || typeof schema.validate !== 'function') {
      throw new Error('Invalid schema provided for validation');
    }
    
    const { error, value } = schema.validate(data, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      throw new ValidationError('Validation failed', errors);
    }
    
    return value;
  }

  /**
   * Send a success response
   * @param {Object} res - Express response object
   * @param {*} data - Data to send
   * @param {number} statusCode - HTTP status code
   */
  sendSuccess(res, data, statusCode = 200) {
    res.status(statusCode).json({
      status: 'success',
      data
    });
  }

  /**
   * Send a created response
   * @param {Object} res - Express response object
   * @param {*} data - Data to send
   */
  sendCreated(res, data) {
    this.sendSuccess(res, data, 201);
  }

  /**
   * Send a no content response
   * @param {Object} res - Express response object
   */
  sendNoContent(res) {
    res.status(204).end();
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {Error} error - Error object
   * @param {number} statusCode - HTTP status code
   */
  sendError(res, error, statusCode = 500) {
    res.status(statusCode).json({
      status: 'error',
      message: error.message,
      errors: error.errors || undefined
    });
  }

  /**
   * Get pagination parameters from request
   * @param {Object} req - Express request object
   * @returns {Object} - Pagination parameters
   */
  getPaginationParams(req) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    return { page, limit };
  }
}

module.exports = Controller; 