/**
 * Anomaly Detection Service
 * 
 * This service provides anomaly detection capabilities for time series data
 * in manufacturing processes, equipment monitoring, and quality control.
 * 
 * Part of: AI005 - Anomaly Detection System
 */

const aiFoundation = require('./foundation.service');
const logger = require('../utils/logger');
const { AI_CAPABILITIES } = require('./foundation.service');

// Anomaly detection algorithms supported by the service
const ALGORITHMS = {
  ISOLATION_FOREST: 'isolation-forest',
  LSTM_AUTOENCODER: 'lstm-autoencoder',
  STATISTICAL: 'statistical',
  ONE_CLASS_SVM: 'one-class-svm',
  DENSITY_BASED: 'density-based'
};

// Severity levels for detected anomalies
const SEVERITY_LEVELS = {
  LOW: 'low',          // Minor deviation, monitor
  MEDIUM: 'medium',    // Significant deviation, investigate
  HIGH: 'high',        // Critical deviation, immediate action required
  CRITICAL: 'critical' // Severe deviation, potential equipment failure or safety issue
};

/**
 * Detect anomalies in time series data
 * 
 * @param {Array} timeSeriesData - Array of time series data points
 * @param {Object} options - Detection options
 * @returns {Promise<Object>} Detection results
 */
async function detectAnomalies(timeSeriesData, options = {}) {
  try {
    logger.info('Starting anomaly detection analysis');
    
    // Validate input data
    if (!timeSeriesData || !Array.isArray(timeSeriesData) || timeSeriesData.length === 0) {
      throw new Error('Valid time series data is required');
    }
    
    // Set default options
    const detectionOptions = {
      algorithm: options.algorithm || ALGORITHMS.ISOLATION_FOREST,
      sensitivity: options.sensitivity || 0.95, // Higher value = more sensitive
      contextWindowSize: options.contextWindowSize || 100,
      minAnomalyScore: options.minAnomalyScore || 0.7,
      featureColumns: options.featureColumns || null,
      timeColumn: options.timeColumn || 'timestamp',
      valueColumn: options.valueColumn || 'value',
      includeRawScores: options.includeRawScores || false,
      ...options
    };
    
    // Use the time series anomaly detection model through the foundation service
    const results = await aiFoundation.executePrediction('ts-anomaly-detection', {
      timeSeriesData,
      options: detectionOptions
    });
    
    // Enhance the results with additional context and metadata
    return enhanceAnomalyResults(results, timeSeriesData, detectionOptions);
    
  } catch (error) {
    logger.error(`Anomaly detection error: ${error.message}`);
    throw error;
  }
}

/**
 * Enhance raw anomaly detection results with additional context and analysis
 * 
 * @param {Object} results - Raw model results
 * @param {Array} timeSeriesData - Original time series data
 * @param {Object} options - Detection options
 * @returns {Object} Enhanced results
 */
function enhanceAnomalyResults(results, timeSeriesData, options) {
  // Get the anomalies from the results
  const anomalies = results.anomalies || [];
  
  // Group anomalies by severity
  const groupedAnomalies = {
    [SEVERITY_LEVELS.LOW]: [],
    [SEVERITY_LEVELS.MEDIUM]: [],
    [SEVERITY_LEVELS.HIGH]: [],
    [SEVERITY_LEVELS.CRITICAL]: []
  };
  
  // Process each anomaly and assign severity
  anomalies.forEach(anomaly => {
    // Determine severity based on anomaly score
    let severity = SEVERITY_LEVELS.LOW;
    
    if (anomaly.score >= 0.95) {
      severity = SEVERITY_LEVELS.CRITICAL;
    } else if (anomaly.score >= 0.9) {
      severity = SEVERITY_LEVELS.HIGH;
    } else if (anomaly.score >= 0.8) {
      severity = SEVERITY_LEVELS.MEDIUM;
    }
    
    // Add severity to anomaly
    const enhancedAnomaly = {
      ...anomaly,
      severity,
      timestamp: anomaly.timestamp || new Date().toISOString()
    };
    
    // Add to grouped results
    groupedAnomalies[severity].push(enhancedAnomaly);
  });
  
  // Calculate summary statistics
  const summaryStats = {
    totalAnomalies: anomalies.length,
    criticalAnomalies: groupedAnomalies[SEVERITY_LEVELS.CRITICAL].length,
    highAnomalies: groupedAnomalies[SEVERITY_LEVELS.HIGH].length,
    mediumAnomalies: groupedAnomalies[SEVERITY_LEVELS.MEDIUM].length,
    lowAnomalies: groupedAnomalies[SEVERITY_LEVELS.LOW].length,
    anomalyRate: timeSeriesData.length > 0 ? anomalies.length / timeSeriesData.length : 0,
    averageAnomalyScore: anomalies.reduce((sum, a) => sum + a.score, 0) / (anomalies.length || 1)
  };
  
  // Create insights based on detected anomalies
  const insights = generateAnomalyInsights(groupedAnomalies, timeSeriesData, options);
  
  return {
    ...results,
    groupedAnomalies,
    summary: summaryStats,
    insights,
    metadata: {
      algorithm: options.algorithm,
      sensitivity: options.sensitivity,
      processedDataPoints: timeSeriesData.length,
      detectionTimestamp: new Date().toISOString()
    }
  };
}

