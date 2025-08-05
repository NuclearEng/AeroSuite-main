/**
 * optimize-queries.js
 * 
 * Script to analyze and optimize database queries
 * Implements RF031 - Implement query optimization
 */

const mongoose = require('mongoose');
const config = require('../config');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../infrastructure/logger');

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

async function connectToDatabase() {
  try {
    logger.info('Connecting to database...');
    await mongoose.connect(config.database.url, config.database.options);
    logger.info('Connected to database');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

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
 * Analyze slow queries from the system.profile collection
 * @returns {Promise<Array>} Array of slow queries with analysis
 */
async function analyzeSlowQueries() {
  try {
    logger.info('Analyzing slow queries...');
    
    // Enable profiling if not already enabled
    await mongoose.connection.db.command({ profile: 1, slowms: 100 });
    
    // Get slow queries from system.profile
    const slowQueries = await mongoose.connection.db
      .collection('system.profile')
      .find({ millis: { $gt: 100 }, ns: { $not: /system\.profile/ } })
      .sort({ millis: -1 })
      .limit(100)
      .toArray();
    
    logger.info(`Found ${slowQueries.length} slow queries`);
    
    // Analyze each slow query
    const analyzedQueries = [];
    
    for (const query of slowQueries) {
      const analysis = {
        collection: query.ns.split('.')[1],
        operation: query.op,
        query: query.query || query.command,
        executionTimeMs: query.millis,
        timestamp: query.ts,
        indexesUsed: query.indexesUsed || [],
        nreturned: query.nreturned || 0,
        responseLength: query.responseLength || 0,
        optimizationSuggestions: []
      };
      
      // Check if any index was used
      if (!analysis.indexesUsed.length) {
        analysis.optimizationSuggestions.push({
          type: 'missing_index',
          description: 'Query is not using any index',
          suggestedIndex: getSuggestedIndex(analysis.collection, analysis.query)
        });
      }
      
      // Check if query is returning too many documents
      if (analysis.nreturned > 1000) {
        analysis.optimizationSuggestions.push({
          type: 'large_result_set',
          description: `Query is returning ${analysis.nreturned} documents`,
          suggestion: 'Add pagination or limit the result set'
        });
      }
      
      // Check if query is using projection
      if (query.planSummary && !query.planSummary.includes('PROJECTION')) {
        analysis.optimizationSuggestions.push({
          type: 'missing_projection',
          description: 'Query is not using projection',
          suggestion: 'Use projection to return only needed fields'
        });
      }
      
      analyzedQueries.push(analysis);
    }
    
    return analyzedQueries;
  } catch (error) {
    logger.error('Failed to analyze slow queries:', error);
    return [];
  }
}

/**
 * Get suggested index for a query
 * @param {string} collection - Collection name
 * @param {Object} query - Query object
 * @returns {Object} Suggested index
 */
function getSuggestedIndex(collection, query) {
  // Extract fields from query
  const fields = extractQueryFields(query);
  
  // Create index fields object
  const indexFields = {};
  fields.forEach(field => {
    indexFields[field] = 1;
  });
  
  return {
    fields: indexFields,
    options: { background: true }
  };
}

/**
 * Extract fields from a query object
 * @param {Object} query - Query object
 * @returns {Array<string>} Array of field names
 */
function extractQueryFields(query) {
  const fields = [];
  
  if (!query || typeof query !== 'object') {
    return fields;
  }
  
  // Extract fields from query object
  for (const [key, value] of Object.entries(query)) {
    // Skip special operators
    if (key.startsWith('$')) {
      if (key === '$and' || key === '$or') {
        // Handle logical operators
        if (Array.isArray(value)) {
          value.forEach(subQuery => {
            fields.push(...extractQueryFields(subQuery));
          });
        }
      }
      continue;
    }
    
    // Add field to list
    if (!key.includes('$')) {
      fields.push(key);
    }
    
    // Check if value is an object with operators
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Skip if it's a nested query
      if (!Object.keys(value).some(k => k.startsWith('$'))) {
        // Extract fields from nested object
        Object.keys(value).forEach(nestedKey => {
          fields.push(`${key}.${nestedKey}`);
        });
      }
    }
  }
  
  return [...new Set(fields)]; // Remove duplicates
}

/**
 * Analyze index usage for collections
 * @returns {Promise<Object>} Index usage statistics
 */
async function analyzeIndexUsage() {
  try {
    logger.info('Analyzing index usage...');
    
    const indexUsage = {};
    
    // Get index usage statistics for each collection
    for (const [modelName, Model] of Object.entries(models)) {
      try {
        const collectionName = Model.collection.name;
        logger.info(`Analyzing index usage for ${collectionName}...`);
        
        const stats = await mongoose.connection.db
          .collection(collectionName)
          .aggregate([{ $indexStats: {} }])
          .toArray();
        
        indexUsage[collectionName] = stats.map(stat => ({
          name: stat.name,
          accesses: stat.accesses,
          operations: stat.ops,
          since: stat.since
        }));
        
        logger.info(`Found ${stats.length} indexes for ${collectionName}`);
      } catch (error) {
        logger.error(`Failed to analyze index usage for ${modelName}:`, error);
      }
    }
    
    return indexUsage;
  } catch (error) {
    logger.error('Failed to analyze index usage:', error);
    return {};
  }
}

/**
 * Generate query optimization recommendations
 * @param {Array} slowQueries - Analyzed slow queries
 * @param {Object} indexUsage - Index usage statistics
 * @returns {Object} Optimization recommendations
 */
function generateOptimizationRecommendations(slowQueries, indexUsage) {
  const recommendations = {
    slowQueries: slowQueries,
    indexUsage: indexUsage,
    unusedIndexes: [],
    recommendedIndexes: [],
    queryOptimizations: []
  };
  
  // Find unused indexes
  for (const [collection, indexes] of Object.entries(indexUsage)) {
    indexes.forEach(index => {
      if (index.accesses.ops === 0 && index.name !== '_id_') {
        recommendations.unusedIndexes.push({
          collection,
          indexName: index.name,
          since: index.since
        });
      }
    });
  }
  
  // Generate recommended indexes
  const suggestedIndexes = new Map();
  
  slowQueries.forEach(query => {
    query.optimizationSuggestions.forEach(suggestion => {
      if (suggestion.type === 'missing_index' && suggestion.suggestedIndex) {
        const collection = query.collection;
        const indexKey = JSON.stringify(suggestion.suggestedIndex.fields);
        
        if (!suggestedIndexes.has(`${collection}:${indexKey}`)) {
          suggestedIndexes.set(`${collection}:${indexKey}`, {
            collection,
            fields: suggestion.suggestedIndex.fields,
            options: suggestion.suggestedIndex.options,
            queryCount: 1,
            totalTime: query.executionTimeMs
          });
        } else {
          const existing = suggestedIndexes.get(`${collection}:${indexKey}`);
          existing.queryCount++;
          existing.totalTime += query.executionTimeMs;
        }
      }
    });
    
    // Add query optimization suggestions
    if (query.optimizationSuggestions.length > 0) {
      recommendations.queryOptimizations.push({
        collection: query.collection,
        operation: query.operation,
        query: query.query,
        executionTimeMs: query.executionTimeMs,
        suggestions: query.optimizationSuggestions
      });
    }
  });
  
  // Sort suggested indexes by query count and total time
  recommendations.recommendedIndexes = Array.from(suggestedIndexes.values())
    .sort((a, b) => b.queryCount - a.queryCount || b.totalTime - a.totalTime);
  
  return recommendations;
}

/**
 * Generate optimization report
 * @param {Object} recommendations - Optimization recommendations
 * @returns {Promise<string>} Path to the generated report
 */
async function generateReport(recommendations) {
  try {
    logger.info('Generating query optimization report...');
    
    const report = {
      timestamp: new Date(),
      databaseName: config.database.name,
      recommendations: recommendations,
      summary: {
        slowQueriesCount: recommendations.slowQueries.length,
        unusedIndexesCount: recommendations.unusedIndexes.length,
        recommendedIndexesCount: recommendations.recommendedIndexes.length,
        queryOptimizationsCount: recommendations.queryOptimizations.length
      }
    };
    
    // Write report to file
    const reportPath = path.join(__dirname, '../../reports/query-optimization-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    const htmlReport = generateHtmlReport(report);
    const htmlReportPath = path.join(__dirname, '../../reports/query-optimization-report.html');
    await fs.writeFile(htmlReportPath, htmlReport);
    
    logger.info(`Query optimization report generated at ${reportPath}`);
    logger.info(`HTML report generated at ${htmlReportPath}`);
    
    return reportPath;
  } catch (error) {
    logger.error('Failed to generate query optimization report:', error);
    return null;
  }
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
  <title>Query Optimization Report</title>
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
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 12px;
      font-weight: bold;
      color: white;
    }
    .badge-warning {
      background-color: #ff9800;
    }
    .badge-danger {
      background-color: #f44336;
    }
    .badge-info {
      background-color: #2196F3;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Query Optimization Report</h1>
    <p>Database: ${report.databaseName}</p>
    <p>Generated on: ${report.timestamp}</p>
    
    <div class="summary">
      <div class="summary-item">
        <h3>Slow Queries</h3>
        <div class="summary-value">${report.summary.slowQueriesCount}</div>
      </div>
      <div class="summary-item">
        <h3>Unused Indexes</h3>
        <div class="summary-value">${report.summary.unusedIndexesCount}</div>
      </div>
      <div class="summary-item">
        <h3>Recommended Indexes</h3>
        <div class="summary-value">${report.summary.recommendedIndexesCount}</div>
      </div>
      <div class="summary-item">
        <h3>Query Optimizations</h3>
        <div class="summary-value">${report.summary.queryOptimizationsCount}</div>
      </div>
    </div>
    
    <div class="card">
      <h2>Recommended Indexes</h2>
      <table>
        <thead>
          <tr>
            <th>Collection</th>
            <th>Fields</th>
            <th>Query Count</th>
            <th>Total Time (ms)</th>
          </tr>
        </thead>
        <tbody>
          ${report.recommendations.recommendedIndexes.map(index => `
            <tr>
              <td>${index.collection}</td>
              <td><pre>${JSON.stringify(index.fields, null, 2)}</pre></td>
              <td>${index.queryCount}</td>
              <td>${index.totalTime}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="card">
      <h2>Unused Indexes</h2>
      <table>
        <thead>
          <tr>
            <th>Collection</th>
            <th>Index Name</th>
            <th>Since</th>
          </tr>
        </thead>
        <tbody>
          ${report.recommendations.unusedIndexes.map(index => `
            <tr>
              <td>${index.collection}</td>
              <td>${index.indexName}</td>
              <td>${index.since}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    <div class="card">
      <h2>Query Optimizations</h2>
      <table>
        <thead>
          <tr>
            <th>Collection</th>
            <th>Operation</th>
            <th>Execution Time (ms)</th>
            <th>Suggestions</th>
          </tr>
        </thead>
        <tbody>
          ${report.recommendations.queryOptimizations.map(opt => `
            <tr>
              <td>${opt.collection}</td>
              <td>${opt.operation}</td>
              <td>${opt.executionTimeMs}</td>
              <td>
                <ul>
                  ${opt.suggestions.map(suggestion => `
                    <li>
                      <span class="badge ${getBadgeClass(suggestion.type)}">${suggestion.type}</span>
                      ${suggestion.description}
                      ${suggestion.suggestion ? `<br>Suggestion: ${suggestion.suggestion}` : ''}
                      ${suggestion.suggestedIndex ? `<br>Suggested Index: <pre>${JSON.stringify(suggestion.suggestedIndex, null, 2)}</pre>` : ''}
                    </li>
                  `).join('')}
                </ul>
              </td>
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
            <th>Execution Time (ms)</th>
            <th>Query</th>
          </tr>
        </thead>
        <tbody>
          ${report.recommendations.slowQueries.map(query => `
            <tr>
              <td>${query.collection}</td>
              <td>${query.operation}</td>
              <td>${query.executionTimeMs}</td>
              <td><pre>${JSON.stringify(query.query, null, 2)}</pre></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
  
  <script>
    function getBadgeClass(type) {
      switch (type) {
        case 'missing_index':
          return 'badge-danger';
        case 'large_result_set':
          return 'badge-warning';
        default:
          return 'badge-info';
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Get badge class for suggestion type
 * @param {string} type - Suggestion type
 * @returns {string} Badge class
 */
function getBadgeClass(type) {
  switch (type) {
    case 'missing_index':
      return 'badge-danger';
    case 'large_result_set':
      return 'badge-warning';
    default:
      return 'badge-info';
  }
}

async function main() {
  try {
    await connectToDatabase();
    
    // Analyze slow queries
    const slowQueries = await analyzeSlowQueries();
    
    // Analyze index usage
    const indexUsage = await analyzeIndexUsage();
    
    // Generate optimization recommendations
    const recommendations = generateOptimizationRecommendations(slowQueries, indexUsage);
    
    // Generate report
    const reportPath = await generateReport(recommendations);
    
    logger.info('Query optimization analysis completed');
    logger.info(`See the full report at ${reportPath}`);
    
  } catch (error) {
    logger.error('Error during query optimization:', error);
  } finally {
    await disconnectFromDatabase();
  }
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 