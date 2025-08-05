/**
 * data-drift.routes.js
 * 
 * API routes for data drift detection
 * Implements RF058 - Add data drift detection
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { DataDriftService, DriftSeverity } = require('../ai/services/DataDriftService');
const { ServerError } = require('../utils/errorHandler');
const logger = require('../ai/utils/logger');

// Initialize data drift service
const dataDriftService = new DataDriftService();

/**
 * @route   POST /api/drift/baselines
 * @desc    Create or update baseline for a model
 * @access  Private
 */
router.post('/baselines', authenticate(), async (req, res) => {
  try {
    const { modelId, data, features, metadata } = req.body;
    
    // Validate required fields
    if (!modelId) {
      return res.status(400).json({
        success: false,
        message: 'Model ID is required'
      });
    }
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data is required for baseline creation'
      });
    }
    
    // Create baseline
    const baseline = await dataDriftService.createBaseline(modelId, data, {
      features,
      metadata
    });
    
    res.status(201).json({
      success: true,
      message: `Baseline created for model ${modelId}`,
      data: baseline
    });
  } catch (error) {
    logger.error('Error creating baseline', error);
    throw new ServerError('Failed to create baseline', 500);
  }
});

/**
 * @route   GET /api/drift/baselines/:modelId
 * @desc    Get baseline for a model
 * @access  Private
 */
router.get('/baselines/:modelId', authenticate(), async (req, res) => {
  try {
    const { modelId } = req.params;
    
    const baseline = dataDriftService.getBaseline(modelId);
    
    if (!baseline) {
      return res.status(404).json({
        success: false,
        message: `No baseline found for model ${modelId}`
      });
    }
    
    res.json({
      success: true,
      data: baseline
    });
  } catch (error) {
    logger.error(`Error getting baseline for model ${req.params.modelId}`, error);
    throw new ServerError('Failed to get baseline', 500);
  }
});

/**
 * @route   POST /api/drift/detect/:modelId
 * @desc    Manually trigger drift detection for a model
 * @access  Private
 */
router.post('/detect/:modelId', authenticate(), async (req, res) => {
  try {
    const { modelId } = req.params;
    const { currentData } = req.body;
    
    // Validate required fields
    if (!currentData) {
      return res.status(400).json({
        success: false,
        message: 'Current data is required for drift detection'
      });
    }
    
    // Detect drift
    const report = await dataDriftService.detectDriftForModel(modelId, currentData);
    
    res.json({
      success: true,
      message: `Drift detection completed for model ${modelId}`,
      data: report
    });
  } catch (error) {
    logger.error(`Error detecting drift for model ${req.params.modelId}`, error);
    
    if (error.message.includes('No baseline found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    throw new ServerError('Failed to detect drift', 500);
  }
});

/**
 * @route   GET /api/drift/reports/:modelId
 * @desc    Get drift reports for a model
 * @access  Private
 */
router.get('/reports/:modelId', authenticate(), async (req, res) => {
  try {
    const { modelId } = req.params;
    const { startDate, endDate, severity, limit } = req.query;
    
    const reports = dataDriftService.getDriftReports(modelId, {
      startDate,
      endDate,
      severity,
      limit: limit ? parseInt(limit, 10) : undefined
    });
    
    res.json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    logger.error(`Error getting drift reports for model ${req.params.modelId}`, error);
    throw new ServerError('Failed to get drift reports', 500);
  }
});

/**
 * @route   GET /api/drift/reports/:modelId/latest
 * @desc    Get latest drift report for a model
 * @access  Private
 */
router.get('/reports/:modelId/latest', authenticate(), async (req, res) => {
  try {
    const { modelId } = req.params;
    
    const report = dataDriftService.getLatestDriftReport(modelId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: `No drift reports found for model ${modelId}`
      });
    }
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error(`Error getting latest drift report for model ${req.params.modelId}`, error);
    throw new ServerError('Failed to get latest drift report', 500);
  }
});

/**
 * @route   GET /api/drift/severity-levels
 * @desc    Get available drift severity levels
 * @access  Private
 */
router.get('/severity-levels', authenticate(), async (req, res) => {
  try {
    res.json({
      success: true,
      data: Object.values(DriftSeverity)
    });
  } catch (error) {
    logger.error('Error getting severity levels', error);
    throw new ServerError('Failed to get severity levels', 500);
  }
});

module.exports = router; 