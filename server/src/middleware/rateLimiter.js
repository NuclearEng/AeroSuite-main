/**
 * rateLimiter.js
 * 
 * Advanced rate limiting middleware with multiple strategies
 * Implements RF044 - Configure rate limiting
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { createClient } = require('redis');
const config = require('../config/rate-limit.config');
const logger = require('../infrastructure/logger');

// Initialize Redis client if available
let redisClient = null;
let redisStore = null;

if (process.env.RATE_LIMIT_REDIS_ENABLED === 'true') {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      password: process.env.REDIS_PASSWORD,
      database: parseInt(process.env.REDIS_RATE_LIMIT_DB || '1', 10)
    });

    redisClient.on('error', (err) => {
      logger.error('Redis rate limit client error:', err);
    });

    // Create Redis store for rate limiting
    redisStore = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: 'rl:'
    });

    logger.info('Redis store initialized for rate limiting');
  } catch (error) {
    logger.error('Failed to initialize Redis store for rate limiting:', error);
    logger.info('Falling back to memory store for rate limiting');
  }
}

/**
 * Create a rate limiter with the specified configuration
 * 
 * @param {string|Object} options - Rate limiter name from config or custom options
 * @returns {Function} Express middleware
 */
function createRateLimiter(options = {}) {
  // If rate limiting is disabled globally, return a pass-through middleware
  if (!config.enabled) {
    return (req, res, next) => next();
  }

  // If options is a string, use a predefined limiter from config
  if (typeof options === 'string') {
    if (config.limiters[options]) {
      options = config.limiters[options];
    } else {
      logger.warn(`Rate limiter "${options}" not found in config, using standard limiter`);
      options = config.limiters.standard;
    }
  }

  // Merge with default options
  const limiterConfig = {
    windowMs: config.defaultWindow,
    max: config.defaultLimit,
    standardHeaders: config.headers, // Send standard headers
    legacyHeaders: false, // Don't send legacy headers
    skipSuccessfulRequests: config.skipSuccessfulRequests,
    trustProxy: config.trustProxy,
    ...options,
    // Use Redis store if available, otherwise use memory store
    store: redisStore,
    // Custom key generator that can use different identifiers
    keyGenerator: options.keyGenerator || ((req) => {
      // Use user ID if available, otherwise IP
      return req.user?.id || req.ip || 
        (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
        req.connection.remoteAddress ||
        'unknown';
    }),
    // Custom handler for rate limit exceeded
    handler: (req, res, next) => {
      const retryAfter = Math.ceil(options.windowMs / 1000);
      
      // Log rate limit exceeded
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: req.user?.id,
        userAgent: req.headers['user-agent'],
        retryAfter
      });
      
      // Send response
      res.status(429).json({
        success: false,
        error: 'Rate Limit Exceeded',
        message: options.message || 'Too many requests, please try again later',
        retryAfter
      });
    }
  };

  return rateLimit(limiterConfig);
}

/**
 * Create a dynamic rate limiter based on user roles or other criteria
 * 
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware
 */
function createDynamicRateLimiter(options = {}) {
  const limiters = {};
  
  // Create a middleware that selects the appropriate limiter based on request
  return (req, res, next) => {
    // Skip if rate limiting is disabled
    if (!config.enabled) {
      return next();
    }
    
    // Determine which limiter to use based on user role or other criteria
    let limiterKey = 'default';
    
    if (options.getLimiterKey && typeof options.getLimiterKey === 'function') {
      limiterKey = options.getLimiterKey(req) || 'default';
    } else if (req.user && req.user.role) {
      limiterKey = req.user.role;
    }
    
    // Get limiter configuration for this key
    let limiterConfig = options.limiters?.[limiterKey] || options.defaultLimiter || config.limiters.standard;
    
    // Create limiter if it doesn't exist
    if (!limiters[limiterKey]) {
      limiters[limiterKey] = createRateLimiter(limiterConfig);
    }
    
    // Apply the selected limiter
    limiters[limiterKey](req, res, next);
  };
}

/**
 * Create a rate limiter that applies different limits to different HTTP methods
 * 
 * @param {Object} options - Configuration options with HTTP methods as keys
 * @returns {Function} Express middleware
 */
function createMethodRateLimiter(options = {}) {
  const methodLimiters = {};
  
  // Create limiters for each method
  Object.entries(options).forEach(([method, config]) => {
    if (typeof method === 'string' && method.toUpperCase() !== 'DEFAULT') {
      methodLimiters[method.toUpperCase()] = createRateLimiter(config);
    }
  });
  
  // Create default limiter
  const defaultLimiter = createRateLimiter(options.DEFAULT || config.limiters.standard);
  
  // Return middleware that selects limiter based on request method
  return (req, res, next) => {
    // Skip if rate limiting is disabled
    if (!config.enabled) {
      return next();
    }
    
    const method = req.method.toUpperCase();
    const limiter = methodLimiters[method] || defaultLimiter;
    
    limiter(req, res, next);
  };
}

// Create predefined limiters
const standardLimiter = createRateLimiter('standard');
const authLimiter = createRateLimiter('auth');
const mutationLimiter = createRateLimiter('mutation');
const publicLimiter = createRateLimiter('public');
const adminLimiter = createRateLimiter('admin');
const apiKeyLimiter = createRateLimiter('apiKey');
const webhookLimiter = createRateLimiter('webhook');

// Export the rate limiters
module.exports = {
  createRateLimiter,
  createDynamicRateLimiter,
  createMethodRateLimiter,
  standardLimiter,
  authLimiter,
  mutationLimiter,
  publicLimiter,
  adminLimiter,
  apiKeyLimiter,
  webhookLimiter
}; 