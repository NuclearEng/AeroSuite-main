/**
 * infrastructure/tracing/index.js
 * 
 * Distributed tracing implementation
 * Implements RF046 - Add distributed tracing
 */

const opentelemetry = require('@opentelemetry/api');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { SimpleSpanProcessor, BatchSpanProcessor, ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const config = require('../../config/tracing.config');
const logger = require('../logger');

// Set up diagnostic logging
const logLevels = {
  debug: DiagLogLevel.DEBUG,
  info: DiagLogLevel.INFO,
  warn: DiagLogLevel.WARN,
  error: DiagLogLevel.ERROR,
  silent: DiagLogLevel.NONE
};

diag.setLogger(new DiagConsoleLogger(), logLevels[config.logLevel] || DiagLogLevel.INFO);

let sdk = null;

/**
 * Initialize distributed tracing
 * @returns {Promise<void>}
 */
async function initTracing() {
  if (!config.enabled) {
    logger.info('Distributed tracing is disabled');
    return;
  }
  
  try {
    // Create resource
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      ...config.defaultAttributes
    });
    
    // Create span processors based on configuration
    const spanProcessors = [];
    
    if (config.exporterType === 'jaeger') {
      const jaegerExporter = new JaegerExporter({
        endpoint: config.jaeger.endpoint
      });
      spanProcessors.push(new BatchSpanProcessor(jaegerExporter));
      logger.info(`Jaeger exporter configured with endpoint: ${config.jaeger.endpoint}`);
    }
    
    if (config.exporterType === 'otlp') {
      const otlpExporter = new OTLPTraceExporter({
        url: config.otlp.endpoint,
        headers: config.otlp.headers
      });
      spanProcessors.push(new BatchSpanProcessor(otlpExporter));
      logger.info(`OTLP exporter configured with endpoint: ${config.otlp.endpoint}`);
    }
    
    if (config.exporterType === 'console') {
      spanProcessors.push(new SimpleSpanProcessor(new ConsoleSpanExporter()));
      logger.info('Console exporter configured for tracing');
    }
    
    // Configure instrumentation
    const instrumentations = getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': config.instrumentation.http,
      '@opentelemetry/instrumentation-express': config.instrumentation.express,
      '@opentelemetry/instrumentation-mongodb': config.instrumentation.mongodb,
      '@opentelemetry/instrumentation-redis': config.instrumentation.redis,
      '@opentelemetry/instrumentation-graphql': config.instrumentation.graphql
    });
    
    // Create SDK
    sdk = new NodeSDK({
      resource,
      spanProcessors,
      instrumentations,
      sampler: {
        type: 'probabilistic',
        ratio: config.samplingRatio
      }
    });
    
    // Start SDK
    sdk.start();
    logger.info(`Distributed tracing initialized for service: ${config.serviceName}`);
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      shutdownTracing()
        .then(() => process.exit(0))
        .catch((err) => {
          logger.error('Error shutting down tracing', err);
          process.exit(1);
        });
    });
    
    return sdk;
  } catch (error) {
    logger.error('Failed to initialize distributed tracing', error);
    throw error;
  }
}

/**
 * Shutdown tracing
 * @returns {Promise<void>}
 */
async function shutdownTracing() {
  if (sdk) {
    await sdk.shutdown();
    logger.info('Distributed tracing shut down');
  }
}

/**
 * Get the tracer for creating spans
 * @param {string} name - Name of the module
 * @returns {Tracer} OpenTelemetry tracer
 */
function getTracer(name) {
  return opentelemetry.trace.getTracer(name || 'default');
}

/**
 * Get the current span
 * @returns {Span|undefined} Current active span or undefined
 */
function getCurrentSpan() {
  return opentelemetry.trace.getSpan(opentelemetry.context.active());
}

/**
 * Create a new span
 * @param {string} name - Span name
 * @param {Object} options - Span options
 * @param {Function} callback - Function to execute within the span
 * @returns {Promise<any>} Result of the callback
 */
async function createSpan(name, options, callback) {
  const tracer = getTracer();
  
  return tracer.startActiveSpan(name, options, async (span) => {
    try {
      const result = await callback(span);
      span.end();
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR });
      span.end();
      throw error;
    }
  });
}

/**
 * Add attributes to the current span
 * @param {Object} attributes - Attributes to add
 */
function addAttributes(attributes) {
  const span = getCurrentSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Record an exception in the current span
 * @param {Error} error - Error to record
 */
function recordException(error) {
  const span = getCurrentSpan();
  if (span) {
    span.recordException(error);
    span.setStatus({ code: opentelemetry.SpanStatusCode.ERROR });
  }
}

module.exports = {
  initTracing,
  shutdownTracing,
  getTracer,
  getCurrentSpan,
  createSpan,
  addAttributes,
  recordException,
  opentelemetry
}; 