// Task: SEC024 - Key Management Implementation
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const generateKeyPair = promisify(crypto.generateKeyPair);
const scrypt = promisify(crypto.scrypt);
const { AppError } = require('../utils/errorHandler');
const logger = require('../infrastructure/logger');
const cache = require('../utils/cache');

/**
 * Key Management Service
 * Handles generation, storage, rotation, and retrieval of cryptographic keys
 */
class KeyManagementService {
  constructor() {
    this.keyStore = new Map();
    this.keyRotationSchedule = new Map();
    this.keyMetadata = new Map();
    
    // Key storage configuration
    this.config = {
      keyStorePath: process.env.KEY_STORE_PATH || path.join(__dirname, '../../keys'),
      masterKeyPath: process.env.MASTER_KEY_PATH,
      keyRotationInterval: parseInt(process.env.KEY_ROTATION_INTERVAL) || 90 * 24 * 60 * 60 * 1000, // 90 days
      keyVersionLimit: parseInt(process.env.KEY_VERSION_LIMIT) || 5,
      enableHSM: process.env.ENABLE_HSM === 'true',
      enableKeyEscrow: process.env.ENABLE_KEY_ESCROW === 'true'
    };

    // Initialize key store directory
    this.initializeKeyStore();
  }

  /**
   * Initialize key store directory
   */
  async initializeKeyStore() {
    try {
      await fs.mkdir(this.config.keyStorePath, { recursive: true });
      await this.loadMasterKey();
      await this.loadExistingKeys();
    } catch (error) {
      logger.error('Failed to initialize key store:', error);
    }
  }

  /**
   * Load or generate master key
   */
  async loadMasterKey() {
    try {
      if (this.config.masterKeyPath) {
        // Load master key from file
        const masterKeyData = await fs.readFile(this.config.masterKeyPath, 'utf8');
        this.masterKey = Buffer.from(masterKeyData, 'base64');
      } else {
        // Generate new master key if not exists
        const masterKeyFile = path.join(this.config.keyStorePath, '.master.key');
        try {
          const masterKeyData = await fs.readFile(masterKeyFile, 'utf8');
          this.masterKey = Buffer.from(masterKeyData, 'base64');
        } catch (error) {
          // Generate new master key
          this.masterKey = crypto.randomBytes(32);
          await fs.writeFile(masterKeyFile, this.masterKey.toString('base64'), {
            mode: 0o600 // Read/write for owner only
          });
          logger.info('Generated new master key');
        }
      }
    } catch (error) {
      logger.error('Failed to load master key:', error);
      throw new AppError('Key management initialization failed', 500);
    }
  }

