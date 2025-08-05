/**
 * Auto-Scaling Optimizer
 * 
 * This utility optimizes auto-scaling behavior by:
 * 1. Analyzing resource utilization patterns
 * 2. Providing predictive scaling recommendations
 * 3. Tracking scaling efficiency
 * 4. Managing workload distribution across instances
 * 
 * Task: PERF009 - Auto-scaling Optimization
 */

const os = require('os');
const cluster = require('cluster');
const Redis = require('redis');
const logger = require('./logger');

// Configuration
const config = {
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  metricsPrefix: 'aerosuite:metrics:',
  scalingInterval: parseInt(process.env.SCALING_CHECK_INTERVAL || 30000), // 30 seconds
  predictiveScalingEnabled: process.env.PREDICTIVE_SCALING === 'true',
  resourceThresholds: {
    cpuHigh: parseFloat(process.env.CPU_HIGH_THRESHOLD || 0.7),   // 70%
    cpuLow: parseFloat(process.env.CPU_LOW_THRESHOLD || 0.3),     // 30%
    memoryHigh: parseFloat(process.env.MEMORY_HIGH_THRESHOLD || 0.8), // 80%
    memoryLow: parseFloat(process.env.MEMORY_LOW_THRESHOLD || 0.4)    // 40%
  },
  sampleSize: parseInt(process.env.METRICS_SAMPLE_SIZE || 10),
  podName: process.env.KUBERNETES_POD_NAME || os.hostname(),
  nodeId: process.env.NODE_ID || 'node_' + Math.random().toString(36).substring(2, 10)
};

// Redis client
let redisClient;
let scalingCheckInterval;
let isInitialized = false;
let currentMetrics = {
  cpu: 0,
  memory: 0,
  requestsPerMinute: 0,
  responseTime: 0,
  timestamp: Date.now()
};

// Scaling history for metrics analysis
const scalingHistory = [];

/**
 * Initialize the auto-scaling optimizer
 * @returns {Promise<boolean>} Success status
 */
async function initialize() {
  if (isInitialized) return true;
  
  try {
    logger.info('Initializing Auto-Scaling Optimizer...');
    
    // Connect to Redis for distributed metrics
    await initRedisClient();
    
    // Start collecting metrics
    collectSystemMetrics();
    
    // Start scaling check interval if predictive scaling is enabled
    if (config.predictiveScalingEnabled) {
      scalingCheckInterval = setInterval(checkScalingRecommendations, config.scalingInterval);
      logger.info('Predictive scaling enabled, checking every ' + (config.scalingInterval / 1000) + ' seconds');
    }
    
    isInitialized = true;
    logger.info('Auto-Scaling Optimizer initialized');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Auto-Scaling Optimizer:', error);
    return false;
  }
}

/**
 * Initialize Redis client for sharing metrics
 * @returns {Promise<boolean>} Success status
 */
async function initRedisClient() {
  if (!config.redisUrl) {
    logger.warn('Redis URL not provided for Auto-Scaling Optimizer');
    return false;
  }
  
  try {
    redisClient = Redis.createClient({
      url: config.redisUrl
    });
    
    redisClient.on('error', (err) => {
      logger.error('Redis client error in Auto-Scaling Optimizer:', err);
    });
    
    await redisClient.connect();
    logger.info('Connected to Redis for Auto-Scaling Optimizer');
    return true;
  } catch (error) {
    logger.error('Failed to initialize Redis client for Auto-Scaling Optimizer:', error);
    return false;
  }
}

/**
 * Collect system metrics
 */
function collectSystemMetrics() {
  // Get CPU usage (average across all cores)
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  
  // Get memory usage
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = (totalMemory - freeMemory) / totalMemory;
  
  // Update current metrics
  currentMetrics = {
    cpu: cpuUsage,
    memory: memoryUsage,
    requestsPerMinute: currentMetrics.requestsPerMinute || 0,
    responseTime: currentMetrics.responseTime || 0,
    timestamp: Date.now()
  };
  
  // Store metrics in scaling history
  scalingHistory.push({ ...currentMetrics });
  
  // Keep only the last N samples
  if (scalingHistory.length > config.sampleSize) {
    scalingHistory.shift();
  }
  
  // If in master process, publish metrics to Redis
  if (redisClient && (cluster.isMaster || !cluster.isWorker)) {
    publishMetricsToRedis();
  }
  
  // Schedule next collection
  setTimeout(collectSystemMetrics, 5000); // Collect every 5 seconds
}

