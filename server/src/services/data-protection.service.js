/**
 * Data Protection Service
 * 
 * This service provides comprehensive data protection capabilities including:
 * - Sensitive data encryption
 * - Secure data deletion
 * - Data anonymization for analytics
 */

const crypto = require('crypto');
const encryptionCore = require('../core/encryption');
const mongoose = require('mongoose');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');
const createEncryptionPlugin = require('../utils/mongoose-encryption-plugin');

/**
 * Data Protection Service
 */
class DataProtectionService {
  constructor() {
    this.initialized = false;
    this.sensitiveFieldsMap = new Map();
    this.anonymizationRules = new Map();
  }

  /**
   * Initialize the data protection service
   * @param {Object} options - Configuration options
   * @returns {Promise<boolean>} Success status
   */
  async initialize(options = {}) {
    try {
      // Ensure encryption core is initialized
      await encryptionCore.initialize(options.encryption);
      
      // Register sensitive fields for each model
      this.registerSensitiveFields();
      
      // Set up anonymization rules
      this.setupAnonymizationRules();
      
      this.initialized = true;
      
      logSecurityEvent(
        'DATA_PROTECTION',
        SEC_EVENT_SEVERITY.INFO,
        'Data protection service initialized',
        { component: 'DataProtectionService', action: 'INITIALIZE' }
      );
      
      return true;
    } catch (error) {
      logSecurityEvent(
        'DATA_PROTECTION',
        SEC_EVENT_SEVERITY.ERROR,
        'Failed to initialize data protection service',
        { 
          component: 'DataProtectionService', 
          action: 'INITIALIZE', 
          error: error.message 
        }
      );
      throw error;
    }
  }

  /**
   * Register sensitive fields for each model
   */
  registerSensitiveFields() {
    // User model sensitive fields
    this.sensitiveFieldsMap.set('User', [
      'email',
      'phoneNumber',
      'personalDetails.address',
      'personalDetails.dateOfBirth',
      'personalDetails.governmentId',
      'authenticationDetails.totpSecret',
      'authenticationDetails.recoveryKeys',
      'authenticationDetails.passwordResetToken'
    ]);
    
    // Customer model sensitive fields
    this.sensitiveFieldsMap.set('Customer', [
      'contactDetails.email',
      'contactDetails.phoneNumber',
      'contactDetails.address',
      'paymentInformation.accountNumber',
      'paymentInformation.routingNumber',
      'notes'
    ]);
    
    // Supplier model sensitive fields
    this.sensitiveFieldsMap.set('Supplier', [
      'contactDetails.email',
      'contactDetails.phoneNumber',
      'contactDetails.address',
      'bankingDetails.accountNumber',
      'bankingDetails.routingNumber',
      'contractDetails.terms'
    ]);
    
    // Inspection model sensitive fields
    this.sensitiveFieldsMap.set('Inspection', [
      'notes',
      'privateComments',
      'inspectorNotes'
    ]);
  }

  /**
   * Set up anonymization rules for analytics
   */
  setupAnonymizationRules() {
    // User anonymization rules
    this.anonymizationRules.set('User', {
      email: (value) => this.hashIdentifier(value),
      phoneNumber: () => '[REDACTED]',
      personalDetails: {
        address: () => '[REDACTED]',
        dateOfBirth: (value) => value ? new Date(value).getFullYear() : null,
        governmentId: () => '[REDACTED]'
      },
      // Keep non-sensitive fields
      retain: ['role', 'preferences', 'createdAt', 'lastLogin']
    });
    
    // Customer anonymization rules
    this.anonymizationRules.set('Customer', {
      contactDetails: {
        email: (value) => this.hashIdentifier(value),
        phoneNumber: () => '[REDACTED]',
        address: (address) => address ? { country: address.country, state: address.state } : null
      },
      paymentInformation: () => null,
      notes: () => '[REDACTED]',
      // Keep non-sensitive fields
      retain: ['customerType', 'status', 'industry', 'createdAt']
    });
    
    // Supplier anonymization rules
    this.anonymizationRules.set('Supplier', {
      contactDetails: {
        email: (value) => this.hashIdentifier(value),
        phoneNumber: () => '[REDACTED]',
        address: (address) => address ? { country: address.country, state: address.state } : null
      },
      bankingDetails: () => null,
      contractDetails: {
        terms: () => '[REDACTED]'
      },
      // Keep non-sensitive fields
      retain: ['supplierType', 'status', 'industry', 'createdAt', 'performance']
    });
  }

