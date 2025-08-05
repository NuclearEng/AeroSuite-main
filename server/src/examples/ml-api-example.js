/**
 * ml-api-example.js
 * 
 * Example script demonstrating the ML model serving API endpoints
 * Implements RF050 - Implement model serving endpoints
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const logger = require('../ai/utils/logger');

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
 * Example of using the ML API endpoints
 */
async function runMLApiExample() {
  try {
    logger.info('Starting ML API example');
    
    // Step 1: Upload a model
    logger.info('Uploading a model');
    await uploadExampleModel();
    
    // Step 2: Get all available models
    logger.info('Getting available models');
    const models = await getAvailableModels();
    logger.info(`Found ${models.length} models`);
    
    if (models.length === 0) {
      logger.error('No models found. Upload may have failed.');
      return;
    }
    
    // Step 3: Load a model
    const modelId = 'example-api-model';
    logger.info(`Loading model: ${modelId}`);
    await loadModel(modelId);
    
    // Step 4: Get active models
    logger.info('Getting active models');
    const activeModels = await getActiveModels();
    logger.info(`Found ${activeModels.length} active models`);
    
    // Step 5: Run inference
    logger.info('Running inference');
    const inferenceResult = await runInference(modelId, {
      features: [1.0, 2.0, 3.0, 4.0]
    });
    logger.info('Inference result:');
    console.log(inferenceResult);
    
    // Step 6: Run batch inference
    logger.info('Running batch inference');
    const batchResult = await runBatchInference(modelId, [
      { features: [1.0, 2.0, 3.0, 4.0] },
      { features: [2.0, 3.0, 4.0, 5.0] },
      { features: [3.0, 4.0, 5.0, 6.0] }
    ]);
    logger.info('Batch inference result:');
    console.log(batchResult);
    
    // Step 7: Unload model
    logger.info(`Unloading model: ${modelId}`);
    await unloadModel(modelId);
    
    // Step 8: Delete model (optional)
    // Uncomment to delete the model
    // logger.info(`Deleting model: ${modelId}`);
    // await deleteModel(modelId);
    
    logger.info('ML API example completed successfully');
  } catch (error) {
    logger.error('Error in ML API example', error);
    if (error.response) {
      logger.error('Response data:', error.response.data);
    }
  }
}

/**
 * Upload an example model
 */
async function uploadExampleModel() {
  try {
    // Create model files
    const modelDir = path.join(__dirname, 'temp-model');
    await fs.promises.mkdir(modelDir, { recursive: true });
    
    // Create a simple model.json file
    const modelJson = {
      format: 'layers-model',
      generatedBy: 'AeroSuite ML API Example',
      convertedBy: 'AeroSuite ML API Example',
      modelTopology: {
        'class_name': 'Sequential',
        'config': {
          'name': 'example_api_model'
        }
      }
    };
    
    const modelJsonPath = path.join(modelDir, 'model.json');
    await fs.promises.writeFile(
      modelJsonPath,
      JSON.stringify(modelJson, null, 2)
    );
    
    // Create a weights file
    const weightsPath = path.join(modelDir, 'weights.bin');
    const dummyWeights = Buffer.alloc(1024); // 1KB of zeros
    await fs.promises.writeFile(weightsPath, dummyWeights);
    
    // Create form data
    const form = new FormData();
    form.append('modelId', 'example-api-model');
    form.append('modelType', 'tensorflow-js');
    form.append('modelName', 'Example API Model');
    form.append('description', 'A model uploaded through the API example');
    form.append('version', '1.0.0');
    form.append('files', fs.createReadStream(modelJsonPath));
    form.append('files', fs.createReadStream(weightsPath));
    
    // Upload model
    const response = await axios.post(`${API_BASE_URL}/ml/models/upload`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    logger.info('Model uploaded successfully:', response.data);
    
    // Clean up temporary files
    await fs.promises.unlink(modelJsonPath);
    await fs.promises.unlink(weightsPath);
    await fs.promises.rmdir(modelDir);
    
    return response.data;
  } catch (error) {
    logger.error('Error uploading model', error);
    throw error;
  }
}

/**
 * Get all available models
 */
async function getAvailableModels() {
  try {
    const response = await api.get('/ml/models');
    return response.data.data;
  } catch (error) {
    logger.error('Error getting available models', error);
    throw error;
  }
}

/**
 * Get active models
 */
async function getActiveModels() {
  try {
    const response = await api.get('/ml/models/active');
    return response.data.data;
  } catch (error) {
    logger.error('Error getting active models', error);
    throw error;
  }
}

/**
 * Load a model
 * @param {string} modelId - Model ID
 */
async function loadModel(modelId) {
  try {
    const response = await api.post(`/ml/models/${modelId}/load`, {
      type: 'tensorflow-js'
    });
    return response.data;
  } catch (error) {
    logger.error(`Error loading model ${modelId}`, error);
    throw error;
  }
}

/**
 * Unload a model
 * @param {string} modelId - Model ID
 */
async function unloadModel(modelId) {
  try {
    const response = await api.post(`/ml/models/${modelId}/unload`);
    return response.data;
  } catch (error) {
    logger.error(`Error unloading model ${modelId}`, error);
    throw error;
  }
}

/**
 * Run inference on a model
 * @param {string} modelId - Model ID
 * @param {*} input - Input data
 */
async function runInference(modelId, input) {
  try {
    const response = await api.post(`/ml/models/${modelId}/predict`, {
      input
    });
    return response.data;
  } catch (error) {
    logger.error(`Error running inference on model ${modelId}`, error);
    throw error;
  }
}

/**
 * Run batch inference on a model
 * @param {string} modelId - Model ID
 * @param {Array} inputs - Array of input data
 */
async function runBatchInference(modelId, inputs) {
  try {
    const response = await api.post(`/ml/models/${modelId}/batch-predict`, {
      inputs
    });
    return response.data;
  } catch (error) {
    logger.error(`Error running batch inference on model ${modelId}`, error);
    throw error;
  }
}

/**
 * Delete a model
 * @param {string} modelId - Model ID
 */
async function deleteModel(modelId) {
  try {
    const response = await api.delete(`/ml/models/${modelId}`);
    return response.data;
  } catch (error) {
    logger.error(`Error deleting model ${modelId}`, error);
    throw error;
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  runMLApiExample()
    .then(() => {
      logger.info('Example script completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Example script failed', error);
      process.exit(1);
    });
} else {
  // Export for use as a module
  module.exports = {
    runMLApiExample
  };
} 