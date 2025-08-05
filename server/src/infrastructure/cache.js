/**
 * cache.js
 * 
 * Redis-based caching module
 */

const Redis = require('ioredis');
const logger = require('./logger');

// Default configuration
const defaultConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB) || 0,
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'aerosuite:',
  enableOfflineQueue: false,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Redis client instance
let client = null;

/**
 * Initialize Redis client
 * @param {Object} config - Redis configuration
 * @returns {Object} - Redis client
 */
function initialize(config = {}) {
  if (client) {
    return client;
  }
  
  const redisConfig = { ...defaultConfig, ...config };
  
  client = new Redis(redisConfig);
  
  // Handle connection events
  client.on('connect', () => {
    logger.info('Redis client connected');
  });
  
  client.on('error', (error) => {
    logger.error('Redis client error:', error);
  });
  
  client.on('close', () => {
    logger.info('Redis client connection closed');
  });
  
  client.on('reconnecting', () => {
    logger.info('Redis client reconnecting');
  });
  
  return client;
}

/**
 * Get Redis client
 * @returns {Object} - Redis client
 */
function getClient() {
  if (!client) {
    throw new Error('Redis client not initialized');
  }
  
  return client;
}

/**
 * Close Redis connection
 * @returns {Promise} - Promise that resolves when connection is closed
 */
function close() {
  if (!client) {
    return Promise.resolve();
  }
  
  return client.quit().then(() => {
    client = null;
    logger.info('Redis connection closed');
  });
}

/**
 * Set a cache value
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise} - Promise that resolves when value is set
 */
async function set(key, value, ttl = 3600) {
  try {
    const serializedValue = JSON.stringify(value);
    
    if (ttl > 0) {
      await client.set(key, serializedValue, 'EX', ttl);
    } else {
      await client.set(key, serializedValue);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error setting cache key ${key}:`, error);
    return false;
  }
}

/**
 * Get a cache value
 * @param {string} key - Cache key
 * @returns {Promise} - Promise that resolves with the cached value
 */
async function get(key) {
  try {
    const value = await client.get(key);
    
    if (!value) {
      return null;
    }
    
    return JSON.parse(value);
  } catch (error) {
    logger.error(`Error getting cache key ${key}:`, error);
    return null;
  }
}

/**
 * Delete a cache value
 * @param {string} key - Cache key
 * @returns {Promise} - Promise that resolves when value is deleted
 */
async function del(key) {
  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error(`Error deleting cache key ${key}:`, error);
    return false;
  }
}

/**
 * Clear cache by pattern
 * @param {string} pattern - Key pattern to match
 * @returns {Promise} - Promise that resolves when keys are deleted
 */
async function clearByPattern(pattern) {
  try {
    const keys = await client.keys(pattern);
    
    if (keys.length === 0) {
      return 0;
    }
    
    await client.del(keys);
    return keys.length;
  } catch (error) {
    logger.error(`Error clearing cache by pattern ${pattern}:`, error);
    return 0;
  }
}

/**
 * Cache function result
 * @param {Function} fn - Function to cache
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise} - Promise that resolves with the function result
 */
async function cacheResult(fn, key, ttl = 3600) {
  try {
    // Try to get from cache first
    const cached = await get(key);
    
    if (cached !== null) {
      return cached;
    }
    
    // Execute function and cache result
    const result = await fn();
    await set(key, result, ttl);
    
    return result;
  } catch (error) {
    logger.error(`Error caching result for key ${key}:`, error);
    // If cache fails, just execute the function
    return fn();
  }
}

module.exports = {
  initialize,
  getClient,
  close,
  set,
  get,
  del,
  clearByPattern,
  cacheResult
}; 