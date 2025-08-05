/**
 * AI Controller
 * 
 * This controller exposes AI capabilities and services through REST APIs.
 * It serves as the interface between client applications and the AI foundation services.
 * 
 * Part of: AI Foundation Architecture (AI001)
 */

const aiFoundation = require('../ai/services/foundation.service');
const gdtService = require('../ai/services/gdtRecognition.service');
const dimensionalService = require('../ai/services/dimensionalAccuracy.service');
const anomalyDetectionService = require('../ai/services/anomalyDetection.service');
const logger = require('../utils/logger');
const { recordAiAnalysis } = require('../monitoring/metrics');

/**
 * Get a list of all available AI capabilities
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getCapabilities(req, res) {
  try {
    const capabilities = aiFoundation.getCapabilities();
    
    res.status(200).json({
      status: 'success',
      data: {
        capabilities
      }
    });
  } catch (error) {
    logger.error(`Error getting AI capabilities: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve AI capabilities',
      error: error.message
    });
  }
}

/**
 * Execute a prediction using a specific AI model
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function executePrediction(req, res) {
  try {
    const { modelId } = req.params;
    const { input, options } = req.body;
    
    if (!modelId) {
      return res.status(400).json({
        status: 'error',
        message: 'Model ID is required'
      });
    }
    
    if (!input) {
      return res.status(400).json({
        status: 'error',
        message: 'Input data is required'
      });
    }
    
    const results = await aiFoundation.executePrediction(modelId, input, options);
    
    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    logger.error(`Error executing prediction: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to execute prediction',
      error: error.message
    });
  }
}

/**
 * Analyze GD&T symbols in an engineering drawing
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function analyzeGDTSymbols(req, res) {
  try {
    const { componentId, drawingType } = req.params;
    
    if (!componentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Component ID is required'
      });
    }
    
    const results = await gdtService.getGDTSymbolRecognition(componentId, drawingType || 'blueprint');
    
    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    logger.error(`Error analyzing GD&T symbols: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze GD&T symbols',
      error: error.message
    });
  }
}

/**
 * Verify dimensional accuracy of a component inspection
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function verifyDimensionalAccuracy(req, res) {
  try {
    const { inspectionId } = req.params;
    
    if (!inspectionId) {
      return res.status(400).json({
        status: 'error',
        message: 'Inspection ID is required'
      });
    }
    
    const results = await dimensionalService.verifyInspectionMeasurements(inspectionId);
    
    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    logger.error(`Error verifying dimensional accuracy: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify dimensional accuracy',
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
async function analyzeMeasurementTrends(req, res) {
  try {
    const { componentId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!componentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Component ID is required'
      });
    }
    
    const options = {
      startDate,
      endDate
    };
    
    const results = await dimensionalService.analyzeMeasurementTrends(componentId, options);
    
    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    logger.error(`Error analyzing measurement trends: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze measurement trends',
      error: error.message
    });
  }
}

/**
 * Detect anomalies in provided time series data
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function detectAnomalies(req, res) {
  try {
    const { timeSeriesData, options } = req.body;
    
    if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid time series data is required'
      });
    }
    
    const results = await anomalyDetectionService.detectAnomalies(timeSeriesData, options || {});
    
    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    logger.error(`Error detecting anomalies: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to detect anomalies',
      error: error.message
    });
  }
}

/**
 * Analyze measurement anomalies for a component
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function analyzeMeasurementAnomalies(req, res) {
  try {
    const { componentId } = req.params;
    const options = req.query;
    
    if (!componentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Component ID is required'
      });
    }
    
    const results = await anomalyDetectionService.analyzeMeasurementAnomalies(componentId, options);
    
    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    logger.error(`Error analyzing measurement anomalies: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to analyze measurement anomalies',
      error: error.message
    });
  }
}

/**
 * Get available anomaly detection algorithms
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getAnomalyDetectionAlgorithms(req, res) {
  try {
    const algorithms = anomalyDetectionService.getAvailableAlgorithms();
    
    res.status(200).json({
      status: 'success',
      data: {
        algorithms
      }
    });
  } catch (error) {
    logger.error(`Error getting anomaly detection algorithms: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve anomaly detection algorithms',
      error: error.message
    });
  }
}

/**
 * Set up real-time anomaly monitoring for a data stream
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function monitorRealTimeAnomalies(req, res) {
  try {
    const { streamId } = req.params;
    const options = req.body;
    
    if (!streamId) {
      return res.status(400).json({
        status: 'error',
        message: 'Stream ID is required'
      });
    }
    
    const results = await anomalyDetectionService.monitorRealTimeAnomalies(streamId, options);
    
    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    logger.error(`Error setting up real-time anomaly monitoring: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to set up real-time anomaly monitoring',
      error: error.message
    });
  }
}

/**
 * Initialize the AI foundation services
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function initializeAI(req, res) {
  try {
    // Only allow this endpoint for admin users
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized: Only administrators can initialize AI services'
      });
    }
    
    const initResults = await aiFoundation.initializeAIFoundation();
    
    res.status(200).json({
      status: 'success',
      data: initResults
    });
  } catch (error) {
    logger.error(`Error initializing AI services: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to initialize AI services',
      error: error.message
    });
  }
}

/**
 * AI-assisted Data Analysis Integration
 *
 * @route POST /api/v1/ai/analysis
 * @desc Perform AI-assisted data analysis on provided data
 * @access Authenticated users
 * @param {Object} req.body.data - Data to analyze (generic, e.g., inspection, supplier, etc.)
 * @param {Object} req.body.options - Optional analysis options
 * @returns {Object} AI-generated analysis results
 */
