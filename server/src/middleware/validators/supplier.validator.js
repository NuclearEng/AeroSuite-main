/**
 * Supplier validation middleware
 * Validates supplier-related requests
 */
const { body, param, query } = require('express-validator');
const { validate } = require('../validate');

// Validate supplier creation
exports.createSupplierValidator = [
  body('name')
    .notEmpty().withMessage('Supplier name is required')
    .isString().withMessage('Supplier name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('contactPhone')
    .optional()
    .isMobilePhone().withMessage('Must be a valid phone number'),
  
  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),
  
  body('address.street')
    .optional()
    .isString().withMessage('Street must be a string'),
  
  body('address.city')
    .optional()
    .isString().withMessage('City must be a string'),
  
  body('address.state')
    .optional()
    .isString().withMessage('State must be a string'),
  
  body('address.zipCode')
    .optional()
    .isString().withMessage('Zip code must be a string'),
  
  body('address.country')
    .optional()
    .isString().withMessage('Country must be a string'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'blocked'])
    .withMessage('Status must be one of: active, inactive, pending, blocked'),
  
  validate
];

// Validate supplier update
exports.updateSupplierValidator = [
  param('id')
    .isMongoId().withMessage('Invalid supplier ID format'),
  
  body('name')
    .optional()
    .isString().withMessage('Supplier name must be a string')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .optional()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('contactPhone')
    .optional()
    .isMobilePhone().withMessage('Must be a valid phone number'),
  
  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'blocked'])
    .withMessage('Status must be one of: active, inactive, pending, blocked'),
  
  validate
];

// Validate supplier ID in params
exports.supplierIdValidator = [
  param('id')
    .isMongoId().withMessage('Invalid supplier ID format'),
  
  validate
];

// Validate supplier list query parameters
exports.listSuppliersValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive', 'pending', 'blocked', 'all'])
    .withMessage('Status must be one of: active, inactive, pending, blocked, all'),
  
  query('sort')
    .optional()
    .isString().withMessage('Sort must be a string'),
  
  query('search')
    .optional()
    .isString().withMessage('Search must be a string'),
  
  validate
]; 