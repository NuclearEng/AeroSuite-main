/**
 * Inspection Routes - API v2
 * 
 * This file contains improved inspection management routes for API v2.
 * Key improvements over v1:
 * - Real-time inspection status updates
 * - Enhanced filtering and sorting
 * - Field selection for performance
 * - Support for bulk operations
 * - WebSocket integration hints
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const inspectionController = require('../../controllers/inspection.controller');
const { auth, authRole } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Get all inspections with enhanced filtering
router.get(
  '/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional(),
    query('fields').optional(),
    query('filter').optional(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('status').optional(),
    query('supplierId').optional().isMongoId(),
    query('customerId').optional().isMongoId(),
    query('assignedTo').optional().isMongoId(),
    query('includeDefects').optional().isBoolean(),
    query('includePhotos').optional().isBoolean(),
    validate
  ],
  inspectionController.getInspectionsV2
);

// Get inspection by ID with field selection
router.get(
  '/:id',
  auth,
  [
    query('fields').optional(),
    query('includeDefects').optional().isBoolean(),
    query('includePhotos').optional().isBoolean(),
    query('includeHistory').optional().isBoolean(),
    validate
  ],
  inspectionController.getInspectionV2
);

// Schedule a new inspection
router.post(
  '/',
  auth,
  [
    body('supplierId').isMongoId().withMessage('Valid supplier ID is required'),
    body('customerId').optional().isMongoId().withMessage('Customer ID must be valid'),
    body('scheduledDate').isISO8601().withMessage('Valid scheduled date is required'),
    body('type').isIn(['incoming', 'inprocess', 'final', 'supplier-audit']).withMessage('Invalid inspection type'),
    body('assignedTo').optional().isMongoId(),
    body('location').optional(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('checklist').optional().isArray(),
    body('notes').optional(),
    body('notifySupplier').optional().isBoolean(),
    body('recurring').optional().isObject(),
    validate
  ],
  inspectionController.scheduleInspection
);

// Update inspection
router.put(
  '/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Valid inspection ID is required'),
    body('scheduledDate').optional().isISO8601(),
    body('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled', 'delayed']),
    body('assignedTo').optional().isMongoId(),
    body('location').optional(),
    body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
    body('notes').optional(),
    validate
  ],
  inspectionController.updateInspectionV2
);

// Delete inspection
router.delete(
  '/:id',
  auth,
  authRole(['admin', 'manager']),
  inspectionController.deleteInspection
);

// Start inspection
router.post(
  '/:id/start',
  auth,
  [
    param('id').isMongoId().withMessage('Valid inspection ID is required'),
    body('actualStartTime').optional().isISO8601(),
    body('notes').optional(),
    validate
  ],
  inspectionController.startInspectionV2
);

// Complete inspection
router.post(
  '/:id/complete',
  auth,
  [
    param('id').isMongoId().withMessage('Valid inspection ID is required'),
    body('actualEndTime').optional().isISO8601(),
    body('outcome').isIn(['passed', 'failed', 'conditional']).withMessage('Valid outcome is required'),
    body('notes').optional(),
    body('followUpRequired').optional().isBoolean(),
    body('followUpDate').optional().isISO8601(),
    validate
  ],
  inspectionController.completeInspectionV2
);

// Add checklist item
router.post(
  '/:id/checklist',
  auth,
  [
    param('id').isMongoId().withMessage('Valid inspection ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').optional(),
    body('requiresPhoto').optional().isBoolean(),
    body('requiresComment').optional().isBoolean(),
    body('required').optional().isBoolean(),
    validate
  ],
  inspectionController.addChecklistItemV2
);

// Update checklist item
router.put(
  '/:id/checklist/:itemId',
  auth,
  [
    param('id').isMongoId().withMessage('Valid inspection ID is required'),
    param('itemId').isMongoId().withMessage('Valid item ID is required'),
    body('status').optional().isIn(['pending', 'passed', 'failed', 'na']),
    body('comment').optional(),
    body('photoIds').optional().isArray(),
    validate
  ],
  inspectionController.updateChecklistItemV2
);

// Record defect
router.post(
  '/:id/defects',
  auth,
  [
    param('id').isMongoId().withMessage('Valid inspection ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('severity').isIn(['minor', 'major', 'critical']).withMessage('Valid severity is required'),
    body('location').optional(),
    body('photoIds').optional().isArray(),
    body('measurements').optional().isArray(),
    validate
  ],
  inspectionController.recordDefectV2
);

// Upload inspection photo
router.post(
  '/:id/photos',
  auth,
  inspectionController.uploadInspectionPhotoV2
);

// Get inspection statistics
router.get(
  '/statistics',
  auth,
  [
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('supplierId').optional().isMongoId(),
    query('customerId').optional().isMongoId(),
    query('groupBy').optional().isIn(['day', 'week', 'month', 'quarter', 'year', 'supplier', 'inspector', 'status', 'type']),
    validate
  ],
  inspectionController.getInspectionStatisticsV2
);

// Get inspection timeline
router.get(
  '/:id/timeline',
  auth,
  [
    param('id').isMongoId().withMessage('Valid inspection ID is required'),
    validate
  ],
  inspectionController.getInspectionTimelineV2
);

// New in v2: Subscribe to inspection updates (WebSocket hint)
router.get(
  '/:id/subscribe',
  auth,
  [
    param('id').isMongoId().withMessage('Valid inspection ID is required'),
    validate
  ],
  (req, res) => {
    res.json({
      success: true,
      message: 'To subscribe to real-time updates, connect to the WebSocket endpoint',
      webSocketEndpoint: `/ws/inspections/${req.params.id}`,
      supportedEvents: [
        'inspection.updated',
        'inspection.started',
        'inspection.completed',
        'checklist.updated',
        'defect.added',
        'photo.added'
      ]
    });
  }
);

// New in v2: Bulk operations
router.post(
  '/bulk',
  auth,
  authRole(['admin', 'manager']),
  [
    body('inspectionIds').isArray().withMessage('Inspection IDs must be an array'),
    body('action').isIn(['reschedule', 'reassign', 'cancel', 'delete']).withMessage('Invalid action'),
    body('data').optional(),
    validate
  ],
  inspectionController.bulkInspectionOperationV2
);

module.exports = router; 