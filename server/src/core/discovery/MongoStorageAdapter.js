/**
 * MongoStorageAdapter.js
 * 
 * MongoDB storage adapter for service discovery
 * Implements RF024 - Implement service discovery for microservices
 */

const StorageAdapter = require('./StorageAdapter');

/**
 * MongoDB storage adapter for service discovery
 * Stores services in MongoDB for persistence and distributed access
 */
class MongoStorageAdapter extends StorageAdapter {
  /**
   * Create a new MongoDB storage adapter
   * @param {Object} options - MongoDB options
   * @param {Object} options.db - MongoDB database instance
   * @param {string} options.collection - Collection name (default: 'services')
   */
  constructor(options) {
    super();
    
    if (!options || !options.db) {
      throw new Error('MongoDB database instance is required');
    }
    
    this.db = options.db;
    this.collectionName = options.collection || 'services';
    this.collection = this.db.collection(this.collectionName);
  }

  /**
   * Initialize the storage adapter
   * Creates indexes for efficient queries
   * @returns {Promise<boolean>} - True if initialization was successful
   */
  async initialize() {
    try {
      // Create indexes for efficient queries
      await this.collection.createIndex({ id: 1 }, { unique: true });
      await this.collection.createIndex({ name: 1 });
      await this.collection.createIndex({ status: 1 });
      await this.collection.createIndex({ lastHeartbeat: 1 });
      
      return true;
    } catch (error) {
      console.error('Error initializing MongoDB storage adapter:', error);
      return false;
    }
  }

  /**
   * Register a service in the storage
   * @param {Object} service - Service to register
   * @returns {Promise<boolean>} - True if the service was registered
   */
  async registerService(service) {
    try {
      const result = await this.collection.updateOne(
        { id: service.id },
        { $set: service },
        { upsert: true }
      );
      
      return result.acknowledged;
    } catch (error) {
      console.error('Error registering service in MongoDB:', error);
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
      const result = await this.collection.deleteOne({ id: serviceId });
      return result.deletedCount === 1;
    } catch (error) {
      console.error('Error deregistering service from MongoDB:', error);
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
      const service = await this.collection.findOne({ id: serviceId });
      
      if (!service) {
        return null;
      }
      
      // Remove MongoDB _id field
      const { _id, ...serviceData } = service;
      return serviceData;
    } catch (error) {
      console.error('Error getting service from MongoDB:', error);
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
      const result = await this.collection.updateOne(
        { id: service.id },
        { $set: service }
      );
      
      return result.matchedCount === 1;
    } catch (error) {
      console.error('Error updating service in MongoDB:', error);
      return false;
    }
  }

  /**
   * Get all services from the storage
   * @returns {Promise<Array<Object>>} - Array of services
   */
  async getAllServices() {
    try {
      const services = await this.collection.find({}).toArray();
      
      // Remove MongoDB _id field from each service
      return services.map(service => {
        const { _id, ...serviceData } = service;
        return serviceData;
      });
    } catch (error) {
      console.error('Error getting all services from MongoDB:', error);
      return [];
    }
  }

  /**
   * Clear all services from the storage
   * @returns {Promise<boolean>} - True if the services were cleared
   */
  async clearServices() {
    try {
      const result = await this.collection.deleteMany({});
      return result.acknowledged;
    } catch (error) {
      console.error('Error clearing services from MongoDB:', error);
      return false;
    }
  }

  /**
   * Find services by criteria
   * @param {Object} criteria - Search criteria
   * @param {Object} options - Search options
   * @returns {Promise<Array<Object>>} - Array of matching services
   */
  async findServices(criteria = {}, options = {}) {
    try {
      const query = this.collection.find(criteria);
      
      if (options.sort) {
        query.sort(options.sort);
      }
      
      if (options.limit) {
        query.limit(options.limit);
      }
      
      if (options.skip) {
        query.skip(options.skip);
      }
      
      const services = await query.toArray();
      
      // Remove MongoDB _id field from each service
      return services.map(service => {
        const { _id, ...serviceData } = service;
        return serviceData;
      });
    } catch (error) {
      console.error('Error finding services in MongoDB:', error);
      return [];
    }
  }

  /**
   * Count services matching criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<number>} - Count of matching services
   */
  async countServices(criteria = {}) {
    try {
      return await this.collection.countDocuments(criteria);
    } catch (error) {
      console.error('Error counting services in MongoDB:', error);
      return 0;
    }
  }
}

module.exports = MongoStorageAdapter; 