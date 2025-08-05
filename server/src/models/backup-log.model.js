const mongoose = require('mongoose');

/**
 * BackupLog Schema
 * 
 * Stores the results of backup verification operations
 */
const backupLogSchema = new mongoose.Schema(
  {
    backupLocation: {
      type: String,
      required: [true, 'Backup location is required'],
      trim: true
    },
    verificationDate: {
      type: Date,
      required: [true, 'Verification date is required'],
      default: Date.now
    },
    success: {
      type: Boolean,
      required: [true, 'Success status is required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      comment: 'Duration in seconds'
    },
    details: {
      type: String,
      required: false
    },
    error: {
      type: String,
      required: false
    },
    metadata: {
      type: Object,
      required: false
    }
  },
  { timestamps: true }
);

// Create indexes for better query performance
backupLogSchema.index({ verificationDate: -1 });
backupLogSchema.index({ success: 1 });
backupLogSchema.index({ backupLocation: 1 });

/**
 * Get the most recent verification log
 */
backupLogSchema.statics.getMostRecent = async function() {
  return await this.findOne().sort({ verificationDate: -1 });
};

/**
 * Get all verification logs within a date range
 */
backupLogSchema.statics.getInDateRange = async function(startDate, endDate) {
  return await this.find({
    verificationDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ verificationDate: -1 });
};

/**
 * Get summary statistics for a date range
 */
backupLogSchema.statics.getStatistics = async function(startDate, endDate) {
  const logs = await this.find({
    verificationDate: {
      $gte: startDate,
      $lte: endDate
    }
  });
  
  const totalCount = logs.length;
  const successCount = logs.filter(log => log.success).length;
  const failureCount = totalCount - successCount;
  const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
  
  // Calculate average duration for successful verifications
  const successfulLogs = logs.filter(log => log.success);
  const averageDuration = successfulLogs.length > 0
    ? successfulLogs.reduce((sum, log) => sum + log.duration, 0) / successfulLogs.length
    : 0;
  
  return {
    totalCount,
    successCount,
    failureCount,
    successRate,
    averageDuration
  };
};

/**
 * Get recent failures
 */
backupLogSchema.statics.getRecentFailures = async function(limit = 10) {
  return await this.find({
    success: false
  }).sort({ verificationDate: -1 }).limit(limit);
};

const BackupLog = mongoose.model('BackupLog', backupLogSchema);

module.exports = BackupLog; 