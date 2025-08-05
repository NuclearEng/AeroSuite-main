const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { spawn } = require('child_process');
const AWS = require('aws-sdk');
const logger = require('../infrastructure/logger');
const BackupLog = require('../models/backup-log.model');

/**
 * Backup verification service
 * This service is responsible for verifying the integrity of database backups,
 * recording verification results, and ensuring backup health.
 */

/**
 * Verify local backup integrity by performing a test restore
 * @param {string} backupDir - Path to the backup directory
 * @returns {Promise<Object>} Verification result
 */
async function verifyLocalBackup(backupDir) {
  const verifyDbName = 'aerosuite_verify';
  const startTime = Date.now();
  
  logger.info(`Starting verification of backup at ${backupDir}`);
  
  try {
    if (!fs.existsSync(backupDir)) {
      throw new Error(`Backup directory ${backupDir} does not exist`);
    }
    
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
      
      let stdoutData = '';
      let stderrData = '';
      
      mongorestore.stdout.on('data', (data) => {
        stdoutData += data.toString();
        logger.debug(`mongorestore: ${data}`);
      });
      
      mongorestore.stderr.on('data', (data) => {
        stderrData += data.toString();
        logger.error(`mongorestore error: ${data}`);
      });
      
      mongorestore.on('close', (code) => {
        if (code === 0) {
          logger.info(`Test restore completed successfully`);
          resolve({ stdout: stdoutData, stderr: stderrData });
        } else {
          logger.error(`Test restore failed with code ${code}`);
          reject(new Error(`Test restore failed with code ${code}: ${stderrData}`));
        }
      });
    });
    
    // Verify data integrity in the restored database
    await verifyRestoredData(verifyDbName);
    
    // Cleanup the test database
    await cleanupTestDatabase(verifyDbName);
    
    const duration = (Date.now() - startTime) / 1000;
    
    logger.info(`Backup verification completed successfully in ${duration.toFixed(2)} seconds`);
    
    return {
      success: true,
      verificationDate: new Date(),
      duration,
      backupDir,
      details: 'Backup verified successfully'
    };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    logger.error(`Backup verification failed: ${error.message}`);
    
    // Attempt to clean up the test database even if verification failed
    try {
      await cleanupTestDatabase(verifyDbName);
    } catch (cleanupError) {
      logger.error(`Failed to clean up test database: ${cleanupError.message}`);
    }
    
    return {
      success: false,
      verificationDate: new Date(),
      duration,
      backupDir,
      error: error.message,
      details: 'Backup verification failed'
    };
  }
}

/**
 * Verify data integrity in the restored database
 * Performs basic checks to ensure data was restored correctly
 * @param {string} dbName - Name of the test database
 * @returns {Promise<void>}
 */
async function verifyRestoredData(dbName) {
  logger.info(`Verifying data integrity in restored database ${dbName}`);
  
  try {
    // Create a separate connection to the test database
    const testDbUri = process.env.MONGODB_URI.replace(/\/[^/]+$/, `/${dbName}`);
    const testConnection = await mongoose.createConnection(testDbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Define a list of critical collections to check
    const criticalCollections = [
      'users',
      'suppliers',
      'customers',
      'inspections',
      'roles',
      'permissions'
    ];
    
    // Check each critical collection for existence and data
    for (const collectionName of criticalCollections) {
      const collection = testConnection.collection(collectionName);
      const count = await collection.countDocuments();
      
      logger.debug(`Collection ${collectionName} has ${count} documents`);
      
      if (count === 0) {
        throw new Error(`Collection ${collectionName} is empty in restored database`);
      }
    }
    
    // Check a few relationships to ensure data integrity
    // For example, check if inspections reference valid suppliers
    const inspections = await testConnection.collection('inspections').find({}, { limit: 5 }).toArray();
    
    if (inspections.length > 0) {
      // Check that referenced suppliers exist
      for (const inspection of inspections) {
        if (inspection.supplierId) {
          const supplier = await testConnection.collection('suppliers').findOne({ _id: inspection.supplierId });
          if (!supplier) {
            throw new Error(`Referenced supplier ${inspection.supplierId} not found for inspection ${inspection._id}`);
          }
        }
      }
    }
    
    // Close the test connection
    await testConnection.close();
    
    logger.info(`Data integrity verification successful`);
  } catch (error) {
    logger.error(`Data integrity verification failed: ${error.message}`);
    throw error;
  }
}

/**
 * Clean up the test database after verification
 * @param {string} dbName - Name of the test database
 * @returns {Promise<void>}
 */
async function cleanupTestDatabase(dbName) {
  logger.info(`Cleaning up test database ${dbName}`);
  
  return new Promise((resolve, reject) => {
    const mongo = spawn('mongo', [
      '--host', process.env.DB_HOST || 'localhost',
      '--port', process.env.DB_PORT || '27017',
      '--username', process.env.VERIFY_USER || process.env.DB_USER,
      '--password', process.env.VERIFY_PASS || process.env.DB_PASS,
      '--eval', 'db.dropDatabase()',
      dbName
    ]);
    
    mongo.on('close', (code) => {
      if (code === 0) {
        logger.info(`Test database cleanup completed`);
        resolve();
      } else {
        logger.warn(`Test database cleanup failed with code ${code}`);
        reject(new Error(`Test database cleanup failed with code ${code}`));
      }
    });
  });
}

/**
 * Verify a remote backup stored in S3
 * @param {string} s3Path - S3 path to the backup
 * @returns {Promise<Object>} Verification result
 */
async function verifyS3Backup(s3Path) {
  const tempDir = path.join(process.env.BACKUP_ROOT_DIR || '/tmp/backups', 'verification', Date.now().toString());
  const bucketName = process.env.BACKUP_S3_BUCKET || 'aerosuite-db-backups';
  const startTime = Date.now();
  
  logger.info(`Starting verification of S3 backup: s3://${bucketName}/${s3Path}`);
  
  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Download backup from S3
    await downloadBackupFromS3(bucketName, s3Path, tempDir);
    
    // Verify the downloaded backup
    const verificationResult = await verifyLocalBackup(tempDir);
    
    // Clean up the temp directory
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    const duration = (Date.now() - startTime) / 1000;
    
    return {
      ...verificationResult,
      duration,
      s3Path: `s3://${bucketName}/${s3Path}`
    };
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;
    logger.error(`S3 backup verification failed: ${error.message}`);
    
    // Clean up the temp directory
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      logger.error(`Failed to clean up temp directory: ${cleanupError.message}`);
    }
    
    return {
      success: false,
      verificationDate: new Date(),
      duration,
      s3Path: `s3://${bucketName}/${s3Path}`,
      error: error.message,
      details: 'S3 backup verification failed'
    };
  }
}

