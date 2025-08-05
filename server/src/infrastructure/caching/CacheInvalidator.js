/**
 * CacheInvalidator.js
 * 
 * Implements advanced cache invalidation patterns
 * Implements RF027 - Implement cache invalidation patterns
 */

const EventEmitter = require('events');
const logger = require('../logger');

/**
 * Cache Invalidator
 * Provides advanced cache invalidation patterns
 */
class CacheInvalidator {
  /**
   * Create a new cache invalidator
   * @param {Object} options - Invalidator options
   * @param {Object} options.cacheManager - Cache manager instance
   */
  constructor(options = {}) {
    if (!options.cacheManager) {
      throw new Error('Cache manager is required');
    }
    
    this.cacheManager = options.cacheManager;
    this.events = new EventEmitter();
    this.tagMap = new Map(); // Maps tags to keys
    this.dependencyMap = new Map(); // Maps keys to their dependencies
    this.scheduledInvalidations = new Map(); // Maps keys to their scheduled invalidation timeouts
    
    // Set up event listeners
    this._setupEventListeners();
    
    logger.info('Cache invalidator initialized');
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for cache set events
    this.cacheManager.on('set', (event) => {
      this.events.emit('set', event);
    });
    
    // Listen for cache delete events
    this.cacheManager.on('delete', (event) => {
      this._cleanupKey(event.key);
      this.events.emit('delete', event);
    });
    
    // Listen for cache clear events
    this.cacheManager.on('clear', (event) => {
      this._cleanupPattern(event.pattern);
      this.events.emit('clear', event);
    });
  }
  
  /**
   * Add tags to a cache key
   * @param {string} key - Cache key
   * @param {Array<string>} tags - Tags to add
   */
  addTags(key, tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return;
    }
    
    for (const tag of tags) {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      
      this.tagMap.get(tag).add(key);
    }
    
