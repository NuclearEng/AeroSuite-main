/**
 * Security Event Management API Routes
 * Related to: SEC005 - Security Information Event Management
 * 
 * Routes for security events, alerts, and incidents.
 */

const express = require('express');
const router = express.Router();
const securityEventManagementController = require('../../controllers/securityEventManagement.controller');
const { authenticate, authorize } = require('../../middleware/auth.middleware');

// Security role levels
const SECURITY_ROLES = {
  BASIC: 'SECURITY_BASIC',       // Can view security events and alerts
  ANALYST: 'SECURITY_ANALYST',   // Can manage alerts and view incidents
  MANAGER: 'SECURITY_MANAGER',   // Can manage incidents
  ADMIN: 'SECURITY_ADMIN'        // Full access
};

// Init route
router.post('/initialize', 
  authenticate, 
  authorize([SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.initialize
);

// Event routes
router.get('/events', 
  authenticate, 
  authorize([SECURITY_ROLES.BASIC, SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.getEvents
);

router.post('/events/search', 
  authenticate, 
  authorize([SECURITY_ROLES.BASIC, SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.searchEvents
);

router.get('/events/metrics', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.getEventMetrics
);

// Analytics route
router.get('/analytics', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.getAnalytics
);

// Alert routes
router.get('/alerts', 
  authenticate, 
  authorize([SECURITY_ROLES.BASIC, SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.getAlerts
);

router.get('/alerts/:alertId', 
  authenticate, 
  authorize([SECURITY_ROLES.BASIC, SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.getAlertById
);

router.put('/alerts/:alertId/status', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.updateAlertStatus
);

router.get('/alerts/metrics', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.getAlertMetrics
);

// Incident routes
router.get('/incidents', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.getIncidents
);

router.get('/incidents/:incidentId', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.getIncidentById
);

router.put('/incidents/:incidentId/status', 
  authenticate, 
  authorize([SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.updateIncidentStatus
);

router.post('/incidents/:incidentId/timeline', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.addIncidentTimelineEntry
);

router.post('/incidents/:incidentId/artifacts', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.addIncidentArtifact
);

router.put('/incidents/:incidentId/resolve', 
  authenticate, 
  authorize([SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.resolveIncident
);

router.get('/incidents/metrics', 
  authenticate, 
  authorize([SECURITY_ROLES.ANALYST, SECURITY_ROLES.MANAGER, SECURITY_ROLES.ADMIN]), 
  securityEventManagementController.getIncidentMetrics
);

module.exports = router; 