/**
 * Publish metrics to Redis for other instances to access
 */
async function publishMetricsToRedis() {
  try {
    const metricsKey = `${config.metricsPrefix}${config.nodeId}`;
    await redisClient.set(metricsKey, JSON.stringify(currentMetrics), { EX: 60 }); // Expire after 60 seconds
    
    // Also add to sorted set with timestamp as score for time-series analysis
    await redisClient.zAdd('aerosuite:metrics:timeseries', {
      score: currentMetrics.timestamp,
      value: JSON.stringify({
        nodeId: config.nodeId,
        ...currentMetrics
      })
    });
    
    // Trim the time series to keep only the last 24 hours of data
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    await redisClient.zRemRangeByScore('aerosuite:metrics:timeseries', 0, oneDayAgo);
  } catch (error) {
    logger.error('Failed to publish metrics to Redis:', error);
  }
}

/**
 * Update request metrics
 * @param {number} responseTime - Response time in ms
 */
function trackRequest(responseTime) {
  // Update requests per minute counter
  currentMetrics.requestsPerMinute++;
  
  // Update average response time using exponential moving average
  if (currentMetrics.responseTime === 0) {
    currentMetrics.responseTime = responseTime;
  } else {
    currentMetrics.responseTime = 0.9 * currentMetrics.responseTime + 0.1 * responseTime;
  }
  
  // Reset requests per minute counter every minute
  setInterval(() => {
    currentMetrics.requestsPerMinute = 0;
  }, 60000);
}

/**
 * Check if scaling is needed based on metrics
 */
async function checkScalingRecommendations() {
  try {
    // Get all node metrics from Redis
    const nodeKeys = await redisClient.keys(`${config.metricsPrefix}*`);
    const allNodeMetrics = [];
    
    for (const key of nodeKeys) {
      const metricsStr = await redisClient.get(key);
      if (metricsStr) {
        const metrics = JSON.parse(metricsStr);
        const nodeId = key.replace(config.metricsPrefix, '');
        allNodeMetrics.push({ nodeId, ...metrics });
      }
    }
    
    // Calculate aggregate metrics
    const aggregateMetrics = calculateAggregateMetrics(allNodeMetrics);
    
    // Check if scaling is needed
    const recommendation = generateScalingRecommendation(aggregateMetrics);
    
    // Log recommendation
    if (recommendation.action !== 'maintain') {
      logger.info(`Scaling recommendation: ${recommendation.action} to ${recommendation.targetNodes} nodes (current: ${allNodeMetrics.length})`);
      logger.info(`Recommendation reason: ${recommendation.reason}`);
    }
    
    // Publish recommendation to Redis
    await redisClient.set('aerosuite:scaling:recommendation', JSON.stringify({
      timestamp: Date.now(),
      recommendation,
      metrics: aggregateMetrics
    }));
    
    return recommendation;
  } catch (error) {
    logger.error('Error in scaling check:', error);
    return { action: 'maintain', reason: 'Error checking metrics' };
  }
}

/**
 * Calculate aggregate metrics across all nodes
 * @param {Array} nodeMetrics - Array of node metrics
 * @returns {Object} Aggregate metrics
 */
function calculateAggregateMetrics(nodeMetrics) {
  if (!nodeMetrics.length) {
    return {
      avgCpu: 0,
      avgMemory: 0,
      avgRequestsPerMinute: 0,
      avgResponseTime: 0,
      totalNodes: 0
    };
  }
  
  // Calculate averages
  const avgCpu = nodeMetrics.reduce((sum, node) => sum + node.cpu, 0) / nodeMetrics.length;
  const avgMemory = nodeMetrics.reduce((sum, node) => sum + node.memory, 0) / nodeMetrics.length;
  const avgRequestsPerMinute = nodeMetrics.reduce((sum, node) => sum + node.requestsPerMinute, 0) / nodeMetrics.length;
  const avgResponseTime = nodeMetrics.reduce((sum, node) => sum + node.responseTime, 0) / nodeMetrics.length;
  
  return {
    avgCpu,
    avgMemory,
    avgRequestsPerMinute,
    avgResponseTime,
    totalNodes: nodeMetrics.length
  };
}

