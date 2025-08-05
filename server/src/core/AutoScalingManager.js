/**
 * AutoScalingManager.js
 * 
 * Comprehensive auto-scaling management for AeroSuite
 * Implements RF039 - Configure auto-scaling for all services
 */

const os = require('os');
const cluster = require('cluster');
const Redis = require('redis');
const logger = require('../utils/logger');
const { EventEmitter } = require('../core/EventEmitter');

/**
 * Auto-Scaling Manager
 * Provides centralized management of auto-scaling capabilities
 */
class AutoScalingManager {
  /**
   * Create a new auto-scaling manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      // Redis configuration
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      metricsPrefix: 'aerosuite:metrics:',
      scalingPrefix: 'aerosuite:scaling:',
      
      // Scaling configuration
      scalingCheckInterval: parseInt(process.env.SCALING_CHECK_INTERVAL || 30000), // 30 seconds
      predictiveScalingEnabled: process.env.PREDICTIVE_SCALING === 'true',
      resourceThresholds: {
        cpuHigh: parseFloat(process.env.CPU_HIGH_THRESHOLD || 0.7),   // 70%
        cpuLow: parseFloat(process.env.CPU_LOW_THRESHOLD || 0.3),     // 30%
        memoryHigh: parseFloat(process.env.MEMORY_HIGH_THRESHOLD || 0.8), // 80%
        memoryLow: parseFloat(process.env.MEMORY_LOW_THRESHOLD || 0.4)    // 40%
      },
      
      // Scaling limits
      minInstances: parseInt(process.env.MIN_INSTANCES || 1),
      maxInstances: parseInt(process.env.MAX_INSTANCES || 10),
      scaleUpCooldown: parseInt(process.env.SCALE_UP_COOLDOWN || 60000), // 1 minute
      scaleDownCooldown: parseInt(process.env.SCALE_DOWN_COOLDOWN || 300000), // 5 minutes
      
      // Metrics configuration
      metricsInterval: parseInt(process.env.METRICS_INTERVAL || 5000), // 5 seconds
      metricsTTL: parseInt(process.env.METRICS_TTL || 60), // 60 seconds
      sampleSize: parseInt(process.env.METRICS_SAMPLE_SIZE || 10),
      
      // Instance identification
      podName: process.env.KUBERNETES_POD_NAME || os.hostname(),
      nodeId: process.env.NODE_ID || `node_${Math.random().toString(36).substring(2, 10)}`,
      
      // Override with provided options
      ...options
    };
    
    // Initialize state
    this.redisClient = null;
    this.scalingCheckInterval = null;
    this.metricsCollectionInterval = null;
    this.initialized = false;
    this.eventEmitter = EventEmitter.getInstance();
    
    // Metrics state
    this.currentMetrics = {
      cpu: 0,
      memory: 0,
      requestsPerMinute: 0,
      responseTime: 0,
      connections: 0,
      timestamp: Date.now()
    };
    
    // Scaling history for metrics analysis
    this.scalingHistory = [];
    this.lastScaleUpTime = 0;
    this.lastScaleDownTime = 0;
  }
  
  /**
   * Initialize the auto-scaling manager
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      logger.info('Initializing Auto-Scaling Manager...');
      
      // Connect to Redis for distributed metrics
      await this._initRedisClient();
      
      // Start collecting metrics
      this._startMetricsCollection();
      
      // Start scaling check interval if predictive scaling is enabled
      if (this.options.predictiveScalingEnabled) {
        this.scalingCheckInterval = setInterval(
          () => this._checkScalingRecommendations(),
          this.options.scalingCheckInterval
        );
        logger.info(`Predictive scaling enabled, checking every ${this.options.scalingCheckInterval / 1000} seconds`);
      }
      
      // Register event listeners
      this._registerEventListeners();
      
      this.initialized = true;
      logger.info('Auto-Scaling Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Auto-Scaling Manager:', error);
      return false;
    }
  }
  
  /**
   * Initialize Redis client for sharing metrics
   * @returns {Promise<boolean>} Success status
   * @private
   */
  async _initRedisClient() {
    if (!this.options.redisUrl) {
      logger.warn('Redis URL not provided for Auto-Scaling Manager');
      return false;
    }
    
    try {
      this.redisClient = Redis.createClient({
        url: this.options.redisUrl
      });
      
      this.redisClient.on('error', (err) => {
        logger.error('Redis client error in Auto-Scaling Manager:', err);
      });
      
      await this.redisClient.connect();
      logger.info('Connected to Redis for Auto-Scaling Manager');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Redis client for Auto-Scaling Manager:', error);
      return false;
    }
  }
  
