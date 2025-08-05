/**
 * model-registry-example.js
 * 
 * Example script demonstrating the model registry
 * Implements RF052 - Add model registry
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../ai/utils/logger');
const { ModelRegistry, ModelStatus, ModelStage } = require('../ai/services/ModelRegistry');

// API base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// API authentication token (for demonstration purposes)
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'demo-token';

// Create axios instance with authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Example of using the model registry directly
 */
async function runModelRegistryExample() {
  try {
    logger.info('Starting model registry example');
    
    // Create a model registry instance
    const registry = new ModelRegistry();
    
    // Register a new model
    const modelName = 'example-model-' + Date.now();
    logger.info(`Registering model: ${modelName}`);
    
    const model = await registry.registerModel(modelName, {
      description: 'Example model for demonstration',
      tags: ['example', 'demo', 'tensorflow']
    });
    
    logger.info('Model registered successfully:', model);
    
    // Create a sample model ID (simulating an existing model in storage)
    const modelId = 'sample-model-' + Date.now();
    const modelDir = path.join(registry.options.modelStoragePath, modelId);
    
    // Create model directory and metadata
    await fs.mkdir(modelDir, { recursive: true });
    await fs.writeFile(
      path.join(modelDir, 'metadata.json'),
      JSON.stringify({
        name: modelId,
        type: 'tensorflow-js',
        version: '1.0.0',
        framework: 'tensorflow',
        runtime: 'node',
        description: 'Sample model for testing'
      }, null, 2)
    );
    
    // Create dummy model file
    await fs.writeFile(
      path.join(modelDir, 'model.json'),
      JSON.stringify({
        format: 'layers-model',
        generatedBy: 'TensorFlow.js v3.0.0',
        convertedBy: 'TensorFlow.js Converter v3.0.0',
        modelTopology: {},
        weightsManifest: []
      }, null, 2)
    );
    
    // Add a version to the model
    logger.info(`Adding version to model ${modelName} from model ID ${modelId}`);
    
    const version = await registry.addModelVersion(modelName, modelId, {
      description: 'Initial version',
      tags: ['initial', 'v1'],
      metrics: {
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.94,
        f1Score: 0.91
      },
      parameters: {
        learningRate: 0.001,
        batchSize: 32,
        epochs: 10,
        optimizer: 'adam'
      },
      experimentId: 'exp-001',
      datasetId: 'dataset-001'
    });
    
    logger.info(`Version ${version.version} added successfully:`, version);
    
    // Update version status to staging
    logger.info(`Updating version ${version.version} status to staging`);
    
    const updatedVersion = await registry.updateModelVersionStatus(
      modelName,
      version.version,
      ModelStatus.STAGING
    );
    
    logger.info('Version status updated successfully:', updatedVersion);
    
    // Get the staging version
    logger.info(`Getting staging version for model ${modelName}`);
    
    const stagingVersion = await registry.getStagingVersion(modelName);
    logger.info('Staging version:', stagingVersion);
    
    // Update lifecycle stage
    logger.info(`Updating lifecycle stage to ${ModelStage.TESTING}`);
    
    const versionWithStage = await registry.updateModelVersionStage(
      modelName,
      version.version,
      ModelStage.TESTING
    );
    
    logger.info('Lifecycle stage updated successfully:', versionWithStage);
    
    // Add metrics
    logger.info('Adding additional metrics');
    
    const versionWithMetrics = await registry.addModelVersionMetrics(
      modelName,
      version.version,
      {
        latency: 15.3, // ms
        throughput: 120.5, // requests/sec
        memoryUsage: 256.7, // MB
        inferenceTime: 8.2 // ms
      }
    );
    
    logger.info('Metrics added successfully:', versionWithMetrics.metrics);
    
    // Create a sample artifact
    const artifactPath = path.join(modelDir, 'confusion_matrix.png');
    await fs.writeFile(artifactPath, 'dummy image data');
    
    // Add artifact
    logger.info('Adding artifact');
    
    const versionWithArtifact = await registry.addModelVersionArtifact(
      modelName,
      version.version,
      artifactPath,
      'confusion_matrix'
    );
    
    logger.info('Artifact added successfully:', versionWithArtifact.artifacts);
    
    // Promote to production
    logger.info('Promoting version to production');
    
    const productionVersion = await registry.updateModelVersionStatus(
      modelName,
      version.version,
      ModelStatus.PRODUCTION
    );
    
    logger.info('Version promoted to production:', productionVersion);
    
    // Get all models
    logger.info('Getting all registered models');
    
    const allModels = await registry.getModels();
    logger.info(`Found ${allModels.length} registered models`);
    
    // Clean up (optional)
    // Uncomment to delete the model after the example
    // await registry.deleteModel(modelName);
    // logger.info(`Model ${modelName} deleted`);
    
    return {
      modelName,
      modelId,
      versionNumber: version.versionNumber,
      versionString: version.version,
      status: productionVersion.status,
      stage: productionVersion.stage
    };
  } catch (error) {
    logger.error('Error in model registry example', error);
    throw error;
  }
}

/**
 * Example of using the model registry API
 */
