/**
 * model-performance-example.js
 * 
 * Example script demonstrating model performance metrics tracking
 * Implements RF057 - Implement performance metrics tracking
 */

const axios = require('axios');
const logger = require('../ai/utils/logger');
const { ModelPerformanceService, MetricType, TimeWindow } = require('../ai/services/ModelPerformanceService');
const { MLService, ModelType } = require('../ai/services/MLService');
const { sleep } = require('../utils/helpers');

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
 * Example of using the model performance metrics tracking
 */
async function runModelPerformanceExample() {
  try {
    logger.info('Starting model performance metrics example');
    
    // Create services
    const mlService = new MLService();
    const modelPerformanceService = new ModelPerformanceService();
    
    // Register event listeners
    modelPerformanceService.on('metrics-collected', (event) => {
      logger.info(`Metrics collected for ${event.modelCount} models at ${event.timestamp}`);
    });
    
    modelPerformanceService.on('inference-tracked', (event) => {
      logger.info(`Inference tracked for model ${event.modelId}: ${event.latency}ms (success: ${event.success})`);
    });
    
    // Simulate model inference and track performance metrics
    await simulateModelInference(mlService, modelPerformanceService);
    
    // Wait for metrics to be collected
    logger.info('Waiting for metrics collection...');
    await sleep(3000);
    
    // Get metrics for a model
    const modelId = 'example-model-1';
    logger.info(`Getting metrics for model ${modelId}`);
    
    const modelMetrics = modelPerformanceService.getModelMetrics(modelId);
    logger.info(`Model metrics:`, JSON.stringify(modelMetrics, null, 2));
    
    // Get latency metrics for the model
    const latencyMetrics = modelPerformanceService.getModelMetrics(modelId, MetricType.LATENCY);
    logger.info(`Latency metrics:`, JSON.stringify(latencyMetrics, null, 2));
    
    // Track a custom metric
    logger.info('Tracking custom metric');
    modelPerformanceService.trackCustomMetric(
      modelId,
      'prediction_confidence',
      0.95,
      { source: 'example' }
    );
    
    // Get all metrics
    logger.info('Getting all metrics');
    const allMetrics = modelPerformanceService.getAllMetrics();
    logger.info(`All metrics count: ${allMetrics.length}`);
    
    // Get aggregated latency metrics
    logger.info('Getting aggregated latency metrics');
    const aggregatedLatencyMetrics = modelPerformanceService.getAggregatedMetrics(MetricType.LATENCY);
    logger.info(`Aggregated latency metrics:`, JSON.stringify(aggregatedLatencyMetrics, null, 2));
    
    // Example of using the API
    logger.info('Using the API to get metrics');
    await useModelPerformanceAPI();
    
    logger.info('Model performance metrics example completed successfully');
  } catch (error) {
    logger.error('Error in model performance example', error);
    throw error;
  }
}

/**
 * Simulate model inference and track performance metrics
 * @param {MLService} mlService - ML service
 * @param {ModelPerformanceService} modelPerformanceService - Model performance service
 */
async function simulateModelInference(mlService, modelPerformanceService) {
  // Simulate multiple models
  const modelIds = ['example-model-1', 'example-model-2', 'example-model-3'];
  
  logger.info('Simulating model inference');
  
  // Simulate inference for each model
  for (const modelId of modelIds) {
    // Simulate multiple inferences
    for (let i = 0; i < 10; i++) {
      // Simulate inference latency (between 10ms and 100ms)
      const latency = Math.floor(Math.random() * 90) + 10;
      
      // Simulate success/failure (90% success rate)
      const success = Math.random() < 0.9;
      
      // Track inference
      modelPerformanceService.trackInference(modelId, latency, success);
      
      // Simulate some delay between inferences
      await sleep(50);
    }
    
    // Simulate batch inference
    const batchLatency = Math.floor(Math.random() * 200) + 100;
    const batchSize = Math.floor(Math.random() * 10) + 5;
    modelPerformanceService.trackBatchInference(modelId, batchLatency, batchSize, true);
  }
  
  logger.info('Model inference simulation completed');
}

/**
 * Example of using the model performance API
 */
async function useModelPerformanceAPI() {
  try {
    // Get all model metrics
    logger.info('Getting all model metrics from API');
    const allMetricsResponse = await api.get('/performance/models');
    logger.info(`API returned ${allMetricsResponse.data.count} model metrics`);
    
    // Get metrics for a specific model
    const modelId = 'example-model-1';
    logger.info(`Getting metrics for model ${modelId} from API`);
    const modelMetricsResponse = await api.get(`/performance/models/${modelId}`);
    logger.info(`API returned metrics for model ${modelId}`);
    
    // Get latency metrics for all models
    logger.info('Getting latency metrics from API');
    const latencyMetricsResponse = await api.get(`/performance/metrics/${MetricType.LATENCY}`);
    logger.info('API returned latency metrics');
    
    // Track a custom metric via API
    logger.info('Tracking custom metric via API');
    await api.post('/performance/metrics/custom', {
      modelId: 'example-model-2',
      metricName: 'api_test_metric',
      value: 0.85,
      metadata: {
        source: 'api_example'
      }
    });
    logger.info('Custom metric tracked via API');
    
    // Get available metric types
    logger.info('Getting available metric types from API');
    const metricTypesResponse = await api.get('/performance/metric-types');
    logger.info(`API returned ${metricTypesResponse.data.data.length} metric types`);
    
    // Get available time windows
    logger.info('Getting available time windows from API');
    const timeWindowsResponse = await api.get('/performance/time-windows');
    logger.info(`API returned ${timeWindowsResponse.data.data.length} time windows`);
    
    logger.info('API examples completed successfully');
  } catch (error) {
    logger.error('Error using model performance API', error);
    throw error;
  }
}

/**
 * Helper function to sleep for a specified time
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after the specified time
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the example if this script is executed directly
if (require.main === module) {
  (async () => {
    try {
      logger.info('=== Running model performance metrics example ===');
      await runModelPerformanceExample();
      logger.info('Example completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Example script failed', error);
      process.exit(1);
    }
  })();
} else {
  // Export for use as a module
  module.exports = {
    runModelPerformanceExample
  };
} 