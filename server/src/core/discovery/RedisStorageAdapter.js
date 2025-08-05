/**
 * RedisStorageAdapter.js
 * 
 * Redis storage adapter for service discovery
 * Implements RF024 - Implement service discovery for microservices
 */

const StorageAdapter = require('./StorageAdapter');

/**
 * Redis storage adapter for service discovery
 * Stores services in Redis for persistence and distributed access
 */
class RedisStorageAdapter extends StorageAdapter {
  /**
   * Create a new Redis storage adapter
   * @param {Object} options - Redis client options
   * @param {Object} options.client - Redis client instance
   * @param {string} options.keyPrefix - Prefix for Redis keys (default: 'service-discovery:')
   */
  constructor(options) {
    super();
    
    if (!options || !options.client) {
      throw new Error('Redis client is required');
    }
    
    this.client = options.client;
    this.keyPrefix = options.keyPrefix || 'service-discovery:';
    this.servicesKey = `${this.keyPrefix}services`;
  }

  /**
   * Get the Redis key for a service
   * @param {string} serviceId - Service ID
   * @returns {string} - Redis key
   * @private
   */
  _getServiceKey(serviceId) {
    return `${this.keyPrefix}service:${serviceId}`;
  }

  /**
   * Register a service in the storage
   * @param {Object} service - Service to register
   * @returns {Promise<boolean>} - True if the service was registered
   */
  async registerService(service) {
    try {
      const serviceKey = this._getServiceKey(service.id);
      const serviceJson = JSON.stringify(service);
      
      // Use Redis transaction to ensure consistency
      const multi = this.client.multi();
      multi.set(serviceKey, serviceJson);
      multi.sadd(this.servicesKey, service.id);
      
      await multi.exec();
      return true;
    } catch (error) {
      console.error('Error registering service in Redis:', error);
      return false;
    }
  }

  /**
   * Deregister a service from the storage
   * @param {string} serviceId - ID of the service to deregister
   * @returns {Promise<boolean>} - True if the service was deregistered
   */
  async deregisterService(serviceId) {
    try {
      const serviceKey = this._getServiceKey(serviceId);
      
      // Use Redis transaction to ensure consistency
      const multi = this.client.multi();
      multi.del(serviceKey);
      multi.srem(this.servicesKey, serviceId);
      
      const results = await multi.exec();
      return results[0] === 1; // Check if the key was deleted
    } catch (error) {
      console.error('Error deregistering service from Redis:', error);
      return false;
    }
  }

  /**
   * Get a service from the storage
   * @param {string} serviceId - ID of the service to get
   * @returns {Promise<Object|null>} - The service or null if not found
   */
  async getService(serviceId) {
    try {
      const serviceKey = this._getServiceKey(serviceId);
      const serviceJson = await this.client.get(serviceKey);
      
      if (!serviceJson) {
        return null;
      }
      
      return JSON.parse(serviceJson);
    } catch (error) {
      console.error('Error getting service from Redis:', error);
      return null;
    }
  }

  /**
   * Update a service in the storage
   * @param {Object} service - Service to update
   * @returns {Promise<boolean>} - True if the service was updated
   */
  async updateService(service) {
    try {
      const serviceKey = this._getServiceKey(service.id);
      const exists = await this.client.exists(serviceKey);
      
      if (!exists) {
        return false;
      }
      
      const serviceJson = JSON.stringify(service);
      await this.client.set(serviceKey, serviceJson);
      
      return true;
    } catch (error) {
      console.error('Error updating service in Redis:', error);
      return false;
    }
  }

  /**
   * Get all services from the storage
   * @returns {Promise<Array<Object>>} - Array of services
   */
  async getAllServices() {
    try {
      const serviceIds = await this.client.smembers(this.servicesKey);
      
      if (!serviceIds || serviceIds.length === 0) {
        return [];
      }
      
      const serviceKeys = serviceIds.map(id => this._getServiceKey(id));
      const servicesJson = await this.client.mget(serviceKeys);
      
      return servicesJson
        .filter(json => json !== null)
        .map(json => JSON.parse(json));
    } catch (error) {
      console.error('Error getting all services from Redis:', error);
      return [];
    }
  }

  /**
   * Clear all services from the storage
   * @returns {Promise<boolean>} - True if the services were cleared
   */
  async clearServices() {
    try {
      const serviceIds = await this.client.smembers(this.servicesKey);
      
      if (!serviceIds || serviceIds.length === 0) {
        return true;
      }
      
      const serviceKeys = serviceIds.map(id => this._getServiceKey(id));
      
      // Use Redis transaction to ensure consistency
      const multi = this.client.multi();
      multi.del(...serviceKeys);
      multi.del(this.servicesKey);
      
      await multi.exec();
      return true;
    } catch (error) {
      console.error('Error clearing services from Redis:', error);
      return false;
    }
  }
}

module.exports = RedisStorageAdapter; 