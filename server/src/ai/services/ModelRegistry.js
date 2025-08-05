/**
 * ModelRegistry.js
 * 
 * Service for model registry management
 * Implements RF052 - Add model registry
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Model status enum
 * @enum {string}
 */
const ModelStatus = {
  DRAFT: 'draft',
  STAGING: 'staging',
  PRODUCTION: 'production',
  ARCHIVED: 'archived'
};

/**
 * Model lifecycle stage enum
 * @enum {string}
 */
const ModelStage = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  VALIDATION: 'validation',
  DEPLOYMENT: 'deployment',
  MONITORING: 'monitoring',
  RETIRED: 'retired'
};

/**
 * Model Registry Service
 * Provides centralized model management and versioning
 */
class ModelRegistry {
  /**
   * Create a new model registry service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      registryStoragePath: process.env.ML_REGISTRY_STORAGE_PATH || path.join(__dirname, '../../../..', 'ml-registry'),
      modelStoragePath: process.env.ML_MODEL_STORAGE_PATH || path.join(__dirname, '../../../..', 'ml-models'),
      ...options
    };
    
    this.eventEmitter = new EventEmitter();
    this.models = new Map();
    
    // Initialize registry
    this._initialize();
  }
  
  /**
   * Initialize the model registry
   * @private
   */
  async _initialize() {
    try {
      // Ensure registry directory exists
      await fs.mkdir(this.options.registryStoragePath, { recursive: true });
      
      // Load registry data
      await this._loadRegistry();
      
      logger.info('Model Registry initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Model Registry', error);
    }
  }
  
  /**
   * Load registry data from disk
   * @private
   */
  async _loadRegistry() {
    try {
      const registryPath = path.join(this.options.registryStoragePath, 'registry.json');
      
      try {
        await fs.access(registryPath);
        
        // Read registry file
        const registryData = await fs.readFile(registryPath, 'utf8');
        const registry = JSON.parse(registryData);
        
        // Load models into memory
        for (const modelName in registry.models) {
          this.models.set(modelName, registry.models[modelName]);
        }
        
        logger.info(`Loaded ${this.models.size} models from registry`);
      } catch (error) {
        // Registry file doesn't exist, create a new one
        await this._saveRegistry();
        logger.info('Created new registry file');
      }
    } catch (error) {
      logger.error('Error loading registry', error);
      throw error;
    }
  }
  
  /**
   * Save registry data to disk
   * @private
   */
  async _saveRegistry() {
    try {
      const registryPath = path.join(this.options.registryStoragePath, 'registry.json');
      
      // Convert models map to object
      const registry = {
        lastUpdated: new Date().toISOString(),
        models: {}
      };
      
      for (const [modelName, model] of this.models.entries()) {
        registry.models[modelName] = model;
      }
      
      // Write registry file
      await fs.writeFile(
        registryPath,
        JSON.stringify(registry, null, 2)
      );
      
      logger.debug('Registry saved successfully');
    } catch (error) {
      logger.error('Error saving registry', error);
      throw error;
    }
  }
  
  /**
   * Register a new model
   * @param {string} modelName - Unique model name
   * @param {Object} metadata - Model metadata
   * @returns {Promise<Object>} Registered model
   */
  async registerModel(modelName, metadata = {}) {
    try {
      logger.info(`Registering model: ${modelName}`);
      
      // Check if model already exists
      if (this.models.has(modelName)) {
        throw new Error(`Model ${modelName} already exists in registry`);
      }
      
      // Create model entry
      const model = {
        name: modelName,
        description: metadata.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: metadata.tags || [],
        versions: [],
        latestVersion: null,
        productionVersion: null,
        stagingVersion: null
      };
      
      // Store model in registry
      this.models.set(modelName, model);
      
      // Save registry
      await this._saveRegistry();
      
      // Create model directory in registry
      const modelDir = path.join(this.options.registryStoragePath, modelName);
      await fs.mkdir(modelDir, { recursive: true });
      
      return model;
    } catch (error) {
      logger.error(`Failed to register model ${modelName}`, error);
      throw error;
    }
  }
  
