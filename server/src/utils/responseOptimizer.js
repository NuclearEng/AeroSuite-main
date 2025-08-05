/**
 * API Response Optimizer
 * 
 * This utility provides middleware and functions to optimize API response time
 * through various techniques including caching, data compression, and payload optimization.
 */

const Redis = require('redis');
const { promisify } = require('util');
const compression = require('compression');
const zlib = require('zlib');

// Configuration defaults
const DEFAULT_CONFIG = {
  cache: {
    enabled: process.env.ENABLE_API_CACHE === 'true',
    ttl: parseInt(process.env.API_CACHE_TTL || 300), // 5 minutes in seconds
    maxSize: parseInt(process.env.API_CACHE_MAX_SIZE || 1000), // Max number of items in cache
  },
  compression: {
    enabled: true,
    level: zlib.constants.Z_BEST_SPEED, // Fastest compression
    threshold: 1024, // Only compress responses larger than 1KB
  },
  optimization: {
    transformResponse: true, // Transform response to reduce payload size
    enableETag: true, // Enable ETag for conditional requests
  }
};

// In-memory cache when Redis is not available
const memoryCache = new Map();

// Redis client initialization
let redisClient;
let redisGetAsync;
let redisSetAsync;
let redisDelAsync;

/**
 * Initialize the Redis client if enabled
 */
function initRedisClient() {
  if (!process.env.REDIS_URL) return null;
  
  try {
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL,
      retry_strategy: (options) => {
        if (options.error && (options.error.code === 'ECONNREFUSED' || options.error.code === 'NR_CLOSED')) {
          // End reconnecting on a specific error
          console.error('Redis connection failed, using in-memory cache');
          return false;
        }
        if (options.attempt > 10) {
          // End reconnecting after 10 attempts
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000); // Reconnect after growing time periods
      }
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis client error:', err);
    });
    
    redisGetAsync = promisify(redisClient.get).bind(redisClient);
    redisSetAsync = promisify(redisClient.set).bind(redisClient);
    redisDelAsync = promisify(redisClient.del).bind(redisClient);
    
    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
    return null;
  }
}

/**
 * Generate a cache key from request
 * @param {Object} req - Express request object
 * @returns {string} Cache key
 */
function generateCacheKey(req) {
  const path = req.originalUrl || req.url;
  const method = req.method;
  
  // For authenticated routes, include the user ID to prevent cache poisoning
  const userId = req.user ? req.user.id : 'anonymous';
  
  // For queries with body (POST/PUT), hash the body
  let bodyHash = '';
  if (req.body && Object.keys(req.body).length > 0) {
    bodyHash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify(req.body))
      .digest('hex');
  }
  
  return `api:${method}:${path}:${userId}${bodyHash ? ':' + bodyHash : ''}`;
}

/**
 * Cache middleware
 * @param {Object} options - Cache options
 * @returns {Function} Express middleware
 */
function cacheMiddleware(options = {}) {
  const config = { ...DEFAULT_CONFIG.cache, ...options };
  
  if (!config.enabled) {
    return (req, res, next) => next();
  }
  
  // Initialize Redis client if not already done
  if (!redisClient && process.env.REDIS_URL) {
    initRedisClient();
  }
  
  return async (req, res, next) => {
    // Skip caching for certain conditions
    if (
      req.method !== 'GET' || // Only cache GET requests
      req.headers['cache-control'] === 'no-cache' || // Honor client cache control
      req.path.includes('/auth/') // Don't cache auth routes
    ) {
      return next();
    }
    
    const cacheKey = generateCacheKey(req);
    
    try {
      // Try to get from cache
      let cachedResponse;
      
      if (redisClient) {
        // Try Redis first if available
        cachedResponse = await redisGetAsync(cacheKey);
      } else {
        // Fall back to memory cache
        cachedResponse = memoryCache.get(cacheKey);
      }
      
      if (cachedResponse) {
        // Parse the cached response
        const parsed = JSON.parse(cachedResponse);
        
        // Add cache hit header
        res.setHeader('X-Cache', 'HIT');
        
        // Send the cached response
        return res.status(parsed.statusCode).json(parsed.data);
      }
      
      // Cache miss, continue to the actual request handler
      res.setHeader('X-Cache', 'MISS');
      
      // Intercept the response to cache it
      const originalSend = res.send;
      res.send = function(body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseToCache = {
            statusCode: res.statusCode,
            data: JSON.parse(body), // Assuming JSON responses
            timestamp: Date.now()
          };
          
          const stringResponse = JSON.stringify(responseToCache);
          
          // Store in the appropriate cache
          if (redisClient) {
            redisSetAsync(cacheKey, stringResponse, 'EX', config.ttl)
              .catch(err => console.error('Redis cache set error:', err));
          } else {
            // Memory cache with LRU-like behavior (size limit check)
            if (memoryCache.size >= config.maxSize) {
              // Simple eviction strategy: remove oldest entry
              const oldestKey = memoryCache.keys().next().value;
              memoryCache.delete(oldestKey);
            }
            memoryCache.set(cacheKey, stringResponse);
            
            // Set TTL expiration in memory
            setTimeout(() => {
              memoryCache.delete(cacheKey);
            }, config.ttl * 1000);
          }
        }
        
        // Continue with the original send
        originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue with request even if caching fails
    }
  };
}

