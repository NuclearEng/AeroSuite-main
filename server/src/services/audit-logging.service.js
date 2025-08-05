/**
 * Audit Logging Service
 * 
 * Provides comprehensive audit logging for sensitive operations in the system.
 * This service is used to track and monitor actions that are security-relevant
 * or involve sensitive data.
 */

const AuditLog = require('../models/AuditLog');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');
const config = require('../config');

/**
 * Sensitive operations that should always be logged
 */
const SENSITIVE_OPERATIONS = [
  // Authentication operations
  'USER_LOGIN',
  'USER_LOGOUT',
  'USER_LOGIN_FAILED',
  'PASSWORD_RESET',
  'PASSWORD_CHANGED',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'API_KEY_GENERATED',
  'API_KEY_REVOKED',
  
  // User management operations
  'USER_CREATED',
  'USER_UPDATED',
  'USER_DELETED',
  'USER_ROLE_CHANGED',
  'USER_PERMISSIONS_CHANGED',
  'USER_LOCKED',
  'USER_UNLOCKED',
  
  // Data operations
  'SENSITIVE_DATA_ACCESSED',
  'SENSITIVE_DATA_EXPORTED',
  'SENSITIVE_DATA_DELETED',
  'ENCRYPTION_KEY_ROTATED',
  'DATA_ANONYMIZED',
  
  // System operations
  'SYSTEM_SETTINGS_CHANGED',
  'SECURITY_SETTINGS_CHANGED',
  'FEATURE_FLAG_CHANGED',
  'INTEGRATION_CONFIGURED',
  
  // Admin operations
  'ADMIN_ACTION',
  'BULK_OPERATION',
  'REPORT_GENERATED',
  'DATABASE_OPERATION'
];

/**
 * Map of operation types to severity levels
 */
const SEVERITY_MAPPING = {
  // High severity operations
  'USER_ROLE_CHANGED': 'high',
  'USER_PERMISSIONS_CHANGED': 'high',
  'SENSITIVE_DATA_ACCESSED': 'high',
  'SENSITIVE_DATA_EXPORTED': 'high',
  'SENSITIVE_DATA_DELETED': 'high',
  'ENCRYPTION_KEY_ROTATED': 'high',
  'SECURITY_SETTINGS_CHANGED': 'high',
  'USER_DELETED': 'high',
  'ADMIN_ACTION': 'high',
  'DATABASE_OPERATION': 'high',
  
  // Critical severity operations
  'UNAUTHORIZED_ACCESS_ATTEMPT': 'critical',
  'SECURITY_BREACH': 'critical',
  'SUSPICIOUS_ACTIVITY': 'critical',
  
  // Medium severity operations (default)
  'USER_CREATED': 'medium',
  'USER_UPDATED': 'medium',
  'USER_LOGIN_FAILED': 'medium',
  'PASSWORD_RESET': 'medium',
  'PASSWORD_CHANGED': 'medium',
  'MFA_ENABLED': 'medium',
  'MFA_DISABLED': 'medium',
  'SYSTEM_SETTINGS_CHANGED': 'medium',
  'FEATURE_FLAG_CHANGED': 'medium',
  
  // Low severity operations
  'USER_LOGIN': 'low',
  'USER_LOGOUT': 'low',
  'REPORT_GENERATED': 'low'
};

/**
 * Audit Logging Service
 */
class AuditLoggingService {
  constructor() {
    this.initialized = false;
    this.config = {
      enabled: true,
      logToConsole: process.env.NODE_ENV === 'development',
      logToSecurityEvents: true,
      sensitiveOperations: SENSITIVE_OPERATIONS,
      severityMapping: SEVERITY_MAPPING
    };
  }

