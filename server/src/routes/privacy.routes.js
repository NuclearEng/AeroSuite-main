/**
 * Privacy Routes
 * 
 * These routes handle user data privacy operations, including:
 * - Data export
 * - Account deletion
 * - Consent management
 * 
 * Part of SEC10: User data privacy compliance
 */

const express = require('express');
const router = express.Router();
const privacyController = require('../controllers/privacy.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rateLimit.middleware');

/**
 * @route GET /api/privacy/policy
 * @desc Get privacy policy and terms
 * @access Public
 */
router.get('/policy', privacyController.getPrivacyPolicy);

/**
 * @route POST /api/privacy/export-data
 * @desc Export user data
 * @access Private
 */
router.post(
  '/export-data', 
  authenticate, 
  rateLimiter({ windowMs: 60 * 60 * 1000, max: 2 }), // Limit to 2 exports per hour
  privacyController.exportUserData
);

/**
 * @route GET /api/privacy/download/:token
 * @desc Download exported user data
 * @access Private
 */
router.get(
  '/download/:token',
  authenticate,
  privacyController.downloadExport
);

/**
 * @route DELETE /api/privacy/account
 * @desc Delete user account
 * @access Private
 */
router.delete(
  '/account',
  authenticate,
  rateLimiter({ windowMs: 24 * 60 * 60 * 1000, max: 3 }), // Limit to 3 delete requests per day
  privacyController.deleteAccount
);

/**
 * @route PUT /api/privacy/consent
 * @desc Update user consent settings
 * @access Private
 */
router.put(
  '/consent',
  authenticate,
  privacyController.updateConsent
);

/**
 * @route GET /api/privacy/consent
 * @desc Get user consent settings
 * @access Private
 */
router.get(
  '/consent',
  authenticate,
  privacyController.getConsent
);

module.exports = router; 