/**
 * Auth Routes - API v2
 * 
 * This file contains improved authentication routes for API v2.
 * Key improvements over v1:
 * - OAuth 2.0 authorization support
 * - Refresh token rotation
 * - PKCE support for SPA clients
 * - More granular permissions
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../../controllers/auth.controller');
const { auth } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Improved login with PKCE support
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('codeVerifier').optional().isString(),
    body('codeChallenge').optional().isString(),
    body('codeChallengeMethod').optional().isIn(['S256', 'plain']),
    validate
  ],
  authController.loginV2
);

// Register a new user
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phoneNumber').optional(),
    body('role').optional(),
    validate
  ],
  authController.register
);

// New refresh token endpoint
router.post(
  '/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate
  ],
  authController.refreshToken
);

// Improved password reset flow
router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Must be a valid email address'),
    validate
  ],
  authController.forgotPassword
);

router.post(
  '/reset-password/:token',
  [
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('confirmPassword').custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
    validate
  ],
  authController.resetPassword
);

// Get current user profile
router.get('/me', auth, authController.getMe);

// Update user profile
router.put(
  '/update-profile',
  auth,
  [
    body('firstName').optional(),
    body('lastName').optional(),
    body('phoneNumber').optional(),
    body('preferences').optional().isObject(),
    validate
  ],
  authController.updateProfile
);

// Change password
router.post(
  '/change-password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
    validate
  ],
  authController.changePassword
);

// Two-factor authentication
router.post('/2fa/setup', auth, authController.setupTwoFactor);
router.post('/2fa/verify', auth, authController.verifyTwoFactor);
router.post('/2fa/disable', auth, authController.disableTwoFactor);

// Email verification endpoints
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerificationEmail);

// User sessions management (new in v2)
router.get('/sessions', auth, authController.getUserSessions);
router.delete('/sessions/:sessionId', auth, authController.terminateSession);
router.delete('/sessions', auth, authController.terminateAllSessions);

// OAuth endpoints
router.get('/oauth/:provider', authController.oauthRedirect);
router.get('/oauth/:provider/callback', authController.oauthCallback);

// Logout
router.post('/logout', auth, authController.logout);

module.exports = router; 