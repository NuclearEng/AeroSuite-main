/**
 * RequestContextMiddleware.js
 * 
 * Middleware for injecting request context into services
 * Implements RF037 - Ensure all services are stateless
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware that creates and injects request context
 * @param {Object} options - Middleware options
 * @returns {Function} - Express middleware function
 */
function requestContextMiddleware(options = {}) {
  return (req, res, next) => {
    // Generate a unique request ID if not already present
    const requestId = req.headers['x-request-id'] || uuidv4();
    
    // Create request context
    const context = {
      requestId,
      userId: req.user ? req.user.id : null,
      sessionId: req.session ? req.session.id : null,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      startTime: Date.now(),
      path: req.path,
      method: req.method
    };
    
    // Attach context to request object
    req.context = context;
    
    // Add response header with request ID for traceability
    res.setHeader('X-Request-ID', requestId);
    
    // Continue to next middleware
    next();
  };
}

module.exports = requestContextMiddleware; 