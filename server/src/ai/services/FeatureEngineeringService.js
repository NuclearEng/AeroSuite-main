/**
 * FeatureEngineeringService.js
 * 
 * Service for feature engineering pipeline
 * Implements RF051 - Create feature engineering pipeline
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

/**
 * Feature types supported by the pipeline
 * @enum {string}
 */
const FeatureType = {
  NUMERIC: 'numeric',
  CATEGORICAL: 'categorical',
  TEXT: 'text',
  IMAGE: 'image',
  TIME_SERIES: 'time-series',
  GEOSPATIAL: 'geospatial'
};

/**
 * Transformation types for feature processing
 * @enum {string}
 */
const TransformationType = {
  SCALING: 'scaling',
  NORMALIZATION: 'normalization',
  ONE_HOT_ENCODING: 'one-hot-encoding',
  EMBEDDING: 'embedding',
  BINNING: 'binning',
  IMPUTATION: 'imputation',
  DIMENSION_REDUCTION: 'dimension-reduction',
  CUSTOM: 'custom'
};

/**
 * Feature Engineering Service
 * Provides a pipeline for preprocessing and transforming features for ML models
 */
class FeatureEngineeringService {
  /**
   * Create a new feature engineering service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      pipelineStoragePath: process.env.ML_PIPELINE_STORAGE_PATH || path.join(__dirname, '../../../..', 'ml-pipelines'),
      ...options
    };
    
    this.eventEmitter = new EventEmitter();
    this.transformers = new Map();
    this.pipelines = new Map();
    
    // Register default transformers
    this._registerDefaultTransformers();
  }
  
  /**
   * Register default transformers
   * @private
   */
  _registerDefaultTransformers() {
    // Numeric scaling transformer
    this.registerTransformer(TransformationType.SCALING, {
      fit: async (data, options = {}) => {
        const { method = 'min-max', featureNames = [] } = options;
        const stats = {};
        
        // Calculate statistics for scaling
        if (method === 'min-max') {
          // For each feature, calculate min and max
          for (const feature of featureNames) {
            const values = data.map(item => item[feature]).filter(val => val !== null && val !== undefined);
            stats[feature] = {
              min: Math.min(...values),
              max: Math.max(...values)
            };
          }
        } else if (method === 'z-score') {
          // For each feature, calculate mean and std
          for (const feature of featureNames) {
            const values = data.map(item => item[feature]).filter(val => val !== null && val !== undefined);
            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const std = Math.sqrt(variance);
            
            stats[feature] = {
              mean,
              std: std || 1 // Prevent division by zero
            };
          }
        }
        
        return {
          method,
          stats,
          featureNames
        };
      },
      transform: async (data, params) => {
        const { method, stats, featureNames } = params;
        const result = [...data]; // Clone to avoid modifying original
        
        // Apply scaling to each item
        for (const item of result) {
          for (const feature of featureNames) {
            if (item[feature] === null || item[feature] === undefined) continue;
            
            if (method === 'min-max') {
              const { min, max } = stats[feature];
              const range = max - min;
              item[feature] = range !== 0 ? (item[feature] - min) / range : 0;
            } else if (method === 'z-score') {
              const { mean, std } = stats[feature];
              item[feature] = (item[feature] - mean) / std;
            }
          }
        }
        
        return result;
      }
    });
    
    // Categorical one-hot encoding transformer
    this.registerTransformer(TransformationType.ONE_HOT_ENCODING, {
      fit: async (data, options = {}) => {
        const { featureNames = [] } = options;
        const categories = {};
        
        // For each categorical feature, find all unique values
        for (const feature of featureNames) {
          const uniqueValues = new Set();
          for (const item of data) {
            if (item[feature] !== null && item[feature] !== undefined) {
              uniqueValues.add(item[feature]);
            }
          }
          categories[feature] = Array.from(uniqueValues);
        }
        
        return {
          categories,
          featureNames
        };
      },
      transform: async (data, params) => {
        const { categories, featureNames } = params;
        const result = [];
        
        // Apply one-hot encoding to each item
        for (const item of data) {
          const encodedItem = { ...item }; // Clone original properties
          
          for (const feature of featureNames) {
            const value = item[feature];
            
            // Remove the original feature
            delete encodedItem[feature];
            
            // Add one-hot encoded features
            for (const category of categories[feature]) {
              encodedItem[`${feature}_${category}`] = value === category ? 1 : 0;
            }
          }
          
          result.push(encodedItem);
        }
        
        return result;
      }
    });
    
    // Imputation transformer for missing values
    this.registerTransformer(TransformationType.IMPUTATION, {
      fit: async (data, options = {}) => {
        const { featureNames = [], strategy = 'mean' } = options;
        const stats = {};
        
        // Calculate statistics for imputation
        for (const feature of featureNames) {
          const values = data.map(item => item[feature]).filter(val => val !== null && val !== undefined);
          
          if (strategy === 'mean') {
            stats[feature] = values.reduce((sum, val) => sum + val, 0) / values.length;
          } else if (strategy === 'median') {
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            stats[feature] = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
          } else if (strategy === 'mode') {
            // Find the most frequent value
            const frequency = {};
            let maxFreq = 0;
            let mode;
            
            for (const val of values) {
              frequency[val] = (frequency[val] || 0) + 1;
              if (frequency[val] > maxFreq) {
                maxFreq = frequency[val];
                mode = val;
              }
            }
            
            stats[feature] = mode;
          } else if (strategy === 'constant') {
            stats[feature] = options.fillValue || 0;
          }
        }
        
        return {
          stats,
          strategy,
          featureNames
        };
      },
      transform: async (data, params) => {
        const { stats, featureNames } = params;
        const result = [...data]; // Clone to avoid modifying original
        
        // Apply imputation to each item
        for (const item of result) {
          for (const feature of featureNames) {
            if (item[feature] === null || item[feature] === undefined) {
              item[feature] = stats[feature];
            }
          }
        }
        
        return result;
      }
    });
  }
  