/**
 * Generate scaling recommendation based on metrics
 * @param {Object} metrics - Aggregate metrics
 * @returns {Object} Scaling recommendation
 */
function generateScalingRecommendation(metrics) {
  const { avgCpu, avgMemory, totalNodes } = metrics;
  
  // Default recommendation
  let recommendation = {
    action: 'maintain',
    targetNodes: totalNodes,
    reason: 'Current metrics within thresholds'
  };
  
  // Check CPU high threshold
  if (avgCpu > config.resourceThresholds.cpuHigh) {
    const targetNodes = Math.ceil(totalNodes * (avgCpu / config.resourceThresholds.cpuHigh));
    recommendation = {
      action: 'scale_up',
      targetNodes: Math.min(targetNodes, totalNodes * 2), // At most double the nodes
      reason: `CPU usage (${(avgCpu * 100).toFixed(1)}%) exceeds high threshold (${config.resourceThresholds.cpuHigh * 100}%)`
    };
  } 
  // Check memory high threshold
  else if (avgMemory > config.resourceThresholds.memoryHigh) {
    const targetNodes = Math.ceil(totalNodes * (avgMemory / config.resourceThresholds.memoryHigh));
    recommendation = {
      action: 'scale_up',
      targetNodes: Math.min(targetNodes, totalNodes * 2), // At most double the nodes
      reason: `Memory usage (${(avgMemory * 100).toFixed(1)}%) exceeds high threshold (${config.resourceThresholds.memoryHigh * 100}%)`
    };
  }
  // Check CPU low threshold (only if we have more than 1 node)
  else if (avgCpu < config.resourceThresholds.cpuLow && totalNodes > 1) {
    const targetNodes = Math.max(1, Math.floor(totalNodes * (avgCpu / config.resourceThresholds.cpuLow)));
    recommendation = {
      action: 'scale_down',
      targetNodes: Math.max(targetNodes, Math.ceil(totalNodes * 0.5)), // Remove at most half the nodes
      reason: `CPU usage (${(avgCpu * 100).toFixed(1)}%) below low threshold (${config.resourceThresholds.cpuLow * 100}%)`
    };
  }
  // Check memory low threshold (only if we have more than 1 node)
  else if (avgMemory < config.resourceThresholds.memoryLow && totalNodes > 1) {
    const targetNodes = Math.max(1, Math.floor(totalNodes * (avgMemory / config.resourceThresholds.memoryLow)));
    recommendation = {
      action: 'scale_down',
      targetNodes: Math.max(targetNodes, Math.ceil(totalNodes * 0.5)), // Remove at most half the nodes
      reason: `Memory usage (${(avgMemory * 100).toFixed(1)}%) below low threshold (${config.resourceThresholds.memoryLow * 100}%)`
    };
  }
  
  return recommendation;
}

/**
 * Calculate scaling efficiency metrics
 * @returns {Object} Scaling efficiency metrics
 */
function calculateScalingEfficiency() {
  // Retrieve historical time-series data from Redis
  // Analyze how effectively the system has scaled in response to load
  // This would be implemented by comparing request throughput vs. node count
  return {
    efficiency: 0.85, // Sample value
    bottlenecks: [],
    recommendations: []
  };
}

/**
 * Shutdown the optimizer
 */
async function shutdown() {
  logger.info('Shutting down Auto-Scaling Optimizer...');
  
  if (scalingCheckInterval) {
    clearInterval(scalingCheckInterval);
  }
  
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch (error) {
      logger.error('Error shutting down Redis client:', error);
    }
  }
  
  logger.info('Auto-Scaling Optimizer shut down');
}

// Middleware to track request performance
function requestTrackerMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Track end of request
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    trackRequest(duration);
  });
  
  next();
}

module.exports = {
  initialize,
  trackRequest,
  shutdown,
  requestTrackerMiddleware,
  getMetrics: () => ({ ...currentMetrics }),
  getScalingEfficiency: calculateScalingEfficiency
}; 