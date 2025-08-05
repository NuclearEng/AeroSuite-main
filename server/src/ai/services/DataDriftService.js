/**
 * DataDriftService.js
 * 
 * Service for detecting data drift in ML models
 * Implements RF058 - Add data drift detection
 */

const path = require('path');
const fs = require('fs').promises;
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

/**
 * Drift type enum
 * @enum {string}
 */
const DriftType = {
  FEATURE_DRIFT: 'feature_drift',
  LABEL_DRIFT: 'label_drift',
  PREDICTION_DRIFT: 'prediction_drift',
  CONCEPT_DRIFT: 'concept_drift'
};

/**
 * Drift detection method enum
 * @enum {string}
 */
const DriftDetectionMethod = {
  STATISTICAL: 'statistical',
  DISTANCE_BASED: 'distance_based',
  MODEL_BASED: 'model_based',
  RULE_BASED: 'rule_based'
};

/**
 * Drift severity enum
 * @enum {string}
 */
const DriftSeverity = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Data Drift Service
 * Provides data drift detection for ML models
 */
class DataDriftService {
  /**
   * Create a new data drift service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      driftPath: process.env.ML_DRIFT_PATH || path.join(__dirname, '../../../..', 'ml-drift'),
      baselineWindow: parseInt(process.env.ML_DRIFT_BASELINE_WINDOW || '30', 10), // days
      detectionInterval: parseInt(process.env.ML_DRIFT_DETECTION_INTERVAL || '3600000', 10), // 1 hour in ms
      driftThresholds: {
        low: 0.1,
        medium: 0.25,
        high: 0.5,
        critical: 0.75,
        ...options.driftThresholds
      },
      ...options
    };
    
    this.eventEmitter = new EventEmitter();
    this.baselines = new Map();
    this.driftReports = new Map();
    this.detectionTimer = null;
    
    // Initialize service
    this._initialize();
  }
  
  /**
   * Initialize the data drift service
   * @private
   */
  async _initialize() {
    try {
      // Ensure directories exist
      await this._ensureDirectories();
      
      // Load existing baselines and reports
      await this._loadBaselines();
      await this._loadDriftReports();
      
      // Start drift detection
      this._startDriftDetection();
      
      logger.info('Data Drift Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Data Drift Service', error);
    }
  }
  
  /**
   * Ensure required directories exist
   * @private
   */
  async _ensureDirectories() {
    try {
      await fs.mkdir(this.options.driftPath, { recursive: true });
      await fs.mkdir(path.join(this.options.driftPath, 'baselines'), { recursive: true });
      await fs.mkdir(path.join(this.options.driftPath, 'reports'), { recursive: true });
      
      logger.debug('Required directories created');
    } catch (error) {
      logger.error('Failed to create required directories', error);
      throw error;
    }
  }
  
  /**
   * Load existing baselines from disk
   * @private
   */
  async _loadBaselines() {
    try {
      const baselinesFile = path.join(this.options.driftPath, 'baselines', 'baselines.json');
      
      try {
        await fs.access(baselinesFile);
        
        // Read baselines file
        const data = await fs.readFile(baselinesFile, 'utf8');
        const baselines = JSON.parse(data);
        
        // Load baselines into memory
        for (const [modelId, baseline] of Object.entries(baselines)) {
          this.baselines.set(modelId, baseline);
        }
        
        logger.info(`Loaded baselines for ${this.baselines.size} models`);
      } catch (error) {
        // File doesn't exist, create it
        await this._saveBaselines();
        logger.info('Created new baselines file');
      }
    } catch (error) {
      logger.error('Failed to load baselines', error);
      throw error;
    }
  }
  
  /**
   * Save baselines to disk
   * @private
   */
  async _saveBaselines() {
    try {
      const baselinesFile = path.join(this.options.driftPath, 'baselines', 'baselines.json');
      
      // Convert baselines map to object
      const baselines = {};
      for (const [modelId, baseline] of this.baselines.entries()) {
        baselines[modelId] = baseline;
      }
      
      // Write to file
      await fs.writeFile(
        baselinesFile,
        JSON.stringify(baselines, null, 2)
      );
      
      logger.debug('Baselines saved successfully');
    } catch (error) {
      logger.error('Failed to save baselines', error);
      throw error;
    }
  }
  
