/**
 * MLService.js
 * 
 * Main service for machine learning functionality
 * Implements RF049 - Set up ML service infrastructure
 * Implements RF057 - Implement performance metrics tracking
 */

const MLServiceInfrastructure = require('../core/MLServiceInfrastructure');
const { ModelLoaderService, ModelType } = require('./ModelLoaderService');
const { ModelPerformanceService } = require('./ModelPerformanceService');
const logger = require('../utils/logger');

/**
 * ML Service
 * Main service for machine learning functionality
 */
class MLService {
  /**
   * Create a new ML service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      ...options
    };
    
    // Initialize infrastructure
    this.infrastructure = new MLServiceInfrastructure(options);
    this.modelLoader = new ModelLoaderService(options);
    this.modelPerformanceService = options.modelPerformanceService || new ModelPerformanceService();
    
    // Track loaded models
    this.loadedModels = new Set();
    
    // Setup event listeners
    this._setupEventListeners();
  }
  
  /**
   * Set up event listeners
   * @private
   */
  _setupEventListeners() {
    this.infrastructure.on('inference', (event) => {
      if (event.success) {
        logger.info(`Inference completed for model ${event.modelId} in ${event.duration}ms`);
        
        // Track performance metrics
        this.modelPerformanceService.trackInference(
          event.modelId,
          event.duration,
          true,
          { timestamp: event.timestamp }
        );
      } else {
        logger.warn(`Inference failed for model ${event.modelId}: ${event.error}`);
        
        // Track failed inference
        this.modelPerformanceService.trackInference(
          event.modelId,
          0,
          false,
          { error: event.error, timestamp: event.timestamp }
        );
      }
    });
    
    this.infrastructure.on('batchInference', (event) => {
      if (event.success) {
        logger.info(`Batch inference completed for model ${event.modelId} with ${event.batchSize} items in ${event.duration}ms`);
        
        // Track batch performance metrics
        this.modelPerformanceService.trackBatchInference(
          event.modelId,
          event.duration,
          event.batchSize,
          true,
          { timestamp: event.timestamp }
        );
      } else {
        logger.warn(`Batch inference failed for model ${event.modelId}: ${event.error}`);
        
        // Track failed batch inference
        this.modelPerformanceService.trackBatchInference(
          event.modelId,
          0,
          event.batchSize || 0,
          false,
          { error: event.error, timestamp: event.timestamp }
        );
      }
    });
  }
  
  /**
   * Load a model
   * @param {string} modelId - Model identifier
   * @param {string} modelType - Type of model
   * @param {Object} options - Model-specific options
   * @returns {Promise<Object>} Model info
   */
  async loadModel(modelId, modelType, options = {}) {
    try {
      logger.info(`Loading model: ${modelId} (${modelType})`);
      
      // Track load start time for performance metrics
      const startTime = Date.now();
      
      // Check if model exists
      const modelExists = await this.modelLoader.modelExists(modelId);
      
      if (!modelExists) {
        throw new Error(`Model ${modelId} does not exist`);
      }
      
      // Load model using model loader
      const model = await this.modelLoader.loadModel(modelId, modelType, options);
      
      // Add to infrastructure
      const modelInfo = await this.infrastructure.loadModel(modelId, modelType, {
        ...options,
        model
      });
      
      // Track loaded model
      this.loadedModels.add(modelId);
      
      // Track model load performance
      const loadDuration = Date.now() - startTime;
      this.modelPerformanceService.trackCustomMetric(
        modelId,
        'model_load_time',
        loadDuration,
        { modelType }
      );
      
      return {
        id: modelId,
        type: modelType,
        status: 'loaded',
        loadedAt: modelInfo.loadedAt
      };
    } catch (error) {
      logger.error(`Failed to load model ${modelId}`, error);
      
      // Track model load failure
      this.modelPerformanceService.trackCustomMetric(
        modelId,
        'model_load_failure',
        1,
        { modelType, error: error.message }
      );
      
      throw error;
    }
  }
  
