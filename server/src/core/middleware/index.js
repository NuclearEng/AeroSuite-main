/**
 * middleware/index.js
 * 
 * Export all middleware
 */

const errorHandler = require('./errorHandler');
const requestId = require('./requestId');
const circuitBreaker = require('./CircuitBreakerMiddleware');
const requestContext = require('./RequestContextMiddleware');

module.exports = {
  errorHandler,
  requestId,
  circuitBreaker,
  requestContext
}; 