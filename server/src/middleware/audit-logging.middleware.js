/**
 * Audit Logging Middleware
 * 
 * Middleware for automatically logging sensitive operations.
 */

const auditLoggingService = require('../services/audit-logging.service');

/**
 * Configuration for routes that should be audited
 */
const AUDITED_ROUTES = [
  // User management
  {
    path: '/api/v1/users',
    method: 'POST',
    action: 'USER_CREATED',
    entity: 'User',
    description: 'User created'
  },
  {
    path: /^\/api\/v1\/users\/[a-f0-9]{24}$/,
    method: 'PUT',
    action: 'USER_UPDATED',
    entity: 'User',
    description: 'User updated'
  },
  {
    path: /^\/api\/v1\/users\/[a-f0-9]{24}$/,
    method: 'DELETE',
    action: 'USER_DELETED',
    entity: 'User',
    description: 'User deleted'
  },
  {
    path: /^\/api\/v1\/users\/[a-f0-9]{24}\/role$/,
    method: 'PUT',
    action: 'USER_ROLE_CHANGED',
    entity: 'User',
    description: 'User role changed'
  },
  
  // Authentication
  {
    path: '/api/v1/auth/login',
    method: 'POST',
    action: 'USER_LOGIN',
    entity: 'User',
    description: 'User login'
  },
  {
    path: '/api/v1/auth/logout',
    method: 'POST',
    action: 'USER_LOGOUT',
    entity: 'User',
    description: 'User logout'
  },
  {
    path: '/api/v1/auth/reset-password',
    method: 'POST',
    action: 'PASSWORD_RESET',
    entity: 'User',
    description: 'Password reset requested'
  },
  {
    path: '/api/v1/auth/change-password',
    method: 'POST',
    action: 'PASSWORD_CHANGED',
    entity: 'User',
    description: 'Password changed'
  },
  {
    path: '/api/v1/auth/mfa/enable',
    method: 'POST',
    action: 'MFA_ENABLED',
    entity: 'User',
    description: 'MFA enabled'
  },
  {
    path: '/api/v1/auth/mfa/disable',
    method: 'POST',
    action: 'MFA_DISABLED',
    entity: 'User',
    description: 'MFA disabled'
  },
  
  // Data protection
  {
    path: /^\/api\/v1\/data-protection\/rotate-keys\/[a-zA-Z]+$/,
    method: 'POST',
    action: 'ENCRYPTION_KEY_ROTATED',
    entity: 'Encryption',
    description: 'Encryption keys rotated'
  },
  {
    path: /^\/api\/v1\/data-protection\/[a-zA-Z]+\/[a-f0-9]{24}$/,
    method: 'DELETE',
    action: 'SENSITIVE_DATA_DELETED',
    entity: 'DataProtection',
    description: 'Sensitive data deleted'
  },
  {
    path: /^\/api\/v1\/data-protection\/anonymize\/[a-zA-Z]+$/,
    method: 'POST',
    action: 'DATA_ANONYMIZED',
    entity: 'DataProtection',
    description: 'Data anonymized for analytics'
  },
  
  // System settings
  {
    path: /^\/api\/v1\/admin\/settings/,
    method: 'PUT',
    action: 'SYSTEM_SETTINGS_CHANGED',
    entity: 'Settings',
    description: 'System settings changed'
  },
  {
    path: /^\/api\/v1\/security\/settings/,
    method: 'PUT',
    action: 'SECURITY_SETTINGS_CHANGED',
    entity: 'SecuritySettings',
    description: 'Security settings changed'
  },
  {
    path: /^\/api\/v1\/feature-flags/,
    method: 'PUT',
    action: 'FEATURE_FLAG_CHANGED',
    entity: 'FeatureFlag',
    description: 'Feature flag changed'
  },
  
  // Reports
  {
    path: /^\/api\/v1\/reports\/generate/,
    method: 'POST',
    action: 'REPORT_GENERATED',
    entity: 'Report',
    description: 'Report generated'
  }
];

/**
 * Middleware for automatically logging sensitive operations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function auditLoggingMiddleware(req, res, next) {
  // Store the original end method
  const originalEnd = res.end;
  
  // Override the end method to capture the response
  res.end = function(chunk, encoding) {
    // Restore the original end method
    res.end = originalEnd;
    
    // Call the original end method
    res.end(chunk, encoding);
    
    // Check if this route should be audited
    const auditConfig = findAuditConfig(req);
    
    if (auditConfig) {
      // Get entity ID from URL if it's a pattern with ID
      let entityId = null;
      if (auditConfig.path instanceof RegExp) {
        const match = req.path.match(/[a-f0-9]{24}/);
        if (match) {
          entityId = match[0];
        }
      }
      
      // Determine if the operation was successful
      const status = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
      
      // Log the operation
      auditLoggingService.logFromRequest(req, {
        action: auditConfig.action,
        entity: auditConfig.entity,
        entityId: entityId ? mongoose.Types.ObjectId(entityId) : undefined,
        description: `${auditConfig.description} by ${req.user ? req.user.username || req.user.email : 'anonymous'}`,
        status,
        sensitive: true,
        metadata: {
          statusCode: res.statusCode,
          method: req.method,
          path: req.path
        }
      }).catch(err => {
        console.error('Failed to log audit event:', err);
      });
    }
  };
  
  next();
}

/**
 * Find audit configuration for a request
 * @param {Object} req - Express request object
 * @returns {Object|null} Audit configuration or null
 */
function findAuditConfig(req) {
  return AUDITED_ROUTES.find(config => {
    // Check if method matches
    if (config.method !== req.method) {
      return false;
    }
    
    // Check if path matches
    if (typeof config.path === 'string') {
      return config.path === req.path;
    } else if (config.path instanceof RegExp) {
      return config.path.test(req.path);
    }
    
    return false;
  });
}

// Make sure mongoose is available
const mongoose = require('mongoose');

module.exports = auditLoggingMiddleware; 