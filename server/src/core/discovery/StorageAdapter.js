/**
 * StorageAdapter.js
 * 
 * Interface for service discovery storage adapters
 * Implements RF024 - Implement service discovery for microservices
 */

/**
 * Storage adapter interface for service discovery
 * This is an abstract class that should be extended by concrete implementations
 */
class StorageAdapter {
  /**
   * Create a new storage adapter
   * @throws {Error} - If attempted to instantiate directly
   */
  constructor() {
    if (new.target === StorageAdapter) {
      throw new Error('StorageAdapter is an abstract class and cannot be instantiated directly');
    }
  }

  /**
   * Register a service in the storage
   * @param {Object} service - Service to register
   * @returns {Promise<boolean>} - True if the service was registered
   */
  async registerService(service) {
    throw new Error('registerService() must be implemented by subclass');
  }

  /**
   * Deregister a service from the storage
   * @param {string} serviceId - ID of the service to deregister
   * @returns {Promise<boolean>} - True if the service was deregistered
   */
  async deregisterService(serviceId) {
    throw new Error('deregisterService() must be implemented by subclass');
  }

  /**
   * Get a service from the storage
   * @param {string} serviceId - ID of the service to get
   * @returns {Promise<Object|null>} - The service or null if not found
   */
  async getService(serviceId) {
    throw new Error('getService() must be implemented by subclass');
  }

  /**
   * Update a service in the storage
   * @param {Object} service - Service to update
   * @returns {Promise<boolean>} - True if the service was updated
   */
  async updateService(service) {
    throw new Error('updateService() must be implemented by subclass');
  }

  /**
   * Get all services from the storage
   * @returns {Promise<Array<Object>>} - Array of services
   */
  async getAllServices() {
    throw new Error('getAllServices() must be implemented by subclass');
  }

  /**
   * Clear all services from the storage
   * @returns {Promise<boolean>} - True if the services were cleared
   */
  async clearServices() {
    throw new Error('clearServices() must be implemented by subclass');
  }
}

module.exports = StorageAdapter; 