  /**
   * Start metrics collection
   * @private
   */
  _startMetricsCollection() {
    this.metricsCollectionInterval = setInterval(
      () => this._collectSystemMetrics(),
      this.options.metricsInterval
    );
    
    // Collect initial metrics
    this._collectSystemMetrics();
  }
  
  /**
   * Register event listeners
   * @private
   */
  _registerEventListeners() {
    // Listen for request events to track metrics
    this.eventEmitter.on('request:start', (data) => {
      this._trackRequestStart(data);
    });
    
    this.eventEmitter.on('request:end', (data) => {
      this._trackRequestEnd(data);
    });
    
    // Listen for scaling events
    this.eventEmitter.on('scaling:up', (data) => {
      this.lastScaleUpTime = Date.now();
      logger.info(`Scaling up: ${JSON.stringify(data)}`);
    });
    
    this.eventEmitter.on('scaling:down', (data) => {
      this.lastScaleDownTime = Date.now();
      logger.info(`Scaling down: ${JSON.stringify(data)}`);
    });
  }
  
  /**
   * Collect system metrics
   * @private
   */
  _collectSystemMetrics() {
    try {
      // Get CPU usage (average across all cores)
      const cpuUsage = os.loadavg()[0] / os.cpus().length;
      
      // Get memory usage
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const memoryUsage = (totalMemory - freeMemory) / totalMemory;
      
      // Update current metrics
      this.currentMetrics = {
        ...this.currentMetrics,
        cpu: cpuUsage,
        memory: memoryUsage,
        timestamp: Date.now()
      };
      
      // Store metrics in scaling history
      this.scalingHistory.push({ ...this.currentMetrics });
      
      // Keep only the last N samples
      if (this.scalingHistory.length > this.options.sampleSize) {
        this.scalingHistory.shift();
      }
      
      // If in master process, publish metrics to Redis
      if (this.redisClient && (cluster.isMaster || !cluster.isWorker)) {
        this._publishMetricsToRedis();
      }
    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }
  
  /**
   * Publish metrics to Redis
   * @private
   */
  async _publishMetricsToRedis() {
    if (!this.redisClient) return;
    
    try {
      const metricsKey = `${this.options.metricsPrefix}${this.options.nodeId}`;
      await this.redisClient.set(
        metricsKey,
        JSON.stringify(this.currentMetrics),
        { EX: this.options.metricsTTL }
      );
    } catch (error) {
      logger.error('Error publishing metrics to Redis:', error);
    }
  }
  
  /**
   * Track request start
   * @param {Object} data - Request data
   * @private
   */
  _trackRequestStart(data) {
    // Increment active connections
    this.currentMetrics.connections++;
  }
  
  /**
   * Track request end
   * @param {Object} data - Request data
   * @private
   */
  _trackRequestEnd(data) {
    // Decrement active connections
    this.currentMetrics.connections = Math.max(0, this.currentMetrics.connections - 1);
    
    // Update response time metrics (rolling average)
    if (data.duration) {
      const currentAvg = this.currentMetrics.responseTime;
      const newAvg = currentAvg === 0 
        ? data.duration 
        : currentAvg * 0.9 + data.duration * 0.1; // Weighted average
      
      this.currentMetrics.responseTime = newAvg;
    }
    
    // Update requests per minute (rolling window)
    this.currentMetrics.requestsPerMinute++;
    setTimeout(() => {
      this.currentMetrics.requestsPerMinute = Math.max(0, this.currentMetrics.requestsPerMinute - 1);
    }, 60000);
  }
  
  /**
   * Check if scaling is needed based on metrics
   * @returns {Promise<Object>} Scaling recommendation
   * @private
   */
  async _checkScalingRecommendations() {
    try {
      // Get all node metrics from Redis
      const nodeKeys = await this.redisClient.keys(`${this.options.metricsPrefix}*`);
      const allNodeMetrics = [];
      
      for (const key of nodeKeys) {
        const metricsStr = await this.redisClient.get(key);
        if (metricsStr) {
          const metrics = JSON.parse(metricsStr);
          const nodeId = key.replace(this.options.metricsPrefix, '');
          allNodeMetrics.push({ nodeId, ...metrics });
        }
      }
      
      // Calculate aggregate metrics
      const aggregateMetrics = this._calculateAggregateMetrics(allNodeMetrics);
      
      // Check if scaling is needed
      const recommendation = this._generateScalingRecommendation(aggregateMetrics);
      
      // Check cooldown periods
      if (recommendation.action === 'scale_up' && 
          Date.now() - this.lastScaleUpTime < this.options.scaleUpCooldown) {
        recommendation.action = 'maintain';
        recommendation.reason = 'Scale up cooldown period active';
      } else if (recommendation.action === 'scale_down' && 
                 Date.now() - this.lastScaleDownTime < this.options.scaleDownCooldown) {
        recommendation.action = 'maintain';
        recommendation.reason = 'Scale down cooldown period active';
      }
      
      // Log recommendation if not maintaining
      if (recommendation.action !== 'maintain') {
        logger.info(`Scaling recommendation: ${recommendation.action} to ${recommendation.targetNodes} nodes (current: ${allNodeMetrics.length})`);
        logger.info(`Recommendation reason: ${recommendation.reason}`);
        
        // Emit scaling event
        this.eventEmitter.emit(`scaling:${recommendation.action.replace('scale_', '')}`, {
          currentNodes: allNodeMetrics.length,
          targetNodes: recommendation.targetNodes,
          reason: recommendation.reason,
          metrics: aggregateMetrics
        });
      }
      
      // Publish recommendation to Redis
      await this.redisClient.set(
        `${this.options.scalingPrefix}recommendation`,
        JSON.stringify({
          timestamp: Date.now(),
          recommendation,
          metrics: aggregateMetrics
        })
      );
      
      return recommendation;
    } catch (error) {
      logger.error('Error in scaling check:', error);
      return { action: 'maintain', reason: 'Error checking metrics' };
    }
  }
  
  /**
   * Calculate aggregate metrics from all nodes
   * @param {Array} nodeMetrics - Array of node metrics
   * @returns {Object} Aggregate metrics
   * @private
   */
  _calculateAggregateMetrics(nodeMetrics) {
    if (!nodeMetrics || nodeMetrics.length === 0) {
      return {
        avgCpu: 0,
        avgMemory: 0,
        totalRequestsPerMinute: 0,
        avgResponseTime: 0,
        totalConnections: 0,
        totalNodes: 0
      };
    }
    
    const totalNodes = nodeMetrics.length;
    let totalCpu = 0;
    let totalMemory = 0;
    let totalRequestsPerMinute = 0;
    let totalResponseTime = 0;
    let totalConnections = 0;
    
    // Sum metrics across all nodes
    for (const metrics of nodeMetrics) {
      totalCpu += metrics.cpu || 0;
      totalMemory += metrics.memory || 0;
      totalRequestsPerMinute += metrics.requestsPerMinute || 0;
      totalResponseTime += metrics.responseTime || 0;
      totalConnections += metrics.connections || 0;
    }
    
    return {
      avgCpu: totalCpu / totalNodes,
      avgMemory: totalMemory / totalNodes,
      totalRequestsPerMinute,
      avgResponseTime: totalResponseTime / totalNodes,
      totalConnections,
      totalNodes
    };
  }
  
  /**
   * Generate scaling recommendation based on metrics
   * @param {Object} metrics - Aggregate metrics
   * @returns {Object} Scaling recommendation
   * @private
   */
  _generateScalingRecommendation(metrics) {
    const { avgCpu, avgMemory, totalNodes } = metrics;
    
    // Default recommendation
    let recommendation = {
      action: 'maintain',
      targetNodes: totalNodes,
      reason: 'Current metrics within thresholds'
    };
    
    // Check CPU high threshold
    if (avgCpu > this.options.resourceThresholds.cpuHigh) {
      const targetNodes = Math.ceil(totalNodes * (avgCpu / this.options.resourceThresholds.cpuHigh));
      recommendation = {
        action: 'scale_up',
        targetNodes: Math.min(
          Math.max(targetNodes, totalNodes + 1), // At least add 1 node
          this.options.maxInstances, // But don't exceed max instances
          totalNodes * 2 // And don't more than double the nodes
        ),
        reason: `CPU usage (${(avgCpu * 100).toFixed(1)}%) exceeds high threshold (${this.options.resourceThresholds.cpuHigh * 100}%)`
      };
    }
    // Check memory high threshold
    else if (avgMemory > this.options.resourceThresholds.memoryHigh) {
      const targetNodes = Math.ceil(totalNodes * (avgMemory / this.options.resourceThresholds.memoryHigh));
      recommendation = {
        action: 'scale_up',
        targetNodes: Math.min(
          Math.max(targetNodes, totalNodes + 1), // At least add 1 node
          this.options.maxInstances, // But don't exceed max instances
          totalNodes * 2 // And don't more than double the nodes
        ),
        reason: `Memory usage (${(avgMemory * 100).toFixed(1)}%) exceeds high threshold (${this.options.resourceThresholds.memoryHigh * 100}%)`
      };
    }
    // Check CPU low threshold (only if we have more than min instances)
    else if (avgCpu < this.options.resourceThresholds.cpuLow && totalNodes > this.options.minInstances) {
      const targetNodes = Math.max(
        this.options.minInstances,
        Math.floor(totalNodes * (avgCpu / this.options.resourceThresholds.cpuLow))
      );
      recommendation = {
        action: 'scale_down',
        targetNodes: Math.max(
          targetNodes,
          Math.ceil(totalNodes * 0.5), // Remove at most half the nodes
          this.options.minInstances // But maintain minimum instances
        ),
        reason: `CPU usage (${(avgCpu * 100).toFixed(1)}%) below low threshold (${this.options.resourceThresholds.cpuLow * 100}%)`
      };
    }
    // Check memory low threshold (only if we have more than min instances)
    else if (avgMemory < this.options.resourceThresholds.memoryLow && totalNodes > this.options.minInstances) {
      const targetNodes = Math.max(
        this.options.minInstances,
        Math.floor(totalNodes * (avgMemory / this.options.resourceThresholds.memoryLow))
      );
      recommendation = {
        action: 'scale_down',
        targetNodes: Math.max(
          targetNodes,
          Math.ceil(totalNodes * 0.5), // Remove at most half the nodes
          this.options.minInstances // But maintain minimum instances
        ),
        reason: `Memory usage (${(avgMemory * 100).toFixed(1)}%) below low threshold (${this.options.resourceThresholds.memoryLow * 100}%)`
      };
    }
    
    return recommendation;
  }
  
  /**
   * Calculate scaling efficiency metrics
   * @returns {Object} Scaling efficiency metrics
   */
  calculateScalingEfficiency() {
    try {
      // Calculate efficiency based on historical scaling data
      const history = [...this.scalingHistory];
      
      if (history.length < 2) {
        return {
          efficiency: 1,
          bottlenecks: [],
          recommendations: []
        };
      }
      
      // Calculate resource utilization trends
      const cpuTrend = this._calculateTrend(history.map(h => h.cpu));
      const memoryTrend = this._calculateTrend(history.map(h => h.memory));
      const requestsTrend = this._calculateTrend(history.map(h => h.requestsPerMinute));
      
      // Identify bottlenecks
      const bottlenecks = [];
      if (cpuTrend > 0.1) bottlenecks.push('CPU usage is trending upward');
      if (memoryTrend > 0.1) bottlenecks.push('Memory usage is trending upward');
      
      // Generate recommendations
      const recommendations = [];
      if (cpuTrend > 0.1 && memoryTrend < 0.05) {
        recommendations.push('Consider CPU-optimized instances');
      } else if (memoryTrend > 0.1 && cpuTrend < 0.05) {
        recommendations.push('Consider memory-optimized instances');
      }
      
      // Calculate efficiency score (simplified)
      const avgCpu = history.reduce((sum, h) => sum + h.cpu, 0) / history.length;
      const avgMemory = history.reduce((sum, h) => sum + h.memory, 0) / history.length;
      const efficiency = (avgCpu + avgMemory) / 2; // Simple average of resource utilization
      
      return {
        efficiency: Math.min(efficiency * 1.5, 1), // Scale to 0-1 range
        bottlenecks,
        recommendations,
        trends: {
          cpu: cpuTrend,
          memory: memoryTrend,
          requests: requestsTrend
        }
      };
    } catch (error) {
      logger.error('Error calculating scaling efficiency:', error);
      return {
        efficiency: 0.5,
        bottlenecks: ['Error calculating efficiency'],
        recommendations: []
      };
    }
  }
  
  /**
   * Calculate trend from array of values
   * @param {Array} values - Array of numeric values
   * @returns {number} Trend value (-1 to 1)
   * @private
   */
  _calculateTrend(values) {
    if (values.length < 2) return 0;
    
    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
  
  /**
   * Get current metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return { ...this.currentMetrics };
  }
  
  /**
   * Get scaling history
   * @returns {Array} Scaling history
   */
  getScalingHistory() {
    return [...this.scalingHistory];
  }
  
  /**
   * Create Express middleware for request tracking
   * @returns {Function} Express middleware
   */
  createRequestTrackerMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Emit request start event
      this.eventEmitter.emit('request:start', {
        path: req.path,
        method: req.method,
        timestamp: startTime
      });
      
      // Track response
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Emit request end event
        this.eventEmitter.emit('request:end', {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration,
          timestamp: Date.now()
        });
      });
      
      next();
    };
  }
  
  /**
   * Shutdown the auto-scaling manager
   * @returns {Promise<void>}
   */
  async shutdown() {
    logger.info('Shutting down Auto-Scaling Manager...');
    
    // Clear intervals
    if (this.scalingCheckInterval) {
      clearInterval(this.scalingCheckInterval);
      this.scalingCheckInterval = null;
    }
    
    if (this.metricsCollectionInterval) {
      clearInterval(this.metricsCollectionInterval);
      this.metricsCollectionInterval = null;
    }
    
    // Close Redis client
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        logger.info('Redis client closed');
      } catch (error) {
        logger.error('Error closing Redis client:', error);
      }
      this.redisClient = null;
    }
    
    this.initialized = false;
    logger.info('Auto-Scaling Manager shut down');
  }
}

// Export singleton instance
let instance = null;

/**
 * Get the singleton instance of the auto-scaling manager
 * @param {Object} options - Configuration options
 * @returns {AutoScalingManager} Singleton instance
 */
function getInstance(options = {}) {
  if (!instance) {
    instance = new AutoScalingManager(options);
  }
  return instance;
}

module.exports = {
  AutoScalingManager,
  getInstance
}; 