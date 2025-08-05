const User = require('../models/user.model');
const Role = require('../models/role.model');
const Permission = require('../models/permission.model');
const { ForbiddenError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Cache for user permissions to avoid frequent database lookups
 * Structure: { userId: { permissions: [], timestamp: Date } }
 */
const permissionCache = new Map();

/**
 * Cache expiration time in milliseconds (5 minutes)
 */
const CACHE_EXPIRATION = 5 * 60 * 1000;

/**
 * Clear expired cache entries
 */
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [userId, entry] of permissionCache.entries()) {
    if (now - entry.timestamp > CACHE_EXPIRATION) {
      permissionCache.delete(userId);
    }
  }
};

// Run cache cleanup every minute
setInterval(clearExpiredCache, 60 * 1000);

/**
 * Get all permissions for a user (from role and custom permissions)
 * 
 * @param {string} userId - The user ID
 * @returns {Promise<string[]>} Array of permission names
 */
const getUserPermissions = async (userId) => {
  try {
    // Check cache first
    const cachedPermissions = permissionCache.get(userId);
    if (cachedPermissions && (Date.now() - cachedPermissions.timestamp < CACHE_EXPIRATION)) {
      return cachedPermissions.permissions;
    }
    
    // Get user with role and custom permissions
    const user = await User.findById(userId)
      .select('role customPermissions')
      .lean();
    
    if (!user) {
      return [];
    }
    
    // Get role permissions
    const role = await Role.findOne({ name: user.role, isActive: true })
      .select('permissions')
      .lean();
    
    if (!role) {
      logger.warn(`Role ${user.role} not found for user ${userId}`);
      return [];
    }
    
    // Start with role permissions
    let userPermissions = [...(role.permissions || [])];
    
    // Add granted custom permissions
    if (user.customPermissions?.granted?.length > 0) {
      userPermissions = [...userPermissions, ...user.customPermissions.granted];
    }
    
    // Remove denied custom permissions
    if (user.customPermissions?.denied?.length > 0) {
      userPermissions = userPermissions.filter(p => !user.customPermissions.denied.includes(p));
    }
    
    // Cache the results
    permissionCache.set(userId, {
      permissions: userPermissions,
      timestamp: Date.now()
    });
    
    return userPermissions;
  } catch (error) {
    logger.error(`Error getting user permissions: ${error.message}`, { userId, error });
    return [];
  }
};

/**
 * Clear user permissions cache
 * 
 * @param {string} userId - The user ID
 */
const clearUserPermissionsCache = (userId) => {
  if (userId) {
    permissionCache.delete(userId);
  } else {
    permissionCache.clear();
  }
};

/**
 * Middleware to require one or more permissions
 * 
 * @param {...string} requiredPermissions - One or more permission names
 * @returns {Function} Express middleware
 */
const requirePermission = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Skip permission check for admin role
      if (req.user && req.user.role === 'admin') {
        return next();
      }
      
      if (!req.user || !req.user.id) {
        return next(new ForbiddenError('Authentication required'));
      }
      
      // Get user permissions
      const userPermissions = await getUserPermissions(req.user.id);
      
      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every(
        permission => userPermissions.includes(permission)
      );
      
      if (!hasAllPermissions) {
        return next(
          new ForbiddenError('You do not have permission to perform this action')
        );
      }
      
      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      next(error);
    }
  };
};

/**
 * Middleware to require at least one of the specified permissions
 * 
 * @param {...string} anyPermissions - One or more permission names
 * @returns {Function} Express middleware
 */
const requireAnyPermission = (...anyPermissions) => {
  return async (req, res, next) => {
    try {
      // Skip permission check for admin role
      if (req.user && req.user.role === 'admin') {
        return next();
      }
      
      if (!req.user || !req.user.id) {
        return next(new ForbiddenError('Authentication required'));
      }
      
      // Get user permissions
      const userPermissions = await getUserPermissions(req.user.id);
      
      // Check if user has at least one of the required permissions
      const hasAnyPermission = anyPermissions.some(
        permission => userPermissions.includes(permission)
      );
      
      if (!hasAnyPermission) {
        return next(
          new ForbiddenError('You do not have permission to perform this action')
        );
      }
      
      next();
    } catch (error) {
      logger.error('Permission middleware error:', error);
      next(error);
    }
  };
};

/**
 * Check if a user has a specific permission
 * 
 * @param {string} userId - The user ID
 * @param {string} permission - The permission name
 * @returns {Promise<boolean>} Whether the user has the permission
 */
const userHasPermission = async (userId, permission) => {
  if (!userId || !permission) {
    return false;
  }
  
  const userPermissions = await getUserPermissions(userId);
  return userPermissions.includes(permission);
};

/**
 * Check if a user has all specified permissions
 * 
 * @param {string} userId - The user ID
 * @param {string[]} permissions - Array of permission names
 * @returns {Promise<boolean>} Whether the user has all permissions
 */
const userHasAllPermissions = async (userId, permissions) => {
  if (!userId || !permissions || !permissions.length) {
    return false;
  }
  
  const userPermissions = await getUserPermissions(userId);
  return permissions.every(permission => userPermissions.includes(permission));
};

/**
 * Check if a user has any of the specified permissions
 * 
 * @param {string} userId - The user ID
 * @param {string[]} permissions - Array of permission names
 * @returns {Promise<boolean>} Whether the user has any of the permissions
 */
const userHasAnyPermission = async (userId, permissions) => {
  if (!userId || !permissions || !permissions.length) {
    return false;
  }
  
  const userPermissions = await getUserPermissions(userId);
  return permissions.some(permission => userPermissions.includes(permission));
};

/**
 * Add user permissions to request object
 * This middleware adds user permissions to req.userPermissions for easy access
 */
const attachUserPermissions = async (req, res, next) => {
  try {
    if (req.user && req.user.id) {
      req.userPermissions = await getUserPermissions(req.user.id);
    } else {
      req.userPermissions = [];
    }
    next();
  } catch (error) {
    logger.error('Error attaching user permissions:', error);
    next(error);
  }
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  userHasPermission,
  userHasAllPermissions,
  userHasAnyPermission,
  getUserPermissions,
  clearUserPermissionsCache,
  attachUserPermissions,
  checkPermission: (permission) => (req, res, next) => {
    if (!req.user || !req.user.permissions || !req.user.permissions.includes(permission)) {
      return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
    }
    next();
  }
}; 