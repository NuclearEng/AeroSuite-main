/**
 * Data Encryption Core
 * Task: TS132 - Data Encryption Core
 * 
 * Provides comprehensive data encryption services for the application,
 * including encryption at rest, key management, and secure operations.
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

// Promisify crypto functions
const randomBytes = promisify(crypto.randomBytes);
const scrypt = promisify(crypto.scrypt);

// Constants
const DEFAULT_ALGORITHM = 'aes-256-gcm';
const DEFAULT_IV_LENGTH = 16;
const DEFAULT_AUTH_TAG_LENGTH = 16;
const DEFAULT_KEY_LENGTH = 32; // 256 bits
const DEFAULT_PBKDF2_ITERATIONS = 100000;
const DEFAULT_SALT_LENGTH = 32;

// Configuration
let config = {
  algorithm: DEFAULT_ALGORITHM,
  keyLength: DEFAULT_KEY_LENGTH,
  ivLength: DEFAULT_IV_LENGTH,
  authTagLength: DEFAULT_AUTH_TAG_LENGTH,
  pbkdf2Iterations: DEFAULT_PBKDF2_ITERATIONS,
  saltLength: DEFAULT_SALT_LENGTH,
  keyRotationDays: 90,
  masterKeyPath: process.env.MASTER_KEY_PATH || path.join(process.cwd(), '.keys', 'master.key'),
  keyDirectory: process.env.KEY_DIRECTORY || path.join(process.cwd(), '.keys'),
  activeKeyId: process.env.ACTIVE_KEY_ID || 'primary'
};

// In-memory key cache
const keyCache = new Map();

/**
 * Initialize the encryption system
 * @param {Object} options - Configuration options
 * @returns {Promise<boolean>} Success status
 */
async function initialize(options = {}) {
  try {
    // Merge options with defaults
    config = { ...config, ...options };
    
    // Ensure key directory exists
    if (!fs.existsSync(config.keyDirectory)) {
      fs.mkdirSync(config.keyDirectory, { recursive: true, mode: 0o700 });
    }
    
    // Check if master key exists, if not generate one
    if (!fs.existsSync(config.masterKeyPath)) {
      const masterKey = await generateEncryptionKey();
      fs.writeFileSync(config.masterKeyPath, masterKey, { mode: 0o600 });
      
      logSecurityEvent(
        'ENCRYPTION',
        SEC_EVENT_SEVERITY.INFO,
        'Master encryption key generated',
        { component: 'EncryptionCore', action: 'GENERATE_MASTER_KEY' }
      );
    }
    
    // Check if we have an active data encryption key, if not generate one
    const activeKeyPath = path.join(config.keyDirectory, `${config.activeKeyId}.key`);
    if (!fs.existsSync(activeKeyPath)) {
      await rotateEncryptionKey(config.activeKeyId);
    } else {
      // Load active key into cache
      await loadEncryptionKey(config.activeKeyId);
    }
    
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.INFO,
      'Encryption core initialized',
      { component: 'EncryptionCore', action: 'INITIALIZE' }
    );
    
    return true;
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      'Failed to initialize encryption core',
      { 
        component: 'EncryptionCore', 
        action: 'INITIALIZE', 
        error: error.message 
      }
    );
    throw error;
  }
}

/**
 * Generate a cryptographically secure encryption key
 * @param {number} length - Key length in bytes
 * @returns {Promise<string>} Hex-encoded key
 */
async function generateEncryptionKey(length = config.keyLength) {
  try {
    const keyBuffer = await randomBytes(length);
    return keyBuffer.toString('hex');
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      'Failed to generate encryption key',
      { 
        component: 'EncryptionCore', 
        action: 'GENERATE_KEY', 
        error: error.message 
      }
    );
    throw new Error('Failed to generate encryption key');
  }
}

/**
 * Create a derived key from a password
 * @param {string} password - Password to derive key from
 * @param {Buffer} salt - Salt for key derivation
 * @param {number} length - Key length in bytes
 * @returns {Promise<Buffer>} Derived key
 */
async function deriveKey(password, salt, length = config.keyLength) {
  try {
    return await scrypt(password, salt, length);
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      'Failed to derive key from password',
      { 
        component: 'EncryptionCore', 
        action: 'DERIVE_KEY', 
        error: error.message 
      }
    );
    throw new Error('Failed to derive key from password');
  }
}

