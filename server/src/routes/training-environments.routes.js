/**
 * training-environments.routes.js
 * 
 * API routes for containerized training environments
 * Implements RF053 - Set up containerized training environments
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { TrainingEnvironmentService, EnvironmentType, EnvironmentStatus } = require('../ai/services/TrainingEnvironmentService');
const { ServerError } = require('../utils/errorHandler');
const logger = require('../ai/utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');
const stream = require('stream');

// Initialize training environment service
const trainingEnvironmentService = new TrainingEnvironmentService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Create directory if it doesn't exist
      const uploadDir = process.env.ML_UPLOAD_PATH || path.join(__dirname, '../../../ml-uploads');
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
 * @route   GET /api/training-environments
 * @desc    Get all training environments
 * @access  Private
 */
router.get('/', authenticate(), async (req, res) => {
  try {
    const environments = await trainingEnvironmentService.getEnvironments();
    
    res.json({
      success: true,
      count: environments.length,
      data: environments
    });
  } catch (error) {
    logger.error('Error getting training environments', error);
    throw new ServerError('Failed to get training environments', 500);
  }
});

/**
 * @route   GET /api/training-environments/:id
 * @desc    Get training environment by ID
 * @access  Private
 */
router.get('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const environment = await trainingEnvironmentService.getEnvironment(id);
      
      res.json({
        success: true,
        data: environment
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Training environment ${id} not found`
      });
    }
  } catch (error) {
    logger.error(`Error getting training environment ${req.params.id}`, error);
    throw new ServerError('Failed to get training environment', 500);
  }
});

/**
 * @route   POST /api/training-environments
 * @desc    Create a new training environment
 * @access  Private (Admin)
 */
router.post('/', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { name, type, options } = req.body;
    
    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }
    
    // Validate environment type
    if (!Object.values(EnvironmentType).includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid environment type: ${type}`,
        validTypes: Object.values(EnvironmentType)
      });
    }
    
    const environment = await trainingEnvironmentService.createEnvironment(name, type, options);
    
    res.status(201).json({
      success: true,
      message: `Training environment ${name} created successfully`,
      data: environment
    });
  } catch (error) {
    logger.error('Error creating training environment', error);
    throw new ServerError('Failed to create training environment', 500);
  }
});

/**
 * @route   POST /api/training-environments/:id/start
 * @desc    Start a training environment
 * @access  Private (Admin)
 */
router.post('/:id/start', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    const { trainingOptions } = req.body;
    
    try {
      const environment = await trainingEnvironmentService.startEnvironment(id, trainingOptions);
      
      res.json({
        success: true,
        message: `Training environment ${id} started successfully`,
        data: environment
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
    logger.error(`Error starting training environment ${req.params.id}`, error);
    throw new ServerError('Failed to start training environment', 500);
  }
});

/**
 * @route   POST /api/training-environments/:id/stop
 * @desc    Stop a training environment
 * @access  Private (Admin)
 */
router.post('/:id/stop', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const environment = await trainingEnvironmentService.stopEnvironment(id);
      
      res.json({
        success: true,
        message: `Training environment ${id} stopped successfully`,
        data: environment
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
    logger.error(`Error stopping training environment ${req.params.id}`, error);
    throw new ServerError('Failed to stop training environment', 500);
  }
});

/**
 * @route   DELETE /api/training-environments/:id
 * @desc    Delete a training environment
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      await trainingEnvironmentService.deleteEnvironment(id);
      
      res.json({
        success: true,
        message: `Training environment ${id} deleted successfully`
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
    logger.error(`Error deleting training environment ${req.params.id}`, error);
    throw new ServerError('Failed to delete training environment', 500);
  }
});

/**
 * @route   GET /api/training-environments/:id/logs
 * @desc    Get logs for a training environment
 * @access  Private
 */
router.get('/:id/logs', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { tail = 100, follow = false } = req.query;
    
    try {
      if (follow === 'true') {
        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');
        
        // Get logs as stream
        const logProcess = await trainingEnvironmentService.getEnvironmentLogs(id, { 
          tail: parseInt(tail), 
          follow: true 
        });
        
        // Pipe process output to response
        logProcess.stdout.pipe(res);
        logProcess.stderr.pipe(res);
        
        // Handle client disconnect
        req.on('close', () => {
          logProcess.kill();
        });
      } else {
        // Get logs as string
        const logs = await trainingEnvironmentService.getEnvironmentLogs(id, { 
          tail: parseInt(tail), 
          follow: false 
        });
        
        res.setHeader('Content-Type', 'text/plain');
        res.send(logs);
      }
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
    logger.error(`Error getting logs for training environment ${req.params.id}`, error);
    throw new ServerError('Failed to get logs', 500);
  }
});

/**
 * @route   POST /api/training-environments/:id/code
 * @desc    Upload training code for an environment
 * @access  Private (Admin)
 */
router.post('/:id/code', authenticate({ requiredRole: 'admin' }), upload.array('files'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if environment exists
    try {
      await trainingEnvironmentService.getEnvironment(id);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Training environment ${id} not found`
      });
    }
    
    // Validate files
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    // Process uploaded files
    const codeFiles = {};
    for (const file of req.files) {
      // Read file content
      const content = await fs.readFile(file.path, 'utf8');
      
      // Add to code files
      codeFiles[file.originalname] = content;
      
      // Delete temporary file
      await fs.unlink(file.path);
    }
    
    // Update training code
    const environment = await trainingEnvironmentService.updateTrainingCode(id, codeFiles);
    
    res.json({
      success: true,
      message: `Training code updated for environment ${id}`,
      data: {
        environmentId: id,
        files: Object.keys(codeFiles)
      }
    });
  } catch (error) {
    logger.error(`Error updating training code for environment ${req.params.id}`, error);
    
    // Clean up uploaded files
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          logger.error(`Error deleting uploaded file ${file.path}`, unlinkError);
        }
      }
    }
    
    throw new ServerError('Failed to update training code', 500);
  }
});

/**
 * @route   POST /api/training-environments/:id/requirements
 * @desc    Update requirements.txt for an environment
 * @access  Private (Admin)
 */
router.post('/:id/requirements', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    const { requirements } = req.body;
    
    // Validate requirements
    if (!requirements) {
      return res.status(400).json({
        success: false,
        message: 'Requirements content is required'
      });
    }
    
    try {
      const environment = await trainingEnvironmentService.updateRequirements(id, requirements);
      
      res.json({
        success: true,
        message: `Requirements.txt updated for environment ${id}`,
        data: environment
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
    logger.error(`Error updating requirements.txt for environment ${req.params.id}`, error);
    throw new ServerError('Failed to update requirements.txt', 500);
  }
});

/**
 * @route   GET /api/training-environments/types
 * @desc    Get available environment types
 * @access  Private
 */
router.get('/types', authenticate(), (req, res) => {
  res.json({
    success: true,
    data: Object.values(EnvironmentType)
  });
});

/**
 * @route   GET /api/training-environments/status
 * @desc    Get possible environment statuses
 * @access  Private
 */
router.get('/status', authenticate(), (req, res) => {
  res.json({
    success: true,
    data: Object.values(EnvironmentStatus)
  });
});

module.exports = router; 