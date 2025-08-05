/**
 * User Routes - API v2
 * 
 * This file contains improved user management routes for API v2.
 * Key improvements over v1:
 * - GraphQL-like field selection
 * - Improved filtering
 * - Pagination headers
 * - Rate limiting headers
 * - HATEOAS links
 */

const express = require('express');
const router = express.Router();
const { body, query } = require('express-validator');
const userController = require('../../controllers/user.controller');
const { auth, authRole } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');

// Get all users with improved filtering and field selection
router.get(
  '/',
  auth,
  authRole(['admin', 'manager']),
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('sort').optional(),
    query('fields').optional(),
    query('filter').optional(),
    validate
  ],
  userController.getUsersV2
);

// Get user by ID with field selection
router.get(
  '/:id',
  auth,
  [
    query('fields').optional(),
    validate
  ],
  userController.getUserV2
);

// Create a new user (admin only)
router.post(
  '/',
  auth,
  authRole(['admin']),
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Must be a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['user', 'admin', 'manager', 'inspector']).withMessage('Invalid role'),
    body('department').optional(),
    body('jobTitle').optional(),
    body('permissions').optional().isArray(),
    validate
  ],
  userController.createUser
);

// Update user (admin can update any user, users can only update themselves)
router.put(
  '/:id',
  auth,
  [
    body('firstName').optional(),
    body('lastName').optional(),
    body('email').optional().isEmail().withMessage('Must be a valid email address'),
    body('role').optional().isIn(['user', 'admin', 'manager', 'inspector']).withMessage('Invalid role'),
    body('department').optional(),
    body('jobTitle').optional(),
    body('isActive').optional().isBoolean(),
    body('permissions').optional().isArray(),
    validate
  ],
  userController.updateUserV2
);

// Delete user (admin only)
router.delete(
  '/:id',
  auth,
  authRole(['admin']),
  userController.deleteUser
);

// Get user's activity log
router.get(
  '/:id/activity',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    query('type').optional(),
    validate
  ],
  userController.getUserActivityV2
);

// Get user's permissions
router.get(
  '/:id/permissions',
  auth,
  userController.getUserPermissionsV2
);

// Update user's permissions (admin only)
router.put(
  '/:id/permissions',
  auth,
  authRole(['admin']),
  [
    body('permissions').isArray().withMessage('Permissions must be an array'),
    validate
  ],
  userController.updateUserPermissionsV2
);

// New in v2: User bulk operations
router.post(
  '/bulk',
  auth,
  authRole(['admin']),
  [
    body('userIds').isArray().withMessage('User IDs must be an array'),
    body('action').isIn(['activate', 'deactivate', 'delete', 'changeRole', 'addPermission', 'removePermission']).withMessage('Invalid action'),
    body('data').optional(),
    validate
  ],
  userController.bulkUserOperationV2
);

// New in v2: Export users
router.get(
  '/export/:format',
  auth,
  authRole(['admin', 'manager']),
  [
    query('filter').optional(),
    validate
  ],
  userController.exportUsersV2
);

module.exports = router; 