/**
 * Encrypt a data encryption key (DEK) with the master key
 * @param {string} dek - Data encryption key to protect
 * @returns {Promise<string>} Encrypted key
 */
async function encryptKey(dek) {
  try {
    const masterKey = fs.readFileSync(config.masterKeyPath, 'utf8');
    return encrypt(dek, masterKey);
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      'Failed to encrypt data encryption key',
      { 
        component: 'EncryptionCore', 
        action: 'ENCRYPT_KEY', 
        error: error.message 
      }
    );
    throw new Error('Failed to encrypt data encryption key');
  }
}

/**
 * Decrypt a data encryption key (DEK) with the master key
 * @param {string} encryptedDek - Encrypted data encryption key
 * @returns {Promise<string>} Decrypted key
 */
async function decryptKey(encryptedDek) {
  try {
    const masterKey = fs.readFileSync(config.masterKeyPath, 'utf8');
    return decrypt(encryptedDek, masterKey);
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      'Failed to decrypt data encryption key',
      { 
        component: 'EncryptionCore', 
        action: 'DECRYPT_KEY', 
        error: error.message 
      }
    );
    throw new Error('Failed to decrypt data encryption key');
  }
}

/**
 * Store an encryption key securely
 * @param {string} keyId - Identifier for the key
 * @param {string} key - The encryption key
 * @returns {Promise<boolean>} Success status
 */
async function storeEncryptionKey(keyId, key) {
  try {
    const encryptedKey = await encryptKey(key);
    const keyMetadata = {
      id: keyId,
      algorithm: config.algorithm,
      createdAt: new Date().toISOString(),
      rotationDue: new Date(Date.now() + config.keyRotationDays * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const keyObject = {
      key: encryptedKey,
      metadata: keyMetadata
    };
    
    const keyPath = path.join(config.keyDirectory, `${keyId}.key`);
    fs.writeFileSync(keyPath, JSON.stringify(keyObject), { mode: 0o600 });
    
    // Cache the key
    keyCache.set(keyId, key);
    
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.INFO,
      `Encryption key stored: ${keyId}`,
      { 
        component: 'EncryptionCore', 
        action: 'STORE_KEY',
        keyId
      }
    );
    
    return true;
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      `Failed to store encryption key: ${keyId}`,
      { 
        component: 'EncryptionCore', 
        action: 'STORE_KEY', 
        keyId,
        error: error.message 
      }
    );
    throw new Error(`Failed to store encryption key: ${keyId}`);
  }
}

/**
 * Load an encryption key
 * @param {string} keyId - Identifier for the key
 * @returns {Promise<string>} The decrypted key
 */
async function loadEncryptionKey(keyId) {
  try {
    // Check if key is in cache
    if (keyCache.has(keyId)) {
      return keyCache.get(keyId);
    }
    
    const keyPath = path.join(config.keyDirectory, `${keyId}.key`);
    if (!fs.existsSync(keyPath)) {
      throw new Error(`Key not found: ${keyId}`);
    }
    
    const keyObject = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const decryptedKey = await decryptKey(keyObject.key);
    
    // Cache the key
    keyCache.set(keyId, decryptedKey);
    
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.INFO,
      `Encryption key loaded: ${keyId}`,
      { 
        component: 'EncryptionCore', 
        action: 'LOAD_KEY',
        keyId
      }
    );
    
    return decryptedKey;
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      `Failed to load encryption key: ${keyId}`,
      { 
        component: 'EncryptionCore', 
        action: 'LOAD_KEY', 
        keyId,
        error: error.message 
      }
    );
    throw new Error(`Failed to load encryption key: ${keyId}`);
  }
}

/**
 * Rotate encryption keys
 * @param {string} keyId - Identifier for the new key
 * @returns {Promise<string>} New key ID
 */
