#!/usr/bin/env node

/**
 * Schema Change Detection and Migration Generator
 * 
 * This script analyzes the Mongoose models and detects changes compared to
 * the database schema, then generates migration templates to apply those changes.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { execSync } = require('child_process');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Import all models
require('../models');

// Configure logging
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, err) => console.error(`[ERROR] ${message}`, err || ''),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  warn: (message) => console.warn(`[WARNING] ${message}`)
};

/**
 * Detect schema changes between Mongoose models and database
 * @returns {Promise<Array>} List of detected changes
 */
async function detectSchemaChanges() {
  try {
    logger.info('Detecting schema changes...');
    
    const changes = [];
    const modelNames = mongoose.modelNames();
    
    for (const modelName of modelNames) {
      const Model = mongoose.model(modelName);
      const modelSchema = Model.schema;
      
      // Get collection info from database
      const db = mongoose.connection.db;
      const collections = await db.listCollections({ name: Model.collection.name }).toArray();
      
      if (collections.length === 0) {
        // Collection doesn't exist yet
        changes.push({
          type: 'newCollection',
          model: modelName,
          collection: Model.collection.name
        });
        continue;
      }
      
      // Get a sample document to analyze fields
      const sampleDocs = await Model.collection.find({}).limit(1).toArray();
      
      if (sampleDocs.length > 0) {
        const sampleDoc = sampleDocs[0];
        const docFields = Object.keys(sampleDoc).filter(key => key !== '_id');
        
        // Compare schema fields with document fields
        const schemaFields = Object.keys(modelSchema.paths).filter(path => path !== '_id' && path !== '__v');
        
        // Find fields in schema but not in document
        const missingFields = schemaFields.filter(field => !docFields.includes(field));
        
        if (missingFields.length > 0) {
          changes.push({
            type: 'missingFields',
            model: modelName,
            collection: Model.collection.name,
            fields: missingFields
          });
        }
        
        // Find fields in document but not in schema (deprecated fields)
        const deprecatedFields = docFields.filter(field => !schemaFields.includes(field));
        
        if (deprecatedFields.length > 0) {
          changes.push({
            type: 'deprecatedFields',
            model: modelName,
            collection: Model.collection.name,
            fields: deprecatedFields
          });
        }
      }
      
      // Check for index differences
      const schemaIndexes = [];
      
      // Extract indexes from schema
      Object.keys(modelSchema.paths).forEach(pathName => {
        const path = modelSchema.paths[pathName];
        if (path.options && path.options.index) {
          schemaIndexes.push({
            field: pathName,
            ...path.options
          });
        }
      });
      
      // Get indexes from database
      const dbIndexes = await Model.collection.indexes();
      
      // Compare indexes (simplified comparison)
      const dbIndexFields = dbIndexes
        .filter(idx => idx.name !== '_id_')
        .map(idx => Object.keys(idx.key)[0]);
        
      const schemaIndexFields = schemaIndexes.map(idx => idx.field);
      
      // Find indexes in schema but not in db
      const missingIndexes = schemaIndexFields.filter(field => !dbIndexFields.includes(field));
      
      if (missingIndexes.length > 0) {
        changes.push({
          type: 'missingIndexes',
          model: modelName,
          collection: Model.collection.name,
          fields: missingIndexes
        });
      }
    }
    
    return changes;
  } catch (error) {
    logger.error('Error detecting schema changes:', error);
    throw error;
  }
}

/**
 * Generate migration template based on detected changes
 * @param {Array} changes - Detected schema changes
 * @returns {string} Migration template content
 */
