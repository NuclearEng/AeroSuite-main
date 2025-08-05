/**
 * ServiceInterface.js
 * 
 * Base interface for all service interfaces
 * Implements RF022 - Implement service interfaces
 */

/**
 * Base service interface
 * Defines the common methods that all services should implement
 * This is an abstract class that should not be instantiated directly
 */
class ServiceInterface {
  /**
   * Create a new service interface
   * @throws {Error} - If attempted to instantiate directly
   */
  constructor() {
    if (new.target === ServiceInterface) {
      throw new Error('ServiceInterface is an abstract class and cannot be instantiated directly');
    }
  }
  
  /**
   * Get the implementation of the service
   * @returns {Object} - The service implementation
   */
  getImplementation() {
    throw new Error('getImplementation() must be implemented by subclass');
  }
  
  /**
   * Check if the service implementation is valid
   * @param {Object} implementation - The service implementation to validate
   * @returns {boolean} - True if the implementation is valid
   */
  isValidImplementation(implementation) {
    throw new Error('isValidImplementation() must be implemented by subclass');
  }
}

module.exports = ServiceInterface; 