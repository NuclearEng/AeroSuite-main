/**
 * Advanced Permissions Controller
 * 
 * Provides API endpoints for managing advanced user permissions
 * 
 * @task TS378 - Advanced user permissions management
 */

const advancedPermissionsService = require('../services/advancedPermissions.service');
const permissionsService = require('../services/permissions.service');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Initialize advanced permissions system
 */
exports.initializeSystem = async (req, res, next) => {
  try {
    const result = await advancedPermissionsService.initialize();
    
    res.status(200).json({
      success: true,
      message: 'Advanced permissions system initialized successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to initialize advanced permissions system:', error);
    next(error);
  }
};

/**
 * Get permission groups
 */
exports.getPermissionGroups = async (req, res, next) => {
  try {
    const groups = await advancedPermissionsService.getPermissionGroups();
    
    res.status(200).json({
      success: true,
      data: groups
    });
  } catch (error) {
    logger.error('Failed to get permission groups:', error);
    next(error);
  }
};

/**
 * Get permission contexts
 */
exports.getPermissionContexts = async (req, res, next) => {
  try {
    const contexts = await advancedPermissionsService.getPermissionContexts();
    
    res.status(200).json({
      success: true,
      data: contexts
    });
  } catch (error) {
    logger.error('Failed to get permission contexts:', error);
    next(error);
  }
};

/**
 * Get user effective permissions with sources
 */
exports.getUserEffectivePermissions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const permissions = await advancedPermissionsService.getUserEffectivePermissionsWithSources(userId);
    
    res.status(200).json({
      success: true,
      data: permissions
    });
  } catch (error) {
    logger.error('Failed to get user effective permissions:', error);
    next(error);
  }
};

/**
 * Grant temporary permission to user
 */
exports.grantTemporaryPermission = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { permissionId, expiresIn, reason } = req.body;
    
    if (!permissionId) {
      throw new AppError('Permission ID is required', 400);
    }
    
    const result = await advancedPermissionsService.grantTemporaryPermission(
      userId,
      permissionId,
      {
        expiresIn,
        reason,
        grantedBy: req.user._id
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Temporary permission granted successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to grant temporary permission:', error);
    next(error);
  }
};

/**
 * Revoke temporary permission from user
 */
exports.revokeTemporaryPermission = async (req, res, next) => {
  try {
    const { userId, permissionId } = req.params;
    
    const result = await advancedPermissionsService.revokeTemporaryPermission(
      userId,
      permissionId
    );
    
    res.status(200).json({
      success: true,
      message: 'Temporary permission revoked successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to revoke temporary permission:', error);
    next(error);
  }
};

/**
 * Assign permission context to user
 */
exports.assignPermissionContext = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { contextId } = req.body;
    
    if (!contextId) {
      throw new AppError('Context ID is required', 400);
    }
    
    const result = await advancedPermissionsService.assignPermissionContext(
      userId,
      contextId,
      {
        assignedBy: req.user._id
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Permission context assigned successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to assign permission context:', error);
    next(error);
  }
};

/**
 * Remove permission context from user
 */
exports.removePermissionContext = async (req, res, next) => {
  try {
    const { userId, contextId } = req.params;
    
    const result = await advancedPermissionsService.removePermissionContext(
      userId,
      contextId
    );
    
    res.status(200).json({
      success: true,
      message: 'Permission context removed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to remove permission context:', error);
    next(error);
  }
};

/**
 * Set resource permission override
 */
exports.setResourcePermissionOverride = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { resourceType, resourceId, permissions, expiresIn } = req.body;
    
    if (!resourceType || !resourceId || !permissions) {
      throw new AppError('Resource type, resource ID, and permissions are required', 400);
    }
    
    const result = await advancedPermissionsService.setResourcePermissionOverride(
      userId,
      resourceType,
      resourceId,
      permissions,
      {
        expiresIn,
        assignedBy: req.user._id
      }
    );
    
    res.status(200).json({
      success: true,
      message: 'Resource permission override set successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to set resource permission override:', error);
    next(error);
  }
};

/**
 * Remove resource permission override
 */
exports.removeResourcePermissionOverride = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { resourceType, resourceId } = req.params;
    
    const result = await advancedPermissionsService.removeResourcePermissionOverride(
      userId,
      resourceType,
      resourceId
    );
    
    res.status(200).json({
      success: true,
      message: 'Resource permission override removed successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to remove resource permission override:', error);
    next(error);
  }
};

/**
 * Clear user permission cache
 */
exports.clearUserPermissionCache = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const result = await advancedPermissionsService.clearUserPermissionCache(userId);
    
    res.status(200).json({
      success: true,
      message: 'User permission cache cleared successfully',
      data: result
    });
  } catch (error) {
    logger.error('Failed to clear user permission cache:', error);
    next(error);
  }
}; 