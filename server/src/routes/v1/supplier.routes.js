/**
 * Supplier routes
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const supplierController = require('../../domains/supplier/controllers/supplier.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const validationMiddleware = require('../../middleware/validation.middleware');
const rateLimitMiddleware = require('../../middleware/rate-limit.middleware');

// Import supplier import/export routes
const supplierImportExportRoutes = require('../../domains/supplier/routes/supplier-import-export.routes');

// Apply authentication middleware to all supplier routes
router.use(authMiddleware.authenticate);

// Mount import/export routes
router.use('/', supplierImportExportRoutes);

/**
 * @route GET /api/suppliers
 * @desc Get all suppliers with optional filtering
 * @access Private
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'inactive', 'pending', 'blacklisted']).withMessage('Invalid status'),
    query('type').optional().isString().withMessage('Type must be a string'),
    query('search').optional().isString().withMessage('Search term must be a string'),
    query('sortBy').optional().isString().withMessage('Sort field must be a string'),
    query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
    validationMiddleware.validate
  ],
  supplierController.getAllSuppliers
);

/**
 * @route GET /api/suppliers/:id
 * @desc Get a single supplier by ID
 * @access Private
 */
router.get(
  '/:id',
  [
    param('id').isString().withMessage('Supplier ID is required'),
    validationMiddleware.validate
  ],
  supplierController.getSupplierById
);

/**
 * @route POST /api/suppliers
 * @desc Create a new supplier
 * @access Private
 */