/**
 * Generate insights from detected anomalies
 * 
 * @param {Object} groupedAnomalies - Anomalies grouped by severity
 * @param {Array} timeSeriesData - Original time series data
 * @param {Object} options - Detection options
 * @returns {Array} Insights derived from anomalies
 */
function generateAnomalyInsights(groupedAnomalies, timeSeriesData, options) {
  const insights = [];
  
  // Check for critical anomalies
  if (groupedAnomalies[SEVERITY_LEVELS.CRITICAL].length > 0) {
    insights.push({
      type: 'critical-alert',
      title: 'Critical Anomalies Detected',
      description: `${groupedAnomalies[SEVERITY_LEVELS.CRITICAL].length} critical anomalies detected that require immediate attention`,
      priority: 'high'
    });
  }
  
  // Check for clusters of anomalies
  const highAndCritical = [
    ...groupedAnomalies[SEVERITY_LEVELS.HIGH],
    ...groupedAnomalies[SEVERITY_LEVELS.CRITICAL]
  ];
  
  if (highAndCritical.length >= 3) {
    insights.push({
      type: 'pattern',
      title: 'Pattern of Significant Anomalies',
      description: `Pattern of ${highAndCritical.length} significant anomalies detected, suggesting a systematic issue`,
      priority: 'medium'
    });
  }
  
  // Check for increasing trend in anomaly scores
  if (anomaliesShowIncreasingTrend(highAndCritical)) {
    insights.push({
      type: 'trend',
      title: 'Increasing Anomaly Severity',
      description: 'Anomaly severity is showing an increasing trend over time',
      priority: 'medium'
    });
  }
  
  // Check for seasonality in anomalies
  if (timeSeriesData.length > 500 && hasSeasonalPattern(groupedAnomalies)) {
    insights.push({
      type: 'seasonality',
      title: 'Seasonal Anomaly Pattern',
      description: 'Anomalies appear to follow a seasonal or cyclic pattern',
      priority: 'low'
    });
  }
  
  return insights;
}

/**
 * Check if anomalies show an increasing trend in severity
 * 
 * @param {Array} anomalies - List of anomalies
 * @returns {boolean} True if there's an increasing trend
 */
function anomaliesShowIncreasingTrend(anomalies) {
  if (anomalies.length < 5) return false;
  
  // Sort anomalies by timestamp
  const sorted = [...anomalies].sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  // Calculate moving average of scores
  const windowSize = 3;
  const movingAverages = [];
  
  for (let i = 0; i <= sorted.length - windowSize; i++) {
    const window = sorted.slice(i, i + windowSize);
    const average = window.reduce((sum, a) => sum + a.score, 0) / windowSize;
    movingAverages.push(average);
  }
  
  // Check if last moving average is higher than first
  return movingAverages.length >= 2 && 
         movingAverages[movingAverages.length - 1] > movingAverages[0] * 1.1;
}

/**
 * Check if anomalies have a seasonal pattern
 * 
 * @param {Object} groupedAnomalies - Anomalies grouped by severity
 * @returns {boolean} True if a seasonal pattern is detected
 */
function hasSeasonalPattern(groupedAnomalies) {
  // This is a placeholder implementation
  // In a real implementation, this would use more sophisticated 
  // time series analysis to detect seasonality
  
  // For demonstration, we'll return a static value
  return false;
}

/**
 * Analyze measurement data for anomalies from a specific component
 * 
 * @param {string} componentId - ID of the component to analyze
 * @param {Object} options - Analysis options
 * @returns {Promise<Object>} Analysis results
 */
