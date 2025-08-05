/**
 * model-evaluation.routes.js
 * 
 * API routes for model evaluation
 * Implements RF055 - Add automated model evaluation
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { ModelEvaluationService, EvaluationStatus, EvaluationType } = require('../ai/services/ModelEvaluationService');
const { ServerError } = require('../utils/errorHandler');
const logger = require('../ai/utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Initialize model evaluation service
const modelEvaluationService = new ModelEvaluationService();

// Configure multer for dataset uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Create directory if it doesn't exist
      const uploadDir = process.env.ML_DATASETS_UPLOAD_PATH || path.join(__dirname, '../../../ml-dataset-uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/**
 * @route   GET /api/evaluations
 * @desc    Get all evaluations
 * @access  Private
 */
router.get('/', authenticate(), async (req, res) => {
  try {
    const { status, modelId, datasetId, type, tags } = req.query;
    
    // Prepare filters
    const filters = {};
    if (status) filters.status = status;
    if (modelId) filters.modelId = modelId;
    if (datasetId) filters.datasetId = datasetId;
    if (type) filters.type = type;
    if (tags) filters.tags = tags.split(',');
    
    const evaluations = await modelEvaluationService.getEvaluations(filters);
    
    res.json({
      success: true,
      count: evaluations.length,
      data: evaluations
    });
  } catch (error) {
    logger.error('Error getting evaluations', error);
    throw new ServerError('Failed to get evaluations', 500);
  }
});

/**
 * @route   GET /api/evaluations/:id
 * @desc    Get evaluation by ID
 * @access  Private
 */
router.get('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const evaluation = await modelEvaluationService.getEvaluation(id);
      
      res.json({
        success: true,
        data: evaluation
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Evaluation ${id} not found`
      });
    }
  } catch (error) {
    logger.error(`Error getting evaluation ${req.params.id}`, error);
    throw new ServerError('Failed to get evaluation', 500);
  }
});

/**
 * @route   POST /api/evaluations
 * @desc    Create a new evaluation
 * @access  Private
 */
router.post('/', authenticate(), async (req, res) => {
  try {
    const { name, modelId, datasetId, type, parameters, experimentId, tags, notes } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation name is required'
      });
    }
    
    if (!modelId) {
      return res.status(400).json({
        success: false,
        message: 'Model ID is required'
      });
    }
    
    if (!datasetId) {
      return res.status(400).json({
        success: false,
        message: 'Dataset ID is required'
      });
    }
    
    const evaluation = await modelEvaluationService.createEvaluation(name, modelId, datasetId, {
      type,
      parameters,
      experimentId,
      tags,
      notes,
      userId: req.user.id
    });
    
    res.status(201).json({
      success: true,
      message: `Evaluation ${name} created successfully`,
      data: evaluation
    });
  } catch (error) {
    logger.error('Error creating evaluation', error);
    throw new ServerError('Failed to create evaluation', 500);
  }
});

/**
 * @route   POST /api/evaluations/:id/start
 * @desc    Start an evaluation
 * @access  Private
 */
router.post('/:id/start', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const evaluation = await modelEvaluationService.startEvaluation(id);
      
      res.json({
        success: true,
        message: `Evaluation ${id} started successfully`,
        data: evaluation
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error starting evaluation ${req.params.id}`, error);
    throw new ServerError('Failed to start evaluation', 500);
  }
});

/**
 * @route   DELETE /api/evaluations/:id
 * @desc    Delete an evaluation
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      await modelEvaluationService.deleteEvaluation(id);
      
      res.json({
        success: true,
        message: `Evaluation ${id} deleted successfully`
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      if (error.message.includes('Cannot delete active evaluation')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error deleting evaluation ${req.params.id}`, error);
    throw new ServerError('Failed to delete evaluation', 500);
  }
});

/**
 * @route   POST /api/evaluations/compare
 * @desc    Compare multiple evaluations
 * @access  Private
 */
router.post('/compare', authenticate(), async (req, res) => {
  try {
    const { evaluationIds } = req.body;
    
    if (!evaluationIds || !Array.isArray(evaluationIds) || evaluationIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least two evaluation IDs are required for comparison'
      });
    }
    
    try {
      const comparison = await modelEvaluationService.compareEvaluations(evaluationIds);
      
      res.json({
        success: true,
        data: comparison
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('not completed')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error comparing evaluations', error);
    throw new ServerError('Failed to compare evaluations', 500);
  }
});

/**
 * @route   GET /api/evaluations/model/:modelId/best
 * @desc    Get best evaluation for a model based on a metric
 * @access  Private
 */
router.get('/model/:modelId/best', authenticate(), async (req, res) => {
  try {
    const { modelId } = req.params;
    const { metric, higher = 'true' } = req.query;
    
    if (!metric) {
      return res.status(400).json({
        success: false,
        message: 'Metric name is required'
      });
    }
    
    const isHigherBetter = higher === 'true';
    
    try {
      const bestEvaluation = await modelEvaluationService.getBestEvaluation(modelId, metric, isHigherBetter);
      
      res.json({
        success: true,
        data: bestEvaluation
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error getting best evaluation for model ${req.params.modelId}`, error);
    throw new ServerError('Failed to get best evaluation', 500);
  }
});

/**
 * @route   POST /api/evaluations/datasets
 * @desc    Register a new dataset
 * @access  Private
 */
router.post('/datasets', authenticate(), upload.single('dataset'), async (req, res) => {
  try {
    const { id, name, description, type, format, features, labels, split, source, license } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Dataset ID is required'
      });
    }
    
    // Create metadata
    const metadata = {
      name: name || id,
      description,
      type,
      format,
      size: req.file ? req.file.size : 0,
      features: features ? JSON.parse(features) : [],
      labels: labels ? JSON.parse(labels) : [],
      split: split ? JSON.parse(split) : { train: 0, test: 0, validation: 0 },
      source,
      license,
      uploadedBy: req.user.id,
      uploadedAt: new Date().toISOString()
    };
    
    // Register dataset
    const dataset = await modelEvaluationService.registerDataset(
      id,
      req.file ? req.file.path : null,
      metadata
    );
    
    // Clean up uploaded file if needed
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.warn(`Failed to delete temporary dataset file: ${unlinkError.message}`);
      }
    }
    
    res.status(201).json({
      success: true,
      message: `Dataset ${id} registered successfully`,
      data: dataset
    });
  } catch (error) {
    logger.error('Error registering dataset', error);
    
    // Clean up uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error(`Error deleting uploaded file ${req.file.path}`, unlinkError);
      }
    }
    
    throw new ServerError('Failed to register dataset', 500);
  }
});

/**
 * @route   GET /api/evaluations/datasets/:id
 * @desc    Get dataset metadata
 * @access  Private
 */
router.get('/datasets/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const dataset = await modelEvaluationService.getDataset(id);
      
      res.json({
        success: true,
        data: dataset
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: `Dataset ${id} not found`
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error getting dataset ${req.params.id}`, error);
    throw new ServerError('Failed to get dataset', 500);
  }
});

/**
 * @route   GET /api/evaluations/types
 * @desc    Get evaluation types
 * @access  Private
 */
router.get('/types', authenticate(), (req, res) => {
  res.json({
    success: true,
    data: Object.values(EvaluationType)
  });
});

/**
 * @route   GET /api/evaluations/status
 * @desc    Get evaluation status values
 * @access  Private
 */
router.get('/status', authenticate(), (req, res) => {
  res.json({
    success: true,
    data: Object.values(EvaluationStatus)
  });
});

module.exports = router; 