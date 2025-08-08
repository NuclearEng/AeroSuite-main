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
const SecureFileUpload = require('../utils/secureFileUpload');
const multer = require('multer');

// Configure secure upload: quarantine to disk then process
const secureUpload = new SecureFileUpload({
  allowedMimeTypes: [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  maxFileSize: 10 * 1024 * 1024,
  uploadDir: require('path').join(process.cwd(), 'uploads', 'feedback')
});

const upload = multer({
  storage: secureUpload.createMulterStorage(),
  fileFilter: secureUpload.createFileFilter(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

/**
 * @route   POST /api/feedback
 * @desc    Submit new feedback
 * @access  Public
 */
router.post(
  '/',
  upload.array('attachments', 5),
  async (req, res, next) => {
    try {
      // Process uploaded files through security pipeline
      if (Array.isArray(req.files)) {
        const processed = [];
        for (const file of req.files) {
          const result = await secureUpload.processUploadedFile(file);
          processed.push(result);
        }
        // Attach processed file metadata to request for controller usage
        req.body.attachments = processed.map(p => ({
          filename: p.filename,
          path: p.relativePath,
          mimetype: p.mimetype,
          size: p.size
        }));
      }
      next();
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message || 'Invalid attachment' });
    }
  },
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