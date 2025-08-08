/**
 * Authentication Routes
 * 
 * Provides authentication endpoints
 */

const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const apiSecurity = require('../middleware/api-security.middleware');
const ssoRoutes = require('./sso.routes');

const router = express.Router();

// Mount SSO routes
router.use('/sso', ssoRoutes);

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  apiSecurity.validateRequest.body({
    firstName: { type: 'string', required: true, pattern: /^[a-zA-Z\s\-']{2,50}$/ },
    lastName: { type: 'string', required: true, pattern: /^[a-zA-Z\s\-']{2,50}$/ },
    email: { type: 'string', required: true, pattern: /^[\w.-]+@[\w-]+(?:\.[\w-]+)+$/ },
    password: { type: 'string', required: true, pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/ },
    role: { type: 'string', pattern: /^(admin|manager|inspector|customer|viewer)$/ },
    customerId: { type: 'string', pattern: /^[0-9a-fA-F]{24}$/ }
  }),
  [
    body('firstName')
      .notEmpty()
      .withMessage('First name is required')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .notEmpty()
      .withMessage('Last name is required')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('role')
      .optional()
      .isIn(['admin', 'manager', 'inspector', 'customer', 'viewer'])
      .withMessage('Invalid role'),
    body('customerId')
      .optional()
      .isMongoId()
      .withMessage('Invalid customer ID')
  ],
  authController.register
);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify user email address
 * @access Public
 */
router.get(
  '/verify-email/:token',
  apiSecurity.validateRequest.params({
    token: { type: 'string', pattern: /^[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*$/ }
  }),
  authController.verifyEmail
);

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend email verification
 * @access Public
 */
router.post(
  '/resend-verification',
  apiSecurity.validateRequest.body({
    email: { type: 'string', required: true, pattern: /^[\w.-]+@[\w-]+(?:\.[\w-]+)+$/ }
  }),
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail()
  ],
  authController.resendVerificationEmail
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  apiSecurity.validateRequest.body({
    email: { type: 'string', required: true, pattern: /^[\w.-]+@[\w-]+(?:\.[\w-]+)+$/ },
    password: { type: 'string', required: true }
  }),
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  authController.login
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/me',
  apiSecurity.secureJwt,
  authMiddleware.protect,
  authController.getMe
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/forgot-password',
  apiSecurity.validateRequest.body({
    email: { type: 'string', required: true, pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ }
  }),
  [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail()
  ],
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/reset-password/:token',
  apiSecurity.validateRequest.params({
    token: { type: 'string', pattern: /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/ }
  }),
  apiSecurity.validateRequest.body({
    password: { type: 'string', required: true, pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/ }
  }),
  [
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  authController.resetPassword
);

/**
 * @route POST /api/auth/change-password
 * @desc Change password while logged in
 * @access Private
 */
router.post(
  '/change-password',
  apiSecurity.secureJwt,
  authMiddleware.protect,
  apiSecurity.validateRequest.body({
    currentPassword: { type: 'string', required: true },
    newPassword: { type: 'string', required: true, pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).{8,}$/ }
  }),
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters long')
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  authController.changePassword
);

/**
 * @route PUT /api/auth/update-profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/update-profile',
  apiSecurity.secureJwt,
  authMiddleware.protect,
  apiSecurity.validateRequest.body({
    firstName: { type: 'string', pattern: /^[a-zA-Z\s\-']{2,50}$/ },
    lastName: { type: 'string', pattern: /^[a-zA-Z\s\-']{2,50}$/ },
    phoneNumber: { type: 'string', pattern: /^[+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/ },
    preferences: { type: 'object' }
  }),
  [
    body('firstName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('phoneNumber')
      .optional()
      .trim(),
    body('preferences')
      .optional()
      .isObject()
      .withMessage('Preferences must be an object')
  ],
  authController.updateProfile
);

/**
 * @route POST /api/auth/2fa/setup
 * @desc Setup two-factor authentication
 * @access Private
 */
router.post(
  '/2fa/setup',
  apiSecurity.secureJwt,
  authMiddleware.protect,
  apiSecurity.validateRequest.body({
    method: { type: 'string', required: true, pattern: /^(app|email|sms)$/ }
  }),
  [
    body('method')
      .notEmpty()
      .withMessage('Method is required')
      .isIn(['app', 'email', 'sms'])
      .withMessage('Invalid 2FA method')
  ],
  authController.setupTwoFactor
);

/**
 * @route POST /api/auth/2fa/verify
 * @desc Verify and enable two-factor authentication
 * @access Private
 */
router.post(
  '/2fa/verify',
  apiSecurity.secureJwt,
  authMiddleware.protect,
  apiSecurity.validateRequest.body({
    token: { type: 'string', required: true, pattern: /^[0-9]{6}$/ }
  }),
  [
    body('token')
      .notEmpty()
      .withMessage('Verification code is required')
  ],
  authController.verifyAndEnableTwoFactor
);

/**
 * @route POST /api/auth/2fa/verify-login
 * @desc Verify 2FA during login
 * @access Public
 */
router.post(
  '/2fa/verify-login',
  apiSecurity.validateRequest.body({
    token: { type: 'string', required: true, pattern: /^[0-9]{6}$/ },
    tempToken: { type: 'string', required: true, pattern: /^[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*$/ }
  }),
  [
    body('token')
      .notEmpty()
      .withMessage('Verification code is required'),
    body('tempToken')
      .notEmpty()
      .withMessage('Temporary token is required')
  ],
  authController.verifyTwoFactorLogin
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post(
  '/logout',
  apiSecurity.secureJwt,
  authMiddleware.protect,
  (req, res) => {
    // Mock implementation
    res.status(200).json({ success: true, message: 'Logged out successfully' });
  }
);

/**
 * @route PUT /api/auth/complete-onboarding
 * @desc Complete user onboarding process
 * @access Private
 */
router.put(
  '/complete-onboarding',
  apiSecurity.secureJwt,
  authMiddleware.protect,
  authController.completeOnboarding
);

module.exports = router; 