/**
 * Enhanced compression middleware
 * @param {Object} options - Compression options
 * @returns {Function} Express middleware
 */
function compressionMiddleware(options = {}) {
  const config = { ...DEFAULT_CONFIG.compression, ...options };
  
  if (!config.enabled) {
    return (req, res, next) => next();
  }
  
  return compression({
    level: config.level,
    threshold: config.threshold,
    filter: (req, res) => {
      // Skip compression for certain conditions
      if (req.headers['x-no-compression']) {
        return false;
      }
      // Skip compression for small responses that aren't worth compressing
      const contentLength = parseInt(res.getHeader('Content-Length'));
      if (contentLength && contentLength < config.threshold) {
        return false;
      }
      // Use default compression filter for other cases
      return compression.filter(req, res);
    }
  });
}

/**
 * Response transformation middleware to optimize payload size
 * @param {Object} options - Transformation options
 * @returns {Function} Express middleware
 */
function optimizeResponseMiddleware(options = {}) {
  const config = { ...DEFAULT_CONFIG.optimization, ...options };
  
  if (!config.transformResponse) {
    return (req, res, next) => next();
  }
  
  return (req, res, next) => {
    // Intercept JSON responses to optimize them
    const originalJson = res.json;
    
    res.json = function(obj) {
      // Apply payload optimization techniques
      const optimizedObj = optimizePayload(obj, req);
      
      // Continue with the original json method
      return originalJson.call(this, optimizedObj);
    };
    
    // Add ETag support for conditional requests
    if (config.enableETag) {
      const originalSend = res.send;
      
      res.send = function(body) {
        // Generate ETag based on the response body
        const etag = require('crypto')
          .createHash('md5')
          .update(typeof body === 'string' ? body : JSON.stringify(body))
          .digest('hex');
        
        // Set ETag header
        this.setHeader('ETag', `"${etag}"`);
        
        // Check if client sent If-None-Match header
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch === `"${etag}"`) {
          // Send 304 Not Modified
          return this.status(304).send();
        }
        
        // Continue with the original send
        return originalSend.call(this, body);
      };
    }
    
    next();
  };
}

/**
 * Optimize payload size by removing unnecessary data
 * @param {Object} data - Response data
 * @param {Object} req - Express request object
 * @returns {Object} Optimized data
 */
function optimizePayload(data, req) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // If data is an array, process each item
  if (Array.isArray(data)) {
    return data.map(item => optimizePayload(item, req));
  }
  
  // Create a new object with optimized properties
  const result = {};
  
  // Get fields specified in query parameter if any
  const fields = req.query.fields ? req.query.fields.split(',') : null;
  
  Object.keys(data).forEach(key => {
    // Skip fields that are not requested if fields param is provided
    if (fields && !fields.includes(key)) {
      return;
    }
    
    const value = data[key];
    
    // Handle nested objects recursively
    if (value && typeof value === 'object' && !Buffer.isBuffer(value)) {
      result[key] = optimizePayload(value, req);
    } else {
      result[key] = value;
    }
  });
  
  return result;
}

/**
 * Clear cache entries
 * @param {string|RegExp} pattern - Cache key or pattern to clear
 * @returns {Promise<number>} Number of entries cleared
 */
async function clearCache(pattern) {
  if (!pattern) {
    return 0;
  }
  
  try {
    if (redisClient) {
      // Use Redis SCAN to find keys matching the pattern
      const scanAsync = promisify(redisClient.scan).bind(redisClient);
      const [cursor, keys] = await scanAsync(0, 'MATCH', `api:${pattern}*`, 'COUNT', 1000);
      
      if (keys.length > 0) {
        await redisDelAsync(keys);
      }
      
      return keys.length;
    } else {
      // For memory cache, use regex matching
      const regex = new RegExp(pattern);
      let count = 0;
      
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
          count++;
        }
      }
      
      return count;
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    return 0;
  }
}

/**
 * Create optimized API middleware
 */
function createOptimizedApi(options = {}) {
  return [
    (req, res, next) => {
      // Mock implementation
      next();
    }
  ];
}

module.exports = {
  createOptimizedApi,
  cacheMiddleware,
  compressionMiddleware,
  optimizeResponseMiddleware,
  clearCache,
  initRedisClient
}; 