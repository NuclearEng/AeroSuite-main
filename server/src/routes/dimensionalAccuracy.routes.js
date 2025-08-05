/**
 * Dimensional Accuracy Routes
 * 
 * API routes for dimensional accuracy verification functionality
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const dimensionalAccuracyController = require('../controllers/dimensionalAccuracy.controller');

// Route for verifying a single inspection's measurements
router.get(
  '/inspections/:inspectionId/verify',
  authenticate,
  dimensionalAccuracyController.verifyInspection
);

// Route for analyzing measurement trends for a component
router.get(
  '/components/:componentId/measurement-trends',
  authenticate,
  dimensionalAccuracyController.analyzeComponentTrends
);

// Route for getting dimensional requirements from a component drawing
router.get(
  '/components/:componentId/dimensional-requirements',
  authenticate,
  dimensionalAccuracyController.getComponentDimensionalRequirements
);

// Route for verifying a single measurement against specifications
router.post(
  '/verify-measurement',
  authenticate,
  dimensionalAccuracyController.verifyMeasurement
);

module.exports = router; 