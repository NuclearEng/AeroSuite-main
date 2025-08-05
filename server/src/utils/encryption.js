const crypto = require('crypto');
const logger = require('./logger');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Get encryption key from environment or generate
const getEncryptionKey = () => {
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey) {
    logger.warn('No ENCRYPTION_KEY found in environment, using default key (NOT SECURE FOR PRODUCTION)');
    return crypto.scryptSync('default-insecure-key', 'salt', KEY_LENGTH);
  }
  return Buffer.from(masterKey, 'hex');
};

// Derive key from password
const deriveKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @param {Buffer} key - Encryption key (optional)
 * @returns {string} Encrypted data as base64
 */
const encrypt = (text, key = null) => {
  try {
    const encryptionKey = key || getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ]);
    
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted data
    const combined = Buffer.concat([iv, tag, encrypted]);
    
    return combined.toString('base64');
  } catch (error) {
    logger.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt data encrypted with AES-256-GCM
 * @param {string} encryptedData - Base64 encrypted data
 * @param {Buffer} key - Decryption key (optional)
 * @returns {string} Decrypted text
 */
const decrypt = (encryptedData, key = null) => {
  try {
    const decryptionKey = key || getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, decryptionKey, iv);
    decipher.setAuthTag(tag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} Hex hash
 */
const hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate random token
 * @param {number} length - Token length in bytes
 * @returns {string} Token as hex string
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate secure random string
 * @param {number} length - String length
 * @param {string} charset - Character set to use
 * @returns {string} Random string
 */
const generateSecureString = (length = 16, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  const randomBytes = crypto.randomBytes(length);
  const result = new Array(length);
  const charsetLength = charset.length;
  
  for (let i = 0; i < length; i++) {
    result[i] = charset[randomBytes[i] % charsetLength];
  }
  
  return result.join('');
};

/**
 * Encrypt field-level data for database storage
 * @param {any} value - Value to encrypt
 * @param {string} fieldName - Field name for key derivation
 * @returns {Object} Encrypted value with metadata
 */
const encryptField = (value, fieldName) => {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const masterKey = getEncryptionKey();
  const fieldKey = crypto.pbkdf2Sync(
    masterKey,
    Buffer.concat([salt, Buffer.from(fieldName)]),
    ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
  
  const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const encrypted = encrypt(stringValue, fieldKey);
  
  return {
    encrypted,
    salt: salt.toString('base64'),
    algorithm: ALGORITHM,
    iterations: ITERATIONS
  };
};

/**
 * Decrypt field-level data from database
 * @param {Object} encryptedData - Encrypted data object
 * @param {string} fieldName - Field name for key derivation
 * @returns {any} Decrypted value
 */
const decryptField = (encryptedData, fieldName) => {
  const { encrypted, salt, algorithm, iterations } = encryptedData;
  
  if (algorithm !== ALGORITHM) {
    throw new Error('Unsupported encryption algorithm');
  }
  
  const masterKey = getEncryptionKey();
  const fieldKey = crypto.pbkdf2Sync(
    masterKey,
    Buffer.concat([Buffer.from(salt, 'base64'), Buffer.from(fieldName)]),
    iterations || ITERATIONS,
    KEY_LENGTH,
    'sha256'
  );
  
  const decrypted = decrypt(encrypted, fieldKey);
  
  // Try to parse as JSON, otherwise return as string
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

/**
 * Create HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} HMAC signature
 */
const createHmac = (data, secret = null) => {
  const key = secret || process.env.HMAC_SECRET || 'default-hmac-secret';
  return crypto.createHmac('sha256', key).update(data).digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} data - Data to verify
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} Is valid
 */
const verifyHmac = (data, signature, secret = null) => {
  const expectedSignature = createHmac(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

/**
 * Encrypt sensitive configuration
 * @param {Object} config - Configuration object
 * @returns {string} Encrypted configuration
 */
const encryptConfig = (config) => {
  const configString = JSON.stringify(config);
  return encrypt(configString);
};

/**
 * Decrypt sensitive configuration
 * @param {string} encryptedConfig - Encrypted configuration
 * @returns {Object} Configuration object
 */
const decryptConfig = (encryptedConfig) => {
  const decrypted = decrypt(encryptedConfig);
  return JSON.parse(decrypted);
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  generateToken,
  generateSecureString,
  encryptField,
  decryptField,
  createHmac,
  verifyHmac,
  encryptConfig,
  decryptConfig,
  deriveKey,
  // Constants for external use
  ALGORITHM,
  IV_LENGTH,
  SALT_LENGTH,
  TAG_LENGTH,
  KEY_LENGTH
};