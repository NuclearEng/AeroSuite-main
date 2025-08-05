/**
 * Customer Routes (v1)
 * Implements customer management endpoints
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const customerController = require('../../domains/customer/controllers/CustomerController');
const authMiddleware = require('../../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.protect);

/**
 * @route GET /api/v1/customers
 * @desc Get all customers with pagination, filtering and sorting
 * @access Private
 */
router.get('/', customerController.getAllCustomers);

/**
 * @route GET /api/v1/customers/:id
 * @desc Get customer by ID
 * @access Private
 */
router.get('/:id', customerController.getCustomerById);

/**
 * @route POST /api/v1/customers
 * @desc Create new customer
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
  customerController.createCustomer
);

/**
 * @route PUT /api/v1/customers/:id
 * @desc Update customer
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
  customerController.updateCustomer
);

/**
 * @route DELETE /api/v1/customers/:id
 * @desc Delete customer
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  authMiddleware.restrictTo('admin'),
  customerController.deleteCustomer
);

/**
 * @route GET /api/v1/customers/search
 * @desc Search customers
 * @access Private
 */
router.get('/search', customerController.searchCustomers);

module.exports = router; 