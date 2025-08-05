/**
 * add-missing-indexes.js
 * 
 * Script to add missing indexes to all collections
 * Implements RF030 - Add missing database indexes
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

async function getExistingIndexes(collectionName) {
  try {
    const indexes = await mongoose.connection.db.collection(collectionName).indexes();
    return indexes.map(index => {
      return {
        name: index.name,
        key: index.key,
        unique: !!index.unique,
        sparse: !!index.sparse,
        background: !!index.background,
        expireAfterSeconds: index.expireAfterSeconds
      };
    });
  } catch (error) {
    logger.error(`Failed to get existing indexes for ${collectionName}:`, error);
    return [];
  }
}

async function addIndexesToCollection(modelName) {
  try {
    const Model = mongoose.model(modelName);
    const collectionName = Model.collection.name;
    
    logger.info(`Adding indexes to collection ${collectionName}...`);
    
    // Get existing indexes
    const existingIndexes = await getExistingIndexes(collectionName);
    logger.info(`Found ${existingIndexes.length} existing indexes in ${collectionName}`);
    
    // Define indexes to add based on the model
    const indexesToAdd = getIndexDefinitionsForModel(modelName);
    
    // Add each index if it doesn't already exist
    const addedIndexes = [];
    const skippedIndexes = [];
    
    for (const indexDef of indexesToAdd) {
      // Check if index already exists
      const indexExists = existingIndexes.some(existingIndex => {
        // Compare index keys
        const indexKeys = Object.keys(indexDef.fields);
        const existingKeys = Object.keys(existingIndex.key);
        
        if (indexKeys.length !== existingKeys.length) {
          return false;
        }
        
        // Check if all keys match
        return indexKeys.every(key => {
          return existingIndex.key[key] === indexDef.fields[key];
        });
      });
      
      if (indexExists) {
        skippedIndexes.push(indexDef);
        logger.info(`Index ${JSON.stringify(indexDef.fields)} already exists in ${collectionName}`);
        continue;
      }
      
      // Add the index
      try {
        await mongoose.connection.db.collection(collectionName).createIndex(
          indexDef.fields,
          indexDef.options
        );
        
        addedIndexes.push(indexDef);
        logger.info(`Added index ${JSON.stringify(indexDef.fields)} to ${collectionName}`);
      } catch (error) {
        logger.error(`Failed to add index ${JSON.stringify(indexDef.fields)} to ${collectionName}:`, error);
      }
    }
    
    return {
      added: addedIndexes,
      skipped: skippedIndexes
    };
  } catch (error) {
    logger.error(`Failed to add indexes to collection ${modelName}:`, error);
    return {
      added: [],
      skipped: []
    };
  }
}

function getIndexDefinitionsForModel(modelName) {
  // Define indexes for each model
  switch (modelName) {
    case 'User':
      return [
        { 
          fields: { email: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { role: 1, isActive: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { customerId: 1, role: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { lastLogin: -1 }, 
          options: { background: true } 
        },
        { 
          fields: { createdAt: -1 }, 
          options: { background: true } 
        },
        {
          fields: { 'permissions.role': 1 },
          options: { background: true }
        }
      ];
      
    case 'Customer':
      return [
        { 
          fields: { name: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { code: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { industry: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { serviceLevel: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { 'billingAddress.country': 1 }, 
          options: { background: true } 
        },
        { 
          fields: { createdAt: -1 }, 
          options: { background: true } 
        },
        {
          fields: { name: 'text', description: 'text' },
          options: { 
            weights: { name: 10, description: 5 },
            background: true 
          }
        }
      ];
      
    case 'Supplier':
      return [
        { 
          fields: { name: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { code: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { type: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { 'address.country': 1 }, 
          options: { background: true } 
        },
        { 
          fields: { overallRating: -1 }, 
          options: { background: true } 
        },
        { 
          fields: { createdAt: -1 }, 
          options: { background: true } 
        },
        {
          fields: { name: 'text', description: 'text', tags: 'text' },
          options: { 
            weights: { name: 10, description: 5, tags: 3 },
            background: true 
          }
        }
      ];
      
    case 'Inspection':
      return [
        { 
          fields: { inspectionNumber: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { customerId: 1, status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { supplierId: 1, status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { componentId: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { scheduledDate: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { startDate: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { completionDate: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { result: 1, status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { inspectionType: 1, status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { customerId: 1, supplierId: 1, status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { createdAt: -1 }, 
          options: { background: true } 
        },
        {
          fields: { inspectionNumber: 'text', title: 'text', description: 'text', tags: 'text' },
          options: { 
            weights: { inspectionNumber: 10, title: 8, description: 5, tags: 3 },
            background: true 
          }
        }
      ];
      
    case 'Component':
      return [
        { 
          fields: { partNumber: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { partNumber: 1, revision: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { customerId: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { supplierId: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { customerId: 1, supplierId: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { 'materialInfo.material': 1 }, 
          options: { background: true } 
        },
        { 
          fields: { createdAt: -1 }, 
          options: { background: true } 
        },
        {
          fields: { name: 'text', partNumber: 'text', description: 'text', tags: 'text' },
          options: { 
            weights: { partNumber: 10, name: 8, description: 3, tags: 2 },
            background: true 
          }
        }
      ];
      
    case 'RiskAssessment':
      return [
        { 
          fields: { supplierId: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { assessmentDate: -1 }, 
          options: { background: true } 
        },
        { 
          fields: { overallScore: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { riskLevel: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { nextReviewDate: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { createdAt: -1 }, 
          options: { background: true } 
        }
      ];
      
    case 'QualityManagement':
      return [
        { 
          fields: { supplierId: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { 'nonConformances.status': 1 }, 
          options: { background: true } 
        },
        { 
          fields: { 'nonConformances.severity': 1 }, 
          options: { background: true } 
        },
        { 
          fields: { 'nonConformances.reportedDate': -1 }, 
          options: { background: true } 
        },
        { 
          fields: { 'qualityProcesses.status': 1 }, 
          options: { background: true } 
        },
        { 
          fields: { 'riskAssessment.overallRiskLevel': 1 }, 
          options: { background: true } 
        }
      ];
      
    case 'SecurityIncident':
      return [
        { 
          fields: { incidentId: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { severity: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { type: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { timestamp: -1 }, 
          options: { background: true } 
        },
        { 
          fields: { sourceAlertId: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { assignedTo: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { timestamp: 1, severity: 1 }, 
          options: { background: true } 
        },
        {
          fields: { name: 'text', description: 'text', tags: 'text' },
          options: { 
            weights: { name: 10, description: 5, tags: 3 },
            background: true 
          }
        }
      ];
      
    case 'Document':
      return [
        { 
          fields: { documentId: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { category: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { status: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { type: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { tags: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { createdAt: -1 }, 
          options: { background: true } 
        },
        {
          fields: { title: 'text', originalFilename: 'text', description: 'text', tags: 'text' },
          options: { 
            weights: { title: 10, originalFilename: 8, description: 5, tags: 3 },
            background: true 
          }
        }
      ];
      
    case 'CalendarEvent':
      return [
        { 
          fields: { start: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { end: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { type: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { userId: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { createdBy: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { userId: 1, start: 1 }, 
          options: { background: true } 
        },
        {
          fields: { title: 'text', description: 'text', location: 'text' },
          options: { 
            weights: { title: 10, description: 5, location: 3 },
            background: true 
          }
        }
      ];
      
    case 'CalendarIntegration':
      return [
        { 
          fields: { userId: 1, type: 1 }, 
          options: { unique: true, background: true } 
        },
        { 
          fields: { type: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { userId: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { isConnected: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { expiresAt: 1 }, 
          options: { background: true } 
        },
        { 
          fields: { lastSync: 1 }, 
          options: { background: true } 
        }
      ];
      
    default:
      return [];
  }
}

async function generateReport(results) {
  try {
    logger.info('Generating index addition report...');
    
    const report = {
      timestamp: new Date(),
      databaseName: config.database.name,
      collections: results,
      summary: {
        totalAdded: 0,
        totalSkipped: 0,
        collectionCount: Object.keys(results).length
      }
    };
    
    // Calculate summary
    for (const collectionResult of Object.values(results)) {
      report.summary.totalAdded += collectionResult.added.length;
      report.summary.totalSkipped += collectionResult.skipped.length;
    }
    
    // Write report to file
    const reportPath = path.join(__dirname, '../../reports/index-addition-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    logger.info(`Index addition report generated at ${reportPath}`);
    return reportPath;
  } catch (error) {
    logger.error('Failed to generate index addition report:', error);
    return null;
  }
}

async function main() {
  try {
    await connectToDatabase();
    
    const results = {};
    
    // Add indexes to each model
    for (const [modelName, Model] of Object.entries(models)) {
      logger.info(`Processing ${modelName}...`);
      
      try {
        results[modelName] = await addIndexesToCollection(modelName);
      } catch (error) {
        logger.error(`Error adding indexes to ${modelName}:`, error);
        results[modelName] = { added: [], skipped: [] };
      }
    }
    
    // Generate report
    const reportPath = await generateReport(results);
    
    logger.info('Index addition completed');
    logger.info(`See the full report at ${reportPath}`);
    
    // Summary
    let totalAdded = 0;
    let totalSkipped = 0;
    
    for (const [modelName, result] of Object.entries(results)) {
      totalAdded += result.added.length;
      totalSkipped += result.skipped.length;
      logger.info(`${modelName}: Added ${result.added.length} indexes, skipped ${result.skipped.length} existing indexes`);
    }
    
    logger.info(`Total: Added ${totalAdded} indexes, skipped ${totalSkipped} existing indexes`);
    
  } catch (error) {
    logger.error('Error during index addition:', error);
  } finally {
    await disconnectFromDatabase();
  }
}

// Run the script if executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 