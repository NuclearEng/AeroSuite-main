/**
 * Inspection Routes (v1)
 * Implements inspection management endpoints
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const inspectionController = require('../../domains/inspection/controllers/InspectionController');
const authMiddleware = require('../../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.protect);

/**
 * @route GET /api/v1/inspections
 * @desc Get all inspections with pagination, filtering and sorting
 * @access Private
 */
router.get('/', inspectionController.getAllInspections);

/**
 * @route GET /api/v1/inspections/stats
 * @desc Get inspection statistics
 * @access Private
 */
router.get('/stats', inspectionController.getInspectionStats);

/**
 * @route GET /api/v1/inspections/:id
 * @desc Get inspection by ID
 * @access Private
 */
router.get('/:id', inspectionController.getInspectionById);

/**
 * @route POST /api/v1/inspections
 * @desc Create new inspection
 * @access Private (Admin, Manager, Inspector)
 */
router.post(
  '/',
  [
    authMiddleware.restrictTo('admin', 'manager', 'inspector'),
    body('title').notEmpty().withMessage('Title is required'),
    body('supplierId').notEmpty().withMessage('Supplier ID is required'),
    body('componentId').optional(),
    body('type').isIn(['quality', 'compliance', 'safety']).withMessage('Type must be quality, compliance, or safety'),
    body('status').isIn(['scheduled', 'in-progress', 'completed', 'cancelled']).withMessage('Status must be valid'),
    body('scheduledDate').isISO8601().withMessage('Scheduled date must be valid')
  ],
  inspectionController.createInspection
);

/**
 * @route PUT /api/v1/inspections/:id
 * @desc Update inspection
 * @access Private (Admin, Manager, Inspector)
 */
router.put(
  '/:id',
  [
    authMiddleware.restrictTo('admin', 'manager', 'inspector'),
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('type').optional().isIn(['quality', 'compliance', 'safety']).withMessage('Type must be quality, compliance, or safety'),
    body('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled']).withMessage('Status must be valid'),
    body('scheduledDate').optional().isISO8601().withMessage('Scheduled date must be valid')
  ],
  inspectionController.updateInspection
);

/**
 * @route DELETE /api/v1/inspections/:id
 * @desc Delete inspection
 * @access Private (Admin)
 */
router.delete(
  '/:id',
  authMiddleware.restrictTo('admin'),
  inspectionController.deleteInspection
);

/**
 * @route GET /api/v1/inspections/supplier/:supplierId
 * @desc Get inspections by supplier ID
 * @access Private
 */
router.get('/supplier/:supplierId', inspectionController.getInspectionsBySupplier);

/**
 * @route GET /api/v1/inspections/search
 * @desc Search inspections
 * @access Private
 */
router.get('/search', inspectionController.searchInspections);

module.exports = router; 