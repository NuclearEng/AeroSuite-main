#!/usr/bin/env node

/**
 * Local Environment Setup with Test Data
 * 
 * This script sets up a local development environment with test data.
 * It combines the test data generation functionality with environment setup.
 * 
 * Task: DEV010 - Local Environment Test Data Generation
 * 
 * Usage:
 *   node setup-local-environment.js [options]
 * 
 * Options:
 *   --profile=NAME     Environment profile to use (dev, demo, full) (default: dev)
 *   --seed=STRING      Seed for reproducible data generation (default: local-dev)
 *   --output=PATH      Output directory for configuration files (default: ./local-env)
 *   --mongo=URI        MongoDB URI (default: mongodb://localhost:27017/aerosuite-dev)
 *   --setup-db         Set up the database with test data (default: true)
 *   --env-file         Generate .env file with configuration (default: true)
 *   --help             Show this help message
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
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
Local Environment Setup with Test Data

This script sets up a local development environment with test data.
It combines the test data generation functionality with environment setup.

Usage:
  node setup-local-environment.js [options]

Options:
  --profile=NAME     Environment profile to use (dev, demo, full) (default: dev)
  --seed=STRING      Seed for reproducible data generation (default: local-dev)
  --output=PATH      Output directory for configuration files (default: ./local-env)
  --mongo=URI        MongoDB URI (default: mongodb://localhost:27017/aerosuite-dev)
  --setup-db         Set up the database with test data (default: true)
  --env-file         Generate .env file with configuration (default: true)
  --reset            Reset existing environment before setup (default: false)
  --help             Show this help message

Profiles:
  dev       - Small dataset suitable for development (10-20 entities of each type)
  demo      - Medium dataset with realistic demo data (50-100 entities of each type)
  full      - Large dataset with comprehensive test data (200+ entities of each type)

Examples:
  # Set up a basic development environment
  node setup-local-environment.js
  
  # Set up a demo environment with specific seed
  node setup-local-environment.js --profile=demo --seed=demo-data-2025
  
  # Reset environment and set up with full dataset
  node setup-local-environment.js --profile=full --reset
`;

  console.log(helpText);
  process.exit(0);
}

// Set default options
const options = {
  profile: args.profile || 'dev',
  seed: args.seed || 'local-dev',
  output: args.output || './local-env',
  mongo: args.mongo || 'mongodb://localhost:27017/aerosuite-dev',
  setupDb: args['setup-db'] !== 'false',
  envFile: args['env-file'] !== 'false',
  reset: !!args.reset
};

// Define dataset profiles
const profiles = {
  dev: {
    users: 10,
    customers: 15,
    suppliers: 15,
    inspections: 25,
    products: 20,
    defects: 30
  },
  demo: {
    users: 50,
    customers: 75,
    suppliers: 75,
    inspections: 100,
    products: 100,
    defects: 150
  },
  full: {
    users: 200,
    customers: 300,
    suppliers: 300,
    inspections: 500,
    products: 400,
    defects: 600
  }
};

// Validate profile
if (!profiles[options.profile]) {
  console.error(`Error: Invalid profile "${options.profile}". Valid profiles are: dev, demo, full`);
  process.exit(1);
}

// Ensure output directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Generate environment files
const generateEnvFile = () => {
  console.log('Generating environment files...');
  
  const envFilePath = path.join(options.output, '.env.local');
  const envContent = `# Generated for local development environment
# Profile: ${options.profile}
# Seed: ${options.seed}
# Generated on: ${new Date().toISOString()}

# Database
MONGODB_URI=${options.mongo}

# Server configuration
PORT=5000
NODE_ENV=development
API_VERSION=v1

# JWT Authentication
JWT_SECRET=local-dev-secret-key-${Math.random().toString(36).substring(2, 10)}
JWT_EXPIRES_IN=7d

# Email configuration (development mode)
EMAIL_HOST=localhost
EMAIL_PORT=1025
EMAIL_USER=dev
EMAIL_PASS=dev
EMAIL_FROM=dev@aerosuite.test

# Redis configuration
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=debug
LOG_TO_FILE=false

# Features
ENABLE_THREAT_DETECTION=true
ENABLE_AUTO_SCALING=true
ENABLE_AI_FEATURES=false
`;

  fs.writeFileSync(envFilePath, envContent);
  console.log(`✅ Generated environment file: ${envFilePath}`);
  
  // Also create a .env file in the root directory
  if (args['root-env'] !== 'false') {
    fs.writeFileSync('.env', envContent);
    console.log('✅ Generated .env file in project root');
  }
};

// Set up database with test data
const setupDatabase = async () => {
  console.log(`Setting up database with ${options.profile} profile...`);
  
  const generator = new TestDataGenerator({ seed: options.seed });
  const counts = profiles[options.profile];
  
  let client;
  try {
    client = new MongoClient(options.mongo);
    await client.connect();
    
    const db = client.db();
    console.log(`Connected to database: ${db.databaseName}`);
    
    // Reset database if requested
    if (options.reset) {
      console.log('Resetting database...');
      const collections = await db.listCollections().toArray();
      for (const collection of collections) {
        await db.collection(collection.name).drop();
        console.log(`Dropped collection: ${collection.name}`);
      }
    }
    
    // Generate and insert data
    console.log('Generating test data...');
    const dataset = generator.generateDataset(counts);
    
    for (const [entityType, data] of Object.entries(dataset)) {
      if (data.length > 0) {
        // Check if collection already has data
        const existingCount = await db.collection(entityType).countDocuments();
        if (existingCount > 0) {
          console.log(`Collection ${entityType} already has ${existingCount} documents. Skipping...`);
          continue;
        }
        
        const result = await db.collection(entityType).insertMany(data);
        console.log(`✅ Inserted ${result.insertedCount} ${entityType} into database`);
      }
    }
    
    // Create indexes
    console.log('Creating database indexes...');
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('suppliers').createIndex({ name: 1 });
    await db.collection('customers').createIndex({ name: 1 });
    await db.collection('inspections').createIndex({ supplierId: 1 });
    await db.collection('inspections').createIndex({ customerId: 1 });
    await db.collection('products').createIndex({ sku: 1 }, { unique: true });
    
    console.log('✅ Database setup complete');
  } catch (error) {
    console.error(`Error setting up database: ${error.message}`);
    throw error;
  } finally {
    if (client) await client.close();
  }
};

// Export data as JSON files
const exportDataAsJson = async () => {
  console.log('Exporting data as JSON files...');
  
  const generator = new TestDataGenerator({ seed: options.seed });
  const counts = profiles[options.profile];
  const dataset = generator.generateDataset(counts);
  
  const dataDir = path.join(options.output, 'data');
  ensureDirectoryExists(dataDir);
  
  for (const [entityType, data] of Object.entries(dataset)) {
    const filePath = path.join(dataDir, `${entityType}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Exported ${data.length} ${entityType} to ${filePath}`);
  }
  
  // Also export complete dataset
  const allDataPath = path.join(dataDir, 'all-data.json');
  fs.writeFileSync(allDataPath, JSON.stringify(dataset, null, 2));
  console.log(`✅ Exported complete dataset to ${allDataPath}`);
};

// Setup frontend environment
const setupFrontend = async () => {
  console.log('Setting up frontend environment...');
  
  const frontendEnvPath = path.join('client', '.env.local');
  const frontendEnvContent = `# Generated for local development environment
# Profile: ${options.profile}
# Generated on: ${new Date().toISOString()}

REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
REACT_APP_VERSION=${require('../package.json').version}
REACT_APP_BUILD_DATE=${new Date().toISOString()}
`;

  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log(`✅ Generated frontend environment file: ${frontendEnvPath}`);
};

// Generate a README for the local environment
const generateReadme = () => {
  const readmePath = path.join(options.output, 'README.md');
  const readmeContent = `# AeroSuite Local Development Environment

This environment was generated using the setup-local-environment.js script.

## Configuration

- **Profile:** ${options.profile}
- **Seed:** ${options.seed}
- **Generated on:** ${new Date().toLocaleString()}

## Getting Started

1. Start the MongoDB database:
   \`\`\`
   docker run -d -p 27017:27017 --name aerosuite-mongodb mongo:latest
   \`\`\`

2. Start the Redis server:
   \`\`\`
   docker run -d -p 6379:6379 --name aerosuite-redis redis:latest
   \`\`\`

3. Start the backend server:
   \`\`\`
   cd server
   npm install
   npm run dev
   \`\`\`

4. Start the frontend:
   \`\`\`
   cd client
   npm install
   npm start
   \`\`\`

## Test Data

This environment includes pre-generated test data based on the "${options.profile}" profile:

- ${profiles[options.profile].users} users
- ${profiles[options.profile].customers} customers
- ${profiles[options.profile].suppliers} suppliers
- ${profiles[options.profile].inspections} inspections
- ${profiles[options.profile].products} products
- ${profiles[options.profile].defects} defects

## Default Accounts

You can log in with the following accounts:

- Admin: admin@aerosuite.test / Password123!
- Manager: manager@aerosuite.test / Password123!
- Inspector: inspector@aerosuite.test / Password123!
- User: user@aerosuite.test / Password123!

## Regenerating Data

To regenerate the test data:

\`\`\`
node scripts/setup-local-environment.js --profile=${options.profile} --seed=${options.seed} --reset
\`\`\`
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`✅ Generated README: ${readmePath}`);
};

// Check if Docker is available
const checkDocker = () => {
  try {
    execSync('docker --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
};

// Generate Docker Compose file
const generateDockerCompose = () => {
  const dockerComposePath = path.join(options.output, 'docker-compose.local.yml');
  const dockerComposeContent = `# Docker Compose for local development
# Generated on: ${new Date().toISOString()}

version: '3.8'

services:
  mongodb:
    image: mongo:latest
    container_name: aerosuite-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=aerosuite-dev
    networks:
      - aerosuite-network

  redis:
    image: redis:latest
    container_name: aerosuite-redis
    ports:
      - "6379:6379"
    networks:
      - aerosuite-network

  mailhog:
    image: mailhog/mailhog
    container_name: aerosuite-mailhog
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
    networks:
      - aerosuite-network

networks:
  aerosuite-network:
    driver: bridge

volumes:
  mongodb_data:
`;

  fs.writeFileSync(dockerComposePath, dockerComposeContent);
  console.log(`✅ Generated Docker Compose file: ${dockerComposePath}`);
};

// Main function
const main = async () => {
  try {
    console.log(`
======================================================
  AeroSuite Local Environment Setup
  Profile: ${options.profile}
  Seed: ${options.seed}
======================================================
`);
    
    // Create output directory
    ensureDirectoryExists(options.output);
    
    // Generate environment files
    if (options.envFile) {
      generateEnvFile();
    }
    
    // Setup database
    if (options.setupDb) {
      await setupDatabase();
    }
    
    // Export data as JSON
    await exportDataAsJson();
    
    // Setup frontend
    await setupFrontend();
    
    // Generate Docker Compose file
    if (checkDocker()) {
      generateDockerCompose();
    }
    
    // Generate README
    generateReadme();
    
    console.log(`
======================================================
  Local Environment Setup Complete!
  
  The environment is now ready to use.
  See ${path.join(options.output, 'README.md')} for details.
======================================================
`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

// Run the script
main(); 