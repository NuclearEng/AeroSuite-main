/**
 * Prometheus Metrics Integration
 * 
 * This module provides integration with Prometheus for metrics collection.
 * It exports utility functions to create and manage Prometheus metrics.
 */

// Import prom-client if installed, otherwise provide mock implementations
let client;
try {
  client = require('prom-client');
  
  // Enable default metrics collection
  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({ timeout: 10000 });
} catch (error) {
  console.warn('prom-client not installed, using mock implementations');
  
  // Mock client for environments without prom-client
  client = {
    Registry: class Registry {
      constructor() {
        this.metrics = {};
      }
      
      registerMetric(metric) {
        this.metrics[metric.name] = metric;
        return metric;
      }
      
      getMetricsAsJSON() {
        return Object.values(this.metrics);
      }
      
      contentType() {
        return 'text/plain';
      }
      
      metrics() {
        return 'Mock Prometheus metrics';
      }
    },
    Counter: class Counter {
      constructor(config) {
        this.name = config.name;
        this.help = config.help;
        this.labelNames = config.labelNames || [];
        this.value = 0;
      }
      
      inc(labels, value = 1) {
        this.value += value;
      }
    },
    Gauge: class Gauge {
      constructor(config) {
        this.name = config.name;
        this.help = config.help;
        this.labelNames = config.labelNames || [];
        this.values = {};
      }
      
      set(labels, value) {
        const key = JSON.stringify(labels || {});
        this.values[key] = value;
      }
      
      inc(labels, value = 1) {
        const key = JSON.stringify(labels || {});
        this.values[key] = (this.values[key] || 0) + value;
      }
      
      dec(labels, value = 1) {
        const key = JSON.stringify(labels || {});
        this.values[key] = (this.values[key] || 0) - value;
      }
    },
    Histogram: class Histogram {
      constructor(config) {
        this.name = config.name;
        this.help = config.help;
        this.labelNames = config.labelNames || [];
        this.buckets = config.buckets || [0.1, 0.5, 1, 2, 5];
        this.observations = [];
      }
      
      observe(labels, value) {
        this.observations.push({ labels, value });
      }
    },
    Summary: class Summary {
      constructor(config) {
        this.name = config.name;
        this.help = config.help;
        this.labelNames = config.labelNames || [];
        this.percentiles = config.percentiles || [0.01, 0.05, 0.5, 0.9, 0.95, 0.99];
        this.observations = [];
      }
      
      observe(labels, value) {
        this.observations.push({ labels, value });
      }
    }
  };
}

// Create a registry
const registry = new client.Registry();

/**
 * Create a histogram metric
 * 
 * @param {string} name - Metric name
 * @param {string} help - Help description
 * @param {Array<string>} labelNames - Label names
 * @param {Array<number>} buckets - Histogram buckets
 * @returns {Histogram} Histogram instance
 */
function createHistogram(name, help, labelNames = [], buckets = [0.1, 0.5, 1, 2, 5]) {
  const histogram = new client.Histogram({
    name,
    help,
    labelNames,
    buckets,
    registers: [registry]
  });
  
  return histogram;
}

/**
 * Create a gauge metric
 * 
 * @param {string} name - Metric name
 * @param {string} help - Help description
 * @param {Array<string>} labelNames - Label names
 * @returns {Gauge} Gauge instance
 */
function createGauge(name, help, labelNames = []) {
  const gauge = new client.Gauge({
    name,
    help,
    labelNames,
    registers: [registry]
  });
  
  return gauge;
}

/**
 * Create a counter metric
 * 
 * @param {string} name - Metric name
 * @param {string} help - Help description
 * @param {Array<string>} labelNames - Label names
 * @returns {Counter} Counter instance
 */
function createCounter(name, help, labelNames = []) {
  const counter = new client.Counter({
    name,
    help,
    labelNames,
    registers: [registry]
  });
  
  return counter;
}

/**
 * Create a summary metric
 * 
 * @param {string} name - Metric name
 * @param {string} help - Help description
 * @param {Array<string>} labelNames - Label names
 * @param {Object} options - Summary options
 * @returns {Summary} Summary instance
 */
function createSummary(name, help, labelNames = [], options = {}) {
  const summary = new client.Summary({
    name,
    help,
    labelNames,
    percentiles: options.percentiles || [0.01, 0.05, 0.5, 0.9, 0.95, 0.99],
    maxAgeSeconds: options.maxAgeSeconds || 600,
    ageBuckets: options.ageBuckets || 5,
    registers: [registry]
  });
  
  return summary;
}

/**
 * Get metrics in Prometheus format
 * 
 * @returns {string} Metrics in Prometheus format
 */
function getMetrics() {
  return registry.metrics();
}

/**
 * Get metrics content type
 * 
 * @returns {string} Content type for Prometheus metrics
 */
function getContentType() {
  return registry.contentType();
}

module.exports = {
  createHistogram,
  createGauge,
  createCounter,
  createSummary,
  getMetrics,
  getContentType,
  registry
}; 