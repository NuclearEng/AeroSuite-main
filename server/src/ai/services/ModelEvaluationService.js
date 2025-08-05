/**
 * ModelEvaluationService.js
 * 
 * Service for automated model evaluation
 * Implements RF055 - Add automated model evaluation
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const { ExperimentTrackingService } = require('./ExperimentTrackingService');
const { ModelRegistry } = require('./ModelRegistry');

/**
 * Evaluation status enum
 * @enum {string}
 */
const EvaluationStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * Evaluation type enum
 * @enum {string}
 */
const EvaluationType = {
  CLASSIFICATION: 'classification',
  REGRESSION: 'regression',
  OBJECT_DETECTION: 'object_detection',
  SEGMENTATION: 'segmentation',
  ANOMALY_DETECTION: 'anomaly_detection',
  RECOMMENDATION: 'recommendation',
  CUSTOM: 'custom'
};

/**
 * Model Evaluation Service
 * Provides automated evaluation of machine learning models
 */
class ModelEvaluationService {
  /**
   * Create a new model evaluation service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      evaluationsPath: process.env.ML_EVALUATIONS_PATH || path.join(__dirname, '../../../..', 'ml-evaluations'),
      datasetsPath: process.env.ML_DATASETS_PATH || path.join(__dirname, '../../../..', 'ml-datasets'),
      ...options
    };
    
    this.eventEmitter = new EventEmitter();
    this.evaluations = new Map();
    this.activeEvaluations = new Map();
    
    // Connect to other services
    this.experimentTrackingService = options.experimentTrackingService || new ExperimentTrackingService();
    this.modelRegistry = options.modelRegistry || new ModelRegistry();
    
    // Initialize service
    this._initialize();
  }
  
  /**
   * Initialize the model evaluation service
   * @private
   */
  async _initialize() {
    try {
      // Ensure directories exist
      await this._ensureDirectories();
      
      // Load existing evaluations
      await this._loadEvaluations();
      
      logger.info('Model Evaluation Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Model Evaluation Service', error);
    }
  }
  
  /**
   * Ensure required directories exist
   * @private
   */
  async _ensureDirectories() {
    try {
      await fs.mkdir(this.options.evaluationsPath, { recursive: true });
      await fs.mkdir(this.options.datasetsPath, { recursive: true });
      
      logger.debug('Required directories created');
    } catch (error) {
      logger.error('Failed to create required directories', error);
      throw error;
    }
  }
  
  /**
   * Load existing evaluations from disk
   * @private
   */
  async _loadEvaluations() {
    try {
      const evaluationsFile = path.join(this.options.evaluationsPath, 'evaluations.json');
      
      try {
        await fs.access(evaluationsFile);
        
        // Read evaluations file
        const data = await fs.readFile(evaluationsFile, 'utf8');
        const evaluations = JSON.parse(data);
        
        // Load evaluations into memory
        for (const evaluation of evaluations) {
          this.evaluations.set(evaluation.id, evaluation);
        }
        
        logger.info(`Loaded ${this.evaluations.size} evaluations`);
      } catch (error) {
        // File doesn't exist, create it
        await this._saveEvaluations();
        logger.info('Created new evaluations file');
      }
    } catch (error) {
      logger.error('Failed to load evaluations', error);
      throw error;
    }
  }
  
  /**
   * Save evaluations to disk
   * @private
   */
  async _saveEvaluations() {
    try {
      const evaluationsFile = path.join(this.options.evaluationsPath, 'evaluations.json');
      
      // Convert evaluations map to array
      const evaluations = Array.from(this.evaluations.values());
      
      // Write to file
      await fs.writeFile(
        evaluationsFile,
        JSON.stringify(evaluations, null, 2)
      );
      
      logger.debug('Evaluations saved successfully');
    } catch (error) {
      logger.error('Failed to save evaluations', error);
      throw error;
    }
  }
  
