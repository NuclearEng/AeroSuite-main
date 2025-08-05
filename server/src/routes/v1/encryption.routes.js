/**
 * Encryption API Routes
 * Related to: TS132 - Data Encryption Core
 * 
 * Routes for encryption operations and management.
 */

const express = require('express');
const router = express.Router();
const encryptionController = require('../../controllers/encryption.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Security role levels
const SECURITY_ROLES = {
  ADMIN: 'SECURITY_ADMIN',        // Full access to encryption configuration
  MANAGER: 'SECURITY_MANAGER',    // Can view status and rotate keys
  ANALYST: 'SECURITY_ANALYST',    // Can view status
  BASIC: 'SECURITY_BASIC'         // No encryption access
};

// Initialize route
router.post('/initialize', 
  authenticate, 
  authorize([SECURITY_ROLES.ADMIN]), 
  encryptionController.initialize
);

// Status route
router.get('/status', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  encryptionController.getStatus
);

// Key rotation route
router.post('/rotate-key', 
  authenticate, 
  authorize([SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  encryptionController.rotateKey
);

// Algorithms route
router.get('/algorithms', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  encryptionController.getAlgorithms
);

// Key pair generation route
router.post('/generate-key-pair', 
  authenticate, 
  authorize([SECURITY_ROLES.ADMIN]), 
  encryptionController.generateKeyPair
);

// Test encryption route
router.post('/test', 
  authenticate, 
  authorize([SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  encryptionController.testEncryption
);

module.exports = router; 