  /**
   * Add a new version to an existing model
   * @param {string} modelName - Model name
   * @param {string} modelId - Model ID in the model storage
   * @param {Object} metadata - Version metadata
   * @returns {Promise<Object>} Model version
   */
  async addModelVersion(modelName, modelId, metadata = {}) {
    try {
      logger.info(`Adding version for model ${modelName} from model ID ${modelId}`);
      
      // Check if model exists in registry
      if (!this.models.has(modelName)) {
        throw new Error(`Model ${modelName} not found in registry`);
      }
      
      // Check if model exists in storage
      const modelPath = path.join(this.options.modelStoragePath, modelId);
      try {
        await fs.access(modelPath);
      } catch (error) {
        throw new Error(`Model ${modelId} not found in storage`);
      }
      
      // Read model metadata
      const modelMetadataPath = path.join(modelPath, 'metadata.json');
      let modelMetadata = {};
      
      try {
        const metadataContent = await fs.readFile(modelMetadataPath, 'utf8');
        modelMetadata = JSON.parse(metadataContent);
      } catch (error) {
        logger.warn(`No metadata found for model ${modelId}`);
      }
      
      // Generate version number
      const model = this.models.get(modelName);
      const versionNumber = model.versions.length + 1;
      const versionString = `v${versionNumber}`;
      
      // Create version entry
      const version = {
        version: versionString,
        versionNumber,
        modelId,
        createdAt: new Date().toISOString(),
        createdBy: metadata.createdBy || 'system',
        status: ModelStatus.DRAFT,
        stage: ModelStage.DEVELOPMENT,
        description: metadata.description || '',
        metrics: metadata.metrics || {},
        parameters: metadata.parameters || {},
        tags: metadata.tags || [],
        artifacts: [],
        sourceCommit: metadata.sourceCommit || null,
        experimentId: metadata.experimentId || null,
        datasetId: metadata.datasetId || null,
        pipelineId: metadata.pipelineId || null,
        type: modelMetadata.type || 'unknown',
        framework: modelMetadata.framework || 'unknown',
        runtime: modelMetadata.runtime || 'unknown'
      };
      
      // Add version to model
      model.versions.push(version);
      model.latestVersion = versionString;
      model.updatedAt = new Date().toISOString();
      
      // Save registry
      await this._saveRegistry();
      
      // Create version directory in registry
      const versionDir = path.join(this.options.registryStoragePath, modelName, versionString);
      await fs.mkdir(versionDir, { recursive: true });
      
      // Create version metadata file
      await fs.writeFile(
        path.join(versionDir, 'metadata.json'),
        JSON.stringify(version, null, 2)
      );
      
      // Create symlink to model in storage
      const symlinkPath = path.join(versionDir, 'model');
      try {
        await fs.symlink(modelPath, symlinkPath);
      } catch (error) {
        logger.warn(`Failed to create symlink for model ${modelId}`, error);
      }
      
      return version;
    } catch (error) {
      logger.error(`Failed to add version for model ${modelName}`, error);
      throw error;
    }
  }
  
  /**
   * Get a model from the registry
   * @param {string} modelName - Model name
   * @returns {Promise<Object>} Model
   */
  async getModel(modelName) {
    try {
      // Check if model exists
      if (!this.models.has(modelName)) {
        throw new Error(`Model ${modelName} not found in registry`);
      }
      
      return this.models.get(modelName);
    } catch (error) {
      logger.error(`Failed to get model ${modelName}`, error);
      throw error;
    }
  }
  
  /**
   * Get all models in the registry
   * @returns {Promise<Array<Object>>} List of models
   */
  async getModels() {
    try {
      return Array.from(this.models.values());
    } catch (error) {
      logger.error('Failed to get models', error);
      throw error;
    }
  }
  
  /**
   * Get a specific version of a model
   * @param {string} modelName - Model name
   * @param {string} version - Version string
   * @returns {Promise<Object>} Model version
   */
  async getModelVersion(modelName, version) {
    try {
      // Check if model exists
      if (!this.models.has(modelName)) {
        throw new Error(`Model ${modelName} not found in registry`);
      }
      
      const model = this.models.get(modelName);
      
      // Find version
      const modelVersion = model.versions.find(v => v.version === version);
      
      if (!modelVersion) {
        throw new Error(`Version ${version} not found for model ${modelName}`);
      }
      
      return modelVersion;
    } catch (error) {
      logger.error(`Failed to get version ${version} for model ${modelName}`, error);
      throw error;
    }
  }
  
