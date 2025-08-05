/**
 * Audit Logging Routes
 * 
 * API routes for audit logging operations including:
 * - Viewing audit logs
 * - Searching audit logs
 * - Exporting audit logs
 */

const express = require('express');
const router = express.Router();
const auditLoggingController = require('../../controllers/audit-logging.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/authorization.middleware');
const { ROLES } = require('../../utils/constants');

// All audit logging routes require authentication
router.use(authenticate);

// Get audit logs with filtering
router.get(
  '/',
  authorize([ROLES.ADMIN, ROLES.SECURITY_OFFICER, ROLES.AUDITOR]),
  auditLoggingController.getAuditLogs
);

// Get audit log by ID
router.get(
  '/:id',
  authorize([ROLES.ADMIN, ROLES.SECURITY_OFFICER, ROLES.AUDITOR]),
  auditLoggingController.getAuditLogById
);

// Export audit logs
router.post(
  '/export',
  authorize([ROLES.ADMIN, ROLES.SECURITY_OFFICER, ROLES.AUDITOR]),
  auditLoggingController.exportAuditLogs
);

// Get audit statistics
router.get(
  '/statistics',
  authorize([ROLES.ADMIN, ROLES.SECURITY_OFFICER, ROLES.AUDITOR]),
  auditLoggingController.getAuditStatistics
);

module.exports = router; 