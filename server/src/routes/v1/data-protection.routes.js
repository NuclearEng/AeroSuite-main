/**
 * Data Protection Routes
 * 
 * API routes for data protection operations including:
 * - Encryption key rotation
 * - Secure data deletion
 * - Data anonymization for analytics
 */

const express = require('express');
const router = express.Router();
const dataProtectionController = require('../../controllers/data-protection.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorization.middleware');
const { ROLES } = require('../../utils/constants');

// All data protection routes require authentication
router.use(authenticate);

// Get data protection service status
router.get(
  '/status',
  authorize([ROLES.ADMIN, ROLES.SECURITY_OFFICER]),
  dataProtectionController.getStatus
);

// Rotate encryption keys for a model
router.post(
  '/rotate-keys/:modelName',
  authorize([ROLES.ADMIN, ROLES.SECURITY_OFFICER]),
  dataProtectionController.rotateEncryptionKeys
);

// Securely delete a document
router.delete(
  '/:modelName/:id',
  authorize([ROLES.ADMIN, ROLES.SECURITY_OFFICER]),
  dataProtectionController.securelyDeleteDocument
);

// Anonymize data for analytics
router.post(
  '/anonymize/:modelName',
  authorize([ROLES.ADMIN, ROLES.SECURITY_OFFICER, ROLES.DATA_ANALYST]),
  dataProtectionController.anonymizeData
);

// Apply encryption to model
router.post(
  '/apply-encryption/:modelName',
  authorize([ROLES.ADMIN, ROLES.SECURITY_OFFICER]),
  dataProtectionController.applyEncryptionToModel
);

module.exports = router; 