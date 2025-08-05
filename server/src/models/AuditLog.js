/**
 * Audit Log Model
 * 
 * Stores audit logs for sensitive operations in the system.
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Audit Log Schema
 */
const auditLogSchema = new Schema({
  // User who performed the action
  user: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Allow for system actions
    },
    username: {
      type: String,
      required: false
    },
    email: {
      type: String,
      required: false
    },
    role: {
      type: String,
      required: false
    }
  },

  // Action information
  action: {
    type: String,
    required: true,
    index: true
  },
  
  // Entity that was acted upon
  entity: {
    type: String,
    required: true,
    index: true
  },
  
  // ID of the entity
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    index: true
  },
  
  // Status of the action (success, failure, etc.)
  status: {
    type: String,
    enum: ['success', 'failure', 'warning', 'info'],
    default: 'success'
  },
  
  // Description of the action
  description: {
    type: String,
    required: true
  },
  
  // Timestamp of the action
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Additional metadata
  metadata: {
    // IP address of the user
    ip: {
      type: String,
      required: false
    },
    
    // User agent
    userAgent: {
      type: String,
      required: false
    },
    
    // Request ID for tracing
    requestId: {
      type: String,
      required: false
    },
    
    // Changes made (for update operations)
    changes: {
      type: Object,
      required: false
    },
    
    // Additional context-specific data
    context: {
      type: Object,
      required: false
    }
  },
  
  // Severity level
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Whether this is a sensitive operation
  sensitive: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Add text index for searching
auditLogSchema.index({
  'description': 'text',
  'action': 'text',
  'entity': 'text'
});

// Virtual for full user name
auditLogSchema.virtual('userFullName').get(function() {
  if (!this.user || !this.user.username) return 'System';
  return this.user.username;
});

// Method to sanitize sensitive data
auditLogSchema.methods.sanitize = function() {
  const sanitized = this.toObject();
  
  // Remove sensitive user information if present
  if (sanitized.user && sanitized.user.email) {
    sanitized.user.email = sanitized.user.email.replace(/^(.{3})(.*)(@.*)$/, '$1***$3');
  }
  
  // Remove sensitive metadata
  if (sanitized.metadata) {
    if (sanitized.metadata.ip) {
      sanitized.metadata.ip = sanitized.metadata.ip.replace(/\.\d+\.\d+$/, '.xxx.xxx');
    }
    
    // Remove any sensitive data from changes
    if (sanitized.metadata.changes) {
      const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit', 'ssn', 'social'];
      
      for (const field of sensitiveFields) {
        if (sanitized.metadata.changes[field]) {
          sanitized.metadata.changes[field] = '********';
        }
      }
    }
  }
  
  return sanitized;
};

// Static method to create audit log
auditLogSchema.statics.createLog = async function(logData) {
  try {
    return await this.create(logData);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
    return null;
  }
};

// Static method to find logs by entity
auditLogSchema.statics.findByEntity = function(entity, entityId) {
  return this.find({ entity, entityId })
    .sort({ timestamp: -1 });
};

// Static method to find logs by user
auditLogSchema.statics.findByUser = function(userId) {
  return this.find({ 'user.id': userId })
    .sort({ timestamp: -1 });
};

// Static method to find sensitive operations
auditLogSchema.statics.findSensitiveOperations = function(options = {}) {
  const query = { sensitive: true };
  
  if (options.from) {
    query.timestamp = { $gte: options.from };
  }
  
  if (options.to) {
    query.timestamp = { ...query.timestamp, $lte: options.to };
  }
  
  if (options.severity) {
    query.severity = options.severity;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog; 