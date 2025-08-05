const express = require('express');
const { body } = require('express-validator');
const qualityManagementController = require('../controllers/qualityManagement.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router({ mergeParams: true });

// Protect all routes
router.use(authMiddleware.protect);

/**
 * @route GET /api/suppliers/:supplierId/quality
 * @desc Get quality management data for a supplier
 * @access Private
 */
router.get('/', qualityManagementController.getSupplierQMS);

/**
 * @route PUT /api/suppliers/:supplierId/quality
 * @desc Update quality management data for a supplier
 * @access Private (Admin, Manager, Quality)
 */
router.put(
  '/',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  qualityManagementController.updateQMS
);

/**
 * @route GET /api/suppliers/:supplierId/quality/compliance
 * @desc Get quality compliance summary for a supplier
 * @access Private
 */
router.get('/compliance', qualityManagementController.getComplianceSummary);

/**
 * @route GET /api/suppliers/:supplierId/quality/metrics
 * @desc Get all quality metrics for a supplier
 * @access Private
 */
router.get('/metrics', qualityManagementController.getQualityMetrics);

/**
 * @route PUT /api/suppliers/:supplierId/quality/metrics/:metricName
 * @desc Update a quality metric
 * @access Private (Admin, Manager, Quality)
 */
router.put(
  '/metrics/:metricName',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  [
    body('value').isNumeric().withMessage('Value must be a number')
  ],
  qualityManagementController.updateMetric
);

/**
 * @route GET /api/suppliers/:supplierId/quality/non-conformances
 * @desc Get all non-conformance records for a supplier
 * @access Private
 */
router.get('/non-conformances', qualityManagementController.getNonConformances);

/**
 * @route POST /api/suppliers/:supplierId/quality/non-conformances
 * @desc Add a non-conformance record
 * @access Private (Admin, Manager, Quality, Inspector)
 */
router.post(
  '/non-conformances',
  authMiddleware.restrictTo('admin', 'manager', 'quality', 'inspector'),
  [
    body('description').notEmpty().withMessage('Description is required'),
    body('severity').isIn(['critical', 'major', 'minor', 'observation']).withMessage('Invalid severity')
  ],
  qualityManagementController.addNonConformance
);

/**
 * @route GET /api/suppliers/:supplierId/quality/non-conformances/:ncNumber
 * @desc Get a specific non-conformance record
 * @access Private
 */
router.get('/non-conformances/:ncNumber', qualityManagementController.getNonConformance);

/**
 * @route PUT /api/suppliers/:supplierId/quality/non-conformances/:ncNumber
 * @desc Update a non-conformance record
 * @access Private (Admin, Manager, Quality)
 */
router.put(
  '/non-conformances/:ncNumber',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  qualityManagementController.updateNonConformance
);

/**
 * @route GET /api/suppliers/:supplierId/quality/documents
 * @desc Get all quality documents for a supplier
 * @access Private
 */
router.get('/documents', qualityManagementController.getQualityDocuments);

/**
 * @route POST /api/suppliers/:supplierId/quality/documents
 * @desc Add a quality document
 * @access Private (Admin, Manager, Quality)
 */
router.post(
  '/documents',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  [
    body('name').notEmpty().withMessage('Document name is required'),
    body('type').isIn(['manual', 'procedure', 'work-instruction', 'form', 'record', 'certificate', 'report', 'other']).withMessage('Invalid document type')
  ],
  qualityManagementController.addQualityDocument
);

/**
 * @route PUT /api/suppliers/:supplierId/quality/documents/:documentId
 * @desc Update a quality document
 * @access Private (Admin, Manager, Quality)
 */
router.put(
  '/documents/:documentId',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  qualityManagementController.updateQualityDocument
);

/**
 * @route DELETE /api/suppliers/:supplierId/quality/documents/:documentId
 * @desc Delete a quality document
 * @access Private (Admin, Manager)
 */
router.delete(
  '/documents/:documentId',
  authMiddleware.restrictTo('admin', 'manager'),
  qualityManagementController.deleteQualityDocument
);

/**
 * @route GET /api/suppliers/:supplierId/quality/improvement-plans
 * @desc Get all improvement plans for a supplier
 * @access Private
 */
router.get('/improvement-plans', qualityManagementController.getImprovementPlans);

/**
 * @route POST /api/suppliers/:supplierId/quality/improvement-plans
 * @desc Add an improvement plan
 * @access Private (Admin, Manager, Quality)
 */
router.post(
  '/improvement-plans',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('targetDate').isISO8601().withMessage('Target date must be a valid date')
  ],
  qualityManagementController.addImprovementPlan
);

/**
 * @route PUT /api/suppliers/:supplierId/quality/improvement-plans/:planId
 * @desc Update an improvement plan
 * @access Private (Admin, Manager, Quality)
 */
router.put(
  '/improvement-plans/:planId',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  qualityManagementController.updateImprovementPlan
);

/**
 * @route POST /api/suppliers/:supplierId/quality/improvement-plans/:planId/milestones
 * @desc Add a milestone to an improvement plan
 * @access Private (Admin, Manager, Quality)
 */
router.post(
  '/improvement-plans/:planId/milestones',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  [
    body('description').notEmpty().withMessage('Description is required'),
    body('dueDate').isISO8601().withMessage('Due date must be a valid date')
  ],
  qualityManagementController.addMilestone
);

/**
 * @route PUT /api/suppliers/:supplierId/quality/improvement-plans/:planId/milestones/:milestoneId
 * @desc Update a milestone
 * @access Private (Admin, Manager, Quality)
 */
router.put(
  '/improvement-plans/:planId/milestones/:milestoneId',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  qualityManagementController.updateMilestone
);

/**
 * @route POST /api/suppliers/:supplierId/quality/sync-audits
 * @desc Sync audits with quality management
 * @access Private (Admin, Manager, Quality)
 */
router.post(
  '/sync-audits',
  authMiddleware.restrictTo('admin', 'manager', 'quality'),
  qualityManagementController.syncAudits
);

module.exports = router; 