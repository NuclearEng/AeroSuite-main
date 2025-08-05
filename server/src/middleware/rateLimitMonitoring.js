/**
 * rateLimitMonitoring.js
 * 
 * Middleware for monitoring rate limit usage
 * Implements RF044 - Configure rate limiting
 */

const logger = require('../infrastructure/logger');
let promClient;

try {
  promClient = require('prom-client');
} catch (error) {
  logger.warn('prom-client not available, rate limit metrics will not be exported to Prometheus');
}

// Initialize metrics if Prometheus client is available
let rateLimitCounter;
let rateLimitedCounter;
let rateLimitRemainingGauge;

if (promClient) {
  // Counter for rate limit hits
  rateLimitCounter = new promClient.Counter({
    name: 'rate_limit_hits_total',
    help: 'Total number of requests that count against rate limits',
    labelNames: ['path', 'method', 'status', 'limiter']
  });

  // Counter for rate limited requests
  rateLimitedCounter = new promClient.Counter({
    name: 'rate_limited_requests_total',
    help: 'Total number of requests that were rate limited',
    labelNames: ['path', 'method', 'limiter', 'ip']
  });

  // Gauge for remaining rate limit
  rateLimitRemainingGauge = new promClient.Gauge({
    name: 'rate_limit_remaining',
    help: 'Remaining requests before hitting rate limit',
    labelNames: ['path', 'method', 'limiter']
  });
}

/**
 * Middleware to monitor rate limit usage
 * 
 * @param {Object} options - Monitoring options
 * @param {string} options.limiterName - Name of the rate limiter
 * @returns {Function} Express middleware
 */
function monitorRateLimit(options = {}) {
  const limiterName = options.limiterName || 'default';

  return (req, res, next) => {
    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture rate limit headers
    res.end = function(chunk, encoding) {
      // Restore original end function
      res.end = originalEnd;

      // Get rate limit headers
      const limit = res.getHeader('X-RateLimit-Limit');
      const remaining = res.getHeader('X-RateLimit-Remaining');
      const reset = res.getHeader('X-RateLimit-Reset');

      // If rate limit headers are present, log and record metrics
      if (limit !== undefined && remaining !== undefined) {
        // Normalize path for metrics
        const path = req.route ? req.route.path : req.path;
        const normalizedPath = path.replace(/\/:[^/]+/g, '/:param');

        // Record metrics if Prometheus client is available
        if (promClient) {
          // Record rate limit hit
          rateLimitCounter.inc({
            path: normalizedPath,
            method: req.method,
            status: res.statusCode,
            limiter: limiterName
          });

          // Record remaining limit
          rateLimitRemainingGauge.set(
            {
              path: normalizedPath,
              method: req.method,
              limiter: limiterName
            },
            parseInt(remaining, 10) || 0
          );

          // If request was rate limited (status 429)
          if (res.statusCode === 429) {
            rateLimitedCounter.inc({
              path: normalizedPath,
              method: req.method,
              limiter: limiterName,
              ip: req.ip
            });

            // Log rate limited request
            logger.warn('Request rate limited', {
              path: req.path,
              method: req.method,
              ip: req.ip,
              userId: req.user?.id,
              limiter: limiterName,
              userAgent: req.headers['user-agent']
            });
          }
        }

        // Log rate limit usage for monitoring (only if close to limit)
        const remainingNum = parseInt(remaining, 10) || 0;
        const limitNum = parseInt(limit, 10) || 0;
        
        if (remainingNum <= limitNum * 0.1) { // Less than 10% remaining
          logger.info('Rate limit near threshold', {
            path: req.path,
            method: req.method,
            remaining: remainingNum,
            limit: limitNum,
            ip: req.ip,
            userId: req.user?.id,
            limiter: limiterName
          });
        }
      }

      // Call the original end function
      return originalEnd.apply(res, arguments);
    };

    next();
  };
}

/**
 * Get rate limit metrics for Prometheus
 * 
 * @returns {Object} Prometheus metrics
 */
function getRateLimitMetrics() {
  if (!promClient) {
    return null;
  }

  return {
    rateLimitCounter,
    rateLimitedCounter,
    rateLimitRemainingGauge
  };
}

module.exports = {
  monitorRateLimit,
  getRateLimitMetrics
}; 