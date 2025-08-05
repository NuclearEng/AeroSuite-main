#!/usr/bin/env node

/**
 * Test Data Generator CLI
 * 
 * This script provides a command-line interface for generating test data.
 * 
 * Usage:
 *   node generate-test-data.js [options]
 * 
 * Options:
 *   --entity=TYPE      Type of entities to generate (users, customers, suppliers, etc.)
 *   --count=NUMBER     Number of entities to generate (default varies by entity type)
 *   --output=PATH      Output file path (defaults to ./test-data/ENTITY_TYPE.json)
 *   --format=FORMAT    Output format (json, js, mongodb) (default: json)
 *   --seed=STRING      Seed for reproducible data generation
 *   --related          Include related entities in output (default: false)
 *   --all              Generate all entity types (ignores --entity and --count)
 *   --mongo-uri=URI    MongoDB URI for direct database import (when using --format=mongodb)
 *   --help             Show this help message
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const TestDataGenerator = require('../server/src/utils/testDataGenerator');

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value === undefined ? true : value;
  }
  return acc;
}, {});

// Show help if requested
if (args.help) {
  const helpText = `
Test Data Generator CLI

This script generates realistic test data for the AeroSuite application.

Usage:
  node generate-test-data.js [options]

Options:
  --entity=TYPE      Type of entities to generate (users, customers, suppliers, 
                    inspections, products, defects)
  --count=NUMBER     Number of entities to generate (default varies by entity type)
  --output=PATH      Output file path (defaults to ./test-data/ENTITY_TYPE.json)
  --format=FORMAT    Output format (json, js, mongodb) (default: json)
  --seed=STRING      Seed for reproducible data generation
  --related          Include related entities in output (default: false)
  --all              Generate all entity types (ignores --entity and --count)
  --mongo-uri=URI    MongoDB URI for direct database import (when using --format=mongodb)
  --help             Show this help message

Examples:
  # Generate 20 users
  node generate-test-data.js --entity=users --count=20
  
  # Generate all data with related entities
  node generate-test-data.js --all --related
  
  # Generate data with a specific seed for reproducibility
  node generate-test-data.js --all --seed=my-test-seed
  
  # Generate data and import directly to MongoDB
  node generate-test-data.js --all --format=mongodb --mongo-uri=mongodb://localhost:27017/aerosuite-test
`;

  console.log(helpText);
  process.exit(0);
}

// Validate arguments
const validateArgs = () => {
  // If --all is specified, other options are ignored
  if (args.all) {
    return true;
  }
  
  // If entity is specified, it must be valid
  if (args.entity) {
    const validEntities = ['users', 'customers', 'suppliers', 'inspections', 'products', 'defects'];
    if (!validEntities.includes(args.entity)) {
      console.error(`Error: Invalid entity type '${args.entity}'. Valid types are: ${validEntities.join(', ')}`);
      return false;
    }
  } else {
    console.error('Error: --entity parameter is required unless --all is specified');
    return false;
  }
  
  // If format is specified, it must be valid
  if (args.format) {
    const validFormats = ['json', 'js', 'mongodb'];
    if (!validFormats.includes(args.format)) {
      console.error(`Error: Invalid output format '${args.format}'. Valid formats are: ${validFormats.join(', ')}`);
      return false;
    }
    
    // If format is mongodb, mongo-uri is required
    if (args.format === 'mongodb' && !args['mongo-uri']) {
      console.error('Error: --mongo-uri parameter is required when using --format=mongodb');
      return false;
    }
  }
  
  return true;
};

// Ensure output directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Convert count parameter to number
const getCount = (defaultCount) => {
  if (!args.count) {
    return defaultCount;
  }
  
  const count = parseInt(args.count, 10);
  if (isNaN(count) || count <= 0) {
    console.error(`Error: Invalid count parameter '${args.count}'. Must be a positive integer.`);
    process.exit(1);
  }
  
  return count;
};

// Format data according to specified format
const formatData = (data, entityType) => {
  switch (args.format || 'json') {
    case 'json':
      return JSON.stringify(data, null, 2);
    
    case 'js':
      return `// Generated test data for ${entityType}\n// Generated on ${new Date().toISOString()}\n\nmodule.exports = ${JSON.stringify(data, null, 2)};`;
    
    case 'mongodb':
      // Return raw data for MongoDB import
      return data;
    
    default:
      return JSON.stringify(data, null, 2);
  }
};

// Write data to file
const writeDataToFile = (data, entityType) => {
  // Determine output path
  const outputDir = path.resolve(args.output || './test-data');
  ensureDirectoryExists(outputDir);
  
  const outputFormat = args.format || 'json';
  const extension = outputFormat === 'js' ? 'js' : 'json';
  const outputPath = path.join(outputDir, `${entityType}.${extension}`);
  
  // Write to file
  fs.writeFileSync(outputPath, data);
  console.log(`✅ Wrote ${entityType} data to ${outputPath}`);
};

// Import data to MongoDB
const importToMongoDB = async (data, entityType) => {
  const uri = args['mongo-uri'];
  if (!uri) {
    console.error('Error: MongoDB URI not provided for import');
    return;
  }
  
  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db();
    const collection = db.collection(entityType);
    
    // Clear existing data if this is a test database
    if (db.databaseName.includes('test')) {
      await collection.deleteMany({});
      console.log(`Cleared existing data from ${entityType} collection`);
    }
    
    // Insert data
    if (Array.isArray(data)) {
      if (data.length > 0) {
        const result = await collection.insertMany(data);
        console.log(`✅ Imported ${result.insertedCount} ${entityType} to MongoDB`);
      } else {
        console.log(`⚠️ No ${entityType} data to import`);
      }
    } else {
      const result = await collection.insertOne(data);
      console.log(`✅ Imported ${entityType} to MongoDB with ID ${result.insertedId}`);
    }
  } catch (error) {
    console.error(`Error importing to MongoDB: ${error.message}`);
  } finally {
    if (client) await client.close();
  }
};

// Generate and save data for a specific entity type
const generateEntityData = async (generator, entityType, count) => {
  console.log(`Generating ${count} ${entityType}...`);
  
  let data;
  if (args.related) {
    // For related data, we need to use the full dataset
    const dataset = generator.generateDataset({ [entityType]: count });
    data = dataset[entityType];
  } else {
    // For individual entities, use the generateMany method
    data = generator.generateMany(entityType, count);
  }
  
  if (args.format === 'mongodb') {
    await importToMongoDB(data, entityType);
  } else {
    const formattedData = formatData(data, entityType);
    writeDataToFile(formattedData, entityType);
  }
};

// Generate and save all entity types
const generateAllData = async (generator) => {
  console.log('Generating complete dataset...');
  
  const dataset = generator.generateDataset();
  
  if (args.format === 'mongodb') {
    // Import each entity type to MongoDB
    for (const [entityType, data] of Object.entries(dataset)) {
      await importToMongoDB(data, entityType);
    }
  } else {
    // Save each entity type to a separate file
    for (const [entityType, data] of Object.entries(dataset)) {
      const formattedData = formatData(data, entityType);
      writeDataToFile(formattedData, entityType);
    }
    
    // Also save the complete dataset to a single file
    const outputDir = path.resolve(args.output || './test-data');
    const extension = args.format === 'js' ? 'js' : 'json';
    const outputPath = path.join(outputDir, `complete-dataset.${extension}`);
    const formattedData = formatData(dataset, 'complete-dataset');
    
    fs.writeFileSync(outputPath, formattedData);
    console.log(`✅ Wrote complete dataset to ${outputPath}`);
  }
};

// Main function
const main = async () => {
  // Validate command line arguments
  if (!validateArgs()) {
    process.exit(1);
  }
  
  // Create test data generator
  const generator = new TestDataGenerator({ seed: args.seed });
  
  // Generate data
  if (args.all) {
    await generateAllData(generator);
  } else {
    const entityType = args.entity;
    const defaultCounts = generator.defaultCounts;
    const count = getCount(defaultCounts[entityType] || 10);
    
    await generateEntityData(generator, entityType, count);
  }
};

// Run the script
main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
}); 