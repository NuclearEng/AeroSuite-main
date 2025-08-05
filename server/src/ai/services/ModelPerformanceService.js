/**
 * ModelPerformanceService.js
 * 
 * Service for tracking ML model performance metrics
 * Implements RF057 - Implement performance metrics tracking
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../../infrastructure/logger');

/**
 * Metric type enum
 * @enum {string}
 */
const MetricType = {
  LATENCY: 'latency',
  THROUGHPUT: 'throughput',
  ERROR_RATE: 'error_rate',
  MEMORY_USAGE: 'memory_usage',
  CPU_USAGE: 'cpu_usage',
  PREDICTION_ACCURACY: 'prediction_accuracy',
  CUSTOM: 'custom'
};

/**
 * Time window enum
 * @enum {string}
 */
const TimeWindow = {
  MINUTE: '1m',
  FIVE_MINUTES: '5m',
  FIFTEEN_MINUTES: '15m',
  HOUR: '1h',
  DAY: '1d',
  WEEK: '1w',
  MONTH: '30d',
  ALL: 'all'
};

/**
 * Model Performance Service
 * Provides performance metrics tracking for ML models
 */
class ModelPerformanceService {
  /**
   * Create a new model performance service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      metricsPath: process.env.ML_METRICS_PATH || path.join(__dirname, '../../../..', 'ml-metrics'),
      retentionDays: parseInt(process.env.ML_METRICS_RETENTION_DAYS || '30', 10),
      samplingInterval: parseInt(process.env.ML_METRICS_SAMPLING_INTERVAL || '60000', 10), // 1 minute in ms
      ...options
    };
    
    this.eventEmitter = new EventEmitter();
    this.metrics = new Map();
    this.modelStats = new Map();
    this.samplingTimer = null;
    
    // Initialize service
    this._initialize();
  }
  
  /**
   * Initialize the model performance service
   * @private
   */
  async _initialize() {
    try {
      // Ensure directories exist
      await this._ensureDirectories();
      
      // Load existing metrics
      await this._loadMetrics();
      
      // Start metrics collection
      this._startMetricsCollection();
      
      logger.info('Model Performance Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Model Performance Service', error);
    }
  }
  
  /**
   * Ensure required directories exist
   * @private
   */
  async _ensureDirectories() {
    try {
      await fs.mkdir(this.options.metricsPath, { recursive: true });
      
      logger.debug('Required directories created');
    } catch (error) {
      logger.error('Failed to create required directories', error);
      throw error;
    }
  }
  
  /**
   * Load existing metrics from disk
   * @private
   */
  async _loadMetrics() {
    try {
      const metricsFile = path.join(this.options.metricsPath, 'metrics.json');
      
      try {
        await fs.access(metricsFile);
        
        // Read metrics file
        const data = await fs.readFile(metricsFile, 'utf8');
        const metrics = JSON.parse(data);
        
        // Load metrics into memory
        for (const [modelId, modelMetrics] of Object.entries(metrics)) {
          this.metrics.set(modelId, modelMetrics);
        }
        
        logger.info(`Loaded metrics for ${this.metrics.size} models`);
      } catch (error) {
        // File doesn't exist, create it
        await this._saveMetrics();
        logger.info('Created new metrics file');
      }
    } catch (error) {
      logger.error('Failed to load metrics', error);
      throw error;
    }
  }
  
  /**
   * Save metrics to disk
   * @private
   */
  async _saveMetrics() {
    try {
      const metricsFile = path.join(this.options.metricsPath, 'metrics.json');
      
      // Convert metrics map to object
      const metrics = {};
      for (const [modelId, modelMetrics] of this.metrics.entries()) {
        metrics[modelId] = modelMetrics;
      }
      
      // Write to file
      await fs.writeFile(
        metricsFile,
        JSON.stringify(metrics, null, 2)
      );
      
      logger.debug('Metrics saved successfully');
    } catch (error) {
      logger.error('Failed to save metrics', error);
      throw error;
    }
  }
  