  /**
   * Update model version status
   * @param {string} modelName - Model name
   * @param {string} version - Version string
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated model version
   */
  async updateModelVersionStatus(modelName, version, status) {
    try {
      // Validate status
      if (!Object.values(ModelStatus).includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }
      
      // Get model version
      const modelVersion = await this.getModelVersion(modelName, version);
      
      // Update status
      modelVersion.status = status;
      
      // Update model references
      const model = this.models.get(modelName);
      
      if (status === ModelStatus.PRODUCTION) {
        model.productionVersion = version;
      } else if (status === ModelStatus.STAGING) {
        model.stagingVersion = version;
      } else if (status === ModelStatus.ARCHIVED && 
                (model.productionVersion === version || model.stagingVersion === version)) {
        if (model.productionVersion === version) {
          model.productionVersion = null;
        }
        if (model.stagingVersion === version) {
          model.stagingVersion = null;
        }
      }
      
      model.updatedAt = new Date().toISOString();
      
      // Save registry
      await this._saveRegistry();
      
      // Update version metadata file
      const versionDir = path.join(this.options.registryStoragePath, modelName, version);
      await fs.writeFile(
        path.join(versionDir, 'metadata.json'),
        JSON.stringify(modelVersion, null, 2)
      );
      
      return modelVersion;
    } catch (error) {
      logger.error(`Failed to update status for model ${modelName} version ${version}`, error);
      throw error;
    }
  }
  
  /**
   * Update model version stage
   * @param {string} modelName - Model name
   * @param {string} version - Version string
   * @param {string} stage - New lifecycle stage
   * @returns {Promise<Object>} Updated model version
   */
  async updateModelVersionStage(modelName, version, stage) {
    try {
      // Validate stage
      if (!Object.values(ModelStage).includes(stage)) {
        throw new Error(`Invalid stage: ${stage}`);
      }
      
      // Get model version
      const modelVersion = await this.getModelVersion(modelName, version);
      
      // Update stage
      modelVersion.stage = stage;
      
      // Update model
      const model = this.models.get(modelName);
      model.updatedAt = new Date().toISOString();
      
      // Save registry
      await this._saveRegistry();
      
      // Update version metadata file
      const versionDir = path.join(this.options.registryStoragePath, modelName, version);
      await fs.writeFile(
        path.join(versionDir, 'metadata.json'),
        JSON.stringify(modelVersion, null, 2)
      );
      
      return modelVersion;
    } catch (error) {
      logger.error(`Failed to update stage for model ${modelName} version ${version}`, error);
      throw error;
    }
  }
  
  /**
   * Add metrics to a model version
   * @param {string} modelName - Model name
   * @param {string} version - Version string
   * @param {Object} metrics - Metrics to add
   * @returns {Promise<Object>} Updated model version
   */
  async addModelVersionMetrics(modelName, version, metrics) {
    try {
      // Get model version
      const modelVersion = await this.getModelVersion(modelName, version);
      
      // Update metrics
      modelVersion.metrics = {
        ...modelVersion.metrics,
        ...metrics,
        updatedAt: new Date().toISOString()
      };
      
      // Update model
      const model = this.models.get(modelName);
      model.updatedAt = new Date().toISOString();
      
      // Save registry
      await this._saveRegistry();
      
      // Update version metadata file
      const versionDir = path.join(this.options.registryStoragePath, modelName, version);
      await fs.writeFile(
        path.join(versionDir, 'metadata.json'),
        JSON.stringify(modelVersion, null, 2)
      );
      
      return modelVersion;
    } catch (error) {
      logger.error(`Failed to add metrics for model ${modelName} version ${version}`, error);
      throw error;
    }
  }
  
  /**
   * Add an artifact to a model version
   * @param {string} modelName - Model name
   * @param {string} version - Version string
   * @param {string} artifactPath - Path to artifact file
   * @param {string} artifactType - Type of artifact
   * @returns {Promise<Object>} Updated model version
   */
  async addModelVersionArtifact(modelName, version, artifactPath, artifactType) {
    try {
      // Get model version
      const modelVersion = await this.getModelVersion(modelName, version);
      
      // Generate artifact ID
      const artifactId = crypto.randomBytes(8).toString('hex');
      
      // Create artifact directory
      const versionDir = path.join(this.options.registryStoragePath, modelName, version);
      const artifactsDir = path.join(versionDir, 'artifacts');
      await fs.mkdir(artifactsDir, { recursive: true });
      
      // Copy artifact file
      const artifactFilename = path.basename(artifactPath);
      const destPath = path.join(artifactsDir, `${artifactId}-${artifactFilename}`);
      
      const fileContent = await fs.readFile(artifactPath);
      await fs.writeFile(destPath, fileContent);
      
      // Create artifact entry
      const artifact = {
        id: artifactId,
        type: artifactType,
        filename: artifactFilename,
        path: destPath,
        createdAt: new Date().toISOString()
      };
      
      // Add artifact to version
      modelVersion.artifacts.push(artifact);
      
      // Update model
      const model = this.models.get(modelName);
      model.updatedAt = new Date().toISOString();
      
      // Save registry
      await this._saveRegistry();
      
      // Update version metadata file
      await fs.writeFile(
        path.join(versionDir, 'metadata.json'),
        JSON.stringify(modelVersion, null, 2)
      );
      
      return modelVersion;
    } catch (error) {
      logger.error(`Failed to add artifact for model ${modelName} version ${version}`, error);
      throw error;
    }
  }
  
