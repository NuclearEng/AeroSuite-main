/**
 * database-monitoring.js
 * 
 * Script to set up and run database monitoring
 * Implements RF032 - Set up database monitoring
 */

const mongoose = require('mongoose');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../infrastructure/logger');
const { createGauge, createHistogram, createCounter } = require('../monitoring/prometheus');

// Database metrics
const dbConnectionsGauge = createGauge('mongodb_connections', 
  'MongoDB connections', 
  ['state']
);

const dbOperationsCounter = createCounter('mongodb_operations_total', 
  'MongoDB operations total', 
  ['type', 'collection']
);

const dbOperationDurationHistogram = createHistogram('mongodb_operation_duration_seconds', 
  'MongoDB operation duration in seconds', 
  ['type', 'collection'],
  [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
);

const dbDocumentCountGauge = createGauge('mongodb_document_count', 
  'MongoDB document count', 
  ['collection']
);

const dbIndexSizeGauge = createGauge('mongodb_index_size_bytes', 
  'MongoDB index size in bytes', 
  ['collection', 'index']
);

const dbStorageSizeGauge = createGauge('mongodb_storage_size_bytes', 
  'MongoDB storage size in bytes', 
  ['collection']
);

const dbSlowQueriesCounter = createCounter('mongodb_slow_queries_total', 
  'MongoDB slow queries total', 
  ['collection', 'operation']
);

const dbQueryErrorsCounter = createCounter('mongodb_query_errors_total', 
  'MongoDB query errors total', 
  ['collection', 'operation', 'error_type']
);

// Load all models
const models = {
  Supplier: require('../models/supplier.model'),
  Customer: require('../models/customer.model'),
  Inspection: require('../models/inspection.model'),
  Component: require('../models/component.model'),
  User: require('../models/user.model'),
  RiskAssessment: require('../models/RiskAssessment'),
  QualityManagement: require('../models/QualityManagement'),
  SecurityIncident: require('../models/SecurityIncident'),
  Document: require('../models/document.model'),
  CalendarEvent: require('../models/CalendarEvent'),
  CalendarIntegration: require('../models/CalendarIntegration')
};

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
  try {
    logger.info('Connecting to database for monitoring...');
    await mongoose.connect(config.database.url, config.database.options);
    logger.info('Connected to database');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectFromDatabase() {
  try {
    logger.info('Disconnecting from database...');
    await mongoose.disconnect();
    logger.info('Disconnected from database');
  } catch (error) {
    logger.error('Failed to disconnect from database:', error);
  }
}

/**
 * Collect MongoDB server statistics
 */
async function collectServerStats() {
  try {
    logger.info('Collecting MongoDB server statistics...');
    
    const serverStatus = await mongoose.connection.db.command({ serverStatus: 1 });
    
    // Connection metrics
    const connections = serverStatus.connections;
    dbConnectionsGauge.set({ state: 'current' }, connections.current);
    dbConnectionsGauge.set({ state: 'available' }, connections.available);
    dbConnectionsGauge.set({ state: 'active' }, connections.active);
    
    // Operation metrics
    const opCounters = serverStatus.opcounters;
    for (const [op, count] of Object.entries(opCounters)) {
      dbOperationsCounter.inc({ type: op, collection: 'all' }, 0); // Initialize with 0 increment
    }
    
    // Memory metrics
    const mem = serverStatus.mem;
    if (mem) {
      createGauge('mongodb_memory_usage_bytes', 'MongoDB memory usage in bytes', ['type'])
        .set({ type: 'resident' }, mem.resident * 1024 * 1024);
      createGauge('mongodb_memory_usage_bytes', 'MongoDB memory usage in bytes', ['type'])
        .set({ type: 'virtual' }, mem.virtual * 1024 * 1024);
    }
    
    logger.info('Server statistics collected');
  } catch (error) {
    logger.error('Failed to collect server statistics:', error);
  }
}

/**
 * Collect database statistics
 */
async function collectDatabaseStats() {
  try {
    logger.info('Collecting database statistics...');
    
    const dbStats = await mongoose.connection.db.stats();
    
    createGauge('mongodb_database_size_bytes', 'MongoDB database size in bytes', [])
      .set(dbStats.dataSize);
    
    createGauge('mongodb_database_storage_bytes', 'MongoDB database storage in bytes', [])
      .set(dbStats.storageSize);
    
    createGauge('mongodb_database_indexes_bytes', 'MongoDB database indexes size in bytes', [])
      .set(dbStats.indexSize);
    
    createGauge('mongodb_database_objects', 'MongoDB database objects count', [])
      .set(dbStats.objects);
    
    createGauge('mongodb_database_collections', 'MongoDB database collections count', [])
      .set(dbStats.collections);
    
    createGauge('mongodb_database_views', 'MongoDB database views count', [])
      .set(dbStats.views);
    
    logger.info('Database statistics collected');
  } catch (error) {
    logger.error('Failed to collect database statistics:', error);
  }
}

/**
 * Collect collection statistics
 */
async function collectCollectionStats() {
  try {
    logger.info('Collecting collection statistics...');
    
    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const collectionName = collection.name;
      
      // Skip system collections
      if (collectionName.startsWith('system.')) {
        continue;
      }
      
      // Get collection stats
      const stats = await mongoose.connection.db.collection(collectionName).stats();
      
      // Document count
      dbDocumentCountGauge.set({ collection: collectionName }, stats.count);
      
      // Storage size
      dbStorageSizeGauge.set({ collection: collectionName }, stats.storageSize);
      
      // Index sizes
      if (stats.indexSizes) {
        for (const [indexName, size] of Object.entries(stats.indexSizes)) {
          dbIndexSizeGauge.set({ collection: collectionName, index: indexName }, size);
        }
      }
      
      // Average document size
      if (stats.count > 0 && stats.size > 0) {
        createGauge('mongodb_avg_document_size_bytes', 'MongoDB average document size in bytes', ['collection'])
          .set({ collection: collectionName }, stats.size / stats.count);
      }
    }
    
    logger.info('Collection statistics collected');
  } catch (error) {
    logger.error('Failed to collect collection statistics:', error);
  }
}

/**
 * Collect profiling information
 */
async function collectProfilingInfo() {
  try {
    logger.info('Collecting profiling information...');
    
    // Enable profiling if not already enabled
    const profilingStatus = await mongoose.connection.db.command({ profile: -1 });
    
    if (profilingStatus.was !== 1) {
      await mongoose.connection.db.command({ profile: 1, slowms: 100 });
      logger.info('Profiling enabled with slowms: 100');
    }
    
    // Get slow queries from system.profile
    const slowQueries = await mongoose.connection.db
      .collection('system.profile')
      .find({ millis: { $gt: 100 } })
      .sort({ ts: -1 })
      .limit(100)
      .toArray();
    
    logger.info(`Found ${slowQueries.length} slow queries`);
    
    // Process slow queries
    for (const query of slowQueries) {
      const collectionName = query.ns.split('.')[1];
      const operation = query.op;
      
      // Increment slow query counter
      dbSlowQueriesCounter.inc({ collection: collectionName, operation });
      
      // Log slow query
      logger.warn(`Slow query detected: ${operation} on ${collectionName}, took ${query.millis}ms`);
    }
    
    logger.info('Profiling information collected');
  } catch (error) {
    logger.error('Failed to collect profiling information:', error);
  }
}

/**
 * Monitor database operations
 */
function monitorDatabaseOperations() {
  // Set up operation monitoring using Mongoose middleware
  mongoose.plugin(schema => {
    // Monitor find operations
    schema.pre(['find', 'findOne', 'findById'], function() {
      this._startTime = Date.now();
    });
    
    schema.post(['find', 'findOne', 'findById'], function(result, next) {
      if (this._startTime) {
        const duration = (Date.now() - this._startTime) / 1000;
        const collectionName = this.model.collection.name;
        const operation = this.op;
        
        // Record operation metrics
        dbOperationsCounter.inc({ type: operation, collection: collectionName });
        dbOperationDurationHistogram.observe({ type: operation, collection: collectionName }, duration);
        
        // Check for slow queries
        if (duration > 0.1) { // 100ms threshold
          dbSlowQueriesCounter.inc({ collection: collectionName, operation });
        }
      }
      next();
    });
    
    // Monitor write operations
    schema.pre(['save', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'], function() {
      this._startTime = Date.now();
    });
    
    schema.post(['save', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'], function(result, next) {
      if (this._startTime) {
        const duration = (Date.now() - this._startTime) / 1000;
        const collectionName = this.model ? this.model.collection.name : 'unknown';
        const operation = this.op || 'unknown';
        
        // Record operation metrics
        dbOperationsCounter.inc({ type: operation, collection: collectionName });
        dbOperationDurationHistogram.observe({ type: operation, collection: collectionName }, duration);
        
        // Check for slow queries
        if (duration > 0.1) { // 100ms threshold
          dbSlowQueriesCounter.inc({ collection: collectionName, operation });
        }
      }
      next();
    });
    
    // Monitor errors
    schema.post(['find', 'findOne', 'findById', 'save', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany'], function(error, doc, next) {
      if (error) {
        const collectionName = this.model ? this.model.collection.name : 'unknown';
        const operation = this.op || 'unknown';
        const errorType = error.name || 'UnknownError';
        
        // Record error metrics
        dbQueryErrorsCounter.inc({ collection: collectionName, operation, error_type: errorType });
        
        // Log error
        logger.error(`Database error: ${operation} on ${collectionName}, error: ${error.message}`);
      }
      next(error);
    });
  });
}

/**
 * Generate monitoring report
 */
async function generateReport() {
  try {
    logger.info('Generating database monitoring report...');
    
    // Get database stats
    const dbStats = await mongoose.connection.db.stats();
    
    // Get server status
    const serverStatus = await mongoose.connection.db.command({ serverStatus: 1 });
    
    // Get collection stats
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionStats = {};
    
    for (const collection of collections) {
      if (!collection.name.startsWith('system.')) {
        collectionStats[collection.name] = await mongoose.connection.db.collection(collection.name).stats();
      }
    }
    
    // Get profiling status
    const profilingStatus = await mongoose.connection.db.command({ profile: -1 });
    
    // Get slow queries
    const slowQueries = await mongoose.connection.db
      .collection('system.profile')
      .find({ millis: { $gt: 100 } })
      .sort({ ts: -1 })
      .limit(20)
      .toArray();
    
    // Create report
    const report = {
      timestamp: new Date(),
      database: config.database.name,
      server: {
        version: serverStatus.version,
        uptime: serverStatus.uptime,
        connections: serverStatus.connections,
        opcounters: serverStatus.opcounters
      },
      database_stats: {
        collections: dbStats.collections,
        views: dbStats.views,
        objects: dbStats.objects,
        dataSize: formatBytes(dbStats.dataSize),
        storageSize: formatBytes(dbStats.storageSize),
        indexes: dbStats.indexes,
        indexSize: formatBytes(dbStats.indexSize)
      },
      collection_stats: Object.entries(collectionStats).map(([name, stats]) => ({
        name,
        count: stats.count,
        size: formatBytes(stats.size),
        storageSize: formatBytes(stats.storageSize),
        avgObjSize: stats.avgObjSize ? formatBytes(stats.avgObjSize) : 'N/A',
        indexes: stats.nindexes,
        indexSize: formatBytes(stats.totalIndexSize)
      })),
      profiling: {
        level: profilingStatus.was,
        slowms: profilingStatus.slowms,
        slow_queries: slowQueries.map(query => ({
          collection: query.ns.split('.')[1],
          operation: query.op,
          duration_ms: query.millis,
          timestamp: query.ts
        }))
      }
    };
    
    // Write report to file
    const reportPath = path.join(__dirname, '../../reports/database-monitoring-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = generateHtmlReport(report);
    const htmlReportPath = path.join(__dirname, '../../reports/database-monitoring-report.html');
    await fs.writeFile(htmlReportPath, htmlReport);
    
    logger.info(`Database monitoring report generated at ${reportPath}`);
    logger.info(`HTML report generated at ${htmlReportPath}`);
    
    return reportPath;
  } catch (error) {
    logger.error('Failed to generate database monitoring report:', error);
    return null;
  }
}

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted bytes
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate HTML report
 * @param {Object} report - JSON report
 * @returns {string} HTML report
 */
function generateHtmlReport(report) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Database Monitoring Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: #f9f9f9;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .summary {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
    }
    .summary-item {
      flex: 1;
      min-width: 200px;
      padding: 15px;
      background-color: #e9f0f7;
      border-radius: 5px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-value {
      font-size: 24px;
      font-weight: bold;
      color: #0066cc;
    }
    pre {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Database Monitoring Report</h1>
    <p>Database: ${report.database}</p>
    <p>Generated on: ${report.timestamp}</p>
    
    <div class="summary">
      <div class="summary-item">
        <h3>Collections</h3>
        <div class="summary-value">${report.database_stats.collections}</div>
      </div>
      <div class="summary-item">
        <h3>Objects</h3>
        <div class="summary-value">${report.database_stats.objects}</div>
      </div>
      <div class="summary-item">
        <h3>Indexes</h3>
        <div class="summary-value">${report.database_stats.indexes}</div>
      </div>
      <div class="summary-item">
        <h3>Storage Size</h3>
        <div class="summary-value">${report.database_stats.storageSize}</div>
      </div>
    </div>
    
    <div class="card">
      <h2>Server Information</h2>
      <table>
        <tr>
          <th>Version</th>
          <td>${report.server.version}</td>
        </tr>
        <tr>
          <th>Uptime</th>
          <td>${formatDuration(report.server.uptime)}</td>
        </tr>
        <tr>
          <th>Connections</th>
          <td>Current: ${report.server.connections.current}, Available: ${report.server.connections.available}</td>
        </tr>
        <tr>
          <th>Operations</th>
          <td>
            Insert: ${report.server.opcounters.insert}, 
            Query: ${report.server.opcounters.query}, 
            Update: ${report.server.opcounters.update}, 
            Delete: ${report.server.opcounters.delete}, 
            Getmore: ${report.server.opcounters.getmore}, 
            Command: ${report.server.opcounters.command}
          </td>
        </tr>
      </table>
    </div>
    
    <div class="card">
      <h2>Collections</h2>
      <table>
        <thead>
          <tr>
            <th>Collection</th>
            <th>Documents</th>
            <th>Size</th>
            <th>Storage Size</th>
            <th>Avg. Object Size</th>
            <th>Indexes</th>
            <th>Index Size</th>
          </tr>
        </thead>
        <tbody>
          ${report.collection_stats.map(collection => `
            <tr>
              <td>${collection.name}</td>
              <td>${collection.count}</td>
              <td>${collection.size}</td>
              <td>${collection.storageSize}</td>
              <td>${collection.avgObjSize}</td>
              <td>${collection.indexes}</td>
              <td>${collection.indexSize}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="card">
      <h2>Slow Queries</h2>
      <table>
        <thead>
          <tr>
            <th>Collection</th>
            <th>Operation</th>
            <th>Duration (ms)</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${report.profiling.slow_queries.map(query => `
            <tr>
              <td>${query.collection}</td>
              <td>${query.operation}</td>
              <td>${query.duration_ms}</td>
              <td>${new Date(query.timestamp).toISOString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  
  <script>
    function formatDuration(seconds) {
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      
      let result = '';
      if (days > 0) result += days + 'd ';
      if (hours > 0) result += hours + 'h ';
      if (minutes > 0) result += minutes + 'm ';
      if (secs > 0) result += secs + 's';
      
      return result.trim();
    }
  </script>
</body>
</html>`;
}

/**
 * Format duration in seconds to human-readable format
 * @param {number} seconds - Seconds to format
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  let result = '';
  if (days > 0) result += days + 'd ';
  if (hours > 0) result += hours + 'h ';
  if (minutes > 0) result += minutes + 'm ';
  if (secs > 0) result += secs + 's';
  
  return result.trim();
}

/**
 * Run database monitoring
 */
async function runMonitoring() {
  try {
    await connectToDatabase();
    
    // Set up operation monitoring
    monitorDatabaseOperations();
    
    // Collect metrics
    await collectServerStats();
    await collectDatabaseStats();
    await collectCollectionStats();
    await collectProfilingInfo();
    
    // Generate report
    const reportPath = await generateReport();
    
    logger.info('Database monitoring completed');
    logger.info(`See the full report at ${reportPath}`);
    
  } catch (error) {
    logger.error('Error during database monitoring:', error);
  } finally {
    await disconnectFromDatabase();
  }
}

/**
 * Start continuous monitoring
 * @param {number} intervalMs - Monitoring interval in milliseconds
 */
function startContinuousMonitoring(intervalMs = 60000) {
  logger.info(`Starting continuous database monitoring with ${intervalMs}ms interval`);
  
  // Run immediately
  runMonitoring().catch(console.error);
  
  // Then run at intervals
  setInterval(() => {
    runMonitoring().catch(console.error);
  }, intervalMs);
}

// Run the script if executed directly
if (require.main === module) {
  if (process.argv.includes('--continuous')) {
    const interval = parseInt(process.argv[process.argv.indexOf('--interval') + 1] || '60000', 10);
    startContinuousMonitoring(interval);
  } else {
    runMonitoring().catch(console.error);
  }
}

module.exports = { 
  runMonitoring, 
  startContinuousMonitoring,
  collectServerStats,
  collectDatabaseStats,
  collectCollectionStats,
  collectProfilingInfo,
  generateReport
}; 