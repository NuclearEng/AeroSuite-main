/**
 * Validation Middleware
 * 
 * Provides request validation middleware functions
 */

const { validationResult } = require('express-validator');

/**
 * Validate request against express-validator rules
 * @returns {Function} - Express middleware
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Schema validation middleware
 */
const validateSchema = {
  /**
   * Validate request body against schema
   * @param {Array} rules - Express-validator rules
   * @returns {Array} - Express middleware
   */
  body: (rules) => {
    return [...rules, validate];
  },
  
  /**
   * Validate request params against schema
   * @param {Array} rules - Express-validator rules
   * @returns {Array} - Express middleware
   */
  params: (rules) => {
    return [...rules, validate];
  },
  
  /**
   * Validate request query against schema
   * @param {Array} rules - Express-validator rules
   * @returns {Array} - Express middleware
   */
  query: (rules) => {
    return [...rules, validate];
  }
};

module.exports = {
  validate,
  validateSchema
}; 