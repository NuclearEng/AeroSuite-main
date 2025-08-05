/**
 * Supplier Routes (v1)
 * Implements supplier management endpoints
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const supplierController = require('../../domains/supplier/controllers/SupplierController');
const authMiddleware = require('../../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.protect);

/**
 * @route GET /api/v1/suppliers
 * @desc Get all suppliers with pagination, filtering and sorting
 * @access Private
 */
router.get('/', supplierController.getAllSuppliers);

/**
 * @route GET /api/v1/suppliers/:id
 * @desc Get supplier by ID
 * @access Private
 */
router.get('/:id', supplierController.getSupplierById);

/**
 * @route POST /api/v1/suppliers
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
      .withMessage('Please include a valid email')
  ],
  supplierController.createSupplier
);

/**
 * @route PUT /api/v1/suppliers/:id
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
      .withMessage('Please include a valid email')
  ],
  supplierController.updateSupplier
);

/**
 * @route DELETE /api/v1/suppliers/:id
 * @desc Delete supplier
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  authMiddleware.restrictTo('admin'),
  supplierController.deleteSupplier
);

/**
 * @route GET /api/v1/suppliers/:id/metrics
 * @desc Get supplier performance metrics
 * @access Private
 */
router.get('/:id/metrics', supplierController.getMetrics);

/**
 * @route GET /api/v1/suppliers/search
 * @desc Search suppliers
 * @access Private
 */
router.get('/search', supplierController.searchSuppliers);

module.exports = router; 