/**
 * Advanced Permissions Service
 * 
 * Provides methods for managing the enhanced permissions system
 * 
 * @task TS378 - Advanced user permissions management
 */

const mongoose = require('mongoose');
const User = mongoose.model('User');
const Role = mongoose.model('Role');
const Permission = mongoose.model('Permission');
const PermissionGroup = mongoose.model('PermissionGroup');
const PermissionContext = mongoose.model('PermissionContext');
const { AppError } = require('../utils/errorHandler');
const logger = require('../infrastructure/logger');
const cache = require('../utils/cache');

class AdvancedPermissionsService {
  /**
   * Initialize the advanced permissions system
   */
  async initialize() {
    try {
      logger.info('Initializing advanced permissions system...');
      
      // Create permission groups
      await PermissionGroup.createDefaultGroups();
      logger.info('Permission groups created');
      
      // Assign permissions to groups
      await PermissionGroup.assignPermissionsToGroups();
      logger.info('Permissions assigned to groups');
      
      // Create permission contexts
      await PermissionContext.createDefaultContexts();
      logger.info('Permission contexts created');
      
      // Migrate users to new permission structure
      await this.migrateUsersToNewStructure();
      logger.info('Users migrated to new permission structure');
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize advanced permissions system:', error);
      throw error;
    }
  }
  
  /**
   * Migrate users to the new permission structure
   */
  async migrateUsersToNewStructure() {
    try {
      // Get all users with legacy role structure
      const users = await User.find({
        role: { $exists: true },
        'permissions.role': { $exists: false }
      });
      
      logger.info(`Migrating ${users.length} users to new permission structure`);
      
      // Migrate each user
      for (const user of users) {
        await user.migratePermissions();
      }
      
      return { success: true, migratedCount: users.length };
    } catch (error) {
      logger.error('Error migrating users to new permission structure:', error);
      throw error;
    }
  }
  
  /**
   * Grant temporary permission to user
   */
  async grantTemporaryPermission(userId, permissionId, options = {}) {
    try {
      const {
        expiresIn = 86400000, // Default 24 hours in milliseconds
        reason = 'Temporary access grant',
        grantedBy
      } = options;
      
      // Validate inputs
      const [user, permission] = await Promise.all([
        User.findById(userId),
        Permission.findById(permissionId)
      ]);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (!permission) {
        throw new AppError('Permission not found', 404);
      }
      
      if (!permission.isActive) {
        throw new AppError('Cannot grant inactive permission', 400);
      }
      
      // Calculate expiration date
      const expiresAt = new Date(Date.now() + expiresIn);
      
      // Add temporary permission
      if (!user.permissions) {
        user.permissions = {
          temporary: []
        };
      }
      
      if (!user.permissions.temporary) {
        user.permissions.temporary = [];
      }
      
      // Check if permission is already granted
      const existingIndex = user.permissions.temporary.findIndex(
        tp => tp.permission.toString() === permissionId.toString()
      );
      
      if (existingIndex >= 0) {
        // Update existing temporary permission
        user.permissions.temporary[existingIndex] = {
          permission: permissionId,
          expiresAt,
          grantedBy,
          grantedAt: new Date(),
          reason
        };
      } else {
        // Add new temporary permission
        user.permissions.temporary.push({
          permission: permissionId,
          expiresAt,
          grantedBy,
          grantedAt: new Date(),
          reason
        });
      }
      
      // Update last updated timestamp
      user.permissions.lastUpdated = new Date();
      
      // Save user
      await user.save();
      
      // Clear permission cache
      await this.clearUserPermissionCache(userId);
      
      // Log the action
      logger.info(`Temporary permission ${permission.name} granted to user ${userId}`, {
        userId,
        permissionId,
        expiresAt,
        grantedBy
      });
      
      return {
        success: true,
        user: user._id,
        permission: permission.name,
        expiresAt
      };
    } catch (error) {
      logger.error('Error granting temporary permission:', error);
      throw error;
    }
  }
  
