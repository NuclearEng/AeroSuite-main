/**
 * Privacy Service
 * 
 * This service provides functionality for user data privacy management, including:
 * - Data export
 * - Account deletion and anonymization
 * - Consent management
 * 
 * Part of SEC10: User data privacy compliance
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const User = require('../models/user.model');
const Inspection = require('../models/inspection.model');
const CustomerActivity = require('../models/customerActivity.model');
const logger = require('../infrastructure/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a user data export package
 * @param {String} userId - The user ID
 * @returns {Promise<String>} - Path to the exported data file
 */
const exportUserData = async (userId) => {
  try {
    // Get user data
    const user = await User.findById(userId).lean();
    if (!user) {
      throw new Error('User not found');
    }

    // Create temporary directory for export
    const exportDir = path.join(__dirname, '../../temp', `export-${userId}-${Date.now()}`);
    fs.mkdirSync(exportDir, { recursive: true });

    // Create a file to stream archive data to
    const exportPath = path.join(exportDir, `user-data-export-${userId}.zip`);
    const output = fs.createWriteStream(exportPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Listen for all archive data to be written
    const exportPromise = new Promise((resolve, reject) => {
      output.on('close', () => resolve(exportPath));
      archive.on('error', err => reject(err));
    });

    // Pipe archive data to the file
    archive.pipe(output);

    // Add user account data (excluding sensitive fields)
    const userData = { ...user };
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpires;
    delete userData.emailVerificationToken;
    delete userData.emailVerificationExpires;
    delete userData.twoFactorAuth.secret;
    delete userData.twoFactorAuth.tempSecret;
    delete userData.twoFactorAuth.backupCodes;

    archive.append(JSON.stringify(userData, null, 2), { name: 'account-data.json' });

    // Get user's inspections
    const inspections = await Inspection.find({ 
      $or: [
        { createdBy: userId },
        { inspectedBy: userId }
      ]
    }).lean();

    if (inspections.length > 0) {
      archive.append(
        JSON.stringify(inspections, null, 2), 
        { name: 'inspections.json' }
      );
    }

    // Get user activity
    const activities = await CustomerActivity.find({ performedBy: userId }).lean();
    
    if (activities.length > 0) {
      archive.append(
        JSON.stringify(activities, null, 2), 
        { name: 'activities.json' }
      );
    }

    // Add readme file
    const readme = `
      # AeroSuite User Data Export
      
      Date of export: ${new Date().toISOString()}
      User ID: ${userId}
      
      ## Contents
      
      - account-data.json: Your account information
      - inspections.json: Inspections you have created or conducted
      - activities.json: Record of your activities in the system
      
      For questions about this data export, please contact privacy@aerosuite.example.com
    `;
    
    archive.append(readme, { name: 'README.md' });

    // Finalize the archive
    await archive.finalize();
    
    // Log the export
    logger.info(`User data exported for user ${userId}`);
    
    return await exportPromise;
  } catch (error) {
    logger.error(`Error exporting user data: ${error.message}`);
    throw error;
  }
};

/**
 * Delete (anonymize) a user account
 * @param {String} userId - The user ID
 * @param {Boolean} hardDelete - Whether to completely remove the user (default: false)
 * @returns {Promise<Object>} - Result of the operation
 */
const deleteUserAccount = async (userId, hardDelete = false) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    if (hardDelete) {
      // Perform hard deletion (complete removal)
      await User.deleteOne({ _id: userId }).session(session);
      
      // Delete associated data
      await CustomerActivity.deleteMany({ performedBy: userId }).session(session);
      
      // For inspections, we don't delete but nullify the references
      await Inspection.updateMany(
        { createdBy: userId },
        { $set: { createdBy: null } }
      ).session(session);
      
      await Inspection.updateMany(
        { inspectedBy: userId },
        { $set: { inspectedBy: null } }
      ).session(session);
    } else {
      // Perform soft deletion (anonymization)
      const anonymousId = `deleted-${uuidv4()}`;
      
      // Anonymize user data
      user.email = `${anonymousId}@deleted.aerosuite.local`;
      user.firstName = 'Deleted';
      user.lastName = 'User';
      user.phoneNumber = null;
      user.isActive = false;
      user.avatar = 'default-avatar.png';
      user.twoFactorAuth = {
        enabled: false,
        method: 'app'
      };
      user.notificationPreferences = {
        theme: 'system',
        notifications: {
          email: false,
          inApp: false
        },
        smsNotifications: {
          enabled: false
        }
      };
      
      // Keep only minimal data for compliance and reference
      user._deletedAt = new Date();
      user._anonymized = true;
      
      await user.save({ session });
      
      // Anonymize activity records
      await CustomerActivity.updateMany(
        { performedBy: userId },
        { $set: { performedBy: null } }
      ).session(session);
    }
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    logger.info(`User account ${hardDelete ? 'deleted' : 'anonymized'} for user ${userId}`);
    
    return {
      success: true,
      message: `User account ${hardDelete ? 'deleted' : 'anonymized'} successfully`
    };
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    
    logger.error(`Error deleting user account: ${error.message}`);
    throw error;
  }
};

/**
 * Manage user consent settings
 * @param {String} userId - The user ID
 * @param {Object} consentSettings - The consent settings to update
 * @returns {Promise<Object>} - Updated consent settings
 */
const updateUserConsent = async (userId, consentSettings) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Initialize consent object if it doesn't exist
    if (!user.privacyConsent) {
      user.privacyConsent = {};
    }
    
    // Update consent settings
    Object.keys(consentSettings).forEach(key => {
      user.privacyConsent[key] = {
        ...consentSettings[key],
        timestamp: new Date()
      };
    });
    
    // Save user with updated consent
    await user.save();
    
    logger.info(`User consent updated for user ${userId}`);
    
    return user.privacyConsent;
  } catch (error) {
    logger.error(`Error updating user consent: ${error.message}`);
    throw error;
  }
};

/**
 * Get current user consent settings
 * @param {String} userId - The user ID
 * @returns {Promise<Object>} - Current consent settings
 */
const getUserConsent = async (userId) => {
  try {
    const user = await User.findById(userId).select('privacyConsent').lean();
    if (!user) {
      throw new Error('User not found');
    }
    
    return user.privacyConsent || {};
  } catch (error) {
    logger.error(`Error getting user consent: ${error.message}`);
    throw error;
  }
};

/**
 * Clean up old export files
 * @param {Number} maxAge - Maximum age in milliseconds (default: 24 hours)
 */
const cleanupExports = async (maxAge = 24 * 60 * 60 * 1000) => {
  try {
    const tempDir = path.join(__dirname, '../../temp');
    const files = fs.readdirSync(tempDir);
    
    const now = Date.now();
    
    files.forEach(file => {
      if (file.startsWith('export-')) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        // Delete files older than maxAge
        if (now - stats.mtimeMs > maxAge) {
          if (fs.lstatSync(filePath).isDirectory()) {
            fs.rmdirSync(filePath, { recursive: true });
          } else {
            fs.unlinkSync(filePath);
          }
          
          logger.info(`Cleaned up old export file: ${file}`);
        }
      }
    });
  } catch (error) {
    logger.error(`Error cleaning up exports: ${error.message}`);
  }
};

module.exports = {
  exportUserData,
  deleteUserAccount,
  updateUserConsent,
  getUserConsent,
  cleanupExports
}; 