  /**
   * Delete a model from the registry
   * @param {string} modelName - Model name
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteModel(modelName) {
    try {
      // Check if model exists
      if (!this.models.has(modelName)) {
        throw new Error(`Model ${modelName} not found in registry`);
      }
      
      // Remove from registry
      this.models.delete(modelName);
      
      // Save registry
      await this._saveRegistry();
      
      // Remove model directory from registry
      const modelDir = path.join(this.options.registryStoragePath, modelName);
      await fs.rm(modelDir, { recursive: true, force: true });
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete model ${modelName}`, error);
      throw error;
    }
  }
  
  /**
   * Search models by tags
   * @param {Array<string>} tags - Tags to search for
   * @returns {Promise<Array<Object>>} Matching models
   */
  async searchModelsByTags(tags) {
    try {
      if (!tags || !Array.isArray(tags) || tags.length === 0) {
        return [];
      }
      
      const results = [];
      
      for (const model of this.models.values()) {
        // Check if model has any of the specified tags
        const hasTag = tags.some(tag => model.tags.includes(tag));
        
        if (hasTag) {
          results.push(model);
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Failed to search models by tags', error);
      throw error;
    }
  }
  
  /**
   * Get production model version
   * @param {string} modelName - Model name
   * @returns {Promise<Object>} Production model version
   */
  async getProductionVersion(modelName) {
    try {
      // Check if model exists
      if (!this.models.has(modelName)) {
        throw new Error(`Model ${modelName} not found in registry`);
      }
      
      const model = this.models.get(modelName);
      
      if (!model.productionVersion) {
        throw new Error(`No production version set for model ${modelName}`);
      }
      
      return this.getModelVersion(modelName, model.productionVersion);
    } catch (error) {
      logger.error(`Failed to get production version for model ${modelName}`, error);
      throw error;
    }
  }
  
  /**
   * Get staging model version
   * @param {string} modelName - Model name
   * @returns {Promise<Object>} Staging model version
   */
  async getStagingVersion(modelName) {
    try {
      // Check if model exists
      if (!this.models.has(modelName)) {
        throw new Error(`Model ${modelName} not found in registry`);
      }
      
      const model = this.models.get(modelName);
      
      if (!model.stagingVersion) {
        throw new Error(`No staging version set for model ${modelName}`);
      }
      
      return this.getModelVersion(modelName, model.stagingVersion);
    } catch (error) {
      logger.error(`Failed to get staging version for model ${modelName}`, error);
      throw error;
    }
  }
  
  /**
   * Import a model from storage into registry
   * @param {string} modelId - Model ID in storage
   * @param {string} modelName - Name to register in registry
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} Model version
   */
  async importModel(modelId, modelName, metadata = {}) {
    try {
      logger.info(`Importing model ${modelId} as ${modelName}`);
      
      // Check if model exists in registry
      let model;
      
      if (this.models.has(modelName)) {
        model = this.models.get(modelName);
        logger.info(`Model ${modelName} already exists in registry, adding version`);
      } else {
        // Register new model
        model = await this.registerModel(modelName, metadata);
        logger.info(`Registered new model ${modelName} in registry`);
      }
      
      // Add version
      const version = await this.addModelVersion(modelName, modelId, metadata);
      logger.info(`Added version ${version.version} to model ${modelName}`);
      
      return {
        model,
        version
      };
    } catch (error) {
      logger.error(`Failed to import model ${modelId} as ${modelName}`, error);
      throw error;
    }
  }
}

module.exports = {
  ModelRegistry,
  ModelStatus,
  ModelStage
}; 