router.post(
  '/',
  [
    rateLimitMiddleware.createRateLimiter({ windowMs: 60 * 1000, max: 5 }), // 5 requests per minute
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('code').isString().notEmpty().withMessage('Code is required'),
    body('type').isString().notEmpty().withMessage('Type is required'),
    body('status').optional().isIn(['active', 'inactive', 'pending', 'blacklisted']).withMessage('Invalid status'),
    body('website').optional().isURL().withMessage('Website must be a valid URL'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('address').isObject().withMessage('Address is required'),
    body('address.street').isString().notEmpty().withMessage('Street is required'),
    body('address.city').isString().notEmpty().withMessage('City is required'),
    body('address.state').isString().notEmpty().withMessage('State is required'),
    body('address.zipCode').isString().notEmpty().withMessage('Zip code is required'),
    body('address.country').isString().notEmpty().withMessage('Country is required'),
    validationMiddleware.validate
  ],
  supplierController.createSupplier
);

/**
 * @route PUT /api/suppliers/:id
 * @desc Update a supplier
 * @access Private
 */
router.put(
  '/:id',
  [
    param('id').isString().withMessage('Supplier ID is required'),
    body('name').optional().isString().notEmpty().withMessage('Name is required'),
    body('code').optional().isString().notEmpty().withMessage('Code is required'),
    body('type').optional().isString().notEmpty().withMessage('Type is required'),
    body('status').optional().isIn(['active', 'inactive', 'pending', 'blacklisted']).withMessage('Invalid status'),
    body('website').optional().isURL().withMessage('Website must be a valid URL'),
    body('description').optional().isString().withMessage('Description must be a string'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('address').optional().isObject().withMessage('Address must be an object'),
    body('address.street').optional().isString().notEmpty().withMessage('Street is required'),
    body('address.city').optional().isString().notEmpty().withMessage('City is required'),
    body('address.state').optional().isString().notEmpty().withMessage('State is required'),
    body('address.zipCode').optional().isString().notEmpty().withMessage('Zip code is required'),
    body('address.country').optional().isString().notEmpty().withMessage('Country is required'),
    validationMiddleware.validate
  ],
  supplierController.updateSupplier
);

/**
 * @route DELETE /api/suppliers/:id
 * @desc Delete a supplier
 * @access Private (Admin only)
 */
router.delete(
  '/:id',
  [
    authMiddleware.authorize(['admin']),
    param('id').isString().withMessage('Supplier ID is required'),
    validationMiddleware.validate
  ],
  supplierController.deleteSupplier
);

/**
 * Contact routes
 */

/**
 * @route GET /api/suppliers/:id/contacts
 * @desc Get all contacts for a supplier
 * @access Private
 */
router.get(
  '/:id/contacts',
  [
    param('id').isString().withMessage('Supplier ID is required'),
    validationMiddleware.validate
  ],
  supplierController.getSupplierContacts
);

/**
 * @route POST /api/suppliers/:id/contacts
 * @desc Add a contact to a supplier
 * @access Private
 */
router.post(
  '/:id/contacts',
  [
    param('id').isString().withMessage('Supplier ID is required'),
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('title').isString().notEmpty().withMessage('Title is required'),
    body('email').isEmail().withMessage('Email must be valid'),
    body('phone').isString().notEmpty().withMessage('Phone is required'),
    body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
    validationMiddleware.validate
  ],
  supplierController.addSupplierContact
);

/**
 * @route PUT /api/suppliers/:supplierId/contacts/:contactId
 * @desc Update a supplier contact
 * @access Private
 */
router.put(
  '/:supplierId/contacts/:contactId',
  [
    param('supplierId').isString().withMessage('Supplier ID is required'),
    param('contactId').isString().withMessage('Contact ID is required'),
    body('name').optional().isString().notEmpty().withMessage('Name is required'),
    body('title').optional().isString().notEmpty().withMessage('Title is required'),
    body('email').optional().isEmail().withMessage('Email must be valid'),
    body('phone').optional().isString().notEmpty().withMessage('Phone is required'),
    body('isPrimary').optional().isBoolean().withMessage('isPrimary must be a boolean'),
    validationMiddleware.validate
  ],
  supplierController.updateSupplierContact
);

/**
 * @route DELETE /api/suppliers/:supplierId/contacts/:contactId
 * @desc Delete a supplier contact
 * @access Private
 */
router.delete(
  '/:supplierId/contacts/:contactId',
  [
    param('supplierId').isString().withMessage('Supplier ID is required'),
    param('contactId').isString().withMessage('Contact ID is required'),
    validationMiddleware.validate
  ],
  supplierController.deleteSupplierContact
);

/**
 * Qualification routes
 */

/**
 * @route GET /api/suppliers/:id/qualifications
 * @desc Get all qualifications for a supplier
 * @access Private
 */
router.get(
  '/:id/qualifications',
  [
    param('id').isString().withMessage('Supplier ID is required'),
    validationMiddleware.validate
  ],
  supplierController.getSupplierQualifications
);

/**
 * @route POST /api/suppliers/:id/qualifications
 * @desc Add a qualification to a supplier
 * @access Private
 */
router.post(
  '/:id/qualifications',
  [
    param('id').isString().withMessage('Supplier ID is required'),
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('status').isIn(['active', 'expired', 'pending']).withMessage('Invalid status'),
    body('expiryDate').isISO8601().withMessage('Expiry date must be a valid date'),
    body('issueDate').isISO8601().withMessage('Issue date must be a valid date'),
    body('documentUrl').optional().isURL().withMessage('Document URL must be a valid URL'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validationMiddleware.validate
  ],
  supplierController.addSupplierQualification
);

/**
 * @route PUT /api/suppliers/:supplierId/qualifications/:qualificationId
 * @desc Update a supplier qualification
 * @access Private
 */
router.put(
  '/:supplierId/qualifications/:qualificationId',
  [
    param('supplierId').isString().withMessage('Supplier ID is required'),
    param('qualificationId').isString().withMessage('Qualification ID is required'),
    body('name').optional().isString().notEmpty().withMessage('Name is required'),
    body('status').optional().isIn(['active', 'expired', 'pending']).withMessage('Invalid status'),
    body('expiryDate').optional().isISO8601().withMessage('Expiry date must be a valid date'),
    body('issueDate').optional().isISO8601().withMessage('Issue date must be a valid date'),
    body('documentUrl').optional().isURL().withMessage('Document URL must be a valid URL'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validationMiddleware.validate
  ],
  supplierController.updateSupplierQualification
);

/**
 * @route DELETE /api/suppliers/:supplierId/qualifications/:qualificationId
 * @desc Delete a supplier qualification
 * @access Private
 */
router.delete(
  '/:supplierId/qualifications/:qualificationId',
  [
    param('supplierId').isString().withMessage('Supplier ID is required'),
    param('qualificationId').isString().withMessage('Qualification ID is required'),
    validationMiddleware.validate
  ],
  supplierController.deleteSupplierQualification
);

module.exports = router; 