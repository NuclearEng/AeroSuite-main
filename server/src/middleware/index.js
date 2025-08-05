/**
 * middleware/index.js
 * 
 * Export all middleware modules
 */

const rateLimiter = require('./rateLimiter');
const rateLimitMonitoring = require('./rateLimitMonitoring');
const rateLimit = require('./rateLimit');
const apiSecurity = require('./api-security.middleware');
const tracingMiddleware = require('./tracingMiddleware');

module.exports = {
  // New rate limiting middleware (RF044)
  rateLimiter,
  rateLimitMonitoring,
  
  // Legacy rate limiting middleware
  rateLimit,
  
  // API security middleware
  apiSecurity,
  
  // Distributed tracing middleware (RF046)
  tracingMiddleware
}; 