  /**
   * Register a transformer
   * @param {string} type - Transformation type
   * @param {Object} transformer - Transformer object with fit and transform methods
   */
  registerTransformer(type, transformer) {
    if (!transformer.fit || !transformer.transform) {
      throw new Error('Transformer must have fit and transform methods');
    }
    
    this.transformers.set(type, transformer);
    logger.info(`Registered transformer for type: ${type}`);
  }
  
  /**
   * Create a new feature engineering pipeline
   * @param {string} pipelineId - Pipeline identifier
   * @param {Array<Object>} steps - Pipeline steps
   * @returns {Promise<Object>} Created pipeline
   */
  async createPipeline(pipelineId, steps = []) {
    try {
      logger.info(`Creating feature engineering pipeline: ${pipelineId}`);
      
      // Validate steps
      for (const step of steps) {
        if (!step.type || !this.transformers.has(step.type)) {
          throw new Error(`Unsupported transformation type: ${step.type}`);
        }
      }
      
      // Create pipeline
      const pipeline = {
        id: pipelineId,
        steps: steps.map((step, index) => ({
          ...step,
          id: step.id || `step-${index}`,
          params: null // Will be populated during fitting
        })),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'created'
      };
      
      // Store pipeline
      this.pipelines.set(pipelineId, pipeline);
      
      // Save pipeline to disk
      await this._savePipeline(pipeline);
      
      return pipeline;
    } catch (error) {
      logger.error(`Failed to create pipeline ${pipelineId}`, error);
      throw error;
    }
  }
  
  /**
   * Fit a pipeline on training data
   * @param {string} pipelineId - Pipeline identifier
   * @param {Array<Object>} data - Training data
   * @returns {Promise<Object>} Fitted pipeline
   */
  async fitPipeline(pipelineId, data) {
    try {
      logger.info(`Fitting pipeline: ${pipelineId}`);
      
      // Check if pipeline exists
      if (!this.pipelines.has(pipelineId)) {
        // Try to load from disk
        await this._loadPipeline(pipelineId);
        
        if (!this.pipelines.has(pipelineId)) {
          throw new Error(`Pipeline ${pipelineId} not found`);
        }
      }
      
      const pipeline = this.pipelines.get(pipelineId);
      let currentData = [...data]; // Clone to avoid modifying original
      
      // Fit each step in the pipeline
      for (let i = 0; i < pipeline.steps.length; i++) {
        const step = pipeline.steps[i];
        const transformer = this.transformers.get(step.type);
        
        logger.debug(`Fitting step ${i + 1}/${pipeline.steps.length}: ${step.id} (${step.type})`);
        
        // Fit the transformer on current data
        const params = await transformer.fit(currentData, step.options || {});
        pipeline.steps[i].params = params;
        
        // Transform the data for the next step
        currentData = await transformer.transform(currentData, params);
      }
      
      // Update pipeline status
      pipeline.status = 'fitted';
      pipeline.updatedAt = new Date();
      
      // Save fitted pipeline
      await this._savePipeline(pipeline);
      
      return pipeline;
    } catch (error) {
      logger.error(`Failed to fit pipeline ${pipelineId}`, error);
      throw error;
    }
  }
  
