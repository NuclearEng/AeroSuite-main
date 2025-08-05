/**
 * Query Cache Manager
 * 
 * This utility provides caching functionality for database query results.
 * It integrates with both Redis (preferred) and in-memory caching as fallback.
 * 
 * Task: TS296 - Query result caching
 */

const Redis = require('redis');
const { promisify } = require('util');
const crypto = require('crypto');
const mongoose = require('mongoose');
const logger = require('./logger');

// Configuration defaults
const DEFAULT_CONFIG = {
  enabled: process.env.ENABLE_QUERY_CACHE === 'true',
  ttl: parseInt(process.env.QUERY_CACHE_TTL || 300), // 5 minutes in seconds
  maxSize: parseInt(process.env.QUERY_CACHE_MAX_SIZE || 1000), // Max items in memory cache
  prefix: 'qcache:', // Cache key prefix
  redisUrl: process.env.REDIS_URL || null,
  debugMode: process.env.NODE_ENV === 'development'
};

// In-memory cache as fallback when Redis is not available
const memoryCache = new Map();
let memoryCacheTimestamps = new Map(); // For LRU implementation

// Redis client initialization
let redisClient;
let redisGetAsync;
let redisSetAsync;
let redisDelAsync;
let redisScanAsync;

// Cache stats for monitoring
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  errors: 0,
  evictions: 0,
  lastReset: new Date()
};

/**
 * Initialize the Redis client for caching
 * @returns {Object|null} Redis client or null if unavailable
 */
