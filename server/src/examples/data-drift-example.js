/**
 * data-drift-example.js
 * 
 * Example script demonstrating data drift detection
 * Implements RF058 - Add data drift detection
 */

const axios = require('axios');
const logger = require('../ai/utils/logger');
const { DataDriftService, DriftSeverity } = require('../ai/services/DataDriftService');
const { ModelPerformanceService } = require('../ai/services/ModelPerformanceService');

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
 * Generate sample training data
 * @param {number} count - Number of samples
 * @returns {Array} Training data
 */
function generateTrainingData(count = 1000) {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    data.push({
      feature1: Math.random() * 50 + 25, // Normal range: 25-75
      feature2: Math.random() * 20 + 40, // Normal range: 40-60
      feature3: Math.random() * 30 + 10, // Normal range: 10-40
      category: Math.random() > 0.5 ? 'A' : 'B',
      label: Math.random() > 0.5 ? 1 : 0
    });
  }
  
  return data;
}

/**
 * Generate drifted data
 * @param {number} count - Number of samples
 * @param {number} driftLevel - Level of drift (0-1)
 * @returns {Array} Drifted data
 */
function generateDriftedData(count = 100, driftLevel = 0.3) {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    // Add drift to the data distribution
    data.push({
      feature1: Math.random() * 50 + 25 + (driftLevel * 20), // Shifted by drift
      feature2: Math.random() * 20 + 40 - (driftLevel * 10), // Shifted by drift
      feature3: Math.random() * 30 + 10 + (driftLevel * 15), // Shifted by drift
      category: Math.random() > (0.5 + driftLevel) ? 'A' : 'B', // Changed distribution
      label: Math.random() > (0.5 - driftLevel) ? 1 : 0 // Changed distribution
    });
  }
  
  return data;
}

/**
 * Example of using the data drift detection service
 */
async function runDataDriftExample() {
  try {
    logger.info('Starting data drift detection example');
    
    // Create services
    const dataDriftService = new DataDriftService();
    const performanceService = new ModelPerformanceService();
    
    // Register event listeners
    dataDriftService.on('drift-detected', (event) => {
      logger.warn(`Drift detected for model ${event.modelId} with severity: ${event.severity}`);
      logger.info('Recommendations:', event.report.recommendations);
    });
    
    dataDriftService.on('baseline-created', (event) => {
      logger.info(`Baseline created for model ${event.modelId}`);
    });
    
    // Model ID for testing
    const modelId = 'drift-test-model';
    
    // Step 1: Generate training data and create baseline
    logger.info('Generating training data');
    const trainingData = generateTrainingData(1000);
    
    logger.info(`Creating baseline for model ${modelId}`);
    const baseline = await dataDriftService.createBaseline(modelId, trainingData, {
      features: ['feature1', 'feature2', 'feature3'],
      metadata: {
        description: 'Baseline for drift detection example',
        createdBy: 'example-script'
      }
    });
    
    logger.info('Baseline created:', {
      modelId: baseline.modelId,
      features: Object.keys(baseline.statistics.features),
      dataSize: baseline.metadata.dataSize
    });
    
    // Step 2: Simulate different levels of drift
    const driftLevels = [0, 0.1, 0.3, 0.5, 0.8];
    
    for (const driftLevel of driftLevels) {
      logger.info(`\nTesting with drift level: ${driftLevel}`);
      
      // Generate drifted data
      const currentData = generateDriftedData(100, driftLevel);
      
      // Detect drift
      const report = await dataDriftService.detectDriftForModel(modelId, currentData);
      
      logger.info(`Drift detection results:`, {
        overallSeverity: report.overallSeverity,
        overallScore: report.driftResults.overall.score,
        features: Object.entries(report.driftResults.features).map(([feature, drift]) => ({
          feature,
          statisticalScore: drift.statistical?.score,
          distributionScore: drift.distribution?.score
        }))
      });
      
      // Track drift as a custom metric in performance service
      performanceService.trackCustomMetric(
        modelId,
        'data_drift_score',
        report.driftResults.overall.score,
        { driftLevel, severity: report.overallSeverity }
      );
      
      // Wait a bit between tests
      await sleep(1000);
    }
    
    // Step 3: Get drift reports
    logger.info('\nGetting drift reports');
    const reports = dataDriftService.getDriftReports(modelId, { limit: 5 });
    
    logger.info(`Found ${reports.length} drift reports`);
    for (const report of reports) {
      logger.info(`Report ${report.id}: Severity=${report.overallSeverity}, Score=${report.driftResults.overall.score}`);
    }
    
    // Step 4: Get latest drift report
    const latestReport = dataDriftService.getLatestDriftReport(modelId);
    logger.info('\nLatest drift report:', {
      id: latestReport.id,
      timestamp: latestReport.timestamp,
      severity: latestReport.overallSeverity,
      recommendations: latestReport.recommendations.length
    });
    
    logger.info('Data drift detection example completed successfully');
  } catch (error) {
    logger.error('Error in data drift example', error);
    throw error;
  }
}

