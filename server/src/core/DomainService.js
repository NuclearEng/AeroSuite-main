/**
 * DomainService.js
 * 
 * Base class for all domain services
 * Implements RF021 - Extract business logic into domain services
 */

const { DomainError } = require('./errors');
const EventEmitter = require('./EventEmitter');

/**
 * Base class for all domain services
 * Domain services encapsulate business logic that doesn't naturally fit within a domain entity
 * They typically operate on multiple domain entities and repositories
 */
class DomainService {
  /**
   * Create a new domain service
   * @param {Object} dependencies - Dependencies required by the service
   */
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.eventEmitter = dependencies.eventEmitter || EventEmitter.getInstance();
    
    // Validate dependencies
    this.validateDependencies();
  }
  
  /**
   * Validate that all required dependencies are provided
   * This method should be overridden by subclasses to specify their required dependencies
   * @throws {DomainError} - If a required dependency is missing
   */
  validateDependencies() {
    // To be overridden by subclasses
  }
  
  /**
   * Publish a domain event
   * @param {string} eventType - Type of the event
   * @param {Object} payload - Event payload
   */
  publishEvent(eventType, payload) {
    this.eventEmitter.emit(eventType, payload);
  }
  
  /**
   * Subscribe to a domain event
   * @param {string} eventType - Type of the event
   * @param {Function} handler - Event handler
   * @returns {Function} - Function to unsubscribe from the event
   */
  subscribeToEvent(eventType, handler) {
    return this.eventEmitter.on(eventType, handler);
  }
  
  /**
   * Get a dependency
   * @param {string} name - Name of the dependency
   * @returns {Object} - The dependency
   * @throws {DomainError} - If the dependency is not found
   */
  getDependency(name) {
    const dependency = this.dependencies[name];
    
    if (!dependency) {
      throw new DomainError(`Dependency not found: ${name}`);
    }
    
    return dependency;
  }
}

module.exports = DomainService; 