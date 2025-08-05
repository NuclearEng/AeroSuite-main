/**
 * feature-engineering.routes.js
 * 
 * API routes for feature engineering pipeline
 * Implements RF051 - Create feature engineering pipeline
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { featureEngineeringService, FeatureType, TransformationType } = require('../ai');
const { ServerError } = require('../utils/errorHandler');
const logger = require('../ai/utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for data uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Create directory if it doesn't exist
      const uploadDir = process.env.ML_DATA_STORAGE_PATH || path.join(__dirname, '../../../ml-data');
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
 * @route   GET /api/feature-engineering/pipelines
 * @desc    Get all available pipelines
 * @access  Private
 */
router.get('/pipelines', authenticate(), async (req, res) => {
  try {
    const pipelines = await featureEngineeringService.getAvailablePipelines();
    
    res.json({
      success: true,
      count: pipelines.length,
      data: pipelines
    });
  } catch (error) {
    logger.error('Error getting pipelines', error);
    throw new ServerError('Failed to get pipelines', 500);
  }
});

/**
 * @route   GET /api/feature-engineering/pipelines/:id
 * @desc    Get pipeline by ID
 * @access  Private
 */
router.get('/pipelines/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const pipeline = await featureEngineeringService.getPipeline(id);
      
      res.json({
        success: true,
        data: pipeline
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Pipeline ${id} not found`
      });
    }
  } catch (error) {
    logger.error(`Error getting pipeline ${req.params.id}`, error);
    throw new ServerError('Failed to get pipeline', 500);
  }
});

/**
 * @route   POST /api/feature-engineering/pipelines
 * @desc    Create a new pipeline
 * @access  Private (Admin)
 */
router.post('/pipelines', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { pipelineId, steps } = req.body;
    
    // Validate required fields
    if (!pipelineId) {
      return res.status(400).json({
        success: false,
        message: 'Pipeline ID is required'
      });
    }
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pipeline steps are required and must be an array'
      });
    }
    
    // Create pipeline
    const pipeline = await featureEngineeringService.createPipeline(pipelineId, steps);
    
    res.status(201).json({
      success: true,
      message: `Pipeline ${pipelineId} created successfully`,
      data: pipeline
    });
  } catch (error) {
    logger.error('Error creating pipeline', error);
    
    if (error.message.includes('Unsupported transformation')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    throw new ServerError('Failed to create pipeline', 500);
  }
});

/**
 * @route   DELETE /api/feature-engineering/pipelines/:id
 * @desc    Delete a pipeline
 * @access  Private (Admin)
 */
router.delete('/pipelines/:id', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      await featureEngineeringService.deletePipeline(id);
      
      res.json({
        success: true,
        message: `Pipeline ${id} deleted successfully`
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Pipeline ${id} not found`
      });
    }
  } catch (error) {
    logger.error(`Error deleting pipeline ${req.params.id}`, error);
    throw new ServerError('Failed to delete pipeline', 500);
  }
});

/**
 * @route   POST /api/feature-engineering/pipelines/:id/fit
 * @desc    Fit a pipeline on training data
 * @access  Private (Admin)
 */
router.post('/pipelines/:id/fit', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    
    // Validate data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Training data is required and must be an array'
      });
    }
    
    // Fit pipeline
    try {
      const pipeline = await featureEngineeringService.fitPipeline(id, data);
      
      res.json({
        success: true,
        message: `Pipeline ${id} fitted successfully`,
        data: pipeline
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
    logger.error(`Error fitting pipeline ${req.params.id}`, error);
    throw new ServerError('Failed to fit pipeline', 500);
  }
});

/**
 * @route   POST /api/feature-engineering/pipelines/:id/transform
 * @desc    Transform data using a pipeline
 * @access  Private
 */
router.post('/pipelines/:id/transform', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { data } = req.body;
    
    // Validate data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data is required and must be an array'
      });
    }
    
    // Transform data
    try {
      const transformedData = await featureEngineeringService.transformData(id, data);
      
      res.json({
        success: true,
        count: transformedData.length,
        data: transformedData
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      if (error.message.includes('not fitted')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      throw error;
    }
  } catch (error) {
    logger.error(`Error transforming data with pipeline ${req.params.id}`, error);
    throw new ServerError('Failed to transform data', 500);
  }
});

/**
 * @route   POST /api/feature-engineering/upload-data
 * @desc    Upload data for feature engineering
 * @access  Private (Admin)
 */
router.post('/upload-data', authenticate({ requiredRole: 'admin' }), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Process the uploaded file (CSV, JSON, etc.)
    const filePath = req.file.path;
    const fileType = path.extname(req.file.originalname).toLowerCase();
    
    let data = [];
    
    if (fileType === '.json') {
      // Parse JSON file
      const fileContent = await fs.readFile(filePath, 'utf8');
      data = JSON.parse(fileContent);
      
      if (!Array.isArray(data)) {
        // If the JSON contains an object with a data array
        if (data.data && Array.isArray(data.data)) {
          data = data.data;
        } else {
          throw new Error('JSON file must contain an array of objects');
        }
      }
    } else if (fileType === '.csv') {
      // For CSV, we would need a CSV parser
      // This is a placeholder - in a real implementation, use a CSV parser library
      throw new Error('CSV parsing not implemented yet');
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    res.json({
      success: true,
      message: 'Data uploaded successfully',
      count: data.length,
      filePath: req.file.path,
      fileName: req.file.filename
    });
  } catch (error) {
    logger.error('Error uploading data', error);
    
    // Clean up the uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error(`Error deleting uploaded file ${req.file.path}`, unlinkError);
      }
    }
    
    if (error.message.includes('Unsupported file type') || 
        error.message.includes('must contain an array')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    throw new ServerError('Failed to upload data', 500);
  }
});

/**
 * @route   GET /api/feature-engineering/transformers
 * @desc    Get available transformer types
 * @access  Private
 */
router.get('/transformers', authenticate(), (req, res) => {
  try {
    // Return available transformer types
    const transformerTypes = Object.values(TransformationType);
    
    res.json({
      success: true,
      count: transformerTypes.length,
      data: transformerTypes
    });
  } catch (error) {
    logger.error('Error getting transformer types', error);
    throw new ServerError('Failed to get transformer types', 500);
  }
});

/**
 * @route   GET /api/feature-engineering/feature-types
 * @desc    Get available feature types
 * @access  Private
 */
router.get('/feature-types', authenticate(), (req, res) => {
  try {
    // Return available feature types
    const featureTypes = Object.values(FeatureType);
    
    res.json({
      success: true,
      count: featureTypes.length,
      data: featureTypes
    });
  } catch (error) {
    logger.error('Error getting feature types', error);
    throw new ServerError('Failed to get feature types', 500);
  }
});

module.exports = router; 