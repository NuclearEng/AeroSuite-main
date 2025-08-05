/**
 * Mongoose Encryption Plugin
 * Related to: TS132 - Data Encryption Core, SEC003 - Data Encryption at Rest
 * 
 * Provides field-level encryption for mongoose models.
 */

const encryptionCore = require('../core/encryption');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('./securityEventLogger');

/**
 * Create a mongoose encryption plugin
 * @param {Array<string>} fields - Fields to encrypt
 * @param {Object} options - Additional options
 * @returns {Function} Mongoose plugin
 */
function createEncryptionPlugin(fields = [], options = {}) {
  const {
    encryptedFieldsPath = '_encryptedFields',
    keyId = null,
    debug = false
  } = options;
  
  return function(schema) {
    // Add indicator field for encryption
    const schemaAddition = {};
    schemaAddition[encryptedFieldsPath] = {
      type: [String],
      select: false
    };
    schema.add(schemaAddition);
    
    // Pre-save hook to encrypt fields
    schema.pre('save', async function(next) {
      try {
        const encryptedFields = [];
        
        // Encrypt specified fields
        for (const field of fields) {
          if (this[field] && (typeof this[field] === 'string' || Buffer.isBuffer(this[field]))) {
            // Skip already encrypted fields
            if (typeof this[field] === 'string' && this[field].includes(':')) {
              try {
                // Try to decrypt to check if it's already encrypted
                await encryptionCore.decryptData(this[field]);
                // If we reach here, it's already encrypted
                encryptedFields.push(field);
                continue;
              } catch (error) {
                // Not encrypted, proceed with encryption
              }
            }
            
            const originalValue = this[field];
            this[field] = await encryptionCore.encryptData(originalValue, keyId);
            encryptedFields.push(field);
            
            if (debug) {
              console.log(`Encrypted field ${field} for ${this.constructor.modelName}`);
            }
          }
        }
        
        // Store list of encrypted fields
        this[encryptedFieldsPath] = encryptedFields;
        next();
      } catch (error) {
        logSecurityEvent(
          'DATABASE',
          SEC_EVENT_SEVERITY.ERROR,
          `Failed to encrypt fields for ${this.constructor.modelName}`,
          {
            component: 'MongooseEncryption',
            action: 'ENCRYPT_FIELDS',
            error: error.message,
            modelName: this.constructor.modelName
          }
        );
        next(error);
      }
    });
    
    // Method to decrypt fields
    schema.methods.decryptFields = async function() {
      try {
        const encryptedFields = this[encryptedFieldsPath] || [];
        
        for (const field of encryptedFields) {
          if (this[field]) {
            const encryptedValue = this[field];
            this[field] = await encryptionCore.decryptData(encryptedValue);
            
            if (debug) {
              console.log(`Decrypted field ${field} for ${this.constructor.modelName}`);
            }
          }
        }
        
        return this;
      } catch (error) {
        logSecurityEvent(
          'DATABASE',
          SEC_EVENT_SEVERITY.ERROR,
          `Failed to decrypt fields for ${this.constructor.modelName}`,
          {
            component: 'MongooseEncryption',
            action: 'DECRYPT_FIELDS',
            error: error.message,
            modelName: this.constructor.modelName
          }
        );
        throw new Error(`Failed to decrypt fields: ${error.message}`);
      }
    };
    
    // Post-find middleware to decrypt fields in query results
    schema.post('find', async function(docs) {
      if (!Array.isArray(docs)) return;
      
      for (const doc of docs) {
        if (doc && doc[encryptedFieldsPath] && doc[encryptedFieldsPath].length > 0) {
          try {
            await doc.decryptFields();
          } catch (error) {
            if (debug) {
              console.error(`Error decrypting fields in find result: ${error.message}`);
            }
          }
        }
      }
    });
    
    // Post-findOne middleware to decrypt fields
    schema.post('findOne', async function(doc) {
      if (doc && doc[encryptedFieldsPath] && doc[encryptedFieldsPath].length > 0) {
        try {
          await doc.decryptFields();
        } catch (error) {
          if (debug) {
            console.error(`Error decrypting fields in findOne result: ${error.message}`);
          }
        }
      }
    });
    
    // Post-findById middleware to decrypt fields
    schema.post('findById', async function(doc) {
      if (doc && doc[encryptedFieldsPath] && doc[encryptedFieldsPath].length > 0) {
        try {
          await doc.decryptFields();
        } catch (error) {
          if (debug) {
            console.error(`Error decrypting fields in findById result: ${error.message}`);
          }
        }
      }
    });
    
    // Method to re-encrypt fields with a new key
    schema.methods.reEncryptFields = async function(newKeyId) {
      try {
        const encryptedFields = this[encryptedFieldsPath] || [];
        
        // First decrypt all encrypted fields
        for (const field of encryptedFields) {
          if (this[field]) {
            this[field] = await encryptionCore.decryptData(this[field]);
          }
        }
        
        // Then re-encrypt with the new key
        for (const field of encryptedFields) {
          if (this[field]) {
            this[field] = await encryptionCore.encryptData(this[field], newKeyId);
          }
        }
        
        return this;
      } catch (error) {
        logSecurityEvent(
          'DATABASE',
          SEC_EVENT_SEVERITY.ERROR,
          `Failed to re-encrypt fields for ${this.constructor.modelName}`,
          {
            component: 'MongooseEncryption',
            action: 'RE_ENCRYPT_FIELDS',
            error: error.message,
            modelName: this.constructor.modelName,
            newKeyId
          }
        );
        throw new Error(`Failed to re-encrypt fields: ${error.message}`);
      }
    };
    
    // Static method to re-encrypt all documents
    schema.statics.reEncryptAll = async function(newKeyId) {
      try {
        const documents = await this.find({});
        let updated = 0;
        
        for (const doc of documents) {
          if (doc[encryptedFieldsPath] && doc[encryptedFieldsPath].length > 0) {
            await doc.reEncryptFields(newKeyId);
            await doc.save();
            updated++;
          }
        }
        
        logSecurityEvent(
          'DATABASE',
          SEC_EVENT_SEVERITY.INFO,
          `Re-encrypted ${updated} documents for ${this.modelName}`,
          {
            component: 'MongooseEncryption',
            action: 'RE_ENCRYPT_ALL',
            modelName: this.modelName,
            newKeyId,
            documentCount: updated
          }
        );
        
        return { updated };
      } catch (error) {
        logSecurityEvent(
          'DATABASE',
          SEC_EVENT_SEVERITY.ERROR,
          `Failed to re-encrypt all documents for ${this.modelName}`,
          {
            component: 'MongooseEncryption',
            action: 'RE_ENCRYPT_ALL',
            error: error.message,
            modelName: this.modelName,
            newKeyId
          }
        );
        throw new Error(`Failed to re-encrypt all documents: ${error.message}`);
      }
    };
  };
}

module.exports = createEncryptionPlugin; 