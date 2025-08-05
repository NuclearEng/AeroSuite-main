/**
 * ServiceFactory.js
 * 
 * Factory for creating cached service instances
 * Implements RF026 - Add Redis caching for frequently accessed data
 */

const { createDefaultCacheManager, CachePolicies } = require('./index');
const CachedSupplierService = require('../../domains/supplier/services/CachedSupplierService');
const CachedCustomerService = require('../../domains/customer/services/CachedCustomerService');
const Redis = require('ioredis');
const logger = require('../logger');

/**
 * Service Factory
 * Creates and manages cached service instances
 */
class ServiceFactory {
  /**
   * Create a new service factory
   * @param {Object} options - Factory options
   * @param {Object} options.redis - Redis configuration
   * @param {Object} options.cachePolicies - Cache policies for different services
   */
  constructor(options = {}) {
    this.options = options;
    this.cacheManager = null;
    this.services = new Map();
    
    // Initialize cache manager
    this._initializeCacheManager();
  }
  
  /**
   * Initialize the cache manager
   * @private
   */
  _initializeCacheManager() {
    try {
      // Create Redis client if configuration is provided
      let redisClient = null;
      
      if (this.options.redis) {
        redisClient = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB) || 0,
          ...this.options.redis
        });
        
        // Handle Redis connection events
        redisClient.on('connect', () => {
          logger.info('Redis connected for service caching');
        });
        
        redisClient.on('error', (error) => {
          logger.error('Redis error in service caching:', error);
        });
      }
      
      // Create cache manager
      this.cacheManager = createDefaultCacheManager({
        redis: redisClient ? { redisConfig: { client: redisClient } } : undefined,
        defaultPolicy: CachePolicies.DYNAMIC
      });
      
      logger.info('Service factory cache manager initialized');
    } catch (error) {
      logger.error('Error initializing service factory cache manager:', error);
      // Fallback to memory-only cache
      this.cacheManager = createDefaultCacheManager({ redis: false });
    }
  }
  
  /**
   * Get a cached supplier service
   * @param {Object} options - Service options
   * @returns {CachedSupplierService} - Cached supplier service
   */
  getSupplierService(options = {}) {
    if (!this.services.has('supplier')) {
      const supplierService = new CachedSupplierService({
        cacheManager: this.cacheManager,
        policies: this.options.cachePolicies?.supplier,
        ...options
      });
      
      this.services.set('supplier', supplierService);
    }
    
    return this.services.get('supplier');
  }
  
  /**
   * Get a cached customer service
   * @param {Object} options - Service options
   * @returns {CachedCustomerService} - Cached customer service
   */
  getCustomerService(options = {}) {
    if (!this.services.has('customer')) {
      const customerService = new CachedCustomerService({
        cacheManager: this.cacheManager,
        policies: this.options.cachePolicies?.customer,
        ...options
      });
      
      this.services.set('customer', customerService);
    }
    
    return this.services.get('customer');
  }
  
  /**
   * Get the cache manager
   * @returns {Object} - Cache manager
   */
  getCacheManager() {
    return this.cacheManager;
  }
  
  /**
   * Get cache statistics for all services
   * @returns {Object} - Cache statistics
   */
  getStats() {
    return this.cacheManager.getStats();
  }
  
  /**
   * Reset cache statistics
   */
  resetStats() {
    this.cacheManager.resetStats();
  }
  
  /**
   * Close all connections
   * @returns {Promise<void>}
   */
  async close() {
    if (this.cacheManager) {
      await this.cacheManager.close();
    }
  }
}

// Create a singleton instance
let instance = null;

/**
 * Get the service factory instance
 * @param {Object} options - Factory options
 * @returns {ServiceFactory} - Service factory instance
 */
function getServiceFactory(options = {}) {
  if (!instance) {
    instance = new ServiceFactory(options);
  }
  return instance;
}

module.exports = {
  ServiceFactory,
  getServiceFactory
}; 