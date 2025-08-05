#!/usr/bin/env node

/**
 * Run Tests with Generated Data
 * 
 * This script runs tests with generated test data, making it easy to set up a
 * consistent test environment with realistic data.
 * 
 * Usage:
 *   node run-tests-with-data.js [options]
 * 
 * Options:
 *   --seed=STRING      Seed for reproducible data generation (default: random)
 *   --testPattern=GLOB Test files to run (default: all tests)
 *   --clean            Clean up test database after tests (default: false)
 *   --help             Show this help message
 */

const { spawn } = require('child_process');
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
Run Tests with Generated Data

This script runs tests with generated test data, making it easy to set up a
consistent test environment with realistic data.

Usage:
  node run-tests-with-data.js [options]

Options:
  --seed=STRING      Seed for reproducible data generation (default: random)
  --testPattern=GLOB Test files to run (default: all tests)
  --clean            Clean up test database after tests (default: false)
  --mongo-uri=URI    MongoDB URI for test database (default: mongodb://localhost:27017/aerosuite-test)
  --help             Show this help message

Examples:
  # Run all tests with random data
  node run-tests-with-data.js
  
  # Run specific tests with consistent data
  node run-tests-with-data.js --seed=test-seed-123 --testPattern="**/*.test.js"
  
  # Run tests and clean up the database afterward
  node run-tests-with-data.js --clean
`;

  console.log(helpText);
  process.exit(0);
}

// Set default options
const options = {
  seed: args.seed || `test-seed-${Date.now()}`,
  testPattern: args.testPattern || '',
  clean: !!args.clean,
  mongoUri: args['mongo-uri'] || 'mongodb://localhost:27017/aerosuite-test'
};

// Execute a command and capture output
const executeCommand = (command, args, env = {}) => {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    
    const childProcess = spawn(command, args, {
      stdio: 'inherit',
      env: { ...process.env, ...env }
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    childProcess.on('error', (error) => {
      reject(error);
    });
  });
};

// Clean up the test database
const cleanDatabase = async () => {
  console.log('Cleaning up test database...');
  
  let client;
  try {
    client = new MongoClient(options.mongoUri);
    await client.connect();
    
    const db = client.db();
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    
    // Drop each collection
    for (const collection of collections) {
      await db.collection(collection.name).drop();
      console.log(`Dropped collection: ${collection.name}`);
    }
    
    console.log('Test database cleanup complete.');
  } catch (error) {
    console.error(`Error cleaning database: ${error.message}`);
  } finally {
    if (client) await client.close();
  }
};

// Generate test data and store in database
const generateTestData = async () => {
  console.log(`Generating test data with seed: ${options.seed}`);
  
  const generator = new TestDataGenerator({ seed: options.seed });
  const dataset = generator.generateDataset();
  
  let client;
  try {
    client = new MongoClient(options.mongoUri);
    await client.connect();
    
    const db = client.db();
    
    // Clear existing data
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).drop();
    }
    
    // Insert data for each entity type
    for (const [entityType, data] of Object.entries(dataset)) {
      if (data.length > 0) {
        const result = await db.collection(entityType).insertMany(data);
        console.log(`Inserted ${result.insertedCount} ${entityType} into test database`);
      }
    }
    
    console.log('Test data generation complete.');
  } catch (error) {
    console.error(`Error generating test data: ${error.message}`);
    throw error;
  } finally {
    if (client) await client.close();
  }
};

// Main function
const main = async () => {
  try {
    // Generate and store test data
    await generateTestData();
    
    // Build the Jest command arguments
    const jestArgs = ['--detectOpenHandles'];
    
    if (options.testPattern) {
      jestArgs.push('--testPathPattern', options.testPattern);
    }
    
    // Run tests with the test database
    await executeCommand('npm', ['test', '--', ...jestArgs], {
      MONGODB_URI: options.mongoUri,
      TEST_SEED: options.seed
    });
    
    // Clean up if requested
    if (options.clean) {
      await cleanDatabase();
    }
    
    console.log('All tests completed successfully.');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Run the script
main(); 