  /**
   * Transform data using a fitted pipeline
   * @param {string} pipelineId - Pipeline identifier
   * @param {Array<Object>} data - Data to transform
   * @returns {Promise<Array<Object>>} Transformed data
   */
  async transformData(pipelineId, data) {
    try {
      logger.info(`Transforming data with pipeline: ${pipelineId}`);
      
      // Check if pipeline exists
      if (!this.pipelines.has(pipelineId)) {
        // Try to load from disk
        await this._loadPipeline(pipelineId);
        
        if (!this.pipelines.has(pipelineId)) {
          throw new Error(`Pipeline ${pipelineId} not found`);
        }
      }
      
      const pipeline = this.pipelines.get(pipelineId);
      
      // Check if pipeline is fitted
      if (pipeline.status !== 'fitted') {
        throw new Error(`Pipeline ${pipelineId} is not fitted`);
      }
      
      let currentData = [...data]; // Clone to avoid modifying original
      
      // Apply each step in the pipeline
      for (const step of pipeline.steps) {
        const transformer = this.transformers.get(step.type);
        
        // Transform the data using fitted parameters
        currentData = await transformer.transform(currentData, step.params);
      }
      
      return currentData;
    } catch (error) {
      logger.error(`Failed to transform data with pipeline ${pipelineId}`, error);
      throw error;
    }
  }
  
  /**
   * Get a pipeline by ID
   * @param {string} pipelineId - Pipeline identifier
   * @returns {Promise<Object>} Pipeline
   */
  async getPipeline(pipelineId) {
    try {
      // Check if pipeline is in memory
      if (this.pipelines.has(pipelineId)) {
        return this.pipelines.get(pipelineId);
      }
      
      // Try to load from disk
      await this._loadPipeline(pipelineId);
      
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
   * Get all available pipelines
   * @returns {Promise<Array<Object>>} List of pipelines
   */
  async getAvailablePipelines() {
    try {
      const pipelineDir = this.options.pipelineStoragePath;
      
      try {
        await fs.access(pipelineDir);
      } catch (error) {
        // Create directory if it doesn't exist
        await fs.mkdir(pipelineDir, { recursive: true });
        return [];
      }
      
      // Get JSON files in the directory
      const files = await fs.readdir(pipelineDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      // Load each pipeline
      const pipelines = [];
      
      for (const file of jsonFiles) {
        try {
          const pipelineId = file.replace('.json', '');
          const pipeline = await this.getPipeline(pipelineId);
          pipelines.push(pipeline);
        } catch (error) {
          logger.warn(`Error loading pipeline from ${file}`, error);
        }
      }
      
      return pipelines;
    } catch (error) {
      logger.error('Error getting available pipelines', error);
      throw error;
    }
  }
  
  /**
   * Delete a pipeline
   * @param {string} pipelineId - Pipeline identifier
   * @returns {Promise<boolean>} True if deleted
   */
  async deletePipeline(pipelineId) {
    try {
      logger.info(`Deleting pipeline: ${pipelineId}`);
      
      // Remove from memory
      this.pipelines.delete(pipelineId);
      
      // Remove from disk
      const pipelinePath = path.join(this.options.pipelineStoragePath, `${pipelineId}.json`);
      
      try {
        await fs.unlink(pipelinePath);
        return true;
      } catch (error) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, which is fine
          return true;
        }
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to delete pipeline ${pipelineId}`, error);
      throw error;
    }
  }
  
  /**
   * Save pipeline to disk
   * @param {Object} pipeline - Pipeline to save
   * @private
   */
  async _savePipeline(pipeline) {
    try {
      const pipelineDir = this.options.pipelineStoragePath;
      
      // Ensure directory exists
      await fs.mkdir(pipelineDir, { recursive: true });
      
      // Write pipeline to file
      const pipelinePath = path.join(pipelineDir, `${pipeline.id}.json`);
      await fs.writeFile(
        pipelinePath,
        JSON.stringify(pipeline, null, 2)
      );
      
      logger.debug(`Pipeline ${pipeline.id} saved to ${pipelinePath}`);
    } catch (error) {
      logger.error(`Failed to save pipeline ${pipeline.id}`, error);
      throw error;
    }
  }
  
  /**
   * Load pipeline from disk
   * @param {string} pipelineId - Pipeline identifier
   * @private
   */
  async _loadPipeline(pipelineId) {
    try {
      const pipelinePath = path.join(this.options.pipelineStoragePath, `${pipelineId}.json`);
      
      // Check if file exists
      try {
        await fs.access(pipelinePath);
      } catch (error) {
        throw new Error(`Pipeline ${pipelineId} not found`);
      }
      
      // Read and parse pipeline
      const pipelineData = await fs.readFile(pipelinePath, 'utf8');
      const pipeline = JSON.parse(pipelineData);
      
      // Store in memory
      this.pipelines.set(pipelineId, pipeline);
      
      logger.debug(`Pipeline ${pipelineId} loaded from ${pipelinePath}`);
    } catch (error) {
      logger.error(`Failed to load pipeline ${pipelineId}`, error);
      throw error;
    }
  }
}

module.exports = {
  FeatureEngineeringService,
  FeatureType,
  TransformationType
}; 