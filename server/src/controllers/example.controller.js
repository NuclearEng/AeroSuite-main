/**
 * Example Controller
 * 
 * This controller demonstrates the use of the BaseController and error handling utilities.
 * It shows how to implement consistent error handling across API endpoints.
 * 
 * Implements RF020 - Implement consistent error handling in APIs
 */

const BaseController = require('./BaseController');
const { 
  ValidationError, 
  NotFoundError,
  BadRequestError,
  ForbiddenError
} = require('../utils/errorHandler');
const { asyncHandler, paginatedHandler } = require('../utils/controllerWrapper');
const logger = require('../utils/logger');

/**
 * Example service mock for demonstration purposes
 */
const exampleService = {
  findAll: async ({ page, limit, sort, filter }) => {
    // Simulate database query
    const data = [
      { id: '1', name: 'Example 1', status: 'active' },
      { id: '2', name: 'Example 2', status: 'inactive' },
      { id: '3', name: 'Example 3', status: 'active' }
    ];
    
    return {
      data,
      total: data.length
    };
  },
  
  findById: async (id) => {
    // Simulate database query
    if (id === '999') {
      return null; // Simulate not found
    }
    
    return { id, name: `Example ${id}`, status: 'active' };
  },
  
  create: async (data) => {
    // Simulate validation
    if (!data.name) {
      throw new ValidationError('Validation failed', { name: 'Name is required' });
    }
    
    // Simulate database insert
    return { id: '4', ...data };
  },
  
  update: async (id, data) => {
    // Simulate not found
    if (id === '999') {
      return null;
    }
    
    // Simulate validation
    if (data.status && !['active', 'inactive'].includes(data.status)) {
      throw new ValidationError('Validation failed', { status: 'Status must be active or inactive' });
    }
    
    // Simulate database update
    return { id, ...data };
  },
  
  delete: async (id) => {
    // Simulate not found
    if (id === '999') {
      return null;
    }
    
    // Simulate database delete
    return true;
  }
};

/**
 * Example controller that extends BaseController
 */
class ExampleController extends BaseController {
  constructor() {
    super(exampleService, 'example');
    
    // Bind additional methods
    this.customAction = this.customAction.bind(this);
    this.securedAction = this.securedAction.bind(this);
    this.errorDemo = this.errorDemo.bind(this);
  }
  
  /**
   * Custom action that demonstrates error handling
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async customAction(req, res, next) {
    try {
      const { type } = req.query;
      
      // Validate input
      if (!type) {
        throw new BadRequestError('Type parameter is required');
      }
      
      // Process based on type
      let result;
      
      switch (type) {
        case 'simple':
          result = { message: 'This is a simple custom action' };
          break;
        case 'complex':
          result = { 
            message: 'This is a complex custom action',
            details: {
              timestamp: new Date().toISOString(),
              features: ['feature1', 'feature2', 'feature3']
            }
          };
          break;
        default:
          throw new BadRequestError(`Unsupported type: ${type}`, 'INVALID_TYPE');
      }
      
      // Log the action
      logger.info(`Custom action executed with type: ${type}`);
      
      // Send success response
      this.sendSuccess(res, result, 'Custom action executed successfully');
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Secured action that demonstrates authorization error handling
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async securedAction(req, res, next) {
    try {
      // Check if user has required role (simulated)
      const userRole = req.headers['x-user-role'] || 'guest';
      
      if (userRole !== 'admin') {
        throw new ForbiddenError('Admin role required for this action');
      }
      
      // Proceed with secured action
      const result = {
        message: 'Secured action executed successfully',
        sensitiveData: 'This data is only visible to admins'
      };
      
      // Send success response
      this.sendSuccess(res, result, 'Secured action executed successfully');
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Error demonstration endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async errorDemo(req, res, next) {
    try {
      const { errorType } = req.params;
      
      switch (errorType) {
        case 'validation':
          throw new ValidationError('Validation failed', {
            field1: 'Field 1 is invalid',
            field2: 'Field 2 is required'
          });
        case 'notfound':
          throw new NotFoundError('Resource not found');
        case 'forbidden':
          throw new ForbiddenError('Access denied');
        case 'server':
          throw new Error('Unexpected server error');
        case 'async':
          // Simulate async error
          await Promise.reject(new Error('Async operation failed'));
          break;
        default:
          throw new BadRequestError(`Unknown error type: ${errorType}`);
      }
    } catch (error) {
      next(error);
    }
  }
}

// Create controller instance
const exampleController = new ExampleController();

// Export controller methods with error handling wrappers
module.exports = {
  getAll: paginatedHandler(exampleController.getAll, 'Examples retrieved successfully'),
  getById: asyncHandler(exampleController.getById, 'Example retrieved successfully'),
  create: asyncHandler(exampleController.create, 'Example created successfully'),
  update: asyncHandler(exampleController.update, 'Example updated successfully'),
  delete: asyncHandler(exampleController.delete, 'Example deleted successfully'),
  customAction: asyncHandler(exampleController.customAction, 'Custom action executed successfully'),
  securedAction: asyncHandler(exampleController.securedAction, 'Secured action executed successfully'),
  errorDemo: exampleController.errorDemo
}; 