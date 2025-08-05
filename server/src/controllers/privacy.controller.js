/**
 * Privacy Controller
 * 
 * This controller handles API requests related to user data privacy, including:
 * - Data export
 * - Account deletion
 * - Consent management
 * 
 * Part of SEC10: User data privacy compliance
 */

const fs = require('fs');
const path = require('path');
const { BadRequestError, NotFoundError, UnauthorizedError } = require('../utils/errorHandler');
const privacyService = require('../services/privacy.service');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Export user data in a GDPR-compliant format
 * @route POST /api/privacy/export-data
 * @access Private
 */
exports.exportUserData = async (req, res, next) => {
  try {
    // Only allow users to export their own data, or admins to export any user's data
    const userId = req.body.userId || req.user.id;
    
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return next(new UnauthorizedError('You are not authorized to export this user\'s data'));
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    // Generate data export
    const exportPath = await privacyService.exportUserData(userId);
    
    // Send file or download link
    if (req.query.directDownload === 'true') {
      // Send file directly
      res.download(exportPath, `user-data-export-${userId}.zip`, (err) => {
        if (err) {
          logger.error(`Error sending export file: ${err.message}`);
          // Don't delete the file on error so it can be retried
        } else {
          // Delete the file after sending
          fs.unlink(exportPath, (unlinkErr) => {
            if (unlinkErr) {
              logger.error(`Error deleting export file: ${unlinkErr.message}`);
            }
          });
        }
      });
    } else {
      // Generate a temporary download link (valid for 1 hour)
      const downloadToken = Buffer.from(`${userId}:${Date.now() + 3600000}:${path.basename(exportPath)}`).toString('base64');
      
      res.status(200).json({
        success: true,
        message: 'Data export generated successfully',
        downloadLink: `/api/privacy/download/${downloadToken}`
      });
    }
  } catch (error) {
    logger.error(`Error in exportUserData: ${error.message}`);
    next(error);
  }
};

/**
 * Download user data export
 * @route GET /api/privacy/download/:token
 * @access Private
 */
exports.downloadExport = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return next(new BadRequestError('Download token is required'));
    }
    
    // Decode and validate token
    const tokenData = Buffer.from(token, 'base64').toString().split(':');
    if (tokenData.length !== 3) {
      return next(new BadRequestError('Invalid download token'));
    }
    
    const [userId, expiryTime, filename] = tokenData;
    
    // Check if token has expired
    if (Date.now() > parseInt(expiryTime, 10)) {
      return next(new BadRequestError('Download link has expired'));
    }
    
    // Only allow users to download their own data, or admins to download any user's data
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return next(new UnauthorizedError('You are not authorized to download this data'));
    }
    
    // Find the export file
    const exportDir = path.join(__dirname, '../../temp');
    const exportPath = path.join(exportDir, filename);
    
    if (!fs.existsSync(exportPath)) {
      return next(new NotFoundError('Export file not found or has been deleted'));
    }
    
    // Send file
    res.download(exportPath, `user-data-export-${userId}.zip`, (err) => {
      if (err) {
        logger.error(`Error sending export file: ${err.message}`);
      } else {
        // Delete the file after sending
        fs.unlink(exportPath, (unlinkErr) => {
          if (unlinkErr) {
            logger.error(`Error deleting export file: ${unlinkErr.message}`);
          }
        });
      }
    });
  } catch (error) {
    logger.error(`Error in downloadExport: ${error.message}`);
    next(error);
  }
};

/**
 * Request account deletion
 * @route DELETE /api/privacy/account
 * @access Private
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    // Only allow users to delete their own account, or admins to delete any account
    const userId = req.body.userId || req.user.id;
    
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return next(new UnauthorizedError('You are not authorized to delete this account'));
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    // Admin users can perform hard deletes if specified
    const hardDelete = req.user.role === 'admin' && req.body.hardDelete === true;
    
    // Delete account (anonymize by default)
    const result = await privacyService.deleteUserAccount(userId, hardDelete);
    
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error) {
    logger.error(`Error in deleteAccount: ${error.message}`);
    next(error);
  }
};

/**
 * Update user consent settings
 * @route PUT /api/privacy/consent
 * @access Private
 */
exports.updateConsent = async (req, res, next) => {
  try {
    // Only allow users to update their own consent, or admins to update any user's consent
    const userId = req.body.userId || req.user.id;
    
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return next(new UnauthorizedError('You are not authorized to update consent for this user'));
    }
    
    // Validate consent data
    if (!req.body.consentSettings || typeof req.body.consentSettings !== 'object') {
      return next(new BadRequestError('Invalid consent settings'));
    }
    
    // Update consent
    const updatedConsent = await privacyService.updateUserConsent(userId, req.body.consentSettings);
    
    res.status(200).json({
      success: true,
      message: 'Consent settings updated successfully',
      data: updatedConsent
    });
  } catch (error) {
    logger.error(`Error in updateConsent: ${error.message}`);
    next(error);
  }
};

/**
 * Get user consent settings
 * @route GET /api/privacy/consent
 * @access Private
 */
exports.getConsent = async (req, res, next) => {
  try {
    // Only allow users to get their own consent, or admins to get any user's consent
    const userId = req.query.userId || req.user.id;
    
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return next(new UnauthorizedError('You are not authorized to view consent for this user'));
    }
    
    // Get consent
    const consent = await privacyService.getUserConsent(userId);
    
    res.status(200).json({
      success: true,
      data: consent
    });
  } catch (error) {
    logger.error(`Error in getConsent: ${error.message}`);
    next(error);
  }
};

/**
 * Get privacy policy and terms
 * @route GET /api/privacy/policy
 * @access Public
 */
exports.getPrivacyPolicy = async (req, res, next) => {
  try {
    const policyPath = path.join(__dirname, '../docs/privacy-policy.md');
    const retentionPath = path.join(__dirname, '../docs/data-retention-policy.md');
    
    let policyContent = 'Privacy policy not found';
    let retentionContent = 'Data retention policy not found';
    
    if (fs.existsSync(policyPath)) {
      policyContent = fs.readFileSync(policyPath, 'utf8');
    }
    
    if (fs.existsSync(retentionPath)) {
      retentionContent = fs.readFileSync(retentionPath, 'utf8');
    }
    
    res.status(200).json({
      success: true,
      data: {
        privacyPolicy: policyContent,
        dataRetentionPolicy: retentionContent,
        version: 'v1.0',
        lastUpdated: '2023-05-15'
      }
    });
  } catch (error) {
    logger.error(`Error in getPrivacyPolicy: ${error.message}`);
    next(error);
  }
}; 