async function rotateEncryptionKey(keyId = null) {
  try {
    // Generate a new key ID if not provided
    const newKeyId = keyId || `key-${Date.now()}`;
    
    // Generate a new encryption key
    const newKey = await generateEncryptionKey();
    
    // Store the new key
    await storeEncryptionKey(newKeyId, newKey);
    
    // Update active key ID if no specific key ID was requested
    if (!keyId) {
      config.activeKeyId = newKeyId;
    }
    
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.INFO,
      `Encryption key rotated: ${newKeyId}`,
      { 
        component: 'EncryptionCore', 
        action: 'ROTATE_KEY',
        keyId: newKeyId
      }
    );
    
    return newKeyId;
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      'Failed to rotate encryption key',
      { 
        component: 'EncryptionCore', 
        action: 'ROTATE_KEY', 
        error: error.message 
      }
    );
    throw new Error('Failed to rotate encryption key');
  }
}

/**
 * Encrypt data using the active encryption key
 * @param {string|Buffer} data - Data to encrypt
 * @param {string} keyId - Key ID to use (defaults to active key)
 * @returns {Promise<string>} Encrypted data
 */
async function encryptData(data, keyId = config.activeKeyId) {
  if (!data) return null;
  
  try {
    // Load the encryption key
    const key = await loadEncryptionKey(keyId);
    
    // Encrypt the data
    return encrypt(data, key);
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      'Failed to encrypt data',
      { 
        component: 'EncryptionCore', 
        action: 'ENCRYPT_DATA', 
        keyId,
        error: error.message 
      }
    );
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data using the specified encryption key
 * @param {string} encryptedData - Data to decrypt
 * @param {string} keyId - Key ID to use (parsed from data if not provided)
 * @returns {Promise<string|Buffer>} Decrypted data
 */
async function decryptData(encryptedData, keyId = null) {
  if (!encryptedData) return null;
  
  try {
    // Parse the key ID from the encrypted data if not provided
    const actualKeyId = keyId || parseKeyIdFromEncryptedData(encryptedData);
    
    // Load the encryption key
    const key = await loadEncryptionKey(actualKeyId);
    
    // Decrypt the data
    return decrypt(encryptedData, key);
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      'Failed to decrypt data',
      { 
        component: 'EncryptionCore', 
        action: 'DECRYPT_DATA',
        keyId: keyId || 'unknown',
        error: error.message 
      }
    );
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Parse key ID from encrypted data
 * @param {string} encryptedData - Encrypted data
 * @returns {string} Key ID
 */
function parseKeyIdFromEncryptedData(encryptedData) {
  try {
    const parts = encryptedData.split(':');
    if (parts.length < 3) {
      throw new Error('Invalid encrypted data format');
    }
    return parts[0];
  } catch (error) {
    throw new Error('Failed to parse key ID from encrypted data');
  }
}

/**
 * Core encryption function using AES-GCM
 * @param {string|Buffer} data - Data to encrypt
 * @param {string} key - Encryption key (hex string)
 * @returns {string} Encrypted data
 */
function encrypt(data, key) {
  try {
    // Generate initialization vector
    const iv = crypto.randomBytes(config.ivLength);
    
    // Convert data to buffer if it's a string
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
    
    // Create cipher using configured algorithm
    const cipher = crypto.createCipheriv(
      config.algorithm,
      Buffer.from(key, 'hex'),
      iv,
      { authTagLength: config.authTagLength }
    );
    
    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(dataBuffer),
      cipher.final()
    ]);
    
    // Get the authentication tag
    const authTag = cipher.getAuthTag();
    
    // Format: keyId:iv:authTag:encryptedData
    return `${config.activeKeyId}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Core decryption function using AES-GCM
 * @param {string} encryptedData - Encrypted data
 * @param {string} key - Decryption key (hex string)
 * @returns {string|Buffer} Decrypted data
 */
function decrypt(encryptedData, key) {
  try {
    // Split the encrypted data into parts
    const parts = encryptedData.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [keyId, ivHex, authTagHex, encryptedHex] = parts;
    
    // Convert hex strings to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      config.algorithm,
      Buffer.from(key, 'hex'),
      iv,
      { authTagLength: config.authTagLength }
    );
    
    // Set auth tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Encrypt a file
 * @param {string} sourcePath - Path to the file to encrypt
 * @param {string} destinationPath - Path to save the encrypted file
 * @param {string} keyId - Key ID to use (defaults to active key)
 * @returns {Promise<boolean>} Success status
 */
async function encryptFile(sourcePath, destinationPath, keyId = config.activeKeyId) {
  try {
    // Read the file
    const data = fs.readFileSync(sourcePath);
    
    // Encrypt the data
    const encryptedData = await encryptData(data, keyId);
    
    // Write the encrypted data to the destination file
    fs.writeFileSync(destinationPath, encryptedData);
    
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.INFO,
      `File encrypted: ${path.basename(sourcePath)}`,
      { 
        component: 'EncryptionCore', 
        action: 'ENCRYPT_FILE',
        keyId
      }
    );
    
    return true;
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      `Failed to encrypt file: ${path.basename(sourcePath)}`,
      { 
        component: 'EncryptionCore', 
        action: 'ENCRYPT_FILE', 
        keyId,
        error: error.message 
      }
    );
    throw new Error(`Failed to encrypt file: ${error.message}`);
  }
}

/**
 * Decrypt a file
 * @param {string} sourcePath - Path to the encrypted file
 * @param {string} destinationPath - Path to save the decrypted file
 * @param {string} keyId - Key ID to use (defaults to parsing from the encrypted data)
 * @returns {Promise<boolean>} Success status
 */
async function decryptFile(sourcePath, destinationPath, keyId = null) {
  try {
    // Read the encrypted file
    const encryptedData = fs.readFileSync(sourcePath, 'utf8');
    
    // Decrypt the data
    const decryptedData = await decryptData(encryptedData, keyId);
    
    // Write the decrypted data to the destination file
    fs.writeFileSync(destinationPath, decryptedData);
    
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.INFO,
      `File decrypted: ${path.basename(sourcePath)}`,
      { 
        component: 'EncryptionCore', 
        action: 'DECRYPT_FILE',
        keyId: keyId || 'auto-detected'
      }
    );
    
    return true;
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      `Failed to decrypt file: ${path.basename(sourcePath)}`,
      { 
        component: 'EncryptionCore', 
        action: 'DECRYPT_FILE', 
        keyId: keyId || 'auto-detect',
        error: error.message 
      }
    );
    throw new Error(`Failed to decrypt file: ${error.message}`);
  }
}

/**
 * Create a mongoose encryption plugin
 * @param {Object} options - Plugin options
 * @returns {Function} Mongoose plugin
 */
function createMongooseEncryptionPlugin(options = {}) {
  const {
    fields = [],
    encryptedFieldsPath = '_encryptedFields'
  } = options;
  
  return function(schema) {
    // Add indicator field for encryption
    const schemaAddition = {};
    schemaAddition[encryptedFieldsPath] = {
      type: [String],
      select: false
    };
    schema.add(schemaAddition);
    
    // Encrypt fields before saving
    schema.pre('save', async function(next) {
      try {
        const encryptedFields = [];
        
        for (const field of fields) {
          if (this[field] && (typeof this[field] === 'string' || Buffer.isBuffer(this[field]))) {
            this[field] = await encryptData(this[field]);
            encryptedFields.push(field);
          }
        }
        
        this[encryptedFieldsPath] = encryptedFields;
        next();
      } catch (error) {
        next(error);
      }
    });
    
    // Add method to decrypt fields
    schema.methods.decryptFields = async function() {
      try {
        const encryptedFields = this[encryptedFieldsPath] || [];
        
        for (const field of encryptedFields) {
          if (this[field]) {
            this[field] = await decryptData(this[field]);
          }
        }
        
        return this;
      } catch (error) {
        throw new Error(`Failed to decrypt fields: ${error.message}`);
      }
    };
    
    // Decrypt fields after find
    schema.post('find', async function(docs) {
      if (!Array.isArray(docs)) return;
      
      for (const doc of docs) {
        if (doc[encryptedFieldsPath]) {
          await doc.decryptFields();
        }
      }
    });
    
    // Decrypt fields after findOne
    schema.post('findOne', async function(doc) {
      if (!doc || !doc[encryptedFieldsPath]) return;
      
      await doc.decryptFields();
    });
  };
}

/**
 * Generate a key pair for asymmetric encryption
 * @param {string} type - Key type (rsa, dsa, ec)
 * @param {Object} options - Key generation options
 * @returns {Promise<Object>} Key pair object
 */
async function generateKeyPair(type = 'rsa', options = { modulusLength: 4096 }) {
  try {
    const { publicKey, privateKey } = crypto.generateKeyPairSync(type, options);
    
    return {
      publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
      privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' })
    };
  } catch (error) {
    logSecurityEvent(
      'ENCRYPTION',
      SEC_EVENT_SEVERITY.ERROR,
      `Failed to generate key pair: ${type}`,
      { 
        component: 'EncryptionCore', 
        action: 'GENERATE_KEY_PAIR',
        keyType: type,
        error: error.message 
      }
    );
    throw new Error(`Failed to generate key pair: ${error.message}`);
  }
}

/**
 * Calculate a secure hash of data
 * @param {string|Buffer} data - Data to hash
 * @param {string} algorithm - Hash algorithm
 * @returns {string} Hex-encoded hash
 */
function hashData(data, algorithm = 'sha256') {
  try {
    const hash = crypto.createHash(algorithm);
    hash.update(data);
    return hash.digest('hex');
  } catch (error) {
    throw new Error(`Failed to hash data: ${error.message}`);
  }
}

/**
 * Create a HMAC for data authentication
 * @param {string|Buffer} data - Data to authenticate
 * @param {string} key - HMAC key
 * @param {string} algorithm - HMAC algorithm
 * @returns {string} Hex-encoded HMAC
 */
function createHmac(data, key, algorithm = 'sha256') {
  try {
    const hmac = crypto.createHmac(algorithm, key);
    hmac.update(data);
    return hmac.digest('hex');
  } catch (error) {
    throw new Error(`Failed to create HMAC: ${error.message}`);
  }
}

/**
 * Get available encryption algorithms
 * @returns {Array<string>} Available algorithms
 */
function getAvailableAlgorithms() {
  return crypto.getCiphers();
}

/**
 * Get available hash algorithms
 * @returns {Array<string>} Available hash algorithms
 */
function getAvailableHashes() {
  return crypto.getHashes();
}

/**
 * Check if a key is due for rotation
 * @param {string} keyId - Key ID to check
 * @returns {Promise<boolean>} True if rotation is due
 */
async function isKeyRotationDue(keyId) {
  try {
    const keyPath = path.join(config.keyDirectory, `${keyId}.key`);
    if (!fs.existsSync(keyPath)) {
      return true;
    }
    
    const keyObject = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    const rotationDue = new Date(keyObject.metadata.rotationDue);
    
    return new Date() >= rotationDue;
  } catch (error) {
    throw new Error(`Failed to check key rotation: ${error.message}`);
  }
}

/**
 * Get encryption status and statistics
 * @returns {Promise<Object>} Status object
 */
async function getStatus() {
  try {
    const keyFiles = fs.readdirSync(config.keyDirectory)
      .filter(file => file.endsWith('.key'));
    
    const keys = [];
    for (const file of keyFiles) {
      const keyId = file.replace('.key', '');
      const keyPath = path.join(config.keyDirectory, file);
      const keyObject = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      
      keys.push({
        id: keyId,
        algorithm: keyObject.metadata.algorithm,
        createdAt: keyObject.metadata.createdAt,
        rotationDue: keyObject.metadata.rotationDue,
        isActive: keyId === config.activeKeyId,
        rotationNeeded: new Date() >= new Date(keyObject.metadata.rotationDue)
      });
    }
    
    return {
      initialized: true,
      activeKeyId: config.activeKeyId,
      algorithm: config.algorithm,
      keys,
      keyCount: keys.length,
      keysNeedingRotation: keys.filter(key => key.rotationNeeded).length
    };
  } catch (error) {
    throw new Error(`Failed to get encryption status: ${error.message}`);
  }
}

module.exports = {
  initialize,
  generateEncryptionKey,
  deriveKey,
  rotateEncryptionKey,
  encryptData,
  decryptData,
  encryptFile,
  decryptFile,
  createMongooseEncryptionPlugin,
  generateKeyPair,
  hashData,
  createHmac,
  getAvailableAlgorithms,
  getAvailableHashes,
  isKeyRotationDue,
  getStatus
}; 