async function runModelRegistryAPIExample() {
  try {
    logger.info('Starting model registry API example');
    
    // Register a new model
    const modelName = 'api-example-model-' + Date.now();
    logger.info(`Registering model: ${modelName}`);
    
    const registerResponse = await api.post('/registry/models', {
      modelName,
      description: 'Example model created via API',
      tags: ['api', 'example', 'demo']
    });
    
    logger.info('Model registered successfully:', registerResponse.data);
    
    // Create a sample model ID (simulating an existing model in storage)
    // For this example, we'll use the ML API to upload a model
    
    // First, create a temporary model file
    const tempDir = path.join(__dirname, 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    
    const modelFilePath = path.join(tempDir, 'model.json');
    await fs.writeFile(
      modelFilePath,
      JSON.stringify({
        format: 'layers-model',
        generatedBy: 'TensorFlow.js v3.0.0',
        convertedBy: 'TensorFlow.js Converter v3.0.0',
        modelTopology: {},
        weightsManifest: []
      }, null, 2)
    );
    
    // Use FormData for file upload
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('files', await fs.readFile(modelFilePath), 'model.json');
    formData.append('modelId', `api-model-${Date.now()}`);
    formData.append('modelType', 'tensorflow-js');
    formData.append('modelName', 'API Test Model');
    formData.append('description', 'Model uploaded via API for testing');
    
    // Upload the model
    const uploadResponse = await axios.post(`${API_BASE_URL}/ml/models/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    const modelId = uploadResponse.data.data.id;
    logger.info(`Model uploaded with ID: ${modelId}`);
    
    // Add a version to the model
    logger.info(`Adding version to model ${modelName} from model ID ${modelId}`);
    
    const versionResponse = await api.post(`/registry/models/${modelName}/versions`, {
      modelId,
      description: 'Initial version via API',
      tags: ['initial', 'v1', 'api'],
      metrics: {
        accuracy: 0.94,
        precision: 0.92,
        recall: 0.95,
        f1Score: 0.93
      },
      parameters: {
        learningRate: 0.0005,
        batchSize: 64,
        epochs: 20,
        optimizer: 'adam'
      },
      experimentId: 'api-exp-001',
      datasetId: 'api-dataset-001'
    });
    
    const version = versionResponse.data.data;
    logger.info(`Version ${version.version} added successfully:`, version);
    
    // Update version status to staging
    logger.info(`Updating version ${version.version} status to staging`);
    
    const statusResponse = await api.patch(`/registry/models/${modelName}/versions/${version.version}/status`, {
      status: ModelStatus.STAGING
    });
    
    logger.info('Version status updated successfully:', statusResponse.data);
    
    // Get the staging version
    logger.info(`Getting staging version for model ${modelName}`);
    
    const stagingResponse = await api.get(`/registry/models/${modelName}/staging`);
    logger.info('Staging version:', stagingResponse.data);
    
    // Update lifecycle stage
    logger.info(`Updating lifecycle stage to ${ModelStage.TESTING}`);
    
    const stageResponse = await api.patch(`/registry/models/${modelName}/versions/${version.version}/stage`, {
      stage: ModelStage.TESTING
    });
    
    logger.info('Lifecycle stage updated successfully:', stageResponse.data);
    
    // Add metrics
    logger.info('Adding additional metrics');
    
    const metricsResponse = await api.post(`/registry/models/${modelName}/versions/${version.version}/metrics`, {
      metrics: {
        latency: 12.8, // ms
        throughput: 145.2, // requests/sec
        memoryUsage: 198.4, // MB
        inferenceTime: 6.5 // ms
      }
    });
    
    logger.info('Metrics added successfully:', metricsResponse.data);
    
    // Get available status options
    const statusOptionsResponse = await api.get('/registry/status-options');
    logger.info('Available status options:', statusOptionsResponse.data);
    
    // Get available stage options
    const stageOptionsResponse = await api.get('/registry/stage-options');
    logger.info('Available stage options:', stageOptionsResponse.data);
    
    // Get all models
    logger.info('Getting all registered models');
    
    const modelsResponse = await api.get('/registry/models');
    logger.info(`Found ${modelsResponse.data.count} registered models`);
    
    // Clean up temporary files
    await fs.rm(tempDir, { recursive: true, force: true });
    
    // Clean up (optional)
    // Uncomment to delete the model after the example
    // await api.delete(`/registry/models/${modelName}`);
    // logger.info(`Model ${modelName} deleted`);
    
    return {
      modelName,
      modelId,
      versionNumber: version.versionNumber,
      versionString: version.version
    };
  } catch (error) {
    logger.error('Error in model registry API example', error);
    if (error.response) {
      logger.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run the examples if this script is executed directly
if (require.main === module) {
  (async () => {
    try {
      // Run the direct service example
      logger.info('=== Running direct service example ===');
      const serviceResult = await runModelRegistryExample();
      logger.info('Service example completed successfully', serviceResult);
      
      // Run the API example
      logger.info('\n=== Running API example ===');
      const apiResult = await runModelRegistryAPIExample();
      logger.info('API example completed successfully', apiResult);
      
      process.exit(0);
    } catch (error) {
      logger.error('Example script failed', error);
      process.exit(1);
    }
  })();
} else {
  // Export for use as a module
  module.exports = {
    runModelRegistryExample,
    runModelRegistryAPIExample
  };
} 