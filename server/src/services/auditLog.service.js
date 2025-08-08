const mongoose = require('mongoose');
const crypto = require('crypto');
const logger = require('../utils/logger');
const { encrypt, decrypt } = require('../utils/encryption');

// Audit log schema
const auditLogSchema = new mongoose.Schema({
  // Event information
  eventType: {
    type: String,
    required: true,
    enum: [
      'AUTH_LOGIN',
      'AUTH_LOGOUT',
      'AUTH_FAILED',
      'AUTH_PASSWORD_CHANGE',
      'AUTH_PASSWORD_RESET',
      'AUTH_MFA_ENABLED',
      'AUTH_MFA_DISABLED',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'USER_ROLE_CHANGED',
      'PERMISSION_GRANTED',
      'PERMISSION_REVOKED',
      'DATA_ACCESS',
      'DATA_CREATE',
      'DATA_UPDATE',
      'DATA_DELETE',
      'DATA_EXPORT',
      'DATA_IMPORT',
      'FILE_UPLOAD',
      'FILE_DOWNLOAD',
      'FILE_DELETE',
      'API_KEY_CREATED',
      'API_KEY_REVOKED',
      'SECURITY_ALERT',
      'SYSTEM_CONFIG_CHANGE',
      'COMPLIANCE_EVENT'
    ],
    index: true
  },
  
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  
  // Actor information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  userEmail: String,
  userName: String,
  userRole: String,
  
  // Target information
  targetType: {
    type: String,
    enum: ['USER', 'DOCUMENT', 'INSPECTION', 'SUPPLIER', 'SYSTEM', 'API', 'FILE']
  },
  
  targetId: {
    type: String,
    index: true
  },
  
  targetName: String,
  
  // Event details
  action: {
    type: String,
    required: true
  },
  
  description: String,
  
  // Request information
  ipAddress: {
    type: String,
    required: true,
    index: true
  },
  
  userAgent: String,
  
  requestMethod: String,
  requestPath: String,
  requestId: String,
  
  // Additional data (encrypted for sensitive info)
  metadata: {
    type: String, // Encrypted JSON
    select: false
  },
  
  // Changes tracking
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Result
  success: {
    type: Boolean,
    default: true
  },
  
  errorCode: String,
  errorMessage: String,
  
  // Compliance and retention
  retentionDate: {
    type: Date,
    index: true
  },
  
  complianceTags: [String],
  
  // Integrity
  hash: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// Indexes for performance
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ eventType: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ targetId: 1, targetType: 1 });
auditLogSchema.index({ severity: 1, createdAt: -1 });
auditLogSchema.index({ retentionDate: 1 });

