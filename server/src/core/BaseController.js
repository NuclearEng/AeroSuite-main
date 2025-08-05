/**
 * BaseController.js
 * 
 * Base controller class that all controllers should extend
 * Implements RF017 - Standardize API contracts
 */

const { ApiResponse } = require('../utils/apiContract');
const { AppError } = require('../utils/errorHandler');

class BaseController {
  /**
   * Send a successful response
   * @param {Object} res - Express response object
   * @param {Object} data - Data to send
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   * @param {Object} meta - Additional metadata
   */
  sendSuccess(res, data = null, message = 'Success', statusCode = 200, meta = {}) {
    res.status(statusCode).json(ApiResponse.success(data, message, meta));
  }

  /**
   * Send a paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Array of items
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   * @param {number} total - Total items count
   * @param {string} message - Success message
   * @param {Object} meta - Additional metadata
   */
  sendPaginated(res, data = [], page = 1, limit = 10, total = 0, message = 'Success', meta = {}) {
    res.status(200).json(ApiResponse.paginated(data, page, limit, total, message, meta));
  }

  /**
   * Send an error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} errorCode - Error code
   * @param {Object} errors - Validation errors
   * @param {Object} meta - Additional metadata
   */
  sendError(res, message = 'Error', statusCode = 500, errorCode = 'INTERNAL_ERROR', errors = null, meta = {}) {
    res.status(statusCode).json(ApiResponse.error(message, errorCode, errors, meta));
  }

  /**
   * Create a 404 not found error
   * @param {string} message - Error message
   * @param {string} entity - Entity type that was not found
   * @returns {AppError} Not found error
   */
  notFound(message = 'Resource not found', entity = 'Resource') {
    return new AppError(message, 404, `${entity.toUpperCase()}_NOT_FOUND`);
  }

  /**
   * Create a 400 bad request error
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @returns {AppError} Bad request error
   */
  badRequest(message = 'Bad request', code = 'BAD_REQUEST') {
    return new AppError(message, 400, code);
  }

  /**
   * Create a 401 unauthorized error
   * @param {string} message - Error message
   * @returns {AppError} Unauthorized error
   */
  unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  /**
   * Create a 403 forbidden error
   * @param {string} message - Error message
   * @returns {AppError} Forbidden error
   */
  forbidden(message = 'Forbidden') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  /**
   * Create a 409 conflict error
   * @param {string} message - Error message
   * @param {string} entity - Entity type that caused the conflict
   * @returns {AppError} Conflict error
   */
  conflict(message = 'Conflict', entity = 'Resource') {
    return new AppError(message, 409, `${entity.toUpperCase()}_CONFLICT`);
  }

  /**
   * Handle common controller operations like pagination, filtering, and sorting
   * @param {Object} req - Express request object
   * @returns {Object} Query options
   */
  getQueryOptions(req) {
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Sorting
    let sort = { createdAt: -1 }; // Default sort
    if (req.query.sort) {
      sort = {};
      const sortFields = req.query.sort.split(',');
      
      sortFields.forEach(field => {
        if (field.startsWith('-')) {
          sort[field.substring(1)] = -1;
        } else {
          sort[field] = 1;
        }
      });
    }

    // Filtering
    const filter = {};
    if (req.query.filter) {
      const filterParams = req.query.filter.split(',');
      
      filterParams.forEach(param => {
        const [field, operator, value] = param.split(':');
        
        if (field && operator && value !== undefined) {
          switch (operator) {
            case 'eq':
              filter[field] = value;
              break;
            case 'ne':
              filter[field] = { $ne: value };
              break;
            case 'gt':
              filter[field] = { $gt: Number(value) };
              break;
            case 'gte':
              filter[field] = { $gte: Number(value) };
              break;
            case 'lt':
              filter[field] = { $lt: Number(value) };
              break;
            case 'lte':
              filter[field] = { $lte: Number(value) };
              break;
            case 'in':
              filter[field] = { $in: value.split('|') };
              break;
            case 'nin':
              filter[field] = { $nin: value.split('|') };
              break;
            case 'regex':
              filter[field] = { $regex: value, $options: 'i' };
              break;
          }
        }
      });
    }

    // Search
    if (req.query.search) {
      filter.$or = this.getSearchFields().map(field => ({
        [field]: { $regex: req.query.search, $options: 'i' }
      }));
    }

    return { page, limit, skip, sort, filter };
  }

  /**
   * Get fields to search across when using the search parameter
   * Override this method in child controllers
   * @returns {Array} Array of field names to search across
   */
  getSearchFields() {
    return ['name', 'description'];
  }
}

module.exports = BaseController; 