    logger.debug(`Added tags ${tags.join(', ')} to key ${key}`);
  }
  
  /**
   * Add dependencies to a cache key
   * @param {string} key - Cache key
   * @param {Array<string>} dependencies - Dependencies to add
   */
  addDependencies(key, dependencies) {
    if (!Array.isArray(dependencies) || dependencies.length === 0) {
      return;
    }
    
    if (!this.dependencyMap.has(key)) {
      this.dependencyMap.set(key, new Set());
    }
    
    for (const dependency of dependencies) {
      this.dependencyMap.get(key).add(dependency);
    }
    
    logger.debug(`Added dependencies ${dependencies.join(', ')} to key ${key}`);
  }
  
  /**
   * Schedule invalidation of a key after a certain time
   * @param {string} key - Cache key
   * @param {number} ttl - Time to live in seconds
   */
  scheduleInvalidation(key, ttl) {
    // Clear any existing timeout for this key
    if (this.scheduledInvalidations.has(key)) {
      clearTimeout(this.scheduledInvalidations.get(key));
    }
    
    // Schedule a new timeout
    const timeout = setTimeout(() => {
      this.invalidateKey(key);
      this.scheduledInvalidations.delete(key);
    }, ttl * 1000);
    
    // Store the timeout reference
    this.scheduledInvalidations.set(key, timeout);
    
    logger.debug(`Scheduled invalidation for key ${key} in ${ttl} seconds`);
  }
  
  /**
   * Invalidate a specific cache key
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if the key was invalidated
   */
  async invalidateKey(key) {
    const result = await this.cacheManager.del(key);
    this._cleanupKey(key);
    return result;
  }
  
  /**
   * Invalidate all keys with a specific tag
   * @param {string} tag - Tag to invalidate
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async invalidateTag(tag) {
    if (!this.tagMap.has(tag)) {
      return 0;
    }
    
    const keys = Array.from(this.tagMap.get(tag));
    let count = 0;
    
    for (const key of keys) {
      const result = await this.invalidateKey(key);
      if (result) {
        count++;
      }
    }
    
    // Clean up the tag
    this.tagMap.delete(tag);
    
    logger.info(`Invalidated ${count} keys with tag ${tag}`);
    return count;
  }
  
  /**
   * Invalidate all keys with any of the specified tags
   * @param {Array<string>} tags - Tags to invalidate
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async invalidateTags(tags) {
    if (!Array.isArray(tags) || tags.length === 0) {
      return 0;
    }
    
    // Get unique keys from all tags
    const keysToInvalidate = new Set();
    
    for (const tag of tags) {
      if (this.tagMap.has(tag)) {
        const keys = this.tagMap.get(tag);
        for (const key of keys) {
          keysToInvalidate.add(key);
        }
      }
    }
    
    // Invalidate all keys
    let count = 0;
    for (const key of keysToInvalidate) {
      const result = await this.invalidateKey(key);
      if (result) {
        count++;
      }
    }
    
    // Clean up the tags
    for (const tag of tags) {
      this.tagMap.delete(tag);
    }
    
    logger.info(`Invalidated ${count} keys with tags ${tags.join(', ')}`);
    return count;
  }
  
  /**
   * Invalidate all keys that depend on the specified key
   * @param {string} dependency - Dependency key
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async invalidateDependents(dependency) {
    const dependents = this._findDependents(dependency);
    let count = 0;
    
    for (const key of dependents) {
      const result = await this.invalidateKey(key);
      if (result) {
        count++;
      }
    }
    
    logger.info(`Invalidated ${count} keys dependent on ${dependency}`);
    return count;
  }
  
  /**
   * Invalidate keys matching a pattern
   * @param {string} pattern - Pattern to match
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async invalidatePattern(pattern) {
    const count = await this.cacheManager.clear(pattern);
    this._cleanupPattern(pattern);
    
    logger.info(`Invalidated ${count} keys matching pattern ${pattern}`);
    return count;
  }
  
  /**
   * Batch invalidate multiple keys
   * @param {Array<string>} keys - Keys to invalidate
   * @returns {Promise<number>} - Number of keys invalidated
   */
  async batchInvalidate(keys) {
    if (!Array.isArray(keys) || keys.length === 0) {
      return 0;
    }
    
    let count = 0;
    
    for (const key of keys) {
      const result = await this.invalidateKey(key);
      if (result) {
        count++;
      }
    }
    
    logger.info(`Batch invalidated ${count} keys`);
    return count;
  }
  
  /**
   * Find all keys that depend on the specified key
   * @param {string} dependency - Dependency key
   * @returns {Set<string>} - Set of dependent keys
   * @private
   */
  _findDependents(dependency) {
    const dependents = new Set();
    
    for (const [key, dependencies] of this.dependencyMap.entries()) {
      if (dependencies.has(dependency)) {
        dependents.add(key);
        
        // Also find transitive dependencies
        const transitiveDependents = this._findDependents(key);
        for (const transitiveKey of transitiveDependents) {
          dependents.add(transitiveKey);
        }
      }
    }
    
    return dependents;
  }
  
  /**
   * Clean up metadata for a key
   * @param {string} key - Cache key
   * @private
   */
  _cleanupKey(key) {
    // Remove key from dependency map
    this.dependencyMap.delete(key);
    
    // Remove key from tag map
    for (const [tag, keys] of this.tagMap.entries()) {
      if (keys.has(key)) {
        keys.delete(key);
        
        // Remove tag if it has no more keys
        if (keys.size === 0) {
          this.tagMap.delete(tag);
        }
      }
    }
    
    // Clear any scheduled invalidation
    if (this.scheduledInvalidations.has(key)) {
      clearTimeout(this.scheduledInvalidations.get(key));
      this.scheduledInvalidations.delete(key);
    }
  }
  
  /**
   * Clean up metadata for keys matching a pattern
   * @param {string} pattern - Pattern to match
   * @private
   */
  _cleanupPattern(pattern) {
    // Convert glob pattern to regex
    const regexPattern = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    
    // Clean up dependency map
    for (const key of this.dependencyMap.keys()) {
      if (regexPattern.test(key)) {
        this._cleanupKey(key);
      }
    }
    
    // Clean up scheduled invalidations
    for (const key of this.scheduledInvalidations.keys()) {
      if (regexPattern.test(key)) {
        clearTimeout(this.scheduledInvalidations.get(key));
        this.scheduledInvalidations.delete(key);
      }
    }
  }
  
  /**
   * Subscribe to invalidator events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  on(event, listener) {
    this.events.on(event, listener);
  }
  
  /**
   * Unsubscribe from invalidator events
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  off(event, listener) {
    this.events.off(event, listener);
  }
  
  /**
   * Clean up resources
   */
  close() {
    // Clear all scheduled invalidations
    for (const timeout of this.scheduledInvalidations.values()) {
      clearTimeout(timeout);
    }
    
    this.scheduledInvalidations.clear();
    this.tagMap.clear();
    this.dependencyMap.clear();
    this.events.removeAllListeners();
  }
}

module.exports = CacheInvalidator; 