/**
 * Example of using the data drift API
 */
async function useDataDriftAPI() {
  try {
    logger.info('Using the data drift API');
    
    const modelId = 'api-drift-test-model';
    
    // Generate training data
    const trainingData = generateTrainingData(500);
    
    // Create baseline via API
    logger.info('Creating baseline via API');
    const baselineResponse = await api.post('/drift/baselines', {
      modelId,
      data: trainingData,
      features: ['feature1', 'feature2', 'feature3'],
      metadata: {
        description: 'API baseline example'
      }
    });
    logger.info('Baseline created via API:', baselineResponse.data);
    
    // Get baseline via API
    logger.info('Getting baseline via API');
    const getBaselineResponse = await api.get(`/drift/baselines/${modelId}`);
    logger.info('Baseline retrieved:', {
      modelId: getBaselineResponse.data.data.modelId,
      createdAt: getBaselineResponse.data.data.createdAt
    });
    
    // Detect drift via API
    logger.info('Detecting drift via API');
    const driftedData = generateDriftedData(100, 0.4);
    const detectResponse = await api.post(`/drift/detect/${modelId}`, {
      currentData: driftedData
    });
    logger.info('Drift detection result:', {
      severity: detectResponse.data.data.overallSeverity,
      score: detectResponse.data.data.driftResults.overall.score
    });
    
    // Get drift reports via API
    logger.info('Getting drift reports via API');
    const reportsResponse = await api.get(`/drift/reports/${modelId}?limit=5`);
    logger.info(`API returned ${reportsResponse.data.count} drift reports`);
    
    // Get latest drift report via API
    logger.info('Getting latest drift report via API');
    const latestResponse = await api.get(`/drift/reports/${modelId}/latest`);
    logger.info('Latest drift report:', {
      id: latestResponse.data.data.id,
      severity: latestResponse.data.data.overallSeverity
    });
    
    // Get severity levels via API
    logger.info('Getting severity levels via API');
    const severityResponse = await api.get('/drift/severity-levels');
    logger.info('Available severity levels:', severityResponse.data.data);
    
    logger.info('API examples completed successfully');
  } catch (error) {
    logger.error('Error using data drift API', error);
    if (error.response) {
      logger.error('Response data:', error.response.data);
    }
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
      logger.info('=== Running data drift detection example ===');
      
      // Run direct service example
      await runDataDriftExample();
      
      // Run API example
      logger.info('\n=== Running data drift API example ===');
      await useDataDriftAPI();
      
      logger.info('All examples completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error('Example script failed', error);
      process.exit(1);
    }
  })();
} else {
  // Export for use as a module
  module.exports = {
    runDataDriftExample,
    useDataDriftAPI,
    generateTrainingData,
    generateDriftedData
  };
} 