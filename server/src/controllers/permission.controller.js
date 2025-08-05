const Permission = require('../models/permission.model');
const Role = require('../models/role.model');
const User = require('../models/user.model');
const { clearUserPermissionsCache } = require('../middleware/permission.middleware');
const { BadRequestError, NotFoundError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Get all permissions
 */
exports.getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.getAllPermissions();
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    logger.error(`Error getting permissions: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Get permissions by category
 */
exports.getPermissionsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return next(new BadRequestError('Category is required'));
    }
    
    const permissions = await Permission.getPermissionsByCategory(category);
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    logger.error(`Error getting permissions by category: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Get permissions by categories
 */
exports.getPermissionsByCategories = async (req, res, next) => {
  try {
    const { categories } = req.body;
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return next(new BadRequestError('Valid categories array is required'));
    }
    
    const permissions = await Permission.getPermissionsByCategories(categories);
    
    res.status(200).json({
      success: true,
      count: permissions.length,
      data: permissions
    });
  } catch (error) {
    logger.error(`Error getting permissions by categories: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Create a new permission
 */
exports.createPermission = async (req, res, next) => {
  try {
    const { name, description, category, action, resource } = req.body;
    
    // Check if permission already exists
    const existingPermission = await Permission.findOne({ name });
    if (existingPermission) {
      return next(new BadRequestError('Permission with this name already exists'));
    }
    
    // Create new permission
    const permission = await Permission.create({
      name,
      description,
      category,
      action,
      resource
    });
    
    res.status(201).json({
      success: true,
      data: permission
    });
  } catch (error) {
    logger.error(`Error creating permission: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Update a permission
 */
exports.updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, category, action, resource, isActive } = req.body;
    
    // Find the permission
    const permission = await Permission.findById(id);
    if (!permission) {
      return next(new NotFoundError('Permission not found'));
    }
    
    // Don't allow updating the name as it's used as a reference
    if (req.body.name) {
      return next(new BadRequestError('Permission name cannot be changed'));
    }
    
    // Update permission
    if (description !== undefined) permission.description = description;
    if (category !== undefined) permission.category = category;
    if (action !== undefined) permission.action = action;
    if (resource !== undefined) permission.resource = resource;
    if (isActive !== undefined) permission.isActive = isActive;
    
    await permission.save();
    
    // Clear permission cache for all users as a permission has changed
    clearUserPermissionsCache();
    
    res.status(200).json({
      success: true,
      data: permission
    });
  } catch (error) {
    logger.error(`Error updating permission: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Delete a permission
 */
exports.deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the permission
    const permission = await Permission.findById(id);
    if (!permission) {
      return next(new NotFoundError('Permission not found'));
    }
    
    // Instead of deleting, mark as inactive
    permission.isActive = false;
    await permission.save();
    
    // Clear permission cache for all users
    clearUserPermissionsCache();
    
    res.status(200).json({
      success: true,
      message: 'Permission marked as inactive'
    });
  } catch (error) {
    logger.error(`Error deleting permission: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Initialize default permissions and roles
 */
exports.initializeSystem = async (req, res, next) => {
  try {
    // Generate default permissions
    const permissionResult = await Permission.generateDefaultPermissions();
    
    // Generate default roles
    const roleResult = await Role.generateDefaultRoles();
    
    res.status(200).json({
      success: true,
      message: 'Default permissions and roles initialized',
      permissions: permissionResult,
      roles: roleResult
    });
  } catch (error) {
    logger.error(`Error initializing system: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Get all roles
 */
exports.getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.getAllRoles();
    
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    logger.error(`Error getting roles: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Get role by name
 */
exports.getRoleByName = async (req, res, next) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return next(new BadRequestError('Role name is required'));
    }
    
    const role = await Role.getRoleByName(name);
    
    if (!role) {
      return next(new NotFoundError('Role not found'));
    }
    
    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    logger.error(`Error getting role: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Get role permissions
 */
exports.getRolePermissions = async (req, res, next) => {
  try {
    const { name } = req.params;
    
    if (!name) {
      return next(new BadRequestError('Role name is required'));
    }
    
    const role = await Role.getRoleByName(name);
    
    if (!role) {
      return next(new NotFoundError('Role not found'));
    }
    
    res.status(200).json({
      success: true,
      count: role.permissions.length,
      data: role.permissions
    });
  } catch (error) {
    logger.error(`Error getting role permissions: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Create a new role
 */
exports.createRole = async (req, res, next) => {
  try {
    const { name, description, permissions, priority } = req.body;
    
    // Check if role already exists
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return next(new BadRequestError('Role with this name already exists'));
    }
    
    // Validate permissions if provided
    if (permissions && permissions.length > 0) {
      const allPermissions = await Permission.getAllPermissionNames();
      const invalidPermissions = permissions.filter(p => !allPermissions.includes(p));
      
      if (invalidPermissions.length > 0) {
        return next(new BadRequestError(`Invalid permissions: ${invalidPermissions.join(', ')}`));
      }
    }
    
    // Create new role
    const role = await Role.create({
      name,
      description,
      permissions: permissions || [],
      priority: priority || 0
    });
    
    res.status(201).json({
      success: true,
      data: role
    });
  } catch (error) {
    logger.error(`Error creating role: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Update a role
 */
exports.updateRole = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { description, isActive, priority } = req.body;
    
    // Find the role
    const role = await Role.findOne({ name });
    if (!role) {
      return next(new NotFoundError('Role not found'));
    }
    
    // Don't allow updating system roles (except for description)
    if (role.isSystem && (req.body.name || req.body.isSystem === false)) {
      return next(new BadRequestError('System roles cannot be renamed or deleted'));
    }
    
    // Update role
    if (req.body.name && req.body.name !== name) {
      // Check if new name is already taken
      const existingRole = await Role.findOne({ name: req.body.name });
      if (existingRole) {
        return next(new BadRequestError('Role with this name already exists'));
      }
      role.name = req.body.name;
    }
    
    if (description !== undefined) role.description = description;
    if (isActive !== undefined && !role.isSystem) role.isActive = isActive;
    if (priority !== undefined) role.priority = priority;
    
    await role.save();
    
    // Clear permission cache for all users as a role has changed
    clearUserPermissionsCache();
    
    res.status(200).json({
      success: true,
      data: role
    });
  } catch (error) {
    logger.error(`Error updating role: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Update role permissions
 */
exports.updateRolePermissions = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      return next(new BadRequestError('Permissions must be an array'));
    }
    
    // Validate permissions
    const allPermissions = await Permission.getAllPermissionNames();
    const invalidPermissions = permissions.filter(p => !allPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      return next(new BadRequestError(`Invalid permissions: ${invalidPermissions.join(', ')}`));
    }
    
    // Update role permissions
    const updatedRole = await Role.setRolePermissions(name, permissions);
    
    if (!updatedRole) {
      return next(new NotFoundError('Role not found or inactive'));
    }
    
    // Clear permission cache for all users as role permissions have changed
    clearUserPermissionsCache();
    
    res.status(200).json({
      success: true,
      data: updatedRole
    });
  } catch (error) {
    logger.error(`Error updating role permissions: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Add permissions to role
 */
exports.addPermissionsToRole = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return next(new BadRequestError('Valid permissions array is required'));
    }
    
    // Validate permissions
    const allPermissions = await Permission.getAllPermissionNames();
    const invalidPermissions = permissions.filter(p => !allPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      return next(new BadRequestError(`Invalid permissions: ${invalidPermissions.join(', ')}`));
    }
    
    // Add permissions to role
    const updatedRole = await Role.addPermissionsToRole(name, permissions);
    
    if (!updatedRole) {
      return next(new NotFoundError('Role not found or inactive'));
    }
    
    // Clear permission cache for all users as role permissions have changed
    clearUserPermissionsCache();
    
    res.status(200).json({
      success: true,
      data: updatedRole
    });
  } catch (error) {
    logger.error(`Error adding permissions to role: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Remove permissions from role
 */
exports.removePermissionsFromRole = async (req, res, next) => {
  try {
    const { name } = req.params;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return next(new BadRequestError('Valid permissions array is required'));
    }
    
    // Remove permissions from role
    const updatedRole = await Role.removePermissionsFromRole(name, permissions);
    
    if (!updatedRole) {
      return next(new NotFoundError('Role not found or inactive'));
    }
    
    // Clear permission cache for all users as role permissions have changed
    clearUserPermissionsCache();
    
    res.status(200).json({
      success: true,
      data: updatedRole
    });
  } catch (error) {
    logger.error(`Error removing permissions from role: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Delete a role
 */
exports.deleteRole = async (req, res, next) => {
  try {
    const { name } = req.params;
    
    // Find the role
    const role = await Role.findOne({ name });
    if (!role) {
      return next(new NotFoundError('Role not found'));
    }
    
    // Don't allow deleting system roles
    if (role.isSystem) {
      return next(new BadRequestError('System roles cannot be deleted'));
    }
    
    // Check if any users are using this role
    const usersWithRole = await User.countDocuments({ role: name });
    if (usersWithRole > 0) {
      return next(new BadRequestError(`Cannot delete role that is assigned to ${usersWithRole} users`));
    }
    
    // Instead of deleting, mark as inactive
    role.isActive = false;
    await role.save();
    
    res.status(200).json({
      success: true,
      message: 'Role marked as inactive'
    });
  } catch (error) {
    logger.error(`Error deleting role: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Get user permissions
 */
exports.getUserPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findById(id).select('role customPermissions');
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    // Get role permissions
    const role = await Role.findOne({ name: user.role, isActive: true });
    if (!role) {
      return next(new NotFoundError(`Role ${user.role} not found or inactive`));
    }
    
    // Calculate effective permissions
    const rolePermissions = role.permissions || [];
    const grantedPermissions = user.customPermissions?.granted || [];
    const deniedPermissions = user.customPermissions?.denied || [];
    
    // Effective permissions = (role permissions + granted permissions) - denied permissions
    const effectivePermissions = [
      ...new Set([...rolePermissions, ...grantedPermissions])
    ].filter(p => !deniedPermissions.includes(p));
    
    res.status(200).json({
      success: true,
      data: {
        role: user.role,
        rolePermissions,
        customPermissions: {
          granted: grantedPermissions,
          denied: deniedPermissions
        },
        effectivePermissions
      }
    });
  } catch (error) {
    logger.error(`Error getting user permissions: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Update user custom permissions
 */
exports.updateUserPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { granted, denied } = req.body;
    
    // Validate input
    if ((!granted || !Array.isArray(granted)) && (!denied || !Array.isArray(denied))) {
      return next(new BadRequestError('Valid granted or denied permissions array is required'));
    }
    
    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    // Validate permissions if provided
    const allPermissions = await Permission.getAllPermissionNames();
    
    if (granted && granted.length > 0) {
      const invalidGranted = granted.filter(p => !allPermissions.includes(p));
      if (invalidGranted.length > 0) {
        return next(new BadRequestError(`Invalid granted permissions: ${invalidGranted.join(', ')}`));
      }
    }
    
    if (denied && denied.length > 0) {
      const invalidDenied = denied.filter(p => !allPermissions.includes(p));
      if (invalidDenied.length > 0) {
        return next(new BadRequestError(`Invalid denied permissions: ${invalidDenied.join(', ')}`));
      }
    }
    
    // Initialize customPermissions if it doesn't exist
    if (!user.customPermissions) {
      user.customPermissions = { granted: [], denied: [] };
    }
    
    // Update granted permissions if provided
    if (granted) {
      user.customPermissions.granted = granted;
    }
    
    // Update denied permissions if provided
    if (denied) {
      user.customPermissions.denied = denied;
    }
    
    await user.save();
    
    // Clear permission cache for this user
    clearUserPermissionsCache(id);
    
    res.status(200).json({
      success: true,
      message: 'User permissions updated successfully',
      data: user.customPermissions
    });
  } catch (error) {
    logger.error(`Error updating user permissions: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Add custom permissions to user
 */
exports.addUserPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions, type } = req.body;
    
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return next(new BadRequestError('Valid permissions array is required'));
    }
    
    if (!type || !['granted', 'denied'].includes(type)) {
      return next(new BadRequestError('Type must be either "granted" or "denied"'));
    }
    
    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    // Validate permissions
    const allPermissions = await Permission.getAllPermissionNames();
    const invalidPermissions = permissions.filter(p => !allPermissions.includes(p));
    
    if (invalidPermissions.length > 0) {
      return next(new BadRequestError(`Invalid permissions: ${invalidPermissions.join(', ')}`));
    }
    
    // Initialize customPermissions if it doesn't exist
    if (!user.customPermissions) {
      user.customPermissions = { granted: [], denied: [] };
    }
    
    // Add permissions to the appropriate array
    if (type === 'granted') {
      user.customPermissions.granted = [...new Set([...user.customPermissions.granted, ...permissions])];
    } else {
      user.customPermissions.denied = [...new Set([...user.customPermissions.denied, ...permissions])];
    }
    
    await user.save();
    
    // Clear permission cache for this user
    clearUserPermissionsCache(id);
    
    res.status(200).json({
      success: true,
      message: `Permissions added to ${type} successfully`,
      data: user.customPermissions
    });
  } catch (error) {
    logger.error(`Error adding user permissions: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Remove custom permissions from user
 */
exports.removeUserPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permissions, type } = req.body;
    
    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return next(new BadRequestError('Valid permissions array is required'));
    }
    
    if (!type || !['granted', 'denied'].includes(type)) {
      return next(new BadRequestError('Type must be either "granted" or "denied"'));
    }
    
    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    // Initialize customPermissions if it doesn't exist
    if (!user.customPermissions) {
      user.customPermissions = { granted: [], denied: [] };
    }
    
    // Remove permissions from the appropriate array
    if (type === 'granted') {
      user.customPermissions.granted = user.customPermissions.granted.filter(
        p => !permissions.includes(p)
      );
    } else {
      user.customPermissions.denied = user.customPermissions.denied.filter(
        p => !permissions.includes(p)
      );
    }
    
    await user.save();
    
    // Clear permission cache for this user
    clearUserPermissionsCache(id);
    
    res.status(200).json({
      success: true,
      message: `Permissions removed from ${type} successfully`,
      data: user.customPermissions
    });
  } catch (error) {
    logger.error(`Error removing user permissions: ${error.message}`, { error });
    next(error);
  }
};

/**
 * Clear user custom permissions
 */
exports.clearUserPermissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    // Clear custom permissions
    user.customPermissions = { granted: [], denied: [] };
    await user.save();
    
    // Clear permission cache for this user
    clearUserPermissionsCache(id);
    
    res.status(200).json({
      success: true,
      message: 'User custom permissions cleared successfully'
    });
  } catch (error) {
    logger.error(`Error clearing user permissions: ${error.message}`, { error });
    next(error);
  }
}; 