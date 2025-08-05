/**
 * CircuitBreakerMiddleware.js
 * 
 * Express middleware for applying circuit breakers to routes
 * Implements RF043 - Add circuit breakers for resilience
 */

const CircuitBreakerRegistry = require('../../infrastructure/CircuitBreakerRegistry');

/**
 * Create a circuit breaker middleware
 * @param {Object} options - Middleware options
 * @param {string} options.name - Name of the circuit breaker (default: route path)
 * @param {Object} options.circuitOptions - Circuit breaker options
 * @param {Function} options.fallbackHandler - Custom fallback handler function
 * @returns {Function} - Express middleware
 */
function circuitBreaker(options = {}) {
  return (req, res, next) => {
    const registry = CircuitBreakerRegistry.getInstance();
    const name = options.name || `${req.method}:${req.path}`;
    
    // Get or create circuit breaker
    const breaker = registry.getOrCreate(name, options.circuitOptions);
    
    // Define the function to execute
    const executeRequest = async () => {
      // Store the original send/json/end methods
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;
      
      // Create a promise that resolves when the response is sent
      const responsePromise = new Promise((resolve, reject) => {
        // Override send method
        res.send = function(body) {
          res.send = originalSend;
          res.json = originalJson;
          res.end = originalEnd;
          
          const result = originalSend.apply(res, arguments);
          resolve();
          return result;
        };
        
        // Override json method
        res.json = function(body) {
          res.send = originalSend;
          res.json = originalJson;
          res.end = originalEnd;
          
          const result = originalJson.apply(res, arguments);
          resolve();
          return result;
        };
        
        // Override end method
        res.end = function(chunk) {
          res.send = originalSend;
          res.json = originalJson;
          res.end = originalEnd;
          
          const result = originalEnd.apply(res, arguments);
          resolve();
          return result;
        };
        
        // Call next to continue to the actual route handler
        next();
      });
      
      // Wait for the response to be sent
      await responsePromise;
    };
    
    // Define the fallback function
    const fallback = (error) => {
      // Restore original methods if they were overridden
      if (res.send !== originalSend && originalSend) {
        res.send = originalSend;
      }
      
      if (res.json !== originalJson && originalJson) {
        res.json = originalJson;
      }
      
      if (res.end !== originalEnd && originalEnd) {
        res.end = originalEnd;
      }
      
      // Use custom fallback handler if provided
      if (typeof options.fallbackHandler === 'function') {
        return options.fallbackHandler(req, res, error);
      }
      
      // Default fallback behavior
      if (!res.headersSent) {
        res.status(503).json({
          error: 'Service Unavailable',
          message: 'The service is currently unavailable. Please try again later.',
          circuitBreaker: name
        });
      }
    };
    
    // Execute the request with circuit breaker protection
    breaker.execute(executeRequest)
      .catch(fallback);
  };
}

module.exports = circuitBreaker; 