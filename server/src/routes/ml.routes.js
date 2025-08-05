/**
 * ml.routes.js
 * 
 * API routes for ML model serving
 * Implements RF050 - Implement model serving endpoints
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { mlService, ModelType } = require('../ai');
const { ServerError } = require('../utils/errorHandler');
const logger = require('../ai/utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for model uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Create directory if it doesn't exist
      const uploadDir = process.env.ML_MODEL_STORAGE_PATH || path.join(__dirname, '../../../ml-models');
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: function (req, file, cb) {
    // Use model ID as directory name
    cb(null, file.originalname);
  }
});

const upload = multer({ storage });

/**
 * @route   GET /api/ml/models
 * @desc    Get all available models
 * @access  Private
 */
router.get('/models', authenticate(), async (req, res) => {
  try {
    const models = await mlService.getAvailableModels();
    
    // Add active status to each model
    const modelsWithStatus = models.map(model => ({
      ...model,
      active: mlService.isModelLoaded(model.id)
    }));
    
    res.json({
      success: true,
      count: modelsWithStatus.length,
      data: modelsWithStatus
    });
  } catch (error) {
    logger.error('Error getting models', error);
    throw new ServerError('Failed to get models', 500);
  }
});

/**
 * @route   GET /api/ml/models/active
 * @desc    Get all active models
 * @access  Private
 */
router.get('/models/active', authenticate(), async (req, res) => {
  try {
    const activeModels = mlService.getActiveModels();
    
    res.json({
      success: true,
      count: activeModels.length,
      data: activeModels
    });
  } catch (error) {
    logger.error('Error getting active models', error);
    throw new ServerError('Failed to get active models', 500);
  }
});

/**
 * @route   GET /api/ml/models/:id
 * @desc    Get model by ID
 * @access  Private
 */
router.get('/models/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if model exists
    const models = await mlService.getAvailableModels();
    const model = models.find(m => m.id === id);
    
    if (!model) {
      return res.status(404).json({
        success: false,
        message: `Model ${id} not found`
      });
    }
    
    // Add active status
    model.active = mlService.isModelLoaded(id);
    
    res.json({
      success: true,
      data: model
    });
  } catch (error) {
    logger.error(`Error getting model ${req.params.id}`, error);
    throw new ServerError('Failed to get model', 500);
  }
});

/**
 * @route   POST /api/ml/models/:id/load
 * @desc    Load a model
 * @access  Private (Admin)
 */
router.post('/models/:id/load', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    const { type = ModelType.TENSORFLOW_JS, options = {} } = req.body;
    
    // Check if model is already loaded
    if (mlService.isModelLoaded(id)) {
      return res.json({
        success: true,
        message: `Model ${id} is already loaded`,
        data: { id, type, status: 'loaded' }
      });
    }
    
    // Load model
    const result = await mlService.loadModel(id, type, options);
    
    res.json({
      success: true,
      message: `Model ${id} loaded successfully`,
      data: result
    });
  } catch (error) {
    logger.error(`Error loading model ${req.params.id}`, error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    throw new ServerError('Failed to load model', 500);
  }
});

/**
 * @route   POST /api/ml/models/:id/unload
 * @desc    Unload a model
 * @access  Private (Admin)
 */
router.post('/models/:id/unload', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if model is loaded
    if (!mlService.isModelLoaded(id)) {
      return res.status(400).json({
        success: false,
        message: `Model ${id} is not loaded`
      });
    }
    
    // Unload model
    await mlService.unloadModel(id);
    
    res.json({
      success: true,
      message: `Model ${id} unloaded successfully`
    });
  } catch (error) {
    logger.error(`Error unloading model ${req.params.id}`, error);
    throw new ServerError('Failed to unload model', 500);
  }
});

/**
 * @route   POST /api/ml/models/:id/predict
 * @desc    Run inference on a model
 * @access  Private
 */
