const express = require('express');
const { body } = require('express-validator');
const customerController = require('../controllers/customer.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

/**
 * @route GET /api/customers
 * @desc Get all customers with pagination, filtering, and sorting
 * @access Private
 */
router.get('/', customerController.getCustomers);

/**
 * @route GET /api/customers/:id
 * @desc Get customer by ID
 * @access Private
 */
router.get('/:id', customerController.getCustomer);

/**
 * @route POST /api/customers
 * @desc Create new customer
 * @access Private (Admin, Manager)
 */
router.post(
  '/',
  [
    authMiddleware.restrictTo('admin', 'manager'),
    body('name')
      .notEmpty()
      .withMessage('Customer name is required')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('code')
      .notEmpty()
      .withMessage('Customer code is required')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Code must be between 2 and 20 characters')
      .matches(/^[A-Z0-9-]+$/)
      .withMessage('Code must contain only uppercase letters, numbers, and hyphens'),
    body('primaryContactEmail')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('contractStartDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('contractEndDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('serviceLevel')
      .optional()
      .isIn(['basic', 'standard', 'premium', 'enterprise'])
      .withMessage('Invalid service level')
  ],
  customerController.createCustomer
);

/**
 * @route PUT /api/customers/:id
 * @desc Update customer
 * @access Private (Admin, Manager)
 */
router.put(
  '/:id',
  [
    authMiddleware.restrictTo('admin', 'manager'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    body('code')
      .optional()
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('Code must be between 2 and 20 characters')
      .matches(/^[A-Z0-9-]+$/)
      .withMessage('Code must contain only uppercase letters, numbers, and hyphens'),
    body('primaryContactEmail')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('contractStartDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('contractEndDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('serviceLevel')
      .optional()
      .isIn(['basic', 'standard', 'premium', 'enterprise'])
      .withMessage('Invalid service level'),
    body('status')
      .optional()
      .isIn(['active', 'inactive', 'pending'])
      .withMessage('Invalid status')
  ],
  customerController.updateCustomer
);

/**
 * @route DELETE /api/customers/:id
 * @desc Delete customer
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  authMiddleware.restrictTo('admin'),
  customerController.deleteCustomer
);

/**
 * @route GET /api/customers/:id/metrics
 * @desc Get customer metrics
 * @access Private
 */
router.get('/:id/metrics', customerController.getCustomerMetrics);

/**
 * @route GET /api/customers/:id/inspections
 * @desc Get customer inspections
 * @access Private
 */
router.get('/:id/inspections', customerController.getCustomerInspections);

/**
 * @route GET /api/customers/:id/suppliers
 * @desc Get customer suppliers
 * @access Private
 */
router.get('/:id/suppliers', customerController.getCustomerSuppliers);

/**
 * @route GET /api/customers/:id/activities
 * @desc Get customer activity history
 * @access Private
 */
router.get('/:id/activities', customerController.getCustomerActivities);

module.exports = router; 