/**
 * StatelessController.js
 * 
 * Base class for controllers using stateless services
 * Implements RF037 - Ensure all services are stateless
 */

const BaseController = require('./BaseController');
const StatelessServiceFactory = require('./StatelessServiceFactory');

/**
 * Base class for controllers using stateless services
 */
class StatelessController extends BaseController {
  /**
   * Create a new stateless controller
   * @param {Object} options - Controller options
   */
  constructor(options = {}) {
    super(options);
    
    // Get service factory instance
    this.serviceFactory = StatelessServiceFactory.getInstance();
    
    // Initialize service instances map
    this.services = new Map();
  }
  
  /**
   * Get a service instance
   * @param {string} serviceType - Type of service
   * @param {string} serviceId - Unique ID for the service instance (defaults to serviceType)
   * @param {Object} config - Configuration for the service
   * @returns {Object} - Service instance
   */
  getService(serviceType, serviceId = serviceType, config = {}) {
    const key = `${serviceType}:${serviceId}`;
    
    if (!this.services.has(key)) {
      const service = this.serviceFactory.getOrCreateService(serviceType, serviceId, config);
      this.services.set(key, service);
    }
    
    return this.services.get(key);
  }
  
  /**
   * Execute a service method in a stateless context
   * @param {Object} service - Service instance
   * @param {string} methodName - Name of the method to execute
   * @param {Object} req - Express request object
   * @param {Array} args - Method arguments
   * @returns {Promise<any>} - Method result
   */
  async executeServiceMethod(service, methodName, req, ...args) {
    if (!service[methodName] || typeof service[methodName] !== 'function') {
      throw new Error(`Method ${methodName} not found on service`);
    }
    
    // Get request context
    const context = req.context || {};
    
    // Execute method in stateless context
    return service.executeStateless(service[methodName], context, ...args);
  }
  
  /**
   * Create a route handler that uses a stateless service
   * @param {string} serviceType - Type of service
   * @param {string} methodName - Name of the method to execute
   * @param {Function} paramsExtractor - Function to extract method parameters from request
   * @returns {Function} - Express route handler
   */
  createServiceHandler(serviceType, methodName, paramsExtractor = req => []) {
    return async (req, res, next) => {
      try {
        // Get service instance
        const service = this.getService(serviceType);
        
        // Extract method parameters
        const params = paramsExtractor(req);
        
        // Execute service method
        const result = await this.executeServiceMethod(service, methodName, req, ...params);
        
        // Send response
        this.sendSuccess(res, result);
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = StatelessController; 