  /**
   * Revoke temporary permission from user
   */
  async revokeTemporaryPermission(userId, permissionId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (!user.permissions?.temporary?.length) {
        throw new AppError('User has no temporary permissions', 404);
      }
      
      // Find and remove the temporary permission
      const initialLength = user.permissions.temporary.length;
      user.permissions.temporary = user.permissions.temporary.filter(
        tp => tp.permission.toString() !== permissionId.toString()
      );
      
      if (user.permissions.temporary.length === initialLength) {
        throw new AppError('Temporary permission not found', 404);
      }
      
      // Update last updated timestamp
      user.permissions.lastUpdated = new Date();
      
      // Save user
      await user.save();
      
      // Clear permission cache
      await this.clearUserPermissionCache(userId);
      
      // Log the action
      logger.info(`Temporary permission ${permissionId} revoked from user ${userId}`);
      
      return {
        success: true,
        user: user._id
      };
    } catch (error) {
      logger.error('Error revoking temporary permission:', error);
      throw error;
    }
  }
  
  /**
   * Assign permission context to user
   */
  async assignPermissionContext(userId, contextId, options = {}) {
    try {
      const { assignedBy } = options;
      
      // Validate inputs
      const [user, context] = await Promise.all([
        User.findById(userId),
        PermissionContext.findById(contextId)
      ]);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (!context) {
        throw new AppError('Permission context not found', 404);
      }
      
      if (!context.isActive) {
        throw new AppError('Cannot assign inactive permission context', 400);
      }
      
      // Initialize permissions structure if needed
      if (!user.permissions) {
        user.permissions = {
          contexts: []
        };
      }
      
      if (!user.permissions.contexts) {
        user.permissions.contexts = [];
      }
      
      // Check if context is already assigned
      const existingIndex = user.permissions.contexts.findIndex(
        c => c.context.toString() === contextId.toString()
      );
      
      if (existingIndex >= 0) {
        // Update existing context
        user.permissions.contexts[existingIndex] = {
          context: contextId,
          isActive: true,
          assignedAt: new Date(),
          assignedBy
        };
      } else {
        // Add new context
        user.permissions.contexts.push({
          context: contextId,
          isActive: true,
          assignedAt: new Date(),
          assignedBy
        });
      }
      
      // Update last updated timestamp
      user.permissions.lastUpdated = new Date();
      
      // Save user
      await user.save();
      
      // Clear permission cache
      await this.clearUserPermissionCache(userId);
      
      // Log the action
      logger.info(`Permission context ${context.name} assigned to user ${userId}`, {
        userId,
        contextId,
        assignedBy
      });
      
      return {
        success: true,
        user: user._id,
        context: context.name
      };
    } catch (error) {
      logger.error('Error assigning permission context:', error);
      throw error;
    }
  }
  
  /**
   * Remove permission context from user
   */
  async removePermissionContext(userId, contextId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (!user.permissions?.contexts?.length) {
        throw new AppError('User has no permission contexts', 404);
      }
      
      // Find and remove the context
      const initialLength = user.permissions.contexts.length;
      user.permissions.contexts = user.permissions.contexts.filter(
        c => c.context.toString() !== contextId.toString()
      );
      
      if (user.permissions.contexts.length === initialLength) {
        throw new AppError('Permission context not found', 404);
      }
      
      // Update last updated timestamp
      user.permissions.lastUpdated = new Date();
      
      // Save user
      await user.save();
      
      // Clear permission cache
      await this.clearUserPermissionCache(userId);
      
      // Log the action
      logger.info(`Permission context ${contextId} removed from user ${userId}`);
      
      return {
        success: true,
        user: user._id
      };
    } catch (error) {
      logger.error('Error removing permission context:', error);
      throw error;
    }
  }
  
  /**
   * Set resource-specific permission override
   */
  async setResourcePermissionOverride(userId, resourceType, resourceId, permissions, options = {}) {
    try {
      const { 
        expiresIn = null, // No expiration by default
        assignedBy 
      } = options;
      
      // Validate inputs
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      // Validate resource exists
      const resourceObj = await this.getResourceObject(resourceType, resourceId);
      
      if (!resourceObj) {
        throw new AppError(`Resource ${resourceType} with ID ${resourceId} not found`, 404);
      }
      
      // Validate permissions
      if (!permissions || (!permissions.granted?.length && !permissions.denied?.length)) {
        throw new AppError('No permissions specified', 400);
      }
      
      // Initialize permissions structure if needed
      if (!user.permissions) {
        user.permissions = {
          resourceOverrides: []
        };
      }
      
      if (!user.permissions.resourceOverrides) {
        user.permissions.resourceOverrides = [];
      }
      
      // Calculate expiration date if provided
      const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : null;
      
      // Check if override already exists
      const existingIndex = user.permissions.resourceOverrides.findIndex(
        o => o.resourceType === resourceType && o.resourceId.toString() === resourceId.toString()
      );
      
      if (existingIndex >= 0) {
        // Update existing override
        user.permissions.resourceOverrides[existingIndex] = {
          resourceType,
          resourceId,
          permissions: {
            granted: permissions.granted || [],
            denied: permissions.denied || []
          },
          expiresAt,
          assignedBy,
          assignedAt: new Date()
        };
      } else {
        // Add new override
        user.permissions.resourceOverrides.push({
          resourceType,
          resourceId,
          permissions: {
            granted: permissions.granted || [],
            denied: permissions.denied || []
          },
          expiresAt,
          assignedBy,
          assignedAt: new Date()
        });
      }
      
      // Update last updated timestamp
      user.permissions.lastUpdated = new Date();
      
      // Save user
      await user.save();
      
      // Clear permission cache
      await this.clearUserPermissionCache(userId);
      
      // Log the action
      logger.info(`Resource permission override set for user ${userId} on ${resourceType}:${resourceId}`, {
        userId,
        resourceType,
        resourceId,
        permissions,
        assignedBy
      });
      
      return {
        success: true,
        user: user._id,
        resourceType,
        resourceId
      };
    } catch (error) {
      logger.error('Error setting resource permission override:', error);
      throw error;
    }
  }
  
  /**
   * Remove resource-specific permission override
   */
  async removeResourcePermissionOverride(userId, resourceType, resourceId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      if (!user.permissions?.resourceOverrides?.length) {
        throw new AppError('User has no resource permission overrides', 404);
      }
      
      // Find and remove the override
      const initialLength = user.permissions.resourceOverrides.length;
      user.permissions.resourceOverrides = user.permissions.resourceOverrides.filter(
        o => !(o.resourceType === resourceType && o.resourceId.toString() === resourceId.toString())
      );
      
      if (user.permissions.resourceOverrides.length === initialLength) {
        throw new AppError('Resource permission override not found', 404);
      }
      
      // Update last updated timestamp
      user.permissions.lastUpdated = new Date();
      
      // Save user
      await user.save();
      
      // Clear permission cache
      await this.clearUserPermissionCache(userId);
      
      // Log the action
      logger.info(`Resource permission override removed for user ${userId} on ${resourceType}:${resourceId}`);
      
      return {
        success: true,
        user: user._id,
        resourceType,
        resourceId
      };
    } catch (error) {
      logger.error('Error removing resource permission override:', error);
      throw error;
    }
  }
  
  /**
   * Get all permission groups
   */
  async getPermissionGroups() {
    try {
      const groups = await PermissionGroup.find({ isActive: true })
        .populate('permissions')
        .sort({ category: 1, displayName: 1 });
      
      return groups;
    } catch (error) {
      logger.error('Error getting permission groups:', error);
      throw error;
    }
  }
  
  /**
   * Get all permission contexts
   */
  async getPermissionContexts() {
    try {
      const contexts = await PermissionContext.find({ isActive: true })
        .populate('permissions')
        .sort({ resourceType: 1, displayName: 1 });
      
      return contexts;
    } catch (error) {
      logger.error('Error getting permission contexts:', error);
      throw error;
    }
  }
  
  /**
   * Get user's effective permissions with source information
   */
  async getUserEffectivePermissionsWithSources(userId) {
    try {
      const user = await User.findById(userId)
        .populate({
          path: 'permissions.role',
          populate: {
            path: 'permissions'
          }
        })
        .populate('permissions.custom.granted')
        .populate('permissions.custom.denied')
        .populate({
          path: 'permissions.temporary.permission'
        })
        .populate({
          path: 'permissions.contexts.context',
          populate: {
            path: 'permissions'
          }
        });
      
      if (!user) {
        throw new AppError('User not found', 404);
      }
      
      // Collect permissions with sources
      const permissionsWithSources = new Map();
      
      // Role permissions
      if (user.permissions?.role) {
        const role = user.permissions.role;
        const rolePermissions = role.permissions || [];
        
        rolePermissions.forEach(p => {
          permissionsWithSources.set(p._id.toString(), {
            permission: p,
            sources: [{
              type: 'role',
              name: role.displayName || role.name,
              id: role._id
            }]
          });
        });
      } else if (user.role) {
        // Legacy role handling
        const Role = mongoose.model('Role');
        const role = await Role.findOne({ name: user.role }).populate('permissions');
        
        if (role) {
          const rolePermissions = role.permissions || [];
          
          rolePermissions.forEach(p => {
            permissionsWithSources.set(p._id.toString(), {
              permission: p,
              sources: [{
                type: 'role',
                name: role.displayName || role.name,
                id: role._id
              }]
            });
          });
        }
      }
      
      // Custom granted permissions
      if (user.permissions?.custom?.granted?.length) {
        user.permissions.custom.granted.forEach(p => {
          if (p) {
            const permId = p._id.toString();
            if (permissionsWithSources.has(permId)) {
              permissionsWithSources.get(permId).sources.push({
                type: 'custom',
                name: 'Custom Grant'
              });
            } else {
              permissionsWithSources.set(permId, {
                permission: p,
                sources: [{
                  type: 'custom',
                  name: 'Custom Grant'
                }]
              });
            }
          }
        });
      }
      
      // Temporary permissions
      if (user.permissions?.temporary?.length) {
        const now = new Date();
        user.permissions.temporary
          .filter(tp => tp.expiresAt > now)
          .forEach(tp => {
            if (tp.permission) {
              const permId = tp.permission._id.toString();
              if (permissionsWithSources.has(permId)) {
                permissionsWithSources.get(permId).sources.push({
                  type: 'temporary',
                  name: 'Temporary Grant',
                  expiresAt: tp.expiresAt,
                  reason: tp.reason
                });
              } else {
                permissionsWithSources.set(permId, {
                  permission: tp.permission,
                  sources: [{
                    type: 'temporary',
                    name: 'Temporary Grant',
                    expiresAt: tp.expiresAt,
                    reason: tp.reason
                  }]
                });
              }
            }
          });
      }
      
      // Context permissions
      if (user.permissions?.contexts?.length) {
        user.permissions.contexts
          .filter(c => c.isActive && c.context)
          .forEach(c => {
            const context = c.context;
            if (context.permissions?.length) {
              context.permissions.forEach(p => {
                const permId = p._id.toString();
                if (permissionsWithSources.has(permId)) {
                  permissionsWithSources.get(permId).sources.push({
                    type: 'context',
                    name: context.displayName,
                    id: context._id,
                    description: context.description
                  });
                } else {
                  permissionsWithSources.set(permId, {
                    permission: p,
                    sources: [{
                      type: 'context',
                      name: context.displayName,
                      id: context._id,
                      description: context.description
                    }]
                  });
                }
              });
            }
          });
      }
      
      // Remove denied permissions
      const deniedPermissions = new Set();
      
      if (user.permissions?.custom?.denied?.length) {
        user.permissions.custom.denied.forEach(p => {
          if (p) deniedPermissions.add(p._id.toString());
        });
      }
      
      // Filter out denied permissions
      const effectivePermissions = Array.from(permissionsWithSources.values())
        .filter(p => !deniedPermissions.has(p.permission._id.toString()));
      
      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        permissions: effectivePermissions,
        deniedPermissions: Array.from(deniedPermissions)
      };
    } catch (error) {
      logger.error('Error getting user effective permissions with sources:', error);
      throw error;
    }
  }
  
  /**
   * Clear user permission cache
   */
  async clearUserPermissionCache(userId) {
    try {
      // Clear effective permissions cache
      await cache.delete(`user_effective_permissions:${userId}`);
      
      // Clear specific permission caches
      const keys = await cache.keys(`user_perm:${userId}:*`);
      for (const key of keys) {
        await cache.delete(key);
      }
      
      return { success: true };
    } catch (error) {
      logger.error('Error clearing user permission cache:', error);
      throw error;
    }
  }
  
  /**
   * Get resource object by type and ID
   */
  async getResourceObject(resourceType, resourceId) {
    try {
      // Map resource type to mongoose model
      const modelMap = {
        'customer': 'Customer',
        'supplier': 'Supplier',
        'inspection': 'Inspection',
        'report': 'Report',
        'user': 'User',
        'document': 'Document',
        'component': 'Component'
        // Add more mappings as needed
      };
  
      const modelName = modelMap[resourceType];
      if (!modelName) {
        throw new Error(`Unknown resource type: ${resourceType}`);
      }
  
      const Model = mongoose.model(modelName);
      
      return await Model.findById(resourceId);
    } catch (error) {
      logger.error(`Error getting resource object: ${error.message}`, { error });
      throw error;
    }
  }
}

module.exports = new AdvancedPermissionsService(); 