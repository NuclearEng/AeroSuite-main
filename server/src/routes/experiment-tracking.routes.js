/**
 * experiment-tracking.routes.js
 * 
 * API routes for experiment tracking
 * Implements RF054 - Implement experiment tracking
 */
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { ExperimentTrackingService, ExperimentStatus, RunStatus } = require('../ai/services/ExperimentTrackingService');
const { ServerError } = require('../utils/errorHandler');
const logger = require('../ai/utils/logger');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Initialize experiment tracking service
const experimentTrackingService = new ExperimentTrackingService();

// Configure multer for artifact uploads
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      // Create directory if it doesn't exist
      const uploadDir = process.env.ML_ARTIFACTS_UPLOAD_PATH || path.join(__dirname, '../../../ml-artifact-uploads');
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
 * @route   GET /api/experiments
 * @desc    Get all experiments
 * @access  Private
 */
router.get('/', authenticate(), async (req, res) => {
  try {
    const { status, name, tags } = req.query;
    
    // Prepare filters
    const filters = {};
    if (status) filters.status = status;
    if (name) filters.name = name;
    if (tags) filters.tags = tags.split(',');
    
    const experiments = await experimentTrackingService.getExperiments(filters);
    
    res.json({
      success: true,
      count: experiments.length,
      data: experiments
    });
  } catch (error) {
    logger.error('Error getting experiments', error);
    throw new ServerError('Failed to get experiments', 500);
  }
});

/**
 * @route   GET /api/experiments/:id
 * @desc    Get experiment by ID
 * @access  Private
 */
router.get('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      const experiment = await experimentTrackingService.getExperiment(id);
      
      res.json({
        success: true,
        data: experiment
      });
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: `Experiment ${id} not found`
      });
    }
  } catch (error) {
    logger.error(`Error getting experiment ${req.params.id}`, error);
    throw new ServerError('Failed to get experiment', 500);
  }
});

/**
 * @route   POST /api/experiments
 * @desc    Create a new experiment
 * @access  Private
 */
router.post('/', authenticate(), async (req, res) => {
  try {
    const { name, description, tags, metadata } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Experiment name is required'
      });
    }
    
    const experiment = await experimentTrackingService.createExperiment(name, {
      description,
      tags,
      ...metadata
    });
    
    res.status(201).json({
      success: true,
      message: `Experiment ${name} created successfully`,
      data: experiment
    });
  } catch (error) {
    logger.error('Error creating experiment', error);
    throw new ServerError('Failed to create experiment', 500);
  }
});

/**
 * @route   PUT /api/experiments/:id
 * @desc    Update an experiment
 * @access  Private
 */
router.put('/:id', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, tags, metadata } = req.body;
    
    try {
      const experiment = await experimentTrackingService.updateExperiment(id, {
        name,
        description,
        status,
        tags,
        metadata
      });
      
      res.json({
        success: true,
        message: `Experiment ${id} updated successfully`,
        data: experiment
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
    logger.error(`Error updating experiment ${req.params.id}`, error);
    throw new ServerError('Failed to update experiment', 500);
  }
});

/**
 * @route   DELETE /api/experiments/:id
 * @desc    Delete an experiment
 * @access  Private (Admin)
 */
