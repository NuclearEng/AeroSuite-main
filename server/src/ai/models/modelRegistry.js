/**
 * AI Model Registry
 * 
 * This module provides a registry for AI/ML models used throughout the application.
 * It handles model versioning, loading, and caching for efficient use.
 * 
 * Part of: AI Foundation Architecture (AI001)
 */

const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// In-memory cache for loaded models
const modelCache = new Map();

// Model metadata store
const modelRegistry = new Map();

/**
 * Register a new model in the registry
 * 
 * @param {string} modelId - Unique identifier for the model
 * @param {Object} metadata - Model metadata
 * @returns {Object} The registered model metadata
 */
function registerModel(modelId, metadata) {
  if (!modelId) {
    throw new Error('Model ID is required');
  }

  if (modelRegistry.has(modelId)) {
    logger.warn(`Model ${modelId} is already registered. Updating metadata.`);
  }

  const modelMetadata = {
    id: modelId,
    name: metadata.name || modelId,
    version: metadata.version || '1.0.0',
    description: metadata.description || '',
    type: metadata.type || 'unknown',
    framework: metadata.framework || 'unknown',
    inputShape: metadata.inputShape || null,
    outputShape: metadata.outputShape || null,
    path: metadata.path || null,
    endpoints: metadata.endpoints || {},
    created: metadata.created || new Date(),
    updated: new Date(),
    tags: metadata.tags || [],
    metrics: metadata.metrics || {},
    status: metadata.status || 'active',
    config: metadata.config || {},
    dependencies: metadata.dependencies || [],
    ...metadata
  };

  modelRegistry.set(modelId, modelMetadata);
  logger.info(`Model ${modelId} (v${modelMetadata.version}) registered successfully`);
  
  return modelMetadata;
}

/**
 * Get model metadata from the registry
 * 
 * @param {string} modelId - Unique identifier for the model
 * @returns {Object|null} The model metadata or null if not found
 */
function getModelMetadata(modelId) {
  return modelRegistry.get(modelId) || null;
}

/**
 * List all registered models, optionally filtered by tags or status
 * 
 * @param {Object} filters - Optional filters for listing models
 * @returns {Array} Array of model metadata objects
 */
function listModels(filters = {}) {
  let models = Array.from(modelRegistry.values());
  
  // Apply filters if provided
  if (filters.tags && filters.tags.length > 0) {
    models = models.filter(model => {
      return filters.tags.some(tag => model.tags.includes(tag));
    });
  }
  
  if (filters.status) {
    models = models.filter(model => model.status === filters.status);
  }
  
  if (filters.type) {
    models = models.filter(model => model.type === filters.type);
  }

  return models;
}

/**
 * Load a model into memory
 * 
 * @param {string} modelId - Unique identifier for the model
 * @param {Object} options - Loading options
 * @returns {Object} The loaded model instance
 */
async function loadModel(modelId, options = {}) {
  // Check if model is already loaded and cached
  if (modelCache.has(modelId) && !options.forceReload) {
    logger.debug(`Using cached model instance for ${modelId}`);
    return modelCache.get(modelId);
  }

  const metadata = getModelMetadata(modelId);
  if (!metadata) {
    throw new Error(`Model ${modelId} not found in registry`);
  }

  logger.info(`Loading model ${modelId} (v${metadata.version})`);
  
  try {
    // Different loading strategies based on model type and framework
    let modelInstance;
    
    // This is a placeholder for model loading logic
    // In a real implementation, you would use the appropriate
    // framework-specific loading code based on metadata.framework
    switch (metadata.framework) {
      case 'tensorflow':
        // modelInstance = await tf.loadLayersModel(metadata.path);
        modelInstance = { 
          id: modelId, 
          framework: 'tensorflow',
          predict: async (input) => {
            // Placeholder for actual model prediction
            return { result: 'tensorflow-prediction', input };
          }
        };
        break;
        
      case 'pytorch':
        // Load PyTorch model using appropriate method
        modelInstance = { 
          id: modelId, 
          framework: 'pytorch',
          predict: async (input) => {
            // Placeholder for actual model prediction
            return { result: 'pytorch-prediction', input };
          }
        };
        break;
        
      case 'onnx':
        // Load ONNX model using appropriate method
        modelInstance = { 
          id: modelId, 
          framework: 'onnx',
          predict: async (input) => {
            // Placeholder for actual model prediction
            return { result: 'onnx-prediction', input };
          }
        };
        break;
        
      default:
        // Generic model loading
        modelInstance = { 
          id: modelId, 
          framework: metadata.framework,
          predict: async (input) => {
            // Placeholder for actual model prediction
            return { result: 'generic-prediction', input };
          }
        };
    }
    
    // Add metadata to the model instance
    modelInstance.metadata = metadata;
    
    // Cache the loaded model
    modelCache.set(modelId, modelInstance);
    
    // Update last loaded timestamp in registry
    metadata.lastLoaded = new Date();
    modelRegistry.set(modelId, metadata);
    
    return modelInstance;
  } catch (error) {
    logger.error(`Failed to load model ${modelId}: ${error.message}`);
    throw error;
  }
}

/**
 * Unload a model from memory
 * 
 * @param {string} modelId - Unique identifier for the model
 * @returns {boolean} True if model was unloaded, false otherwise
 */
function unloadModel(modelId) {
  if (!modelCache.has(modelId)) {
    logger.debug(`Model ${modelId} is not loaded`);
    return false;
  }
  
  try {
    // Get the model instance
    const model = modelCache.get(modelId);
    
    // Framework-specific cleanup if needed
    if (model.dispose && typeof model.dispose === 'function') {
      model.dispose();
    }
    
    // Remove from cache
    modelCache.delete(modelId);
    
    logger.info(`Model ${modelId} unloaded successfully`);
    return true;
  } catch (error) {
    logger.error(`Error unloading model ${modelId}: ${error.message}`);
    return false;
  }
}

/**
 * Update model metadata in the registry
 * 
 * @param {string} modelId - Unique identifier for the model
 * @param {Object} updates - Metadata updates
 * @returns {Object} Updated model metadata
 */
function updateModelMetadata(modelId, updates) {
  const metadata = getModelMetadata(modelId);
  if (!metadata) {
    throw new Error(`Model ${modelId} not found in registry`);
  }
  
  const updatedMetadata = {
    ...metadata,
    ...updates,
    updated: new Date()
  };
  
  modelRegistry.set(modelId, updatedMetadata);
  logger.info(`Updated metadata for model ${modelId}`);
  
  return updatedMetadata;
}

module.exports = {
  registerModel,
  getModelMetadata,
  listModels,
  loadModel,
  unloadModel,
  updateModelMetadata
}; 