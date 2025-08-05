/**
 * Feedback Routes
 * 
 * API routes for customer feedback collection system
 * 
 * @task TS379 - Customer feedback collection system
 */

const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorization.middleware');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

/**
 * @route   POST /api/feedback
 * @desc    Submit new feedback
 * @access  Public
 */
router.post(
  '/',
  upload.array('attachments', 5), // Allow up to 5 file attachments
  feedbackController.createFeedback
);

/**
 * @route   GET /api/feedback/statistics
 * @desc    Get feedback statistics
 * @access  Admin, Manager
 */
router.get(
  '/statistics',
  authenticate,
  authorize('feedback', 'read'),
  feedbackController.getFeedbackStatistics
);

/**
 * @route   GET /api/feedback/customer/:customerId
 * @desc    Get feedback for a specific customer
 * @access  Admin, Manager, Customer (own feedback only)
 */
router.get(
  '/customer/:customerId',
  authenticate,
  authorize('feedback', 'read', {
    checkOwnership: true,
    ownerField: 'customerId',
    resourceIdParam: 'customerId'
  }),
  feedbackController.getCustomerFeedback
);

/**
 * @route   GET /api/feedback/:id
 * @desc    Get feedback by ID
 * @access  Admin, Manager
 */
router.get(
  '/:id',
  authenticate,
  authorize('feedback', 'read'),
  feedbackController.getFeedbackById
);

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback with filtering
 * @access  Admin, Manager
 */
router.get(
  '/',
  authenticate,
  authorize('feedback', 'read'),
  feedbackController.getAllFeedback
);

/**
 * @route   PATCH /api/feedback/:id
 * @desc    Update feedback
 * @access  Admin, Manager
 */
router.patch(
  '/:id',
  authenticate,
  authorize('feedback', 'update'),
  feedbackController.updateFeedback
);

/**
 * @route   DELETE /api/feedback/:id
 * @desc    Delete feedback
 * @access  Admin
 */
router.delete(
  '/:id',
  authenticate,
  authorize('feedback', 'delete'),
  feedbackController.deleteFeedback
);

module.exports = router; 