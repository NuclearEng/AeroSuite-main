/**
 * Base Controller Class
 * 
 * This class provides a foundation for all API controllers with standardized
 * error handling and response formatting.
 * 
 * Implements RF020 - Implement consistent error handling in APIs
 */

const { ApiResponse } = require('../utils/apiContract');
const { 
  NotFoundError, 
  ValidationError, 
  ConflictError, 
  ServerError,
  BadRequestError
} = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Base controller class with common CRUD operations and error handling
 */
class BaseController {
  /**
   * Create a new BaseController
   * @param {Object} service - Service layer for business logic
   * @param {string} resourceName - Name of the resource (e.g., 'user', 'product')
   */
  constructor(service, resourceName) {
    this.service = service;
    this.resourceName = resourceName;
    
    // Bind methods to ensure 'this' context
    this.getAll = this.getAll.bind(this);
    this.getById = this.getById.bind(this);
    this.create = this.create.bind(this);
    this.update = this.update.bind(this);
    this.delete = this.delete.bind(this);
  }
  
  /**
   * Get all resources with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getAll(req, res, next) {
    try {
      // Parse pagination parameters
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const sort = req.query.sort || '';
      const filter = req.query.filter || {};
      
      // Get data from service
      const { data, total } = await this.service.findAll({
        page,
        limit,
        sort,
        filter
      });
      
      // Send paginated response
      return res.status(200).json(
        ApiResponse.paginated(
          data,
          page,
          limit,
          total,
          `${this.resourceName}s retrieved successfully`
        )
      );
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Get resource by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getById(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new BadRequestError(`${this.resourceName} ID is required`);
      }
      
      const resource = await this.service.findById(id);
      
      if (!resource) {
        throw new NotFoundError(`${this.resourceName} not found`);
      }
      
      return res.status(200).json(
        ApiResponse.success(
          resource,
          `${this.resourceName} retrieved successfully`
        )
      );
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Create a new resource
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async create(req, res, next) {
    try {
      const resource = await this.service.create(req.body);
      
      return res.status(201).json(
        ApiResponse.success(
          resource,
          `${this.resourceName} created successfully`
        )
      );
    } catch (error) {
      // Handle specific error types
      if (error.code === 11000) {
        // MongoDB duplicate key error
        const field = Object.keys(error.keyValue)[0];
        return next(new ConflictError(`${this.resourceName} with this ${field} already exists`));
      }
      
      next(error);
    }
  }
  
  /**
   * Update a resource
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new BadRequestError(`${this.resourceName} ID is required`);
      }
      
      const resource = await this.service.update(id, req.body);
      
      if (!resource) {
        throw new NotFoundError(`${this.resourceName} not found`);
      }
      
      return res.status(200).json(
        ApiResponse.success(
          resource,
          `${this.resourceName} updated successfully`
        )
      );
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Delete a resource
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      
      if (!id) {
        throw new BadRequestError(`${this.resourceName} ID is required`);
      }
      
      const result = await this.service.delete(id);
      
      if (!result) {
        throw new NotFoundError(`${this.resourceName} not found`);
      }
      
      return res.status(200).json(
        ApiResponse.success(
          null,
          `${this.resourceName} deleted successfully`
        )
      );
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Handle validation errors
   * @param {Object} errors - Validation errors
   * @throws {ValidationError}
   */
  handleValidationErrors(errors) {
    if (Object.keys(errors).length > 0) {
      throw new ValidationError(`Invalid ${this.resourceName} data`, errors);
    }
  }
  
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {Object} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   */
  sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
    res.status(statusCode).json(
      ApiResponse.success(data, message)
    );
  }
  
  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {string} code - Error code
   * @param {number} statusCode - HTTP status code
   * @param {Object} errors - Validation errors
   */
  sendError(res, message = 'Error', code = 'ERROR', statusCode = 400, errors = null) {
    res.status(statusCode).json(
      ApiResponse.error(message, code, errors)
    );
  }
}

module.exports = BaseController; 