router.post('/models/:id/predict', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { input, options = {} } = req.body;
    
    // Check if model is loaded
    if (!mlService.isModelLoaded(id)) {
      return res.status(400).json({
        success: false,
        message: `Model ${id} is not loaded`
      });
    }
    
    // Validate input
    if (!input) {
      return res.status(400).json({
        success: false,
        message: 'Input data is required'
      });
    }
    
    // Run inference
    const startTime = Date.now();
    const result = await mlService.runInference(id, input, options);
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: result,
      meta: {
        modelId: id,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error running inference on model ${req.params.id}`, error);
    throw new ServerError('Failed to run inference', 500);
  }
});

/**
 * @route   POST /api/ml/models/:id/batch-predict
 * @desc    Run batch inference on a model
 * @access  Private
 */
router.post('/models/:id/batch-predict', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { inputs, options = {} } = req.body;
    
    // Check if model is loaded
    if (!mlService.isModelLoaded(id)) {
      return res.status(400).json({
        success: false,
        message: `Model ${id} is not loaded`
      });
    }
    
    // Validate inputs
    if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Input data array is required'
      });
    }
    
    // Run batch inference
    const startTime = Date.now();
    const results = await Promise.all(
      inputs.map(input => mlService.queueInference(id, input, options))
    );
    const duration = Date.now() - startTime;
    
    res.json({
      success: true,
      data: results,
      meta: {
        modelId: id,
        batchSize: inputs.length,
        duration,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(`Error running batch inference on model ${req.params.id}`, error);
    throw new ServerError('Failed to run batch inference', 500);
  }
});

/**
 * @route   POST /api/ml/models/upload
 * @desc    Upload a new model
 * @access  Private (Admin)
 */
router.post('/models/upload', authenticate({ requiredRole: 'admin' }), upload.array('files'), async (req, res) => {
  try {
    const { modelId, modelType, modelName, description, version = '1.0.0' } = req.body;
    
    // Validate required fields
    if (!modelId || !modelType) {
      return res.status(400).json({
        success: false,
        message: 'Model ID and type are required'
      });
    }
    
    // Create model directory
    const modelDir = process.env.ML_MODEL_STORAGE_PATH || path.join(__dirname, '../../../ml-models');
    const modelPath = path.join(modelDir, modelId);
    
    // Check if model already exists
    try {
      await fs.access(modelPath);
      return res.status(409).json({
        success: false,
        message: `Model with ID ${modelId} already exists`
      });
    } catch (error) {
      // Directory doesn't exist, which is what we want
    }
    
    // Create model directory
    await fs.mkdir(modelPath, { recursive: true });
    
    // Move uploaded files to model directory
    for (const file of req.files) {
      const destPath = path.join(modelPath, file.originalname);
      await fs.rename(file.path, destPath);
    }
    
    // Create metadata file
    const metadata = {
      name: modelName || modelId,
      type: modelType,
      version,
      description: description || `Model ${modelId}`,
      createdAt: new Date().toISOString(),
      createdBy: req.user.id
    };
    
    await fs.writeFile(
      path.join(modelPath, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    res.status(201).json({
      success: true,
      message: `Model ${modelId} uploaded successfully`,
      data: {
        id: modelId,
        ...metadata
      }
    });
  } catch (error) {
    logger.error('Error uploading model', error);
    
    // Clean up any uploaded files
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          logger.error(`Error deleting uploaded file ${file.path}`, unlinkError);
        }
      }
    }
    
    throw new ServerError('Failed to upload model', 500);
  }
});

/**
 * @route   DELETE /api/ml/models/:id
 * @desc    Delete a model
 * @access  Private (Admin)
 */
router.delete('/models/:id', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if model is loaded
    if (mlService.isModelLoaded(id)) {
      // Unload model first
      await mlService.unloadModel(id);
    }
    
    // Delete model directory
    const modelDir = process.env.ML_MODEL_STORAGE_PATH || path.join(__dirname, '../../../ml-models');
    const modelPath = path.join(modelDir, id);
    
    try {
      await fs.access(modelPath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Model ${id} not found`
      });
    }
    
    // Delete directory recursively
    await fs.rm(modelPath, { recursive: true, force: true });
    
    res.json({
      success: true,
      message: `Model ${id} deleted successfully`
    });
  } catch (error) {
    logger.error(`Error deleting model ${req.params.id}`, error);
    throw new ServerError('Failed to delete model', 500);
  }
});

module.exports = router; 