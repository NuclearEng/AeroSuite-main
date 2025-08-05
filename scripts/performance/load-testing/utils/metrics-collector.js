/**
 * Metrics Collector
 * 
 * This module sets up metrics collection for load tests.
 * It collects performance metrics for analysis and reporting.
 * 
 * Task: TS354 - Load testing implementation
 */

const { PerformanceObserver } = require('perf_hooks');
const os = require('os');

/**
 * Set up metrics collection
 * @param {Object} metrics - Metrics object to update
 */
function setupMetricsCollection(metrics) {
  // Initialize system metrics
  metrics.system = {
    cpu: [],
    memory: [],
    loadAvg: []
  };
  
  // Set up performance observer
  const obs = new PerformanceObserver((items) => {
    const entry = items.getEntries()[0];
    metrics.responseTimes.push(entry.duration);
    
    // Clear marks to prevent memory leaks
    try {
      global.performance.clearMarks();
    } catch (e) {
      // Ignore errors in older Node versions
    }
  });
  
  // Observe measure events
  obs.observe({ entryTypes: ['measure'] });
  
  // Collect system metrics periodically
  const systemMetricsInterval = setInterval(() => {
    collectSystemMetrics(metrics);
  }, 1000);
  
  // Store interval reference for cleanup
  metrics.systemMetricsInterval = systemMetricsInterval;
  
  return {
    stopCollection: () => {
      if (metrics.systemMetricsInterval) {
        clearInterval(metrics.systemMetricsInterval);
        metrics.systemMetricsInterval = null;
      }
      
      try {
        obs.disconnect();
      } catch (e) {
        // Ignore errors in older Node versions
      }
    }
  };
}

/**
 * Collect system metrics
 * @param {Object} metrics - Metrics object to update
 */
function collectSystemMetrics(metrics) {
  const now = Date.now();
  
  // Collect CPU load
  const loadAvg = os.loadavg();
  metrics.system.loadAvg.push({
    timestamp: now,
    value: loadAvg[0] // 1 minute load average
  });
  
  // Collect memory usage
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMemPercent = ((totalMem - freeMem) / totalMem) * 100;
  
  metrics.system.memory.push({
    timestamp: now,
    totalMB: Math.round(totalMem / 1024 / 1024),
    freeMB: Math.round(freeMem / 1024 / 1024),
    usedPercent: Math.round(usedMemPercent * 100) / 100
  });
  
  // Collect process memory usage
  const processMemory = process.memoryUsage();
  metrics.system.cpu.push({
    timestamp: now,
    cpus: os.cpus().length,
    uptime: process.uptime(),
    processMemoryMB: Math.round(processMemory.rss / 1024 / 1024)
  });
  
  // Limit the number of data points to prevent memory issues
  const maxDataPoints = 300; // 5 minutes of data at 1 second intervals
  
  if (metrics.system.loadAvg.length > maxDataPoints) {
    metrics.system.loadAvg = metrics.system.loadAvg.slice(-maxDataPoints);
  }
  
  if (metrics.system.memory.length > maxDataPoints) {
    metrics.system.memory = metrics.system.memory.slice(-maxDataPoints);
  }
  
  if (metrics.system.cpu.length > maxDataPoints) {
    metrics.system.cpu = metrics.system.cpu.slice(-maxDataPoints);
  }
}

/**
 * Calculate statistics from response times
 * @param {Array<number>} responseTimes - Array of response times
 * @returns {Object} Statistics
 */
