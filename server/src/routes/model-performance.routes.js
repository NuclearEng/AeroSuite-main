/**
 * model-performance.routes.js
 * 
 * API routes for model performance metrics
 * Implements RF057 - Implement performance metrics tracking
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { ModelPerformanceService, MetricType, TimeWindow } = require('../ai/services/ModelPerformanceService');
const { ServerError } = require('../utils/errorHandler');
const logger = require('../ai/utils/logger');

// Initialize model performance service
const modelPerformanceService = new ModelPerformanceService();

/**
 * @route   GET /api/performance/models
 * @desc    Get performance metrics for all models
 * @access  Private
 */
router.get('/models', authenticate(), async (req, res) => {
  try {
    const { metricType, timeWindow } = req.query;
    
    const metrics = modelPerformanceService.getAllMetrics(
      metricType || null,
      timeWindow || TimeWindow.ALL
    );
    
    res.json({
      success: true,
      count: metrics.length,
      data: metrics
    });
  } catch (error) {
    logger.error('Error getting model performance metrics', error);
    throw new ServerError('Failed to get performance metrics', 500);
  }
});

/**
 * @route   GET /api/performance/models/:id
 * @desc    Get performance metrics for a specific model
 * @access  Private
 */
router.get('/models/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { metricType, timeWindow } = req.query;
    
    const metrics = modelPerformanceService.getModelMetrics(
      id,
      metricType || null,
      timeWindow || TimeWindow.ALL
    );
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        message: `No metrics found for model ${id}`
      });
    }
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error(`Error getting performance metrics for model ${req.params.id}`, error);
    throw new ServerError('Failed to get performance metrics', 500);
  }
});

/**
 * @route   GET /api/performance/metrics/:type
 * @desc    Get aggregated metrics of a specific type across all models
 * @access  Private
 */
router.get('/metrics/:type', authenticate(), async (req, res) => {
  try {
    const { type } = req.params;
    const { timeWindow } = req.query;
    
    const metrics = modelPerformanceService.getAggregatedMetrics(
      type,
      timeWindow || TimeWindow.ALL
    );
    
    if (!metrics) {
      return res.status(404).json({
        success: false,
        message: `No metrics found for type ${type}`
      });
    }
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error(`Error getting aggregated metrics for type ${req.params.type}`, error);
    throw new ServerError('Failed to get aggregated metrics', 500);
  }
});

/**
 * @route   POST /api/performance/metrics/custom
 * @desc    Track a custom metric
 * @access  Private
 */
router.post('/metrics/custom', authenticate(), async (req, res) => {
  try {
    const { modelId, metricName, value, metadata } = req.body;
    
    // Validate required fields
    if (!modelId || !metricName || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: modelId, metricName, value'
      });
    }
    
    // Track custom metric
    modelPerformanceService.trackCustomMetric(
      modelId,
      metricName,
      value,
      metadata || {}
    );
    
    res.json({
      success: true,
      message: `Custom metric ${metricName} tracked for model ${modelId}`
    });
  } catch (error) {
    logger.error('Error tracking custom metric', error);
    throw new ServerError('Failed to track custom metric', 500);
  }
});

/**
 * @route   GET /api/performance/metric-types
 * @desc    Get available metric types
 * @access  Private
 */
router.get('/metric-types', authenticate(), async (req, res) => {
  try {
    res.json({
      success: true,
      data: Object.values(MetricType)
    });
  } catch (error) {
    logger.error('Error getting metric types', error);
    throw new ServerError('Failed to get metric types', 500);
  }
});

/**
 * @route   GET /api/performance/time-windows
 * @desc    Get available time windows
 * @access  Private
 */
router.get('/time-windows', authenticate(), async (req, res) => {
  try {
    res.json({
      success: true,
      data: Object.entries(TimeWindow).map(([key, value]) => ({
        key,
        value
      }))
    });
  } catch (error) {
    logger.error('Error getting time windows', error);
    throw new ServerError('Failed to get time windows', 500);
  }
});

module.exports = router; 