function generateMigrationTemplate(changes) {
  if (changes.length === 0) {
    return null;
  }
  
  let upCode = '';
  let downCode = '';
  
  // Process each change type
  changes.forEach(change => {
    switch (change.type) {
      case 'newCollection':
        // No action needed for new collections as they're created automatically
        upCode += `  // New collection '${change.collection}' will be created automatically\n`;
        downCode += `  // Optional: Drop the collection if needed\n`;
        downCode += `  // await db.dropCollection('${change.collection}');\n`;
        break;
        
      case 'missingFields':
        upCode += `  // Add missing fields to ${change.collection}\n`;
        upCode += `  await db.collection('${change.collection}').updateMany(\n`;
        upCode += `    {},\n`;
        upCode += `    { $set: {\n`;
        
        change.fields.forEach(field => {
          upCode += `      '${field}': null, // TODO: Set appropriate default value\n`;
        });
        
        upCode += `    }}\n`;
        upCode += `  );\n`;
        upCode += `  console.log('Added missing fields to ${change.collection}');\n\n`;
        
        downCode += `  // Remove fields added to ${change.collection}\n`;
        downCode += `  await db.collection('${change.collection}').updateMany(\n`;
        downCode += `    {},\n`;
        downCode += `    { $unset: {\n`;
        
        change.fields.forEach(field => {
          downCode += `      '${field}': "",\n`;
        });
        
        downCode += `    }}\n`;
        downCode += `  );\n`;
        downCode += `  console.log('Removed fields from ${change.collection}');\n\n`;
        break;
        
      case 'deprecatedFields':
        // For deprecated fields, we'll back them up before removing
        upCode += `  // Back up and remove deprecated fields from ${change.collection}\n`;
        upCode += `  const ${change.collection}Backup = [];\n`;
        upCode += `  const ${change.collection}Docs = await db.collection('${change.collection}').find({}).toArray();\n`;
        upCode += `  \n`;
        upCode += `  for (const doc of ${change.collection}Docs) {\n`;
        upCode += `    const backupData = {};\n`;
        
        change.fields.forEach(field => {
          upCode += `    if (doc['${field}'] !== undefined) backupData['${field}'] = doc['${field}'];\n`;
        });
        
        upCode += `    if (Object.keys(backupData).length > 0) {\n`;
        upCode += `      ${change.collection}Backup.push({ _id: doc._id, data: backupData });\n`;
        upCode += `    }\n`;
        upCode += `  }\n`;
        upCode += `  \n`;
        upCode += `  // Store backup data in a migration backup collection\n`;
        upCode += `  if (${change.collection}Backup.length > 0) {\n`;
        upCode += `    await db.collection('migration_backups').insertOne({\n`;
        upCode += `      migration: 'remove_deprecated_fields_${change.collection}',\n`;
        upCode += `      collection: '${change.collection}',\n`;
        upCode += `      timestamp: new Date(),\n`;
        upCode += `      data: ${change.collection}Backup\n`;
        upCode += `    });\n`;
        upCode += `  }\n`;
        upCode += `  \n`;
        upCode += `  // Remove deprecated fields\n`;
        upCode += `  await db.collection('${change.collection}').updateMany(\n`;
        upCode += `    {},\n`;
        upCode += `    { $unset: {\n`;
        
        change.fields.forEach(field => {
          upCode += `      '${field}': "",\n`;
        });
        
        upCode += `    }}\n`;
        upCode += `  );\n`;
        upCode += `  console.log('Removed deprecated fields from ${change.collection}');\n\n`;
        
        downCode += `  // Restore deprecated fields to ${change.collection}\n`;
        downCode += `  const backup = await db.collection('migration_backups').findOne({\n`;
        downCode += `    migration: 'remove_deprecated_fields_${change.collection}'\n`;
        downCode += `  });\n`;
        downCode += `  \n`;
        downCode += `  if (backup && backup.data) {\n`;
        downCode += `    for (const item of backup.data) {\n`;
        downCode += `      await db.collection('${change.collection}').updateOne(\n`;
        downCode += `        { _id: item._id },\n`;
        downCode += `        { $set: item.data }\n`;
        downCode += `      );\n`;
        downCode += `    }\n`;
        downCode += `    console.log('Restored deprecated fields to ${change.collection}');\n`;
        downCode += `  }\n\n`;
        break;
        
      case 'missingIndexes':
        upCode += `  // Create missing indexes for ${change.collection}\n`;
        
        change.fields.forEach(field => {
          upCode += `  await db.collection('${change.collection}').createIndex({ ${field}: 1 });\n`;
        });
        
        upCode += `  console.log('Created missing indexes for ${change.collection}');\n\n`;
        
        downCode += `  // Drop indexes created for ${change.collection}\n`;
        
        change.fields.forEach(field => {
          downCode += `  try {\n`;
          downCode += `    await db.collection('${change.collection}').dropIndex({ ${field}: 1 });\n`;
          downCode += `  } catch (error) {\n`;
          downCode += `    console.log('Index may not exist or already dropped');\n`;
          downCode += `  }\n`;
        });
        
        downCode += `  console.log('Dropped indexes for ${change.collection}');\n\n`;
        break;
    }
  });
  
  // Create migration template
  const migrationName = `schema_updates_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
  
  const template = `/**
 * Migration: ${migrationName}
 * Created at: ${new Date().toISOString()}
 * 
 * This migration was auto-generated based on schema changes detected between
 * Mongoose models and the database.
 */
module.exports = {
  /**
   * Run the migration
   * @param {Object} db - MongoDB client
   * @param {Object} client - MongoDB native client
   * @returns {Promise<void>}
   */
  async up(db, client) {
    console.log('Applying schema updates...');
    
${upCode}
  },

  /**
   * Reverse the migration
   * @param {Object} db - MongoDB client
   * @param {Object} client - MongoDB native client
   * @returns {Promise<void>}
   */
  async down(db, client) {
    console.log('Rolling back schema updates...');
    
${downCode}
  }
};`;

  return {
    name: migrationName,
    template
  };
}

/**
 * Create migration file
 * @param {Object} migration - Migration template data
 */
function createMigrationFile(migration) {
  try {
    if (!migration) {
      logger.info('No schema changes detected, no migration file created');
      return;
    }
    
    // Create a timestamp for the migration name
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const fileName = `${timestamp}_${migration.name}.js`;
    const filePath = path.join(__dirname, '../migrations/scripts', fileName);
    
    // Write migration file
    fs.writeFileSync(filePath, migration.template);
    logger.success(`Migration file created: ${filePath}`);
    
    return filePath;
  } catch (error) {
    logger.error('Error creating migration file:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    logger.success('Connected to database');
    
    // Detect schema changes
    const changes = await detectSchemaChanges();
    
    if (changes.length === 0) {
      logger.success('No schema changes detected');
    } else {
      logger.info(`Detected ${changes.length} schema changes`);
      
      // Generate migration template
      const migrationTemplate = generateMigrationTemplate(changes);
      
      // Create migration file
      const filePath = createMigrationFile(migrationTemplate);
      
      if (filePath) {
        logger.info('You should review the generated migration before applying it');
        logger.info(`Edit the file: ${filePath}`);
      }
    }
    
    // Close database connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
    
    process.exit(0);
  } catch (error) {
    logger.error('Unexpected error:', error);
    
    // Close database connection if open
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      logger.info('Database connection closed');
    }
    
    process.exit(1);
  }
}

// Run the main function
main(); 