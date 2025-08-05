/**
 * AI Routes
 * 
 * This module defines the API routes for AI capabilities and services.
 * 
 * Part of: AI Foundation Architecture (AI001)
 */

const express = require('express');
const router = express.Router();
const aiController = require('../../controllers/ai.controller');
const { auth, checkRole } = require('../../middleware/auth');

// Get all AI capabilities
router.get('/capabilities', auth, aiController.getCapabilities);

// Initialize AI foundation services (admin only)
router.post('/initialize', auth, checkRole(['admin']), aiController.initializeAI);

// Execute prediction with a specific model
router.post('/predict/:modelId', auth, aiController.executePrediction);

// GD&T analysis routes
router.get('/gdt/:componentId', auth, aiController.analyzeGDTSymbols);
router.get('/gdt/:componentId/:drawingType', auth, aiController.analyzeGDTSymbols);

// Dimensional accuracy routes
router.get('/dimensional-accuracy/:inspectionId', auth, aiController.verifyDimensionalAccuracy);
router.get('/measurement-trends/:componentId', auth, aiController.analyzeMeasurementTrends);

// Anomaly detection routes
router.post('/anomaly-detection', auth, aiController.detectAnomalies);
router.get('/anomaly-detection/algorithms', auth, aiController.getAnomalyDetectionAlgorithms);
router.get('/anomaly-detection/measurements/:componentId', auth, aiController.analyzeMeasurementAnomalies);
router.post('/anomaly-detection/monitor/:streamId', auth, checkRole(['admin', 'engineer']), aiController.monitorRealTimeAnomalies);

// AI-assisted data analysis integration
router.post('/analysis', auth, aiController.analyzeData);

// Defect detection route (AI001)
router.post('/defect-detection', auth, aiController.runDefectDetection);

module.exports = router; 