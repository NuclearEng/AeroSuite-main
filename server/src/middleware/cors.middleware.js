/**
 * CORS Middleware
 * 
 * This middleware configures Cross-Origin Resource Sharing (CORS) policies
 * to restrict access to trusted origins only.
 */

const cors = require('cors');
const config = require('../config');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

/**
 * Configure CORS middleware with proper security settings
 */
const configureCors = () => {
  // Get trusted origins from environment or config
  const trustedOrigins = config.corsOrigin 
    ? (Array.isArray(config.corsOrigin) ? config.corsOrigin : config.corsOrigin.split(',')) 
    : ['http://localhost:3000'];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
      if (!origin) return callback(null, true);
      
      // Check if origin is in trusted list
      if (trustedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log blocked CORS request
      logSecurityEvent(
        'CORS',
        SEC_EVENT_SEVERITY.WARNING,
        'Blocked CORS request from untrusted origin',
        { origin, trustedOrigins }
      );
      
      // Reject request with CORS error
      return callback(new Error('Not allowed by CORS policy'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    credentials: true,
    maxAge: 86400, // 24 hours in seconds - how long preflight requests can be cached
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
};

module.exports = configureCors; 