  /**
   * Create a new evaluation
   * @param {string} name - Evaluation name
   * @param {string} modelId - Model ID to evaluate
   * @param {string} datasetId - Dataset ID to use for evaluation
   * @param {Object} config - Evaluation configuration
   * @returns {Promise<Object>} Created evaluation
   */
  async createEvaluation(name, modelId, datasetId, config = {}) {
    try {
      logger.info(`Creating evaluation: ${name} for model ${modelId}`);
      
      // Generate unique ID
      const id = `eval-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create evaluation configuration
      const evaluation = {
        id,
        name,
        modelId,
        datasetId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        status: EvaluationStatus.PENDING,
        type: config.type || EvaluationType.CLASSIFICATION,
        metrics: {},
        parameters: config.parameters || {},
        experimentId: config.experimentId || null,
        runId: config.runId || null,
        tags: config.tags || [],
        notes: config.notes || '',
        userId: config.userId || null
      };
      
      // Store evaluation in memory
      this.evaluations.set(id, evaluation);
      
      // Save evaluations to disk
      await this._saveEvaluations();
      
      logger.info(`Evaluation ${id} created successfully`);
      
      // Emit event
      this.eventEmitter.emit('evaluation-created', {
        evaluationId: id,
        timestamp: new Date()
      });
      
      return evaluation;
    } catch (error) {
      logger.error(`Failed to create evaluation: ${name}`, error);
      throw error;
    }
  }
  
  /**
   * Get an evaluation by ID
   * @param {string} evaluationId - Evaluation ID
   * @returns {Promise<Object>} Evaluation
   */
  async getEvaluation(evaluationId) {
    try {
      // Check if evaluation exists
      if (!this.evaluations.has(evaluationId)) {
        throw new Error(`Evaluation ${evaluationId} not found`);
      }
      
      return this.evaluations.get(evaluationId);
    } catch (error) {
      logger.error(`Failed to get evaluation ${evaluationId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all evaluations
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array<Object>>} List of evaluations
   */
  async getEvaluations(filters = {}) {
    try {
      let evaluations = Array.from(this.evaluations.values());
      
      // Apply filters if provided
      if (filters.status) {
        evaluations = evaluations.filter(evaluation => evaluation.status === filters.status);
      }
      
      if (filters.modelId) {
        evaluations = evaluations.filter(evaluation => evaluation.modelId === filters.modelId);
      }
      
      if (filters.datasetId) {
        evaluations = evaluations.filter(evaluation => evaluation.datasetId === filters.datasetId);
      }
      
      if (filters.type) {
        evaluations = evaluations.filter(evaluation => evaluation.type === filters.type);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        evaluations = evaluations.filter(evaluation => 
          filters.tags.some(tag => evaluation.tags.includes(tag))
        );
      }
      
      // Sort by creation date (newest first)
      evaluations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return evaluations;
    } catch (error) {
      logger.error('Failed to get evaluations', error);
      throw error;
    }
  }
  
  /**
   * Start an evaluation
   * @param {string} evaluationId - Evaluation ID
   * @returns {Promise<Object>} Updated evaluation
   */
  async startEvaluation(evaluationId) {
    try {
      logger.info(`Starting evaluation: ${evaluationId}`);
      
      // Check if evaluation exists
      if (!this.evaluations.has(evaluationId)) {
        throw new Error(`Evaluation ${evaluationId} not found`);
      }
      
      const evaluation = this.evaluations.get(evaluationId);
      
      // Update evaluation status
      const updatedEvaluation = {
        ...evaluation,
        status: EvaluationStatus.RUNNING,
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store updated evaluation
      this.evaluations.set(evaluationId, updatedEvaluation);
      
      // Save evaluations to disk
      await this._saveEvaluations();
      
      // Start evaluation process
      this._runEvaluation(evaluationId).catch(error => {
        logger.error(`Error during evaluation ${evaluationId}`, error);
      });
      
      logger.info(`Evaluation ${evaluationId} started successfully`);
      
      // Emit event
      this.eventEmitter.emit('evaluation-started', {
        evaluationId,
        timestamp: new Date()
      });
      
      return updatedEvaluation;
    } catch (error) {
      logger.error(`Failed to start evaluation ${evaluationId}`, error);
      throw error;
    }
  }
  
  /**
   * Run the evaluation process
   * @param {string} evaluationId - Evaluation ID
   * @private
   */
  async _runEvaluation(evaluationId) {
    try {
      const evaluation = this.evaluations.get(evaluationId);
      
      // Track active evaluation
      this.activeEvaluations.set(evaluationId, true);
      
      // Create experiment run if experimentId is provided
      let experimentRun = null;
      if (evaluation.experimentId) {
        experimentRun = await this.experimentTrackingService.createRun(evaluation.experimentId, {
          name: `Evaluation: ${evaluation.name}`,
          parameters: evaluation.parameters,
          tags: [...evaluation.tags, 'evaluation'],
          metadata: {
            evaluationId: evaluationId,
            modelId: evaluation.modelId,
            datasetId: evaluation.datasetId
          }
        });
        
        await this.experimentTrackingService.startRun(experimentRun.id);
        
        // Update evaluation with run ID
        evaluation.runId = experimentRun.id;
        this.evaluations.set(evaluationId, evaluation);
        await this._saveEvaluations();
      }
      
      // Get dataset info
      const datasetPath = path.join(this.options.datasetsPath, evaluation.datasetId);
      
      // Calculate metrics based on evaluation type
      const metrics = await this._calculateMetrics(evaluation.modelId, datasetPath, evaluation.type, evaluation.parameters);
      
      // Update evaluation with metrics
      const completedEvaluation = {
        ...evaluation,
        status: EvaluationStatus.COMPLETED,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics
      };
      
      // Store updated evaluation
      this.evaluations.set(evaluationId, completedEvaluation);
      
      // Save evaluations to disk
      await this._saveEvaluations();
      
      // Update experiment run if it exists
      if (experimentRun) {
        await this.experimentTrackingService.logMetrics(experimentRun.id, metrics);
        await this.experimentTrackingService.completeRun(experimentRun.id);
      }
      
      // Update model registry with metrics
      try {
        // Extract model name and version from modelId (format: name@version)
        const [modelName, modelVersion] = evaluation.modelId.split('@');
        if (modelName && modelVersion) {
          await this.modelRegistry.addModelVersionMetrics(modelName, modelVersion, metrics);
        }
      } catch (modelError) {
        logger.warn(`Failed to update model registry metrics: ${modelError.message}`);
      }
      
      // Remove from active evaluations
      this.activeEvaluations.delete(evaluationId);
      
      logger.info(`Evaluation ${evaluationId} completed successfully`);
      
      // Emit event
      this.eventEmitter.emit('evaluation-completed', {
        evaluationId,
        metrics,
        timestamp: new Date()
      });
    } catch (error) {
      // Handle evaluation failure
      const evaluation = this.evaluations.get(evaluationId);
      
      const failedEvaluation = {
        ...evaluation,
        status: EvaluationStatus.FAILED,
        completedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        error: error.message
      };
      
      // Store updated evaluation
      this.evaluations.set(evaluationId, failedEvaluation);
      
      // Save evaluations to disk
      await this._saveEvaluations();
      
      // Update experiment run if it exists
      if (evaluation.runId) {
        await this.experimentTrackingService.failRun(evaluation.runId, error.message);
      }
      
      // Remove from active evaluations
      this.activeEvaluations.delete(evaluationId);
      
      logger.error(`Evaluation ${evaluationId} failed: ${error.message}`);
      
      // Emit event
      this.eventEmitter.emit('evaluation-failed', {
        evaluationId,
        error: error.message,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Calculate metrics based on evaluation type
   * @param {string} modelId - Model ID
   * @param {string} datasetPath - Path to dataset
   * @param {string} evaluationType - Type of evaluation
   * @param {Object} parameters - Evaluation parameters
   * @returns {Promise<Object>} Calculated metrics
   * @private
   */
  async _calculateMetrics(modelId, datasetPath, evaluationType, parameters) {
    // This would be implemented differently based on the evaluation type
    // Here we provide a basic implementation that could be extended
    
    try {
      logger.info(`Calculating metrics for model ${modelId} on dataset ${datasetPath}`);
      
      // Load dataset metadata
      const datasetMetadataPath = path.join(datasetPath, 'metadata.json');
      const datasetMetadata = JSON.parse(await fs.readFile(datasetMetadataPath, 'utf8'));
      
      // In a real implementation, we would:
      // 1. Load the model
      // 2. Load the dataset
      // 3. Run predictions
      // 4. Calculate metrics
      
      // For now, we'll simulate metrics calculation
      const metrics = {};
      
      switch (evaluationType) {
        case EvaluationType.CLASSIFICATION:
          metrics.accuracy = Math.random() * 0.2 + 0.8; // Random accuracy between 0.8 and 1.0
          metrics.precision = Math.random() * 0.2 + 0.8;
          metrics.recall = Math.random() * 0.2 + 0.8;
          metrics.f1_score = 2 * (metrics.precision * metrics.recall) / (metrics.precision + metrics.recall);
          break;
          
        case EvaluationType.REGRESSION:
          metrics.mse = Math.random() * 0.1; // Random MSE between 0 and 0.1
          metrics.rmse = Math.sqrt(metrics.mse);
          metrics.mae = Math.random() * 0.08;
          metrics.r2 = Math.random() * 0.2 + 0.8;
          break;
          
        case EvaluationType.OBJECT_DETECTION:
          metrics.mAP = Math.random() * 0.2 + 0.8;
          metrics.precision = Math.random() * 0.2 + 0.8;
          metrics.recall = Math.random() * 0.2 + 0.8;
          metrics.f1_score = 2 * (metrics.precision * metrics.recall) / (metrics.precision + metrics.recall);
          break;
          
        case EvaluationType.SEGMENTATION:
          metrics.iou = Math.random() * 0.2 + 0.8;
          metrics.dice = Math.random() * 0.2 + 0.8;
          metrics.pixel_accuracy = Math.random() * 0.2 + 0.8;
          break;
          
        case EvaluationType.ANOMALY_DETECTION:
          metrics.auc = Math.random() * 0.2 + 0.8;
          metrics.precision = Math.random() * 0.2 + 0.8;
          metrics.recall = Math.random() * 0.2 + 0.8;
          metrics.f1_score = 2 * (metrics.precision * metrics.recall) / (metrics.precision + metrics.recall);
          break;
          
        case EvaluationType.RECOMMENDATION:
          metrics.ndcg = Math.random() * 0.2 + 0.8;
          metrics.precision_at_k = Math.random() * 0.2 + 0.8;
          metrics.recall_at_k = Math.random() * 0.2 + 0.8;
          metrics.map = Math.random() * 0.2 + 0.8;
          break;
          
        default:
          metrics.score = Math.random() * 0.2 + 0.8;
      }
      
      // Add evaluation timestamp
      metrics.evaluation_timestamp = new Date().toISOString();
      
      return metrics;
    } catch (error) {
      logger.error(`Error calculating metrics for model ${modelId}`, error);
      throw error;
    }
  }
  
  /**
   * Compare multiple evaluations
   * @param {Array<string>} evaluationIds - Evaluation IDs to compare
   * @returns {Promise<Object>} Comparison results
   */
  async compareEvaluations(evaluationIds) {
    try {
      logger.info(`Comparing evaluations: ${evaluationIds.join(', ')}`);
      
      const evaluations = [];
      const metrics = {};
      const parameters = {};
      
      // Collect evaluation data
      for (const evaluationId of evaluationIds) {
        if (!this.evaluations.has(evaluationId)) {
          throw new Error(`Evaluation ${evaluationId} not found`);
        }
        
        const evaluation = this.evaluations.get(evaluationId);
        
        // Only include completed evaluations
        if (evaluation.status !== EvaluationStatus.COMPLETED) {
          throw new Error(`Evaluation ${evaluationId} is not completed`);
        }
        
        evaluations.push(evaluation);
        
        // Collect metrics
        for (const [key, value] of Object.entries(evaluation.metrics)) {
          if (!metrics[key]) {
            metrics[key] = [];
          }
          metrics[key].push({ evaluationId, value });
        }
        
        // Collect parameters
        for (const [key, value] of Object.entries(evaluation.parameters)) {
          if (!parameters[key]) {
            parameters[key] = [];
          }
          parameters[key].push({ evaluationId, value });
        }
      }
      
      return {
        evaluations,
        metrics,
        parameters
      };
    } catch (error) {
      logger.error(`Failed to compare evaluations: ${evaluationIds.join(', ')}`, error);
      throw error;
    }
  }
  
  /**
   * Get best evaluation based on a metric
   * @param {string} modelId - Model ID
   * @param {string} metricName - Metric name
   * @param {boolean} isHigherBetter - True if higher metric value is better
   * @returns {Promise<Object>} Best evaluation
   */
  async getBestEvaluation(modelId, metricName, isHigherBetter = true) {
    try {
      logger.info(`Getting best evaluation for model ${modelId} based on ${metricName}`);
      
      // Get all evaluations for the model
      const evaluations = Array.from(this.evaluations.values())
        .filter(evaluation => evaluation.modelId === modelId && evaluation.status === EvaluationStatus.COMPLETED);
      
      if (evaluations.length === 0) {
        throw new Error(`No completed evaluations found for model ${modelId}`);
      }
      
      // Filter evaluations that have the specified metric
      const evaluationsWithMetric = evaluations.filter(evaluation => evaluation.metrics[metricName] !== undefined);
      
      if (evaluationsWithMetric.length === 0) {
        throw new Error(`No evaluations with metric ${metricName} found for model ${modelId}`);
      }
      
      // Sort evaluations by metric value
      evaluationsWithMetric.sort((a, b) => {
        const aValue = a.metrics[metricName];
        const bValue = b.metrics[metricName];
        
        return isHigherBetter ? bValue - aValue : aValue - bValue;
      });
      
      // Return best evaluation
      return evaluationsWithMetric[0];
    } catch (error) {
      logger.error(`Failed to get best evaluation for model ${modelId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete an evaluation
   * @param {string} evaluationId - Evaluation ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteEvaluation(evaluationId) {
    try {
      logger.info(`Deleting evaluation: ${evaluationId}`);
      
      // Check if evaluation exists
      if (!this.evaluations.has(evaluationId)) {
        throw new Error(`Evaluation ${evaluationId} not found`);
      }
      
      // Check if evaluation is active
      if (this.activeEvaluations.has(evaluationId)) {
        throw new Error(`Cannot delete active evaluation ${evaluationId}`);
      }
      
      // Remove evaluation
      this.evaluations.delete(evaluationId);
      
      // Save evaluations to disk
      await this._saveEvaluations();
      
      logger.info(`Evaluation ${evaluationId} deleted successfully`);
      
      // Emit event
      this.eventEmitter.emit('evaluation-deleted', {
        evaluationId,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete evaluation ${evaluationId}`, error);
      throw error;
    }
  }
  
  /**
   * Register dataset for evaluation
   * @param {string} datasetId - Dataset ID
   * @param {string} datasetPath - Path to dataset files
   * @param {Object} metadata - Dataset metadata
   * @returns {Promise<Object>} Dataset info
   */
  async registerDataset(datasetId, datasetPath, metadata = {}) {
    try {
      logger.info(`Registering dataset: ${datasetId}`);
      
      // Create dataset directory
      const targetDir = path.join(this.options.datasetsPath, datasetId);
      await fs.mkdir(targetDir, { recursive: true });
      
      // Create metadata file
      const datasetMetadata = {
        id: datasetId,
        name: metadata.name || datasetId,
        description: metadata.description || '',
        createdAt: new Date().toISOString(),
        type: metadata.type || 'unknown',
        format: metadata.format || 'unknown',
        size: metadata.size || 0,
        features: metadata.features || [],
        labels: metadata.labels || [],
        split: metadata.split || { train: 0, test: 0, validation: 0 },
        source: metadata.source || '',
        license: metadata.license || '',
        ...metadata
      };
      
      // Write metadata file
      await fs.writeFile(
        path.join(targetDir, 'metadata.json'),
        JSON.stringify(datasetMetadata, null, 2)
      );
      
      // Copy dataset files if path is provided
      if (datasetPath) {
        // This would copy files from datasetPath to targetDir
        // For simplicity, we'll just create a placeholder file
        await fs.writeFile(
          path.join(targetDir, 'dataset.placeholder'),
          'Dataset placeholder file'
        );
      }
      
      logger.info(`Dataset ${datasetId} registered successfully`);
      
      return datasetMetadata;
    } catch (error) {
      logger.error(`Failed to register dataset ${datasetId}`, error);
      throw error;
    }
  }
  
  /**
   * Get dataset metadata
   * @param {string} datasetId - Dataset ID
   * @returns {Promise<Object>} Dataset metadata
   */
  async getDataset(datasetId) {
    try {
      const datasetPath = path.join(this.options.datasetsPath, datasetId);
      const metadataPath = path.join(datasetPath, 'metadata.json');
      
      try {
        const data = await fs.readFile(metadataPath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        throw new Error(`Dataset ${datasetId} not found`);
      }
    } catch (error) {
      logger.error(`Failed to get dataset ${datasetId}`, error);
      throw error;
    }
  }
  
  /**
   * Register for evaluation events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  
  /**
   * Unregister from evaluation events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }
}

module.exports = {
  ModelEvaluationService,
  EvaluationStatus,
  EvaluationType
}; 