/**
 * Monitoring Routes
 * 
 * This module provides endpoints for application monitoring, including
 * client-side error logging, performance metrics, and health checks.
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const logger = require('../../utils/logger');
const { isAuthenticated } = require('../../middleware/auth');

/**
 * @route POST /api/monitoring/errors
 * @desc Log client-side errors
 * @access Public - but rate limited
 */
router.post('/errors', [
  body('errors').isArray(),
  body('errors.*.message').isString(),
  body('errors.*.timestamp').isString(),
  body('errors.*.url').isString(),
  body('errors.*.userAgent').isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { errors: clientErrors } = req.body;
    
    // Get user information if available
    const userId = req.user ? req.user.id : undefined;
    
    // Process each error
    for (const error of clientErrors) {
      // Add user ID if available and not already present
      if (userId && !error.userId) {
        error.userId = userId;
      }
      
      // Add server timestamp
      error.serverTimestamp = new Date().toISOString();
      
      // Add request information
      error.ip = req.ip;
      error.headers = {
        referer: req.headers.referer,
        origin: req.headers.origin
      };
      
      // Log the error
      logger.error('Client-side error:', {
        ...error,
        source: 'client'
      });
      
      // Here you would typically store the error in a database
      // or send it to an external error tracking service
      // Example: await ErrorModel.create(error);
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Error processing client errors:', err);
    return res.status(500).json({ message: 'Error processing client errors' });
  }
});

/**
 * @route POST /api/monitoring/performance
 * @desc Log client-side performance metrics
 * @access Public - but rate limited
 */
router.post('/performance', [
  body('metrics').isArray(),
  body('metrics.*.name').isString(),
  body('metrics.*.value').isNumeric(),
  body('metrics.*.timestamp').isString()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { metrics } = req.body;
    
    // Get user information if available
    const userId = req.user ? req.user.id : undefined;
    
    // Process each metric
    for (const metric of metrics) {
      // Add user ID if available
      if (userId) {
        metric.userId = userId;
      }
      
      // Add server timestamp
      metric.serverTimestamp = new Date().toISOString();
      
      // Log the metric
      logger.info('Client-side performance metric:', {
        ...metric,
        source: 'client'
      });
      
      // Here you would typically store the metric in a database
      // or send it to a monitoring service
      // Example: await PerformanceMetricModel.create(metric);
    }
    
    // Return success
    return res.status(200).json({ success: true });
  } catch (err) {
    logger.error('Error processing performance metrics:', err);
    return res.status(500).json({ message: 'Error processing performance metrics' });
  }
});

/**
 * @route GET /api/monitoring/health
 * @desc Get application health status
 * @access Public
 */
router.get('/health', (req, res) => {
  // Basic health check
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * @route GET /api/monitoring/health/detailed
 * @desc Get detailed application health status
 * @access Private - Admin only
 */
router.get('/health/detailed', isAuthenticated, async (req, res) => {
  // Check if user has admin role
  if (!req.user.roles.includes('admin')) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  try {
    // Collect detailed health information
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      // Add database connection status, cache status, etc.
    };
    
    return res.status(200).json(health);
  } catch (err) {
    logger.error('Error getting detailed health status:', err);
    return res.status(500).json({ message: 'Error getting health status' });
  }
});

module.exports = router; 