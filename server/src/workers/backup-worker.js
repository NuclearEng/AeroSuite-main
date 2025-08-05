const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Execute a MongoDB backup
 * @returns {Promise<string>} Path to the backup directory
 */
async function executeMongoBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  const backupDir = path.join(process.env.BACKUP_ROOT_DIR || '/tmp/backups', 'mongodb', timestamp);
  
  // Ensure backup directory exists
  fs.mkdirSync(backupDir, { recursive: true });
  
  logger.info(`Starting MongoDB backup to ${backupDir}`);
  
  return new Promise((resolve, reject) => {
    const mongodump = spawn('mongodump', [
      '--host', process.env.DB_HOST || 'localhost',
      '--port', process.env.DB_PORT || '27017',
      '--username', process.env.DB_USER,
      '--password', process.env.DB_PASS,
      '--db', 'aerosuite',
      '--out', backupDir
    ]);
    
    mongodump.stdout.on('data', (data) => {
      logger.debug(`mongodump: ${data}`);
    });
    
    mongodump.stderr.on('data', (data) => {
      logger.error(`mongodump error: ${data}`);
    });
    
    mongodump.on('close', (code) => {
      if (code === 0) {
        logger.info(`MongoDB backup completed successfully`);
        resolve(backupDir);
      } else {
        logger.error(`MongoDB backup failed with code ${code}`);
        reject(new Error(`Backup failed with code ${code}`));
      }
    });
  });
}

/**
 * Upload backup to cloud storage
 * @param {string} backupDir - Path to the backup directory
 * @returns {Promise<void>}
 */
async function uploadBackupToS3(backupDir) {
  const bucketName = process.env.BACKUP_S3_BUCKET || 'aerosuite-db-backups';
  const s3Path = `mongodb/${path.basename(backupDir)}`;
  
  logger.info(`Uploading backup to S3: ${bucketName}/${s3Path}`);
  
  return new Promise((resolve, reject) => {
    const s3Upload = spawn('aws', [
      's3', 'cp',
      backupDir,
      `s3://${bucketName}/${s3Path}`,
      '--recursive'
    ]);
    
    s3Upload.stdout.on('data', (data) => {
      logger.debug(`s3Upload: ${data}`);
    });
    
    s3Upload.stderr.on('data', (data) => {
      logger.error(`s3Upload error: ${data}`);
    });
    
    s3Upload.on('close', (code) => {
      if (code === 0) {
        logger.info(`Backup upload completed successfully`);
        resolve();
      } else {
        logger.error(`Backup upload failed with code ${code}`);
        reject(new Error(`Upload failed with code ${code}`));
      }
    });
  });
}

/**
 * Verify backup integrity by performing a test restore
 * @param {string} backupDir - Path to the backup directory
 * @returns {Promise<boolean>} Whether verification succeeded
 */
async function verifyBackup(backupDir) {
  const verifyDbName = 'aerosuite_verify';
  
  logger.info(`Verifying backup integrity by restoring to ${verifyDbName}`);
  
  try {
    // Restore to a test database
    await new Promise((resolve, reject) => {
      const mongorestore = spawn('mongorestore', [
        '--host', process.env.DB_HOST || 'localhost',
        '--port', process.env.DB_PORT || '27017',
        '--username', process.env.VERIFY_USER || process.env.DB_USER,
        '--password', process.env.VERIFY_PASS || process.env.DB_PASS,
        '--db', verifyDbName,
        `${backupDir}/aerosuite`,
        '--drop'
      ]);
      
      mongorestore.stdout.on('data', (data) => {
        logger.debug(`mongorestore: ${data}`);
      });
      
      mongorestore.stderr.on('data', (data) => {
        logger.error(`mongorestore error: ${data}`);
      });
      
      mongorestore.on('close', (code) => {
        if (code === 0) {
          logger.info(`Test restore completed successfully`);
          resolve();
        } else {
          logger.error(`Test restore failed with code ${code}`);
          reject(new Error(`Test restore failed with code ${code}`));
        }
      });
    });
    
    // Cleanup the test database
    await new Promise((resolve, reject) => {
      const mongo = spawn('mongo', [
        '--host', process.env.DB_HOST || 'localhost',
        '--port', process.env.DB_PORT || '27017',
        '--username', process.env.VERIFY_USER || process.env.DB_USER,
        '--password', process.env.VERIFY_PASS || process.env.DB_PASS,
        '--eval', 'db.dropDatabase()',
        verifyDbName
      ]);
      
      mongo.on('close', (code) => {
        if (code === 0) {
          logger.info(`Test database cleanup completed`);
          resolve();
        } else {
          logger.warn(`Test database cleanup failed with code ${code}`);
          resolve(); // Resolve anyway since this is just cleanup
        }
      });
    });
    
    return true;
  } catch (error) {
    logger.error('Backup verification failed:', error);
    return false;
  }
}

/**
 * Clean up old backups to save space
 * @returns {Promise<void>}
 */
async function cleanupOldBackups() {
  const backupRoot = process.env.BACKUP_ROOT_DIR || '/tmp/backups';
  const mongoDbBackupDir = path.join(backupRoot, 'mongodb');
  
  if (!fs.existsSync(mongoDbBackupDir)) {
    return;
  }
  
  logger.info('Cleaning up old backup files');
  
  // Keep only the last 3 local backups
  const backupFolders = fs.readdirSync(mongoDbBackupDir)
    .filter(item => fs.statSync(path.join(mongoDbBackupDir, item)).isDirectory())
    .sort((a, b) => b.localeCompare(a)); // Sort descending to get newest first
  
  const foldersToDelete = backupFolders.slice(3); // Keep 3 most recent
  
  for (const folder of foldersToDelete) {
    const folderPath = path.join(mongoDbBackupDir, folder);
    logger.info(`Removing old backup: ${folderPath}`);
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
    } catch (error) {
      logger.error(`Failed to remove old backup ${folderPath}:`, error);
    }
  }
}

/**
 * Main backup job function
 * @returns {Promise<Object>} Result of the backup job
 */
async function runBackupJob() {
  try {
    // Record start time for performance monitoring
    const startTime = Date.now();
    
    // Execute backup
    const backupDir = await executeMongoBackup();
    
    // Verify backup integrity
    const isVerified = await verifyBackup(backupDir);
    if (!isVerified) {
      throw new Error('Backup verification failed');
    }
    
    // Upload to S3
    await uploadBackupToS3(backupDir);
    
    // Clean up old backups
    await cleanupOldBackups();
    
    // Calculate duration
    const duration = (Date.now() - startTime) / 1000;
    
    logger.info(`Backup job completed successfully in ${duration.toFixed(2)} seconds`);
    
    return { 
      success: true, 
      message: 'Backup completed successfully',
      backupDir,
      duration,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Backup job failed', error);
    return { 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// For direct execution via node
if (require.main === module) {
  runBackupJob().then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}

// For scheduled execution via cron
function scheduleBackup() {
  const CronJob = require('cron').CronJob;
  
  // Schedule full backup daily at 1 AM
  const dailyBackupJob = new CronJob('0 1 * * *', async () => {
    logger.info('Starting scheduled daily backup');
    await runBackupJob();
  });
  
  // Start the scheduled job
  dailyBackupJob.start();
  logger.info('Scheduled backup job initialized');
  
  return {
    dailyBackupJob
  };
}

module.exports = { 
  runBackupJob,
  scheduleBackup,
  executeMongoBackup,
  uploadBackupToS3,
  verifyBackup,
  cleanupOldBackups
}; 