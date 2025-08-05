/**
 * Health Check Routes
 * 
 * Implements RF042 - Implement health checks for all services
 * 
 * This file defines the routes for health checks and system status.
 */

const express = require('express');
const router = express.Router();
const healthCheckController = require('../../controllers/health-check.controller');
const { authenticate } = require('../../middleware/auth');

/**
 * @route   GET /api/v1/health
 * @desc    Basic health check
 * @access  Public
 */
router.get('/', healthCheckController.basicHealthCheck);

/**
 * @route   GET /api/v1/health/detailed
 * @desc    Detailed health check
 * @access  Admin
 */
router.get('/detailed', authenticate({ requiredRole: 'admin' }), healthCheckController.detailedHealthCheck);

/**
 * @route   GET /api/v1/health/component/:component
 * @desc    Component-specific health check
 * @access  Admin
 */
router.get('/component/:component', authenticate({ requiredRole: 'admin' }), healthCheckController.componentHealthCheck);

/**
 * @route   GET /api/v1/health/liveness
 * @desc    Kubernetes liveness probe
 * @access  Public
 */
router.get('/liveness', healthCheckController.livenessProbe);

/**
 * @route   GET /api/v1/health/readiness
 * @desc    Kubernetes readiness probe
 * @access  Public
 */
router.get('/readiness', healthCheckController.readinessProbe);

/**
 * @route   GET /api/v1/health/startup
 * @desc    Kubernetes startup probe
 * @access  Public
 */
router.get('/startup', healthCheckController.startupProbe);

module.exports = router; 