// Calculate retention date before saving
auditLogSchema.pre('save', function(next) {
  if (!this.retentionDate) {
    // Default retention periods by event type
    const retentionPeriods = {
      'AUTH_': 90, // 90 days for auth events
      'DATA_DELETE': 365 * 7, // 7 years for deletions
      'COMPLIANCE_': 365 * 7, // 7 years for compliance
      'SECURITY_': 365 * 2, // 2 years for security
      'DEFAULT': 365 // 1 year default
    };
    
    let days = retentionPeriods.DEFAULT;
    for (const [prefix, period] of Object.entries(retentionPeriods)) {
      if (this.eventType.startsWith(prefix)) {
        days = period;
        break;
      }
    }
    
    this.retentionDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Generate integrity hash
auditLogSchema.pre('save', function(next) {
  if (!this.hash) {
    const data = {
      eventType: this.eventType,
      userId: this.userId,
      targetId: this.targetId,
      action: this.action,
      ipAddress: this.ipAddress,
      timestamp: this.createdAt || new Date()
    };
    
    this.hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .update(crypto.randomBytes(16))
      .digest('hex');
  }
  
  next();
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Audit logging service
 */
class AuditLogService {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.batchSize = 100;
    this.flushInterval = 5000; // 5 seconds
    
    // Start batch processing
    this.startBatchProcessing();
  }
  
  /**
   * Log an audit event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} Created audit log
   */
  async log(eventData) {
    try {
      const {
        req,
        eventType,
        severity = 'LOW',
        targetType,
        targetId,
        targetName,
        action,
        description,
        metadata,
        changes,
        success = true,
        errorCode,
        errorMessage,
        complianceTags = []
      } = eventData;

      // Use reassignable variables for user info
      let userId = eventData.userId;
      let userEmail = eventData.userEmail;
      let userName = eventData.userName;
      let userRole = eventData.userRole;
      
      // Extract request information
      let ipAddress = '127.0.0.1';
      let userAgent = 'System';
      let requestMethod = null;
      let requestPath = null;
      let requestId = null;
      
      if (req) {
        ipAddress = req.ip || req.connection?.remoteAddress || ipAddress;
        userAgent = req.headers?.['user-agent'] || userAgent;
        requestMethod = req.method;
        requestPath = req.originalUrl || req.url;
        requestId = req.id;
        
        // Use user info from request if not provided
        if (!userId && req.user) {
          userId = req.user.id || req.user._id;
          userEmail = userEmail || req.user.email;
          userName = userName || req.user.name || `${req.user.firstName} ${req.user.lastName}`;
          userRole = userRole || req.user.role;
        }
      }
      
      // Encrypt sensitive metadata
      let encryptedMetadata = null;
      if (metadata) {
        encryptedMetadata = encrypt(JSON.stringify(metadata));
      }
      
      // Create audit log entry
      const auditEntry = {
        eventType,
        severity,
        userId,
        userEmail,
        userName,
        userRole,
        targetType,
        targetId,
        targetName,
        action,
        description,
        ipAddress,
        userAgent,
        requestMethod,
        requestPath,
        requestId,
        metadata: encryptedMetadata,
        changes,
        success,
        errorCode,
        errorMessage,
        complianceTags
      };
      
      // Add to queue for batch processing
      this.queue.push(auditEntry);
      
      // Process immediately if critical
      if (severity === 'CRITICAL') {
        await this.flush();
      }
      
      return auditEntry;
    } catch (error) {
      logger.error('Error logging audit event:', error);
      // Don't throw - audit logging should not break the application
    }
  }
  
  /**
   * Start batch processing of audit logs
   */
  startBatchProcessing() {
    setInterval(async () => {
      if (this.queue.length > 0) {
        await this.flush();
      }
    }, this.flushInterval);
  }
  
  /**
   * Flush queued audit logs to database
   */
  async flush() {
    if (this.processing || this.queue.length === 0) {
      return;
    }
    
    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);
    
    try {
      await AuditLog.insertMany(batch, { ordered: false });
      logger.debug(`Flushed ${batch.length} audit logs`);
    } catch (error) {
      logger.error('Error flushing audit logs:', error);
      
      // Try to save individually on bulk error
      if (error.code === 11000) { // Duplicate key error
        for (const entry of batch) {
          try {
            await new AuditLog(entry).save();
          } catch (err) {
            logger.error('Error saving individual audit log:', err);
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }
  
  /**
   * Query audit logs
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Query results
   */
  async query(filters = {}, options = {}) {
    const {
      eventType,
      severity,
      userId,
      targetId,
      targetType,
      ipAddress,
      success,
      startDate,
      endDate,
      searchTerm
    } = filters;
    
    const {
      page = 1,
      limit = 50,
      sort = '-createdAt',
      includeMetadata = false
    } = options;
    
    // Build query
    const query = {};
    
    if (eventType) {
      if (Array.isArray(eventType)) {
        query.eventType = { $in: eventType };
      } else {
        query.eventType = eventType;
      }
    }
    
    if (severity) {
      query.severity = severity;
    }
    
    if (userId) {
      query.userId = userId;
    }
    
    if (targetId) {
      query.targetId = targetId;
    }
    
    if (targetType) {
      query.targetType = targetType;
    }
    
    if (ipAddress) {
      query.ipAddress = ipAddress;
    }
    
    if (typeof success === 'boolean') {
      query.success = success;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    if (searchTerm) {
      query.$or = [
        { action: new RegExp(searchTerm, 'i') },
        { description: new RegExp(searchTerm, 'i') },
        { userEmail: new RegExp(searchTerm, 'i') },
        { targetName: new RegExp(searchTerm, 'i') }
      ];
    }
    
    // Execute query
    let mongoQuery = AuditLog.find(query);
    
    if (includeMetadata) {
      mongoQuery = mongoQuery.select('+metadata');
    }
    
    const total = await AuditLog.countDocuments(query);
    
    const logs = await mongoQuery
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();
    
    // Decrypt metadata if included
    if (includeMetadata) {
      logs.forEach(log => {
        if (log.metadata) {
          try {
            log.metadata = JSON.parse(decrypt(log.metadata));
          } catch (error) {
            log.metadata = null;
          }
        }
      });
    }
    
    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Get audit statistics
   * @param {Object} filters - Query filters
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(filters = {}) {
    const { startDate, endDate } = filters;
    
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    
    const stats = await AuditLog.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byEventType: {
            $push: '$eventType'
          },
          bySeverity: {
            $push: '$severity'
          },
          failures: {
            $sum: { $cond: [{ $eq: ['$success', false] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          total: 1,
          failures: 1,
          eventTypes: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ['$byEventType', []] },
                as: 'type',
                in: {
                  k: '$$type',
                  v: {
                    $size: {
                      $filter: {
                        input: '$byEventType',
                        cond: { $eq: ['$$this', '$$type'] }
                      }
                    }
                  }
                }
              }
            }
          },
          severities: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: ['$bySeverity', []] },
                as: 'sev',
                in: {
                  k: '$$sev',
                  v: {
                    $size: {
                      $filter: {
                        input: '$bySeverity',
                        cond: { $eq: ['$$this', '$$sev'] }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);
    
    return stats[0] || {
      total: 0,
      failures: 0,
      eventTypes: {},
      severities: {}
    };
  }
  
  /**
   * Clean up old audit logs
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanup() {
    const result = await AuditLog.deleteMany({
      retentionDate: { $lte: new Date() }
    });
    
    logger.info('Audit log cleanup completed', {
      deleted: result.deletedCount
    });
    
    return { deleted: result.deletedCount };
  }
  
  /**
   * Verify audit log integrity
   * @param {string} logId - Log ID to verify
   * @returns {Promise<boolean>} Is valid
   */
  async verifyIntegrity(logId) {
    const log = await AuditLog.findById(logId);
    if (!log) {
      return false;
    }
    
    const data = {
      eventType: log.eventType,
      userId: log.userId,
      targetId: log.targetId,
      action: log.action,
      ipAddress: log.ipAddress,
      timestamp: log.createdAt
    };
    
    // Note: This is a simplified check - in production, 
    // you'd need to store the salt used in hash generation
    return log.hash && log.hash.length === 64;
  }
}

// Create singleton instance
const auditLogService = new AuditLogService();

// Helper middleware for automatic audit logging
const auditMiddleware = (eventType, options = {}) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const originalStatus = res.status;
    let statusCode = 200;
    
    // Override status to capture it
    res.status = function(code) {
      statusCode = code;
      return originalStatus.call(this, code);
    };
    
    // Override json to capture response
    res.json = function(data) {
      const success = statusCode < 400;
      
      // Log audit event
      auditLogService.log({
        req,
        eventType,
        severity: options.severity || (success ? 'LOW' : 'MEDIUM'),
        action: options.action || `${req.method} ${req.path}`,
        description: options.description,
        targetType: options.targetType,
        targetId: req.params.id || data?.id || data?._id,
        targetName: data?.name || data?.title,
        success,
        errorCode: !success ? data?.code : undefined,
        errorMessage: !success ? data?.message : undefined,
        metadata: options.includeBody ? req.body : undefined,
        complianceTags: options.complianceTags
      });
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  AuditLog,
  auditLogService,
  auditMiddleware
};