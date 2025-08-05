/**
 * Health Check Manager
 * 
 * Implements RF042 - Implement health checks for all services
 * 
 * This module provides a comprehensive health check system for all services
 * in the AeroSuite application. It supports:
 * - Configurable health checks for all services
 * - Detailed health status reporting
 * - Automatic periodic health checks
 * - Integration with monitoring systems
 * - Custom health check implementations
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mongoose = require('mongoose');
const redis = require('redis');
const axios = require('axios');
const diskUsage = require('diskusage');
const logger = require('../utils/logger');

// Constants
const HEALTH_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  UNKNOWN: 'unknown'
};

// Default thresholds
const DEFAULT_THRESHOLDS = {
  cpu: {
    degraded: 70, // 70% usage
    unhealthy: 90 // 90% usage
  },
  memory: {
    degraded: 80, // 80% usage
    unhealthy: 95 // 95% usage
  },
  disk: {
    degraded: 80, // 80% usage
    unhealthy: 95 // 95% usage
  },
  responseTime: {
    degraded: 1000, // 1 second
    unhealthy: 3000 // 3 seconds
  }
};

/**
 * Health Check Manager
 */
class HealthCheckManager {
  /**
   * Create a new HealthCheckManager
   * @param {Object} options - Configuration options
   * @param {Object} options.thresholds - Custom thresholds for health checks
   * @param {number} options.checkInterval - Interval for automatic checks in ms
   * @param {boolean} options.startupValidation - Whether to validate on startup
   */
  constructor(options = {}) {
    this.options = {
      thresholds: { ...DEFAULT_THRESHOLDS, ...options.thresholds },
      checkInterval: options.checkInterval || 60000,
      startupValidation: options.startupValidation !== false
    };

    // Initialize health status
    this.status = {
      database: {
        status: HEALTH_STATUS.UNKNOWN,
        lastCheck: null,
        details: null
      },
      cache: {
        status: HEALTH_STATUS.UNKNOWN,
        lastCheck: null,
        details: null
      },
      system: {
        status: HEALTH_STATUS.UNKNOWN,
        lastCheck: null,
        details: null
      },
      api: {
        status: HEALTH_STATUS.UNKNOWN,
        lastCheck: null,
        details: null
      },
      workers: {
        status: HEALTH_STATUS.UNKNOWN,
        lastCheck: null,
        details: null
      },
      externalServices: {
        status: HEALTH_STATUS.UNKNOWN,
        lastCheck: null,
        details: {}
      }
    };

    // Custom health checks
    this.customChecks = new Map();
    
    // Interval ID for periodic checks
    this.checkIntervalId = null;
    
    // Metrics for monitoring
    this.metrics = {
      lastCheckDuration: 0,
      checkCount: 0,
      errorCount: 0,
      lastError: null
    };
  }

  /**
   * Start periodic health checks
   * @returns {void}
   */
  startPeriodicChecks() {
    if (this.checkIntervalId) {
      this.stopPeriodicChecks();
    }

    this.checkIntervalId = setInterval(async () => {
      const startTime = Date.now();
      
      try {
        await this.runAllChecks();
        this.metrics.checkCount++;
        this.metrics.lastCheckDuration = Date.now() - startTime;
        
        // Log health check results
        logger.debug('Health check completed', {
          status: this.getOverallStatus(),
          duration: this.metrics.lastCheckDuration
        });
      } catch (error) {
        this.metrics.errorCount++;
        this.metrics.lastError = error.message;
        
        logger.error('Health check failed', {
          error: error.message,
          stack: error.stack
        });
      }
    }, this.options.checkInterval);

    logger.info('Started periodic health checks', {
      interval: this.options.checkInterval
    });
  }

  /**
   * Stop periodic health checks
   * @returns {void}
   */
  stopPeriodicChecks() {
    if (this.checkIntervalId) {
      clearInterval(this.checkIntervalId);
      this.checkIntervalId = null;
      logger.info('Stopped periodic health checks');
    }
  }

