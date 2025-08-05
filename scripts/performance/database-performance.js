/**
 * Database Performance Testing Module
 * 
 * This module tests the performance of database queries by executing 
 * common queries and measuring execution time and resource usage.
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { createSpinner } = require('nanospinner');

// Default queries to test if none specified
const DEFAULT_QUERIES = [
  { 
    name: 'suppliers-find-all', 
    collection: 'suppliers',
    operation: 'find',
    query: {},
    options: { limit: 1000 }
  },
  { 
    name: 'customers-find-all', 
    collection: 'customers',
    operation: 'find',
    query: {},
    options: { limit: 1000 }
  },
  { 
    name: 'inspections-find-all', 
    collection: 'inspections',
    operation: 'find',
    query: {},
    options: { limit: 1000 }
  },
  { 
    name: 'inspections-with-defects', 
    collection: 'inspections',
    operation: 'find',
    query: { defectCount: { $gt: 0 } },
    options: { limit: 1000 }
  },
  { 
    name: 'active-suppliers', 
    collection: 'suppliers',
    operation: 'find',
    query: { status: 'Active' },
    options: { limit: 1000 }
  },
  { 
    name: 'inspections-by-supplier-aggregate', 
    collection: 'inspections',
    operation: 'aggregate',
    pipeline: [
      { $group: { _id: '$supplierId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]
  },
  { 
    name: 'complex-inspection-stats', 
    collection: 'inspections',
    operation: 'aggregate',
    pipeline: [
      { 
        $match: { 
          status: 'Completed',
          completedDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: '$result',
          count: { $sum: 1 },
          avgDefects: { $avg: '$defectCount' }
        }
      },
      { $sort: { count: -1 } }
    ]
  },
  { 
    name: 'customer-with-inspections-lookup', 
    collection: 'customers',
    operation: 'aggregate',
    pipeline: [
      { $match: { status: 'Active' } },
      { 
        $lookup: {
          from: 'inspections',
          localField: '_id',
          foreignField: 'customerId',
          as: 'inspections'
        }
      },
      { $limit: 10 }
    ]
  }
];

/**
 * Run database performance tests
 */
async function run(config) {
  const spinner = createSpinner('Connecting to database').start();
  
  // Connect to MongoDB
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    spinner.success({ text: 'Connected to database' });
  } catch (error) {
    spinner.error({ text: `Could not connect to database: ${error.message}` });
    throw new Error(`Database connection failed: ${error.message}`);
  }
  
  // Determine which queries to test
  // For this module, we'll use the default queries always
  // since they're designed to test common database operations
  const queriesToTest = DEFAULT_QUERIES;

  console.log(`Testing ${queriesToTest.length} database queries`);
  
  // Run tests for each query
  const results = [];
  
  for (const queryConfig of queriesToTest) {
    const querySpinner = createSpinner(`Testing query: ${queryConfig.name}`).start();
    
    try {
      // Run query multiple times to get a good average
      const iterations = 5;
      const iterationResults = [];
      
      for (let i = 0; i < iterations; i++) {
        const result = await executeQuery(queryConfig);
        iterationResults.push(result);
      }
      
      // Calculate average metrics
      const avgDuration = iterationResults.reduce((sum, r) => sum + r.duration, 0) / iterations;
      const avgResultCount = iterationResults.reduce((sum, r) => sum + r.resultCount, 0) / iterations;
      
      const finalResult = {
        query: queryConfig.name,
        collection: queryConfig.collection,
        operation: queryConfig.operation,
        avgDuration,
        avgResultCount,
        executions: iterations,
        success: true
      };
      
      results.push(finalResult);
      querySpinner.success({ text: `Query ${queryConfig.name} tested successfully (avg: ${avgDuration.toFixed(2)}ms)` });
    } catch (error) {
      querySpinner.error({ text: `Error testing query ${queryConfig.name}: ${error.message}` });
      results.push({
        query: queryConfig.name,
        collection: queryConfig.collection,
        operation: queryConfig.operation,
        error: error.message,
        success: false
      });
    }
  }
  
  // Get database server status for additional metrics
  let serverStatus = null;
  try {
    serverStatus = await mongoose.connection.db.command({ serverStatus: 1 });
  } catch (error) {
    console.warn('Warning: Could not get server status. Some metrics will not be available.');
  }
  
  // Get collection stats for additional metrics
  const collectionStats = {};
  try {
    for (const collection of ['suppliers', 'customers', 'inspections']) {
      collectionStats[collection] = await mongoose.connection.db.command({ collStats: collection });
    }
  } catch (error) {
    console.warn('Warning: Could not get collection stats. Some metrics will not be available.');
  }
  
  // Disconnect from database
  await mongoose.disconnect();
  
  // Generate summary stats
  const summary = generateSummary(results, serverStatus, collectionStats);
  
  // Save detailed results
  const resultPath = path.join(config.reportDir, `database-performance-${config.timestamp}.json`);
  fs.writeFileSync(resultPath, JSON.stringify({ 
    results, 
    summary,
    serverStatus: serverStatus ? {
      uptime: serverStatus.uptime,
      connections: serverStatus.connections,
      opcounters: serverStatus.opcounters,
      mem: serverStatus.mem
    } : null,
    collectionStats
  }, null, 2));
  
  return {
    results,
    summary,
    recommendations: generateRecommendations(results, summary, serverStatus, collectionStats)
  };
}

