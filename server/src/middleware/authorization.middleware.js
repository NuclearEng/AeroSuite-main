// Task: SEC021 - Authorization Implementation
// Task: TS378 - Advanced user permissions management
const { AppError } = require('../utils/errorHandler');
const permissionsService = require('../services/permissions.service');
const logger = require('../utils/logger');
const cache = require('../utils/cache');

/**
 * Resource-based authorization middleware with context awareness
 */
const authorize = (resource, action, options = {}) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const {
        checkOwnership = false,
        ownerField = 'userId',
        resourceIdParam = 'id',
        customCheck = null,
        bypassForAdmin = true,
        checkContext = true
      } = options;

      // Bypass for admin if enabled
      if (bypassForAdmin && req.user.role === 'admin') {
        return next();
      }

      // Get resource ID and object if needed for context checking
      let resourceId = null;
      let resourceObj = null;
      
      if (checkContext || checkOwnership) {
        resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];
        
        if (resourceId) {
          // Try to get the resource object
          try {
            resourceObj = await getResourceObject(resource, resourceId);
          } catch (error) {
            logger.warn(`Failed to get resource object for context check: ${error.message}`);
          }
        }
      }

      // Check basic permission
      let hasPermission;
      
      if (resourceObj && checkContext) {
        // Use context-aware permission check
        hasPermission = await req.user.hasPermissionForResource(
          resource,
          action,
          resourceObj
        );
      } else {
        // Use standard permission check
        hasPermission = await permissionsService.checkUserPermission(
          req.user._id,
          resource,
          action
        );
      }

      if (!hasPermission) {
        logger.warn('Authorization failed', {
          userId: req.user._id,
          resource,
          action,
          path: req.path
        });
        throw new AppError('Insufficient permissions', 403);
      }

      // Check resource ownership if required
      if (checkOwnership && resourceObj) {
        const isOwner = await checkResourceOwnership(
          resource,
          resourceObj,
          req.user._id,
          ownerField
        );

        if (!isOwner) {
          throw new AppError('Access denied to this resource', 403);
        }
      }

      // Run custom authorization check if provided
      if (customCheck && typeof customCheck === 'function') {
        const authorized = await customCheck(req, res, resourceObj);
        if (!authorized) {
          throw new AppError('Custom authorization check failed', 403);
        }
      }

      // Attach resource object to request if available
      if (resourceObj) {
        req.resourceObject = resourceObj;
      }

      // Log successful authorization
      logger.debug('Authorization successful', {
        userId: req.user._id,
        resource,
        action
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Role-based authorization middleware
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Check if user has one of the allowed roles
    const userRole = req.user.role?.name || req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role authorization failed', {
        userId: req.user._id,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path
      });
      
      return next(new AppError('Insufficient role privileges', 403));
    }

    next();
  };
};

/**
 * Dynamic permission checking
 */
const checkPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Parse permission name (e.g., "users.create" -> resource: "users", action: "create")
      const [resource, action] = permissionName.split('.');
      
      if (!resource || !action) {
        throw new AppError('Invalid permission format', 500);
      }

      const hasPermission = await permissionsService.checkUserPermission(
        req.user._id,
        resource,
        action
      );

      if (!hasPermission) {
        logger.warn('Permission check failed', {
          userId: req.user._id,
          permission: permissionName,
          path: req.path
        });
        throw new AppError(`Missing required permission: ${permissionName}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Conditional authorization based on request data
 */
const conditionalAuthorize = (conditions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      for (const condition of conditions) {
        const { field, operator, value, permission } = condition;
        const fieldValue = getFieldValue(req, field);
        
        if (checkCondition(fieldValue, operator, value)) {
          // Condition met, check if user has required permission
          if (permission) {
            const [resource, action] = permission.split('.');
            const hasPermission = await permissionsService.checkUserPermission(
              req.user._id,
              resource,
              action
            );
            
            if (!hasPermission) {
              throw new AppError(`Conditional permission check failed: ${permission}`, 403);
            }
          }
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Scope-based authorization
 */
const authorizeScope = (requiredScopes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const userScopes = req.user.scopes || [];
    const hasRequiredScopes = requiredScopes.every(scope => 
      userScopes.includes(scope)
    );

    if (!hasRequiredScopes) {
      logger.warn('Scope authorization failed', {
        userId: req.user._id,
        userScopes,
        requiredScopes,
        path: req.path
      });
      
      return next(new AppError('Insufficient scopes', 403));
    }

    next();
  };
};

/**
 * Time-based authorization
 */
const timeBasedAuthorize = (options = {}) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const {
      allowedDays = [0, 1, 2, 3, 4, 5, 6], // All days by default
      allowedHours = { start: 0, end: 24 }, // All hours by default
      timezone = 'UTC',
      message = 'Access not allowed at this time'
    } = options;

    const now = new Date();
    const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const dayOfWeek = userTime.getDay();
    const hour = userTime.getHours();

    // Check day of week
    if (!allowedDays.includes(dayOfWeek)) {
      return next(new AppError(message, 403));
    }

    // Check hour of day
    if (hour < allowedHours.start || hour >= allowedHours.end) {
      return next(new AppError(message, 403));
    }

    next();
  };
};

/**
 * IP-based authorization
 */
const ipAuthorize = (options = {}) => {
  return (req, res, next) => {
    const {
      whitelist = [],
      blacklist = [],
      checkRole = true
    } = options;

    const clientIp = req.ip || req.connection.remoteAddress;

    // Check blacklist first
    if (blacklist.length > 0 && isIpInList(clientIp, blacklist)) {
      logger.warn('Blacklisted IP attempted access', {
        ip: clientIp,
        path: req.path
      });
      return next(new AppError('Access denied', 403));
    }

    // Check whitelist if specified
    if (whitelist.length > 0) {
      // Check if user role has IP restrictions
      if (checkRole && req.user?.role?.restrictions?.ipWhitelist) {
        const roleWhitelist = req.user.role.restrictions.ipWhitelist;
        if (!isIpInList(clientIp, roleWhitelist)) {
          logger.warn('IP not in role whitelist', {
            ip: clientIp,
            userId: req.user._id,
            role: req.user.role.name
          });
          return next(new AppError('Access denied from this IP', 403));
        }
      }

      // Check general whitelist
      if (!isIpInList(clientIp, whitelist)) {
        logger.warn('IP not in whitelist', {
          ip: clientIp,
          path: req.path
        });
        return next(new AppError('Access denied from this IP', 403));
      }
    }

    next();
  };
};

/**
 * Rate-limited authorization
 */
const rateLimitedAuthorize = (options = {}) => {
  const {
    resource,
    action,
    maxAttempts = 10,
    windowMs = 60 * 60 * 1000, // 1 hour
    keyGenerator = (req) => `${req.user._id}:${resource}:${action}`
  } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const key = `rate_limit:${keyGenerator(req)}`;
      const attempts = await cache.get(key) || 0;

      if (attempts >= maxAttempts) {
        const ttl = await cache.ttl(key);
        throw new AppError(
          `Rate limit exceeded. Try again in ${Math.ceil(ttl / 60)} minutes`,
          429
        );
      }

      // Check authorization
      const hasPermission = await permissionsService.checkUserPermission(
        req.user._id,
        resource,
        action
      );

      if (!hasPermission) {
        // Increment failed attempts
        await cache.set(key, attempts + 1, Math.floor(windowMs / 1000));
        throw new AppError('Insufficient permissions', 403);
      }

      // Reset on successful authorization
      await cache.del(key);
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Multi-factor authorization
 */
const mfaAuthorize = (options = {}) => {
  return (req, res, next) => {
    const {
      requireMFA = true,
      allowedMethods = ['totp', 'sms', 'email'],
      message = 'Multi-factor authentication required'
    } = options;

    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    // Check if MFA is required for this user/role
    const mfaRequired = requireMFA || 
                       req.user.role?.restrictions?.requiresMFA ||
                       req.user.settings?.requireMFA;

    if (mfaRequired) {
      // Check if MFA was completed in this session
      if (!req.session?.mfaVerified) {
        return next(new AppError(message, 403));
      }

      // Check if used MFA method is allowed
      if (!allowedMethods.includes(req.session.mfaMethod)) {
        return next(new AppError('MFA method not allowed for this operation', 403));
      }
    }

    next();
  };
};

/**
 * Context-aware authorization middleware
 */
const authorizeContext = (resource, action, options = {}) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const {
        resourceIdParam = 'id',
        bypassForAdmin = true
      } = options;

      // Bypass for admin if enabled
      if (bypassForAdmin && req.user.role === 'admin') {
        return next();
      }

      // Get resource ID
      const resourceId = req.params[resourceIdParam] || req.body[resourceIdParam];
      
      if (!resourceId) {
        throw new AppError('Resource ID required for context authorization', 400);
      }

      // Get resource object
      const resourceObj = await getResourceObject(resource, resourceId);
      
      if (!resourceObj) {
        throw new AppError('Resource not found', 404);
      }

      // Check permission with context awareness
      const hasPermission = await req.user.hasPermissionForResource(
        resource,
        action,
        resourceObj
      );

      if (!hasPermission) {
        logger.warn('Context authorization failed', {
          userId: req.user._id,
          resource,
          action,
          resourceId,
          path: req.path
        });
        
        throw new AppError('Insufficient permissions for this resource', 403);
      }

      // Attach resource object to request
      req.resourceObject = resourceObj;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Advanced permission checking middleware
 */
const checkAdvancedPermission = (permissionConfig) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Handle different permission config formats
      let resource, action, options;
      
      if (typeof permissionConfig === 'string') {
        // Simple string format: "resource:action"
        [resource, action] = permissionConfig.split(':');
        options = {};
      } else {
        // Object format with options
        ({ resource, action, ...options } = permissionConfig);
      }

      if (!resource || !action) {
        throw new AppError('Invalid permission configuration', 500);
      }

      // Check for conditional permissions
      if (options.conditions) {
        const conditionsMet = evaluateConditions(options.conditions, req);
        if (!conditionsMet) {
          // If conditions not met, check alternative permissions
          if (options.alternativePermission) {
            const altResource = options.alternativePermission.resource || resource;
            const altAction = options.alternativePermission.action || 'read';
            
            const hasAltPermission = await permissionsService.checkUserPermission(
              req.user._id,
              altResource,
              altAction
            );
            
            if (hasAltPermission) {
              return next();
            }
          }
          
          // No alternative or alternative failed
          throw new AppError('Conditions not met for this permission', 403);
        }
      }

      // Get resource object if needed
      let resourceObj = null;
      if (options.contextAware && options.resourceIdParam) {
        const resourceId = req.params[options.resourceIdParam] || req.body[options.resourceIdParam];
        if (resourceId) {
          resourceObj = await getResourceObject(resource, resourceId);
        }
      }

      // Check permission
      let hasPermission;
      
      if (resourceObj && options.contextAware) {
        hasPermission = await req.user.hasPermissionForResource(
          resource,
          action,
          resourceObj
        );
      } else {
        hasPermission = await permissionsService.checkUserPermission(
          req.user._id,
          resource,
          action
        );
      }

      if (!hasPermission) {
        logger.warn('Advanced permission check failed', {
          userId: req.user._id,
          resource,
          action,
          path: req.path
        });
        
        throw new AppError(`Missing required permission: ${resource}:${action}`, 403);
      }

      // Attach resource object if available
      if (resourceObj) {
        req.resourceObject = resourceObj;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Helper functions

async function checkResourceOwnership(resource, resourceId, userId, ownerField) {
  try {
    const cacheKey = `ownership:${resource}:${resourceId}:${userId}`;
    const cached = await cache.get(cacheKey);
    
    if (cached !== null) {
      return cached;
    }

    // Dynamic model loading based on resource
    const modelName = resource.charAt(0).toUpperCase() + resource.slice(1, -1);
    const Model = require(`../models/${modelName}`);
    
    const doc = await Model.findById(resourceId).select(ownerField);
    
    if (!doc) {
      return false;
    }

    const isOwner = doc[ownerField]?.toString() === userId.toString();
    
    // Cache for 5 minutes
    await cache.set(cacheKey, isOwner, 300);
    
    return isOwner;
  } catch (error) {
    logger.error('Error checking resource ownership:', error);
    return false;
  }
}

function getFieldValue(req, field) {
  const parts = field.split('.');
  let value = req;
  
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) break;
  }
  
  return value;
}

function checkCondition(fieldValue, operator, value) {
  switch (operator) {
    case 'eq':
    case '==':
      return fieldValue == value;
    case 'neq':
    case '!=':
      return fieldValue != value;
    case 'gt':
    case '>':
      return fieldValue > value;
    case 'gte':
    case '>=':
      return fieldValue >= value;
    case 'lt':
    case '<':
      return fieldValue < value;
    case 'lte':
    case '<=':
      return fieldValue <= value;
    case 'in':
      return Array.isArray(value) && value.includes(fieldValue);
    case 'nin':
      return Array.isArray(value) && !value.includes(fieldValue);
    case 'contains':
      return String(fieldValue).includes(String(value));
    case 'regex':
      return new RegExp(value).test(String(fieldValue));
    default:
      return false;
  }
}

function isIpInList(ip, list) {
  return list.some(pattern => {
    if (pattern === ip) return true;
    
    // Support CIDR notation
    if (pattern.includes('/')) {
      const [subnet, bits] = pattern.split('/');
      // Simple CIDR check (implement full CIDR matching if needed)
      return ip.startsWith(subnet.split('.').slice(0, -1).join('.'));
    }
    
    // Support wildcards
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(ip);
    }
    
    return false;
  });
}

/**
 * Get resource object by type and ID
 */
async function getResourceObject(resourceType, resourceId) {
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

    const mongoose = require('mongoose');
    const Model = mongoose.model(modelName);
    
    return await Model.findById(resourceId);
  } catch (error) {
    logger.error(`Error getting resource object: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Check if conditions are met
 */
function evaluateConditions(conditions, req) {
  if (!conditions || !Array.isArray(conditions)) {
    return true;
  }

  return conditions.every(condition => {
    const { field, operator, value, valueFrom } = condition;
    
    // Get actual value to compare
    let actualValue;
    if (field.startsWith('req.')) {
      actualValue = getNestedValue(req, field.substring(4));
    } else {
      actualValue = getNestedValue(req.body, field);
    }
    
    // Get comparison value
    let comparisonValue = value;
    if (valueFrom) {
      if (valueFrom.startsWith('req.')) {
        comparisonValue = getNestedValue(req, valueFrom.substring(4));
      } else {
        comparisonValue = getNestedValue(req.body, valueFrom);
      }
    }
    
    // Compare based on operator
    switch (operator) {
      case 'equals':
        return actualValue === comparisonValue;
      case 'notEquals':
        return actualValue !== comparisonValue;
      case 'contains':
        return Array.isArray(actualValue) && actualValue.includes(comparisonValue);
      case 'greaterThan':
        return actualValue > comparisonValue;
      case 'lessThan':
        return actualValue < comparisonValue;
      case 'exists':
        return actualValue !== undefined && actualValue !== null;
      default:
        return false;
    }
  });
}

/**
 * Get nested value from object
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((o, p) => (o ? o[p] : undefined), obj);
}

module.exports = {
  authorize,
  authorizeRoles,
  checkPermission,
  conditionalAuthorize,
  authorizeScope,
  timeBasedAuthorize,
  ipAuthorize,
  rateLimitedAuthorize,
  mfaAuthorize,
  authorizeContext,
  checkAdvancedPermission
}; 