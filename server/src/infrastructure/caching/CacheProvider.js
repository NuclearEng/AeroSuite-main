/**
 * CacheProvider.js
 * 
 * Interface for cache providers
 * Implements RF025 - Implement multi-level caching strategy
 */

/**
 * Cache Provider Interface
 * All cache providers must implement this interface
 */
class CacheProvider {
  /**
   * Create a new cache provider
   * @param {Object} options - Provider options
   */
  constructor(options = {}) {
    this.name = options.name || this.constructor.name;
    
    if (new.target === CacheProvider) {
      throw new Error('CacheProvider is an abstract class and cannot be instantiated directly');
    }
  }
  
  /**
   * Initialize the provider
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} - Cached value with metadata or null if not found
   */
  async get(key) {
    throw new Error('get() must be implemented by subclass');
  }
  
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache (includes value and metadata)
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - True if set successfully
   */
  async set(key, data, ttl) {
    throw new Error('set() must be implemented by subclass');
  }
  
  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async del(key) {
    throw new Error('del() must be implemented by subclass');
  }
  
  /**
   * Clear cache by pattern
   * @param {string} pattern - Key pattern to match
   * @returns {Promise<number>} - Number of keys deleted
   */
  async clear(pattern) {
    throw new Error('clear() must be implemented by subclass');
  }
  
  /**
   * Close the provider
   * @returns {Promise<void>}
   */
  async close() {
    throw new Error('close() must be implemented by subclass');
  }
  
  /**
   * Check if a provider supports a feature
   * @param {string} feature - Feature name
   * @returns {boolean} - True if feature is supported
   */
  supportsFeature(feature) {
    return false;
  }
}

module.exports = CacheProvider; 