#!/usr/bin/env node

/**
 * Backend startup wrapper with connection retry logic
 */

const mongoose = require('mongoose');
const path = require('path');
const { logger } = require('./utils/logger');
const config = require('./config');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 2000; // 2 seconds

async function connectWithRetry(retries = 0) {
  const mongoUri = config.db.uri;
  
  try {
    logger.info(`Attempting to connect to MongoDB at ${mongoUri}...`);
    
    await mongoose.connect(mongoUri, config.db.options);
    
    logger.info('✅ Connected to MongoDB successfully');
    
    // Set up mongoose event listeners for connection issues
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
      setTimeout(() => connectWithRetry(0), 2000);
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });
    
    // Start the main application
    if (require.main === module) {
      // Check if cluster.js exists, otherwise use index.js
      const clusterPath = path.join(__dirname, 'cluster.js');
      const indexPath = path.join(__dirname, 'index.js');
      
      if (require('fs').existsSync(clusterPath)) {
        logger.info('Starting application with cluster.js...');
        require(clusterPath);
      } else {
        logger.info('Starting application with index.js...');
        require(indexPath);
      }
    }
    
  } catch (error) {
    logger.error(`MongoDB connection attempt ${retries + 1} failed:`, error.message);
    
    if (retries < MAX_RETRIES) {
      logger.info(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
      setTimeout(() => connectWithRetry(retries + 1), RETRY_INTERVAL);
    } else {
      logger.error('❌ Failed to connect to MongoDB after maximum retries');
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\nReceived SIGINT, shutting down gracefully...');
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start the connection process
connectWithRetry();

module.exports = { connectWithRetry };
