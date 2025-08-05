/**
 * feature-engineering-example.js
 * 
 * Example script demonstrating the feature engineering pipeline
 * Implements RF051 - Create feature engineering pipeline
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../ai/utils/logger');
const { FeatureEngineeringService, TransformationType } = require('../ai/services/FeatureEngineeringService');

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

// Sample dataset for demonstration
const generateSampleData = (count = 100) => {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    data.push({
      id: i,
      age: Math.floor(Math.random() * 80) + 18, // Age between 18-97
      income: Math.floor(Math.random() * 150000) + 20000, // Income between 20k-170k
      yearsExperience: Math.floor(Math.random() * 40), // 0-40 years experience
      gender: Math.random() > 0.5 ? 'male' : 'female',
      education: ['high_school', 'bachelors', 'masters', 'phd'][Math.floor(Math.random() * 4)],
      department: ['engineering', 'marketing', 'sales', 'support', 'hr'][Math.floor(Math.random() * 5)],
      performanceScore: Math.floor(Math.random() * 100) + 1, // 1-100 score
      // Add some missing values
      satisfaction: Math.random() > 0.1 ? Math.floor(Math.random() * 10) + 1 : null // 10% missing values
    });
  }
  
  return data;
};

/**
 * Example of using the feature engineering pipeline
 */
async function runFeatureEngineeringExample() {
  try {
    logger.info('Starting feature engineering example');
    
    // Create a feature engineering service instance
    const feService = new FeatureEngineeringService();
    
    // Generate sample data
    const sampleData = generateSampleData(200);
    logger.info(`Generated ${sampleData.length} sample data points`);
    
    // Split into training and test sets
    const trainingData = sampleData.slice(0, 150);
    const testData = sampleData.slice(150);
    
    // Step 1: Create a pipeline
    const pipelineId = 'example-pipeline-' + Date.now();
    logger.info(`Creating pipeline: ${pipelineId}`);
    
    const pipeline = await feService.createPipeline(pipelineId, [
      {
        id: 'scaling',
        type: TransformationType.SCALING,
        options: {
          method: 'min-max',
          featureNames: ['age', 'income', 'yearsExperience', 'performanceScore']
        }
      },
      {
        id: 'imputation',
        type: TransformationType.IMPUTATION,
        options: {
          strategy: 'mean',
          featureNames: ['satisfaction']
        }
      },
      {
        id: 'encoding',
        type: TransformationType.ONE_HOT_ENCODING,
        options: {
          featureNames: ['gender', 'education', 'department']
        }
      }
    ]);
    
    logger.info('Pipeline created successfully:', pipeline);
    
    // Step 2: Fit the pipeline on training data
    logger.info('Fitting pipeline on training data');
    const fittedPipeline = await feService.fitPipeline(pipelineId, trainingData);
    logger.info('Pipeline fitted successfully');
    
    // Step 3: Transform test data
    logger.info('Transforming test data');
    const transformedData = await feService.transformData(pipelineId, testData);
    logger.info(`Test data transformed: ${transformedData.length} samples`);
    
    // Display sample of original and transformed data
    logger.info('Original data sample:');
    console.log(testData[0]);
    
    logger.info('Transformed data sample:');
    console.log(transformedData[0]);
    
    // Step 4: Save transformed data to file
    const outputDir = path.join(__dirname, '../../../ml-data');
    await fs.mkdir(outputDir, { recursive: true });
    
    const outputPath = path.join(outputDir, `transformed-data-${Date.now()}.json`);
    await fs.writeFile(outputPath, JSON.stringify(transformedData, null, 2));
    logger.info(`Transformed data saved to ${outputPath}`);
    
    // Step 5: Clean up (optional)
    // Uncomment to delete the pipeline after the example
    // await feService.deletePipeline(pipelineId);
    // logger.info(`Pipeline ${pipelineId} deleted`);
    
    return {
      pipelineId,
      originalFeatures: Object.keys(testData[0]).length,
      transformedFeatures: Object.keys(transformedData[0]).length,
      outputPath
    };
  } catch (error) {
    logger.error('Error in feature engineering example', error);
    if (error.response) {
      logger.error('Response data:', error.response.data);
    }
    throw error;
  }
}

/**
 * Example of using the feature engineering API
 */
async function runFeatureEngineeringAPIExample() {
  try {
    logger.info('Starting feature engineering API example');
    
    // Generate sample data
    const sampleData = generateSampleData(200);
    logger.info(`Generated ${sampleData.length} sample data points`);
    
    // Split into training and test sets
    const trainingData = sampleData.slice(0, 150);
    const testData = sampleData.slice(150);
    
    // Step 1: Get available transformer types
    logger.info('Getting available transformer types');
    const transformerTypesResponse = await api.get('/feature-engineering/transformers');
    const transformerTypes = transformerTypesResponse.data.data;
    logger.info(`Available transformer types: ${transformerTypes.join(', ')}`);
    
    // Step 2: Create a pipeline
    const pipelineId = 'api-example-pipeline-' + Date.now();
    logger.info(`Creating pipeline: ${pipelineId}`);
    
    const createResponse = await api.post('/feature-engineering/pipelines', {
      pipelineId,
      steps: [
        {
          id: 'scaling',
          type: 'scaling',
          options: {
            method: 'min-max',
            featureNames: ['age', 'income', 'yearsExperience', 'performanceScore']
          }
        },
        {
          id: 'imputation',
          type: 'imputation',
          options: {
            strategy: 'mean',
            featureNames: ['satisfaction']
          }
        },
        {
          id: 'encoding',
          type: 'one-hot-encoding',
          options: {
            featureNames: ['gender', 'education', 'department']
          }
        }
      ]
    });
    
    logger.info('Pipeline created successfully:', createResponse.data);
    
    // Step 3: Fit the pipeline on training data
    logger.info('Fitting pipeline on training data');
    const fitResponse = await api.post(`/feature-engineering/pipelines/${pipelineId}/fit`, {
      data: trainingData
    });
    
    logger.info('Pipeline fitted successfully:', fitResponse.data);
    
    // Step 4: Transform test data
    logger.info('Transforming test data');
    const transformResponse = await api.post(`/feature-engineering/pipelines/${pipelineId}/transform`, {
      data: testData
    });
    
    const transformedData = transformResponse.data.data;
    logger.info(`Test data transformed: ${transformedData.length} samples`);
    
    // Display sample of original and transformed data
    logger.info('Original data sample:');
    console.log(testData[0]);
    
    logger.info('Transformed data sample:');
    console.log(transformedData[0]);
    
    // Step 5: Get pipeline details
    logger.info('Getting pipeline details');
    const pipelineResponse = await api.get(`/feature-engineering/pipelines/${pipelineId}`);
    logger.info('Pipeline details:', pipelineResponse.data);
    
    // Step 6: Clean up (optional)
    // Uncomment to delete the pipeline after the example
    // await api.delete(`/feature-engineering/pipelines/${pipelineId}`);
    // logger.info(`Pipeline ${pipelineId} deleted`);
    
    return {
      pipelineId,
      originalFeatures: Object.keys(testData[0]).length,
      transformedFeatures: Object.keys(transformedData[0]).length
    };
  } catch (error) {
    logger.error('Error in feature engineering API example', error);
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
      const serviceResult = await runFeatureEngineeringExample();
      logger.info('Service example completed successfully', serviceResult);
      
      // Run the API example
      logger.info('\n=== Running API example ===');
      const apiResult = await runFeatureEngineeringAPIExample();
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
    runFeatureEngineeringExample,
    runFeatureEngineeringAPIExample
  };
} 