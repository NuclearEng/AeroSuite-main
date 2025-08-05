/**
 * API Routes (v1)
 * 
 * Central router for all v1 API endpoints.
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const supplierRoutes = require('./suppliers');
const customerRoutes = require('./customers');
const inspectionRoutes = require('./inspections');
const notificationRoutes = require('../notification.routes');
const documentRoutes = require('../document.routes');
const reportRoutes = require('../report.routes');
const adminRoutes = require('../admin.routes');
const monitoringRoutes = require('../monitoring.routes');
const riskAssessmentRoutes = require('../riskAssessment.routes');
const supplierAuditRoutes = require('../supplierAudit.routes');
const dimensionalAccuracyRoutes = require('../dimensionalAccuracy.routes');
const cacheRoutes = require('../cache.routes');
const privacyRoutes = require('../privacy.routes');
const featureFlagsRoutes = require('../featureFlags.routes');
const erpRoutes = require('./erp.routes');
const aiRoutes = require('./ai.routes');
const securityEventManagementRoutes = require('./securityEventManagement.routes');
const threatDetectionRoutes = require('./threatDetection.routes');
const encryptionRoutes = require('./encryption.routes');
const dataProtectionRoutes = require('./data-protection.routes');
const calendarRoutes = require('./calendarRoutes');
const auditLoggingRoutes = require('./audit-logging.routes');

// Import stateless routes - RF037
const statelessSupplierRoutes = require('./statelessSuppliers');

// Import session routes - RF038
const sessionRoutes = require('./session.routes');

// Import auto-scaling routes - RF039
const autoScalingRoutes = require('./auto-scaling.routes');

// Import health check routes - RF042
const healthCheckRoutes = require('./health-check.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/documents', documentRoutes);
router.use('/reports', reportRoutes);
router.use('/admin', adminRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/risk-assessment', riskAssessmentRoutes);
router.use('/supplier-audit', supplierAuditRoutes);
router.use('/dimensional-accuracy', dimensionalAccuracyRoutes);
router.use('/cache', cacheRoutes);
router.use('/privacy', privacyRoutes);
router.use('/feature-flags', featureFlagsRoutes);
router.use('/erp', erpRoutes);
router.use('/ai', aiRoutes);
router.use('/security', securityEventManagementRoutes);
router.use('/threat-detection', threatDetectionRoutes);
router.use('/encryption', encryptionRoutes);
router.use('/data-protection', dataProtectionRoutes);
router.use('/payments', require('./payment.routes'));
router.use('/calendar', calendarRoutes);
router.use('/audit-logs', auditLoggingRoutes);

// Define stateless routes - RF037
router.use('/stateless/suppliers', statelessSupplierRoutes);

// Define session routes - RF038
router.use('/sessions', sessionRoutes);

// Define auto-scaling routes - RF039
router.use('/auto-scaling', autoScalingRoutes);

// Define health check routes - RF042
router.use('/health', healthCheckRoutes);

// API health check (legacy endpoint)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'AeroSuite API v1 is operational',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0'
  });
});

module.exports = router; 