  /**
   * Load existing keys from storage
   */
  async loadExistingKeys() {
    try {
      const keyFiles = await fs.readdir(this.config.keyStorePath);
      
      for (const file of keyFiles) {
        if (file.endsWith('.key') && !file.startsWith('.')) {
          const keyId = file.replace('.key', '');
          const keyPath = path.join(this.config.keyStorePath, file);
          const encryptedKey = await fs.readFile(keyPath, 'utf8');
          
          // Load key metadata
          const metadataPath = path.join(this.config.keyStorePath, `${keyId}.meta`);
          try {
            const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf8'));
            this.keyMetadata.set(keyId, metadata);
            
            // Schedule rotation if needed
            if (metadata.rotatable) {
              this.scheduleKeyRotation(keyId, metadata);
            }
          } catch (error) {
            logger.warn(`Failed to load metadata for key ${keyId}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Failed to load existing keys:', error);
    }
  }

  /**
   * Generate a new symmetric key
   */
  async generateSymmetricKey(keyId, options = {}) {
    try {
      const {
        algorithm = 'aes-256-gcm',
        keySize = 32,
        rotatable = true,
        expiresIn = this.config.keyRotationInterval,
        purpose = 'encryption'
      } = options;

      // Generate key
      const key = crypto.randomBytes(keySize);
      
      // Encrypt key with master key
      const encryptedKey = await this.encryptKey(key);
      
      // Store key
      await this.storeKey(keyId, encryptedKey, {
        type: 'symmetric',
        algorithm,
        keySize,
        rotatable,
        purpose,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + expiresIn),
        version: 1
      });

      // Cache the key
      this.keyStore.set(keyId, key);
      
      // Schedule rotation if rotatable
      if (rotatable) {
        this.scheduleKeyRotation(keyId, { expiresAt: new Date(Date.now() + expiresIn) });
      }

      logger.info(`Generated symmetric key: ${keyId}`);
      
      return key;
    } catch (error) {
      logger.error('Failed to generate symmetric key:', error);
      throw new AppError('Key generation failed', 500);
    }
  }

  /**
   * Generate a new asymmetric key pair
   */
  async generateAsymmetricKeyPair(keyId, options = {}) {
    try {
      const {
        algorithm = 'rsa',
        modulusLength = 4096,
        publicExponent = 0x10001,
        rotatable = true,
        expiresIn = this.config.keyRotationInterval,
        purpose = 'signing'
      } = options;

      // Generate key pair
      const { publicKey, privateKey } = await generateKeyPair(algorithm, {
        modulusLength,
        publicExponent,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      // Encrypt private key with master key
      const encryptedPrivateKey = await this.encryptKey(Buffer.from(privateKey));
      
      // Store keys
      const metadata = {
        type: 'asymmetric',
        algorithm,
        modulusLength,
        rotatable,
        purpose,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + expiresIn),
        version: 1
      };

      await this.storeKey(`${keyId}.private`, encryptedPrivateKey, metadata);
      await this.storeKey(`${keyId}.public`, Buffer.from(publicKey), {
        ...metadata,
        rotatable: false // Public keys don't rotate
      });

      // Cache the keys
      this.keyStore.set(`${keyId}.private`, privateKey);
      this.keyStore.set(`${keyId}.public`, publicKey);
      
      // Schedule rotation if rotatable
      if (rotatable) {
        this.scheduleKeyRotation(`${keyId}.private`, metadata);
      }

      logger.info(`Generated asymmetric key pair: ${keyId}`);
      
      return { publicKey, privateKey };
    } catch (error) {
      logger.error('Failed to generate asymmetric key pair:', error);
      throw new AppError('Key pair generation failed', 500);
    }
  }

  /**
   * Retrieve a key
   */
  async getKey(keyId) {
    try {
      // Check cache first
      if (this.keyStore.has(keyId)) {
        return this.keyStore.get(keyId);
      }

      // Load from storage
      const keyPath = path.join(this.config.keyStorePath, `${keyId}.key`);
      const encryptedKey = await fs.readFile(keyPath, 'utf8');
      
      // Decrypt key
      const key = await this.decryptKey(encryptedKey);
      
      // Cache the key
      this.keyStore.set(keyId, key);
      
      return key;
    } catch (error) {
      logger.error(`Failed to retrieve key ${keyId}:`, error);
      throw new AppError('Key not found', 404);
    }
  }

  /**
   * Rotate a key
   */
  async rotateKey(keyId) {
    try {
      // Get current key metadata
      const metadata = this.keyMetadata.get(keyId);
      if (!metadata) {
        throw new AppError('Key metadata not found', 404);
      }

      if (!metadata.rotatable) {
        throw new AppError('Key is not rotatable', 400);
      }

      // Generate new key
      let newKey;
      if (metadata.type === 'symmetric') {
        newKey = await this.generateSymmetricKey(`${keyId}.v${metadata.version + 1}`, {
          algorithm: metadata.algorithm,
          keySize: metadata.keySize,
          rotatable: metadata.rotatable,
          purpose: metadata.purpose
        });
      } else {
        const { privateKey } = await this.generateAsymmetricKeyPair(
          `${keyId}.v${metadata.version + 1}`,
          {
            algorithm: metadata.algorithm,
            modulusLength: metadata.modulusLength,
            rotatable: metadata.rotatable,
            purpose: metadata.purpose
          }
        );
        newKey = privateKey;
      }

      // Update metadata
      metadata.version += 1;
      metadata.rotatedAt = new Date();
      metadata.previousVersions = metadata.previousVersions || [];
      metadata.previousVersions.push({
        version: metadata.version - 1,
        rotatedAt: metadata.rotatedAt
      });

      // Limit number of old versions
      if (metadata.previousVersions.length > this.config.keyVersionLimit) {
        const oldestVersion = metadata.previousVersions.shift();
        // Delete oldest key version
        await this.deleteKey(`${keyId}.v${oldestVersion.version}`);
      }

      // Save updated metadata
      await this.saveKeyMetadata(keyId, metadata);

      // Update current key reference
      await this.storeKey(keyId, await this.encryptKey(newKey), metadata);
      this.keyStore.set(keyId, newKey);

      logger.info(`Rotated key: ${keyId} to version ${metadata.version}`);
      
      // Emit key rotation event
      this.emitKeyRotationEvent(keyId, metadata);
      
      return newKey;
    } catch (error) {
      logger.error(`Failed to rotate key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a key
   */
  async deleteKey(keyId) {
    try {
      // Remove from cache
      this.keyStore.delete(keyId);
      
      // Remove from storage
      const keyPath = path.join(this.config.keyStorePath, `${keyId}.key`);
      const metadataPath = path.join(this.config.keyStorePath, `${keyId}.meta`);
      
      await Promise.all([
        fs.unlink(keyPath).catch(() => {}),
        fs.unlink(metadataPath).catch(() => {})
      ]);
      
      // Remove metadata
      this.keyMetadata.delete(keyId);
      
      // Cancel rotation schedule
      this.cancelKeyRotation(keyId);
      
      logger.info(`Deleted key: ${keyId}`);
    } catch (error) {
      logger.error(`Failed to delete key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Store a key
   */
  async storeKey(keyId, encryptedKey, metadata) {
    try {
      const keyPath = path.join(this.config.keyStorePath, `${keyId}.key`);
      
      // Store encrypted key
      await fs.writeFile(keyPath, encryptedKey.toString('base64'), {
        mode: 0o600 // Read/write for owner only
      });
      
      // Store metadata
      await this.saveKeyMetadata(keyId, metadata);
      
      // Update in-memory metadata
      this.keyMetadata.set(keyId, metadata);
    } catch (error) {
      logger.error(`Failed to store key ${keyId}:`, error);
      throw error;
    }
  }

  /**
   * Save key metadata
   */
  async saveKeyMetadata(keyId, metadata) {
    const metadataPath = path.join(this.config.keyStorePath, `${keyId}.meta`);
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), {
      mode: 0o600
    });
  }

  /**
   * Encrypt a key with master key
   */
  async encryptKey(key) {
    try {
      const iv = crypto.randomBytes(16);
      const salt = crypto.randomBytes(32);
      
      // Derive encryption key from master key
      const derivedKey = await scrypt(this.masterKey, salt, 32);
      
      // Encrypt
      const cipher = crypto.createCipheriv('aes-256-gcm', derivedKey, iv);
      const encrypted = Buffer.concat([
        cipher.update(key),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();
      
      // Combine salt, iv, authTag, and encrypted data
      return Buffer.concat([salt, iv, authTag, encrypted]);
    } catch (error) {
      logger.error('Failed to encrypt key:', error);
      throw error;
    }
  }

  /**
   * Decrypt a key with master key
   */
  async decryptKey(encryptedData) {
    try {
      const data = Buffer.from(encryptedData, 'base64');
      
      // Extract components
      const salt = data.slice(0, 32);
      const iv = data.slice(32, 48);
      const authTag = data.slice(48, 64);
      const encrypted = data.slice(64);
      
      // Derive decryption key from master key
      const derivedKey = await scrypt(this.masterKey, salt, 32);
      
      // Decrypt
      const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, iv);
      decipher.setAuthTag(authTag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted;
    } catch (error) {
      logger.error('Failed to decrypt key:', error);
      throw error;
    }
  }

  /**
   * Schedule key rotation
   */
  scheduleKeyRotation(keyId, metadata) {
    if (!metadata.rotatable || !metadata.expiresAt) {
      return;
    }

    const rotationTime = new Date(metadata.expiresAt).getTime() - Date.now();
    
    if (rotationTime > 0) {
      const timeoutId = setTimeout(() => {
        this.rotateKey(keyId).catch(error => {
          logger.error(`Automatic key rotation failed for ${keyId}:`, error);
        });
      }, rotationTime);
      
      this.keyRotationSchedule.set(keyId, timeoutId);
      
      logger.info(`Scheduled key rotation for ${keyId} at ${metadata.expiresAt}`);
    }
  }

  /**
   * Cancel key rotation
   */
  cancelKeyRotation(keyId) {
    const timeoutId = this.keyRotationSchedule.get(keyId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.keyRotationSchedule.delete(keyId);
    }
  }

  /**
   * Emit key rotation event
   */
  emitKeyRotationEvent(keyId, metadata) {
    // Implement event emission for key rotation notifications
    // This could trigger re-encryption of data, notify services, etc.
    process.emit('key:rotated', { keyId, metadata });
  }

  /**
   * Backup keys
   */
  async backupKeys(backupPath) {
    try {
      const backup = {
        timestamp: new Date(),
        keys: {},
        metadata: {}
      };

      // Collect all keys and metadata
      for (const [keyId, metadata] of this.keyMetadata) {
        try {
          const keyPath = path.join(this.config.keyStorePath, `${keyId}.key`);
          const encryptedKey = await fs.readFile(keyPath, 'utf8');
          backup.keys[keyId] = encryptedKey;
          backup.metadata[keyId] = metadata;
        } catch (error) {
          logger.warn(`Failed to backup key ${keyId}:`, error);
        }
      }

      // Encrypt backup with a separate backup key
      const backupKey = crypto.randomBytes(32);
      const encryptedBackup = await this.encryptBackup(backup, backupKey);
      
      // Save backup
      await fs.writeFile(backupPath, encryptedBackup, { mode: 0o600 });
      
      logger.info('Keys backed up successfully');
      
      return backupKey;
    } catch (error) {
      logger.error('Failed to backup keys:', error);
      throw error;
    }
  }

  /**
   * Restore keys from backup
   */
  async restoreKeys(backupPath, backupKey) {
    try {
      // Read and decrypt backup
      const encryptedBackup = await fs.readFile(backupPath);
      const backup = await this.decryptBackup(encryptedBackup, backupKey);
      
      // Restore keys and metadata
      for (const [keyId, encryptedKey] of Object.entries(backup.keys)) {
        const keyPath = path.join(this.config.keyStorePath, `${keyId}.key`);
        await fs.writeFile(keyPath, encryptedKey, { mode: 0o600 });
        
        if (backup.metadata[keyId]) {
          await this.saveKeyMetadata(keyId, backup.metadata[keyId]);
          this.keyMetadata.set(keyId, backup.metadata[keyId]);
        }
      }
      
      logger.info('Keys restored successfully');
    } catch (error) {
      logger.error('Failed to restore keys:', error);
      throw error;
    }
  }

  /**
   * Encrypt backup
   */
  async encryptBackup(data, key) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    const jsonData = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(jsonData, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Decrypt backup
   */
  async decryptBackup(encryptedData, key) {
    const data = Buffer.from(encryptedData, 'base64');
    
    const iv = data.slice(0, 16);
    const authTag = data.slice(16, 32);
    const encrypted = data.slice(32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Get key statistics
   */
  async getKeyStatistics() {
    const stats = {
      totalKeys: this.keyMetadata.size,
      symmetricKeys: 0,
      asymmetricKeys: 0,
      rotatable: 0,
      expiringSoon: 0,
      byPurpose: {},
      byAlgorithm: {}
    };

    const now = Date.now();
    const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;

    for (const [keyId, metadata] of this.keyMetadata) {
      // Count by type
      if (metadata.type === 'symmetric') {
        stats.symmetricKeys++;
      } else {
        stats.asymmetricKeys++;
      }

      // Count rotatable
      if (metadata.rotatable) {
        stats.rotatable++;
      }

      // Count expiring soon
      if (metadata.expiresAt && new Date(metadata.expiresAt).getTime() < weekFromNow) {
        stats.expiringSoon++;
      }

      // Count by purpose
      stats.byPurpose[metadata.purpose] = (stats.byPurpose[metadata.purpose] || 0) + 1;

      // Count by algorithm
      stats.byAlgorithm[metadata.algorithm] = (stats.byAlgorithm[metadata.algorithm] || 0) + 1;
    }

    return stats;
  }
}

// Export singleton instance
module.exports = new KeyManagementService(); 