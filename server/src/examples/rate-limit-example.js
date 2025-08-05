/**
 * rate-limit-example.js
 * 
 * Example usage of rate limiting middleware
 * Implements RF044 - Configure rate limiting
 */

const express = require('express');
const { rateLimiter, rateLimitMonitoring } = require('../middleware');

// Create Express app
const app = express();

// Apply standard rate limiter to all routes
app.use(rateLimiter.standardLimiter);

// Apply rate limit monitoring to all routes
app.use(rateLimitMonitoring.monitorRateLimit({ limiterName: 'standard' }));

// Example 1: Basic route with default rate limiting
app.get('/api/example', (req, res) => {
  res.json({ message: 'This route uses the standard rate limiter' });
});

// Example 2: Authentication route with stricter rate limiting
app.post('/api/auth/login',
  rateLimiter.authLimiter,
  rateLimitMonitoring.monitorRateLimit({ limiterName: 'auth' }),
  (req, res) => {
    res.json({ message: 'This route uses the auth rate limiter (5 requests per 15 minutes)' });
  }
);

// Example 3: Public API with relaxed rate limiting
app.get('/api/public',
  rateLimiter.publicLimiter,
  rateLimitMonitoring.monitorRateLimit({ limiterName: 'public' }),
  (req, res) => {
    res.json({ message: 'This route uses the public rate limiter (120 requests per minute)' });
  }
);

// Example 4: Admin route with moderate rate limiting
app.post('/api/admin',
  rateLimiter.adminLimiter,
  rateLimitMonitoring.monitorRateLimit({ limiterName: 'admin' }),
  (req, res) => {
    res.json({ message: 'This route uses the admin rate limiter (60 requests per minute)' });
  }
);

// Example 5: Dynamic rate limiting based on user role
app.get('/api/dynamic',
  rateLimiter.createDynamicRateLimiter({
    getLimiterKey: (req) => req.query.role || 'default',
    limiters: {
      admin: {
        windowMs: 60 * 1000, // 1 minute
        max: 100, // 100 requests per minute
        message: 'Admin rate limit exceeded'
      },
      user: {
        windowMs: 60 * 1000, // 1 minute
        max: 30, // 30 requests per minute
        message: 'User rate limit exceeded'
      },
      default: {
        windowMs: 60 * 1000, // 1 minute
        max: 10, // 10 requests per minute
        message: 'Guest rate limit exceeded'
      }
    }
  }),
  rateLimitMonitoring.monitorRateLimit({ limiterName: 'dynamic' }),
  (req, res) => {
    const role = req.query.role || 'guest';
    res.json({ message: `This route uses dynamic rate limiting based on role: ${role}` });
  }
);

// Example 6: Method-based rate limiting
app.all('/api/method',
  rateLimiter.createMethodRateLimiter({
    GET: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 GET requests per minute
      message: 'GET rate limit exceeded'
    },
    POST: {
      windowMs: 60 * 1000, // 1 minute
      max: 20, // 20 POST requests per minute
      message: 'POST rate limit exceeded'
    },
    PUT: {
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 PUT requests per minute
      message: 'PUT rate limit exceeded'
    },
    DELETE: {
      windowMs: 60 * 1000, // 1 minute
      max: 5, // 5 DELETE requests per minute
      message: 'DELETE rate limit exceeded'
    },
    DEFAULT: {
      windowMs: 60 * 1000, // 1 minute
      max: 5, // 5 requests per minute for other methods
      message: 'Method rate limit exceeded'
    }
  }),
  rateLimitMonitoring.monitorRateLimit({ limiterName: 'method' }),
  (req, res) => {
    res.json({ message: `This route uses method-based rate limiting for ${req.method}` });
  }
);

// Example 7: Custom rate limiter
app.get('/api/custom',
  rateLimiter.createRateLimiter({
    windowMs: 30 * 1000, // 30 seconds
    max: 5, // 5 requests per 30 seconds
    message: 'Custom rate limit exceeded',
    keyGenerator: (req) => {
      // Use a custom identifier (e.g., API key from query)
      return req.query.apiKey || req.ip;
    }
  }),
  rateLimitMonitoring.monitorRateLimit({ limiterName: 'custom' }),
  (req, res) => {
    res.json({ message: 'This route uses a custom rate limiter (5 requests per 30 seconds)' });
  }
);

// Rate limit status endpoint
app.get('/rate-limit-status', (req, res) => {
  // Get rate limit headers from previous request
  const limit = req.get('X-RateLimit-Limit');
  const remaining = req.get('X-RateLimit-Remaining');
  const reset = req.get('X-RateLimit-Reset');
  
  res.json({
    ip: req.ip,
    rateLimit: {
      limit,
      remaining,
      reset,
      resetDate: reset ? new Date(reset * 1000).toISOString() : null
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Rate limiting example running on port ${PORT}`);
  console.log(`Try accessing these endpoints multiple times to see rate limiting in action:`);
  console.log(`- http://localhost:${PORT}/api/example (standard: 100 requests per minute)`);
  console.log(`- http://localhost:${PORT}/api/auth/login (auth: 5 requests per 15 minutes)`);
  console.log(`- http://localhost:${PORT}/api/public (public: 120 requests per minute)`);
  console.log(`- http://localhost:${PORT}/api/admin (admin: 60 requests per minute)`);
  console.log(`- http://localhost:${PORT}/api/dynamic?role=admin|user|guest (dynamic rate limiting)`);
  console.log(`- http://localhost:${PORT}/api/method (different limits for GET, POST, PUT, DELETE)`);
  console.log(`- http://localhost:${PORT}/api/custom (custom: 5 requests per 30 seconds)`);
  console.log(`- http://localhost:${PORT}/rate-limit-status (check your current rate limit status)`);
});

module.exports = app; // Export for testing 