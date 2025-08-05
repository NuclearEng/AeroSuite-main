/**
 * optimize-database-schema.js
 * 
 * Script to analyze and optimize the database schema
 * Implements RF029 - Review and optimize database schema
 */

const mongoose = require('mongoose');
const config = require('../config');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fs = require('fs').promises;
const path = require('path');
const logger = require('../infrastructure/logger');

// Load all models
const models = {
  Supplier: require('../models/supplier.model'),
  Customer: require('../models/customer.model'),
  Inspection: require('../models/inspection.model'),
  Component: require('../models/component.model')
  // Add other models as needed
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

async function analyzeCollectionStats(modelName) {
  try {
    logger.info(`Analyzing collection stats for ${modelName}...`);
    const stats = await mongoose.connection.db.collection(modelName.toLowerCase() + 's').stats();
    
    return {
      count: stats.count,
      size: stats.size,
      avgObjSize: stats.avgObjSize,
      storageSize: stats.storageSize,
      totalIndexSize: stats.totalIndexSize,
      nindexes: stats.nindexes
    };
  } catch (error) {
    logger.error(`Failed to analyze collection stats for ${modelName}:`, error);
    return null;
  }
}

async function analyzeIndexUsage(modelName) {
  try {
    logger.info(`Analyzing index usage for ${modelName}...`);
    const indexStats = await mongoose.connection.db.collection(modelName.toLowerCase() + 's')
      .aggregate([{ $indexStats: {} }]).toArray();
    
    return indexStats.map(stat => ({
      name: stat.name,
      accesses: stat.accesses.ops,
      since: stat.accesses.since
    }));
  } catch (error) {
    logger.error(`Failed to analyze index usage for ${modelName}:`, error);
    return [];
  }
}

async function analyzeQueryPerformance(modelName) {
  try {
    logger.info(`Analyzing query performance for ${modelName}...`);
    
    // Enable profiling for slow queries
    await mongoose.connection.db.command({ profile: 1, slowms: 100 });
    
    // Run some common queries based on the model
    const Model = mongoose.model(modelName);
    
    if (modelName === 'Supplier') {
      await Model.find({ status: 'active' }).limit(10);
      await Model.find().sort({ overallRating: -1 }).limit(10);
      await Model.find({ 'address.country': 'USA' }).limit(10);
    } else if (modelName === 'Customer') {
      await Model.find({ status: 'active' }).limit(10);
      await Model.find({ serviceLevel: 'premium' }).limit(10);
    } else if (modelName === 'Inspection') {
      await Model.find({ status: 'completed' }).limit(10);
      await Model.find({ result: 'pass' }).limit(10);
      await Model.find().sort({ scheduledDate: -1 }).limit(10);
    } else if (modelName === 'Component') {
      await Model.find({ status: 'active' }).limit(10);
      await Model.find({ customerId: mongoose.Types.ObjectId('000000000000000000000000') }).limit(10);
    }
    
    // Get profiling results
    const profileData = await mongoose.connection.db.command({ profile: -1 });
    const slowQueries = await mongoose.connection.db.collection('system.profile')
      .find({ ns: `${config.database.name}.${modelName.toLowerCase()}s` })
      .toArray();
    
    // Disable profiling
    await mongoose.connection.db.command({ profile: 0 });
    
    return slowQueries.map(query => ({
      query: JSON.stringify(query.query),
      millis: query.millis,
      nreturned: query.nreturned,
      keysExamined: query.keysExamined,
      docsExamined: query.docsExamined,
      planSummary: query.planSummary
    }));
  } catch (error) {
    logger.error(`Failed to analyze query performance for ${modelName}:`, error);
    return [];
  }
}

async function optimizeIndexes(modelName) {
  try {
    logger.info(`Optimizing indexes for ${modelName}...`);
    
    // Get current indexes
    const indexes = await mongoose.connection.db.collection(modelName.toLowerCase() + 's').indexes();
    logger.info(`Current indexes for ${modelName}:`, indexes);
    
    // Get index usage statistics
    const indexUsage = await analyzeIndexUsage(modelName);
    logger.info(`Index usage for ${modelName}:`, indexUsage);
    
    // Identify unused indexes (no accesses)
    const unusedIndexes = indexUsage.filter(index => index.accesses === 0 && index.name !== '_id_');
    
    if (unusedIndexes.length > 0) {
      logger.info(`Found ${unusedIndexes.length} unused indexes for ${modelName}`);
      
      // Log unused indexes but don't drop them automatically
      // This is a safety measure to avoid dropping indexes that might be needed
      for (const index of unusedIndexes) {
        logger.warn(`Unused index found: ${index.name} on ${modelName}`);
      }
    } else {
      logger.info(`No unused indexes found for ${modelName}`);
    }
    
    return {
      totalIndexes: indexes.length,
      unusedIndexes: unusedIndexes.length,
      unusedIndexNames: unusedIndexes.map(idx => idx.name)
    };
  } catch (error) {
    logger.error(`Failed to optimize indexes for ${modelName}:`, error);
    return null;
  }
}

async function analyzeArraySizes(modelName) {
  try {
    logger.info(`Analyzing array sizes for ${modelName}...`);
    
    const Model = mongoose.model(modelName);
    let arrayFields = [];
    
    // Identify array fields based on the model
    if (modelName === 'Supplier') {
      arrayFields = ['certifications', 'tags'];
    } else if (modelName === 'Customer') {
      arrayFields = ['tags'];
    } else if (modelName === 'Inspection') {
      arrayFields = ['checklistItems', 'defects', 'attachments', 'tags'];
    } else if (modelName === 'Component') {
      arrayFields = ['specs', 'documents', 'images', 'criticalCharacteristics', 'tags'];
    }
    
    const results = {};
    
    for (const field of arrayFields) {
      // Use aggregation to get statistics about array sizes
      const stats = await Model.aggregate([
        { $project: { arraySize: { $size: `$${field}` } } },
        { $group: {
          _id: null,
          avgSize: { $avg: '$arraySize' },
          maxSize: { $max: '$arraySize' },
          minSize: { $min: '$arraySize' },
          count: { $sum: 1 }
        }}
      ]);
      
      if (stats.length > 0) {
        results[field] = {
          avgSize: stats[0].avgSize,
          maxSize: stats[0].maxSize,
          minSize: stats[0].minSize,
          count: stats[0].count
        };
        
        // Identify documents with large arrays
        if (stats[0].maxSize > 50) {
          const largeArrayDocs = await Model.find()
            .select(`_id ${field}`)
            .where(`${field}.${stats[0].maxSize - 1}`)
            .exists(true)
            .limit(5);
          
          results[field].largeArraySamples = largeArrayDocs.map(doc => doc._id);
        }
      }
    }
    
    return results;
  } catch (error) {
    logger.error(`Failed to analyze array sizes for ${modelName}:`, error);
    return {};
  }
}

async function generateReport(results) {
  try {
    logger.info('Generating optimization report...');
    
    const report = {
      timestamp: new Date(),
      databaseName: config.database.name,
      collections: results,
      recommendations: []
    };
    
    // Generate recommendations based on analysis results
    for (const [modelName, data] of Object.entries(results)) {
      // Index recommendations
      if (data.indexOptimization && data.indexOptimization.unusedIndexes > 0) {
        report.recommendations.push({
          collection: modelName,
          type: 'index',
          description: `Consider removing ${data.indexOptimization.unusedIndexes} unused indexes: ${data.indexOptimization.unusedIndexNames.join(', ')}`
        });
      }
      
      // Array size recommendations
      if (data.arraySizes) {
        for (const [field, stats] of Object.entries(data.arraySizes)) {
          if (stats.maxSize > 50) {
            report.recommendations.push({
              collection: modelName,
              type: 'array',
              description: `Large array detected in ${field} (max: ${stats.maxSize}, avg: ${stats.avgSize.toFixed(2)}). Consider adding size validation or pagination.`
            });
          }
        }
      }
      
      // Query performance recommendations
      if (data.queryPerformance && data.queryPerformance.length > 0) {
        const slowQueries = data.queryPerformance.filter(q => q.millis > 100);
        if (slowQueries.length > 0) {
          report.recommendations.push({
            collection: modelName,
            type: 'query',
            description: `${slowQueries.length} slow queries detected. Consider adding indexes for these query patterns.`
          });
        }
      }
    }
    
    // Write report to file
    const reportPath = path.join(__dirname, '../../reports/database-optimization-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    logger.info(`Optimization report generated at ${reportPath}`);
    return reportPath;
  } catch (error) {
    logger.error('Failed to generate optimization report:', error);
    return null;
  }
}

async function main() {
  try {
    await connectToDatabase();
    
    const results = {};
    
    // Analyze each model
    for (const [modelName, Model] of Object.entries(models)) {
      logger.info(`Analyzing ${modelName}...`);
      
      results[modelName] = {
        stats: await analyzeCollectionStats(modelName),
        indexOptimization: await optimizeIndexes(modelName),
        arraySizes: await analyzeArraySizes(modelName),
        queryPerformance: await analyzeQueryPerformance(modelName)
      };
    }
    
    // Generate optimization report
    const reportPath = await generateReport(results);
    
    logger.info('Database schema analysis and optimization completed');
    logger.info(`See the full report at ${reportPath}`);
  } catch (error) {
    logger.error('Error during database schema optimization:', error);
  } finally {
    await disconnectFromDatabase();
  }
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 