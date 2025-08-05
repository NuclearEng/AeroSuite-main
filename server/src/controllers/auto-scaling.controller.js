/**
 * Auto-Scaling Controller
 * 
 * Controller for auto-scaling API endpoints
 * Implements RF039 - Configure auto-scaling for all services
 */

const { getInstance } = require('../core/AutoScalingManager');
const autoScalingMiddleware = require('../middleware/auto-scaling.middleware');
const logger = require('../utils/logger');

/**
 * Get current auto-scaling metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getMetrics(req, res, next) {
  try {
    const metrics = autoScalingMiddleware.getMetrics();
    
    if (!metrics) {
      return res.status(503).json({
        success: false,
        message: 'Auto-scaling metrics not available'
      });
    }
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting auto-scaling metrics:', error);
    next(error);
  }
}

/**
 * Get scaling efficiency metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getScalingEfficiency(req, res, next) {
  try {
    const efficiency = autoScalingMiddleware.getScalingEfficiency();
    
    if (!efficiency) {
      return res.status(503).json({
        success: false,
        message: 'Scaling efficiency metrics not available'
      });
    }
    
    res.json({
      success: true,
      data: efficiency
    });
  } catch (error) {
    logger.error('Error getting scaling efficiency:', error);
    next(error);
  }
}

/**
 * Get scaling history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getScalingHistory(req, res, next) {
  try {
    const history = autoScalingMiddleware.getScalingHistory();
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error getting scaling history:', error);
    next(error);
  }
}

/**
 * Get current auto-scaling configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getConfiguration(req, res, next) {
  try {
    const autoScalingManager = getInstance();
    
    if (!autoScalingManager.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Auto-scaling manager not initialized'
      });
    }
    
    // Return configuration (excluding sensitive information)
    const config = { ...autoScalingManager.options };
    delete config.redisUrl; // Don't expose connection strings
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Error getting auto-scaling configuration:', error);
    next(error);
  }
}

/**
 * Update auto-scaling configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function updateConfiguration(req, res, next) {
  try {
    // Only allow admins to update configuration
    if (!req.session || !req.session.userId || req.session.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    const autoScalingManager = getInstance();
    
    if (!autoScalingManager.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Auto-scaling manager not initialized'
      });
    }
    
    // Get allowed configuration updates
    const allowedUpdates = [
      'predictiveScalingEnabled',
      'minInstances',
      'maxInstances',
      'scaleUpCooldown',
      'scaleDownCooldown',
      'resourceThresholds'
    ];
    
    // Filter allowed updates
    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    
    // Validate updates
    if (updates.minInstances !== undefined && updates.minInstances < 1) {
      return res.status(400).json({
        success: false,
        message: 'minInstances must be at least 1'
      });
    }
    
    if (updates.maxInstances !== undefined && updates.maxInstances < updates.minInstances) {
      return res.status(400).json({
        success: false,
        message: 'maxInstances must be greater than or equal to minInstances'
      });
    }
    
    // Apply updates
    Object.assign(autoScalingManager.options, updates);
    
    // Log updates
    logger.info('Auto-scaling configuration updated:', updates);
    
    res.json({
      success: true,
      message: 'Auto-scaling configuration updated',
      data: { ...autoScalingManager.options }
    });
  } catch (error) {
    logger.error('Error updating auto-scaling configuration:', error);
    next(error);
  }
}

/**
 * Get auto-scaling status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function getStatus(req, res, next) {
  try {
    const autoScalingManager = getInstance();
    
    const status = {
      initialized: autoScalingManager.initialized,
      predictiveScalingEnabled: autoScalingManager.options.predictiveScalingEnabled,
      metrics: autoScalingMiddleware.getMetrics() || {},
      lastScaleUpTime: autoScalingManager.lastScaleUpTime || null,
      lastScaleDownTime: autoScalingManager.lastScaleDownTime || null,
      nodeId: autoScalingManager.options.nodeId,
      podName: autoScalingManager.options.podName
    };
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Error getting auto-scaling status:', error);
    next(error);
  }
}

module.exports = {
  getMetrics,
  getScalingEfficiency,
  getScalingHistory,
  getConfiguration,
  updateConfiguration,
  getStatus
}; 