async function analyzeData(req, res) {
  try {
    const { data, options } = req.body;
    if (!data) {
      return res.status(400).json({
        status: 'error',
        message: 'No data provided for analysis'
      });
    }

    // Record start time for metrics
    const startTime = Date.now();
    
    // Get data type and size for metrics
    const dataType = Array.isArray(data) ? 'array' : typeof data;
    const dataSize = Buffer.byteLength(JSON.stringify(data));
    
    // Get analysis type from options or default to 'auto'
    const analysisType = options?.analysisType || 'auto';
    
    // Perform the analysis
    const analysis = await aiFoundation.analyzeData(data, options);
    
    // Record metrics
    recordAiAnalysis({
      analysisType,
      dataType,
      dataSize,
      status: 'success'
    }, startTime);
    
    return res.status(200).json({
      status: 'success',
      analysis
    });
  } catch (error) {
    logger.error('Error in AI data analysis:', error);
    
    // Record error metrics if possible
    if (req.body && req.body.data) {
      const dataType = Array.isArray(req.body.data) ? 'array' : typeof req.body.data;
      const analysisType = req.body.options?.analysisType || 'auto';
      
      try {
        const dataSize = Buffer.byteLength(JSON.stringify(req.body.data));
        recordAiAnalysis({
          analysisType,
          dataType,
          dataSize,
          status: 'error'
        }, Date.now() - 100); // Approximate start time
      } catch (metricError) {
        logger.error('Error recording metrics:', metricError);
      }
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to analyze data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Run defect detection on an uploaded image
 * @route POST /api/v1/ai/defect-detection
 * @access Authenticated users
 * @param {Object} req.body.image - Image data (base64, buffer, or file path)
 * @param {Object} req.body.options - Optional pipeline options
 * @returns {Object} Defect detection results
 */
async function runDefectDetection(req, res) {
  try {
    const { image, options } = req.body;
    if (!image) {
      return res.status(400).json({
        status: 'error',
        message: 'Image data is required'
      });
    }
    // Optionally: decode base64 if needed
    let input = image;
    if (typeof image === 'string' && image.startsWith('data:image')) {
      // base64-encoded image
      const base64Data = image.split(',')[1];
      input = Buffer.from(base64Data, 'base64');
    }
    // Call the pipeline (assume aiFoundation exposes AIFramework instance as aiFramework)
    const results = await aiFoundation.aiFramework.runDefectDetectionPipeline(input, options || {});
    res.status(200).json({
      status: 'success',
      data: results
    });
  } catch (error) {
    logger.error(`Error running defect detection: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to run defect detection',
      error: error.message
    });
  }
}

module.exports = {
  getCapabilities,
  executePrediction,
  analyzeGDTSymbols,
  verifyDimensionalAccuracy,
  analyzeMeasurementTrends,
  detectAnomalies,
  analyzeMeasurementAnomalies,
  getAnomalyDetectionAlgorithms,
  monitorRealTimeAnomalies,
  initializeAI,
  analyzeData,
  runDefectDetection
}; 