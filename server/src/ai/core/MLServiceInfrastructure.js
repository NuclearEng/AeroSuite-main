/**
 * MLServiceInfrastructure.js
 * 
 * Core infrastructure for machine learning services
 * Implements RF049 - Set up ML service infrastructure
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

/**
 * Base class for ML service infrastructure
 * Provides core functionality for ML services
 */
class MLServiceInfrastructure {
  /**
   * Create a new ML service infrastructure
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      modelStoragePath: process.env.ML_MODEL_STORAGE_PATH || path.join(__dirname, '../../..', 'ml-models'),
      dataStoragePath: process.env.ML_DATA_STORAGE_PATH || path.join(__dirname, '../../..', 'ml-data'),
      maxConcurrentInference: process.env.ML_MAX_CONCURRENT_INFERENCE || 10,
      maxBatchSize: process.env.ML_MAX_BATCH_SIZE || 32,
      ...options
    };
    
    this.eventEmitter = new EventEmitter();
    this.activeModels = new Map();
    this.inferenceQueue = [];
    this.isProcessingQueue = false;
    
    // Initialize infrastructure
    this._initialize();
  }
  
  /**
   * Initialize the ML service infrastructure
   * @private
   */
  async _initialize() {
    try {
      // Ensure storage directories exist
      await this._ensureDirectories();
      
      logger.info('ML Service Infrastructure initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize ML Service Infrastructure', error);
      throw error;
    }
  }
  
  /**
   * Ensure required directories exist
   * @private
   */
  async _ensureDirectories() {
    try {
      await fs.mkdir(this.options.modelStoragePath, { recursive: true });
      await fs.mkdir(this.options.dataStoragePath, { recursive: true });
      
      logger.info(`ML directories created: 
        - Models: ${this.options.modelStoragePath}
        - Data: ${this.options.dataStoragePath}`);
    } catch (error) {
      logger.error('Failed to create ML directories', error);
      throw error;
    }
  }
  
  /**
   * Load a model into memory
   * @param {string} modelId - Model identifier
   * @param {string} modelType - Type of model
   * @param {Object} modelOptions - Model-specific options
   * @returns {Promise<Object>} Loaded model instance
   */
  async loadModel(modelId, modelType, modelOptions = {}) {
    try {
      logger.info(`Loading model: ${modelId} (${modelType})`);
      
      // Check if model is already loaded
      if (this.activeModels.has(modelId)) {
        logger.info(`Model ${modelId} is already loaded`);
        return this.activeModels.get(modelId);
      }
      
      // Determine model path
      const modelPath = path.join(this.options.modelStoragePath, modelId);
      
      // Check if model exists
      try {
        await fs.access(modelPath);
      } catch (error) {
        throw new Error(`Model ${modelId} not found at ${modelPath}`);
      }
      
      // Load model (implementation will depend on model type)
      const model = await this._loadModelByType(modelPath, modelType, modelOptions);
      
      // Store in active models
      this.activeModels.set(modelId, {
        id: modelId,
        type: modelType,
        model,
        loadedAt: new Date(),
        inferenceCount: 0,
        lastUsed: new Date()
      });
      
      logger.info(`Model ${modelId} loaded successfully`);
      
      return this.activeModels.get(modelId);
    } catch (error) {
      logger.error(`Failed to load model ${modelId}`, error);
      throw error;
    }
  }
  
  /**
   * Load model based on type
   * @param {string} modelPath - Path to model files
   * @param {string} modelType - Type of model
   * @param {Object} modelOptions - Model-specific options
   * @returns {Promise<Object>} Loaded model
   * @private
   */
  async _loadModelByType(modelPath, modelType, modelOptions) {
    // This is a placeholder - actual implementation would depend on supported model types
    // Subclasses should override this method to provide specific model loading logic
    
    logger.warn(`Using default model loader for ${modelType}. This may not be optimal.`);
    
    // Return a placeholder model
    return {
      type: modelType,
      path: modelPath,
      options: modelOptions,
      predict: async (input) => {
        throw new Error('Model prediction not implemented');
      }
    };
  }
  