router.delete('/:id', authenticate({ requiredRole: 'admin' }), async (req, res) => {
  try {
    const { id } = req.params;
    
    try {
      await experimentTrackingService.deleteExperiment(id);
      
      res.json({
        success: true,
        message: `Experiment ${id} deleted successfully`
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
    logger.error(`Error deleting experiment ${req.params.id}`, error);
    throw new ServerError('Failed to delete experiment', 500);
  }
});

/**
 * @route   GET /api/experiments/:id/runs
 * @desc    Get all runs for an experiment
 * @access  Private
 */
router.get('/:id/runs', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tags } = req.query;
    
    // Prepare filters
    const filters = {};
    if (status) filters.status = status;
    if (tags) filters.tags = tags.split(',');
    
    try {
      const runs = await experimentTrackingService.getRuns(id, filters);
      
      res.json({
        success: true,
        count: runs.length,
        data: runs
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
    logger.error(`Error getting runs for experiment ${req.params.id}`, error);
    throw new ServerError('Failed to get experiment runs', 500);
  }
});

/**
 * @route   POST /api/experiments/:id/runs
 * @desc    Create a new run for an experiment
 * @access  Private
 */
router.post('/:id/runs', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, parameters, tags, environmentId, notes, metadata } = req.body;
    
    try {
      const run = await experimentTrackingService.createRun(id, {
        name,
        parameters,
        tags,
        environmentId,
        notes,
        metadata,
        userId: req.user.id
      });
      
      res.status(201).json({
        success: true,
        message: `Run created successfully for experiment ${id}`,
        data: run
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
    logger.error(`Error creating run for experiment ${req.params.id}`, error);
    throw new ServerError('Failed to create experiment run', 500);
  }
});

/**
 * @route   GET /api/experiments/runs/:runId
 * @desc    Get a run by ID
 * @access  Private
 */
router.get('/runs/:runId', authenticate(), async (req, res) => {
  try {
    const { runId } = req.params;
    
    try {
      const run = await experimentTrackingService.getRun(runId);
      
      res.json({
        success: true,
        data: run
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
    logger.error(`Error getting run ${req.params.runId}`, error);
    throw new ServerError('Failed to get run', 500);
  }
});

/**
 * @route   POST /api/experiments/runs/:runId/start
 * @desc    Start a run
 * @access  Private
 */
router.post('/runs/:runId/start', authenticate(), async (req, res) => {
  try {
    const { runId } = req.params;
    
    try {
      const run = await experimentTrackingService.startRun(runId);
      
      res.json({
        success: true,
        message: `Run ${runId} started successfully`,
        data: run
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
    logger.error(`Error starting run ${req.params.runId}`, error);
    throw new ServerError('Failed to start run', 500);
  }
});

/**
 * @route   POST /api/experiments/runs/:runId/complete
 * @desc    Complete a run
 * @access  Private
 */
router.post('/runs/:runId/complete', authenticate(), async (req, res) => {
  try {
    const { runId } = req.params;
    const { metrics, artifacts, notes, metadata } = req.body;
    
    try {
      const run = await experimentTrackingService.completeRun(runId, {
        metrics,
        artifacts,
        notes,
        metadata
      });
      
      res.json({
        success: true,
        message: `Run ${runId} completed successfully`,
        data: run
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
    logger.error(`Error completing run ${req.params.runId}`, error);
    throw new ServerError('Failed to complete run', 500);
  }
});

/**
 * @route   POST /api/experiments/runs/:runId/fail
 * @desc    Mark a run as failed
 * @access  Private
 */
router.post('/runs/:runId/fail', authenticate(), async (req, res) => {
  try {
    const { runId } = req.params;
    const { error } = req.body;
    
    if (!error) {
      return res.status(400).json({
        success: false,
        message: 'Error message is required'
      });
    }
    
    try {
      const run = await experimentTrackingService.failRun(runId, error);
      
      res.json({
        success: true,
        message: `Run ${runId} marked as failed`,
        data: run
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
    logger.error(`Error marking run ${req.params.runId} as failed`, error);
    throw new ServerError('Failed to mark run as failed', 500);
  }
});

/**
 * @route   POST /api/experiments/runs/:runId/metrics
 * @desc    Log metrics for a run
 * @access  Private
 */
router.post('/runs/:runId/metrics', authenticate(), async (req, res) => {
  try {
    const { runId } = req.params;
    const { metrics } = req.body;
    
    if (!metrics || Object.keys(metrics).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Metrics are required'
      });
    }
    
    try {
      const run = await experimentTrackingService.logMetrics(runId, metrics);
      
      res.json({
        success: true,
        message: `Metrics logged for run ${runId}`,
        data: run
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
    logger.error(`Error logging metrics for run ${req.params.runId}`, error);
    throw new ServerError('Failed to log metrics', 500);
  }
});

/**
 * @route   POST /api/experiments/runs/:runId/artifacts
 * @desc    Log artifact for a run
 * @access  Private
 */
router.post('/runs/:runId/artifacts', authenticate(), upload.single('artifact'), async (req, res) => {
  try {
    const { runId } = req.params;
    const { name, metadata } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Artifact file is required'
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Artifact name is required'
      });
    }
    
    try {
      // Parse metadata if provided as JSON string
      let parsedMetadata = {};
      if (metadata) {
        try {
          parsedMetadata = JSON.parse(metadata);
        } catch (parseError) {
          logger.warn(`Failed to parse artifact metadata: ${parseError.message}`);
        }
      }
      
      // Log artifact
      const artifact = await experimentTrackingService.logArtifact(runId, name, req.file.path, parsedMetadata);
      
      // Delete temporary upload file
      await fs.unlink(req.file.path);
      
      res.json({
        success: true,
        message: `Artifact ${name} logged for run ${runId}`,
        data: artifact
      });
    } catch (error) {
      // Clean up uploaded file
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          logger.error(`Error deleting uploaded file ${req.file.path}`, unlinkError);
        }
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
    logger.error(`Error logging artifact for run ${req.params.runId}`, error);
    
    // Clean up uploaded file
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.error(`Error deleting uploaded file ${req.file.path}`, unlinkError);
      }
    }
    
    throw new ServerError('Failed to log artifact', 500);
  }
});

/**
 * @route   POST /api/experiments/compare
 * @desc    Compare multiple runs
 * @access  Private
 */
router.post('/compare', authenticate(), async (req, res) => {
  try {
    const { runIds } = req.body;
    
    if (!runIds || !Array.isArray(runIds) || runIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least two run IDs are required for comparison'
      });
    }
    
    try {
      const comparison = await experimentTrackingService.compareRuns(runIds);
      
      res.json({
        success: true,
        data: comparison
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
    logger.error('Error comparing runs', error);
    throw new ServerError('Failed to compare runs', 500);
  }
});

/**
 * @route   GET /api/experiments/:id/best
 * @desc    Get best run for an experiment based on a metric
 * @access  Private
 */
router.get('/:id/best', authenticate(), async (req, res) => {
  try {
    const { id } = req.params;
    const { metric, higher = 'true' } = req.query;
    
    if (!metric) {
      return res.status(400).json({
        success: false,
        message: 'Metric name is required'
      });
    }
    
    const isHigherBetter = higher === 'true';
    
    try {
      const bestRun = await experimentTrackingService.getBestRun(id, metric, isHigherBetter);
      
      res.json({
        success: true,
        data: bestRun
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
    logger.error(`Error getting best run for experiment ${req.params.id}`, error);
    throw new ServerError('Failed to get best run', 500);
  }
});

/**
 * @route   POST /api/experiments/:id/environment/:environmentId
 * @desc    Link a training environment to an experiment
 * @access  Private
 */
router.post('/:id/environment/:environmentId', authenticate(), async (req, res) => {
  try {
    const { id, environmentId } = req.params;
    
    try {
      const experiment = await experimentTrackingService.linkEnvironment(id, environmentId);
      
      res.json({
        success: true,
        message: `Environment ${environmentId} linked to experiment ${id}`,
        data: experiment
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
    logger.error(`Error linking environment to experiment ${req.params.id}`, error);
    throw new ServerError('Failed to link environment', 500);
  }
});

/**
 * @route   GET /api/experiments/status
 * @desc    Get experiment status enum
 * @access  Private
 */
router.get('/status', authenticate(), (req, res) => {
  res.json({
    success: true,
    data: Object.values(ExperimentStatus)
  });
});

/**
 * @route   GET /api/experiments/run-status
 * @desc    Get run status enum
 * @access  Private
 */
router.get('/run-status', authenticate(), (req, res) => {
  res.json({
    success: true,
    data: Object.values(RunStatus)
  });
});

module.exports = router; 