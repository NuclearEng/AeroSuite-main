const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Get encryption key from environment or generate one
// In production, this should be set in environment variables
const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY || 
  crypto.randomBytes(32).toString('hex');
  
// Initialization vector length for AES-256
const IV_LENGTH = 16;

/**
 * Encrypts data using AES-256-CBC
 * @param {string} text - The plaintext to encrypt
 * @returns {string} - The encrypted text as a hex string with IV prepended
 */
function encrypt(text) {
  if (!text) return null;
  
  try {
    // Create initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher using AES-256-CBC
    const cipher = crypto.createCipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY, 'hex'), 
      iv
    );
    
    // Encrypt the data
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend the IV to the encrypted data (IV needs to be stored for decryption)
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data that was encrypted with the encrypt function
 * @param {string} encryptedText - The encrypted text with IV prepended
 * @returns {string} - The decrypted plaintext
 */
function decrypt(encryptedText) {
  if (!encryptedText) return null;
  
  try {
    // Split the IV and encrypted data
    const parts = encryptedText.split(':');
    
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted text format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    // Create decipher using AES-256-CBC
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc', 
      Buffer.from(ENCRYPTION_KEY, 'hex'), 
      iv
    );
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Generates a secure encryption key
 * @returns {string} - A secure random encryption key as hex string
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Creates a mongoose plugin for field encryption
 * @param {Array<string>} fields - Array of field names to encrypt
 * @returns {Function} - Mongoose plugin function
 */
function encryptionPlugin(fields = []) {
  return function(schema) {
    // Add indicator field for encryption
    schema.add({
      _encryptedFields: {
        type: [String],
        select: false
      }
    });

    // Encrypt fields before saving
    schema.pre('save', function(next) {
      const encryptedFields = [];
      
      fields.forEach(field => {
        if (this[field] && typeof this[field] === 'string') {
          this[field] = encrypt(this[field]);
          encryptedFields.push(field);
        }
      });
      
      this._encryptedFields = encryptedFields;
      next();
    });
    
    // Add method to decrypt fields
    schema.methods.decryptFields = function() {
      const encryptedFields = this._encryptedFields || [];
      
      encryptedFields.forEach(field => {
        if (this[field]) {
          this[field] = decrypt(this[field]);
        }
      });
      
      return this;
    };
    
    // Decrypt fields after find
    schema.post('find', function(docs) {
      if (Array.isArray(docs)) {
        docs.forEach(doc => {
          if (doc._encryptedFields) {
            doc.decryptFields();
          }
        });
      }
    });
    
    // Decrypt fields after findOne
    schema.post('findOne', function(doc) {
      if (doc && doc._encryptedFields) {
        doc.decryptFields();
      }
    });
  };
}

module.exports = {
  encrypt,
  decrypt,
  generateEncryptionKey,
  encryptionPlugin
}; 