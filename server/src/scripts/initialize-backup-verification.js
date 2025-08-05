/**
 * Initialize Backup Verification System
 * 
 * This script initializes the backup verification system and schedules
 * regular verification checks.
 */
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const BackupLog = require('../models/backup-log.model');
const { scheduleVerification } = require('../workers/backup-verification-worker');

/**
 * Initialize the backup verification system
 * @param {Object} options - Configuration options
 * @returns {Object} Scheduled verification job
 */
async function initializeBackupVerification(options = {}) {
  logger.info('Initializing backup verification system');
  
  const config = {
    schedule: options.schedule || process.env.BACKUP_VERIFICATION_SCHEDULE || '30 3 * * *', // Default: 3:30 AM daily
    runImmediately: options.runImmediately !== undefined ? options.runImmediately : false
  };
  
  try {
    // Make sure the BackupLog model is registered
    if (!mongoose.modelNames().includes('BackupLog')) {
      logger.info('Registering BackupLog model');
    }
    
    // Schedule regular verification
    const job = scheduleVerification(config.schedule);
    logger.info(`Scheduled backup verification with cron schedule: ${config.schedule}`);
    
    // Run an immediate verification if requested
    if (config.runImmediately) {
      logger.info('Running immediate backup verification');
      const { runVerificationCheck } = require('../workers/backup-verification-worker');
      
      // Run asynchronously to not block server startup
      setTimeout(async () => {
        try {
          await runVerificationCheck();
        } catch (error) {
          logger.error(`Initial backup verification failed: ${error.message}`);
        }
      }, 10000); // Wait 10 seconds after server startup
    }
    
    logger.info('Backup verification system initialized successfully');
    return job;
  } catch (error) {
    logger.error(`Failed to initialize backup verification: ${error.message}`);
    throw error;
  }
}

// Export for use in server initialization
module.exports = initializeBackupVerification;

// Allow direct execution for testing
if (require.main === module) {
  // Setup minimal environment for testing
  const dotenv = require('dotenv');
  dotenv.config();
  
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState === 0) {
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => {
        console.log('Connected to MongoDB');
        return initializeBackupVerification({ runImmediately: true });
      })
      .then(() => {
        console.log('Backup verification initialized for testing');
      })
      .catch(err => {
        console.error('Failed to initialize backup verification:', err);
        process.exit(1);
      });
  } else {
    initializeBackupVerification({ runImmediately: true })
      .then(() => {
        console.log('Backup verification initialized for testing');
      })
      .catch(err => {
        console.error('Failed to initialize backup verification:', err);
        process.exit(1);
      });
  }
} 