  /**
   * Unload a model
   * @param {string} modelId - Model identifier
   * @returns {Promise<boolean>} True if model was unloaded
   */
  async unloadModel(modelId) {
    try {
      const unloaded = await this.infrastructure.unloadModel(modelId);
      
      if (unloaded) {
        this.loadedModels.delete(modelId);
        
        // Track model unload event
        this.modelPerformanceService.trackCustomMetric(
          modelId,
          'model_unloaded',
          1,
          { timestamp: new Date().toISOString() }
        );
      }
      
      return unloaded;
    } catch (error) {
      logger.error(`Failed to unload model ${modelId}`, error);
      throw error;
    }
  }
  
  /**
   * Run inference on a model
   * @param {string} modelId - Model identifier
   * @param {*} input - Input data
   * @param {Object} options - Inference options
   * @returns {Promise<*>} Inference results
   */
  async runInference(modelId, input, options = {}) {
    try {
      // Track inference start time for custom performance metrics
      const startTime = Date.now();
      
      // Run inference
      const result = await this.infrastructure.runInference(modelId, input, options);
      
      // Track additional custom metrics if needed
      const inferenceTime = Date.now() - startTime;
      this.modelPerformanceService.trackCustomMetric(
        modelId,
        'total_inference_time',
        inferenceTime,
        { inputSize: JSON.stringify(input).length }
      );
      
      return result;
    } catch (error) {
      logger.error(`Inference failed for model ${modelId}`, error);
      
      // Track inference failure
      this.modelPerformanceService.trackCustomMetric(
        modelId,
        'inference_failure',
        1,
        { error: error.message }
      );
      
      throw error;
    }
  }
  
  /**
   * Queue inference for batch processing
   * @param {string} modelId - Model identifier
   * @param {*} input - Input data
   * @param {Object} options - Inference options
   * @returns {Promise<*>} Inference results
   */
  async queueInference(modelId, input, options = {}) {
    try {
      return await this.infrastructure.queueInference(modelId, input, options);
    } catch (error) {
      logger.error(`Failed to queue inference for model ${modelId}`, error);
      
      // Track queue failure
      this.modelPerformanceService.trackCustomMetric(
        modelId,
        'queue_failure',
        1,
        { error: error.message }
      );
      
      throw error;
    }
  }
  
  /**
   * Get available models
   * @returns {Promise<Array>} List of available models
   */
  async getAvailableModels() {
    try {
      return await this.modelLoader.getAvailableModels();
    } catch (error) {
      logger.error('Failed to get available models', error);
      throw error;
    }
  }
  
  /**
   * Get active models
   * @returns {Array} List of active models
   */
  getActiveModels() {
    return this.infrastructure.getActiveModels();
  }
  
  /**
   * Check if a model is loaded
   * @param {string} modelId - Model identifier
   * @returns {boolean} True if model is loaded
   */
  isModelLoaded(modelId) {
    return this.loadedModels.has(modelId);
  }
  
  /**
   * Get performance metrics for a model
   * @param {string} modelId - Model identifier
   * @param {string} metricType - Type of metric (optional)
   * @param {string} timeWindow - Time window (optional)
   * @returns {Object} Model performance metrics
   */
  getModelMetrics(modelId, metricType = null, timeWindow = null) {
    return this.modelPerformanceService.getModelMetrics(modelId, metricType, timeWindow);
  }
  
  /**
   * Track a custom metric for a model
   * @param {string} modelId - Model identifier
   * @param {string} metricName - Metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  trackCustomMetric(modelId, metricName, value, metadata = {}) {
    this.modelPerformanceService.trackCustomMetric(modelId, metricName, value, metadata);
  }
}

// Singleton instance
let instance = null;

/**
 * Get the ML service instance
 * @param {Object} options - Configuration options
 * @returns {MLService} ML service instance
 */
function getMLService(options = {}) {
  if (!instance) {
    instance = new MLService(options);
  }
  return instance;
}

module.exports = {
  MLService,
  getMLService,
  ModelType
}; 