/**
 * Download backup from S3
 * @param {string} bucketName - S3 bucket name
 * @param {string} s3Path - S3 path to the backup
 * @param {string} localDir - Local directory to download to
 * @returns {Promise<void>}
 */
async function downloadBackupFromS3(bucketName, s3Path, localDir) {
  logger.info(`Downloading backup from S3: ${bucketName}/${s3Path} to ${localDir}`);
  
  return new Promise((resolve, reject) => {
    const s3Download = spawn('aws', [
      's3', 'cp',
      `s3://${bucketName}/${s3Path}`,
      localDir,
      '--recursive'
    ]);
    
    s3Download.stdout.on('data', (data) => {
      logger.debug(`s3Download: ${data}`);
    });
    
    s3Download.stderr.on('data', (data) => {
      logger.error(`s3Download error: ${data}`);
    });
    
    s3Download.on('close', (code) => {
      if (code === 0) {
        logger.info(`Backup download completed successfully`);
        resolve();
      } else {
        logger.error(`Backup download failed with code ${code}`);
        reject(new Error(`Download failed with code ${code}`));
      }
    });
  });
}

/**
 * Record a backup verification result in the database
 * @param {Object} verificationResult - Result of the verification
 * @returns {Promise<Object>} The saved backup log
 */
async function recordVerificationResult(verificationResult) {
  try {
    const backupLog = new BackupLog({
      backupLocation: verificationResult.backupDir || verificationResult.s3Path,
      verificationDate: verificationResult.verificationDate,
      success: verificationResult.success,
      duration: verificationResult.duration,
      details: verificationResult.details,
      error: verificationResult.error || null
    });
    
    await backupLog.save();
    logger.info(`Recorded backup verification result: ${backupLog._id}`);
    
    return backupLog;
  } catch (error) {
    logger.error(`Failed to record verification result: ${error.message}`);
    throw error;
  }
}

/**
 * Get backup verification statistics
 * @param {number} days - Number of days to look back
 * @returns {Promise<Object>} Verification statistics
 */
async function getVerificationStats(days = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all verification logs for the period
    const logs = await BackupLog.find({
      verificationDate: { $gte: startDate }
    }).sort({ verificationDate: -1 });
    
    // Calculate statistics
    const totalCount = logs.length;
    const successCount = logs.filter(log => log.success).length;
    const failureCount = totalCount - successCount;
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
    
    // Get the most recent verification
    const mostRecent = logs.length > 0 ? logs[0] : null;
    
    // Calculate average duration for successful verifications
    const successfulLogs = logs.filter(log => log.success);
    const averageDuration = successfulLogs.length > 0
      ? successfulLogs.reduce((sum, log) => sum + log.duration, 0) / successfulLogs.length
      : 0;
    
    return {
      period: {
        start: startDate,
        end: new Date()
      },
      totalVerifications: totalCount,
      successfulVerifications: successCount,
      failedVerifications: failureCount,
      successRate: successRate.toFixed(2),
      averageDuration: averageDuration.toFixed(2),
      mostRecentVerification: mostRecent,
      status: getBackupStatus(logs)
    };
  } catch (error) {
    logger.error(`Failed to get verification stats: ${error.message}`);
    throw error;
  }
}

