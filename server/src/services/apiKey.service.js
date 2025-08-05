const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { auditLogService } = require('./auditLog.service');
const logger = require('../utils/logger');

// API Key schema
const apiKeySchema = new mongoose.Schema({
  // Key identification
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  description: String,
  
  // Key value (hashed)
  keyHash: {
    type: String,
    required: true,
    unique: true,
    select: false
  },
  
  // Key prefix for identification (first 8 chars)
  keyPrefix: {
    type: String,
    required: true,
    index: true
  },
  
  // Key metadata
  lastUsed: Date,
  lastUsedIp: String,
  usageCount: {
    type: Number,
    default: 0
  },
  
  // Ownership
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Permissions and scopes
  scopes: [{
    type: String,
    enum: [
      'read:inspections',
      'write:inspections',
      'delete:inspections',
      'read:suppliers',
      'write:suppliers',
      'delete:suppliers',
      'read:reports',
      'write:reports',
      'read:users',
      'write:users',
      'admin:all'
    ]
  }],
  
  // Rate limiting
  rateLimit: {
    requests: {
      type: Number,
      default: 1000
    },
    period: {
      type: String,
      default: 'hour',
      enum: ['minute', 'hour', 'day']
    }
  },
  
  // IP restrictions
  allowedIps: [String],
  
  // Validity
  expiresAt: Date,
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  revokedAt: Date,
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  revokedReason: String,
  
  // Rotation
  rotatedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey'
  },
  
  rotatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ApiKey'
  }
}, {
  timestamps: true,
  collection: 'api_keys'
});

// Indexes
apiKeySchema.index({ userId: 1, isActive: 1 });
apiKeySchema.index({ expiresAt: 1 });
apiKeySchema.index({ keyPrefix: 1, isActive: 1 });

// Check if key is valid
apiKeySchema.methods.isValid = function() {
  if (!this.isActive) return false;
  if (this.revokedAt) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  return true;
};

// Check if IP is allowed
apiKeySchema.methods.isIpAllowed = function(ip) {
  if (!this.allowedIps || this.allowedIps.length === 0) return true;
  return this.allowedIps.includes(ip);
};

// Check if scope is allowed
apiKeySchema.methods.hasScope = function(scope) {
  if (this.scopes.includes('admin:all')) return true;
  return this.scopes.includes(scope);
};

// Update usage statistics
apiKeySchema.methods.recordUsage = async function(ip) {
  this.lastUsed = new Date();
  this.lastUsedIp = ip;
  this.usageCount += 1;
  await this.save();
};

const ApiKey = mongoose.model('ApiKey', apiKeySchema);

/**
 * API Key Service
 */
class ApiKeyService {
  constructor() {
    this.keyLength = 32; // 256 bits
    this.prefixLength = 8;
    this.saltRounds = 10;
  }
  
  /**
   * Generate a new API key
   * @returns {Object} Key and hash
   */
  generateApiKey() {
    const key = crypto.randomBytes(this.keyLength).toString('base64url');
    const prefix = key.substring(0, this.prefixLength);
    return { key, prefix };
  }
  
  /**
   * Hash an API key
   * @param {string} key - API key
   * @returns {Promise<string>} Hashed key
   */
  async hashApiKey(key) {
    return bcrypt.hash(key, this.saltRounds);
  }
  
  /**
   * Verify an API key
   * @param {string} key - API key
   * @param {string} hash - Key hash
   * @returns {Promise<boolean>} Is valid
   */
  async verifyApiKey(key, hash) {
    return bcrypt.compare(key, hash);
  }
  
  /**
   * Create a new API key
   * @param {Object} data - Key data
   * @param {Object} req - Express request
   * @returns {Promise<Object>} Created key
   */
  async createApiKey(data, req) {
    const {
      userId,
      name,
      description,
      scopes = [],
      rateLimit,
      allowedIps = [],
      expiresInDays
    } = data;
    
    // Generate key
    const { key, prefix } = this.generateApiKey();
    const keyHash = await this.hashApiKey(key);
    
    // Calculate expiry
    let expiresAt = null;
    if (expiresInDays) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
    }
    