  /**
   * Apply encryption plugin to a mongoose schema
   * @param {mongoose.Schema} schema - Mongoose schema
   * @param {string} modelName - Model name
   * @param {Object} options - Additional options
   * @returns {mongoose.Schema} Modified schema
   */
  applyEncryptionToSchema(schema, modelName, options = {}) {
    const sensitiveFields = this.sensitiveFieldsMap.get(modelName) || [];
    
    if (sensitiveFields.length > 0) {
      const encryptionPlugin = createEncryptionPlugin(sensitiveFields, {
        debug: process.env.NODE_ENV === 'development',
        ...options
      });
      
      schema.plugin(encryptionPlugin);
      
      logSecurityEvent(
        'DATA_PROTECTION',
        SEC_EVENT_SEVERITY.INFO,
        `Applied encryption to ${modelName} schema`,
        { 
          component: 'DataProtectionService', 
          action: 'APPLY_ENCRYPTION',
          modelName,
          fieldCount: sensitiveFields.length
        }
      );
    }
    
    return schema;
  }

  /**
   * Securely delete a document from the database
   * @param {mongoose.Model} model - Mongoose model
   * @param {string|Object} id - Document ID or query
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Result object
   */
  async securelyDeleteDocument(model, id, options = {}) {
    try {
      const { softDelete = true, auditTrail = true } = options;
      
      // Find the document
      const query = typeof id === 'string' ? { _id: id } : id;
      const document = await model.findOne(query);
      
      if (!document) {
        return { success: false, message: 'Document not found' };
      }
      
      if (softDelete) {
        // Soft delete - overwrite sensitive fields with null values
        const sensitiveFields = this.sensitiveFieldsMap.get(model.modelName) || [];
        
        for (const field of sensitiveFields) {
          const fieldParts = field.split('.');
          
          if (fieldParts.length === 1) {
            document[field] = null;
          } else {
            let obj = document;
            for (let i = 0; i < fieldParts.length - 1; i++) {
              if (obj[fieldParts[i]]) {
                obj = obj[fieldParts[i]];
              } else {
                break;
              }
            }
            
            const lastPart = fieldParts[fieldParts.length - 1];
            if (obj && obj[lastPart] !== undefined) {
              obj[lastPart] = null;
            }
          }
        }
        
        // Mark as deleted
        document.deleted = true;
        document.deletedAt = new Date();
        
        // Save the document with nullified sensitive fields
        await document.save();
      } else {
        // Hard delete - remove the document completely
        await model.deleteOne(query);
      }
      
      if (auditTrail) {
        logSecurityEvent(
          'DATA_PROTECTION',
          SEC_EVENT_SEVERITY.INFO,
          `Document ${softDelete ? 'soft' : 'hard'} deleted`,
          { 
            component: 'DataProtectionService', 
            action: 'DELETE_DOCUMENT',
            modelName: model.modelName,
            documentId: document._id.toString(),
            deleteType: softDelete ? 'soft' : 'hard'
          }
        );
      }
      
      return { 
        success: true, 
        message: `Document ${softDelete ? 'soft' : 'hard'} deleted successfully`,
        documentId: document._id.toString()
      };
    } catch (error) {
      logSecurityEvent(
        'DATA_PROTECTION',
        SEC_EVENT_SEVERITY.ERROR,
        'Failed to securely delete document',
        { 
          component: 'DataProtectionService', 
          action: 'DELETE_DOCUMENT', 
          error: error.message,
          modelName: model.modelName
        }
      );
      throw error;
    }
  }

  /**
   * Anonymize a document for analytics
   * @param {Object} document - Document to anonymize
   * @param {string} modelName - Model name
   * @returns {Object} Anonymized document
   */
  anonymizeDocument(document, modelName) {
    try {
      if (!document) return null;
      
      const rules = this.anonymizationRules.get(modelName);
      if (!rules) return document; // No rules defined, return original
      
      // Create a copy to avoid modifying the original
      const anonymized = { ...document };
      
      // Apply anonymization rules
      this._applyAnonymizationRules(anonymized, rules);
      
      return anonymized;
    } catch (error) {
      logSecurityEvent(
        'DATA_PROTECTION',
        SEC_EVENT_SEVERITY.ERROR,
        'Failed to anonymize document',
        { 
          component: 'DataProtectionService', 
          action: 'ANONYMIZE_DOCUMENT', 
          error: error.message,
          modelName
        }
      );
      throw error;
    }
  }

