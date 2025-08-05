#!/usr/bin/env node

/**
 * Backend startup wrapper with connection retry logic
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 2000; // 2 seconds

async function connectWithRetry(retries = 0) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite';
  
  try {
    console.log(`Attempting to connect to MongoDB at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Start the main application
    if (require.main === module) {
      // Check if cluster.js exists, otherwise use index.js
      const clusterPath = path.join(__dirname, 'cluster.js');
      const indexPath = path.join(__dirname, 'index.js');
      
      if (require('fs').existsSync(clusterPath)) {
        console.log('Starting application with cluster.js...');
        require(clusterPath);
      } else {
        console.log('Starting application with index.js...');
        require(indexPath);
      }
    }
    
  } catch (error) {
    console.error(`MongoDB connection attempt ${retries + 1} failed:`, error.message);
    
    if (retries < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
      setTimeout(() => connectWithRetry(retries + 1), RETRY_INTERVAL);
    } else {
      console.error('❌ Failed to connect to MongoDB after maximum retries');
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start the connection process
connectWithRetry();

module.exports = { connectWithRetry };
