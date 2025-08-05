/**
 * MemoryCacheProvider.js
 * 
 * In-memory cache provider implementation
 * Implements RF025 - Implement multi-level caching strategy
 */

const CacheProvider = require('./CacheProvider');
const logger = require('../logger');
const LRUCache = require('lru-cache');

/**
 * Memory Cache Provider
 * Implements in-memory caching using LRU cache
 */
class MemoryCacheProvider extends CacheProvider {
  /**
   * Create a new memory cache provider
   * @param {Object} options - Provider options
   * @param {number} options.max - Maximum number of items in cache
   * @param {number} options.ttl - Default TTL in seconds
   * @param {number} options.maxSize - Maximum cache size in bytes
   */
  constructor(options = {}) {
    super({ name: options.name || 'memory' });
    
    this.options = {
      max: options.max || 1000,
      ttl: (options.ttl || 3600) * 1000, // Convert to milliseconds
      maxSize: options.maxSize || 100 * 1024 * 1024, // 100MB default
      sizeCalculation: (value, key) => {
        // Estimate size of cached item in bytes
        try {
          return JSON.stringify(value).length * 2; // UTF-16 characters are 2 bytes
        } catch (e) {
          return 1024; // Default size if can't calculate
        }
      },
      ...options
    };
    
    this.cache = null;
  }
  
  /**
   * Initialize the provider
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.cache) {
      return;
    }
    
    this.cache = new LRUCache(this.options);
    logger.info(`Memory cache provider initialized with max ${this.options.max} items, ${Math.round(this.options.maxSize / (1024 * 1024))}MB max size`);
  }
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} - Cached value with metadata or null if not found
   */
  async get(key) {
    if (!this.cache) {
      await this.initialize();
    }
    
    try {
      const data = this.cache.get(key);
      
      if (!data) {
        return null;
      }
      
      return data;
    } catch (error) {
      logger.error(`Error getting key ${key} from memory cache:`, error);
      return null;
    }
  }
  
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache (includes value and metadata)
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - True if set successfully
   */
  async set(key, data, ttl) {
    if (!this.cache) {
      await this.initialize();
    }
    
    try {
      const ttlMs = ttl ? ttl * 1000 : this.options.ttl;
      
      this.cache.set(key, data, { ttl: ttlMs });
      return true;
    } catch (error) {
      logger.error(`Error setting key ${key} in memory cache:`, error);
      return false;
    }
  }
  
  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async del(key) {
    if (!this.cache) {
      await this.initialize();
    }
    
    try {
      return this.cache.delete(key);
    } catch (error) {
      logger.error(`Error deleting key ${key} from memory cache:`, error);
      return false;
    }
  }
  
  /**
   * Clear cache by pattern
   * @param {string} pattern - Key pattern to match (supports simple glob patterns)
   * @returns {Promise<number>} - Number of keys deleted
   */
  async clear(pattern) {
    if (!this.cache) {
      await this.initialize();
    }
    
    try {
      // Convert simple glob pattern to regex
      const regexPattern = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
      );
      
      let count = 0;
      
      // LRU cache doesn't have a native way to get all keys, so we need to iterate
      for (const key of this.cache.keys()) {
        if (regexPattern.test(key)) {
          this.cache.delete(key);
          count++;
        }
      }
      
      return count;
    } catch (error) {
      logger.error(`Error clearing pattern ${pattern} from memory cache:`, error);
      return 0;
    }
  }
  
  /**
   * Close the provider
   * @returns {Promise<void>}
   */
  async close() {
    if (this.cache) {
      this.cache.clear();
      this.cache = null;
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    if (!this.cache) {
      return {
        size: 0,
        maxSize: this.options.maxSize,
        itemCount: 0,
        maxItems: this.options.max
      };
    }
    
    return {
      size: this.cache.calculatedSize || 0,
      maxSize: this.options.maxSize,
      itemCount: this.cache.size,
      maxItems: this.options.max
    };
  }
  
  /**
   * Check if a provider supports a feature
   * @param {string} feature - Feature name
   * @returns {boolean} - True if feature is supported
   */
  supportsFeature(feature) {
    const supportedFeatures = ['stats', 'clear'];
    return supportedFeatures.includes(feature);
  }
}

module.exports = MemoryCacheProvider; 