/**
 * ModelCICDService.js
 * 
 * Service for CI/CD pipeline for ML models
 * Implements RF056 - Create CI/CD pipeline for models
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const { ModelRegistry, ModelStatus, ModelStage } = require('./ModelRegistry');
const { ModelEvaluationService } = require('./ModelEvaluationService');
const { ExperimentTrackingService } = require('./ExperimentTrackingService');

/**
 * Pipeline stage enum
 * @enum {string}
 */
const PipelineStage = {
  VALIDATION: 'validation',
  TESTING: 'testing',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

/**
 * Pipeline status enum
 * @enum {string}
 */
const PipelineStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Model CI/CD Service
 * Provides continuous integration and deployment for machine learning models
 */
class ModelCICDService {
  /**
   * Create a new model CI/CD service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      pipelinePath: process.env.ML_PIPELINE_PATH || path.join(__dirname, '../../../..', 'ml-pipelines'),
      artifactsPath: process.env.ML_ARTIFACTS_PATH || path.join(__dirname, '../../../..', 'ml-artifacts'),
      configPath: process.env.ML_CONFIG_PATH || path.join(__dirname, '../../../..', 'ml-config'),
      ...options
    };
    
    this.eventEmitter = new EventEmitter();
    this.pipelines = new Map();
    this.activePipelines = new Map();
    
    // Connect to other services
    this.modelRegistry = options.modelRegistry || new ModelRegistry();
    this.modelEvaluationService = options.modelEvaluationService || new ModelEvaluationService();
    this.experimentTrackingService = options.experimentTrackingService || new ExperimentTrackingService();
    
    // Initialize service
    this._initialize();
  }
  
  /**
   * Initialize the model CI/CD service
   * @private
   */
  async _initialize() {
    try {
      // Ensure directories exist
      await this._ensureDirectories();
      
      // Load existing pipelines
      await this._loadPipelines();
      
      logger.info('Model CI/CD Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Model CI/CD Service', error);
    }
  }
  
  /**
   * Ensure required directories exist
   * @private
   */
  async _ensureDirectories() {
    try {
      await fs.mkdir(this.options.pipelinePath, { recursive: true });
      await fs.mkdir(this.options.artifactsPath, { recursive: true });
      await fs.mkdir(this.options.configPath, { recursive: true });
      
      logger.debug('Required directories created');
    } catch (error) {
      logger.error('Failed to create required directories', error);
      throw error;
    }
  }
  
  /**
   * Load existing pipelines from disk
   * @private
   */
  async _loadPipelines() {
    try {
      const pipelinesFile = path.join(this.options.pipelinePath, 'pipelines.json');
      
      try {
        await fs.access(pipelinesFile);
        
        // Read pipelines file
        const data = await fs.readFile(pipelinesFile, 'utf8');
        const pipelines = JSON.parse(data);
        
        // Load pipelines into memory
        for (const pipeline of pipelines) {
          this.pipelines.set(pipeline.id, pipeline);
        }
        
        logger.info(`Loaded ${this.pipelines.size} pipelines`);
      } catch (error) {
        // File doesn't exist, create it
        await this._savePipelines();
        logger.info('Created new pipelines file');
      }
    } catch (error) {
      logger.error('Failed to load pipelines', error);
      throw error;
    }
  }
  
  /**
   * Save pipelines to disk
   * @private
   */
  async _savePipelines() {
    try {
      const pipelinesFile = path.join(this.options.pipelinePath, 'pipelines.json');
      
      // Convert pipelines map to array
      const pipelines = Array.from(this.pipelines.values());
      
      // Write to file
      await fs.writeFile(
        pipelinesFile,
        JSON.stringify(pipelines, null, 2)
      );
      
      logger.debug('Pipelines saved successfully');
    } catch (error) {
      logger.error('Failed to save pipelines', error);
      throw error;
    }
  }
  
  /**
   * Create a new pipeline
   * @param {string} name - Pipeline name
   * @param {string} modelName - Model name
   * @param {string} modelVersion - Model version
   * @param {Object} config - Pipeline configuration
   * @returns {Promise<Object>} Created pipeline
   */
  async createPipeline(name, modelName, modelVersion, config = {}) {
    try {
      logger.info(`Creating pipeline: ${name} for model ${modelName}@${modelVersion}`);
      
      // Generate unique ID
      const id = `pipeline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create pipeline configuration
      const pipeline = {
        id,
        name,
        modelName,
        modelVersion,
        modelId: `${modelName}@${modelVersion}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        status: PipelineStatus.PENDING,
        stages: config.stages || Object.values(PipelineStage),
        currentStage: null,
        stageResults: {},
        thresholds: config.thresholds || {},
        evaluationDatasets: config.evaluationDatasets || {},
        promotionPolicy: config.promotionPolicy || 'manual',
        notificationChannels: config.notificationChannels || [],
        tags: config.tags || [],
        userId: config.userId || null,
        gitCommit: config.gitCommit || null,
        gitBranch: config.gitBranch || null,
        experimentId: config.experimentId || null
      };
      
      // Store pipeline in memory
      this.pipelines.set(id, pipeline);
      
      // Save pipelines to disk
      await this._savePipelines();
      
      logger.info(`Pipeline ${id} created successfully`);
      
      // Emit event
      this.eventEmitter.emit('pipeline-created', {
        pipelineId: id,
        timestamp: new Date()
      });
      
      return pipeline;
    } catch (error) {
      logger.error(`Failed to create pipeline: ${name}`, error);
      throw error;
    }
  }
  
  /**
   * Get a pipeline by ID
   * @param {string} pipelineId - Pipeline ID
   * @returns {Promise<Object>} Pipeline
   */
  async getPipeline(pipelineId) {
    try {
      // Check if pipeline exists
      if (!this.pipelines.has(pipelineId)) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }
      
      return this.pipelines.get(pipelineId);
    } catch (error) {
      logger.error(`Failed to get pipeline ${pipelineId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all pipelines
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array<Object>>} List of pipelines
   */
  async getPipelines(filters = {}) {
    try {
      let pipelines = Array.from(this.pipelines.values());
      
      // Apply filters if provided
      if (filters.status) {
        pipelines = pipelines.filter(pipeline => pipeline.status === filters.status);
      }
      
      if (filters.modelName) {
        pipelines = pipelines.filter(pipeline => pipeline.modelName === filters.modelName);
      }
      
      if (filters.modelVersion) {
        pipelines = pipelines.filter(pipeline => pipeline.modelVersion === filters.modelVersion);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        pipelines = pipelines.filter(pipeline => 
          filters.tags.some(tag => pipeline.tags.includes(tag))
        );
      }
      
      // Sort by creation date (newest first)
      pipelines.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return pipelines;
    } catch (error) {
      logger.error('Failed to get pipelines', error);
      throw error;
    }
  }
  
  /**
   * Start a pipeline
   * @param {string} pipelineId - Pipeline ID
   * @returns {Promise<Object>} Updated pipeline
   */
  async startPipeline(pipelineId) {
    try {
      logger.info(`Starting pipeline: ${pipelineId}`);
      
      // Check if pipeline exists
      if (!this.pipelines.has(pipelineId)) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }
      
      const pipeline = this.pipelines.get(pipelineId);
      
      // Update pipeline status
      const updatedPipeline = {
        ...pipeline,
        status: PipelineStatus.RUNNING,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentStage: pipeline.stages[0]
      };
      
      // Store updated pipeline
      this.pipelines.set(pipelineId, updatedPipeline);
      
      // Save pipelines to disk
      await this._savePipelines();
      
      // Start pipeline process
      this._runPipeline(pipelineId).catch(error => {
        logger.error(`Error during pipeline ${pipelineId}`, error);
      });
      
      logger.info(`Pipeline ${pipelineId} started successfully`);
      
      // Emit event
      this.eventEmitter.emit('pipeline-started', {
        pipelineId,
        timestamp: new Date()
      });
      
      return updatedPipeline;
    } catch (error) {
      logger.error(`Failed to start pipeline ${pipelineId}`, error);
      throw error;
    }
  }
  
  /**
   * Run the pipeline process
   * @param {string} pipelineId - Pipeline ID
   * @private
   */
  async _runPipeline(pipelineId) {
    try {
      const pipeline = this.pipelines.get(pipelineId);
      
      // Track active pipeline
      this.activePipelines.set(pipelineId, true);
      
      // Create experiment run if experimentId is provided
      let experimentRun = null;
      if (pipeline.experimentId) {
        experimentRun = await this.experimentTrackingService.createRun(pipeline.experimentId, {
          name: `Pipeline: ${pipeline.name}`,
          tags: [...pipeline.tags, 'pipeline'],
          metadata: {
            pipelineId,
            modelId: pipeline.modelId,
            stages: pipeline.stages
          }
        });
        
        await this.experimentTrackingService.startRun(experimentRun.id);
      }
      
      // Process each stage in sequence
      const stageResults = {};
      let success = true;
      
      for (const stage of pipeline.stages) {
        // Update current stage
        pipeline.currentStage = stage;
        pipeline.updatedAt = new Date().toISOString();
        this.pipelines.set(pipelineId, pipeline);
        await this._savePipelines();
        
        // Emit stage started event
        this.eventEmitter.emit('pipeline-stage-started', {
          pipelineId,
          stage,
          timestamp: new Date()
        });
        
        // Process the stage
        try {
          const stageResult = await this._processStage(pipeline, stage);
          stageResults[stage] = stageResult;
          
          // Log metrics to experiment
          if (experimentRun) {
            await this.experimentTrackingService.logMetrics(experimentRun.id, {
              [`${stage}_success`]: stageResult.success ? 1 : 0,
              ...stageResult.metrics
            });
          }
          
          // Emit stage completed event
          this.eventEmitter.emit('pipeline-stage-completed', {
            pipelineId,
            stage,
            result: stageResult,
            timestamp: new Date()
          });
          
          // Check if stage passed
          if (!stageResult.success) {
            logger.warn(`Pipeline ${pipelineId} stage ${stage} failed`);
            success = false;
            break;
          }
        } catch (error) {
          logger.error(`Error processing stage ${stage} for pipeline ${pipelineId}`, error);
          stageResults[stage] = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          };
          
          // Log error to experiment
          if (experimentRun) {
            await this.experimentTrackingService.logMetrics(experimentRun.id, {
              [`${stage}_success`]: 0,
              [`${stage}_error`]: 1
            });
          }
          
          // Emit stage failed event
          this.eventEmitter.emit('pipeline-stage-failed', {
            pipelineId,
            stage,
            error: error.message,
            timestamp: new Date()
          });
          
          success = false;
          break;
        }
      }
      
      // Update pipeline with results
      const completedPipeline = {
        ...pipeline,
        status: success ? PipelineStatus.COMPLETED : PipelineStatus.FAILED,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        stageResults
      };
      
      // Store updated pipeline
      this.pipelines.set(pipelineId, completedPipeline);
      
      // Save pipelines to disk
      await this._savePipelines();
      
      // Update experiment run if it exists
      if (experimentRun) {
        if (success) {
          await this.experimentTrackingService.completeRun(experimentRun.id);
        } else {
          await this.experimentTrackingService.failRun(experimentRun.id, 'Pipeline failed');
        }
      }
      
      // Remove from active pipelines
      this.activePipelines.delete(pipelineId);
      
      logger.info(`Pipeline ${pipelineId} ${success ? 'completed successfully' : 'failed'}`);
      
      // Emit event
      if (success) {
        this.eventEmitter.emit('pipeline-completed', {
          pipelineId,
          stageResults,
          timestamp: new Date()
        });
      } else {
        this.eventEmitter.emit('pipeline-failed', {
          pipelineId,
          stageResults,
          timestamp: new Date()
        });
      }
    } catch (error) {
      // Handle pipeline failure
      const pipeline = this.pipelines.get(pipelineId);
      
      const failedPipeline = {
        ...pipeline,
        status: PipelineStatus.FAILED,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        error: error.message
      };
      
      // Store updated pipeline
      this.pipelines.set(pipelineId, failedPipeline);
      
      // Save pipelines to disk
      await this._savePipelines();
      
      // Update experiment run if it exists
      if (pipeline.experimentId) {
        try {
          await this.experimentTrackingService.failRun(pipeline.experimentId, error.message);
        } catch (expError) {
          logger.error(`Failed to update experiment run: ${expError.message}`);
        }
      }
      
      // Remove from active pipelines
      this.activePipelines.delete(pipelineId);
      
      logger.error(`Pipeline ${pipelineId} failed: ${error.message}`);
      
      // Emit event
      this.eventEmitter.emit('pipeline-failed', {
        pipelineId,
        error: error.message,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Process a pipeline stage
   * @param {Object} pipeline - Pipeline object
   * @param {string} stage - Stage name
   * @returns {Promise<Object>} Stage result
   * @private
   */
  async _processStage(pipeline, stage) {
    logger.info(`Processing stage ${stage} for pipeline ${pipeline.id}`);
    
    switch (stage) {
      case PipelineStage.VALIDATION:
        return await this._processValidationStage(pipeline);
      
      case PipelineStage.TESTING:
        return await this._processTestingStage(pipeline);
      
      case PipelineStage.STAGING:
        return await this._processStagingStage(pipeline);
      
      case PipelineStage.PRODUCTION:
        return await this._processProductionStage(pipeline);
      
      default:
        throw new Error(`Unknown pipeline stage: ${stage}`);
    }
  }
  
  /**
   * Process validation stage
   * @param {Object} pipeline - Pipeline object
   * @returns {Promise<Object>} Stage result
   * @private
   */
  async _processValidationStage(pipeline) {
    try {
      logger.info(`Validating model ${pipeline.modelId}`);
      
      // Get model from registry
      const model = await this._getModelFromRegistry(pipeline.modelName, pipeline.modelVersion);
      
      // Check if model exists
      if (!model) {
        throw new Error(`Model ${pipeline.modelId} not found in registry`);
      }
      
      // Check if validation dataset is configured
      const validationDatasetId = pipeline.evaluationDatasets.validation;
      if (!validationDatasetId) {
        throw new Error('Validation dataset not configured');
      }
      
      // Create evaluation
      const evaluationName = `Validation of ${pipeline.modelId}`;
      const evaluation = await this.modelEvaluationService.createEvaluation(
        evaluationName,
        pipeline.modelId,
        validationDatasetId,
        {
          tags: ['validation', 'pipeline', pipeline.id],
          experimentId: pipeline.experimentId
        }
      );
      
      // Start evaluation
      await this.modelEvaluationService.startEvaluation(evaluation.id);
      
      // Wait for evaluation to complete
      const evaluationResult = await this._waitForEvaluation(evaluation.id);
      
      // Check if evaluation was successful
      if (evaluationResult.status !== 'completed') {
        throw new Error(`Evaluation failed: ${evaluationResult.error || 'Unknown error'}`);
      }
      
      // Check if metrics meet thresholds
      const metricsPass = this._checkMetricsThresholds(
        evaluationResult.metrics,
        pipeline.thresholds.validation || {}
      );
      
      if (!metricsPass.pass) {
        return {
          success: false,
          evaluationId: evaluation.id,
          metrics: evaluationResult.metrics,
          failedMetrics: metricsPass.failedMetrics,
          timestamp: new Date().toISOString()
        };
      }
      
      // Update model stage in registry
      await this.modelRegistry.updateModelVersionStage(
        pipeline.modelName,
        pipeline.modelVersion,
        ModelStage.VALIDATION
      );
      
      return {
        success: true,
        evaluationId: evaluation.id,
        metrics: evaluationResult.metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Validation stage failed for pipeline ${pipeline.id}`, error);
      throw error;
    }
  }
  
  /**
   * Process testing stage
   * @param {Object} pipeline - Pipeline object
   * @returns {Promise<Object>} Stage result
   * @private
   */
  async _processTestingStage(pipeline) {
    try {
      logger.info(`Testing model ${pipeline.modelId}`);
      
      // Check if testing dataset is configured
      const testingDatasetId = pipeline.evaluationDatasets.testing;
      if (!testingDatasetId) {
        throw new Error('Testing dataset not configured');
      }
      
      // Create evaluation
      const evaluationName = `Testing of ${pipeline.modelId}`;
      const evaluation = await this.modelEvaluationService.createEvaluation(
        evaluationName,
        pipeline.modelId,
        testingDatasetId,
        {
          tags: ['testing', 'pipeline', pipeline.id],
          experimentId: pipeline.experimentId
        }
      );
      
      // Start evaluation
      await this.modelEvaluationService.startEvaluation(evaluation.id);
      
      // Wait for evaluation to complete
      const evaluationResult = await this._waitForEvaluation(evaluation.id);
      
      // Check if evaluation was successful
      if (evaluationResult.status !== 'completed') {
        throw new Error(`Evaluation failed: ${evaluationResult.error || 'Unknown error'}`);
      }
      
      // Check if metrics meet thresholds
      const metricsPass = this._checkMetricsThresholds(
        evaluationResult.metrics,
        pipeline.thresholds.testing || {}
      );
      
      if (!metricsPass.pass) {
        return {
          success: false,
          evaluationId: evaluation.id,
          metrics: evaluationResult.metrics,
          failedMetrics: metricsPass.failedMetrics,
          timestamp: new Date().toISOString()
        };
      }
      
      // Update model stage in registry
      await this.modelRegistry.updateModelVersionStage(
        pipeline.modelName,
        pipeline.modelVersion,
        ModelStage.TESTING
      );
      
      return {
        success: true,
        evaluationId: evaluation.id,
        metrics: evaluationResult.metrics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Testing stage failed for pipeline ${pipeline.id}`, error);
      throw error;
    }
  }
  
  /**
   * Process staging stage
   * @param {Object} pipeline - Pipeline object
   * @returns {Promise<Object>} Stage result
   * @private
   */
  async _processStagingStage(pipeline) {
    try {
      logger.info(`Promoting model ${pipeline.modelId} to staging`);
      
      // Update model status in registry
      await this.modelRegistry.updateModelVersionStatus(
        pipeline.modelName,
        pipeline.modelVersion,
        ModelStatus.STAGING
      );
      
      // Update model stage in registry
      await this.modelRegistry.updateModelVersionStage(
        pipeline.modelName,
        pipeline.modelVersion,
        ModelStage.DEPLOYMENT
      );
      
      return {
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Staging stage failed for pipeline ${pipeline.id}`, error);
      throw error;
    }
  }
  
  /**
   * Process production stage
   * @param {Object} pipeline - Pipeline object
   * @returns {Promise<Object>} Stage result
   * @private
   */
  async _processProductionStage(pipeline) {
    try {
      logger.info(`Promoting model ${pipeline.modelId} to production`);
      
      // Update model status in registry
      await this.modelRegistry.updateModelVersionStatus(
        pipeline.modelName,
        pipeline.modelVersion,
        ModelStatus.PRODUCTION
      );
      
      // Update model stage in registry
      await this.modelRegistry.updateModelVersionStage(
        pipeline.modelName,
        pipeline.modelVersion,
        ModelStage.MONITORING
      );
      
      return {
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`Production stage failed for pipeline ${pipeline.id}`, error);
      throw error;
    }
  }
  
  /**
   * Get model from registry
   * @param {string} modelName - Model name
   * @param {string} modelVersion - Model version
   * @returns {Promise<Object>} Model
   * @private
   */
  async _getModelFromRegistry(modelName, modelVersion) {
    try {
      return await this.modelRegistry.getModelVersion(modelName, modelVersion);
    } catch (error) {
      logger.error(`Failed to get model ${modelName}@${modelVersion} from registry`, error);
      return null;
    }
  }
  
  /**
   * Wait for evaluation to complete
   * @param {string} evaluationId - Evaluation ID
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {number} intervalMs - Check interval in milliseconds
   * @returns {Promise<Object>} Evaluation result
   * @private
   */
  async _waitForEvaluation(evaluationId, timeoutMs = 60000, intervalMs = 1000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkEvaluation = async () => {
        try {
          const evaluation = await this.modelEvaluationService.getEvaluation(evaluationId);
          
          if (evaluation.status === 'completed') {
            resolve(evaluation);
            return;
          }
          
          if (evaluation.status === 'failed') {
            reject(new Error(`Evaluation ${evaluationId} failed: ${evaluation.error || 'Unknown error'}`));
            return;
          }
          
          // Check timeout
          if (Date.now() - startTime > timeoutMs) {
            reject(new Error(`Evaluation ${evaluationId} timed out after ${timeoutMs}ms`));
            return;
          }
          
          // Check again after interval
          setTimeout(checkEvaluation, intervalMs);
        } catch (error) {
          reject(error);
        }
      };
      
      // Start checking
      checkEvaluation();
    });
  }
  
  /**
   * Check if metrics meet thresholds
   * @param {Object} metrics - Metrics to check
   * @param {Object} thresholds - Threshold configuration
   * @returns {Object} Check result
   * @private
   */
  _checkMetricsThresholds(metrics, thresholds) {
    const failedMetrics = [];
    
    for (const [metricName, threshold] of Object.entries(thresholds)) {
      const metricValue = metrics[metricName];
      
      // Skip if metric doesn't exist
      if (metricValue === undefined) {
        continue;
      }
      
      const { operator, value } = threshold;
      let pass = false;
      
      switch (operator) {
        case '>':
          pass = metricValue > value;
          break;
        case '>=':
          pass = metricValue >= value;
          break;
        case '<':
          pass = metricValue < value;
          break;
        case '<=':
          pass = metricValue <= value;
          break;
        case '==':
          pass = metricValue === value;
          break;
        case '!=':
          pass = metricValue !== value;
          break;
        default:
          logger.warn(`Unknown threshold operator: ${operator}`);
          pass = true;
      }
      
      if (!pass) {
        failedMetrics.push({
          metric: metricName,
          value: metricValue,
          threshold
        });
      }
    }
    
    return {
      pass: failedMetrics.length === 0,
      failedMetrics
    };
  }
  
  /**
   * Delete a pipeline
   * @param {string} pipelineId - Pipeline ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deletePipeline(pipelineId) {
    try {
      logger.info(`Deleting pipeline: ${pipelineId}`);
      
      // Check if pipeline exists
      if (!this.pipelines.has(pipelineId)) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }
      
      // Check if pipeline is active
      if (this.activePipelines.has(pipelineId)) {
        throw new Error(`Cannot delete active pipeline ${pipelineId}`);
      }
      
      // Remove pipeline
      this.pipelines.delete(pipelineId);
      
      // Save pipelines to disk
      await this._savePipelines();
      
      logger.info(`Pipeline ${pipelineId} deleted successfully`);
      
      // Emit event
      this.eventEmitter.emit('pipeline-deleted', {
        pipelineId,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete pipeline ${pipelineId}`, error);
      throw error;
    }
  }
  
  /**
   * Register for pipeline events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  
  /**
   * Unregister from pipeline events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }
}

module.exports = {
  ModelCICDService,
  PipelineStage,
  PipelineStatus
}; 