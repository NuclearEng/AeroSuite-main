/**
 * model-registry.routes.js
 * 
 * API routes for model registry
 * Implements RF052 - Add model registry
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { modelRegistry, ModelStatus, ModelStage } = require('../ai');
const { ServerError } = require('../utils/errorHandler');
const logger = require('../ai/utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for artifact uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Create directory if it doesn't exist
      const uploadDir = process.env.ML_REGISTRY_ARTIFACTS_PATH || path.join(__dirname, '../../../ml-artifacts');
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
 * @route   GET /api/registry/models
 * @desc    Get all registered models
 * @access  Private
 */
router.get('/models', authenticate(), async (req, res) => {
  try {
    const models = await modelRegistry.getModels();
    
    res.json({
      success: true,
      count: models.length,
      data: models
    });
  } catch (error) {
    logger.error('Error getting registered models', error);
    throw new ServerError('Failed to get registered models', 500);
  }
});

/**
 * @route   GET /api/registry/models/:name
 * @desc    Get model by name
 * @access  Private
 */
router.get('/models/:name', authenticate(), async (req, res) => {
  try {
    const { name } = req.params;
    
    try {
      const model = await modelRegistry.getModel(name);
      
      res.json({
        success: true,
        data: model
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Model ${name} not found in registry`
      });
    }
  } catch (error) {
    logger.error(`Error getting model ${req.params.name}`, error);
    throw new ServerError('Failed to get model', 500);
  }
});

/**
 * @route   POST /api/registry/models
 * @desc    Register a new model
 * @access  Private (Admin)
 */
router.post('/models', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { modelName, description, tags } = req.body;
    
    // Validate required fields
    if (!modelName) {
      return res.status(400).json({
        success: false,
        message: 'Model name is required'
      });
    }
    
    try {
      const model = await modelRegistry.registerModel(modelName, {
        description,
        tags
      });
      
      res.status(201).json({
        success: true,
        message: `Model ${modelName} registered successfully`,
        data: model
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error('Error registering model', error);
    throw new ServerError('Failed to register model', 500);
  }
});

/**
 * @route   POST /api/registry/models/:name/versions
 * @desc    Add a new version to a model
 * @access  Private (Admin)
 */
router.post('/models/:name/versions', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { name } = req.params;
    const { modelId, description, tags, metrics, parameters, sourceCommit, experimentId, datasetId, pipelineId } = req.body;
    
    // Validate required fields
    if (!modelId) {
      return res.status(400).json({
        success: false,
        message: 'Model ID is required'
      });
    }
    
    try {
      const version = await modelRegistry.addModelVersion(name, modelId, {
        description,
        tags,
        metrics,
        parameters,
        sourceCommit,
        experimentId,
        datasetId,
        pipelineId,
        createdBy: req.user.id
      });
      
      res.status(201).json({
        success: true,
        message: `Version ${version.version} added to model ${name}`,
        data: version
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
    logger.error(`Error adding version to model ${req.params.name}`, error);
    throw new ServerError('Failed to add version', 500);
  }
});

/**
 * @route   GET /api/registry/models/:name/versions/:version
 * @desc    Get a specific version of a model
 * @access  Private
 */
router.get('/models/:name/versions/:version', authenticate(), async (req, res) => {
  try {
    const { name, version } = req.params;
    
    try {
      const modelVersion = await modelRegistry.getModelVersion(name, version);
      
      res.json({
        success: true,
        data: modelVersion
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
  } catch (error) {
    logger.error(`Error getting version ${req.params.version} of model ${req.params.name}`, error);
    throw new ServerError('Failed to get model version', 500);
  }
});

/**
 * @route   PATCH /api/registry/models/:name/versions/:version/status
 * @desc    Update model version status
 * @access  Private (Admin)
 */
router.patch('/models/:name/versions/:version/status', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { name, version } = req.params;
    const { status } = req.body;
    
    // Validate required fields
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    try {
      const modelVersion = await modelRegistry.updateModelVersionStatus(name, version, status);
      
      res.json({
        success: true,
        message: `Status updated to ${status} for model ${name} version ${version}`,
        data: modelVersion
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      if (error.message.includes('Invalid status')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          validStatuses: Object.values(ModelStatus)
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error updating status for model ${req.params.name} version ${req.params.version}`, error);
    throw new ServerError('Failed to update status', 500);
  }
});

/**
 * @route   PATCH /api/registry/models/:name/versions/:version/stage
 * @desc    Update model version lifecycle stage
 * @access  Private (Admin)
 */
router.patch('/models/:name/versions/:version/stage', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { name, version } = req.params;
    const { stage } = req.body;
    
    // Validate required fields
    if (!stage) {
      return res.status(400).json({
        success: false,
        message: 'Stage is required'
      });
    }
    
    try {
      const modelVersion = await modelRegistry.updateModelVersionStage(name, version, stage);
      
      res.json({
        success: true,
        message: `Stage updated to ${stage} for model ${name} version ${version}`,
        data: modelVersion
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      if (error.message.includes('Invalid stage')) {
        return res.status(400).json({
          success: false,
          message: error.message,
          validStages: Object.values(ModelStage)
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error updating stage for model ${req.params.name} version ${req.params.version}`, error);
    throw new ServerError('Failed to update stage', 500);
  }
});

/**
 * @route   POST /api/registry/models/:name/versions/:version/metrics
 * @desc    Add metrics to a model version
 * @access  Private (Admin)
 */
router.post('/models/:name/versions/:version/metrics', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { name, version } = req.params;
    const { metrics } = req.body;
    
    // Validate required fields
    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Metrics object is required'
      });
    }
    
    try {
      const modelVersion = await modelRegistry.addModelVersionMetrics(name, version, metrics);
      
      res.json({
        success: true,
        message: `Metrics added to model ${name} version ${version}`,
        data: modelVersion
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
    logger.error(`Error adding metrics for model ${req.params.name} version ${req.params.version}`, error);
    throw new ServerError('Failed to add metrics', 500);
  }
});

/**
 * @route   POST /api/registry/models/:name/versions/:version/artifacts
 * @desc    Add an artifact to a model version
 * @access  Private (Admin)
 */
router.post('/models/:name/versions/:version/artifacts', authenticate({ requiredRole: 'admin' }), upload.single('artifact'), async (req, res) => {
  try {
    const { name, version } = req.params;
    const { artifactType } = req.body;
    
    // Validate required fields
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Artifact file is required'
      });
    }
    
    if (!artifactType) {
      return res.status(400).json({
        success: false,
        message: 'Artifact type is required'
      });
    }
    
    try {
      const modelVersion = await modelRegistry.addModelVersionArtifact(name, version, req.file.path, artifactType);
      
      res.json({
        success: true,
        message: `Artifact added to model ${name} version ${version}`,
        data: modelVersion
      });
    } catch (error) {
      // Clean up uploaded file
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error(`Error deleting uploaded file ${req.file.path}`, unlinkError);
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error adding artifact for model ${req.params.name} version ${req.params.version}`, error);
    
    // Clean up uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error(`Error deleting uploaded file ${req.file.path}`, unlinkError);
      }
    }
    
    throw new ServerError('Failed to add artifact', 500);
  }
});

/**
 * @route   DELETE /api/registry/models/:name
 * @desc    Delete a model from the registry
 * @access  Private (Admin)
 */
router.delete('/models/:name', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { name } = req.params;
    
    try {
      await modelRegistry.deleteModel(name);
      
      res.json({
        success: true,
        message: `Model ${name} deleted from registry`
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
    logger.error(`Error deleting model ${req.params.name}`, error);
    throw new ServerError('Failed to delete model', 500);
  }
});

/**
 * @route   GET /api/registry/models/:name/production
 * @desc    Get the production version of a model
 * @access  Private
 */
router.get('/models/:name/production', authenticate(), async (req, res) => {
  try {
    const { name } = req.params;
    
    try {
      const productionVersion = await modelRegistry.getProductionVersion(name);
      
      res.json({
        success: true,
        data: productionVersion
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('No production version')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error getting production version for model ${req.params.name}`, error);
    throw new ServerError('Failed to get production version', 500);
  }
});

/**
 * @route   GET /api/registry/models/:name/staging
 * @desc    Get the staging version of a model
 * @access  Private
 */
router.get('/models/:name/staging', authenticate(), async (req, res) => {
  try {
    const { name } = req.params;
    
    try {
      const stagingVersion = await modelRegistry.getStagingVersion(name);
      
      res.json({
        success: true,
        data: stagingVersion
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('No staging version')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error getting staging version for model ${req.params.name}`, error);
    throw new ServerError('Failed to get staging version', 500);
  }
});

/**
 * @route   POST /api/registry/import
 * @desc    Import a model from storage into registry
 * @access  Private (Admin)
 */
router.post('/import', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { modelId, modelName, description, tags } = req.body;
    
    // Validate required fields
    if (!modelId || !modelName) {
      return res.status(400).json({
        success: false,
        message: 'Model ID and model name are required'
      });
    }
    
    try {
      const result = await modelRegistry.importModel(modelId, modelName, {
        description,
        tags,
        createdBy: req.user.id
      });
      
      res.status(201).json({
        success: true,
        message: `Model ${modelId} imported as ${modelName} successfully`,
        data: result
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
    logger.error('Error importing model', error);
    throw new ServerError('Failed to import model', 500);
  }
});

/**
 * @route   GET /api/registry/status-options
 * @desc    Get available model status options
 * @access  Private
 */
router.get('/status-options', authenticate(), (req, res) => {
  res.json({
    success: true,
    data: Object.values(ModelStatus)
  });
});

/**
 * @route   GET /api/registry/stage-options
 * @desc    Get available model lifecycle stage options
 * @access  Private
 */
router.get('/stage-options', authenticate(), (req, res) => {
  res.json({
    success: true,
    data: Object.values(ModelStage)
  });
});

module.exports = router; 