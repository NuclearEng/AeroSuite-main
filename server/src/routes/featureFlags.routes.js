/**
 * Feature Flags Routes
 * 
 * This file defines the routes for feature flag management.
 */

const express = require('express');
const router = express.Router();
const featureFlagsController = require('../controllers/featureFlags.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticate);

// Admin routes - require admin role
router.get('/', authorize(['admin']), featureFlagsController.getAllFlags);
router.get('/:key', authorize(['admin']), featureFlagsController.getFlag);
router.put('/:key', authorize(['admin']), featureFlagsController.updateFlag);
router.delete('/:key', authorize(['admin']), featureFlagsController.deleteFlag);
router.post('/sync', authorize(['admin']), featureFlagsController.syncFlags);
router.post('/clear-cache', authorize(['admin']), featureFlagsController.clearCache);

// Status check - all authenticated users can check if a flag is enabled
router.get('/:key/status', featureFlagsController.checkFlag);

module.exports = router; 