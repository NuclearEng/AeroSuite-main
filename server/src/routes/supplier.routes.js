const express = require('express');
const { body } = require('express-validator');
const supplierController = require('../controllers/supplier.controller');
const authMiddleware = require('../middleware/auth.middleware');
const qualityManagementRoutes = require('./qualityManagement.routes');

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

// Mount quality management routes
router.use('/:supplierId/quality', qualityManagementRoutes);

/**
 * @route GET /api/suppliers
 * @desc Get all suppliers with pagination, filtering and sorting
 * @access Private
 */
router.get('/', supplierController.getSuppliers);

/**
 * @route GET /api/suppliers/:id
 * @desc Get supplier by ID
 * @access Private
 */
router.get('/:id', supplierController.getSupplier);

/**
 * @route GET /api/suppliers/:id/metrics
 * @desc Get supplier performance metrics
 * @access Private
 */
router.get('/:id/metrics', supplierController.getSupplierMetrics);

/**
 * @route POST /api/suppliers
 * @desc Create new supplier
 * @access Private (Admin, Manager)
 */
router.post(
  '/',
  [
    authMiddleware.restrictTo('admin', 'manager'),
    body('name').notEmpty().withMessage('Name is required'),
    body('code').notEmpty().withMessage('Code is required'),
    body('industry').notEmpty().withMessage('Industry is required'),
    body('status').isIn(['active', 'inactive', 'pending']).withMessage('Status must be active, inactive, or pending'),
    body('primaryContactEmail')
      .optional()
      .isEmail()
      .withMessage('Please include a valid email'),
    body('customers').optional().isArray().withMessage('Customers must be an array')
  ],
  supplierController.createSupplier
);

/**
 * @route PUT /api/suppliers/:id
 * @desc Update supplier
 * @access Private (Admin, Manager)
 */
router.put(
  '/:id',
  [
    authMiddleware.restrictTo('admin', 'manager'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('code').optional().notEmpty().withMessage('Code cannot be empty'),
    body('industry').optional().notEmpty().withMessage('Industry cannot be empty'),
    body('status').optional().isIn(['active', 'inactive', 'pending']).withMessage('Status must be active, inactive, or pending'),
    body('primaryContactEmail')
      .optional()
      .isEmail()
      .withMessage('Please include a valid email'),
    body('customers').optional().isArray().withMessage('Customers must be an array')
  ],
  supplierController.updateSupplier
);

/**
 * @route DELETE /api/suppliers/:id
 * @desc Delete supplier
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  authMiddleware.restrictTo('admin'),
  supplierController.deleteSupplier
);

/**
 * @route PATCH /api/suppliers/:id/rating
 * @desc Update supplier rating
 * @access Private (Admin, Manager)
 */
router.patch(
  '/:id/rating',
  [
    authMiddleware.restrictTo('admin', 'manager'),
    body('rating').isFloat({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('qualityRating').isFloat({ min: 1, max: 5 }).withMessage('Quality rating must be between 1 and 5'),
    body('deliveryRating').isFloat({ min: 1, max: 5 }).withMessage('Delivery rating must be between 1 and 5'),
    body('communicationRating').isFloat({ min: 1, max: 5 }).withMessage('Communication rating must be between 1 and 5'),
    body('notes').optional().isString().withMessage('Notes must be a string')
  ],
  supplierController.updateSupplierRating
);

module.exports = router; 