  /**
   * Initialize the audit logging service
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} Success status
   */
  async initialize(options = {}) {
    try {
      // Merge options with defaults
      this.config = { ...this.config, ...options };
      
      this.initialized = true;
      
      if (this.config.logToSecurityEvents) {
        logSecurityEvent(
          'AUDIT',
          SEC_EVENT_SEVERITY.INFO,
          'Audit logging service initialized',
          { component: 'AuditLoggingService', action: 'INITIALIZE' }
        );
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audit logging service:', error);
      return false;
    }
  }

  /**
   * Log a sensitive operation
   * @param {Object} logData - Log data
   * @returns {Promise<Object|null>} Created audit log or null
   */
  async logSensitiveOperation(logData) {
    try {
      if (!this.config.enabled) {
        return null;
      }
      
      // Ensure the operation is marked as sensitive
      const data = {
        ...logData,
        sensitive: true,
        severity: logData.severity || this._getSeverityForAction(logData.action)
      };
      
      // Create the audit log
      const auditLog = await AuditLog.createLog(data);
      
      // Log to console in development
      if (this.config.logToConsole) {
        console.log(`[AUDIT] ${data.description}`, {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          user: data.user ? data.user.username || data.user.email : 'System',
          timestamp: new Date().toISOString()
        });
      }
      
      // Log to security events system
      if (this.config.logToSecurityEvents) {
        const securitySeverity = this._mapToSecurityEventSeverity(data.severity);
        
        logSecurityEvent(
          'AUDIT',
          securitySeverity,
          data.description,
          {
            component: 'AuditLoggingService',
            action: data.action,
            entity: data.entity,
            entityId: data.entityId ? data.entityId.toString() : undefined,
            userId: data.user?.id ? data.user.id.toString() : undefined,
            username: data.user?.username,
            userRole: data.user?.role,
            metadata: data.metadata
          }
        );
      }
      
      return auditLog;
    } catch (error) {
      console.error('Failed to log sensitive operation:', error);
      
      // Try to log the failure to security events
      if (this.config.logToSecurityEvents) {
        try {
          logSecurityEvent(
            'AUDIT',
            SEC_EVENT_SEVERITY.ERROR,
            'Failed to log sensitive operation',
            {
              component: 'AuditLoggingService',
              action: logData.action,
              error: error.message
            }
          );
        } catch (secError) {
          // Last resort - log to console
          console.error('Failed to log audit failure to security events:', secError);
        }
      }
      
      return null;
    }
  }

  /**
   * Log an operation (may or may not be sensitive)
   * @param {Object} logData - Log data
   * @returns {Promise<Object|null>} Created audit log or null
   */
  async logOperation(logData) {
    try {
      if (!this.config.enabled) {
        return null;
      }
      
      // Check if this is a sensitive operation
      const isSensitive = this._isSensitiveOperation(logData.action);
      
      // If sensitive, use the sensitive operation logger
      if (isSensitive) {
        return this.logSensitiveOperation(logData);
      }
      
      // Otherwise, just create a regular audit log
      const data = {
        ...logData,
        sensitive: false,
        severity: logData.severity || 'low'
      };
      
      // Create the audit log
      const auditLog = await AuditLog.createLog(data);
      
      // Log to console in development
      if (this.config.logToConsole) {
        console.log(`[AUDIT] ${data.description}`, {
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          user: data.user ? data.user.username || data.user.email : 'System',
          timestamp: new Date().toISOString()
        });
      }
      
      return auditLog;
    } catch (error) {
      console.error('Failed to log operation:', error);
      return null;
    }
  }

  /**
   * Create an audit log entry from a request
   * @param {Object} req - Express request object
   * @param {Object} options - Additional options
   * @returns {Promise<Object|null>} Created audit log or null
   */
  async logFromRequest(req, options = {}) {
    try {
      if (!this.config.enabled || !req) {
        return null;
      }
      
      const {
        action,
        entity,
        entityId,
        description,
        status = 'success',
        severity,
        sensitive,
        metadata = {}
      } = options;
      
      // Extract user information from request
      const user = req.user ? {
        id: req.user.id,
        username: req.user.username || req.user.email,
        email: req.user.email,
        role: req.user.role
      } : null;
      
      // Build metadata
      const requestMetadata = {
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
        requestId: req.id,
        method: req.method,
        path: req.path,
        ...metadata
      };
      
      // Determine if this is a sensitive operation
      const isSensitive = sensitive !== undefined 
        ? sensitive 
        : this._isSensitiveOperation(action);
      
      // Create log data
      const logData = {
        user,
        action,
        entity,
        entityId,
        description,
        status,
        severity: severity || this._getSeverityForAction(action),
        sensitive: isSensitive,
        metadata: requestMetadata
      };
      
      // Log the operation
      return isSensitive 
        ? this.logSensitiveOperation(logData)
        : this.logOperation(logData);
    } catch (error) {
      console.error('Failed to log from request:', error);
      return null;
    }
  }

  /**
   * Get audit logs for an entity
   * @param {string} entity - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of audit logs
   */
  async getEntityAuditLogs(entity, entityId, options = {}) {
    try {
      const query = { entity };
      
      if (entityId) {
        query.entityId = entityId;
      }
      
      if (options.action) {
        query.action = options.action;
      }
      
      if (options.from) {
        query.timestamp = { $gte: options.from };
      }
      
      if (options.to) {
        query.timestamp = { ...query.timestamp, $lte: options.to };
      }
      
      if (options.sensitive !== undefined) {
        query.sensitive = options.sensitive;
      }
      
      const logs = await AuditLog.find(query)
        .sort({ timestamp: options.sort || -1 })
        .limit(options.limit || 100)
        .skip(options.skip || 0);
      
      // Sanitize logs if requested
      if (options.sanitize) {
        return logs.map(log => log.sanitize());
      }
      
      return logs;
    } catch (error) {
      console.error('Failed to get entity audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of audit logs
   */
  async getUserAuditLogs(userId, options = {}) {
    try {
      const query = { 'user.id': userId };
      
      if (options.action) {
        query.action = options.action;
      }
      
      if (options.from) {
        query.timestamp = { $gte: options.from };
      }
      
      if (options.to) {
        query.timestamp = { ...query.timestamp, $lte: options.to };
      }
      
      if (options.sensitive !== undefined) {
        query.sensitive = options.sensitive;
      }
      
      const logs = await AuditLog.find(query)
        .sort({ timestamp: options.sort || -1 })
        .limit(options.limit || 100)
        .skip(options.skip || 0);
      
      // Sanitize logs if requested
      if (options.sanitize) {
        return logs.map(log => log.sanitize());
      }
      
      return logs;
    } catch (error) {
      console.error('Failed to get user audit logs:', error);
      return [];
    }
  }

  /**
   * Get sensitive operation logs
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of audit logs
   */
  async getSensitiveOperationLogs(options = {}) {
    try {
      return AuditLog.findSensitiveOperations(options);
    } catch (error) {
      console.error('Failed to get sensitive operation logs:', error);
      return [];
    }
  }

  /**
   * Check if an operation is sensitive
   * @param {string} action - Action name
   * @returns {boolean} Whether the operation is sensitive
   * @private
   */
  _isSensitiveOperation(action) {
    return this.config.sensitiveOperations.includes(action);
  }

  /**
   * Get severity level for an action
   * @param {string} action - Action name
   * @returns {string} Severity level
   * @private
   */
  _getSeverityForAction(action) {
    return this.config.severityMapping[action] || 'medium';
  }

  /**
   * Map audit severity to security event severity
   * @param {string} auditSeverity - Audit severity level
   * @returns {string} Security event severity
   * @private
   */
  _mapToSecurityEventSeverity(auditSeverity) {
    switch (auditSeverity) {
      case 'critical':
        return SEC_EVENT_SEVERITY.CRITICAL;
      case 'high':
        return SEC_EVENT_SEVERITY.HIGH;
      case 'medium':
        return SEC_EVENT_SEVERITY.MEDIUM;
      case 'low':
        return SEC_EVENT_SEVERITY.LOW;
      default:
        return SEC_EVENT_SEVERITY.INFO;
    }
  }
}

module.exports = new AuditLoggingService(); 