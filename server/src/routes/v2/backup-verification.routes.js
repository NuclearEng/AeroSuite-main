const express = require('express');
const router = express.Router();
const backupVerificationController = require('../../controllers/backup-verification.controller');
const { protect } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');

// Protect all routes - require authentication
router.use(protect);

// Require admin system backup permission for all routes
router.use(requirePermission('admin:system:backup'));

/**
 * @route   GET /api/v2/backups/verification/status
 * @desc    Get backup verification status
 * @access  Admin
 */
router.get('/status', backupVerificationController.getVerificationStatus);

/**
 * @route   GET /api/v2/backups/verification/logs
 * @desc    Get recent verification logs
 * @access  Admin
 */
router.get('/logs', backupVerificationController.getVerificationLogs);

/**
 * @route   GET /api/v2/backups/verification/failures
 * @desc    Get recent verification failures
 * @access  Admin
 */
router.get('/failures', backupVerificationController.getVerificationFailures);

/**
 * @route   POST /api/v2/backups/verification/verify
 * @desc    Trigger a verification of the most recent backup
 * @access  Admin
 */
router.post('/verify', backupVerificationController.triggerVerification);

/**
 * @route   GET /api/v2/backups/verification/statistics
 * @desc    Get verification statistics for a specific date range
 * @access  Admin
 */
router.get('/statistics', backupVerificationController.getVerificationStatistics);

/**
 * @route   GET /api/v2/backups/verification/:id
 * @desc    Get verification details for a specific backup
 * @access  Admin
 */
router.get('/:id', backupVerificationController.getVerificationDetails);

module.exports = router; 