/**
 * StatelessService.js
 * 
 * Base class for all stateless services
 * Implements RF037 - Ensure all services are stateless
 */

const DomainService = require('./DomainService');
const { DomainError } = require('./errors');

/**
 * Base class for all stateless services
 * Ensures that services don't maintain state between requests
 */
class StatelessService extends DomainService {
  /**
   * Create a new stateless service
   * @param {Object} dependencies - Dependencies required by the service
   */
  constructor(dependencies = {}) {
    super(dependencies);
    
    // Validate that an event emitter is provided
    if (!this.eventEmitter) {
      throw new DomainError('Event emitter is required for stateless services');
    }
    
    // Initialize request context
    this.requestContext = null;
  }
  
  /**
   * Set the current request context
   * This should be called at the beginning of each request
   * @param {Object} context - Request context
   */
  setRequestContext(context) {
    this.requestContext = context;
  }
  
  /**
   * Clear the current request context
   * This should be called at the end of each request
   */
  clearRequestContext() {
    this.requestContext = null;
  }
  
  /**
   * Get the current request context
   * @returns {Object} - Current request context
   * @throws {DomainError} - If no request context is set
   */
  getRequestContext() {
    if (!this.requestContext) {
      throw new DomainError('No request context set');
    }
    
    return this.requestContext;
  }
  
  /**
   * Execute a method in a stateless context
   * @param {Function} method - Method to execute
   * @param {Object} context - Request context
   * @param {Array} args - Method arguments
   * @returns {Promise<any>} - Method result
   */
  async executeStateless(method, context, ...args) {
    // Set request context
    this.setRequestContext(context);
    
    try {
      // Execute method
      const result = await method.apply(this, args);
      return result;
    } finally {
      // Clear request context
      this.clearRequestContext();
    }
  }
  
  /**
   * Publish a domain event with request context
   * @param {string} eventType - Type of the event
   * @param {Object} payload - Event payload
   */
  publishEvent(eventType, payload) {
    const context = this.requestContext || {};
    
    // Add request context to event payload
    const enrichedPayload = {
      ...payload,
      _context: {
        requestId: context.requestId,
        userId: context.userId,
        timestamp: new Date().toISOString()
      }
    };
    
    // Publish event using the event emitter
    super.publishEvent(eventType, enrichedPayload);
  }
}

module.exports = StatelessService; 