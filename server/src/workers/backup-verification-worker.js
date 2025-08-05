const cron = require('node-cron');
const logger = require('../utils/logger');
const backupVerificationService = require('../services/backup-verification.service');
const notificationService = require('../services/notification.service');

/**
 * Run a backup verification check
 */
async function runVerificationCheck() {
  logger.info('Starting scheduled backup verification check');
  
  try {
    const results = await backupVerificationService.runComprehensiveVerification();
    
    logger.info(`Scheduled verification completed: ${results.summary.successful} successful, ${results.summary.failed} failed`);
    
    // Send notifications if there were any failures
    if (results.summary.failed > 0) {
      await sendFailureNotifications(results);
    }
    
    return {
      success: true,
      results
    };
  } catch (error) {
    logger.error(`Scheduled backup verification failed: ${error.message}`);
    
    // Send notification about the verification process failure
    await sendProcessFailureNotification(error);
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send notifications about backup verification failures
 * @param {Object} results - Verification results
 */
async function sendFailureNotifications(results) {
  try {
    // Get details of failures
    const failures = [];
    
    if (results.localVerifications) {
      failures.push(...results.localVerifications.filter(v => !v.success));
    }
    
    if (results.s3Verifications) {
      failures.push(...results.s3Verifications.filter(v => !v.success));
    }
    
    // Send notification to system administrators
    await notificationService.createNotification({
      title: 'Backup Verification Failed',
      message: `${failures.length} backup verification(s) failed. Please check the backup system.`,
      type: 'error',
      priority: 'high',
      category: 'system',
      metadata: {
        failures,
        summary: results.summary
      },
      roles: ['admin'],
      permissions: ['admin:system:backup']
    });
    
    logger.info('Sent backup verification failure notifications');
  } catch (error) {
    logger.error(`Failed to send failure notifications: ${error.message}`);
  }
}

/**
 * Send notification about the verification process failure
 * @param {Error} error - The error that occurred
 */
async function sendProcessFailureNotification(error) {
  try {
    await notificationService.createNotification({
      title: 'Backup Verification Process Failed',
      message: `The backup verification process encountered an error: ${error.message}`,
      type: 'error',
      priority: 'critical',
      category: 'system',
      metadata: {
        error: error.message,
        stack: error.stack
      },
      roles: ['admin'],
      permissions: ['admin:system:backup']
    });
    
    logger.info('Sent verification process failure notification');
  } catch (notificationError) {
    logger.error(`Failed to send process failure notification: ${notificationError.message}`);
  }
}

/**
 * Schedule a regular backup verification job
 * Default: Run daily at 3:30 AM
 * @param {string} schedule - Cron schedule expression
 */
function scheduleVerification(schedule = '30 3 * * *') {
  logger.info(`Scheduling backup verification with schedule: ${schedule}`);
  
  const job = cron.schedule(schedule, async () => {
    await runVerificationCheck();
  });
  
  return job;
}

// If this file is run directly, execute a verification check
if (require.main === module) {
  runVerificationCheck()
    .then(result => {
      console.log('Verification check completed:', result.success);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Verification check failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runVerificationCheck,
  scheduleVerification
}; 