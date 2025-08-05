/**
 * metrics.config.js
 * 
 * Configuration for metrics collection
 * Implements RF047 - Set up metrics collection
 */

// Environment-specific configurations
const environments = {
  development: {
    enabled: true,
    collectDefaultMetrics: true,
    defaultLabels: { environment: 'development' },
    collectInterval: 10000, // 10 seconds
    prefix: 'aerosuite_',
    defaultMetricsTimeout: 10000,
    detailedMetrics: true
  },
  test: {
    enabled: false, // Disabled in test environment
    collectDefaultMetrics: false,
    defaultLabels: { environment: 'test' },
    collectInterval: 0,
    prefix: 'aerosuite_',
    defaultMetricsTimeout: 5000,
    detailedMetrics: false
  },
  production: {
    enabled: true,
    collectDefaultMetrics: true,
    defaultLabels: { environment: 'production' },
    collectInterval: 30000, // 30 seconds to reduce overhead
    prefix: 'aerosuite_',
    defaultMetricsTimeout: 10000,
    detailedMetrics: true
  }
};

// Get current environment
const env = process.env.NODE_ENV || 'development';

// Base configuration
const baseConfig = {
  // Enable/disable metrics collection globally
  enabled: process.env.METRICS_ENABLED !== 'false',
  
  // Collect default Node.js metrics
  collectDefaultMetrics: process.env.METRICS_COLLECT_DEFAULT !== 'false',
  
  // Default labels to add to all metrics
  defaultLabels: {
    application: 'aerosuite',
    version: process.env.npm_package_version || '1.0.0'
  },
  
  // Collection interval in milliseconds
  collectInterval: parseInt(process.env.METRICS_COLLECT_INTERVAL || '15000', 10),
  
  // Metrics prefix
  prefix: process.env.METRICS_PREFIX || 'aerosuite_',
  
  // Default metrics collection timeout
  defaultMetricsTimeout: parseInt(process.env.METRICS_DEFAULT_TIMEOUT || '10000', 10),
  
  // Collect detailed metrics (more granular but higher overhead)
  detailedMetrics: process.env.METRICS_DETAILED === 'true',
  
  // Metrics categories
  categories: {
    system: {
      enabled: true,
      collectInterval: parseInt(process.env.METRICS_SYSTEM_INTERVAL || '30000', 10)
    },
    http: {
      enabled: true,
      includePaths: [],
      excludePaths: ['/health', '/metrics', '/favicon.ico'],
      recordRequestSizeHistogram: true,
      recordResponseSizeHistogram: true,
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 30]
    },
    database: {
      enabled: true,
      recordQuerySize: true,
      recordResultSize: true,
      slowQueryThreshold: 1000, // ms
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
    },
    cache: {
      enabled: true,
      recordKeySize: true,
      recordValueSize: false, // Can be expensive for large values
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
    },
    business: {
      enabled: true,
      customMetrics: {
        suppliers: true,
        customers: true,
        inspections: true,
        components: true
      }
    },
    circuitBreaker: {
      enabled: true,
      collectInterval: 5000 // 5 seconds
    },
    rateLimit: {
      enabled: true
    }
  },
  
  // Exporters configuration
  exporters: {
    prometheus: {
      enabled: true,
      path: '/api/monitoring/metrics',
      gcMetrics: true
    },
    json: {
      enabled: true,
      path: '/api/monitoring/metrics/json'
    },
    log: {
      enabled: process.env.METRICS_LOG_ENABLED === 'true',
      interval: parseInt(process.env.METRICS_LOG_INTERVAL || '300000', 10), // 5 minutes
      level: process.env.METRICS_LOG_LEVEL || 'info'
    }
  }
};

// Merge environment-specific settings with base config
const config = {
  ...baseConfig,
  ...(environments[env] || {})
};

module.exports = config; 