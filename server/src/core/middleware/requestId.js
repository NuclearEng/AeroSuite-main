/**
 * requestId.js
 * 
 * Middleware to add a unique ID to each request
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Add a unique ID to each request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function requestId(req, res, next) {
  // Generate a unique ID for the request
  const id = uuidv4();
  
  // Add the ID to the request object
  req.id = id;
  
  // Add the ID to the response headers
  res.setHeader('X-Request-ID', id);
  
  next();
}

module.exports = requestId; 