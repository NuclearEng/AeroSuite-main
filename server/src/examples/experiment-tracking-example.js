/**
 * experiment-tracking-example.js
 * 
 * Example script demonstrating experiment tracking
 * Implements RF054 - Implement experiment tracking
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../ai/utils/logger');
const { ExperimentTrackingService, ExperimentStatus, RunStatus } = require('../ai/services/ExperimentTrackingService');

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
 * Example of using the experiment tracking service directly
 */
async function runExperimentTrackingExample() {
  try {
    logger.info('Starting experiment tracking example');
    
    // Create an experiment tracking service
    const experimentService = new ExperimentTrackingService();
    
    // Create a new experiment
    const experimentName = 'Example ML Experiment ' + Date.now();
    logger.info(`Creating experiment: ${experimentName}`);
    
    const experiment = await experimentService.createExperiment(experimentName, {
      description: 'An example experiment for demonstration purposes',
      tags: ['example', 'demo', 'tutorial'],
      framework: 'tensorflow',
      dataset: 'mnist'
    });
    
    logger.info('Experiment created successfully:', experiment);
    
    // Create multiple runs with different hyperparameters
    const runs = [];
    
    // Run 1: Low learning rate
    logger.info('Creating run 1 with low learning rate');
    const run1 = await experimentService.createRun(experiment.id, {
      name: 'Low Learning Rate Run',
      parameters: {
        learning_rate: 0.001,
        batch_size: 32,
        epochs: 10,
        optimizer: 'adam'
      },
      tags: ['low-lr']
    });
    runs.push(run1);
    
    // Run 2: Medium learning rate
    logger.info('Creating run 2 with medium learning rate');
    const run2 = await experimentService.createRun(experiment.id, {
      name: 'Medium Learning Rate Run',
      parameters: {
        learning_rate: 0.01,
        batch_size: 32,
        epochs: 10,
        optimizer: 'adam'
      },
      tags: ['medium-lr']
    });
    runs.push(run2);
    
    // Run 3: High learning rate
    logger.info('Creating run 3 with high learning rate');
    const run3 = await experimentService.createRun(experiment.id, {
      name: 'High Learning Rate Run',
      parameters: {
        learning_rate: 0.1,
        batch_size: 32,
        epochs: 10,
        optimizer: 'adam'
      },
      tags: ['high-lr']
    });
    runs.push(run3);
    
    // Start all runs
    for (let i = 0; i < runs.length; i++) {
      const run = runs[i];
      logger.info(`Starting run: ${run.name} (${run.id})`);
      await experimentService.startRun(run.id);
    }
    
    // Simulate training and log metrics for each run
    await simulateTraining(experimentService, runs);
    
    // Compare runs
    logger.info('Comparing runs');
    const comparison = await experimentService.compareRuns(runs.map(run => run.id));
    logger.info('Run comparison:', JSON.stringify(comparison.metrics, null, 2));
    
    // Get best run based on accuracy
    logger.info('Getting best run based on accuracy');
    const bestRun = await experimentService.getBestRun(experiment.id, 'accuracy', true);
    logger.info(`Best run: ${bestRun.name} with accuracy ${bestRun.metrics.accuracy}`);
    
    // Update experiment status to completed
    logger.info('Updating experiment status to completed');
    await experimentService.updateExperiment(experiment.id, {
      status: ExperimentStatus.COMPLETED
    });
    
    logger.info('Experiment tracking example completed successfully');
    
    return {
      experimentId: experiment.id,
      runIds: runs.map(run => run.id)
    };
  } catch (error) {
    logger.error('Error in experiment tracking example', error);
    throw error;
  }
}

/**
 * Simulate training process and log metrics
 * @param {ExperimentTrackingService} experimentService - Experiment tracking service
 * @param {Array<Object>} runs - List of runs
 */
