/**
 * rate-limit.config.js
 * 
 * Centralized rate limiting configuration
 * Implements RF044 - Configure rate limiting
 */

// Environment-specific configurations
const environments = {
  development: {
    enabled: true,
    defaultLimit: 500,
    defaultWindow: 60 * 1000, // 1 minute
    trustProxy: true,
    skipSuccessfulRequests: true,
    headers: true
  },
  test: {
    enabled: false, // Disabled in test environment
    defaultLimit: 0,
    defaultWindow: 60 * 1000,
    trustProxy: false,
    skipSuccessfulRequests: true,
    headers: true
  },
  production: {
    enabled: true,
    defaultLimit: 100,
    defaultWindow: 60 * 1000, // 1 minute
    trustProxy: true,
    skipSuccessfulRequests: false,
    headers: true
  }
};

// Get current environment
const env = process.env.NODE_ENV || 'development';

// Base configuration
const baseConfig = {
  // Enable/disable rate limiting globally
  enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
  
  // Default limit and window for all limiters
  defaultLimit: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX || '100', 10),
  defaultWindow: parseInt(process.env.RATE_LIMIT_DEFAULT_WINDOW_MS || (60 * 1000).toString(), 10), // 1 minute
  
  // Trust proxy headers (X-Forwarded-For, etc.)
  trustProxy: process.env.RATE_LIMIT_TRUST_PROXY === 'true',
  
  // Skip rate limiting for successful requests (status < 400)
  skipSuccessfulRequests: process.env.RATE_LIMIT_SKIP_SUCCESSFUL === 'true',
  
  // Enable standard and legacy headers
  headers: process.env.RATE_LIMIT_HEADERS !== 'false',
  
  // Predefined rate limiters
  limiters: {
    // Standard API rate limiter (100 requests per minute)
    standard: {
      windowMs: parseInt(process.env.RATE_LIMIT_STANDARD_WINDOW_MS || (60 * 1000).toString(), 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_STANDARD_MAX || '100', 10), // 100 requests per window
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    },
    
    // Auth rate limiter (5 attempts per 15 minutes)
    auth: {
      windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS || (15 * 60 * 1000).toString(), 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '5', 10), // 5 requests per window
      message: 'Too many authentication attempts, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    },
    
    // Mutation rate limiter (20 requests per 5 minutes)
    mutation: {
      windowMs: parseInt(process.env.RATE_LIMIT_MUTATION_WINDOW_MS || (5 * 60 * 1000).toString(), 10), // 5 minutes
      max: parseInt(process.env.RATE_LIMIT_MUTATION_MAX || '20', 10), // 20 requests per window
      message: 'Too many operations, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    },
    
    // Public API rate limiter (120 requests per minute)
    public: {
      windowMs: parseInt(process.env.RATE_LIMIT_PUBLIC_WINDOW_MS || (60 * 1000).toString(), 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || '120', 10), // 120 requests per window
      message: 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    },
    
    // Admin API rate limiter (60 requests per minute)
    admin: {
      windowMs: parseInt(process.env.RATE_LIMIT_ADMIN_WINDOW_MS || (60 * 1000).toString(), 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || '60', 10), // 60 requests per window
      message: 'Too many admin requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    },
    
    // API key rate limiter (300 requests per minute)
    apiKey: {
      windowMs: parseInt(process.env.RATE_LIMIT_API_KEY_WINDOW_MS || (60 * 1000).toString(), 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_API_KEY_MAX || '300', 10), // 300 requests per window
      message: 'API rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    },
    
    // Webhook rate limiter (60 requests per minute)
    webhook: {
      windowMs: parseInt(process.env.RATE_LIMIT_WEBHOOK_WINDOW_MS || (60 * 1000).toString(), 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_WEBHOOK_MAX || '60', 10), // 60 requests per window
      message: 'Webhook rate limit exceeded, please try again later',
      standardHeaders: true,
      legacyHeaders: false
    }
  }
};

// Merge environment-specific settings with base config
const config = {
  ...baseConfig,
  ...(environments[env] || {})
};

module.exports = config; 