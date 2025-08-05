/**
 * DatabaseCacheProvider.js
 * 
 * Database cache provider implementation
 * Implements RF025 - Implement multi-level caching strategy
 */

const CacheProvider = require('./CacheProvider');
const logger = require('../logger');

/**
 * Database Cache Provider
 * Implements persistent caching using a database
 */
class DatabaseCacheProvider extends CacheProvider {
  /**
   * Create a new database cache provider
   * @param {Object} options - Provider options
   * @param {Object} options.db - Database connection
   * @param {string} options.collection - Collection/table name for cache entries
   * @param {number} options.ttl - Default TTL in seconds
   */
  constructor(options = {}) {
    super({ name: options.name || 'database' });
    
    if (!options.db) {
      throw new Error('Database connection is required');
    }
    
    this.options = {
      collection: options.collection || 'cache',
      ttl: options.ttl || 86400, // 24 hours default
      ...options
    };
    
    this.db = options.db;
    this.collection = null;
  }
  
  /**
   * Initialize the provider
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.collection) {
      return;
    }
    
    try {
      this.collection = this.db.collection(this.options.collection);
      
      // Create indexes
      await this.collection.createIndex({ key: 1 }, { unique: true });
      await this.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      
      // Start background cleanup for expired entries
      this._startCleanupTask();
      
      logger.info(`Database cache provider initialized with collection ${this.options.collection}`);
    } catch (error) {
      logger.error('Error initializing database cache provider:', error);
      throw error;
    }
  }
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} - Cached value with metadata or null if not found
   */
  async get(key) {
    if (!this.collection) {
      await this.initialize();
    }
    
    try {
      const now = new Date();
      const entry = await this.collection.findOne({
        key,
        expiresAt: { $gt: now }
      });
      
      if (!entry) {
        return null;
      }
      
      return {
        value: entry.value,
        metadata: {
          createdAt: entry.createdAt.getTime(),
          expiresAt: entry.expiresAt.getTime()
        }
      };
    } catch (error) {
      logger.error(`Error getting key ${key} from database cache:`, error);
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
    if (!this.collection) {
      await this.initialize();
    }
    
    try {
      const now = new Date();
      const seconds = ttl || this.options.ttl;
      const expiresAt = new Date(now.getTime() + (seconds * 1000));
      
      const result = await this.collection.updateOne(
        { key },
        {
          $set: {
            key,
            value: data.value,
            createdAt: now,
            expiresAt,
            updatedAt: now
          }
        },
        { upsert: true }
      );
      
      return result.acknowledged;
    } catch (error) {
      logger.error(`Error setting key ${key} in database cache:`, error);
      return false;
    }
  }
  
  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async del(key) {
    if (!this.collection) {
      await this.initialize();
    }
    
    try {
      const result = await this.collection.deleteOne({ key });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error(`Error deleting key ${key} from database cache:`, error);
      return false;
    }
  }
  
  /**
   * Clear cache by pattern
   * @param {string} pattern - Key pattern to match (supports regex)
   * @returns {Promise<number>} - Number of keys deleted
   */
  async clear(pattern) {
    if (!this.collection) {
      await this.initialize();
    }
    
    try {
      // Convert glob pattern to regex
      const regexPattern = new RegExp(
        '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
      );
      
      const result = await this.collection.deleteMany({
        key: { $regex: regexPattern }
      });
      
      return result.deletedCount;
    } catch (error) {
      logger.error(`Error clearing pattern ${pattern} from database cache:`, error);
      return 0;
    }
  }
  
  /**
   * Close the provider
   * @returns {Promise<void>}
   */
  async close() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
    
    // We don't close the database connection as it might be used elsewhere
    this.collection = null;
  }
  
  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  async getStats() {
    if (!this.collection) {
      await this.initialize();
    }
    
    try {
      const totalCount = await this.collection.countDocuments({});
      const expiredCount = await this.collection.countDocuments({
        expiresAt: { $lt: new Date() }
      });
      const activeCount = totalCount - expiredCount;
      
      // Get size statistics if available
      let totalSize = 0;
      try {
        const stats = await this.db.command({ collStats: this.options.collection });
        totalSize = stats.size || 0;
      } catch (e) {
        // Ignore if not supported
      }
      
      return {
        totalEntries: totalCount,
        activeEntries: activeCount,
        expiredEntries: expiredCount,
        totalSize
      };
    } catch (error) {
      logger.error('Error getting database cache stats:', error);
      return {
        totalEntries: 0,
        activeEntries: 0,
        expiredEntries: 0,
        totalSize: 0
      };
    }
  }
  
  /**
   * Check if a provider supports a feature
   * @param {string} feature - Feature name
   * @returns {boolean} - True if feature is supported
   */
  supportsFeature(feature) {
    const supportedFeatures = ['stats', 'clear', 'persistent'];
    return supportedFeatures.includes(feature);
  }
  
  /**
   * Start background cleanup task for expired entries
   * @private
   */
  _startCleanupTask() {
    // Run cleanup every hour
    this._cleanupInterval = setInterval(async () => {
      try {
        if (!this.collection) return;
        
        const now = new Date();
        const result = await this.collection.deleteMany({
          expiresAt: { $lt: now }
        });
        
        if (result.deletedCount > 0) {
          logger.debug(`Database cache cleanup: removed ${result.deletedCount} expired entries`);
        }
      } catch (error) {
        logger.error('Error during database cache cleanup:', error);
      }
    }, 3600000); // 1 hour
    
    // Prevent the interval from keeping the process alive
    this._cleanupInterval.unref();
  }
}

module.exports = DatabaseCacheProvider; 