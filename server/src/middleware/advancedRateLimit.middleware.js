const Redis = require('ioredis');
const { RateLimiterRedis, RateLimiterMemory } = require('rate-limiter-flexible');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

// Initialize Redis client for rate limiting
const redisClient = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1
    })
  : null;

// Rate limiter configurations
const rateLimitConfigs = {
  // Global rate limit
  global: {
    points: 1000, // Number of requests
    duration: 60, // Per minute
    blockDuration: 60 * 5, // Block for 5 minutes
  },
  
  // Authentication endpoints
  auth: {
    points: 5,
    duration: 60 * 15, // 15 minutes
    blockDuration: 60 * 30, // Block for 30 minutes
  },
  
  // Password reset
  passwordReset: {
    points: 3,
    duration: 60 * 60, // 1 hour
    blockDuration: 60 * 60 * 24, // Block for 24 hours
  },
  
  // API endpoints for authenticated users
  api: {
    points: 100,
    duration: 60, // Per minute
    blockDuration: 60 * 5,
  },
  
  // File uploads
  fileUpload: {
    points: 10,
    duration: 60 * 5, // 5 minutes
    blockDuration: 60 * 15,
  },
  
  // Data export
  export: {
    points: 5,
    duration: 60 * 60, // 1 hour
    blockDuration: 60 * 60,
  },
  
  // Webhook endpoints
  webhook: {
    points: 50,
    duration: 60,
    blockDuration: 60 * 10,
  }
};

// Create rate limiters
const rateLimiters = {};

// Initialize rate limiters
Object.entries(rateLimitConfigs).forEach(([name, config]) => {
  if (redisClient) {
    rateLimiters[name] = new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix: `rl:${name}:`,
      ...config,
      execEvenly: true, // Spread requests evenly
    });
  } else {
    // Fallback to memory store
    rateLimiters[name] = new RateLimiterMemory({
      keyPrefix: `rl:${name}:`,
      ...config,
      execEvenly: true,
    });
  }
});

/**
 * Get identifier for rate limiting
 * @param {Object} req - Express request
 * @param {Object} options - Options
 * @returns {string} Identifier
 */
function getRateLimitKey(req, options = {}) {
  const { 
    byUser = true, 
    byIP = true, 
    byApiKey = false,
    custom = null 
  } = options;
  
  const parts = [];
  
  if (byUser && req.user) {
    parts.push(`user:${req.user.id}`);
  }
  
  if (byIP) {
    const ip = req.ip || req.connection.remoteAddress;
    parts.push(`ip:${ip}`);
  }
  
  if (byApiKey && req.headers['x-api-key']) {
    const hashedKey = crypto
      .createHash('sha256')
      .update(req.headers['x-api-key'])
      .digest('hex')
      .substring(0, 16);
    parts.push(`api:${hashedKey}`);
  }
  
  if (custom) {
    parts.push(custom);
  }
  
  return parts.join(':') || 'anonymous';
}

/**
 * Create rate limit middleware
 * @param {string} limiterName - Name of the rate limiter to use
 * @param {Object} options - Additional options
 * @returns {Function} Express middleware
 */
function createRateLimitMiddleware(limiterName, options = {}) {
  const limiter = rateLimiters[limiterName] || rateLimiters.global;
  
  return async (req, res, next) => {
    try {
      const key = getRateLimitKey(req, options);
      
      // Consume a point
      const rateLimitRes = await limiter.consume(key, options.points || 1);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': rateLimitRes.remainingPoints || 0,
        'X-RateLimit-Reset': new Date(Date.now() + rateLimitRes.msBeforeNext).toISOString(),
        'X-RateLimit-Retry-After': rateLimitRes.msBeforeNext 
          ? Math.round(rateLimitRes.msBeforeNext / 1000)
          : 0
      });
      
      next();
    } catch (rejRes) {
      // Rate limit exceeded
      const retryAfter = Math.round(rejRes.msBeforeNext / 1000) || 60;
      
      res.set({
        'X-RateLimit-Limit': limiter.points,
        'X-RateLimit-Remaining': rejRes.remainingPoints || 0,
        'X-RateLimit-Reset': new Date(Date.now() + rejRes.msBeforeNext).toISOString(),
        'Retry-After': retryAfter
      });
      
      logger.warn('Rate limit exceeded', {
        limiter: limiterName,
        key: getRateLimitKey(req, options),
        ip: req.ip,
        user: req.user?.id,
        path: req.path
      });
      
      return next(new AppError('Too many requests, please try again later', 429));
    }
  };
}

/**
 * Dynamic rate limiting based on user behavior
 */
class DynamicRateLimiter {
  constructor() {
    this.userScores = new Map();
    this.suspiciousPatterns = [
      /\.(php|asp|aspx|jsp|cgi)$/i, // Suspicious file extensions
      /\.\./g, // Path traversal attempts
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection attempts
      /etc\/passwd/i, // System file access
    ];
  }
  
  /**
   * Calculate risk score for request
   * @param {Object} req - Express request
   * @returns {number} Risk score (0-100)
   */
  calculateRiskScore(req) {
    let score = 0;
    
    // Check URL patterns
    const url = req.originalUrl || req.url;
    this.suspiciousPatterns.forEach(pattern => {
      if (pattern.test(url)) {
        score += 20;
      }
    });
    
    // Check request body
    if (req.body) {
      const bodyStr = JSON.stringify(req.body);
      this.suspiciousPatterns.forEach(pattern => {
        if (pattern.test(bodyStr)) {
          score += 15;
        }
      });
    }
    
    // Check headers
    const suspiciousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
    suspiciousHeaders.forEach(header => {
      if (req.headers[header]) {
        score += 10;
      }
    });
    
    // Check user agent
    const ua = req.headers['user-agent'] || '';
    if (!ua || ua.length < 10 || /bot|crawler|spider/i.test(ua)) {
      score += 10;
    }
    
    // Check referer
    if (!req.headers.referer && req.method !== 'GET') {
      score += 5;
    }
    
    return Math.min(score, 100);
  }
  
