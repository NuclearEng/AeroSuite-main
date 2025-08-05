/**
 * Auto-Scaling Routes
 * 
 * Routes for auto-scaling API endpoints
 * Implements RF039 - Configure auto-scaling for all services
 */

const express = require('express');
const router = express.Router();
const autoScalingController = require('../../controllers/auto-scaling.controller');
const { requireAuth, requireRole } = require('../../middleware/distributedSession.middleware');

/**
 * @route GET /api/v1/auto-scaling/metrics
 * @desc Get current auto-scaling metrics
 * @access Admin
 */
router.get('/metrics', requireRole('admin'), autoScalingController.getMetrics);

/**
 * @route GET /api/v1/auto-scaling/efficiency
 * @desc Get scaling efficiency metrics
 * @access Admin
 */
router.get('/efficiency', requireRole('admin'), autoScalingController.getScalingEfficiency);

/**
 * @route GET /api/v1/auto-scaling/history
 * @desc Get scaling history
 * @access Admin
 */
router.get('/history', requireRole('admin'), autoScalingController.getScalingHistory);

/**
 * @route GET /api/v1/auto-scaling/config
 * @desc Get current auto-scaling configuration
 * @access Admin
 */
router.get('/config', requireRole('admin'), autoScalingController.getConfiguration);

/**
 * @route PUT /api/v1/auto-scaling/config
 * @desc Update auto-scaling configuration
 * @access Admin
 */
router.put('/config', requireRole('admin'), autoScalingController.updateConfiguration);

/**
 * @route GET /api/v1/auto-scaling/status
 * @desc Get auto-scaling status
 * @access Admin
 */
router.get('/status', requireRole('admin'), autoScalingController.getStatus);

module.exports = router; 