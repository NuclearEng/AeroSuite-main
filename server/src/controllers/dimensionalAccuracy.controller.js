/**
 * Dimensional Accuracy Verification Controller
 * 
 * This controller provides API endpoints for dimensional accuracy verification
 * and integrates with the GD&T recognition service.
 */

const mongoose = require('mongoose');
const { 
  verifyDimensionalAccuracy,
  verifyInspectionMeasurements,
  analyzeMeasurementTrends
} = require('../ai/services/dimensionalAccuracy.service');

const {
  getGDTSymbolRecognition,
  createDrawingInterpretationReport
} = require('../ai/services/gdtRecognition.service');

const logger = require('../ai/utils/logger');
const Inspection = require('../models/inspection.model');
const Component = require('../models/component.model');

/**
 * Verify the dimensional accuracy of measurements for an inspection
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function verifyInspection(req, res) {
  try {
    const { inspectionId } = req.params;
    
    // Validate inspection ID
    if (!mongoose.Types.ObjectId.isValid(inspectionId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid inspection ID format'
      });
    }
    
    // Call the verification service
    const verificationResults = await verifyInspectionMeasurements(inspectionId);
    
    return res.status(200).json({
      success: true,
      data: verificationResults
    });
  } catch (error) {
    logger.error(`Error verifying inspection: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      message: 'Error verifying inspection',
      error: error.message
    });
  }
}

/**
 * Analyze measurement trends for a component
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function analyzeComponentTrends(req, res) {
  try {
    const { componentId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validate component ID
    if (!mongoose.Types.ObjectId.isValid(componentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid component ID format'
      });
    }
    
    // Set up options for trend analysis
    const options = {};
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
    
    // Call the trend analysis service
    const trendsAnalysis = await analyzeMeasurementTrends(componentId, options);
    
    return res.status(200).json({
      success: true,
      data: trendsAnalysis
    });
  } catch (error) {
    logger.error(`Error analyzing component trends: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      message: 'Error analyzing component trends',
      error: error.message
    });
  }
}

/**
 * Get dimensional requirements from component drawing
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getComponentDimensionalRequirements(req, res) {
  try {
    const { componentId } = req.params;
    const { drawingType } = req.query;
    
    // Validate component ID
    if (!mongoose.Types.ObjectId.isValid(componentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid component ID format'
      });
    }
    
    // Get component information
    const component = await Component.findById(componentId);
    if (!component) {
      return res.status(404).json({
        success: false,
        message: `Component not found: ${componentId}`
      });
    }
    
    // Get GD&T recognition results
    const recognitionResults = await getGDTSymbolRecognition(
      componentId, 
      drawingType || 'blueprint'
    );
    
    // Create interpretation report
    const interpretationReport = createDrawingInterpretationReport(
      recognitionResults.recognitionResults
    );
    
    return res.status(200).json({
      success: true,
      componentInfo: {
        name: component.name,
        partNumber: component.partNumber,
        revision: component.revision
      },
      data: {
        recognitionResults,
        interpretationReport
      }
    });
  } catch (error) {
    logger.error(`Error getting component dimensional requirements: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      message: 'Error getting component dimensional requirements',
      error: error.message
    });
  }
}

/**
 * Verify a single measurement against specifications
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function verifyMeasurement(req, res) {
  try {
    const { measurement, specification } = req.body;
    
    // Validate request body
    if (!measurement) {
      return res.status(400).json({
        success: false,
        message: 'Measurement data is required'
      });
    }
    
    // Call the verification service
    const verificationResult = await verifyDimensionalAccuracy(measurement, specification);
    
    return res.status(200).json({
      success: true,
      data: verificationResult
    });
  } catch (error) {
    logger.error(`Error verifying measurement: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      message: 'Error verifying measurement',
      error: error.message
    });
  }
}

module.exports = {
  verifyInspection,
  analyzeComponentTrends,
  getComponentDimensionalRequirements,
  verifyMeasurement
}; 