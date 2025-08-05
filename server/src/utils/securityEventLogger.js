/**
 * Security Event Logger
 * 
 * Logs security-related events for audit and compliance purposes
 * Implements RF048 - Security event logging
 */

const logger = require('../infrastructure/logger');

/**
 * Security event types
 */
const EVENT_TYPES = {
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILURE: 'auth_failure',
  PERMISSION_DENIED: 'permission_denied',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  PASSWORD_CHANGED: 'password_changed',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',
  PASSWORD_RESET_COMPLETED: 'password_reset_completed',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  MFA_CHALLENGE_SUCCESS: 'mfa_challenge_success',
  MFA_CHALLENGE_FAILURE: 'mfa_challenge_failure',
  SENSITIVE_DATA_ACCESS: 'sensitive_data_access',
  SENSITIVE_DATA_CHANGED: 'sensitive_data_changed',
  ADMIN_ACTION: 'admin_action',
  SYSTEM_CONFIGURATION_CHANGED: 'system_configuration_changed',
  API_KEY_CREATED: 'api_key_created',
  API_KEY_REVOKED: 'api_key_revoked',
  SESSION_CREATED: 'session_created',
  SESSION_EXPIRED: 'session_expired',
  SESSION_TERMINATED: 'session_terminated'
};

/**
 * Security event severity levels
 */
const SEVERITY = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Log a security event
 * @param {string} eventType - Type of security event
 * @param {Object} data - Event data
 * @param {string} severity - Event severity
 */
function logSecurityEvent(eventType, data = {}, severity = SEVERITY.INFO) {
  const eventData = {
    timestamp: new Date().toISOString(),
    eventType,
    severity,
    ...data
  };
  
  // Remove sensitive data
  if (eventData.password) {
    delete eventData.password;
  }
  
  // Log based on severity
  switch (severity) {
    case SEVERITY.ERROR:
      logger.error(`SECURITY EVENT [${eventType}]`, eventData);
      break;
    case SEVERITY.WARN:
      logger.warn(`SECURITY EVENT [${eventType}]`, eventData);
      break;
    default:
      logger.info(`SECURITY EVENT [${eventType}]`, eventData);
  }
  
  // In a real implementation, we might also:
  // 1. Store events in a database
  // 2. Send alerts for high-severity events
  // 3. Forward to a SIEM system
}

/**
 * Log authentication success
 * @param {Object} user - User object (without sensitive data)
 * @param {Object} context - Authentication context
 */
function logAuthSuccess(user, context = {}) {
  const { _id, email, username } = user;
  
  logSecurityEvent(EVENT_TYPES.AUTH_SUCCESS, {
    userId: _id,
    userIdentifier: email || username,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    method: context.method || 'password'
  });
}

/**
 * Log authentication failure
 * @param {string} identifier - User identifier (email/username)
 * @param {string} reason - Failure reason
 * @param {Object} context - Authentication context
 */
function logAuthFailure(identifier, reason, context = {}) {
  logSecurityEvent(EVENT_TYPES.AUTH_FAILURE, {
    userIdentifier: identifier,
    reason,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    method: context.method || 'password'
  }, SEVERITY.WARN);
}

/**
 * Log permission denied event
 * @param {string} userId - User ID
 * @param {string} resource - Resource being accessed
 * @param {string} action - Action attempted
 * @param {Object} context - Request context
 */
function logPermissionDenied(userId, resource, action, context = {}) {
  logSecurityEvent(EVENT_TYPES.PERMISSION_DENIED, {
    userId,
    resource,
    action,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  }, SEVERITY.WARN);
}

/**
 * Log sensitive data access
 * @param {string} userId - User ID
 * @param {string} resourceType - Type of resource accessed
 * @param {string} resourceId - ID of resource accessed
 * @param {Object} context - Request context
 */
function logSensitiveDataAccess(userId, resourceType, resourceId, context = {}) {
  logSecurityEvent(EVENT_TYPES.SENSITIVE_DATA_ACCESS, {
    userId,
    resourceType,
    resourceId,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });
}

/**
 * Log admin action
 * @param {string} userId - Admin user ID
 * @param {string} action - Action performed
 * @param {Object} details - Action details
 * @param {Object} context - Request context
 */
function logAdminAction(userId, action, details = {}, context = {}) {
  logSecurityEvent(EVENT_TYPES.ADMIN_ACTION, {
    userId,
    action,
    details,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });
}

module.exports = {
  EVENT_TYPES,
  SEVERITY,
  logSecurityEvent,
  logAuthSuccess,
  logAuthFailure,
  logPermissionDenied,
  logSensitiveDataAccess,
  logAdminAction
}; 