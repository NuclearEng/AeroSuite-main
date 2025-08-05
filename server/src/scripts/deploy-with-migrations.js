#!/usr/bin/env node

/**
 * Automated Database Migration Deployment Script
 * 
 * This script is designed to be run as part of the deployment process.
 * It performs the following tasks:
 * 1. Connects to the database
 * 2. Runs pending migrations
 * 3. Verifies migration success
 * 4. Exits with appropriate status code
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const { migrate } = require('mongoose-migrate-2');
const config = require('../migrations/config');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Configure logging
const logger = {
  info: (message) => console.log(`[INFO] ${message}`),
  error: (message, err) => console.error(`[ERROR] ${message}`, err || ''),
  success: (message) => console.log(`[SUCCESS] ${message}`),
  warn: (message) => console.warn(`[WARNING] ${message}`)
};

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    logger.info('Starting database migration process');
    
    // Create migrator instance
    const migrator = await migrate.create(config);
    
    // Get migration status before running
    const pendingBefore = await migrator.getPendingMigrations();
    logger.info(`Found ${pendingBefore.length} pending migrations`);
    
    if (pendingBefore.length === 0) {
      logger.success('No pending migrations to run');
      return { success: true, migrationsRun: 0 };
    }
    
    // Run migrations
    logger.info('Running pending migrations...');
    const result = await migrator.runAsCLI();
    
    // Verify all migrations were applied
    const pendingAfter = await migrator.getPendingMigrations();
    
    if (pendingAfter.length > 0) {
      logger.warn(`${pendingAfter.length} migrations still pending after migration run`);
      logger.warn('Pending migrations:');
      pendingAfter.forEach(migration => {
        logger.warn(`- ${migration.name}`);
      });
      return { success: false, migrationsRun: result.migrationsRun };
    }
    
    logger.success(`Successfully ran ${result.migrationsRun} migration(s)`);
    return { success: true, migrationsRun: result.migrationsRun };
  } catch (error) {
    logger.error('Migration process failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verify database connection
 */
async function verifyDatabaseConnection() {
  try {
    logger.info('Verifying database connection');
    
    await mongoose.connect(config.mongodb.url, config.mongodb.options);
    logger.success('Database connection successful');
    
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Verify database connection
    const dbConnected = await verifyDatabaseConnection();
    if (!dbConnected) {
      logger.error('Exiting due to database connection failure');
      process.exit(1);
    }
    
    // Run migrations
    const migrationResult = await runMigrations();
    
    // Close database connection
    await mongoose.connection.close();
    
    // Exit with appropriate status code
    if (!migrationResult.success) {
      logger.error('Migration process failed, exiting with error');
      process.exit(1);
    }
    
    logger.success('Migration process completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Unexpected error during migration process:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 