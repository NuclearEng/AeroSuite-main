/**
 * API v2 Routes
 * 
 * This file collects and exports all v2 API routes.
 * It contains newer API versions with improvements and changes.
 */

const express = require('express');
const router = express.Router();

// Import v2-specific routes or use v1 routes where no v2 version exists
const authRoutes = require('./auth.routes'); // v2-specific implementation
const userRoutes = require('./user.routes'); // v2-specific implementation
const supplierRoutes = require('../supplier.routes'); // Reuse v1 implementation
const customerRoutes = require('../customer.routes'); // Reuse v1 implementation
const inspectionRoutes = require('./inspection.routes'); // v2-specific implementation
const notificationRoutes = require('../notification.routes'); // Reuse v1 implementation
const documentRoutes = require('../document.routes'); // Reuse v1 implementation
const permissionRoutes = require('./permission.routes'); // v2-specific implementation
const backupVerificationRoutes = require('./backup-verification.routes'); // v2-specific implementation

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/documents', documentRoutes);
router.use('/permissions', permissionRoutes);
router.use('/backups/verification', backupVerificationRoutes);

// Add API documentation endpoint specific to v2
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API v2 Documentation',
    apiVersion: 'v2',
    endpoints: [
      { path: '/auth', methods: ['POST', 'GET', 'PUT'] },
      { path: '/users', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/suppliers', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/customers', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/inspections', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/notifications', methods: ['GET', 'POST', 'DELETE'] },
      { path: '/documents', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/permissions', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { path: '/backups/verification', methods: ['GET', 'POST'] }
    ]
  });
});

module.exports = router; 