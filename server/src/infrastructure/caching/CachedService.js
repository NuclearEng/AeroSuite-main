/**
 * CachedService.js
 * 
 * Base class for cached domain services
 * Implements RF026 - Add Redis caching for frequently accessed data
 * Enhanced for RF027 - Implement cache invalidation patterns
 */

const { createDefaultCacheManager, CachePolicies } = require('./index');
const logger = require('../logger');

/**
 * Base class for cached domain services
 * Wraps domain services with caching capabilities
 */
class CachedService {
  /**
   * Create a new cached service
   * @param {Object} service - The domain service to wrap
   * @param {Object} options - Caching options
   * @param {Object} options.cacheManager - Cache manager instance
   * @param {Object} options.policies - Cache policies for different methods
   * @param {boolean} options.enabled - Whether caching is enabled
   */
  constructor(service, options = {}) {
    if (!service) {
      throw new Error('Service is required');
    }
    
    this.service = service;
    this.serviceName = service.constructor.name;
    this.cacheManager = options.cacheManager || createDefaultCacheManager();
    this.policies = options.policies || {};
    this.enabled = options.enabled !== false;
    
    // Default cache key prefix
    this.keyPrefix = options.keyPrefix || `service:${this.serviceName.toLowerCase()}:`;
    
    // Default tags
    this.defaultTags = options.defaultTags || [this.serviceName.toLowerCase()];
    
    // Entity tag prefix
    this.entityTagPrefix = options.entityTagPrefix || `entity:${this.serviceName.toLowerCase()}:`;
    
    logger.info(`Cached service created for ${this.serviceName}`);
  }
  
  /**
   * Get a cache policy for a method
   * @param {string} method - Method name
   * @returns {Object} - Cache policy
   */
  getPolicy(method) {
    return this.policies[method] || CachePolicies.DEFAULT;
  }
  
  /**
   * Generate a cache key for a method call
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @returns {string} - Cache key
   */
  generateKey(method, args) {
    // For simple ID-based methods, use the ID as the key
    if (args.length === 1 && typeof args[0] === 'string') {
      return `${this.keyPrefix}${method}:${args[0]}`;
    }
    
    // For methods with no arguments
    if (args.length === 0) {
      return `${this.keyPrefix}${method}`;
    }
    
    // For methods with multiple arguments or complex arguments
    try {
      // Create a stable JSON representation of the arguments
      const argsKey = JSON.stringify(args, (key, value) => {
        // Handle special cases like functions, undefined, etc.
        if (typeof value === 'function') {
          return 'function';
        }
        if (value === undefined) {
          return 'undefined';
        }
        return value;
      });
      
      return `${this.keyPrefix}${method}:${argsKey}`;
    } catch (error) {
      logger.warn(`Error generating cache key for ${method}:`, error);
      // Fallback to a simpler key
      return `${this.keyPrefix}${method}:${args.length}_args`;
    }
  }
  
  /**
   * Generate tags for a method call
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @returns {Array<string>} - Tags
   */
  generateTags(method, args) {
    const tags = [...this.defaultTags];
    
    // Add method-specific tag
    tags.push(`${this.serviceName.toLowerCase()}:${method}`);
    
    // For ID-based methods, add entity tag
    if (args.length === 1 && typeof args[0] === 'string') {
      tags.push(`${this.entityTagPrefix}${args[0]}`);
    }
    
    return tags;
  }
  
  /**
   * Generate dependencies for a method call
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @returns {Array<string>} - Dependencies
   */
  generateDependencies(method, args) {
    const dependencies = [];
    
    // For ID-based methods, add entity dependency
    if (args.length === 1 && typeof args[0] === 'string') {
      const entityKey = `${this.entityTagPrefix}${args[0]}`;
      dependencies.push(entityKey);
    }
    
    return dependencies;
  }
  
  /**
   * Wrap a service method with caching
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @param {Object} options - Additional options
   * @returns {Promise<*>} - Method result
   */
  async callWithCache(method, args, options = {}) {
    if (!this.enabled) {
      return this.service[method](...args);
    }
    
    const key = this.generateKey(method, args);
    const policy = this.getPolicy(method);
    const tags = options.tags || this.generateTags(method, args);
    const dependencies = options.dependencies || this.generateDependencies(method, args);
    
    return this.cacheManager.get(key, {
      fetchFn: () => this.service[method](...args),
      policy,
      tags,
      dependencies
    });
  }
  
  /**
   * Invalidate cache for a method
   * @param {string} method - Method name
   * @param {Array} args - Method arguments
   * @returns {Promise<boolean>} - True if cache was invalidated
   */
  async invalidateCache(method, args) {
    if (!this.enabled) {
      return false;
    }
    
    const key = this.generateKey(method, args);
    return this.cacheManager.del(key);
  }
  
  /**
   * Invalidate all cache entries for a method
   * @param {string} method - Method name
   * @returns {Promise<number>} - Number of cache entries invalidated
   */
  async invalidateMethodCache(method) {
    if (!this.enabled) {
      return 0;
    }
    
    const pattern = `${this.keyPrefix}${method}:*`;
    return this.cacheManager.clear(pattern);
  }
  
  /**
   * Invalidate all cache entries for this service
   * @returns {Promise<number>} - Number of cache entries invalidated
   */
  async invalidateAllCache() {
    if (!this.enabled) {
      return 0;
    }
    
    const pattern = `${this.keyPrefix}*`;
    return this.cacheManager.clear(pattern);
  }
  
  /**
   * Invalidate cache for an entity
   * @param {string} entityId - Entity ID
   * @returns {Promise<number>} - Number of cache entries invalidated
   */
  async invalidateEntityCache(entityId) {
    if (!this.enabled) {
      return 0;
    }
    
    const tag = `${this.entityTagPrefix}${entityId}`;
    return this.cacheManager.invalidateByTag(tag);
  }
  
  /**
   * Invalidate cache by tags
   * @param {Array<string>} tags - Tags to invalidate
   * @returns {Promise<number>} - Number of cache entries invalidated
   */
  async invalidateByTags(tags) {
    if (!this.enabled || !tags || tags.length === 0) {
      return 0;
    }
    
    return this.cacheManager.invalidateByTags(tags);
  }
  
  /**
   * Batch invalidate multiple entity caches
   * @param {Array<string>} entityIds - Entity IDs
   * @returns {Promise<number>} - Number of cache entries invalidated
   */
  async batchInvalidateEntities(entityIds) {
    if (!this.enabled || !entityIds || entityIds.length === 0) {
      return 0;
    }
    
    const tags = entityIds.map(id => `${this.entityTagPrefix}${id}`);
    return this.cacheManager.invalidateByTags(tags);
  }
  
  /**
   * Get cache statistics
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
   * Enable caching
   */
  enable() {
    this.enabled = true;
  }
  
  /**
   * Disable caching
   */
  disable() {
    this.enabled = false;
  }
}

module.exports = CachedService; 