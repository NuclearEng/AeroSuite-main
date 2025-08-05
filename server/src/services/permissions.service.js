// Task: TS036 - User Permissions Core Framework
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const { AppError } = require('../utils/errorHandler');
const logger = require('../infrastructure/logger');
const cache = require('../utils/cache');

class PermissionsService {
  /**
   * Initialize system permissions and roles
   */
  async initializeSystem() {
    try {
      logger.info('Initializing permissions system...');
      
      // Create system permissions
      await Permission.createSystemPermissions();
      logger.info('System permissions created');
      
      // Create system roles
      await Role.createSystemRoles();
      logger.info('System roles created');
      
      return { success: true };
    } catch (error) {
      logger.error('Failed to initialize permissions system:', error);
      throw error;
    }
  }

  /**
   * Check if user has permission
   */
  async checkUserPermission(userId, resource, action) {
    try {
      // Try to get from cache first
      const cacheKey = `user_perm:${userId}:${resource}:${action}`;
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Get user with role and permissions
      const user = await User.findById(userId)
        .populate({
          path: 'role',
          populate: {
            path: 'permissions'
          }
        })
        .populate('additionalPermissions')
        .populate('temporaryPermissions.permission');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Check if user is active
      if (!user.isActive) {
        await cache.set(cacheKey, false, 300); // Cache for 5 minutes
        return false;
      }

      // Collect all permissions
      const permissions = new Set();

      // Add role permissions
      if (user.role) {
        const effectivePermissions = await user.role.getEffectivePermissions();
        effectivePermissions.forEach(p => permissions.add(p));
      }

      // Add additional permissions
      user.additionalPermissions.forEach(p => {
        if (p.isActive) permissions.add(p);
      });

      // Add temporary permissions
      const now = new Date();
      user.temporaryPermissions.forEach(tp => {
        if (tp.isActive && tp.expiresAt > now) {
          permissions.add(tp.permission);
        }
      });

      // Check if user has the required permission
      const hasPermission = Array.from(permissions).some(p => 
        p.resource === resource && p.actions.includes(action)
      );

      // Check for superadmin (has all permissions)
      if (user.role?.name === 'superadmin') {
        await cache.set(cacheKey, true, 300);
        return true;
      }

      // Cache the result
      await cache.set(cacheKey, hasPermission, 300); // Cache for 5 minutes
      
      return hasPermission;
    } catch (error) {
      logger.error('Error checking user permission:', error);
      throw error;
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId) {
    try {
      const user = await User.findById(userId)
        .populate({
          path: 'role',
          populate: {
            path: 'permissions'
          }
        })
        .populate('additionalPermissions')
        .populate('temporaryPermissions.permission');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const permissions = new Map();

      // Add role permissions
      if (user.role) {
        const effectivePermissions = await user.role.getEffectivePermissions();
        effectivePermissions.forEach(p => {
          permissions.set(p._id.toString(), {
            ...p.toObject(),
            source: 'role',
            roleName: user.role.displayName
          });
        });
      }

      // Add additional permissions
      user.additionalPermissions.forEach(p => {
        if (p.isActive) {
          permissions.set(p._id.toString(), {
            ...p.toObject(),
            source: 'additional'
          });
        }
      });

      // Add temporary permissions
      const now = new Date();
      user.temporaryPermissions.forEach(tp => {
        if (tp.isActive && tp.expiresAt > now) {
          permissions.set(tp.permission._id.toString(), {
            ...tp.permission.toObject(),
            source: 'temporary',
            expiresAt: tp.expiresAt
          });
        }
      });

      return {
        user: {
          id: user._id,
          email: user.email,
          role: user.role
        },
        permissions: Array.from(permissions.values())
      };
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId, roleId, assignedBy) {
    try {
      const [user, role] = await Promise.all([
        User.findById(userId),
        Role.findById(roleId).populate('permissions')
      ]);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      if (!role.isActive) {
        throw new AppError('Role is not active', 400);
      }

      // Check if role requires approval
      if (role.restrictions.requiresApproval) {
        // Create approval request (implement approval workflow)
        throw new AppError('Role assignment requires approval', 403);
      }

      // Check max users restriction
      if (role.restrictions.maxUsers > 0) {
        const currentUsers = await User.countDocuments({ role: roleId });
        if (currentUsers >= role.restrictions.maxUsers) {
          throw new AppError('Maximum users for this role reached', 400);
        }
      }

      // Check if user needs MFA for this role
      if (role.restrictions.requiresMFA && !user.mfaEnabled) {
        throw new AppError('MFA must be enabled for this role', 400);
      }

      // Store previous role for audit
      const previousRole = user.role;

      // Assign role
      user.role = roleId;
      await user.save();

      // Clear permission cache
      await this.clearUserPermissionCache(userId);

      // Log the role assignment
      await logger.audit({
        userId: assignedBy,
        action: 'role_assigned',
        category: 'permissions',
        metadata: {
          targetUserId: userId,
          previousRole: previousRole,
          newRole: roleId,
          roleName: role.displayName
        }
      });

      return {
        user: user.toObject(),
        role: role.toObject()
      };
    } catch (error) {
      logger.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Grant additional permission to user
   */
  async grantPermission(userId, permissionId, grantedBy, options = {}) {
    try {
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
        throw new AppError('Permission is not active', 400);
      }

      // Check if permission requires MFA
      if (permission.metadata.requiresMFA && !user.mfaEnabled) {
        throw new AppError('MFA must be enabled for this permission', 400);
      }

      // Check if user already has this permission
      const hasPermission = user.additionalPermissions.some(
        p => p.toString() === permissionId
      );

      if (hasPermission) {
        throw new AppError('User already has this permission', 400);
      }

      // Add permission
      if (options.temporary && options.expiresAt) {
        // Add as temporary permission
        user.temporaryPermissions.push({
          permission: permissionId,
          grantedBy,
          grantedAt: new Date(),
          expiresAt: options.expiresAt,
          reason: options.reason,
          isActive: true
        });
      } else {
        // Add as permanent additional permission
        user.additionalPermissions.push(permissionId);
      }

      await user.save();

      // Clear permission cache
      await this.clearUserPermissionCache(userId);

      // Log the permission grant
      await logger.audit({
        userId: grantedBy,
        action: 'permission_granted',
        category: 'permissions',
        metadata: {
          targetUserId: userId,
          permissionId,
          permissionName: permission.name,
          temporary: !!options.temporary,
          expiresAt: options.expiresAt
        }
      });

      return {
        user: user.toObject(),
        permission: permission.toObject()
      };
    } catch (error) {
      logger.error('Error granting permission:', error);
      throw error;
    }
  }

  /**
   * Revoke permission from user
   */
  async revokePermission(userId, permissionId, revokedBy) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Remove from additional permissions
      const hadAdditional = user.additionalPermissions.some(
        p => p.toString() === permissionId
      );
      
      if (hadAdditional) {
        user.additionalPermissions = user.additionalPermissions.filter(
          p => p.toString() !== permissionId
        );
      }

      // Remove from temporary permissions
      const hadTemporary = user.temporaryPermissions.some(
        tp => tp.permission.toString() === permissionId
      );
      
      if (hadTemporary) {
        user.temporaryPermissions = user.temporaryPermissions.filter(
          tp => tp.permission.toString() !== permissionId
        );
      }

      if (!hadAdditional && !hadTemporary) {
        throw new AppError('User does not have this permission', 400);
      }

      await user.save();

      // Clear permission cache
      await this.clearUserPermissionCache(userId);

      // Log the permission revocation
      await logger.audit({
        userId: revokedBy,
        action: 'permission_revoked',
        category: 'permissions',
        metadata: {
          targetUserId: userId,
          permissionId
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Error revoking permission:', error);
      throw error;
    }
  }

  /**
   * Create custom role
   */
  async createRole(roleData, createdBy) {
    try {
      // Validate permissions exist
      if (roleData.permissions && roleData.permissions.length > 0) {
        const permissions = await Permission.find({
          _id: { $in: roleData.permissions },
          isActive: true
        });

        if (permissions.length !== roleData.permissions.length) {
          throw new AppError('Some permissions are invalid or inactive', 400);
        }
      }

      // Create role
      const role = await Role.create({
        ...roleData,
        createdBy,
        isSystem: false
      });

      // Log role creation
      await logger.audit({
        userId: createdBy,
        action: 'role_created',
        category: 'permissions',
        metadata: {
          roleId: role._id,
          roleName: role.name
        }
      });

      return role;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(roleId, updates, modifiedBy) {
    try {
      const role = await Role.findById(roleId);

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      if (role.isSystem) {
        throw new AppError('Cannot modify system roles', 403);
      }

      // Store original for audit
      const original = role.toObject();

      // Update role
      Object.assign(role, updates);
      role.modifiedBy = modifiedBy;
      await role.save();

      // Clear permission cache for all users with this role
      await this.clearRolePermissionCache(roleId);

      // Log role update
      await logger.audit({
        userId: modifiedBy,
        action: 'role_updated',
        category: 'permissions',
        metadata: {
          roleId,
          roleName: role.name,
          changes: updates,
          original
        }
      });

      return role;
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete custom role
   */
  async deleteRole(roleId, deletedBy) {
    try {
      const role = await Role.findById(roleId);

      if (!role) {
        throw new AppError('Role not found', 404);
      }

      if (role.isSystem) {
        throw new AppError('Cannot delete system roles', 403);
      }

      // Check if role is in use
      const userCount = await User.countDocuments({ role: roleId });
      if (userCount > 0) {
        throw new AppError(`Cannot delete role. ${userCount} users have this role.`, 400);
      }

      // Delete role
      await role.remove();

      // Log role deletion
      await logger.audit({
        userId: deletedBy,
        action: 'role_deleted',
        category: 'permissions',
        metadata: {
          roleId,
          roleName: role.name
        }
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Get permission matrix for all roles
   */
  async getPermissionMatrix() {
    try {
      const [roles, permissions] = await Promise.all([
        Role.find({ isActive: true })
          .populate('permissions')
          .sort('hierarchy.level'),
        Permission.find({ isActive: true })
          .sort('category resource name')
      ]);

      const matrix = {
        roles: roles.map(r => ({
          id: r._id,
          name: r.name,
          displayName: r.displayName,
          level: r.hierarchy.level,
          userCount: 0 // Will be populated if needed
        })),
        permissions: permissions.map(p => ({
          id: p._id,
          name: p.name,
          displayName: p.displayName,
          resource: p.resource,
          actions: p.actions,
          category: p.category
        })),
        assignments: {}
      };

      // Build assignment matrix
      roles.forEach(role => {
        matrix.assignments[role._id] = {};
        permissions.forEach(permission => {
          matrix.assignments[role._id][permission._id] = 
            role.permissions.some(p => p._id.equals(permission._id));
        });
      });

      return matrix;
    } catch (error) {
      logger.error('Error getting permission matrix:', error);
      throw error;
    }
  }

  /**
   * Clear user permission cache
   */
  async clearUserPermissionCache(userId) {
    try {
      const pattern = `user_perm:${userId}:*`;
      await cache.deletePattern(pattern);
    } catch (error) {
      logger.error('Error clearing user permission cache:', error);
    }
  }

  /**
   * Clear role permission cache
   */
  async clearRolePermissionCache(roleId) {
    try {
      // Get all users with this role
      const users = await User.find({ role: roleId }).select('_id');
      
      // Clear cache for each user
      await Promise.all(
        users.map(user => this.clearUserPermissionCache(user._id))
      );
    } catch (error) {
      logger.error('Error clearing role permission cache:', error);
    }
  }

  /**
   * Check expired temporary permissions
   */
  async cleanupExpiredPermissions() {
    try {
      const now = new Date();
      
      // Find users with expired temporary permissions
      const users = await User.find({
        'temporaryPermissions.expiresAt': { $lt: now }
      });

      let cleaned = 0;
      
      for (const user of users) {
        const before = user.temporaryPermissions.length;
        
        // Remove expired permissions
        user.temporaryPermissions = user.temporaryPermissions.filter(
          tp => tp.expiresAt > now
        );
        
        if (before !== user.temporaryPermissions.length) {
          await user.save();
          await this.clearUserPermissionCache(user._id);
          cleaned++;
        }
      }

      logger.info(`Cleaned up expired permissions for ${cleaned} users`);
      
      return { cleaned };
    } catch (error) {
      logger.error('Error cleaning up expired permissions:', error);
      throw error;
    }
  }
}

module.exports = new PermissionsService(); 