  /**
   * Run all health checks
   * @returns {Promise<Object>} Health check results
   */
  async runAllChecks() {
    try {
      // Run core checks in parallel
      const [
        databaseStatus,
        cacheStatus,
        systemStatus,
        apiStatus,
        workersStatus,
        externalServicesStatus
      ] = await Promise.all([
        this.checkDatabase(),
        this.checkCache(),
        this.checkSystem(),
        this.checkApi(),
        this.checkWorkers(),
        this.checkExternalServices()
      ]);

      // Update status
      this.status.database = databaseStatus;
      this.status.cache = cacheStatus;
      this.status.system = systemStatus;
      this.status.api = apiStatus;
      this.status.workers = workersStatus;
      this.status.externalServices = externalServicesStatus;

      // Run custom checks
      if (this.customChecks.size > 0) {
        const customResults = {};
        
        for (const [name, checkFn] of this.customChecks.entries()) {
          try {
            customResults[name] = await checkFn();
          } catch (error) {
            customResults[name] = {
              status: HEALTH_STATUS.UNHEALTHY,
              lastCheck: new Date(),
              details: {
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
              }
            };
          }
        }
        
        this.status.custom = customResults;
      }

      return this.getFullStatus();
    } catch (error) {
      logger.error('Error running health checks', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Check database health
   * @returns {Promise<Object>} Database health status
   */
  async checkDatabase() {
    const result = {
      status: HEALTH_STATUS.UNKNOWN,
      lastCheck: new Date(),
      details: null
    };

    try {
      // Check if mongoose is connected
      if (!mongoose.connection || mongoose.connection.readyState !== 1) {
        result.status = HEALTH_STATUS.UNHEALTHY;
        result.details = {
          error: 'Database not connected',
          readyState: mongoose.connection ? mongoose.connection.readyState : 'undefined'
        };
        return result;
      }

      // Perform a simple query to verify database responsiveness
      const startTime = Date.now();
      await mongoose.connection.db.admin().ping();
      const responseTime = Date.now() - startTime;

      // Check response time against thresholds
      if (responseTime > this.options.thresholds.responseTime.unhealthy) {
        result.status = HEALTH_STATUS.UNHEALTHY;
        result.details = {
          warning: 'Database response time too high',
          responseTime: `${responseTime}ms`
        };
      } else if (responseTime > this.options.thresholds.responseTime.degraded) {
        result.status = HEALTH_STATUS.DEGRADED;
        result.details = {
          warning: 'Database response time elevated',
          responseTime: `${responseTime}ms`
        };
      } else {
        result.status = HEALTH_STATUS.HEALTHY;
        result.details = {
          responseTime: `${responseTime}ms`,
          host: mongoose.connection.host,
          name: mongoose.connection.name
        };
      }
    } catch (error) {
      result.status = HEALTH_STATUS.UNHEALTHY;
      result.details = {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    return result;
  }

  /**
   * Check Redis cache health
   * @returns {Promise<Object>} Cache health status
   */
  async checkCache() {
    const result = {
      status: HEALTH_STATUS.UNKNOWN,
      lastCheck: new Date(),
      details: null
    };

    try {
      // Check if Redis client exists
      const redisClient = global.redisClient;
      
      if (!redisClient) {
        result.status = HEALTH_STATUS.UNKNOWN;
        result.details = {
          message: 'Redis client not initialized'
        };
        return result;
      }

      // Check if Redis is connected
      if (!redisClient.connected) {
        result.status = HEALTH_STATUS.UNHEALTHY;
        result.details = {
          error: 'Redis not connected'
        };
        return result;
      }

      // Perform a simple PING command to verify Redis responsiveness
      const startTime = Date.now();
      const pingResult = await promisify(redisClient.ping).bind(redisClient)();
      const responseTime = Date.now() - startTime;

      if (pingResult !== 'PONG') {
        result.status = HEALTH_STATUS.UNHEALTHY;
        result.details = {
          error: 'Redis ping failed',
          response: pingResult
        };
        return result;
      }

      // Check response time against thresholds
      if (responseTime > this.options.thresholds.responseTime.unhealthy) {
        result.status = HEALTH_STATUS.UNHEALTHY;
        result.details = {
          warning: 'Redis response time too high',
          responseTime: `${responseTime}ms`
        };
      } else if (responseTime > this.options.thresholds.responseTime.degraded) {
        result.status = HEALTH_STATUS.DEGRADED;
        result.details = {
          warning: 'Redis response time elevated',
          responseTime: `${responseTime}ms`
        };
      } else {
        result.status = HEALTH_STATUS.HEALTHY;
        result.details = {
          responseTime: `${responseTime}ms`,
          serverInfo: redisClient.server_info
        };
      }
    } catch (error) {
      result.status = HEALTH_STATUS.UNHEALTHY;
      result.details = {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    return result;
  }

  /**
   * Check system health (CPU, memory, disk)
   * @returns {Promise<Object>} System health status
   */
  async checkSystem() {
    const result = {
      status: HEALTH_STATUS.UNKNOWN,
      lastCheck: new Date(),
      details: null
    };

    try {
      // Get CPU info
      const cpuCount = os.cpus().length;
      const loadAvg = os.loadavg();
      const loadAvg1Min = (loadAvg[0] / cpuCount) * 100; // Convert to percentage

      // Get memory info
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memoryUsagePercent = (usedMem / totalMem) * 100;

      // Get disk info
      const diskInfo = {};
      try {
        const rootPath = path.parse(process.cwd()).root;
        const disk = await diskUsage.check(rootPath);
        
        const totalDisk = disk.total;
        const freeDisk = disk.free;
        const usedDisk = totalDisk - freeDisk;
        const diskUsagePercent = (usedDisk / totalDisk) * 100;
        
        diskInfo.total = Math.round(totalDisk / (1024 * 1024 * 1024)) + ' GB';
        diskInfo.free = Math.round(freeDisk / (1024 * 1024 * 1024)) + ' GB';
        diskInfo.used = Math.round(usedDisk / (1024 * 1024 * 1024)) + ' GB';
        diskInfo.percent = diskUsagePercent.toFixed(2) + '%';
      } catch (diskError) {
        diskInfo.error = diskError.message;
      }

      // Check for issues
      const issues = [];

      // CPU check
      if (loadAvg1Min > this.options.thresholds.cpu.unhealthy) {
        issues.push(`High CPU usage: ${loadAvg1Min.toFixed(2)}%`);
      } else if (loadAvg1Min > this.options.thresholds.cpu.degraded) {
        issues.push(`Elevated CPU usage: ${loadAvg1Min.toFixed(2)}%`);
      }

      // Memory check
      if (memoryUsagePercent > this.options.thresholds.memory.unhealthy) {
        issues.push(`High memory usage: ${memoryUsagePercent.toFixed(2)}%`);
      } else if (memoryUsagePercent > this.options.thresholds.memory.degraded) {
        issues.push(`Elevated memory usage: ${memoryUsagePercent.toFixed(2)}%`);
      }

      // Disk check
      if (diskInfo.percent && parseFloat(diskInfo.percent) > this.options.thresholds.disk.unhealthy) {
        issues.push(`High disk usage: ${diskInfo.percent}`);
      } else if (diskInfo.percent && parseFloat(diskInfo.percent) > this.options.thresholds.disk.degraded) {
        issues.push(`Elevated disk usage: ${diskInfo.percent}`);
      }

      // Set status based on issues
      if (issues.length > 0) {
        const criticalIssues = issues.filter(issue => 
          issue.includes('High CPU') || 
          issue.includes('High memory') || 
          issue.includes('High disk')
        );
        
        result.status = criticalIssues.length > 0 ? 
          HEALTH_STATUS.UNHEALTHY : 
          HEALTH_STATUS.DEGRADED;
          
        result.details = {
          issues,
          memory: {
            total: Math.round(totalMem / (1024 * 1024)) + ' MB',
            free: Math.round(freeMem / (1024 * 1024)) + ' MB',
            used: Math.round(usedMem / (1024 * 1024)) + ' MB',
            percent: memoryUsagePercent.toFixed(2) + '%'
          },
          cpu: {
            count: cpuCount,
            loadAvg1Min: loadAvg1Min.toFixed(2) + '%',
            loadAvg5Min: (loadAvg[1] / cpuCount * 100).toFixed(2) + '%',
            loadAvg15Min: (loadAvg[2] / cpuCount * 100).toFixed(2) + '%'
          },
          disk: diskInfo
        };
      } else {
        result.status = HEALTH_STATUS.HEALTHY;
        result.details = {
          memory: {
            total: Math.round(totalMem / (1024 * 1024)) + ' MB',
            free: Math.round(freeMem / (1024 * 1024)) + ' MB',
            used: Math.round(usedMem / (1024 * 1024)) + ' MB',
            percent: memoryUsagePercent.toFixed(2) + '%'
          },
          cpu: {
            count: cpuCount,
            loadAvg1Min: loadAvg1Min.toFixed(2) + '%',
            loadAvg5Min: (loadAvg[1] / cpuCount * 100).toFixed(2) + '%',
            loadAvg15Min: (loadAvg[2] / cpuCount * 100).toFixed(2) + '%'
          },
          disk: diskInfo
        };
      }
    } catch (error) {
      result.status = HEALTH_STATUS.UNHEALTHY;
      result.details = {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    return result;
  }

  /**
   * Check API health
   * @returns {Promise<Object>} API health status
   */
  async checkApi() {
    const result = {
      status: HEALTH_STATUS.UNKNOWN,
      lastCheck: new Date(),
      details: {
        endpoints: {}
      }
    };

    try {
      // Define critical API endpoints to check
      const endpoints = [
        { path: '/api/v1/health', name: 'healthCheck' },
        { path: '/api/v1/suppliers', name: 'suppliers' },
        { path: '/api/v1/customers', name: 'customers' },
        { path: '/api/v1/inspections', name: 'inspections' }
      ];

      // Check each endpoint
      const checkPromises = endpoints.map(async (endpoint) => {
        try {
          const startTime = Date.now();
          const response = await axios.get(`http://localhost:${process.env.PORT || 5000}${endpoint.path}`, {
            timeout: 5000,
            headers: {
              'X-Health-Check': 'true'
            }
          });
          const responseTime = Date.now() - startTime;

          return {
            name: endpoint.name,
            status: response.status >= 200 && response.status < 300 ? 
              HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY,
            statusCode: response.status,
            responseTime: `${responseTime}ms`,
            responseTimeMs: responseTime
          };
        } catch (error) {
          return {
            name: endpoint.name,
            status: HEALTH_STATUS.UNHEALTHY,
            error: error.message,
            statusCode: error.response?.status || 0
          };
        }
      });

      const endpointResults = await Promise.all(checkPromises);

      // Update endpoint details
      endpointResults.forEach(endpointResult => {
        result.details.endpoints[endpointResult.name] = endpointResult;
      });

      // Calculate overall API status
      const unhealthyEndpoints = endpointResults.filter(e => e.status === HEALTH_STATUS.UNHEALTHY);
      const slowEndpoints = endpointResults.filter(e => 
        e.status === HEALTH_STATUS.HEALTHY && 
        e.responseTimeMs > this.options.thresholds.responseTime.degraded
      );

      if (unhealthyEndpoints.length > 0) {
        result.status = HEALTH_STATUS.UNHEALTHY;
        result.details.error = `${unhealthyEndpoints.length}/${endpointResults.length} endpoints are unhealthy`;
      } else if (slowEndpoints.length > 0) {
        result.status = HEALTH_STATUS.DEGRADED;
        result.details.warning = `${slowEndpoints.length}/${endpointResults.length} endpoints are responding slowly`;
      } else {
        result.status = HEALTH_STATUS.HEALTHY;
      }
    } catch (error) {
      result.status = HEALTH_STATUS.UNHEALTHY;
      result.details = {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    return result;
  }

  /**
   * Check worker threads
   * @returns {Promise<Object>} Workers health status
   */
  async checkWorkers() {
    const result = {
      status: HEALTH_STATUS.UNKNOWN,
      lastCheck: new Date(),
      details: null
    };

    try {
      // Access the worker manager
      const workerManager = global.workerManager;

      if (!workerManager) {
        result.status = HEALTH_STATUS.UNKNOWN;
        result.details = {
          message: 'Worker manager not initialized'
        };
        return result;
      }

      const workerStatus = workerManager.getStatus();

      // Check if we have worker pools
      const workerTypes = Object.keys(workerStatus);
      if (workerTypes.length === 0) {
        result.status = HEALTH_STATUS.DEGRADED;
        result.details = {
          warning: 'No worker pools found'
        };
        return result;
      }

      // Check each worker pool
      const workerIssues = [];
      let totalWorkers = 0;
      let healthyWorkers = 0;

      workerTypes.forEach(type => {
        const pool = workerStatus[type];
        totalWorkers += pool.count;
        healthyWorkers += pool.active;

        if (pool.active < pool.count) {
          workerIssues.push(`${type}: ${pool.active}/${pool.count} workers active`);
        }
      });

      if (healthyWorkers === 0) {
        result.status = HEALTH_STATUS.UNHEALTHY;
        result.details = {
          error: 'All workers are down',
          issues: workerIssues
        };
      } else if (healthyWorkers < totalWorkers) {
        result.status = HEALTH_STATUS.DEGRADED;
        result.details = {
          warning: `${totalWorkers - healthyWorkers}/${totalWorkers} workers are down`,
          issues: workerIssues
        };
      } else {
        result.status = HEALTH_STATUS.HEALTHY;
        result.details = {
          workers: workerStatus
        };
      }
    } catch (error) {
      result.status = HEALTH_STATUS.UNHEALTHY;
      result.details = {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    return result;
  }

  /**
   * Check external services
   * @returns {Promise<Object>} External services health status
   */
  async checkExternalServices() {
    const result = {
      status: HEALTH_STATUS.HEALTHY, // Default to healthy
      lastCheck: new Date(),
      details: {}
    };

    // Define external services to check
    const services = [
      // Add external services here as needed
      // Example:
      // {
      //   name: 'payment-gateway',
      //   url: process.env.PAYMENT_GATEWAY_URL + '/health',
      //   headers: { 'Authorization': `Bearer ${process.env.PAYMENT_GATEWAY_API_KEY}` }
      // }
    ];

    // Skip if no services defined
    if (services.length === 0) {
      result.details.message = 'No external services configured for health checks';
      return result;
    }

    try {
      const checkPromises = services.map(async (service) => {
        try {
          const startTime = Date.now();
          const response = await axios.get(service.url, {
            timeout: 5000,
            headers: service.headers || {}
          });
          const responseTime = Date.now() - startTime;

          return {
            name: service.name,
            status: response.status >= 200 && response.status < 300 ? 
              HEALTH_STATUS.HEALTHY : HEALTH_STATUS.UNHEALTHY,
            statusCode: response.status,
            responseTime: `${responseTime}ms`
          };
        } catch (error) {
          return {
            name: service.name,
            status: HEALTH_STATUS.UNHEALTHY,
            error: error.message,
            statusCode: error.response?.status || 0
          };
        }
      });

      const serviceResults = await Promise.all(checkPromises);

      // Update overall status
      let unhealthyServices = 0;

      serviceResults.forEach(service => {
        result.details[service.name] = service;

        if (service.status === HEALTH_STATUS.UNHEALTHY) {
          unhealthyServices++;
        }
      });

      if (unhealthyServices === serviceResults.length && serviceResults.length > 0) {
        result.status = HEALTH_STATUS.UNHEALTHY;
        result.details.error = 'All external services are unhealthy';
      } else if (unhealthyServices > 0) {
        result.status = HEALTH_STATUS.DEGRADED;
        result.details.warning = `${unhealthyServices}/${serviceResults.length} external services are unhealthy`;
      }
    } catch (error) {
      result.status = HEALTH_STATUS.UNHEALTHY;
      result.details = {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }

    return result;
  }

  /**
   * Register a custom health check
   * @param {string} name - Name of the health check
   * @param {Function} checkFn - Health check function that returns a Promise
   * @returns {void}
   */
  registerHealthCheck(name, checkFn) {
    if (typeof checkFn !== 'function') {
      throw new Error('Health check must be a function');
    }
    
    this.customChecks.set(name, checkFn);
    logger.debug(`Registered custom health check: ${name}`);
  }

  /**
   * Unregister a custom health check
   * @param {string} name - Name of the health check to remove
   * @returns {boolean} True if the health check was removed
   */
  unregisterHealthCheck(name) {
    const result = this.customChecks.delete(name);
    if (result) {
      logger.debug(`Unregistered custom health check: ${name}`);
    }
    return result;
  }

  /**
   * Get overall health status
   * @returns {string} Overall health status
   */
  getOverallStatus() {
    const statuses = Object.values(this.status).map(s => s.status);
    
    if (statuses.includes(HEALTH_STATUS.UNHEALTHY)) {
      return HEALTH_STATUS.UNHEALTHY;
    }
    
    if (statuses.includes(HEALTH_STATUS.DEGRADED)) {
      return HEALTH_STATUS.DEGRADED;
    }
    
    if (statuses.includes(HEALTH_STATUS.UNKNOWN)) {
      return HEALTH_STATUS.UNKNOWN;
    }
    
    return HEALTH_STATUS.HEALTHY;
  }

  /**
   * Get full health status
   * @param {boolean} detailed - Whether to include detailed information
   * @returns {Object} Health status object
   */
  getFullStatus(detailed = false) {
    const overallStatus = this.getOverallStatus();
    
    const result = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime()
    };

    if (detailed) {
      result.components = this.status;
      result.metrics = this.metrics;
    } else {
      // Simplified component status
      const components = {};
      Object.entries(this.status).forEach(([key, value]) => {
        components[key] = { status: value.status };
      });
      result.components = components;
    }

    return result;
  }

  /**
   * Perform startup validation checks
   * @returns {Promise<boolean>} True if all critical systems are operational
   */
  async validateStartupRequirements() {
    logger.info('Validating startup requirements...');
    
    const criticalErrors = [];
    
    // Check database connection
    try {
      const dbStatus = await this.checkDatabase();
      if (dbStatus.status === HEALTH_STATUS.UNHEALTHY) {
        criticalErrors.push(`Database connection failed: ${JSON.stringify(dbStatus.details)}`);
      }
    } catch (error) {
      criticalErrors.push(`Database check error: ${error.message}`);
    }
    
    // Check system resources
    try {
      const systemStatus = await this.checkSystem();
      if (systemStatus.status === HEALTH_STATUS.UNHEALTHY) {
        criticalErrors.push(`System resource check failed: ${JSON.stringify(systemStatus.details.issues || systemStatus.details.error)}`);
      }
    } catch (error) {
      criticalErrors.push(`System check error: ${error.message}`);
    }
    
    // Log results
    if (criticalErrors.length > 0) {
      logger.error('Startup validation failed with critical errors:', {
        errors: criticalErrors
      });
      return false;
    }
    
    logger.info('Startup validation completed successfully');
    return true;
  }
}

module.exports = HealthCheckManager; 