    // Create key record
    const apiKey = new ApiKey({
      name,
      description,
      keyHash,
      keyPrefix: prefix,
      userId,
      scopes,
      rateLimit,
      allowedIps,
      expiresAt
    });
    
    await apiKey.save();
    
    // Audit log
    await auditLogService.log({
      req,
      eventType: 'API_KEY_CREATED',
      severity: 'MEDIUM',
      action: 'Create API Key',
      description: `API key "${name}" created`,
      targetType: 'API',
      targetId: apiKey._id.toString(),
      targetName: name,
      metadata: {
        scopes,
        expiresAt,
        allowedIps: allowedIps.length > 0
      }
    });
    
    logger.info('API key created', {
      keyId: apiKey._id,
      userId,
      name,
      scopes
    });
    
    // Return key only once
    return {
      id: apiKey._id,
      key: `${prefix}.${key}`, // Full key with prefix
      name: apiKey.name,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
      createdAt: apiKey.createdAt
    };
  }
  
  /**
   * Authenticate with API key
   * @param {string} keyString - API key string
   * @param {string} requiredScope - Required scope
   * @param {string} ip - Request IP
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateApiKey(keyString, requiredScope, ip) {
    try {
      // Parse key
      const [prefix, key] = keyString.split('.');
      if (!prefix || !key) {
        return { success: false, error: 'Invalid key format' };
      }
      
      // Find key by prefix
      const apiKey = await ApiKey.findOne({
        keyPrefix: prefix,
        isActive: true
      }).select('+keyHash');
      
      if (!apiKey) {
        return { success: false, error: 'Invalid API key' };
      }
      
      // Verify key
      const isValid = await this.verifyApiKey(key, apiKey.keyHash);
      if (!isValid) {
        return { success: false, error: 'Invalid API key' };
      }
      
      // Check if key is valid
      if (!apiKey.isValid()) {
        return { success: false, error: 'API key expired or revoked' };
      }
      
      // Check IP restrictions
      if (!apiKey.isIpAllowed(ip)) {
        await auditLogService.log({
          eventType: 'SECURITY_ALERT',
          severity: 'HIGH',
          action: 'API Key IP Restriction',
          description: `API key used from unauthorized IP: ${ip}`,
          targetType: 'API',
          targetId: apiKey._id.toString(),
          ipAddress: ip,
          success: false
        });
        
        return { success: false, error: 'IP not allowed' };
      }
      
      // Check scope
      if (requiredScope && !apiKey.hasScope(requiredScope)) {
        return { success: false, error: 'Insufficient permissions' };
      }
      
      // Record usage
      await apiKey.recordUsage(ip);
      
      // Get user
      const user = await mongoose.model('User').findById(apiKey.userId);
      if (!user || !user.isActive) {
        return { success: false, error: 'User account inactive' };
      }
      
      return {
        success: true,
        apiKey,
        user,
        scopes: apiKey.scopes
      };
    } catch (error) {
      logger.error('API key authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }
  
  /**
   * List API keys for a user
   * @param {string} userId - User ID
   * @param {boolean} includeRevoked - Include revoked keys
   * @returns {Promise<Array>} API keys
   */
  async listApiKeys(userId, includeRevoked = false) {
    const query = { userId };
    if (!includeRevoked) {
      query.isActive = true;
      query.revokedAt = { $exists: false };
    }
    
    const keys = await ApiKey.find(query)
      .select('-keyHash')
      .sort('-createdAt')
      .lean();
    
    // Add validity status
    return keys.map(key => ({
      ...key,
      isValid: !key.revokedAt && key.isActive && (!key.expiresAt || key.expiresAt > new Date())
    }));
  }
  
  /**
   * Revoke an API key
   * @param {string} keyId - Key ID
   * @param {string} revokedBy - User ID who revoked
   * @param {string} reason - Revocation reason
   * @param {Object} req - Express request
   * @returns {Promise<Object>} Revoked key
   */
  async revokeApiKey(keyId, revokedBy, reason, req) {
    const apiKey = await ApiKey.findById(keyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }
    
    if (apiKey.revokedAt) {
      throw new Error('API key already revoked');
    }
    
    apiKey.isActive = false;
    apiKey.revokedAt = new Date();
    apiKey.revokedBy = revokedBy;
    apiKey.revokedReason = reason;
    
    await apiKey.save();
    
    // Audit log
    await auditLogService.log({
      req,
      eventType: 'API_KEY_REVOKED',
      severity: 'MEDIUM',
      action: 'Revoke API Key',
      description: `API key "${apiKey.name}" revoked: ${reason}`,
      targetType: 'API',
      targetId: keyId,
      targetName: apiKey.name,
      metadata: { reason }
    });
    
    logger.info('API key revoked', {
      keyId,
      revokedBy,
      reason
    });
    
    return apiKey;
  }
  
  /**
   * Rotate an API key
   * @param {string} keyId - Key ID to rotate
   * @param {Object} req - Express request
   * @returns {Promise<Object>} New key
   */
  async rotateApiKey(keyId, req) {
    const oldKey = await ApiKey.findById(keyId);
    if (!oldKey) {
      throw new Error('API key not found');
    }
    
    if (!oldKey.isValid()) {
      throw new Error('Cannot rotate invalid key');
    }
    
    // Create new key with same settings
    const newKeyData = await this.createApiKey({
      userId: oldKey.userId,
      name: `${oldKey.name} (Rotated)`,
      description: oldKey.description,
      scopes: oldKey.scopes,
      rateLimit: oldKey.rateLimit,
      allowedIps: oldKey.allowedIps,
      expiresInDays: oldKey.expiresAt 
        ? Math.ceil((oldKey.expiresAt - new Date()) / (24 * 60 * 60 * 1000))
        : null
    }, req);
    
    // Link keys
    oldKey.rotatedTo = newKeyData.id;
    await oldKey.save();
    
    await ApiKey.findByIdAndUpdate(newKeyData.id, {
      rotatedFrom: oldKey._id
    });
    
    // Revoke old key after grace period
    setTimeout(async () => {
      try {
        await this.revokeApiKey(keyId, oldKey.userId, 'Rotated', req);
      } catch (error) {
        logger.error('Error revoking rotated key:', error);
      }
    }, 24 * 60 * 60 * 1000); // 24 hours grace period
    
    logger.info('API key rotated', {
      oldKeyId: keyId,
      newKeyId: newKeyData.id
    });
    
    return newKeyData;
  }
  
  /**
   * Clean up expired keys
   * @returns {Promise<Object>} Cleanup results
   */
  async cleanupExpiredKeys() {
    const result = await ApiKey.updateMany(
      {
        isActive: true,
        expiresAt: { $lte: new Date() }
      },
      {
        isActive: false
      }
    );
    
    logger.info('Expired API keys cleaned up', {
      count: result.modifiedCount
    });
    
    return { cleaned: result.modifiedCount };
  }
  
  /**
   * Get API key statistics
   * @param {string} userId - User ID (optional)
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics(userId = null) {
    const match = {};
    if (userId) {
      match.userId = mongoose.Types.ObjectId(userId);
    }
    
    const stats = await ApiKey.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          revoked: {
            $sum: { $cond: ['$revokedAt', 1, 0] }
          },
          expired: {
            $sum: {
              $cond: [
                { $and: [
                  '$expiresAt',
                  { $lte: ['$expiresAt', new Date()] }
                ]},
                1,
                0
              ]
            }
          },
          totalUsage: { $sum: '$usageCount' }
        }
      }
    ]);
    
    return stats[0] || {
      total: 0,
      active: 0,
      revoked: 0,
      expired: 0,
      totalUsage: 0
    };
  }
}

// Create singleton instance
const apiKeyService = new ApiKeyService();

// Middleware for API key authentication
const apiKeyAuth = (requiredScope = null) => {
  return async (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }
    
    const result = await apiKeyService.authenticateApiKey(
      apiKey,
      requiredScope,
      req.ip
    );
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error
      });
    }
    
    // Attach to request
    req.apiKey = result.apiKey;
    req.user = result.user;
    req.scopes = result.scopes;
    
    next();
  };
};

module.exports = {
  ApiKey,
  apiKeyService,
  apiKeyAuth
};