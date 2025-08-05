/**
 * model-evaluation-example.js
 * 
 * Example script demonstrating model evaluation
 * Implements RF055 - Add automated model evaluation
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../ai/utils/logger');
const { ModelEvaluationService, EvaluationType } = require('../ai/services/ModelEvaluationService');
const { ModelRegistry } = require('../ai/services/ModelRegistry');
const { ExperimentTrackingService } = require('../ai/services/ExperimentTrackingService');

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
 * Example of using the model evaluation service directly
 */
async function runModelEvaluationExample() {
  try {
    logger.info('Starting model evaluation example');
    
    // Create services
    const experimentTrackingService = new ExperimentTrackingService();
    const modelRegistry = new ModelRegistry();
    const modelEvaluationService = new ModelEvaluationService({
      experimentTrackingService,
      modelRegistry
    });
    
    // Create an experiment for tracking evaluation results
    const experimentName = 'Model Evaluation Example ' + Date.now();
    logger.info(`Creating experiment: ${experimentName}`);
    
    const experiment = await experimentTrackingService.createExperiment(experimentName, {
      description: 'An experiment for tracking model evaluation results',
      tags: ['evaluation', 'example', 'demo'],
      framework: 'tensorflow'
    });
    
    logger.info('Experiment created successfully:', experiment);
    
    // Register a test dataset
    const datasetId = `test-dataset-${Date.now()}`;
    logger.info(`Registering dataset: ${datasetId}`);
    
    // Create a temporary dataset file
    const datasetPath = path.join(__dirname, 'temp-dataset.txt');
    await fs.writeFile(datasetPath, 'This is a sample dataset for demonstration purposes.');
    
    const dataset = await modelEvaluationService.registerDataset(datasetId, datasetPath, {
      name: 'Test Classification Dataset',
      description: 'A dataset for testing model evaluation',
      type: 'classification',
      format: 'csv',
      features: ['feature1', 'feature2', 'feature3'],
      labels: ['label1', 'label2', 'label3'],
      split: {
        train: 0.7,
        test: 0.2,
        validation: 0.1
      }
    });
    
    logger.info('Dataset registered successfully:', dataset);
    
    // Clean up temporary dataset file
    await fs.unlink(datasetPath);
    
    // Create model evaluations for different models
    const models = [
      'classifier-model@v1',
      'classifier-model@v2',
      'classifier-model@v3'
    ];
    
    const evaluations = [];
    
    for (const modelId of models) {
      const evaluationName = `Evaluation of ${modelId}`;
      logger.info(`Creating evaluation: ${evaluationName}`);
      
      const evaluation = await modelEvaluationService.createEvaluation(evaluationName, modelId, datasetId, {
        type: EvaluationType.CLASSIFICATION,
        parameters: {
          threshold: 0.5,
          batch_size: 32
        },
        experimentId: experiment.id,
        tags: ['classification', 'example']
      });
      
      evaluations.push(evaluation);
      logger.info(`Evaluation ${evaluation.id} created successfully`);
    }
    
    // Start all evaluations
    for (const evaluation of evaluations) {
      logger.info(`Starting evaluation: ${evaluation.id}`);
      await modelEvaluationService.startEvaluation(evaluation.id);
    }
    
    // Wait for evaluations to complete
    logger.info('Waiting for evaluations to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get all evaluations
    const completedEvaluations = await modelEvaluationService.getEvaluations({
      status: 'completed',
      datasetId
    });
    
    logger.info(`Completed ${completedEvaluations.length} evaluations`);
    
    // Compare evaluations
    if (completedEvaluations.length >= 2) {
      logger.info('Comparing evaluations');
      const comparisonResult = await modelEvaluationService.compareEvaluations(
        completedEvaluations.map(eval => eval.id)
      );
      
      logger.info('Evaluation comparison:');
      logger.info('- Accuracy comparison:', comparisonResult.metrics.accuracy);
      logger.info('- F1 score comparison:', comparisonResult.metrics.f1_score);
    }
    
    // Get best evaluation based on accuracy
    logger.info('Getting best evaluation based on accuracy');
    const bestEvaluation = await modelEvaluationService.getBestEvaluation(
      'classifier-model@v2',
      'accuracy',
      true
    );
    
    logger.info(`Best evaluation: ${bestEvaluation.name} with accuracy ${bestEvaluation.metrics.accuracy}`);
    
    logger.info('Model evaluation example completed successfully');
    
    return {
      experimentId: experiment.id,
      datasetId,
      evaluationIds: evaluations.map(eval => eval.id)
    };
  } catch (error) {
    logger.error('Error in model evaluation example', error);
    throw error;
  }
}

/**
 * Example of using the model evaluation API
 */
async function runModelEvaluationAPIExample() {
  try {
    logger.info('Starting model evaluation API example');
    
    // Register a dataset via API
    const datasetId = `api-dataset-${Date.now()}`;
    logger.info(`Registering dataset via API: ${datasetId}`);
    
    // Create a form data object for dataset upload
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('id', datasetId);
    form.append('name', 'API Test Dataset');
    form.append('description', 'A dataset registered via API');
    form.append('type', 'regression');
    form.append('format', 'csv');
    form.append('features', JSON.stringify(['x1', 'x2', 'x3']));
    form.append('labels', JSON.stringify(['y']));
    form.append('split', JSON.stringify({ train: 0.8, test: 0.2, validation: 0 }));
    
    // Create a temporary dataset file
    const datasetPath = path.join(__dirname, 'api-dataset.txt');
    await fs.writeFile(datasetPath, 'This is a sample dataset for API testing.');
    
    form.append('dataset', fs.createReadStream(datasetPath));
    
    // Register dataset via API
    const registerResponse = await axios.post(`${API_BASE_URL}/evaluations/datasets`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${AUTH_TOKEN}`
      }
    });
    
    logger.info('Dataset registered successfully via API:', registerResponse.data);
    
    // Clean up temporary dataset file
    await fs.unlink(datasetPath);
    
    // Create an evaluation via API
    logger.info('Creating evaluation via API');
    const createResponse = await api.post('/evaluations', {
      name: 'API Test Evaluation',
      modelId: 'regression-model@v1',
      datasetId,
      type: 'regression',
      parameters: {
        learning_rate: 0.01,
        epochs: 10
      },
      tags: ['api', 'regression', 'test']
    });
    
    const evaluation = createResponse.data.data;
    logger.info('Evaluation created successfully via API:', evaluation);
    
    // Start the evaluation
    logger.info('Starting evaluation via API');
    await api.post(`/evaluations/${evaluation.id}/start`);
    
    // Wait for evaluation to complete
    logger.info('Waiting for evaluation to complete...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get evaluation details
    logger.info('Getting evaluation details via API');
    const getEvaluationResponse = await api.get(`/evaluations/${evaluation.id}`);
    logger.info('Evaluation details:', getEvaluationResponse.data);
    
    // Get evaluation types
    logger.info('Getting evaluation types via API');
    const typesResponse = await api.get('/evaluations/types');
    logger.info('Evaluation types:', typesResponse.data);
    
    logger.info('API example completed successfully');
    
    return {
      datasetId,
      evaluationId: evaluation.id
    };
  } catch (error) {
    logger.error('Error in model evaluation API example', error);
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
      const serviceResult = await runModelEvaluationExample();
      logger.info('Service example completed successfully', serviceResult);
      
      // Run the API example
      logger.info('\n=== Running API example ===');
      const apiResult = await runModelEvaluationAPIExample();
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
    runModelEvaluationExample,
    runModelEvaluationAPIExample
  };
} 