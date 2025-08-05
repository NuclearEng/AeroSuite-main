/**
 * Advanced Permissions Routes
 * 
 * API endpoints for managing advanced user permissions
 * 
 * @task TS378 - Advanced user permissions management
 */

const express = require('express');
const router = express.Router();
const advancedPermissionsController = require('../controllers/advancedPermissions.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/authorization.middleware');

/**
 * @route   POST /api/permissions/advanced/initialize
 * @desc    Initialize advanced permissions system
 * @access  Admin
 */
router.post(
  '/initialize',
  authenticate,
  authorize('permission', 'manage', { bypassForAdmin: false }),
  advancedPermissionsController.initializeSystem
);

/**
 * @route   GET /api/permissions/advanced/groups
 * @desc    Get permission groups
 * @access  Admin
 */
router.get(
  '/groups',
  authenticate,
  authorize('permission', 'read'),
  advancedPermissionsController.getPermissionGroups
);

/**
 * @route   GET /api/permissions/advanced/contexts
 * @desc    Get permission contexts
 * @access  Admin
 */
router.get(
  '/contexts',
  authenticate,
  authorize('permission', 'read'),
  advancedPermissionsController.getPermissionContexts
);

/**
 * @route   GET /api/permissions/advanced/users/:userId/effective
 * @desc    Get user effective permissions with sources
 * @access  Admin
 */
router.get(
  '/users/:userId/effective',
  authenticate,
  authorize('permission', 'read'),
  advancedPermissionsController.getUserEffectivePermissions
);

/**
 * @route   POST /api/permissions/advanced/users/:userId/temporary
 * @desc    Grant temporary permission to user
 * @access  Admin
 */
router.post(
  '/users/:userId/temporary',
  authenticate,
  authorize('permission', 'manage'),
  advancedPermissionsController.grantTemporaryPermission
);

/**
 * @route   DELETE /api/permissions/advanced/users/:userId/temporary/:permissionId
 * @desc    Revoke temporary permission from user
 * @access  Admin
 */
router.delete(
  '/users/:userId/temporary/:permissionId',
  authenticate,
  authorize('permission', 'manage'),
  advancedPermissionsController.revokeTemporaryPermission
);

/**
 * @route   POST /api/permissions/advanced/users/:userId/contexts
 * @desc    Assign permission context to user
 * @access  Admin
 */
router.post(
  '/users/:userId/contexts',
  authenticate,
  authorize('permission', 'manage'),
  advancedPermissionsController.assignPermissionContext
);

/**
 * @route   DELETE /api/permissions/advanced/users/:userId/contexts/:contextId
 * @desc    Remove permission context from user
 * @access  Admin
 */
router.delete(
  '/users/:userId/contexts/:contextId',
  authenticate,
  authorize('permission', 'manage'),
  advancedPermissionsController.removePermissionContext
);

/**
 * @route   POST /api/permissions/advanced/users/:userId/resources
 * @desc    Set resource permission override
 * @access  Admin
 */
router.post(
  '/users/:userId/resources',
  authenticate,
  authorize('permission', 'manage'),
  advancedPermissionsController.setResourcePermissionOverride
);

/**
 * @route   DELETE /api/permissions/advanced/users/:userId/resources/:resourceType/:resourceId
 * @desc    Remove resource permission override
 * @access  Admin
 */
router.delete(
  '/users/:userId/resources/:resourceType/:resourceId',
  authenticate,
  authorize('permission', 'manage'),
  advancedPermissionsController.removeResourcePermissionOverride
);

/**
 * @route   POST /api/permissions/advanced/users/:userId/cache/clear
 * @desc    Clear user permission cache
 * @access  Admin
 */
router.post(
  '/users/:userId/cache/clear',
  authenticate,
  authorize('permission', 'manage'),
  advancedPermissionsController.clearUserPermissionCache
);

module.exports = router; 