/**
 * InMemoryStorageAdapter.js
 * 
 * In-memory storage adapter for service discovery
 * Implements RF024 - Implement service discovery for microservices
 */

const StorageAdapter = require('./StorageAdapter');

/**
 * In-memory storage adapter for service discovery
 * Stores services in memory (non-persistent)
 */
class InMemoryStorageAdapter extends StorageAdapter {
  /**
   * Create a new in-memory storage adapter
   */
  constructor() {
    super();
    this.services = new Map();
  }

  /**
   * Register a service in the storage
   * @param {Object} service - Service to register
   * @returns {Promise<boolean>} - True if the service was registered
   */
  async registerService(service) {
    this.services.set(service.id, { ...service });
    return true;
  }

  /**
   * Deregister a service from the storage
   * @param {string} serviceId - ID of the service to deregister
   * @returns {Promise<boolean>} - True if the service was deregistered
   */
  async deregisterService(serviceId) {
    return this.services.delete(serviceId);
  }

  /**
   * Get a service from the storage
   * @param {string} serviceId - ID of the service to get
   * @returns {Promise<Object|null>} - The service or null if not found
   */
  async getService(serviceId) {
    const service = this.services.get(serviceId);
    return service ? { ...service } : null;
  }

  /**
   * Update a service in the storage
   * @param {Object} service - Service to update
   * @returns {Promise<boolean>} - True if the service was updated
   */
  async updateService(service) {
    if (!this.services.has(service.id)) {
      return false;
    }

    this.services.set(service.id, { ...service });
    return true;
  }

  /**
   * Get all services from the storage
   * @returns {Promise<Array<Object>>} - Array of services
   */
  async getAllServices() {
    return Array.from(this.services.values()).map(service => ({ ...service }));
  }

  /**
   * Clear all services from the storage
   * @returns {Promise<boolean>} - True if the services were cleared
   */
  async clearServices() {
    this.services.clear();
    return true;
  }
}

module.exports = InMemoryStorageAdapter; 