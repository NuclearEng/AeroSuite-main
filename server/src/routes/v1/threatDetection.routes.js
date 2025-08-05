/**
 * Threat Detection API Routes
 * Related to: SEC006 - Threat Detection System
 * 
 * Routes for threat detection management.
 */

const express = require('express');
const router = express.Router();
const threatDetectionController = require('../../controllers/threatDetection.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Security role levels
const SECURITY_ROLES = {
  BASIC: 'SECURITY_BASIC',       // Can view threat detection rules
  ANALYST: 'SECURITY_ANALYST',   // Can test rules
  MANAGER: 'SECURITY_MANAGER',   // Can manage rules
  ADMIN: 'SECURITY_ADMIN'        // Full access
};

// Init route
router.post('/initialize', 
  authenticate, 
  authorize([SECURITY_ROLES.ADMIN]), 
  threatDetectionController.initialize
);

// Rules routes
router.get('/rules', 
  authenticate, 
  authorize([SECURITY_ROLES.BASIC, SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  threatDetectionController.getRules
);

router.post('/rules', 
  authenticate, 
  authorize([SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  threatDetectionController.addRule
);

router.put('/rules/:ruleId', 
  authenticate, 
  authorize([SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  threatDetectionController.updateRule
);

router.delete('/rules/:ruleId', 
  authenticate, 
  authorize([SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  threatDetectionController.deleteRule
);

router.post('/rules/reset', 
  authenticate, 
  authorize([SECURITY_ROLES.ADMIN]), 
  threatDetectionController.resetRules
);

router.post('/rules/test', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  threatDetectionController.testRule
);

// Reference data routes
router.get('/mechanisms', 
  authenticate, 
  authorize([SECURITY_ROLES.BASIC, SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  threatDetectionController.getDetectionMechanisms
);

router.get('/threat-types', 
  authenticate, 
  authorize([SECURITY_ROLES.BASIC, SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  threatDetectionController.getThreatTypes
);

module.exports = router; 