async function analyzeMeasurementAnomalies(componentId, options = {}) {
  try {
    logger.info(`Analyzing measurement anomalies for component ${componentId}`);
    
    if (!componentId) {
      throw new Error('Component ID is required');
    }
    
    // In a real implementation, this would fetch the measurements from a database
    // For demonstration, we'll generate synthetic data
    const measurements = generateSyntheticMeasurements(componentId, options);
    
    // Detect anomalies in the measurements
    const anomalyResults = await detectAnomalies(measurements, {
      ...options,
      valueColumn: 'measurement',
      timeColumn: 'timestamp'
    });
    
    return {
      componentId,
      measurements: options.includeMeasurements ? measurements : undefined,
      anomalyResults,
      analysisTimestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error(`Error analyzing measurement anomalies: ${error.message}`);
    throw error;
  }
}

/**
 * Generate synthetic measurement data for demonstration purposes
 * 
 * @param {string} componentId - Component ID
 * @param {Object} options - Generation options
 * @returns {Array} Synthetic measurements
 */
function generateSyntheticMeasurements(componentId, options = {}) {
  const count = options.count || 1000;
  const measurements = [];
  
  // Base measurement value (different for each component)
  const baseMeasurement = parseInt(componentId.replace(/\D/g, '')) % 100 || 50;
  
  // Standard deviation
  const stdDev = options.stdDev || 0.5;
  
  // Generate measurements with timestamps
  const now = new Date();
  for (let i = 0; i < count; i++) {
    // Create timestamp (going back in time)
    const timestamp = new Date(now - (count - i) * 3600000);
    
    // Generate normal measurement with some noise
    let measurement = baseMeasurement + (Math.random() * 2 - 1) * stdDev;
    
    // Add seasonal component (sine wave)
    measurement += Math.sin(i / 50) * 2;
    
    // Add trend component
    measurement += i * 0.001;
    
    // Add a few anomalies
    if (i % 150 === 0 || (i > count * 0.8 && i % 50 === 0)) {
      measurement += (Math.random() > 0.5 ? 1 : -1) * stdDev * 5;
    }
    
    measurements.push({
      timestamp: timestamp.toISOString(),
      measurement: parseFloat(measurement.toFixed(3)),
      unit: 'mm'
    });
  }
  
  return measurements;
}

/**
 * Monitor real-time data for anomalies
 * 
 * @param {string} streamId - ID of the data stream to monitor
 * @param {Object} options - Monitoring options
 * @returns {Promise<Object>} Monitoring status
 */
async function monitorRealTimeAnomalies(streamId, options = {}) {
  try {
    logger.info(`Setting up real-time anomaly monitoring for stream ${streamId}`);
    
    // In a real implementation, this would set up a connection to a real-time data stream
    // For demonstration, we'll just return a configuration status
    
    return {
      streamId,
      status: 'configured',
      algorithm: options.algorithm || ALGORITHMS.LSTM_AUTOENCODER,
      sensitivity: options.sensitivity || 0.9,
      alertThreshold: options.alertThreshold || 0.85,
      monitoringStart: new Date().toISOString(),
      configuration: {
        ...options,
        alertEndpoints: options.alertEndpoints || []
      }
    };
    
  } catch (error) {
    logger.error(`Error setting up real-time anomaly monitoring: ${error.message}`);
    throw error;
  }
}

/**
 * Get a list of available anomaly detection algorithms
 * 
 * @returns {Object} Available algorithms with descriptions
 */
function getAvailableAlgorithms() {
  return {
    [ALGORITHMS.ISOLATION_FOREST]: {
      name: 'Isolation Forest',
      description: 'Effective for high-dimensional data, isolates anomalies by random partitioning',
      bestFor: ['Multivariate data', 'Manufacturing process monitoring'],
      parameters: {
        n_estimators: 'Number of isolation trees',
        contamination: 'Expected proportion of anomalies'
      }
    },
    [ALGORITHMS.LSTM_AUTOENCODER]: {
      name: 'LSTM Autoencoder',
      description: 'Deep learning model for detecting anomalies in temporal sequences',
      bestFor: ['Time series data', 'Complex patterns', 'Equipment monitoring'],
      parameters: {
        sequence_length: 'Input sequence length',
        hidden_size: 'Size of hidden layers',
        threshold: 'Reconstruction error threshold'
      }
    },
    [ALGORITHMS.STATISTICAL]: {
      name: 'Statistical Methods',
      description: 'Uses statistical measures like Z-score, EWMA, or CUSUM',
      bestFor: ['Well-understood processes', 'Known statistical distributions'],
      parameters: {
        window_size: 'Rolling window size',
        sigma: 'Number of standard deviations for threshold'
      }
    },
    [ALGORITHMS.ONE_CLASS_SVM]: {
      name: 'One-Class SVM',
      description: 'Support Vector Machine trained on normal data only',
      bestFor: ['Feature-rich data', 'Complex decision boundaries'],
      parameters: {
        kernel: 'Kernel function',
        nu: 'Upper bound on fraction of outliers'
      }
    },
    [ALGORITHMS.DENSITY_BASED]: {
      name: 'Density-Based Methods',
      description: 'Identifies anomalies as points in low-density regions',
      bestFor: ['Clustered data', 'Variable density distributions'],
      parameters: {
        min_samples: 'Minimum samples in neighborhood',
        eps: 'Maximum distance between points in cluster'
      }
    }
  };
}

module.exports = {
  detectAnomalies,
  analyzeMeasurementAnomalies,
  monitorRealTimeAnomalies,
  getAvailableAlgorithms,
  ALGORITHMS,
  SEVERITY_LEVELS
}; 