  /**
   * Load existing drift reports from disk
   * @private
   */
  async _loadDriftReports() {
    try {
      const reportsDir = path.join(this.options.driftPath, 'reports');
      
      try {
        const files = await fs.readdir(reportsDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));
        
        for (const file of jsonFiles) {
          try {
            const reportPath = path.join(reportsDir, file);
            const data = await fs.readFile(reportPath, 'utf8');
            const report = JSON.parse(data);
            
            if (!this.driftReports.has(report.modelId)) {
              this.driftReports.set(report.modelId, []);
            }
            
            this.driftReports.get(report.modelId).push(report);
          } catch (error) {
            logger.warn(`Failed to load drift report from ${file}`, error);
          }
        }
        
        logger.info(`Loaded drift reports for ${this.driftReports.size} models`);
      } catch (error) {
        logger.info('No existing drift reports found');
      }
    } catch (error) {
      logger.error('Failed to load drift reports', error);
      throw error;
    }
  }
  
  /**
   * Save drift report to disk
   * @param {Object} report - Drift report
   * @private
   */
  async _saveDriftReport(report) {
    try {
      const reportFile = path.join(
        this.options.driftPath,
        'reports',
        `${report.modelId}-${report.timestamp.replace(/:/g, '-')}.json`
      );
      
      await fs.writeFile(
        reportFile,
        JSON.stringify(report, null, 2)
      );
      
      logger.debug(`Drift report saved for model ${report.modelId}`);
    } catch (error) {
      logger.error(`Failed to save drift report for model ${report.modelId}`, error);
      throw error;
    }
  }
  
  /**
   * Start drift detection
   * @private
   */
  _startDriftDetection() {
    // Clear any existing timer
    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
    }
    
    // Start periodic drift detection
    this.detectionTimer = setInterval(() => {
      this._detectDrift().catch(error => {
        logger.error('Error detecting drift', error);
      });
    }, this.options.detectionInterval);
    
    logger.info(`Drift detection started with ${this.options.detectionInterval}ms interval`);
  }
  
  /**
   * Stop drift detection
   * @private
   */
  _stopDriftDetection() {
    if (this.detectionTimer) {
      clearInterval(this.detectionTimer);
      this.detectionTimer = null;
      logger.info('Drift detection stopped');
    }
  }
  
  /**
   * Detect drift for all models
   * @private
   */
  async _detectDrift() {
    try {
      const timestamp = new Date().toISOString();
      
      for (const [modelId, baseline] of this.baselines.entries()) {
        try {
          // Skip if baseline is not ready
          if (!baseline.isReady) {
            continue;
          }
          
          // Get current data statistics
          const currentStats = await this._getCurrentDataStatistics(modelId);
          
          if (!currentStats) {
            continue;
          }
          
          // Detect drift
          const driftResults = await this._calculateDrift(baseline, currentStats);
          
          // Create drift report
          const report = {
            id: `drift-${modelId}-${Date.now()}`,
            modelId,
            timestamp,
            baselineStats: baseline.statistics,
            currentStats,
            driftResults,
            overallSeverity: this._calculateOverallSeverity(driftResults),
            recommendations: this._generateRecommendations(driftResults)
          };
          
          // Store report
          if (!this.driftReports.has(modelId)) {
            this.driftReports.set(modelId, []);
          }
          
          this.driftReports.get(modelId).push(report);
          
          // Save report to disk
          await this._saveDriftReport(report);
          
          // Emit event if drift detected
          if (report.overallSeverity !== DriftSeverity.NONE) {
            this.eventEmitter.emit('drift-detected', {
              modelId,
              severity: report.overallSeverity,
              report,
              timestamp: new Date()
            });
          }
        } catch (error) {
          logger.error(`Failed to detect drift for model ${modelId}`, error);
        }
      }
      
      // Emit detection completed event
      this.eventEmitter.emit('drift-detection-completed', {
        timestamp: new Date(),
        modelsChecked: this.baselines.size
      });
    } catch (error) {
      logger.error('Failed to detect drift', error);
      throw error;
    }
  }
  
  /**
   * Get current data statistics for a model
   * @param {string} modelId - Model ID
   * @returns {Promise<Object>} Current statistics
   * @private
   */
  async _getCurrentDataStatistics(modelId) {
    // This is a placeholder implementation
    // In a real system, this would collect statistics from recent model inputs/outputs
    
    // For demonstration, we'll generate synthetic statistics
    const features = ['feature1', 'feature2', 'feature3'];
    const stats = {
      features: {},
      predictions: {},
      timestamp: new Date().toISOString()
    };
    
    for (const feature of features) {
      stats.features[feature] = {
        mean: Math.random() * 100,
        std: Math.random() * 20,
        min: Math.random() * 10,
        max: 90 + Math.random() * 10,
        distribution: this._generateDistribution()
      };
    }
    
    stats.predictions = {
      distribution: this._generateDistribution(),
      classBalance: {
        class0: 0.5 + (Math.random() - 0.5) * 0.2,
        class1: 0.5 + (Math.random() - 0.5) * 0.2
      }
    };
    
    return stats;
  }
  
  /**
   * Generate a distribution for demonstration
   * @returns {Array} Distribution bins
   * @private
   */
  _generateDistribution() {
    const bins = 10;
    const distribution = [];
    
    for (let i = 0; i < bins; i++) {
      distribution.push({
        bin: i,
        count: Math.floor(Math.random() * 100),
        frequency: Math.random()
      });
    }
    
    return distribution;
  }
  
  /**
   * Calculate drift between baseline and current statistics
   * @param {Object} baseline - Baseline statistics
   * @param {Object} currentStats - Current statistics
   * @returns {Promise<Object>} Drift results
   * @private
   */
  async _calculateDrift(baseline, currentStats) {
    const driftResults = {
      features: {},
      predictions: {},
      overall: {}
    };
    
    // Calculate feature drift
    for (const [feature, baselineStats] of Object.entries(baseline.statistics.features || {})) {
      const currentFeatureStats = currentStats.features[feature];
      
      if (!currentFeatureStats) {
        continue;
      }
      
      driftResults.features[feature] = {
        statistical: this._calculateStatisticalDrift(baselineStats, currentFeatureStats),
        distribution: this._calculateDistributionDrift(
          baselineStats.distribution,
          currentFeatureStats.distribution
        )
      };
    }
    
    // Calculate prediction drift
    if (baseline.statistics.predictions && currentStats.predictions) {
      driftResults.predictions = {
        distribution: this._calculateDistributionDrift(
          baseline.statistics.predictions.distribution,
          currentStats.predictions.distribution
        ),
        classBalance: this._calculateClassBalanceDrift(
          baseline.statistics.predictions.classBalance,
          currentStats.predictions.classBalance
        )
      };
    }
    
    // Calculate overall drift score
    driftResults.overall = this._calculateOverallDrift(driftResults);
    
    return driftResults;
  }
  
  /**
   * Calculate statistical drift
   * @param {Object} baselineStats - Baseline statistics
   * @param {Object} currentStats - Current statistics
   * @returns {Object} Statistical drift metrics
   * @private
   */
  _calculateStatisticalDrift(baselineStats, currentStats) {
    // Calculate normalized differences
    const meanDrift = Math.abs(currentStats.mean - baselineStats.mean) / 
                     (baselineStats.std || 1);
    const stdDrift = Math.abs(currentStats.std - baselineStats.std) / 
                    (baselineStats.std || 1);
    
    return {
      meanDrift,
      stdDrift,
      score: (meanDrift + stdDrift) / 2,
      severity: this._getDriftSeverity((meanDrift + stdDrift) / 2)
    };
  }
  
  /**
   * Calculate distribution drift using KL divergence
   * @param {Array} baselineDist - Baseline distribution
   * @param {Array} currentDist - Current distribution
   * @returns {Object} Distribution drift metrics
   * @private
   */
  _calculateDistributionDrift(baselineDist, currentDist) {
    if (!baselineDist || !currentDist) {
      return { klDivergence: 0, severity: DriftSeverity.NONE };
    }
    
    // Calculate KL divergence
    let klDivergence = 0;
    
    for (let i = 0; i < baselineDist.length; i++) {
      const p = baselineDist[i].frequency || 0.001; // Avoid log(0)
      const q = currentDist[i]?.frequency || 0.001;
      
      klDivergence += p * Math.log(p / q);
    }
    
    return {
      klDivergence,
      score: klDivergence,
      severity: this._getDriftSeverity(klDivergence)
    };
  }
  
  /**
   * Calculate class balance drift
   * @param {Object} baselineBalance - Baseline class balance
   * @param {Object} currentBalance - Current class balance
   * @returns {Object} Class balance drift metrics
   * @private
   */
  _calculateClassBalanceDrift(baselineBalance, currentBalance) {
    if (!baselineBalance || !currentBalance) {
      return { score: 0, severity: DriftSeverity.NONE };
    }
    
    let totalDrift = 0;
    let count = 0;
    
    for (const [className, baselineProb] of Object.entries(baselineBalance)) {
      const currentProb = currentBalance[className] || 0;
      totalDrift += Math.abs(currentProb - baselineProb);
      count++;
    }
    
    const score = count > 0 ? totalDrift / count : 0;
    
    return {
      score,
      severity: this._getDriftSeverity(score)
    };
  }
  
  /**
   * Calculate overall drift score
   * @param {Object} driftResults - Individual drift results
   * @returns {Object} Overall drift metrics
   * @private
   */
  _calculateOverallDrift(driftResults) {
    const scores = [];
    
    // Collect all drift scores
    for (const featureDrift of Object.values(driftResults.features)) {
      if (featureDrift.statistical) {
        scores.push(featureDrift.statistical.score);
      }
      if (featureDrift.distribution) {
        scores.push(featureDrift.distribution.score);
      }
    }
    
    if (driftResults.predictions) {
      if (driftResults.predictions.distribution) {
        scores.push(driftResults.predictions.distribution.score);
      }
      if (driftResults.predictions.classBalance) {
        scores.push(driftResults.predictions.classBalance.score);
      }
    }
    
    // Calculate overall score
    const overallScore = scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;
    
    return {
      score: overallScore,
      severity: this._getDriftSeverity(overallScore)
    };
  }
  
  /**
   * Get drift severity based on score
   * @param {number} score - Drift score
   * @returns {string} Drift severity
   * @private
   */
  _getDriftSeverity(score) {
    const { driftThresholds } = this.options;
    
    if (score >= driftThresholds.critical) {
      return DriftSeverity.CRITICAL;
    } else if (score >= driftThresholds.high) {
      return DriftSeverity.HIGH;
    } else if (score >= driftThresholds.medium) {
      return DriftSeverity.MEDIUM;
    } else if (score >= driftThresholds.low) {
      return DriftSeverity.LOW;
    } else {
      return DriftSeverity.NONE;
    }
  }
  
  /**
   * Calculate overall severity from drift results
   * @param {Object} driftResults - Drift results
   * @returns {string} Overall severity
   * @private
   */
  _calculateOverallSeverity(driftResults) {
    if (driftResults.overall && driftResults.overall.severity) {
      return driftResults.overall.severity;
    }
    
    return DriftSeverity.NONE;
  }
  
  /**
   * Generate recommendations based on drift results
   * @param {Object} driftResults - Drift results
   * @returns {Array} Recommendations
   * @private
   */
  _generateRecommendations(driftResults) {
    const recommendations = [];
    const severity = driftResults.overall?.severity || DriftSeverity.NONE;
    
    if (severity === DriftSeverity.CRITICAL) {
      recommendations.push({
        priority: 'high',
        action: 'immediate',
        message: 'Critical data drift detected. Model performance may be severely impacted.',
        steps: [
          'Investigate the source of drift immediately',
          'Consider rolling back to a previous model version',
          'Collect new training data that reflects current distribution',
          'Retrain the model with updated data'
        ]
      });
    } else if (severity === DriftSeverity.HIGH) {
      recommendations.push({
        priority: 'high',
        action: 'urgent',
        message: 'High data drift detected. Model performance is likely degraded.',
        steps: [
          'Monitor model performance metrics closely',
          'Analyze which features are drifting most',
          'Plan for model retraining within the next few days',
          'Consider implementing online learning if appropriate'
        ]
      });
    } else if (severity === DriftSeverity.MEDIUM) {
      recommendations.push({
        priority: 'medium',
        action: 'monitor',
        message: 'Moderate data drift detected. Model performance may be affected.',
        steps: [
          'Continue monitoring drift trends',
          'Schedule model evaluation on recent data',
          'Plan for retraining if drift continues',
          'Review feature engineering pipeline'
        ]
      });
    } else if (severity === DriftSeverity.LOW) {
      recommendations.push({
        priority: 'low',
        action: 'observe',
        message: 'Low data drift detected. Model performance should be stable.',
        steps: [
          'Continue regular monitoring',
          'Document drift patterns for future reference',
          'No immediate action required'
        ]
      });
    }
    
    // Add feature-specific recommendations
    for (const [feature, drift] of Object.entries(driftResults.features || {})) {
      if (drift.statistical?.severity === DriftSeverity.HIGH ||
          drift.statistical?.severity === DriftSeverity.CRITICAL) {
        recommendations.push({
          priority: 'medium',
          action: 'investigate',
          message: `Feature "${feature}" shows significant drift`,
          steps: [
            `Investigate data source for feature "${feature}"`,
            'Check for data quality issues',
            'Consider feature transformation or removal'
          ]
        });
      }
    }
    
    return recommendations;
  }
  
  /**
   * Create or update baseline for a model
   * @param {string} modelId - Model ID
   * @param {Object} data - Training data or statistics
   * @param {Object} options - Baseline options
   * @returns {Promise<Object>} Created baseline
   */
  async createBaseline(modelId, data, options = {}) {
    try {
      logger.info(`Creating baseline for model ${modelId}`);
      
      // Calculate statistics from data
      const statistics = await this._calculateStatistics(data, options);
      
      // Create baseline
      const baseline = {
        modelId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        statistics,
        metadata: {
          dataSize: Array.isArray(data) ? data.length : data.size || 0,
          features: options.features || [],
          ...options.metadata
        },
        isReady: true
      };
      
      // Store baseline
      this.baselines.set(modelId, baseline);
      
      // Save to disk
      await this._saveBaselines();
      
      logger.info(`Baseline created for model ${modelId}`);
      
      // Emit event
      this.eventEmitter.emit('baseline-created', {
        modelId,
        timestamp: new Date()
      });
      
      return baseline;
    } catch (error) {
      logger.error(`Failed to create baseline for model ${modelId}`, error);
      throw error;
    }
  }
  
  /**
   * Calculate statistics from data
   * @param {Object} data - Data to calculate statistics from
   * @param {Object} options - Calculation options
   * @returns {Promise<Object>} Calculated statistics
   * @private
   */
  async _calculateStatistics(data, options = {}) {
    const statistics = {
      features: {},
      predictions: {}
    };
    
    // If data is already statistics, return it
    if (data.features && !Array.isArray(data)) {
      return data;
    }
    
    // Calculate feature statistics
    if (Array.isArray(data) && data.length > 0) {
      const features = options.features || Object.keys(data[0]);
      
      for (const feature of features) {
        const values = data.map(item => item[feature]).filter(v => v !== null && v !== undefined);
        
        if (values.length === 0) {
          continue;
        }
        
        // Calculate basic statistics
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        // Calculate distribution
        const distribution = this._calculateDistribution(values);
        
        statistics.features[feature] = {
          mean,
          std,
          min,
          max,
          distribution
        };
      }
    }
    
    return statistics;
  }
  
  /**
   * Calculate distribution from values
   * @param {Array} values - Values to calculate distribution from
   * @param {number} bins - Number of bins
   * @returns {Array} Distribution bins
   * @private
   */
  _calculateDistribution(values, bins = 10) {
    if (!values || values.length === 0) {
      return [];
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binWidth = (max - min) / bins;
    
    const distribution = [];
    
    for (let i = 0; i < bins; i++) {
      const binMin = min + i * binWidth;
      const binMax = binMin + binWidth;
      
      const count = values.filter(v => v >= binMin && v < binMax).length;
      
      distribution.push({
        bin: i,
        min: binMin,
        max: binMax,
        count,
        frequency: count / values.length
      });
    }
    
    return distribution;
  }
  
  /**
   * Get baseline for a model
   * @param {string} modelId - Model ID
   * @returns {Object} Baseline
   */
  getBaseline(modelId) {
    return this.baselines.get(modelId);
  }
  
  /**
   * Get drift reports for a model
   * @param {string} modelId - Model ID
   * @param {Object} options - Query options
   * @returns {Array} Drift reports
   */
  getDriftReports(modelId, options = {}) {
    const reports = this.driftReports.get(modelId) || [];
    
    // Apply filters if specified
    let filteredReports = [...reports];
    
    if (options.startDate) {
      filteredReports = filteredReports.filter(
        report => new Date(report.timestamp) >= new Date(options.startDate)
      );
    }
    
    if (options.endDate) {
      filteredReports = filteredReports.filter(
        report => new Date(report.timestamp) <= new Date(options.endDate)
      );
    }
    
    if (options.severity) {
      filteredReports = filteredReports.filter(
        report => report.overallSeverity === options.severity
      );
    }
    
    // Sort by timestamp (newest first)
    filteredReports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply limit if specified
    if (options.limit) {
      filteredReports = filteredReports.slice(0, options.limit);
    }
    
    return filteredReports;
  }
  
  /**
   * Get latest drift report for a model
   * @param {string} modelId - Model ID
   * @returns {Object} Latest drift report
   */
  getLatestDriftReport(modelId) {
    const reports = this.driftReports.get(modelId) || [];
    
    if (reports.length === 0) {
      return null;
    }
    
    // Sort by timestamp and return the latest
    return reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
  }
  
  /**
   * Manually trigger drift detection for a model
   * @param {string} modelId - Model ID
   * @param {Object} currentData - Current data or statistics
   * @returns {Promise<Object>} Drift report
   */
  async detectDriftForModel(modelId, currentData) {
    try {
      logger.info(`Manually detecting drift for model ${modelId}`);
      
      // Get baseline
      const baseline = this.baselines.get(modelId);
      
      if (!baseline) {
        throw new Error(`No baseline found for model ${modelId}`);
      }
      
      if (!baseline.isReady) {
        throw new Error(`Baseline for model ${modelId} is not ready`);
      }
      
      // Calculate current statistics if needed
      const currentStats = currentData.features
        ? currentData
        : await this._calculateStatistics(currentData, {
            features: baseline.metadata.features
          });
      
      // Detect drift
      const driftResults = await this._calculateDrift(baseline, currentStats);
      
      // Create drift report
      const report = {
        id: `drift-${modelId}-${Date.now()}`,
        modelId,
        timestamp: new Date().toISOString(),
        baselineStats: baseline.statistics,
        currentStats,
        driftResults,
        overallSeverity: this._calculateOverallSeverity(driftResults),
        recommendations: this._generateRecommendations(driftResults)
      };
      
      // Store report
      if (!this.driftReports.has(modelId)) {
        this.driftReports.set(modelId, []);
      }
      
      this.driftReports.get(modelId).push(report);
      
      // Save report to disk
      await this._saveDriftReport(report);
      
      // Emit event if drift detected
      if (report.overallSeverity !== DriftSeverity.NONE) {
        this.eventEmitter.emit('drift-detected', {
          modelId,
          severity: report.overallSeverity,
          report,
          timestamp: new Date()
        });
      }
      
      return report;
    } catch (error) {
      logger.error(`Failed to detect drift for model ${modelId}`, error);
      throw error;
    }
  }
  
  /**
   * Register for drift events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  
  /**
   * Unregister from drift events
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
    this._stopDriftDetection();
    this.eventEmitter.removeAllListeners();
  }
}

module.exports = {
  DataDriftService,
  DriftType,
  DriftDetectionMethod,
  DriftSeverity
}; 