function initRedisClient() {
  if (!DEFAULT_CONFIG.redisUrl) return null;
  
  try {
    redisClient = Redis.createClient({
      url: DEFAULT_CONFIG.redisUrl,
      retry_strategy: (options) => {
        if (options.error && (options.error.code === 'ECONNREFUSED' || options.error.code === 'NR_CLOSED')) {
          logger.warn('Redis connection failed, using in-memory cache for query results');
          return false;
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis client error in query cache manager:', err);
    });
    
    // Promisify Redis methods
    redisGetAsync = promisify(redisClient.get).bind(redisClient);
    redisSetAsync = promisify(redisClient.set).bind(redisClient);
    redisDelAsync = promisify(redisClient.del).bind(redisClient);
    redisScanAsync = promisify(redisClient.scan).bind(redisClient);
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis client for query caching:', error);
    return null;
  }
}

/**
 * Generate a cache key for a query
 * @param {String} modelName - Name of the mongoose model
 * @param {String} operation - Query operation (find, findOne, etc.)
 * @param {Object} query - Query parameters
 * @param {Object} options - Query options
 * @returns {String} Cache key
 */
function generateCacheKey(modelName, operation, query, options = {}) {
  // Extract only the options that affect the query result
  const relevantOptions = {
    select: options.projection || options.select,
    sort: options.sort,
    skip: options.skip,
    limit: options.limit,
    populate: options.populate
  };
  
  // Create a string representation of the query and options
  const queryString = JSON.stringify({
    query,
    options: relevantOptions
  });
  
  // Create an MD5 hash of the query string
  const queryHash = crypto
    .createHash('md5')
    .update(queryString)
    .digest('hex');
  
  // Format: qcache:modelName:operation:hash
  return `${DEFAULT_CONFIG.prefix}${modelName}:${operation}:${queryHash}`;
}

/**
 * Get a cached query result
 * @param {String} cacheKey - Cache key
 * @returns {Promise<Object|null>} Cached result or null if not found
 */
async function getCachedResult(cacheKey) {
  if (!DEFAULT_CONFIG.enabled) return null;
  
  try {
    let cachedData;
    
    if (redisClient) {
      // Try Redis first
      cachedData = await redisGetAsync(cacheKey);
    } else {
      // Fall back to memory cache
      cachedData = memoryCache.get(cacheKey);
      
      // Update timestamp for LRU if found
      if (cachedData) {
        memoryCacheTimestamps.set(cacheKey, Date.now());
      }
    }
    
    if (cachedData) {
      // Parse the cached data
      const result = JSON.parse(cachedData);
      cacheStats.hits++;
      
      if (DEFAULT_CONFIG.debugMode) {
        logger.debug(`Query cache HIT: ${cacheKey}`);
      }
      
      return result;
    }
    
    cacheStats.misses++;
    return null;
  } catch (error) {
    logger.error(`Error retrieving cached query result: ${error.message}`);
    cacheStats.errors++;
    return null;
  }
}

/**
 * Store a query result in cache
 * @param {String} cacheKey - Cache key
 * @param {Object} result - Query result to cache
 * @param {Number} ttl - Time to live in seconds (optional)
 * @returns {Promise<Boolean>} Success indicator
 */
async function cacheQueryResult(cacheKey, result, ttl = DEFAULT_CONFIG.ttl) {
  if (!DEFAULT_CONFIG.enabled) return false;
  
  try {
    // Convert mongoose documents to plain objects if needed
    const dataToCache = JSON.stringify(result);
    
    if (redisClient) {
      // Use Redis
      await redisSetAsync(cacheKey, dataToCache, 'EX', ttl);
    } else {
      // Use memory cache with LRU eviction policy
      if (memoryCache.size >= DEFAULT_CONFIG.maxSize) {
        // Find the least recently used item
        let oldestKey = null;
        let oldestTime = Infinity;
        
        for (const [key, time] of memoryCacheTimestamps.entries()) {
          if (time < oldestTime) {
            oldestTime = time;
            oldestKey = key;
          }
        }
        
        if (oldestKey) {
          memoryCache.delete(oldestKey);
          memoryCacheTimestamps.delete(oldestKey);
          cacheStats.evictions++;
        }
      }
      
      // Store in memory cache
      memoryCache.set(cacheKey, dataToCache);
      memoryCacheTimestamps.set(cacheKey, Date.now());
      
      // Set expiration
      setTimeout(() => {
        memoryCache.delete(cacheKey);
        memoryCacheTimestamps.delete(cacheKey);
      }, ttl * 1000);
    }
    
    cacheStats.sets++;
    
    if (DEFAULT_CONFIG.debugMode) {
      logger.debug(`Query cache SET: ${cacheKey}`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error caching query result: ${error.message}`);
    cacheStats.errors++;
    return false;
  }
}

/**
 * Invalidate cache entries for a specific model
 * @param {String} modelName - Mongoose model name
 * @returns {Promise<Number>} Number of invalidated entries
 */
async function invalidateModelCache(modelName) {
  try {
    if (redisClient) {
      // Use Redis SCAN to find keys matching the pattern
      const pattern = `${DEFAULT_CONFIG.prefix}${modelName}:*`;
      let cursor = '0';
      let count = 0;
      
      do {
        const [nextCursor, keys] = await redisScanAsync(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await redisDelAsync(keys);
          count += keys.length;
        }
      } while (cursor !== '0');
      
      return count;
    } else {
      // For memory cache, iterate through keys
      const keysToDelete = [];
      const pattern = new RegExp(`^${DEFAULT_CONFIG.prefix}${modelName}:`);
      
      for (const key of memoryCache.keys()) {
        if (pattern.test(key)) {
          keysToDelete.push(key);
        }
      }
      
      // Delete matching keys
      keysToDelete.forEach(key => {
        memoryCache.delete(key);
        memoryCacheTimestamps.delete(key);
      });
      
      return keysToDelete.length;
    }
  } catch (error) {
    logger.error(`Error invalidating model cache: ${error.message}`);
    return 0;
  }
}

/**
 * Invalidate all query cache entries
 * @returns {Promise<Boolean>} Success indicator
 */
async function invalidateAllCache() {
  try {
    if (redisClient) {
      // Find all query cache keys
      const pattern = `${DEFAULT_CONFIG.prefix}*`;
      let cursor = '0';
      let count = 0;
      
      do {
        const [nextCursor, keys] = await redisScanAsync(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        
        if (keys.length > 0) {
          await redisDelAsync(keys);
          count += keys.length;
        }
      } while (cursor !== '0');
      
      logger.info(`Invalidated ${count} cached query results in Redis`);
    } else {
      // Clear memory cache
      const count = memoryCache.size;
      memoryCache.clear();
      memoryCacheTimestamps.clear();
      logger.info(`Invalidated ${count} cached query results in memory`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error invalidating all query cache: ${error.message}`);
    return false;
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    ...cacheStats,
    engine: redisClient ? 'Redis' : 'Memory',
    size: redisClient ? 'N/A' : memoryCache.size,
    maxSize: DEFAULT_CONFIG.maxSize,
    ttl: DEFAULT_CONFIG.ttl,
    enabled: DEFAULT_CONFIG.enabled,
    uptime: Math.floor((Date.now() - cacheStats.lastReset) / 1000)
  };
}

/**
 * Reset cache statistics
 */
function resetCacheStats() {
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.sets = 0;
  cacheStats.errors = 0;
  cacheStats.evictions = 0;
  cacheStats.lastReset = new Date();
}

// Initialize the Redis client if available
initRedisClient();

module.exports = {
  generateCacheKey,
  getCachedResult,
  cacheQueryResult,
  invalidateModelCache,
  invalidateAllCache,
  getCacheStats,
  resetCacheStats
}; 