  /**
   * Get dynamic rate limit based on risk score
   * @param {Object} req - Express request
   * @param {Object} baseConfig - Base rate limit config
   * @returns {Object} Adjusted config
   */
  getDynamicLimit(req, baseConfig) {
    const riskScore = this.calculateRiskScore(req);
    const key = getRateLimitKey(req);
    
    // Track user scores
    const userScore = this.userScores.get(key) || { total: 0, count: 0 };
    userScore.total += riskScore;
    userScore.count += 1;
    this.userScores.set(key, userScore);
    
    const avgScore = userScore.total / userScore.count;
    
    // Adjust limits based on risk
    let multiplier = 1;
    if (avgScore > 70) {
      multiplier = 0.1; // 90% reduction for high risk
    } else if (avgScore > 50) {
      multiplier = 0.3; // 70% reduction for medium risk
    } else if (avgScore > 30) {
      multiplier = 0.5; // 50% reduction for low risk
    }
    
    return {
      points: Math.max(1, Math.floor(baseConfig.points * multiplier)),
      duration: baseConfig.duration,
      blockDuration: baseConfig.blockDuration * (avgScore > 50 ? 2 : 1)
    };
  }
}

const dynamicRateLimiter = new DynamicRateLimiter();

/**
 * Progressive delay middleware for failed attempts
 */
function progressiveDelay(prefix = 'delay') {
  const attempts = new Map();
  
  return async (req, res, next) => {
    const key = `${prefix}:${getRateLimitKey(req)}`;
    const attemptCount = attempts.get(key) || 0;
    
    if (attemptCount > 0) {
      // Calculate delay: 2^attempts * 1000ms, max 30 seconds
      const delay = Math.min(Math.pow(2, attemptCount) * 1000, 30000);
      
      logger.info('Applying progressive delay', {
        key,
        attempts: attemptCount,
        delay
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    // Track the attempt
    res.on('finish', () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        attempts.set(key, attemptCount + 1);
        
        // Clean up after 1 hour
        setTimeout(() => attempts.delete(key), 60 * 60 * 1000);
      } else if (res.statusCode < 400) {
        // Reset on success
        attempts.delete(key);
      }
    });
    
    next();
  };
}

/**
 * Rate limit by endpoint pattern
 */
function endpointRateLimit() {
  const endpointLimiters = new Map();
  
  return async (req, res, next) => {
    const endpoint = `${req.method}:${req.route?.path || req.path}`;
    
    // Get or create limiter for this endpoint
    if (!endpointLimiters.has(endpoint)) {
      const config = {
        points: 50, // Default
        duration: 60,
        blockDuration: 60 * 5
      };
      
      // Adjust based on endpoint
      if (endpoint.includes('auth') || endpoint.includes('login')) {
        config.points = 5;
        config.duration = 60 * 15;
      } else if (endpoint.includes('upload')) {
        config.points = 10;
        config.duration = 60 * 5;
      } else if (req.method === 'GET') {
        config.points = 100;
      } else if (req.method === 'POST' || req.method === 'PUT') {
        config.points = 30;
      }
      
      const limiter = redisClient
        ? new RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: `rl:endpoint:${endpoint}:`,
            ...config
          })
        : new RateLimiterMemory({
            keyPrefix: `rl:endpoint:${endpoint}:`,
            ...config
          });
      
      endpointLimiters.set(endpoint, limiter);
    }
    
    const limiter = endpointLimiters.get(endpoint);
    const key = getRateLimitKey(req);
    
    try {
      await limiter.consume(key);
      next();
    } catch (rejRes) {
      return next(new AppError('Endpoint rate limit exceeded', 429));
    }
  };
}

// Export middleware creators
module.exports = {
  // Basic rate limiters
  globalRateLimit: createRateLimitMiddleware('global'),
  authRateLimit: createRateLimitMiddleware('auth'),
  apiRateLimit: createRateLimitMiddleware('api'),
  fileUploadRateLimit: createRateLimitMiddleware('fileUpload'),
  exportRateLimit: createRateLimitMiddleware('export'),
  
  // Advanced rate limiters
  dynamicRateLimit: (limiterName = 'api') => {
    return async (req, res, next) => {
      const baseConfig = rateLimitConfigs[limiterName];
      const dynamicConfig = dynamicRateLimiter.getDynamicLimit(req, baseConfig);
      
      const limiter = redisClient
        ? new RateLimiterRedis({
            storeClient: redisClient,
            keyPrefix: `rl:dynamic:${limiterName}:`,
            ...dynamicConfig
          })
        : new RateLimiterMemory({
            keyPrefix: `rl:dynamic:${limiterName}:`,
            ...dynamicConfig
          });
      
      try {
        const key = getRateLimitKey(req);
        await limiter.consume(key);
        next();
      } catch (rejRes) {
        return next(new AppError('Dynamic rate limit exceeded', 429));
      }
    };
  },
  
  // Utility functions
  progressiveDelay,
  endpointRateLimit,
  createRateLimitMiddleware,
  
  // Reset rate limit for a key
  resetRateLimit: async (limiterName, key) => {
    const limiter = rateLimiters[limiterName];
    if (limiter) {
      await limiter.delete(key);
    }
  },
  
  // Get rate limit status
  getRateLimitStatus: async (limiterName, key) => {
    const limiter = rateLimiters[limiterName];
    if (limiter) {
      return await limiter.get(key);
    }
    return null;
  }
};