  /**
   * Unload a model from memory
   * @param {string} modelId - Model identifier
   * @returns {Promise<boolean>} True if model was unloaded, false if not found
   */
  async unloadModel(modelId) {
    try {
      if (!this.activeModels.has(modelId)) {
        logger.warn(`Model ${modelId} not found in active models`);
        return false;
      }
      
      const modelInfo = this.activeModels.get(modelId);
      
      // Perform model-specific cleanup if needed
      if (modelInfo.model && typeof modelInfo.model.dispose === 'function') {
        await modelInfo.model.dispose();
      }
      
      // Remove from active models
      this.activeModels.delete(modelId);
      
      logger.info(`Model ${modelId} unloaded successfully`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to unload model ${modelId}`, error);
      throw error;
    }
  }
  
  /**
   * Run inference on a model
   * @param {string} modelId - Model identifier
   * @param {*} input - Input data for inference
   * @param {Object} options - Inference options
   * @returns {Promise<*>} Inference results
   */
  async runInference(modelId, input, options = {}) {
    try {
      // Check if model is loaded
      if (!this.activeModels.has(modelId)) {
        throw new Error(`Model ${modelId} is not loaded`);
      }
      
      const modelInfo = this.activeModels.get(modelId);
      
      // Update usage statistics
      modelInfo.inferenceCount += 1;
      modelInfo.lastUsed = new Date();
      
      // Run model prediction
      const startTime = Date.now();
      const result = await modelInfo.model.predict(input, options);
      const duration = Date.now() - startTime;
      
      logger.debug(`Inference completed for model ${modelId} in ${duration}ms`);
      
      // Emit inference event
      this.eventEmitter.emit('inference', {
        modelId,
        duration,
        timestamp: new Date(),
        success: true
      });
      
      return result;
    } catch (error) {
      // Emit error event
      this.eventEmitter.emit('inference', {
        modelId,
        timestamp: new Date(),
        success: false,
        error: error.message
      });
      
      logger.error(`Inference failed for model ${modelId}`, error);
      throw error;
    }
  }
  
  /**
   * Queue inference request for batch processing
   * @param {string} modelId - Model identifier
   * @param {*} input - Input data for inference
   * @param {Object} options - Inference options
   * @returns {Promise<*>} Inference results
   */
  queueInference(modelId, input, options = {}) {
    return new Promise((resolve, reject) => {
      this.inferenceQueue.push({
        modelId,
        input,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      });
      
      // Start processing queue if not already running
      if (!this.isProcessingQueue) {
        this._processInferenceQueue();
      }
    });
  }
  
  /**
   * Process the inference queue
   * @private
   */
  async _processInferenceQueue() {
    if (this.inferenceQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      // Group requests by model for batch processing
      const batchesByModel = new Map();
      
      // Group up to maxBatchSize items by model
      for (let i = 0; i < this.options.maxBatchSize && i < this.inferenceQueue.length; i++) {
        const request = this.inferenceQueue[i];
        
        if (!batchesByModel.has(request.modelId)) {
          batchesByModel.set(request.modelId, []);
        }
        
        batchesByModel.get(request.modelId).push(request);
      }
      
      // Process batches for each model
      const batchPromises = [];
      
      for (const [modelId, requests] of batchesByModel.entries()) {
        batchPromises.push(this._processBatch(modelId, requests));
      }
      
      await Promise.all(batchPromises);
      
      // Remove processed requests from queue
      const totalProcessed = Array.from(batchesByModel.values())
        .reduce((sum, batch) => sum + batch.length, 0);
      
      this.inferenceQueue.splice(0, totalProcessed);
      
      // Continue processing queue
      setImmediate(() => this._processInferenceQueue());
    } catch (error) {
      logger.error('Error processing inference queue', error);
      
      // Continue processing queue after a delay
      setTimeout(() => this._processInferenceQueue(), 1000);
    }
  }
  
  /**
   * Process a batch of inference requests for a model
   * @param {string} modelId - Model identifier
   * @param {Array} requests - Batch of inference requests
   * @private
   */
  async _processBatch(modelId, requests) {
    try {
      // Check if model is loaded
      if (!this.activeModels.has(modelId)) {
        throw new Error(`Model ${modelId} is not loaded`);
      }
      
      const modelInfo = this.activeModels.get(modelId);
      
      // Extract inputs from requests
      const inputs = requests.map(req => req.input);
      
      // Run batch inference
      const startTime = Date.now();
      const batchResults = await modelInfo.model.predictBatch(inputs);
      const duration = Date.now() - startTime;
      
      // Update model statistics
      modelInfo.inferenceCount += requests.length;
      modelInfo.lastUsed = new Date();
      
      // Resolve individual requests
      requests.forEach((request, index) => {
        request.resolve(batchResults[index]);
      });
      
      logger.debug(`Batch inference completed for model ${modelId} with ${requests.length} items in ${duration}ms`);
      
      // Emit inference event
      this.eventEmitter.emit('batchInference', {
        modelId,
        batchSize: requests.length,
        duration,
        timestamp: new Date(),
        success: true
      });
    } catch (error) {
      // Reject all requests in batch
      requests.forEach(request => {
        request.reject(error);
      });
      
      // Emit error event
      this.eventEmitter.emit('batchInference', {
        modelId,
        batchSize: requests.length,
        timestamp: new Date(),
        success: false,
        error: error.message
      });
      
      logger.error(`Batch inference failed for model ${modelId}`, error);
    }
  }
  
  /**
   * Get information about active models
   * @returns {Array} Array of active model information
   */
  getActiveModels() {
    return Array.from(this.activeModels.values()).map(info => ({
      id: info.id,
      type: info.type,
      loadedAt: info.loadedAt,
      inferenceCount: info.inferenceCount,
      lastUsed: info.lastUsed
    }));
  }
  
  /**
   * Register event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  on(event, listener) {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  off(event, listener) {
    this.eventEmitter.off(event, listener);
  }
}

module.exports = MLServiceInfrastructure; 