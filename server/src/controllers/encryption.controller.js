/**
 * Encryption Controller
 * Related to: TS132 - Data Encryption Core
 * 
 * Handles API endpoints for encryption key management and operations.
 */

const encryptionCore = require('../core/encryption');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

/**
 * Initialize the encryption system
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function initialize(req, res) {
  try {
    const options = req.body || {};
    const result = await encryptionCore.initialize(options);
    
    return res.status(200).json({
      success: true,
      message: 'Encryption system initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing encryption system:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize encryption system',
      error: error.message
    });
  }
}

/**
 * Get encryption system status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getStatus(req, res) {
  try {
    const status = await encryptionCore.getStatus();
    
    // Log access
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Encryption status retrieved',
      {
        component: 'EncryptionController',
        action: 'GET_STATUS',
        userId: req.user?.id || 'anonymous'
      }
    );
    
    return res.status(200).json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Error retrieving encryption status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve encryption status',
      error: error.message
    });
  }
}

/**
 * Rotate encryption key
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function rotateKey(req, res) {
  try {
    const { keyId } = req.body || {};
    const newKeyId = await encryptionCore.rotateEncryptionKey(keyId);
    
    // Log key rotation
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      `Encryption key rotated: ${newKeyId}`,
      {
        component: 'EncryptionController',
        action: 'ROTATE_KEY',
        userId: req.user?.id || 'anonymous',
        keyId: newKeyId
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Encryption key rotated successfully',
      keyId: newKeyId
    });
  } catch (error) {
    console.error('Error rotating encryption key:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to rotate encryption key',
      error: error.message
    });
  }
}

/**
 * Get available encryption algorithms
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function getAlgorithms(req, res) {
  try {
    const algorithms = encryptionCore.getAvailableAlgorithms();
    const hashes = encryptionCore.getAvailableHashes();
    
    return res.status(200).json({
      success: true,
      algorithms,
      hashes
    });
  } catch (error) {
    console.error('Error retrieving available algorithms:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve available algorithms',
      error: error.message
    });
  }
}

/**
 * Generate a key pair for asymmetric encryption
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function generateKeyPair(req, res) {
  try {
    const { type, options } = req.body || {};
    const keyPair = await encryptionCore.generateKeyPair(type, options);
    
    // Log key pair generation
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      `Key pair generated: ${type}`,
      {
        component: 'EncryptionController',
        action: 'GENERATE_KEY_PAIR',
        userId: req.user?.id || 'anonymous',
        keyType: type
      }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Key pair generated successfully',
      publicKey: keyPair.publicKey
      // Note: We don't return the private key in the response for security reasons
      // It should be securely transmitted or stored separately
    });
  } catch (error) {
    console.error('Error generating key pair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate key pair',
      error: error.message
    });
  }
}

/**
 * Encrypt data for testing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function testEncryption(req, res) {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data is required'
      });
    }
    
    const encryptedData = await encryptionCore.encryptData(data);
    
    // For testing purposes only, we also decrypt to verify
    const decryptedData = await encryptionCore.decryptData(encryptedData);
    
    // Log test
    logSecurityEvent(
      'API',
      SEC_EVENT_SEVERITY.INFO,
      'Encryption test performed',
      {
        component: 'EncryptionController',
        action: 'TEST_ENCRYPTION',
        userId: req.user?.id || 'anonymous'
      }
    );
    
    return res.status(200).json({
      success: true,
      encryptedData,
      verified: data === decryptedData.toString()
    });
  } catch (error) {
    console.error('Error testing encryption:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to test encryption',
      error: error.message
    });
  }
}

module.exports = {
  initialize,
  getStatus,
  rotateKey,
  getAlgorithms,
  generateKeyPair,
  testEncryption
}; 