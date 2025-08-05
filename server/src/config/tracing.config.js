/**
 * tracing.config.js
 * 
 * Configuration for distributed tracing
 * Implements RF046 - Add distributed tracing
 */

// Environment-specific configurations
const environments = {
  development: {
    enabled: true,
    serviceName: 'aerosuite-dev',
    samplingRatio: 1.0, // Sample all traces in development
    exporterType: 'console', // Use console exporter in development for ease of debugging
    jaegerEndpoint: 'http://localhost:14268/api/traces',
    otlpEndpoint: 'http://localhost:4318/v1/traces',
    logLevel: 'info'
  },
  test: {
    enabled: false, // Disabled in test environment
    serviceName: 'aerosuite-test',
    samplingRatio: 0,
    exporterType: 'none',
    logLevel: 'error'
  },
  production: {
    enabled: true,
    serviceName: 'aerosuite-prod',
    samplingRatio: 0.1, // Sample 10% of traces in production to reduce overhead
    exporterType: 'jaeger', // Use Jaeger in production
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://jaeger:14268/api/traces',
    otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://otel-collector:4318/v1/traces',
    logLevel: 'warn'
  }
};

// Get current environment
const env = process.env.NODE_ENV || 'development';

// Base configuration
const baseConfig = {
  // Enable/disable tracing globally
  enabled: process.env.TRACING_ENABLED !== 'false',
  
  // Service name for tracing
  serviceName: process.env.TRACING_SERVICE_NAME || 'aerosuite',
  
  // Sampling ratio (0.0 to 1.0)
  samplingRatio: parseFloat(process.env.TRACING_SAMPLING_RATIO || '0.1'),
  
  // Exporter type: 'jaeger', 'otlp', 'console', or 'none'
  exporterType: process.env.TRACING_EXPORTER_TYPE || 'jaeger',
  
  // Jaeger exporter configuration
  jaeger: {
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
  },
  
  // OTLP exporter configuration
  otlp: {
    endpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: {}
  },
  
  // Instrumentation options
  instrumentation: {
    http: {
      enabled: true,
      ignoreIncomingPaths: ['/health', '/metrics', '/favicon.ico'],
      ignoreOutgoingUrls: []
    },
    express: {
      enabled: true,
      ignoreLayers: []
    },
    mongodb: {
      enabled: true,
      enhancedDatabaseReporting: true
    },
    redis: {
      enabled: true
    },
    graphql: {
      enabled: false
    }
  },
  
  // Propagation configuration
  propagation: {
    enabled: true,
    formats: ['tracecontext', 'baggage', 'b3']
  },
  
  // Log level for tracer: 'debug', 'info', 'warn', 'error', 'silent'
  logLevel: process.env.TRACING_LOG_LEVEL || 'info',
  
  // Additional attributes to add to all spans
  defaultAttributes: {
    'service.version': process.env.npm_package_version || '1.0.0',
    'deployment.environment': env
  }
};

// Merge environment-specific settings with base config
const config = {
  ...baseConfig,
  ...(environments[env] || {})
};

module.exports = config; 