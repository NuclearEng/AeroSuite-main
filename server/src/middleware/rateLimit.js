/**
 * Rate limiting middleware
 * Provides different rate limits for different types of routes
 */
const rateLimit = require('express-rate-limit');

/**
 * Standard API rate limit (60 requests per minute)
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

/**
 * More restrictive auth rate limit (5 attempts per 15 minutes)
 * Use for login, registration, password reset
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Medium restrictive rate limit for sensitive operations
 * Use for operations like creating/updating records
 */
const mutationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many operations, please try again later',
    code: 'MUTATION_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Relaxed rate limit for public APIs
 */
const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  mutationLimiter,
  publicApiLimiter
}; 