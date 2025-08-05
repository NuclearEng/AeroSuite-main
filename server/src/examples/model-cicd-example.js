/**
 * model-cicd-example.js
 * 
 * Example script demonstrating model CI/CD pipeline
 * Implements RF056 - Create CI/CD pipeline for models
 */

const path = require('path');
const fs = require('fs').promises;
const logger = require('../ai/utils/logger');
const { ModelCICDService, PipelineStage } = require('../ai/services/ModelCICDService');
const { ModelRegistry, ModelStatus } = require('../ai/services/ModelRegistry');
const { ModelEvaluationService } = require('../ai/services/ModelEvaluationService');
const { ExperimentTrackingService } = require('../ai/services/ExperimentTrackingService');

/**
 * Example of using the model CI/CD pipeline service
 */
async function runModelCICDExample() {
  try {
    logger.info('Starting model CI/CD example');
    
    // Create services
    const experimentTrackingService = new ExperimentTrackingService();
    const modelRegistry = new ModelRegistry();
    const modelEvaluationService = new ModelEvaluationService({
      experimentTrackingService,
      modelRegistry
    });
    const modelCICDService = new ModelCICDService({
      modelRegistry,
      modelEvaluationService,
      experimentTrackingService
    });
    
    // Create an experiment for tracking CI/CD results
    const experimentName = 'Model CI/CD Example ' + Date.now();
    logger.info(`Creating experiment: ${experimentName}`);
    
    const experiment = await experimentTrackingService.createExperiment(experimentName, {
      description: 'An experiment for tracking model CI/CD pipeline results',
      tags: ['cicd', 'example', 'demo'],
      framework: 'tensorflow'
    });
    
    logger.info('Experiment created successfully:', experiment);
    
    // Register a model in the registry
    const modelName = 'example-model';
    const modelVersion = '1.0.0';
    const modelId = `${modelName}@${modelVersion}`;
    
    logger.info(`Registering model: ${modelId}`);
    
    try {
      await modelRegistry.getModel(modelName);
      logger.info(`Model ${modelName} already exists in registry`);
    } catch (error) {
      await modelRegistry.registerModel(modelName, {
        description: 'Example model for CI/CD pipeline',
        framework: 'tensorflow',
        tags: ['example', 'demo']
      });
      logger.info(`Model ${modelName} registered successfully`);
    }
    
    try {
      await modelRegistry.getModelVersion(modelName, modelVersion);
      logger.info(`Model version ${modelId} already exists in registry`);
    } catch (error) {
      await modelRegistry.addModelVersion(modelName, modelVersion, {
        description: 'Initial version for CI/CD pipeline example',
        path: `/tmp/models/${modelName}/${modelVersion}`,
        status: ModelStatus.DRAFT,
        tags: ['example', 'demo']
      });
      logger.info(`Model version ${modelId} registered successfully`);
    }
    
    // Register test datasets
    const validationDatasetId = `validation-dataset-${Date.now()}`;
    const testingDatasetId = `testing-dataset-${Date.now()}`;
    
    logger.info(`Registering validation dataset: ${validationDatasetId}`);
    await modelEvaluationService.registerDataset(validationDatasetId, null, {
      name: 'Validation Dataset',
      description: 'Dataset for validation stage',
      type: 'classification',
      format: 'csv',
      features: ['feature1', 'feature2', 'feature3'],
      labels: ['label1', 'label2'],
      split: { train: 0.7, test: 0.3 }
    });
    
    logger.info(`Registering testing dataset: ${testingDatasetId}`);
    await modelEvaluationService.registerDataset(testingDatasetId, null, {
      name: 'Testing Dataset',
      description: 'Dataset for testing stage',
      type: 'classification',
      format: 'csv',
      features: ['feature1', 'feature2', 'feature3'],
      labels: ['label1', 'label2'],
      split: { train: 0.7, test: 0.3 }
    });
    
    // Create a CI/CD pipeline
    logger.info('Creating CI/CD pipeline');
    const pipeline = await modelCICDService.createPipeline(
      `CI/CD Pipeline for ${modelId}`,
      modelName,
      modelVersion,
      {
        stages: [
          PipelineStage.VALIDATION,
          PipelineStage.TESTING,
          PipelineStage.STAGING
        ],
        evaluationDatasets: {
          validation: validationDatasetId,
          testing: testingDatasetId
        },
        thresholds: {
          validation: {
            accuracy: { operator: '>=', value: 0.8 },
            f1_score: { operator: '>=', value: 0.75 }
          },
          testing: {
            accuracy: { operator: '>=', value: 0.75 },
            f1_score: { operator: '>=', value: 0.7 }
          }
        },
        experimentId: experiment.id,
        tags: ['example', 'demo'],
        promotionPolicy: 'automatic'
      }
    );
    
    logger.info('Pipeline created successfully:', pipeline);
    
    // Register event listeners
    modelCICDService.on('pipeline-stage-started', (event) => {
      logger.info(`Pipeline stage started: ${event.stage} (${event.pipelineId})`);
    });
    
    modelCICDService.on('pipeline-stage-completed', (event) => {
      logger.info(`Pipeline stage completed: ${event.stage} (${event.pipelineId})`);
      logger.info('Stage results:', event.result);
    });
    
    modelCICDService.on('pipeline-stage-failed', (event) => {
      logger.error(`Pipeline stage failed: ${event.stage} (${event.pipelineId})`);
      logger.error('Error:', event.error);
    });
    
    modelCICDService.on('pipeline-completed', (event) => {
      logger.info(`Pipeline completed: ${event.pipelineId}`);
    });
    
    modelCICDService.on('pipeline-failed', (event) => {
      logger.error(`Pipeline failed: ${event.pipelineId}`);
      if (event.error) {
        logger.error('Error:', event.error);
      }
    });
    
    // Start the pipeline
    logger.info('Starting pipeline');
    await modelCICDService.startPipeline(pipeline.id);
    
    // Wait for pipeline to complete
    logger.info('Waiting for pipeline to complete...');
    await new Promise((resolve) => {
      const checkInterval = setInterval(async () => {
        try {
          const currentPipeline = await modelCICDService.getPipeline(pipeline.id);
          
          if (currentPipeline.status === 'completed' || currentPipeline.status === 'failed') {
            clearInterval(checkInterval);
            logger.info(`Pipeline finished with status: ${currentPipeline.status}`);
            
            // Print stage results
            for (const [stage, result] of Object.entries(currentPipeline.stageResults)) {
              logger.info(`Stage ${stage} results:`, result);
            }
            
            resolve();
          }
        } catch (error) {
          logger.error('Error checking pipeline status', error);
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
    
    // Check model status in registry
    logger.info('Checking model status in registry');
    const model = await modelRegistry.getModelVersion(modelName, modelVersion);
    logger.info(`Model status: ${model.status}, stage: ${model.stage}`);
    
    logger.info('Model CI/CD example completed successfully');
    
    return {
      pipelineId: pipeline.id,
      modelId,
      experimentId: experiment.id
    };
  } catch (error) {
    logger.error('Error in model CI/CD example', error);
    throw error;
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  (async () => {
    try {
      logger.info('=== Running model CI/CD example ===');
      const result = await runModelCICDExample();
      logger.info('Example completed successfully', result);
      process.exit(0);
    } catch (error) {
      logger.error('Example script failed', error);
      process.exit(1);
    }
  })();
} else {
  // Export for use as a module
  module.exports = {
    runModelCICDExample
  };
} 