/**
 * Execute a database query and measure performance
 */
async function executeQuery(queryConfig) {
  const startTime = Date.now();
  const db = mongoose.connection.db;
  let result;
  
  if (queryConfig.operation === 'find') {
    result = await db.collection(queryConfig.collection)
      .find(queryConfig.query, queryConfig.options || {})
      .toArray();
  } else if (queryConfig.operation === 'aggregate') {
    result = await db.collection(queryConfig.collection)
      .aggregate(queryConfig.pipeline, queryConfig.options || {})
      .toArray();
  } else if (queryConfig.operation === 'findOne') {
    result = await db.collection(queryConfig.collection)
      .findOne(queryConfig.query, queryConfig.options || {});
  } else if (queryConfig.operation === 'count') {
    result = await db.collection(queryConfig.collection)
      .countDocuments(queryConfig.query);
  } else {
    throw new Error(`Unknown operation: ${queryConfig.operation}`);
  }
  
  const duration = Date.now() - startTime;
  const resultCount = Array.isArray(result) ? result.length : 1;
  
  return {
    duration,
    resultCount
  };
}

/**
 * Generate a summary of database performance test results
 */
function generateSummary(results, serverStatus, collectionStats) {
  // Filter out failed tests
  const successfulResults = results.filter(r => r.success);
  
  if (successfulResults.length === 0) {
    return {
      avgQueryTime: 0,
      maxQueryTime: 0,
      minQueryTime: 0,
      slowestQuery: '',
      slowestQueryTime: 0,
      totalQueries: 0
    };
  }
  
  // Calculate aggregate metrics
  const avgQueryTime = successfulResults.reduce((sum, r) => sum + r.avgDuration, 0) / successfulResults.length;
  const maxQueryTime = Math.max(...successfulResults.map(r => r.avgDuration));
  const minQueryTime = Math.min(...successfulResults.map(r => r.avgDuration));
  
  // Find slowest query
  const slowestQuery = successfulResults.reduce((prev, current) => 
    prev.avgDuration > current.avgDuration ? prev : current
  );
  
  // Server metrics if available
  const serverMetrics = serverStatus ? {
    uptime: serverStatus.uptime,
    connections: serverStatus.connections.current,
    opcounters: serverStatus.opcounters,
    memoryUsage: serverStatus.mem.resident // MB
  } : null;
  
  // Collection sizes if available
  const collectionSizes = {};
  if (collectionStats) {
    Object.keys(collectionStats).forEach(coll => {
      if (collectionStats[coll]) {
        collectionSizes[coll] = {
          count: collectionStats[coll].count,
          size: collectionStats[coll].size / (1024 * 1024), // MB
          avgObjSize: collectionStats[coll].avgObjSize / 1024 // KB
        };
      }
    });
  }
  
  return {
    avgQueryTime,
    maxQueryTime,
    minQueryTime,
    slowestQuery: slowestQuery.query,
    slowestQueryTime: slowestQuery.avgDuration,
    totalQueries: successfulResults.length,
    serverMetrics,
    collectionSizes,
    // Identify slow operations by type
    operationTimes: successfulResults.reduce((acc, result) => {
      const operation = result.operation;
      if (!acc[operation]) {
        acc[operation] = {
          count: 0,
          totalTime: 0,
          avgTime: 0
        };
      }
      
      acc[operation].count++;
      acc[operation].totalTime += result.avgDuration;
      acc[operation].avgTime = acc[operation].totalTime / acc[operation].count;
      
      return acc;
    }, {})
  };
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(results, summary, serverStatus, collectionStats) {
  const recommendations = [];
  
  // Check for slow queries
  if (summary.maxQueryTime > 500) {
    recommendations.push(`Query '${summary.slowestQuery}' is very slow (${summary.slowestQueryTime.toFixed(2)}ms). Consider adding an index or optimizing the query.`);
  }
  
  // Check for slow aggregations
  if (summary.operationTimes.aggregate && summary.operationTimes.aggregate.avgTime > 300) {
    recommendations.push(`Aggregation operations are slow (avg: ${summary.operationTimes.aggregate.avgTime.toFixed(2)}ms). Review pipeline stages and consider adding indexes for $match and $sort stages.`);
  }
  
  // Collection-specific recommendations
  if (summary.collectionSizes) {
    Object.keys(summary.collectionSizes).forEach(coll => {
      const stats = summary.collectionSizes[coll];
      
      // Large average object size
      if (stats.avgObjSize > 50) { // 50KB
        recommendations.push(`Collection '${coll}' has large average document size (${stats.avgObjSize.toFixed(2)}KB). Consider denormalizing less or using references.`);
      }
      
      // Large collection
      if (stats.size > 1000) { // 1GB
        recommendations.push(`Collection '${coll}' is large (${stats.size.toFixed(2)}MB). Ensure proper indexing and consider sharding for better performance.`);
      }
    });
  }
  
  // Server-specific recommendations
  if (summary.serverMetrics) {
    // High memory usage
    if (summary.serverMetrics.memoryUsage > 2000) { // 2GB
      recommendations.push(`MongoDB memory usage is high (${summary.serverMetrics.memoryUsage}MB). Consider increasing server resources or optimizing query patterns.`);
    }
  }
  
  return recommendations;
}

module.exports = {
  run
}; 