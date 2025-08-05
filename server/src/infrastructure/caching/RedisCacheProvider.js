/**
 * RedisCacheProvider.js
 * 
 * Redis cache provider implementation
 * Implements RF025 - Implement multi-level caching strategy
 */

const Redis = require('ioredis');
const CacheProvider = require('./CacheProvider');
const logger = require('../logger');

/**
 * Redis Cache Provider
 * Implements distributed caching using Redis
 */
class RedisCacheProvider extends CacheProvider {
  /**
   * Create a new Redis cache provider
   * @param {Object} options - Provider options
   * @param {Object} options.redisConfig - Redis connection configuration
   * @param {string} options.keyPrefix - Prefix for all cache keys
   * @param {number} options.ttl - Default TTL in seconds
   */
  constructor(options = {}) {
    super({ name: options.name || 'redis' });
    
    this.options = {
      keyPrefix: options.keyPrefix || 'cache:',
      ttl: options.ttl || 3600,
      redisConfig: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        ...(options.redisConfig || {})
      }
    };
    
    this.client = null;
  }
  
  /**
   * Initialize the provider
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.client) {
      return;
    }
    
    this.client = new Redis(this.options.redisConfig);
    
    // Handle connection events
    this.client.on('connect', () => {
      logger.info('Redis cache provider connected');
    });
    
    this.client.on('error', (error) => {
      logger.error('Redis cache provider error:', error);
    });
    
    this.client.on('close', () => {
      logger.info('Redis cache provider connection closed');
    });
    
    this.client.on('reconnecting', () => {
      logger.info('Redis cache provider reconnecting');
    });
    
    // Wait for connection to be ready
    await new Promise((resolve) => {
      if (this.client.status === 'ready') {
        resolve();
      } else {
        this.client.once('ready', resolve);
      }
    });
  }
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} - Cached value with metadata or null if not found
   */
  async get(key) {
    if (!this.client) {
      await this.initialize();
    }
    
    try {
      const fullKey = this._getFullKey(key);
      const data = await this.client.get(fullKey);
      
      if (!data) {
        return null;
      }
      
      return JSON.parse(data);
    } catch (error) {
      logger.error(`Error getting key ${key} from Redis cache:`, error);
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
    if (!this.client) {
      await this.initialize();
    }
    
    try {
      const fullKey = this._getFullKey(key);
      const serializedData = JSON.stringify(data);
      const seconds = ttl || this.options.ttl;
      
      if (seconds > 0) {
        await this.client.set(fullKey, serializedData, 'EX', seconds);
      } else {
        await this.client.set(fullKey, serializedData);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error setting key ${key} in Redis cache:`, error);
      return false;
    }
  }
  
  /**
   * Delete a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async del(key) {
    if (!this.client) {
      await this.initialize();
    }
    
    try {
      const fullKey = this._getFullKey(key);
      const result = await this.client.del(fullKey);
      return result > 0;
    } catch (error) {
      logger.error(`Error deleting key ${key} from Redis cache:`, error);
      return false;
    }
  }
  
  /**
   * Clear cache by pattern
   * @param {string} pattern - Key pattern to match
   * @returns {Promise<number>} - Number of keys deleted
   */
  async clear(pattern) {
    if (!this.client) {
      await this.initialize();
    }
    
    try {
      // Add prefix to pattern
      const fullPattern = this._getFullKey(pattern);
      
      // Use SCAN to find keys matching pattern
      let cursor = '0';
      let keysToDelete = [];
      
      do {
        // SCAN returns [cursor, keys] array
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          fullPattern,
          'COUNT',
          100
        );
        
        cursor = nextCursor;
        
        if (keys.length > 0) {
          keysToDelete = keysToDelete.concat(keys);
        }
      } while (cursor !== '0');
      
      if (keysToDelete.length === 0) {
        return 0;
      }
      
      // Delete all matched keys
      const result = await this.client.del(keysToDelete);
      return result;
    } catch (error) {
      logger.error(`Error clearing pattern ${pattern} from Redis cache:`, error);
      return 0;
    }
  }
  
  /**
   * Close the provider
   * @returns {Promise<void>}
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Promise<Object>} - Cache statistics
   */
  async getStats() {
    if (!this.client) {
      await this.initialize();
    }
    
    try {
      const info = await this.client.info('memory');
      const keyspace = await this.client.info('keyspace');
      
      // Parse Redis INFO command output
      const parseInfo = (infoStr) => {
        const result = {};
        infoStr.split('\r\n').forEach(line => {
          if (line && !line.startsWith('#')) {
            const [key, value] = line.split(':');
            if (key && value) {
              result[key] = value;
            }
          }
        });
        return result;
      };
      
      const memoryInfo = parseInfo(info);
      const keyspaceInfo = parseInfo(keyspace);
      
      // Get keys count with our prefix
      const pattern = this._getFullKey('*');
      const keysCount = await this.client.keys(pattern).then(keys => keys.length);
      
      return {
        usedMemory: parseInt(memoryInfo['used_memory'] || 0),
        maxMemory: parseInt(memoryInfo['maxmemory'] || 0),
        totalKeys: keysCount,
        evictedKeys: parseInt(memoryInfo['evicted_keys'] || 0),
        expiredKeys: parseInt(memoryInfo['expired_keys'] || 0)
      };
    } catch (error) {
      logger.error('Error getting Redis cache stats:', error);
      return {
        usedMemory: 0,
        maxMemory: 0,
        totalKeys: 0,
        evictedKeys: 0,
        expiredKeys: 0
      };
    }
  }
  
  /**
   * Check if a provider supports a feature
   * @param {string} feature - Feature name
   * @returns {boolean} - True if feature is supported
   */
  supportsFeature(feature) {
    const supportedFeatures = ['stats', 'clear', 'distributed'];
    return supportedFeatures.includes(feature);
  }
  
  /**
   * Get full key with prefix
   * @param {string} key - Original key
   * @returns {string} - Full key with prefix
   * @private
   */
  _getFullKey(key) {
    return `${this.options.keyPrefix}${key}`;
  }
}

module.exports = RedisCacheProvider; 