/**
 * Determine backup system health status based on verification logs
 * @param {Array} logs - Array of verification logs
 * @returns {string} Status: 'healthy', 'warning', or 'critical'
 */
function getBackupStatus(logs) {
  if (logs.length === 0) {
    return 'warning'; // No verification records found
  }
  
  // Check if most recent verification was successful
  const mostRecent = logs[0];
  if (!mostRecent.success) {
    return 'critical'; // Most recent verification failed
  }
  
  // Check how old the most recent verification is
  const now = new Date();
  const hoursSinceVerification = (now - mostRecent.verificationDate) / (1000 * 60 * 60);
  
  if (hoursSinceVerification > 48) {
    return 'critical'; // No successful verification in last 48 hours
  }
  
  if (hoursSinceVerification > 24) {
    return 'warning'; // No successful verification in last 24 hours
  }
  
  // Check success rate in the last week
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const recentLogs = logs.filter(log => log.verificationDate >= weekAgo);
  if (recentLogs.length === 0) {
    return 'warning'; // No verifications in the last week
  }
  
  const recentSuccessCount = recentLogs.filter(log => log.success).length;
  const recentSuccessRate = (recentSuccessCount / recentLogs.length) * 100;
  
  if (recentSuccessRate < 80) {
    return 'critical'; // Less than 80% success rate in the last week
  }
  
  if (recentSuccessRate < 95) {
    return 'warning'; // Less than 95% success rate in the last week
  }
  
  return 'healthy'; // All checks passed
}

/**
 * Run a comprehensive verification of all recent backups
 * This is intended to be run as a scheduled job
 * @returns {Promise<Object>} Verification results
 */
async function runComprehensiveVerification() {
  logger.info('Starting comprehensive backup verification');
  const results = {
    startTime: new Date(),
    localVerifications: [],
    s3Verifications: [],
    summary: {
      totalVerified: 0,
      successful: 0,
      failed: 0
    }
  };
  
  try {
    // Verify most recent local backup
    const backupRoot = process.env.BACKUP_ROOT_DIR || '/tmp/backups';
    const mongoDbBackupDir = path.join(backupRoot, 'mongodb');
    
    if (fs.existsSync(mongoDbBackupDir)) {
      const backupFolders = fs.readdirSync(mongoDbBackupDir)
        .filter(item => {
          const itemPath = path.join(mongoDbBackupDir, item);
          return fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory();
        })
        .sort((a, b) => b.localeCompare(a)); // Sort descending to get newest first
      
      if (backupFolders.length > 0) {
        const latestBackup = backupFolders[0];
        const backupPath = path.join(mongoDbBackupDir, latestBackup);
        
        const localResult = await verifyLocalBackup(backupPath);
        await recordVerificationResult(localResult);
        results.localVerifications.push(localResult);
        
        results.summary.totalVerified++;
        if (localResult.success) {
          results.summary.successful++;
        } else {
          results.summary.failed++;
        }
      }
    }
    
    // Verify most recent S3 backups
    const s3 = new AWS.S3({
      region: process.env.AWS_REGION || 'us-east-1'
    });
    
    const bucketName = process.env.BACKUP_S3_BUCKET || 'aerosuite-db-backups';
    const s3Prefix = 'mongodb/';
    
    try {
      const s3Objects = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: s3Prefix,
        Delimiter: '/'
      }).promise();
      
      const s3Directories = s3Objects.CommonPrefixes || [];
      // Sort descending to get newest first (assuming ISO date format in names)
      s3Directories.sort((a, b) => b.Prefix.localeCompare(a.Prefix));
      
      // Verify the most recent S3 backup
      if (s3Directories.length > 0) {
        const latestBackupPrefix = s3Directories[0].Prefix;
        
        const s3Result = await verifyS3Backup(latestBackupPrefix);
        await recordVerificationResult(s3Result);
        results.s3Verifications.push(s3Result);
        
        results.summary.totalVerified++;
        if (s3Result.success) {
          results.summary.successful++;
        } else {
          results.summary.failed++;
        }
      }
    } catch (s3Error) {
      logger.error(`Failed to list S3 backups: ${s3Error.message}`);
      results.s3Error = s3Error.message;
    }
    
    // Calculate end time and duration
    results.endTime = new Date();
    results.duration = (results.endTime - results.startTime) / 1000;
    
    logger.info(`Comprehensive verification completed in ${results.duration.toFixed(2)} seconds`);
    return results;
  } catch (error) {
    logger.error(`Comprehensive verification failed: ${error.message}`);
    
    results.endTime = new Date();
    results.duration = (results.endTime - results.startTime) / 1000;
    results.error = error.message;
    
    return results;
  }
}

module.exports = {
  verifyLocalBackup,
  verifyS3Backup,
  recordVerificationResult,
  getVerificationStats,
  runComprehensiveVerification
}; 