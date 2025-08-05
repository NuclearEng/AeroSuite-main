/**
 * Health Check Controller
 * 
 * Manages health check functionality for the application
 */

const healthCheck = require('../utils/healthCheck');

/**
 * Health Check Manager
 */
class HealthCheckManager {
  constructor() {
    this.checkInterval = null;
    this.status = 'unknown';
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(interval = 60000) {
    this.checkInterval = healthCheck.startPeriodicChecks(interval);
    return this.checkInterval;
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks() {
    return healthCheck.stopPeriodicChecks();
  }

  /**
   * Get overall health status
   */
  getOverallStatus() {
    const status = healthCheck.getStatus();
    return status.status || 'unknown';
  }

  /**
   * Get detailed health status
   */
  getDetailedStatus() {
    return healthCheck.getStatus();
  }
}

// Create singleton instance
const healthCheckManager = new HealthCheckManager();

/**
 * Basic health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const basicHealthCheck = (req, res) => {
  const status = healthCheckManager.getOverallStatus();
  const httpStatus = status === 'healthy' || status === 'degraded' ? 200 : 503;
  
  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
};

/**
 * Detailed health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const detailedHealthCheck = async (req, res) => {
  try {
    // Run all checks to get fresh data
    await healthCheckManager.runAllChecks();
    
    // Get detailed status
    const status = healthCheckManager.getFullStatus(true);
    const httpStatus = status.status === 'healthy' || status.status === 'degraded' ? 200 : 503;
    
    res.status(httpStatus).json(status);
  } catch (error) {
    logger.error('Error in detailed health check', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Component health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const componentHealthCheck = async (req, res) => {
  try {
    const { component } = req.params;
    
    // Get component status
    const status = healthCheckManager.status[component];
    
    if (!status) {
      return res.status(404).json({
        error: `Component '${component}' not found`,
        availableComponents: Object.keys(healthCheckManager.status)
      });
    }
    
    // Run a fresh check for the component
    let freshStatus;
    switch (component) {
      case 'database':
        freshStatus = await healthCheckManager.checkDatabase();
        break;
      case 'cache':
        freshStatus = await healthCheckManager.checkCache();
        break;
      case 'system':
        freshStatus = await healthCheckManager.checkSystem();
        break;
      case 'api':
        freshStatus = await healthCheckManager.checkApi();
        break;
      case 'workers':
        freshStatus = await healthCheckManager.checkWorkers();
        break;
      case 'externalServices':
        freshStatus = await healthCheckManager.checkExternalServices();
        break;
      default:
        freshStatus = status;
    }
    
    const httpStatus = freshStatus.status === 'healthy' || freshStatus.status === 'degraded' ? 200 : 503;
    
    res.status(httpStatus).json({
      component,
      ...freshStatus
    });
  } catch (error) {
    logger.error('Error in component health check', {
      error: error.message,
      stack: error.stack,
      component: req.params.component
    });
    
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Liveness probe for Kubernetes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const livenessProbe = (req, res) => {
  // Liveness probe should only check if the application is running
  // and responding to requests, not detailed health
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * Readiness probe for Kubernetes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const readinessProbe = (req, res) => {
  // Readiness probe should check if the application is ready to serve traffic
  const status = healthCheckManager.getOverallStatus();
  const httpStatus = status === 'healthy' || status === 'degraded' ? 200 : 503;
  
  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString()
  });
};

/**
 * Startup probe for Kubernetes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const startupProbe = (req, res) => {
  // Startup probe should check if the application has completed initialization
  const status = healthCheckManager.getOverallStatus();
  const httpStatus = status === 'unknown' ? 503 : 200;
  
  res.status(httpStatus).json({
    status: status === 'unknown' ? 'initializing' : 'started',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  healthCheckManager,
  basicHealthCheck,
  detailedHealthCheck,
  componentHealthCheck,
  livenessProbe,
  readinessProbe,
  startupProbe
}; 