/**
 * metrics-collection-example.js
 * 
 * Example usage of metrics collection
 * Implements RF047 - Set up metrics collection
 */

const express = require('express');
const { 
  metricsService, 
  metricsMiddleware 
} = require('../infrastructure/monitoring');
const logger = require('../infrastructure/logger');

// Create Express app
const app = express();

// Apply metrics middleware to all routes
app.use(metricsMiddleware());

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Metrics collection example' });
});

// Example 1: HTTP metrics
app.get('/api/example', (req, res) => {
  // This route will automatically be tracked by the HTTP metrics middleware
  res.json({ message: 'This route is tracked by HTTP metrics' });
});

// Example 2: Database metrics
app.get('/api/database', (req, res) => {
  // Simulate database query
  setTimeout(() => {
    // Record a database query
    metricsService.recordDatabaseQuery({
      operation: 'find',
      collection: 'users',
      query: { role: 'admin' },
      result: [{ id: 1, name: 'Admin User' }],
      duration: 50 // 50ms
    });
    
    res.json({ message: 'Database metrics example' });
  }, 50);
});

// Example 3: Business metrics
app.get('/api/business', (req, res) => {
  // Update supplier metrics
  metricsService.updateSupplierMetrics({
    totalCount: 100,
    activeCount: 85,
    inactiveCount: 10,
    pendingCount: 5,
    supplierComponents: {
      'supplier-1': 50,
      'supplier-2': 30
    },
    supplierQualityScores: {
      'supplier-1': 92,
      'supplier-2': 87
    }
  });
  
  // Update customer metrics
  metricsService.updateCustomerMetrics({
    totalCount: 500,
    activeCount: 450,
    inactiveCount: 50,
    customerComponents: {
      'customer-1': 100,
      'customer-2': 75
    }
  });
  
  res.json({ message: 'Business metrics example' });
});

// Example 4: Slow database query
app.get('/api/slow-query', (req, res) => {
  // Simulate slow database query
  setTimeout(() => {
    // Record a slow database query
    metricsService.recordDatabaseQuery({
      operation: 'aggregate',
      collection: 'orders',
      query: { complex: 'pipeline' },
      result: [{ total: 1000 }],
      duration: 1200 // 1200ms (above the slow query threshold)
    });
    
    res.json({ message: 'Slow query metrics example' });
  }, 1200);
});

// Example 5: Database error
app.get('/api/database-error', (req, res) => {
  // Simulate database error
  setTimeout(() => {
    const error = new Error('Database connection failed');
    error.name = 'MongoConnectionError';
    
    // Record a database error
    metricsService.recordDatabaseQuery({
      operation: 'find',
      collection: 'products',
      query: { id: 123 },
      error,
      duration: 30
    });
    
    res.status(500).json({ error: 'Database error example' });
  }, 30);
});

// Example 6: Database connection metrics
app.get('/api/connection-stats', (req, res) => {
  // Update database connection metrics
  metricsService.updateDatabaseConnectionMetrics({
    active: 5,
    available: 15,
    pending: 2,
    min: 5,
    max: 20,
    size: 20
  });
  
  res.json({ message: 'Connection metrics example' });
});

// Example 7: Collection statistics
app.get('/api/collection-stats', (req, res) => {
  // Update collection statistics
  metricsService.updateDatabaseCollectionStats({
    collection: 'users',
    count: 10000,
    size: 2048000,
    storageSize: 2500000,
    indexSizes: {
      '_id_': 204800,
      'email_1': 102400,
      'username_1': 102400
    }
  });
  
  res.json({ message: 'Collection statistics example' });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', metricsService.getContentType());
  res.end(metricsService.getPrometheusMetrics());
});

// JSON metrics endpoint
app.get('/metrics/json', (req, res) => {
  res.json(metricsService.getMetricsAsJson());
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Metrics collection example running on port ${PORT}`);
  logger.info(`Try accessing these endpoints to see metrics in action:`);
  logger.info(`- http://localhost:${PORT}/api/example (HTTP metrics)`);
  logger.info(`- http://localhost:${PORT}/api/database (Database metrics)`);
  logger.info(`- http://localhost:${PORT}/api/business (Business metrics)`);
  logger.info(`- http://localhost:${PORT}/api/slow-query (Slow query metrics)`);
  logger.info(`- http://localhost:${PORT}/api/database-error (Database error metrics)`);
  logger.info(`- http://localhost:${PORT}/api/connection-stats (Connection metrics)`);
  logger.info(`- http://localhost:${PORT}/api/collection-stats (Collection statistics)`);
  logger.info(`- http://localhost:${PORT}/metrics (Prometheus metrics)`);
  logger.info(`- http://localhost:${PORT}/metrics/json (JSON metrics)`);
});

module.exports = app; 