async function simulateTraining(experimentService, runs) {
  // Create a temporary file to use as an artifact
  const artifactPath = path.join(__dirname, 'temp-artifact.txt');
  await fs.writeFile(artifactPath, 'This is a sample artifact for demonstration purposes.');
  
  // Simulate metrics for each run
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const lr = run.parameters.learning_rate;
    
    // Simulate training epochs
    for (let epoch = 1; epoch <= 5; epoch++) {
      // Calculate simulated metrics based on learning rate
      // For this example, we'll make medium learning rate perform best
      const lrFactor = lr === 0.01 ? 1.0 : (lr === 0.001 ? 0.8 : 0.6);
      const accuracy = Math.min(0.5 + (epoch * 0.08 * lrFactor), 0.99);
      const loss = Math.max(0.5 - (epoch * 0.08 * lrFactor), 0.01);
      
      // Log metrics for this epoch
      logger.info(`Run ${run.id} - Epoch ${epoch}: accuracy=${accuracy.toFixed(4)}, loss=${loss.toFixed(4)}`);
      await experimentService.logMetrics(run.id, {
        [`accuracy_epoch_${epoch}`]: accuracy,
        [`loss_epoch_${epoch}`]: loss
      });
      
      // Simulate some training time
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Log final metrics
    const lrFactor = lr === 0.01 ? 1.0 : (lr === 0.001 ? 0.8 : 0.6);
    const finalAccuracy = Math.min(0.9 * lrFactor, 0.99);
    const finalLoss = Math.max(0.1 * (1 - lrFactor), 0.01);
    
    await experimentService.logMetrics(run.id, {
      accuracy: finalAccuracy,
      loss: finalLoss,
      f1_score: finalAccuracy * 0.95
    });
    
    // Log an artifact
    await experimentService.logArtifact(run.id, `model-weights-${run.id}`, artifactPath, {
      description: 'Model weights after training',
      format: 'text'
    });
    
    // Complete the run
    await experimentService.completeRun(run.id, {
      notes: `Run completed with final accuracy: ${finalAccuracy.toFixed(4)}`
    });
  }
  
  // Clean up temporary file
  await fs.unlink(artifactPath);
}

/**
 * Example of using the experiment tracking API
 */
async function runExperimentTrackingAPIExample() {
  try {
    logger.info('Starting experiment tracking API example');
    
    // Create a new experiment via API
    const experimentName = 'API Example ML Experiment ' + Date.now();
    logger.info(`Creating experiment via API: ${experimentName}`);
    
    const createResponse = await api.post('/experiments', {
      name: experimentName,
      description: 'An example experiment created via API',
      tags: ['api', 'example'],
      metadata: {
        framework: 'pytorch',
        dataset: 'cifar10'
      }
    });
    
    const experiment = createResponse.data.data;
    logger.info('Experiment created successfully via API:', experiment);
    
    // Create a run via API
    logger.info('Creating run via API');
    const createRunResponse = await api.post(`/experiments/${experiment.id}/runs`, {
      name: 'API Test Run',
      parameters: {
        learning_rate: 0.005,
        batch_size: 64,
        epochs: 5,
        optimizer: 'sgd'
      },
      tags: ['api-test']
    });
    
    const run = createRunResponse.data.data;
    logger.info('Run created successfully via API:', run);
    
    // Start the run
    logger.info('Starting run via API');
    await api.post(`/experiments/runs/${run.id}/start`);
    
    // Log metrics
    logger.info('Logging metrics via API');
    await api.post(`/experiments/runs/${run.id}/metrics`, {
      metrics: {
        accuracy: 0.85,
        loss: 0.15,
        precision: 0.83,
        recall: 0.86
      }
    });
    
    // Complete the run
    logger.info('Completing run via API');
    await api.post(`/experiments/runs/${run.id}/complete`, {
      notes: 'Run completed successfully via API'
    });
    
    // Get experiment details
    logger.info('Getting experiment details via API');
    const getExperimentResponse = await api.get(`/experiments/${experiment.id}`);
    logger.info('Experiment details:', getExperimentResponse.data);
    
    // Get runs for the experiment
    logger.info('Getting runs for experiment via API');
    const getRunsResponse = await api.get(`/experiments/${experiment.id}/runs`);
    logger.info(`Found ${getRunsResponse.data.count} runs for experiment`);
    
    logger.info('API example completed successfully');
    
    return {
      experimentId: experiment.id,
      runId: run.id
    };
  } catch (error) {
    logger.error('Error in experiment tracking API example', error);
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
      const serviceResult = await runExperimentTrackingExample();
      logger.info('Service example completed successfully', serviceResult);
      
      // Run the API example
      logger.info('\n=== Running API example ===');
      const apiResult = await runExperimentTrackingAPIExample();
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
    runExperimentTrackingExample,
    runExperimentTrackingAPIExample
  };
} 