function calculateStats(responseTimes) {
  if (!responseTimes || responseTimes.length === 0) {
    return {
      min: 0,
      max: 0,
      avg: 0,
      median: 0,
      p95: 0,
      p99: 0
    };
  }
  
  // Sort response times for percentile calculations
  const sortedTimes = [...responseTimes].sort((a, b) => a - b);
  
  // Calculate metrics
  const min = sortedTimes[0] || 0;
  const max = sortedTimes[sortedTimes.length - 1] || 0;
  const avg = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
  const median = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  return {
    min: Math.round(min * 100) / 100,
    max: Math.round(max * 100) / 100,
    avg: Math.round(avg * 100) / 100,
    median: Math.round(median * 100) / 100,
    p95: Math.round(p95 * 100) / 100,
    p99: Math.round(p99 * 100) / 100
  };
}

/**
 * Process metrics for reporting
 * @param {Object} metrics - Raw metrics object
 * @param {Object} config - Test configuration
 * @returns {Object} Processed metrics
 */
function processMetrics(metrics, config) {
  // Calculate test duration
  const durationSec = (metrics.endTime - metrics.startTime) / 1000;
  
  // Calculate overall statistics
  const stats = calculateStats(metrics.responseTimes);
  
  // Calculate statistics for each scenario
  const scenarioStats = {};
  Object.keys(metrics.scenarios || {}).forEach(scenarioName => {
    const scenario = metrics.scenarios[scenarioName];
    scenarioStats[scenarioName] = {
      requests: scenario.requests || 0,
      success: scenario.success || 0,
      failed: scenario.failed || 0,
      successRate: scenario.requests > 0 
        ? Math.round((scenario.success / scenario.requests) * 10000) / 100 
        : 0,
      stats: calculateStats(scenario.responseTimes || [])
    };
  });
  
  // Calculate system metrics averages
  const systemMetrics = {
    cpu: calculateSystemMetricsAverage(metrics.system.cpu),
    memory: calculateSystemMetricsAverage(metrics.system.memory),
    loadAvg: calculateSystemMetricsAverage(metrics.system.loadAvg)
  };
  
  // Build processed metrics object
  return {
    summary: {
      target: config.targetUrl,
      scenario: config.scenario || 'default',
      concurrentUsers: config.concurrentUsers,
      duration: Math.round(durationSec * 100) / 100,
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      successRate: metrics.totalRequests > 0 
        ? Math.round((metrics.successfulRequests / metrics.totalRequests) * 10000) / 100 
        : 0,
      requestsPerSecond: Math.round((metrics.totalRequests / durationSec) * 100) / 100
    },
    responseTime: stats,
    scenarios: scenarioStats,
    system: systemMetrics,
    errors: metrics.errorDetails || []
  };
}

/**
 * Calculate average from system metrics
 * @param {Array<Object>} metricsArray - Array of system metrics
 * @returns {Object} Average metrics
 */
function calculateSystemMetricsAverage(metricsArray) {
  if (!metricsArray || metricsArray.length === 0) {
    return {};
  }
  
  // Extract numeric values for averaging
  const numericValues = {};
  
  // Find all numeric properties in the first item
  const firstItem = metricsArray[0];
  Object.keys(firstItem).forEach(key => {
    if (typeof firstItem[key] === 'number') {
      numericValues[key] = [];
    }
  });
  
  // Collect all values
  metricsArray.forEach(item => {
    Object.keys(numericValues).forEach(key => {
      if (typeof item[key] === 'number') {
        numericValues[key].push(item[key]);
      }
    });
  });
  
  // Calculate averages
  const averages = {};
  Object.keys(numericValues).forEach(key => {
    const values = numericValues[key];
    if (values.length > 0) {
      const sum = values.reduce((acc, val) => acc + val, 0);
      averages[key] = Math.round((sum / values.length) * 100) / 100;
    }
  });
  
  // Add min/max where appropriate
  Object.keys(numericValues).forEach(key => {
    const values = numericValues[key];
    if (values.length > 0) {
      values.sort((a, b) => a - b);
      averages[`${key}Min`] = values[0];
      averages[`${key}Max`] = values[values.length - 1];
    }
  });
  
  return averages;
}

module.exports = {
  setupMetricsCollection,
  calculateStats,
  processMetrics
}; 