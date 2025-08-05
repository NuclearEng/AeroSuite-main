/**
 * ml-service-example.js
 * 
 * Example script demonstrating the ML service infrastructure
 * Implements RF049 - Set up ML service infrastructure
 */

const path = require('path');
const fs = require('fs').promises;
const { mlService, ModelType } = require('../ai');
const logger = require('../ai/utils/logger');

/**
 * Example ML service usage
 */
async function runMLServiceExample() {
  try {
    logger.info('Starting ML service example');
    
    // Create example model directory and metadata
    await createExampleModel();
    
    // Get available models
    logger.info('Getting available models');
    const availableModels = await mlService.getAvailableModels();
    logger.info(`Found ${availableModels.length} available models:`);
    console.log(availableModels);
    
    // Load a model
    const modelId = 'example-model';
    const modelType = ModelType.TENSORFLOW_JS;
    
    logger.info(`Loading model: ${modelId} (${modelType})`);
    await mlService.loadModel(modelId, modelType);
    
    // Check active models
    const activeModels = mlService.getActiveModels();
    logger.info(`Active models: ${activeModels.length}`);
    console.log(activeModels);
    
    // Run inference
    logger.info('Running inference');
    const inputData = {
      features: [1.0, 2.0, 3.0, 4.0]
    };
    
    const result = await mlService.runInference(modelId, inputData);
    logger.info('Inference result:');
    console.log(result);
    
    // Run batch inference
    logger.info('Running batch inference');
    const batchResults = await Promise.all([
      mlService.queueInference(modelId, { features: [1.0, 2.0, 3.0, 4.0] }),
      mlService.queueInference(modelId, { features: [2.0, 3.0, 4.0, 5.0] }),
      mlService.queueInference(modelId, { features: [3.0, 4.0, 5.0, 6.0] })
    ]);
    
    logger.info('Batch inference results:');
    console.log(batchResults);
    
    // Unload model
    logger.info(`Unloading model: ${modelId}`);
    await mlService.unloadModel(modelId);
    
    logger.info('ML service example completed successfully');
  } catch (error) {
    logger.error('Error in ML service example', error);
  }
}

/**
 * Create an example model for demonstration
 */
async function createExampleModel() {
  try {
    // Create model directory
    const modelDir = path.join(__dirname, '../../../ml-models/example-model');
    await fs.mkdir(modelDir, { recursive: true });
    
    // Create metadata file
    const metadata = {
      name: 'Example TensorFlow.js Model',
      type: ModelType.TENSORFLOW_JS,
      version: '1.0.0',
      description: 'An example model for demonstration purposes',
      createdAt: new Date().toISOString(),
      inputShape: [4],
      outputShape: [2]
    };
    
    await fs.writeFile(
      path.join(modelDir, 'metadata.json'),
      JSON.stringify(metadata, null, 2)
    );
    
    // Create placeholder model files
    await fs.writeFile(
      path.join(modelDir, 'model.json'),
      JSON.stringify({
        format: 'layers-model',
        generatedBy: 'AeroSuite ML Service Example',
        convertedBy: 'AeroSuite ML Service Example',
        modelTopology: {
          'class_name': 'Sequential',
          'config': {
            'name': 'example_model'
          }
        }
      }, null, 2)
    );
    
    logger.info(`Created example model at ${modelDir}`);
  } catch (error) {
    logger.error('Error creating example model', error);
    throw error;
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  runMLServiceExample()
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
    runMLServiceExample
  };
} 