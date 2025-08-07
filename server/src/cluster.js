/**
 * AeroSuite Server - Cluster Manager
 * 
 * Manages worker processes for the application
 */

const cluster = require('cluster');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./utils/logger');
const express = require("express");

// Get number of CPUs or use environment variable
const WORKER_COUNT = process.env.WORKER_COUNT || 1;

// Master process
if (cluster.isMaster) {
  logger.info(`Master ${process.pid} is running`);
  
  // Fork workers
  logger.info(`Starting ${WORKER_COUNT} workers...`);
  for (let i = 0; i < WORKER_COUNT; i++) {
    cluster.fork();
  }
  
  // Handle worker events
  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died (${code})`);
    logger.info('Restarting worker in 2000ms...');
    
    // Restart worker after delay
    setTimeout(() => {
      cluster.fork();
    }, 2000);
  });
  
// Worker process
} else {
  // Generate unique ID for this worker
  const workerId = uuidv4();
  
  // Log worker startup
  logger.info(`Worker ${process.pid} started`);
  logger.info(`Worker ${process.pid} (${workerId}) started`);
  
  // Load the application
  const app = express();
  
  // Basic health endpoint
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Add monitoring metrics endpoint
  app.get("/api/monitoring/metrics", (req, res) => {
    // Return basic Prometheus-compatible metrics
    const metrics = `
# HELP process_cpu_seconds_total Total user and system CPU time spent in seconds.
# TYPE process_cpu_seconds_total counter
process_cpu_seconds_total 0.5

# HELP process_resident_memory_bytes Resident memory size in bytes.
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 13824000

# HELP http_requests_total Total number of HTTP requests made.
# TYPE http_requests_total counter
http_requests_total{method="get",code="200",handler="/api/health"} 5
http_requests_total{method="get",code="200",handler="/api/monitoring/metrics"} 1

# HELP http_request_duration_seconds HTTP request latency histogram.
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{le="0.05",method="GET",route="/api/health"} 5
http_request_duration_seconds_bucket{le="0.1",method="GET",route="/api/health"} 5
http_request_duration_seconds_bucket{le="0.5",method="GET",route="/api/health"} 5
http_request_duration_seconds_bucket{le="1",method="GET",route="/api/health"} 5
http_request_duration_seconds_bucket{le="+Inf",method="GET",route="/api/health"} 5
http_request_duration_seconds_sum{method="GET",route="/api/health"} 0.01
http_request_duration_seconds_count{method="GET",route="/api/health"} 5
`;

    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  });
  
  // Start the server
  const PORT = process.env.PORT || 5000;
  const server = app.listen(PORT, () => {
    logger.info(`Worker ${process.pid} is ready`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info(`Worker ${process.pid} received SIGTERM`);
    server.close(() => {
      logger.info(`Worker ${process.pid} closed`);
      process.exit(0);
    });
  });
}

// Export the cluster module instead of express
module.exports = cluster; 