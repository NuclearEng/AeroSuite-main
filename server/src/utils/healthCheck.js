/**
 * Health Check Utility
 * 
 * Provides functions for monitoring system health
 */

const os = require('os');
const mongoose = require('mongoose');
const { logger } = require('./logger');

// Store health status
let healthStatus = {
  status: 'unknown',
  lastCheck: null,
  components: {
    database: {
      status: 'unknown',
      lastCheck: null
    },
    memory: {
      status: 'unknown',
      lastCheck: null
    },
    cpu: {
      status: 'unknown',
      lastCheck: null
    }
  }
};

// Periodic check interval
let checkInterval = null;

/**
 * Check database connection health
 */
async function checkDatabaseHealth() {
  try {
    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'error',
        message: 'Database not connected'
      };
    }

    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return {
      status: 'healthy',
      message: 'Database connection is healthy'
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return {
      status: 'error',
      message: 'Database health check failed',
      error: error.message
    };
  }
}

/**
 * Check memory usage health
 */
function checkMemoryHealth() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = usedMem / totalMem;
    
    // Memory usage thresholds
    const warning = 0.8; // 80%
    const critical = 0.9; // 90%
    
    let status = 'healthy';
    let message = 'Memory usage is normal';
    
    if (memUsage > critical) {
      status = 'error';
      message = `Critical memory usage: ${(memUsage * 100).toFixed(2)}%`;
    } else if (memUsage > warning) {
      status = 'warning';
      message = `High memory usage: ${(memUsage * 100).toFixed(2)}%`;
    }
    
    return {
      status,
      message,
      metrics: {
        totalMemory: totalMem,
        freeMemory: freeMem,
        usedMemory: usedMem,
        usagePercentage: memUsage * 100
      }
    };
  } catch (error) {
    logger.error('Memory health check failed:', error);
    return {
      status: 'error',
      message: 'Memory health check failed',
      error: error.message
    };
  }
}

/**
 * Check CPU load health
 */
function checkCpuHealth() {
  try {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const cpuCount = cpus.length;
    
    // Normalize load average by CPU count
    const normalizedLoad = loadAvg[0] / cpuCount;
    
    // CPU load thresholds
    const warning = 0.7; // 70%
    const critical = 0.9; // 90%
    
    let status = 'healthy';
    let message = 'CPU load is normal';
    
    if (normalizedLoad > critical) {
      status = 'error';
      message = `Critical CPU load: ${(normalizedLoad * 100).toFixed(2)}%`;
    } else if (normalizedLoad > warning) {
      status = 'warning';
      message = `High CPU load: ${(normalizedLoad * 100).toFixed(2)}%`;
    }
    
    return {
      status,
      message,
      metrics: {
        cpuCount,
        loadAverage: loadAvg,
        normalizedLoad: normalizedLoad * 100
      }
    };
  } catch (error) {
    logger.error('CPU health check failed:', error);
    return {
      status: 'error',
      message: 'CPU health check failed',
      error: error.message
    };
  }
}

/**
 * Run all health checks
 */
async function runAllChecks() {
  try {
    // Run all checks in parallel
    const [dbHealth, memHealth, cpuHealth] = await Promise.all([
      checkDatabaseHealth(),
      checkMemoryHealth(),
      checkCpuHealth()
    ]);
    
    // Update health status
    healthStatus.lastCheck = new Date();
    healthStatus.components.database = {
      ...dbHealth,
      lastCheck: new Date()
    };
    healthStatus.components.memory = {
      ...memHealth,
      lastCheck: new Date()
    };
    healthStatus.components.cpu = {
      ...cpuHealth,
      lastCheck: new Date()
    };
    
    // Determine overall status
    if (dbHealth.status === 'error' || memHealth.status === 'error' || cpuHealth.status === 'error') {
      healthStatus.status = 'error';
    } else if (dbHealth.status === 'warning' || memHealth.status === 'warning' || cpuHealth.status === 'warning') {
      healthStatus.status = 'warning';
    } else {
      healthStatus.status = 'healthy';
    }
    
    return healthStatus;
  } catch (error) {
    logger.error('Health checks failed:', error);
    healthStatus.status = 'error';
    healthStatus.lastCheck = new Date();
    return healthStatus;
  }
}

/**
 * Start periodic health checks
 */
function startPeriodicChecks(interval = 60000) {
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  checkInterval = setInterval(async () => {
    try {
      await runAllChecks();
      logger.debug('Health check completed:', healthStatus.status);
    } catch (error) {
      logger.error('Periodic health check failed:', error);
    }
  }, interval);
  
  return checkInterval;
}

/**
 * Stop periodic health checks
 */
function stopPeriodicChecks() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    return true;
  }
  return false;
}

/**
 * Get current health status
 */
function getStatus() {
  return healthStatus;
}

/**
 * Validate startup requirements
 */
async function validateStartupRequirements() {
  try {
    // Run initial health check
    await runAllChecks();
    
    // Check if any critical components are unhealthy
    return healthStatus.status !== 'error';
  } catch (error) {
    logger.error('Startup validation failed:', error);
    return false;
  }
}

// Export health check functions
module.exports = {
  checkDatabaseHealth,
  checkMemoryHealth,
  checkCpuHealth,
  runAllChecks,
  startPeriodicChecks,
  stopPeriodicChecks,
  getStatus,
  validateStartupRequirements
}; 