  /**
   * Apply anonymization rules recursively
   * @param {Object} obj - Object to anonymize
   * @param {Object} rules - Anonymization rules
   * @private
   */
  _applyAnonymizationRules(obj, rules) {
    if (!obj || typeof obj !== 'object' || !rules) return;
    
    // Handle special case for retained fields
    const retainFields = rules.retain || [];
    
    // Process each field in the object
    for (const key in obj) {
      if (retainFields.includes(key)) continue; // Skip retained fields
      
      if (key in rules) {
        const rule = rules[key];
        
        if (typeof rule === 'function') {
          // Apply function rule
          obj[key] = rule(obj[key]);
        } else if (typeof rule === 'object' && obj[key] && typeof obj[key] === 'object') {
          // Apply nested rules
          this._applyAnonymizationRules(obj[key], rule);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        // For fields without specific rules, recursively check nested objects
        // (unless they're in the retain list)
        if (Array.isArray(obj[key])) {
          // Handle arrays
          for (let i = 0; i < obj[key].length; i++) {
            if (typeof obj[key][i] === 'object' && obj[key][i] !== null) {
              this._applyAnonymizationRules(obj[key][i], rules);
            }
          }
        } else {
          // Handle nested objects
          this._applyAnonymizationRules(obj[key], rules);
        }
      }
    }
  }

  /**
   * Hash an identifier for anonymization
   * @param {string} value - Value to hash
   * @returns {string} Hashed value
   */
  hashIdentifier(value) {
    if (!value) return null;
    
    // Use SHA-256 for consistent anonymization
    return crypto
      .createHash('sha256')
      .update(value)
      .digest('hex')
      .substring(0, 16); // Use first 16 chars for brevity
  }

  /**
   * Prepare a dataset for analytics by anonymizing sensitive data
   * @param {Array<Object>} documents - Documents to anonymize
   * @param {string} modelName - Model name
   * @returns {Array<Object>} Anonymized documents
   */
  prepareDataForAnalytics(documents, modelName) {
    if (!Array.isArray(documents)) {
      return this.anonymizeDocument(documents, modelName);
    }
    
    return documents.map(doc => this.anonymizeDocument(doc, modelName));
  }

  /**
   * Rotate encryption keys for a model
   * @param {mongoose.Model} model - Mongoose model
   * @param {string} newKeyId - New key ID
   * @returns {Promise<Object>} Result object
   */
  async rotateEncryptionKeys(model, newKeyId) {
    try {
      // Generate a new encryption key if not provided
      if (!newKeyId) {
        newKeyId = `key-${Date.now()}`;
        await encryptionCore.rotateEncryptionKey(newKeyId);
      }
      
      // Re-encrypt all documents with the new key
      const result = await model.reEncryptAll(newKeyId);
      
      logSecurityEvent(
        'DATA_PROTECTION',
        SEC_EVENT_SEVERITY.INFO,
        `Rotated encryption keys for ${model.modelName}`,
        { 
          component: 'DataProtectionService', 
          action: 'ROTATE_KEYS',
          modelName: model.modelName,
          newKeyId,
          documentCount: result.updated
        }
      );
      
      return {
        success: true,
        message: `Rotated encryption keys for ${result.updated} documents`,
        keyId: newKeyId,
        updated: result.updated
      };
    } catch (error) {
      logSecurityEvent(
        'DATA_PROTECTION',
        SEC_EVENT_SEVERITY.ERROR,
        `Failed to rotate encryption keys for ${model.modelName}`,
        { 
          component: 'DataProtectionService', 
          action: 'ROTATE_KEYS', 
          error: error.message,
          modelName: model.modelName,
          newKeyId
        }
      );
      throw error;
    }
  }

  /**
   * Get service status
   * @returns {Promise<Object>} Status object
   */
  async getStatus() {
    try {
      const encryptionStatus = await encryptionCore.getStatus();
      
      return {
        initialized: this.initialized,
        encryptionCore: encryptionStatus,
        protectedModels: Array.from(this.sensitiveFieldsMap.keys()),
        anonymizationRulesConfigured: Array.from(this.anonymizationRules.keys())
      };
    } catch (error) {
      logSecurityEvent(
        'DATA_PROTECTION',
        SEC_EVENT_SEVERITY.ERROR,
        'Failed to get data protection service status',
        { 
          component: 'DataProtectionService', 
          action: 'GET_STATUS', 
          error: error.message
        }
      );
      throw error;
    }
  }
}

module.exports = new DataProtectionService(); 