const express = require('express');
const { body, param } = require('express-validator');
const permissionController = require('../../controllers/permission.controller');
const { protect } = require('../../middleware/auth.middleware');
const { requirePermission } = require('../../middleware/permission.middleware');
const validate = require('../../middleware/validators/validate');

const router = express.Router();

// Protect all routes
router.use(protect);

/**
 * @route   GET /api/v2/permissions
 * @desc    Get all permissions
 * @access  Admin only
 */
router.get(
  '/',
  requirePermission('user:update:permission'),
  permissionController.getAllPermissions
);

/**
 * @route   GET /api/v2/permissions/category/:category
 * @desc    Get permissions by category
 * @access  Admin only
 */
router.get(
  '/category/:category',
  [
    param('category').isString().notEmpty().withMessage('Category is required'),
    validate
  ],
  requirePermission('user:update:permission'),
  permissionController.getPermissionsByCategory
);

/**
 * @route   POST /api/v2/permissions/categories
 * @desc    Get permissions by multiple categories
 * @access  Admin only
 */
router.post(
  '/categories',
  [
    body('categories').isArray().withMessage('Categories must be an array'),
    validate
  ],
  requirePermission('user:update:permission'),
  permissionController.getPermissionsByCategories
);

/**
 * @route   POST /api/v2/permissions
 * @desc    Create a new permission
 * @access  Admin only
 */
router.post(
  '/',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('description').isString().notEmpty().withMessage('Description is required'),
    body('category').isString().notEmpty().withMessage('Category is required'),
    body('action').isString().notEmpty().withMessage('Action is required'),
    body('resource').isString().notEmpty().withMessage('Resource is required'),
    validate
  ],
  requirePermission('user:update:permission'),
  permissionController.createPermission
);

/**
 * @route   PUT /api/v2/permissions/:id
 * @desc    Update a permission
 * @access  Admin only
 */
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid permission ID'),
    validate
  ],
  requirePermission('user:update:permission'),
  permissionController.updatePermission
);

/**
 * @route   DELETE /api/v2/permissions/:id
 * @desc    Delete a permission
 * @access  Admin only
 */
router.delete(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid permission ID'),
    validate
  ],
  requirePermission('user:update:permission'),
  permissionController.deletePermission
);

/**
 * @route   POST /api/v2/permissions/initialize
 * @desc    Initialize default permissions and roles
 * @access  Admin only
 */
router.post(
  '/initialize',
  requirePermission('admin:system:settings'),
  permissionController.initializeSystem
);

/**
 * @route   GET /api/v2/permissions/roles
 * @desc    Get all roles
 * @access  Admin only
 */
router.get(
  '/roles',
  requirePermission('user:update:role'),
  permissionController.getAllRoles
);

/**
 * @route   GET /api/v2/permissions/roles/:name
 * @desc    Get role by name
 * @access  Admin only
 */
router.get(
  '/roles/:name',
  [
    param('name').isString().notEmpty().withMessage('Role name is required'),
    validate
  ],
  requirePermission('user:update:role'),
  permissionController.getRoleByName
);

/**
 * @route   GET /api/v2/permissions/roles/:name/permissions
 * @desc    Get role permissions
 * @access  Admin only
 */
router.get(
  '/roles/:name/permissions',
  [
    param('name').isString().notEmpty().withMessage('Role name is required'),
    validate
  ],
  requirePermission('user:update:role'),
  permissionController.getRolePermissions
);

/**
 * @route   POST /api/v2/permissions/roles
 * @desc    Create a new role
 * @access  Admin only
 */
router.post(
  '/roles',
  [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('description').isString().notEmpty().withMessage('Description is required'),
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
    body('priority').optional().isNumeric().withMessage('Priority must be a number'),
    validate
  ],
  requirePermission('user:update:role'),
  permissionController.createRole
);

/**
 * @route   PUT /api/v2/permissions/roles/:name
 * @desc    Update a role
 * @access  Admin only
 */
router.put(
  '/roles/:name',
  [
    param('name').isString().notEmpty().withMessage('Role name is required'),
    validate
  ],
  requirePermission('user:update:role'),
  permissionController.updateRole
);

/**
 * @route   PUT /api/v2/permissions/roles/:name/permissions
 * @desc    Update role permissions
 * @access  Admin only
 */
router.put(
  '/roles/:name/permissions',
  [
    param('name').isString().notEmpty().withMessage('Role name is required'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    validate
  ],
  requirePermission('user:update:role'),
  permissionController.updateRolePermissions
);

/**
 * @route   POST /api/v2/permissions/roles/:name/permissions
 * @desc    Add permissions to role
 * @access  Admin only
 */
router.post(
  '/roles/:name/permissions',
  [
    param('name').isString().notEmpty().withMessage('Role name is required'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    validate
  ],
  requirePermission('user:update:role'),
  permissionController.addPermissionsToRole
);

/**
 * @route   DELETE /api/v2/permissions/roles/:name/permissions
 * @desc    Remove permissions from role
 * @access  Admin only
 */
router.delete(
  '/roles/:name/permissions',
  [
    param('name').isString().notEmpty().withMessage('Role name is required'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    validate
  ],
  requirePermission('user:update:role'),
  permissionController.removePermissionsFromRole
);

/**
 * @route   DELETE /api/v2/permissions/roles/:name
 * @desc    Delete a role
 * @access  Admin only
 */
router.delete(
  '/roles/:name',
  [
    param('name').isString().notEmpty().withMessage('Role name is required'),
    validate
  ],
  requirePermission('user:update:role'),
  permissionController.deleteRole
);

/**
 * @route   GET /api/v2/permissions/users/:id
 * @desc    Get user permissions
 * @access  Admin only
 */
router.get(
  '/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    validate
  ],
  requirePermission('user:update:permission'),
  permissionController.getUserPermissions
);

/**
 * @route   PUT /api/v2/permissions/users/:id
 * @desc    Update user custom permissions
 * @access  Admin only
 */
router.put(
  '/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('granted').optional().isArray().withMessage('Granted must be an array'),
    body('denied').optional().isArray().withMessage('Denied must be an array'),
    validate
  ],
  requirePermission('user:update:permission'),
  permissionController.updateUserPermissions
);

/**
 * @route   POST /api/v2/permissions/users/:id
 * @desc    Add custom permissions to user
 * @access  Admin only
 */
router.post(
  '/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('permissions').isArray().withMessage('Permissions must be an array'),
    body('type').isIn(['granted', 'denied']).withMessage('Type must be either "granted" or "denied"'),
    validate
  ],
  requirePermission('user:update:permission'),
  permissionController.addUserPermissions
);

/**
 * @route   DELETE /api/v2/permissions/users/:id
 * @desc    Remove custom permissions from user or clear all custom permissions
 * @access  Admin only
 */
router.delete(
  '/users/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    validate
  ],
  requirePermission('user:update:permission'),
  (req, res, next) => {
    // If permissions array is provided, remove specific permissions
    if (req.body.permissions) {
      return permissionController.removeUserPermissions(req, res, next);
    }
    // Otherwise clear all custom permissions
    return permissionController.clearUserPermissions(req, res, next);
  }
);

module.exports = router; 