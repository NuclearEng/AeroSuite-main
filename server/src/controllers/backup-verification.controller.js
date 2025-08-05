const BackupLog = require('../models/backup-log.model');
const backupVerificationService = require('../services/backup-verification.service');
const { ServerError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * Get backup verification status
 * @route GET /api/backups/verification/status
 */
exports.getVerificationStatus = async (req, res, next) => {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 30;
    
    const stats = await backupVerificationService.getVerificationStats(days);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error(`Error getting verification status: ${error.message}`);
    next(new ServerError('Failed to get backup verification status'));
  }
};

/**
 * Get recent verification logs
 * @route GET /api/backups/verification/logs
 */
exports.getVerificationLogs = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const logs = await BackupLog.find()
      .sort({ verificationDate: -1 })
      .limit(limit);
    
    res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    logger.error(`Error getting verification logs: ${error.message}`);
    next(new ServerError('Failed to get backup verification logs'));
  }
};

/**
 * Get recent verification failures
 * @route GET /api/backups/verification/failures
 */
exports.getVerificationFailures = async (req, res, next) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const failures = await BackupLog.getRecentFailures(limit);
    
    res.status(200).json({
      success: true,
      count: failures.length,
      data: failures
    });
  } catch (error) {
    logger.error(`Error getting verification failures: ${error.message}`);
    next(new ServerError('Failed to get backup verification failures'));
  }
};

/**
 * Trigger a verification of the most recent backup
 * @route POST /api/backups/verification/verify
 */
exports.triggerVerification = async (req, res, next) => {
  try {
    // Run comprehensive verification as a background process
    // and immediately return a response to the client
    res.status(202).json({
      success: true,
      message: 'Backup verification process initiated',
      data: {
        startTime: new Date()
      }
    });
    
    // Run the verification after sending the response
    try {
      const results = await backupVerificationService.runComprehensiveVerification();
      logger.info(`Verification completed with ${results.summary.successful} successful and ${results.summary.failed} failed verifications`);
    } catch (verificationError) {
      logger.error(`Verification process failed: ${verificationError.message}`);
    }
  } catch (error) {
    logger.error(`Error triggering verification: ${error.message}`);
    next(new ServerError('Failed to trigger backup verification'));
  }
};

/**
 * Get verification statistics for a specific date range
 * @route GET /api/backups/verification/statistics
 */
exports.getVerificationStatistics = async (req, res, next) => {
  try {
    let { startDate, endDate } = req.query;
    
    // Default to last 30 days if no dates provided
    if (!startDate) {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    } else {
      startDate = new Date(startDate);
    }
    
    if (!endDate) {
      endDate = new Date();
    } else {
      endDate = new Date(endDate);
    }
    
    const statistics = await BackupLog.getStatistics(startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: {
        period: {
          startDate,
          endDate
        },
        ...statistics
      }
    });
  } catch (error) {
    logger.error(`Error getting verification statistics: ${error.message}`);
    next(new ServerError('Failed to get backup verification statistics'));
  }
};

/**
 * Get verification details for a specific backup
 * @route GET /api/backups/verification/:id
 */
exports.getVerificationDetails = async (req, res, next) => {
  try {
    const log = await BackupLog.findById(req.params.id);
    
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Verification log not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: log
    });
  } catch (error) {
    logger.error(`Error getting verification details: ${error.message}`);
    next(new ServerError('Failed to get backup verification details'));
  }
}; 