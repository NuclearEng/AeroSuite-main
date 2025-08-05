/**
 * ServiceRegistry.js
 * 
 * Registry for all service interfaces
 * Implements RF022 - Implement service interfaces
 */

const { DomainError } = require('../errors');

/**
 * Service registry
 * Manages all service interfaces and their implementations
 */
class ServiceRegistry {
  /**
   * Create a new service registry
   */
  constructor() {
    this.interfaces = new Map();
    this.implementations = new Map();
  }
  
  /**
   * Get the singleton instance of the service registry
   * @returns {ServiceRegistry} - The singleton instance
   */
  static getInstance() {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    
    return ServiceRegistry.instance;
  }
  
  /**
   * Register a service interface
   * @param {string} name - Name of the service interface
   * @param {Object} serviceInterface - The service interface
   */
  registerInterface(name, serviceInterface) {
    if (this.interfaces.has(name)) {
      throw new DomainError(`Service interface ${name} is already registered`);
    }
    
    this.interfaces.set(name, serviceInterface);
  }
  
  /**
   * Register a service implementation
   * @param {string} name - Name of the service interface
   * @param {Object} implementation - The service implementation
   */
  registerImplementation(name, implementation) {
    if (!this.interfaces.has(name)) {
      throw new DomainError(`Service interface ${name} is not registered`);
    }
    
    const serviceInterface = this.interfaces.get(name);
    
    if (!serviceInterface.isValidImplementation(implementation)) {
      throw new DomainError(`Implementation for ${name} does not satisfy the interface`);
    }
    
    this.implementations.set(name, implementation);
  }
  
  /**
   * Get a service implementation
   * @param {string} name - Name of the service interface
   * @returns {Object} - The service implementation
   */
  getService(name) {
    if (!this.implementations.has(name)) {
      throw new DomainError(`Service ${name} is not registered`);
    }
    
    return this.implementations.get(name);
  }
  
  /**
   * Check if a service is registered
   * @param {string} name - Name of the service interface
   * @returns {boolean} - True if the service is registered
   */
  hasService(name) {
    return this.implementations.has(name);
  }
  
  /**
   * Get all registered service names
   * @returns {Array<string>} - Array of service names
   */
  getServiceNames() {
    return Array.from(this.implementations.keys());
  }
  
  /**
   * Clear all registered services
   * Mainly used for testing
   */
  clear() {
    this.interfaces.clear();
    this.implementations.clear();
  }
}

module.exports = ServiceRegistry; 