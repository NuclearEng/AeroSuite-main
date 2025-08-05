/**
 * Metrics Module
 * 
 * Provides metrics collection and reporting functionality
 */

const express = require('express');
const os = require('os');

// Initialize metrics router
const metricsRouter = express.Router();

// Store metrics
const metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byPath: {},
    byStatusCode: {}
  },
  errors: {
    total: 0,
    byStatusCode: {}
  },
  performance: {
    responseTime: {
      avg: 0,
      min: Number.MAX_SAFE_INTEGER,
      max: 0,
      count: 0,
      sum: 0
    }
  },
  system: {
    memory: {
      usage: 0,
      free: 0,
      total: 0
    },
    cpu: {
      load: [0, 0, 0]
    }
  },
  workers: {
    active: 0,
    idle: 0,
    total: 0
  }
};

// Update system metrics
function updateSystemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  metrics.system.memory.usage = usedMem;
  metrics.system.memory.free = freeMem;
  metrics.system.memory.total = totalMem;
  metrics.system.cpu.load = os.loadavg();
}

// Update worker pool metrics
function updateWorkerPoolMetrics(workerStats) {
  if (!workerStats) return;
  
  let active = 0;
  let idle = 0;
  let total = 0;
  
  // Aggregate worker stats
  Object.values(workerStats).forEach(pool => {
    active += pool.active || 0;
    idle += (pool.count - pool.active) || 0;
    total += pool.count || 0;
  });
  
  metrics.workers.active = active;
  metrics.workers.idle = idle;
  metrics.workers.total = total;
}

// Metrics middleware
function metricsMiddleware(req, res, next) {
  // Record start time
  const startTime = Date.now();
  
  // Track request
  metrics.requests.total++;
  
  // Track by method
  metrics.requests.byMethod[req.method] = (metrics.requests.byMethod[req.method] || 0) + 1;
  
  // Track by path (simplified)
  const path = req.path.split('/').slice(0, 3).join('/');
  metrics.requests.byPath[path] = (metrics.requests.byPath[path] || 0) + 1;
  
  // Track response
  const originalSend = res.send;
  res.send = function() {
    // Call original send
    originalSend.apply(res, arguments);
    
    // Record end time and calculate response time
    const responseTime = Date.now() - startTime;
    
    // Update response time metrics
    const rt = metrics.performance.responseTime;
    rt.count++;
    rt.sum += responseTime;
    rt.avg = rt.sum / rt.count;
    rt.min = Math.min(rt.min, responseTime);
    rt.max = Math.max(rt.max, responseTime);
    
    // Track by status code
    const statusCode = res.statusCode;
    metrics.requests.byStatusCode[statusCode] = (metrics.requests.byStatusCode[statusCode] || 0) + 1;
    
    // Track errors
    if (statusCode >= 400) {
      metrics.errors.total++;
      metrics.errors.byStatusCode[statusCode] = (metrics.errors.byStatusCode[statusCode] || 0) + 1;
    }
    
    // Update system metrics
    updateSystemMetrics();
  };
  
  next();
}

// Register a gauge metric
function registerGauge(name, help) {
  return {
    set: () => {} // Mock implementation
  };
}

// Metrics endpoint
metricsRouter.get('/metrics', (req, res) => {
  // Update system metrics before responding
  updateSystemMetrics();
  
  // Format metrics in Prometheus format
  const lines = [];
  
  // Helper to add a metric
  function addMetric(name, help, type, value, labels = {}) {
    lines.push(`# HELP ${name} ${help}`);
    lines.push(`# TYPE ${name} ${type}`);
    
    // Format labels
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    
    const labelPart = labelStr ? `{${labelStr}}` : '';
    lines.push(`${name}${labelPart} ${value}`);
  }
  
  // Add request metrics
  addMetric('app_requests_total', 'Total number of HTTP requests', 'counter', metrics.requests.total);
  
  // Add request metrics by method
  Object.entries(metrics.requests.byMethod).forEach(([method, count]) => {
    addMetric('app_requests_by_method', 'HTTP requests by method', 'counter', count, { method });
  });
  
  // Add error metrics
  addMetric('app_errors_total', 'Total number of HTTP errors', 'counter', metrics.errors.total);
  
  // Add response time metrics
  addMetric('app_response_time_seconds_avg', 'Average response time in seconds', 'gauge', 
    metrics.performance.responseTime.avg / 1000);
  addMetric('app_response_time_seconds_max', 'Maximum response time in seconds', 'gauge', 
    metrics.performance.responseTime.max / 1000);
  
  // Add system metrics
  addMetric('system_memory_bytes_total', 'Total system memory in bytes', 'gauge', 
    metrics.system.memory.total);
  addMetric('system_memory_bytes_free', 'Free system memory in bytes', 'gauge', 
    metrics.system.memory.free);
  addMetric('system_memory_bytes_used', 'Used system memory in bytes', 'gauge', 
    metrics.system.memory.usage);
  
  addMetric('system_cpu_load_1m', 'System load average for the last minute', 'gauge', 
    metrics.system.cpu.load[0]);
  
  // Add worker metrics
  addMetric('app_workers_total', 'Total number of workers', 'gauge', metrics.workers.total);
  addMetric('app_workers_active', 'Number of active workers', 'gauge', metrics.workers.active);
  addMetric('app_workers_idle', 'Number of idle workers', 'gauge', metrics.workers.idle);
  
  // Send response
  res.set('Content-Type', 'text/plain');
  res.send(lines.join('\n'));
});

module.exports = {
  metricsRouter,
  metricsMiddleware,
  updateWorkerPoolMetrics,
  metrics,
  registerGauge
}; 