  /**
   * Start metrics collection
   * @private
   */
  _startMetricsCollection() {
    // Clear any existing timer
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
    }
    
    // Start periodic metrics collection
    this.samplingTimer = setInterval(() => {
      this._collectMetrics().catch(error => {
        logger.error('Error collecting metrics', error);
      });
    }, this.options.samplingInterval);
    
    logger.info(`Metrics collection started with ${this.options.samplingInterval}ms interval`);
  }
  
  /**
   * Stop metrics collection
   * @private
   */
  _stopMetricsCollection() {
    if (this.samplingTimer) {
      clearInterval(this.samplingTimer);
      this.samplingTimer = null;
      logger.info('Metrics collection stopped');
    }
  }
  
  /**
   * Collect metrics for all models
   * @private
   */
  async _collectMetrics() {
    try {
      const timestamp = new Date().toISOString();
      
      // Collect system metrics
      const systemMetrics = await this._collectSystemMetrics();
      
      // Process model stats
      for (const [modelId, stats] of this.modelStats.entries()) {
        // Calculate metrics for this interval
        const intervalMetrics = this._calculateIntervalMetrics(stats);
        
        // Reset interval counters
        this._resetIntervalStats(modelId);
        
        // Get or create model metrics
        if (!this.metrics.has(modelId)) {
          this.metrics.set(modelId, {
            id: modelId,
            metrics: {}
          });
        }
        
        const modelMetrics = this.metrics.get(modelId);
        
        // Update metrics with new data points
        for (const [metricType, value] of Object.entries(intervalMetrics)) {
          if (!modelMetrics.metrics[metricType]) {
            modelMetrics.metrics[metricType] = {
              dataPoints: [],
              summary: {}
            };
          }
          
          // Add new data point
          modelMetrics.metrics[metricType].dataPoints.push({
            timestamp,
            value
          });
          
          // Trim old data points based on retention policy
          this._trimDataPoints(modelMetrics.metrics[metricType].dataPoints);
          
          // Update summary statistics
          modelMetrics.metrics[metricType].summary = this._calculateSummaryStats(
            modelMetrics.metrics[metricType].dataPoints
          );
        }
        
        // Add system metrics
        for (const [metricType, value] of Object.entries(systemMetrics)) {
          if (!modelMetrics.metrics[metricType]) {
            modelMetrics.metrics[metricType] = {
              dataPoints: [],
              summary: {}
            };
          }
          
          // Add new data point
          modelMetrics.metrics[metricType].dataPoints.push({
            timestamp,
            value
          });
          
          // Trim old data points
          this._trimDataPoints(modelMetrics.metrics[metricType].dataPoints);
          
          // Update summary statistics
          modelMetrics.metrics[metricType].summary = this._calculateSummaryStats(
            modelMetrics.metrics[metricType].dataPoints
          );
        }
      }
      
      // Save metrics to disk
      await this._saveMetrics();
      
      // Emit metrics collected event
      this.eventEmitter.emit('metrics-collected', {
        timestamp: new Date(),
        modelCount: this.modelStats.size
      });
    } catch (error) {
      logger.error('Failed to collect metrics', error);
      throw error;
    }
  }
  
  /**
   * Calculate metrics for the current interval
   * @param {Object} stats - Model stats
   * @returns {Object} Interval metrics
   * @private
   */
  _calculateIntervalMetrics(stats) {
    const metrics = {};
    
    // Calculate latency metrics
    if (stats.inferenceCount > 0) {
      metrics[MetricType.LATENCY] = stats.totalLatency / stats.inferenceCount;
      metrics[MetricType.THROUGHPUT] = stats.inferenceCount / (this.options.samplingInterval / 1000);
      metrics[MetricType.ERROR_RATE] = stats.errorCount / stats.inferenceCount;
    } else {
      metrics[MetricType.LATENCY] = 0;
      metrics[MetricType.THROUGHPUT] = 0;
      metrics[MetricType.ERROR_RATE] = 0;
    }
    
    return metrics;
  }
  
  /**
   * Reset interval stats for a model
   * @param {string} modelId - Model ID
   * @private
   */
  _resetIntervalStats(modelId) {
    const stats = this.modelStats.get(modelId);
    
    if (stats) {
      stats.inferenceCount = 0;
      stats.totalLatency = 0;
      stats.errorCount = 0;
      stats.batchCount = 0;
      stats.totalBatchSize = 0;
    }
  }
  
  /**
   * Collect system metrics
   * @returns {Promise<Object>} System metrics
   * @private
   */
  async _collectSystemMetrics() {
    try {
      // In a real implementation, this would collect actual system metrics
      // For now, we'll just return placeholder values
      return {
        [MetricType.MEMORY_USAGE]: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        [MetricType.CPU_USAGE]: Math.random() * 10 // Placeholder value
      };
    } catch (error) {
      logger.error('Failed to collect system metrics', error);
      return {};
    }
  }
  
  /**
   * Trim data points based on retention policy
   * @param {Array} dataPoints - Data points array
   * @private
   */
  _trimDataPoints(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) {
      return;
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.options.retentionDays);
    
    // Remove data points older than retention period
    let i = 0;
    while (i < dataPoints.length && new Date(dataPoints[i].timestamp) < cutoffDate) {
      i++;
    }
    
    if (i > 0) {
      dataPoints.splice(0, i);
    }
  }
  
  /**
   * Calculate summary statistics for data points
   * @param {Array} dataPoints - Data points array
   * @returns {Object} Summary statistics
   * @private
   */
  _calculateSummaryStats(dataPoints) {
    if (!dataPoints || dataPoints.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        count: 0,
        lastValue: 0
      };
    }
    
    // Extract values
    const values = dataPoints.map(dp => dp.value).filter(v => v !== undefined && v !== null);
    
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        count: 0,
        lastValue: 0
      };
    }
    
    // Sort values for percentiles
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // Calculate statistics
    const min = sortedValues[0];
    const max = sortedValues[sortedValues.length - 1];
    const sum = sortedValues.reduce((acc, val) => acc + val, 0);
    const avg = sum / sortedValues.length;
    const p50 = this._percentile(sortedValues, 50);
    const p95 = this._percentile(sortedValues, 95);
    const p99 = this._percentile(sortedValues, 99);
    const lastValue = dataPoints[dataPoints.length - 1].value;
    
    return {
      min,
      max,
      avg,
      p50,
      p95,
      p99,
      count: values.length,
      lastValue
    };
  }
  
  /**
   * Calculate percentile value
   * @param {Array} sortedValues - Sorted array of values
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   * @private
   */
  _percentile(sortedValues, percentile) {
    if (sortedValues.length === 0) {
      return 0;
    }
    
    const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
  }
  
  /**
   * Track inference event
   * @param {string} modelId - Model ID
   * @param {number} latency - Inference latency in ms
   * @param {boolean} success - Whether inference was successful
   * @param {Object} metadata - Additional metadata
   */
  trackInference(modelId, latency, success, metadata = {}) {
    // Get or create model stats
    if (!this.modelStats.has(modelId)) {
      this.modelStats.set(modelId, {
        inferenceCount: 0,
        totalLatency: 0,
        errorCount: 0,
        batchCount: 0,
        totalBatchSize: 0,
        lastInference: null
      });
    }
    
    const stats = this.modelStats.get(modelId);
    
    // Update stats
    stats.inferenceCount += 1;
    stats.totalLatency += latency;
    
    if (!success) {
      stats.errorCount += 1;
    }
    
    stats.lastInference = new Date();
    
    // Emit event
    this.eventEmitter.emit('inference-tracked', {
      modelId,
      latency,
      success,
      timestamp: new Date()
    });
  }
  
  /**
   * Track batch inference event
   * @param {string} modelId - Model ID
   * @param {number} latency - Batch inference latency in ms
   * @param {number} batchSize - Size of the batch
   * @param {boolean} success - Whether inference was successful
   * @param {Object} metadata - Additional metadata
   */
  trackBatchInference(modelId, latency, batchSize, success, metadata = {}) {
    // Get or create model stats
    if (!this.modelStats.has(modelId)) {
      this.modelStats.set(modelId, {
        inferenceCount: 0,
        totalLatency: 0,
        errorCount: 0,
        batchCount: 0,
        totalBatchSize: 0,
        lastInference: null
      });
    }
    
    const stats = this.modelStats.get(modelId);
    
    // Update stats
    stats.inferenceCount += batchSize;
    stats.totalLatency += latency;
    stats.batchCount += 1;
    stats.totalBatchSize += batchSize;
    
    if (!success) {
      stats.errorCount += batchSize;
    }
    
    stats.lastInference = new Date();
    
    // Emit event
    this.eventEmitter.emit('batch-inference-tracked', {
      modelId,
      latency,
      batchSize,
      success,
      timestamp: new Date()
    });
  }
  
  /**
   * Track custom metric
   * @param {string} modelId - Model ID
   * @param {string} metricName - Custom metric name
   * @param {number} value - Metric value
   * @param {Object} metadata - Additional metadata
   */
  trackCustomMetric(modelId, metricName, value, metadata = {}) {
    // Get or create model metrics
    if (!this.metrics.has(modelId)) {
      this.metrics.set(modelId, {
        id: modelId,
        metrics: {}
      });
    }
    
    const modelMetrics = this.metrics.get(modelId);
    
    // Get or create custom metric
    const metricType = `${MetricType.CUSTOM}.${metricName}`;
    if (!modelMetrics.metrics[metricType]) {
      modelMetrics.metrics[metricType] = {
        dataPoints: [],
        summary: {}
      };
    }
    
    // Add new data point
    const timestamp = new Date().toISOString();
    modelMetrics.metrics[metricType].dataPoints.push({
      timestamp,
      value,
      metadata
    });
    
    // Trim old data points
    this._trimDataPoints(modelMetrics.metrics[metricType].dataPoints);
    
    // Update summary statistics
    modelMetrics.metrics[metricType].summary = this._calculateSummaryStats(
      modelMetrics.metrics[metricType].dataPoints
    );
    
    // Emit event
    this.eventEmitter.emit('custom-metric-tracked', {
      modelId,
      metricName,
      value,
      timestamp: new Date()
    });

    // Emit performance-drop event if metric is the monitored one and below threshold
    if (
      metricName === (this.options?.performanceMetric || 'prediction_accuracy') &&
      typeof value === 'number' &&
      value < (this.options?.performanceThreshold || 0.8)
    ) {
      this.eventEmitter.emit('performance-drop', {
        modelId,
        metricName,
        value,
        threshold: this.options?.performanceThreshold || 0.8,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Get metrics for a model
   * @param {string} modelId - Model ID
   * @param {string} metricType - Metric type (optional)
   * @param {string} timeWindow - Time window (optional)
   * @returns {Object} Model metrics
   */
  getModelMetrics(modelId, metricType = null, timeWindow = TimeWindow.ALL) {
    if (!this.metrics.has(modelId)) {
      return null;
    }
    
    const modelMetrics = this.metrics.get(modelId);
    
    // Return specific metric if requested
    if (metricType && modelMetrics.metrics[metricType]) {
      const metric = modelMetrics.metrics[metricType];
      
      // Apply time window filter
      if (timeWindow !== TimeWindow.ALL) {
        const filteredDataPoints = this._filterDataPointsByTimeWindow(
          metric.dataPoints,
          timeWindow
        );
        
        return {
          dataPoints: filteredDataPoints,
          summary: this._calculateSummaryStats(filteredDataPoints)
        };
      }
      
      return metric;
    }
    
    // Return all metrics
    if (!metricType) {
      // Apply time window filter to all metrics
      if (timeWindow !== TimeWindow.ALL) {
        const filteredMetrics = {};
        
        for (const [type, metric] of Object.entries(modelMetrics.metrics)) {
          const filteredDataPoints = this._filterDataPointsByTimeWindow(
            metric.dataPoints,
            timeWindow
          );
          
          filteredMetrics[type] = {
            dataPoints: filteredDataPoints,
            summary: this._calculateSummaryStats(filteredDataPoints)
          };
        }
        
        return {
          id: modelId,
          metrics: filteredMetrics
        };
      }
      
      return modelMetrics;
    }
    
    return null;
  }
  
  /**
   * Filter data points by time window
   * @param {Array} dataPoints - Data points array
   * @param {string} timeWindow - Time window
   * @returns {Array} Filtered data points
   * @private
   */
  _filterDataPointsByTimeWindow(dataPoints, timeWindow) {
    if (!dataPoints || dataPoints.length === 0) {
      return [];
    }
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeWindow) {
      case TimeWindow.MINUTE:
        cutoffDate = new Date(now.getTime() - 60 * 1000);
        break;
      case TimeWindow.FIVE_MINUTES:
        cutoffDate = new Date(now.getTime() - 5 * 60 * 1000);
        break;
      case TimeWindow.FIFTEEN_MINUTES:
        cutoffDate = new Date(now.getTime() - 15 * 60 * 1000);
        break;
      case TimeWindow.HOUR:
        cutoffDate = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case TimeWindow.DAY:
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case TimeWindow.WEEK:
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case TimeWindow.MONTH:
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return dataPoints;
    }
    
    return dataPoints.filter(dp => new Date(dp.timestamp) >= cutoffDate);
  }
  
  /**
   * Get metrics for all models
   * @param {string} metricType - Metric type (optional)
   * @param {string} timeWindow - Time window (optional)
   * @returns {Array} Metrics for all models
   */
  getAllMetrics(metricType = null, timeWindow = TimeWindow.ALL) {
    const allMetrics = [];
    
    for (const [modelId, _] of this.metrics.entries()) {
      const modelMetrics = this.getModelMetrics(modelId, metricType, timeWindow);
      if (modelMetrics) {
        allMetrics.push(modelMetrics);
      }
    }
    
    return allMetrics;
  }
  
  /**
   * Get aggregated metrics across all models
   * @param {string} metricType - Metric type
   * @param {string} timeWindow - Time window (optional)
   * @returns {Object} Aggregated metrics
   */
  getAggregatedMetrics(metricType, timeWindow = TimeWindow.ALL) {
    if (!metricType) {
      return null;
    }
    
    // Collect all data points for the metric
    const allDataPoints = [];
    
    for (const [_, modelMetrics] of this.metrics.entries()) {
      if (modelMetrics.metrics[metricType]) {
        const dataPoints = timeWindow === TimeWindow.ALL
          ? modelMetrics.metrics[metricType].dataPoints
          : this._filterDataPointsByTimeWindow(
              modelMetrics.metrics[metricType].dataPoints,
              timeWindow
            );
        
        allDataPoints.push(...dataPoints);
      }
    }
    
    // Sort by timestamp
    allDataPoints.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return {
      metricType,
      dataPoints: allDataPoints,
      summary: this._calculateSummaryStats(allDataPoints)
    };
  }
  
  /**
   * Register for performance events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  
  /**
   * Unregister from performance events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }
  
  /**
   * Clean up resources
   */
  dispose() {
    this._stopMetricsCollection();
    this.eventEmitter.removeAllListeners();
  }
}

module.exports = {
  ModelPerformanceService,
  MetricType,
  TimeWindow
}; 