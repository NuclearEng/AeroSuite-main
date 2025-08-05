const express = require('express');
const { body } = require('express-validator');
const inspectionController = require('../controllers/inspection.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

/**
 * @route GET /api/inspections
 * @desc Get all inspections with filtering, pagination and sorting
 * @access Private
 */
router.get('/', inspectionController.getInspections);

/**
 * @route GET /api/inspections/stats
 * @desc Get inspection statistics
 * @access Private
 */
router.get('/stats', inspectionController.getInspectionStats);

/**
 * @route GET /api/inspections/analytics
 * @desc Get advanced inspection analytics
 * @access Private
 */
router.get('/analytics', inspectionController.getAdvancedAnalytics);

/**
 * @route GET /api/inspections/analytics/supplier-comparison
 * @desc Get supplier comparison analytics
 * @access Private (Admin, Manager)
 */
router.get(
  '/analytics/supplier-comparison',
  authMiddleware.restrictTo('admin', 'manager'),
  inspectionController.getSupplierComparison
);

/**
 * @route GET /api/inspections/:id
 * @desc Get single inspection by ID
 * @access Private
 */
router.get('/:id', inspectionController.getInspection);

/**
 * @route POST /api/inspections
 * @desc Create new inspection
 * @access Private (Manager, Admin, Inspector)
 */
router.post(
  '/',
  [
    authMiddleware.restrictTo('admin', 'manager', 'inspector'),
    body('customerId')
      .notEmpty()
      .withMessage('Customer is required')
      .isMongoId()
      .withMessage('Invalid customer ID'),
    body('supplierId')
      .notEmpty()
      .withMessage('Supplier is required')
      .isMongoId()
      .withMessage('Invalid supplier ID'),
    body('inspectionType')
      .notEmpty()
      .withMessage('Inspection type is required')
      .isIn(['incoming', 'in-process', 'final', 'source', 'audit'])
      .withMessage('Invalid inspection type'),
    body('title')
      .notEmpty()
      .withMessage('Title is required')
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format')
  ],
  inspectionController.createInspection
);

/**
 * @route PUT /api/inspections/:id
 * @desc Update inspection
 * @access Private (Manager, Admin, Inspector)
 */
router.put(
  '/:id',
  [
    authMiddleware.restrictTo('admin', 'manager', 'inspector'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 3, max: 100 })
      .withMessage('Title must be between 3 and 100 characters'),
    body('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid date format'),
    body('status')
      .optional()
      .isIn(['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed'])
      .withMessage('Invalid status')
  ],
  inspectionController.updateInspection
);

/**
 * @route DELETE /api/inspections/:id
 * @desc Delete inspection (only scheduled inspections)
 * @access Private (Manager, Admin)
 */
router.delete(
  '/:id',
  authMiddleware.restrictTo('admin', 'manager'),
  inspectionController.deleteInspection
);

/**
 * @route PATCH /api/inspections/:id/checklist
 * @desc Update inspection checklist items
 * @access Private (Inspector)
 */
router.patch(
  '/:id/checklist',
  authMiddleware.restrictTo('admin', 'manager', 'inspector'),
  inspectionController.updateChecklistItems
);

/**
 * @route PATCH /api/inspections/:id/checklist/batch
 * @desc Batch update multiple checklist items at once
 * @access Private (Inspector)
 */
router.patch(
  '/:id/checklist/batch',
  authMiddleware.restrictTo('admin', 'manager', 'inspector'),
  inspectionController.batchUpdateChecklistItems
);

/**
 * @route POST /api/inspections/:id/defects
 * @desc Add defect to inspection
 * @access Private (Inspector)
 */
router.post(
  '/:id/defects',
  [
    authMiddleware.restrictTo('admin', 'manager', 'inspector'),
    body('defectType')
      .notEmpty()
      .withMessage('Defect type is required'),
    body('severity')
      .optional()
      .isIn(['minor', 'major', 'critical'])
      .withMessage('Invalid severity level')
  ],
  inspectionController.addDefect
);

/**
 * @route PATCH /api/inspections/:id/complete
 * @desc Complete inspection
 * @access Private (Inspector)
 */
router.patch(
  '/:id/complete',
  authMiddleware.restrictTo('admin', 'manager', 'inspector'),
  inspectionController.completeInspection
);

/**
 * @route GET /api/inspections/:id/report
 * @desc Generate inspection report
 * @access Private (Inspector, Manager, Admin, Customer)
 */
router.get(
  '/:id/report',
  authMiddleware.restrictTo('admin', 'manager', 'inspector', 'customer'),
  inspectionController.generateReport
);

module.exports = router; 