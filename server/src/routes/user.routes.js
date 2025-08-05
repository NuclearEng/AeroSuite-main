/**
 * User Routes
 * 
 * Provides user management endpoints
 */

const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private/Admin
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    users: [
      {
        _id: 'user_123456789',
        email: 'admin@example.com',
        role: 'admin'
      },
      {
        _id: 'user_987654321',
        email: 'user@example.com',
        role: 'user'
      }
    ]
  });
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private/Admin
 */
router.get('/:id', (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      _id: req.params.id,
      email: 'user@example.com',
      role: 'user'
    }
  });
});

/**
 * @route POST /api/users
 * @desc Create a new user (admin only)
 * @access Private
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('role').isIn(['admin', 'manager', 'inspector', 'customer', 'viewer']).withMessage('Invalid role')
  ],
  validate,
  userController.createUser
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  [
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').optional().notEmpty().withMessage('First name is required'),
    body('lastName').optional().notEmpty().withMessage('Last name is required'),
    body('role').optional().isIn(['admin', 'manager', 'inspector', 'customer', 'viewer']).withMessage('Invalid role')
  ],
  validate,
  userController.updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (admin only)
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  userController.deleteUser
);

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/profile/me',
  authenticate,
  userController.getProfile
);

/**
 * @route GET /api/users/preferences/dashboard
 * @desc Get user dashboard preferences
 * @access Private
 */
router.get(
  '/preferences/dashboard',
  authenticate,
  userController.getDashboardPreferences
);

/**
 * @route POST /api/users/preferences/dashboard
 * @desc Save user dashboard preferences
 * @access Private
 */
router.post(
  '/preferences/dashboard',
  authenticate,
  userController.saveDashboardPreferences
);

/**
 * @route DELETE /api/users/preferences/dashboard
 * @desc Reset user dashboard preferences
 * @access Private
 */
router.delete(
  '/preferences/dashboard',
  authenticate,
  userController.resetDashboardPreferences
);

/**
 * @route PUT /api/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.put(
  '/profile/me',
  authenticate,
  [
    body('email').optional().isEmail().withMessage('Please provide a valid email'),
    body('firstName').optional().notEmpty().withMessage('First name is required'),
    body('lastName').optional().notEmpty().withMessage('Last name is required'),
    body('phone').optional().isMobilePhone().withMessage('Please provide a valid phone number'),
    body('company').optional(),
    body('jobTitle').optional()
  ],
  validate,
  userController.updateProfile
);

/**
 * @route PUT /api/users/change-password
 * @desc Change user password
 * @access Private
 */
router.put(
  '/profile/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
  ],
  validate,
  userController.changePassword
);

module.exports = router; 