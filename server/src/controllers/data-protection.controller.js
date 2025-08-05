/**
 * Data Protection Controller
 * 
 * API endpoints for data protection operations including:
 * - Encryption key rotation
 * - Secure data deletion
 * - Data anonymization for analytics
 */

const dataProtectionService = require('../services/data-protection.service');
const { logSecurityEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');
const { NotFoundError, UnauthorizedError, BadRequestError } = require('../utils/errorHandler');
const mongoose = require('mongoose');

/**
 * Get data protection service status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getStatus(req, res, next) {
  try {
    const status = await dataProtectionService.getStatus();
    res.status(200).json(status);
  } catch (error) {
    next(error);
  }
}

/**
 * Rotate encryption keys for a model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function rotateEncryptionKeys(req, res, next) {
  try {
    const { modelName } = req.params;
    const { newKeyId } = req.body;
    
    // Check if model exists
    if (!mongoose.modelNames().includes(modelName)) {
      throw new NotFoundError(`Model ${modelName} not found`);
    }
    
    const model = mongoose.model(modelName);
    const result = await dataProtectionService.rotateEncryptionKeys(model, newKeyId);
    
    logSecurityEvent(
      'DATA_PROTECTION',
      SEC_EVENT_SEVERITY.INFO,
      `Encryption keys rotated for ${modelName}`,
      { 
        component: 'DataProtectionController', 
        action: 'ROTATE_KEYS',
        modelName,
        userId: req.user?.id,
        userRole: req.user?.role
      }
    );
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Securely delete a document
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function securelyDeleteDocument(req, res, next) {
  try {
    const { modelName, id } = req.params;
    const { softDelete = true } = req.body;
    
    // Check if model exists
    if (!mongoose.modelNames().includes(modelName)) {
      throw new NotFoundError(`Model ${modelName} not found`);
    }
    
    const model = mongoose.model(modelName);
    const result = await dataProtectionService.securelyDeleteDocument(model, id, {
      softDelete,
      auditTrail: true
    });
    
    logSecurityEvent(
      'DATA_PROTECTION',
      SEC_EVENT_SEVERITY.INFO,
      `Document ${softDelete ? 'soft' : 'hard'} deleted from ${modelName}`,
      { 
        component: 'DataProtectionController', 
        action: 'DELETE_DOCUMENT',
        modelName,
        documentId: id,
        userId: req.user?.id,
        userRole: req.user?.role,
        deleteType: softDelete ? 'soft' : 'hard'
      }
    );
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/**
 * Anonymize data for analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function anonymizeData(req, res, next) {
  try {
    const { modelName } = req.params;
    const { query = {}, limit = 100 } = req.body;
    
    // Check if model exists
    if (!mongoose.modelNames().includes(modelName)) {
      throw new NotFoundError(`Model ${modelName} not found`);
    }
    
    const model = mongoose.model(modelName);
    
    // Fetch data with query and limit
    const documents = await model.find(query).limit(limit);
    
    // Anonymize the data
    const anonymizedData = dataProtectionService.prepareDataForAnalytics(documents, modelName);
    
    logSecurityEvent(
      'DATA_PROTECTION',
      SEC_EVENT_SEVERITY.INFO,
      `Data anonymized for analytics from ${modelName}`,
      { 
        component: 'DataProtectionController', 
        action: 'ANONYMIZE_DATA',
        modelName,
        documentCount: documents.length,
        userId: req.user?.id,
        userRole: req.user?.role
      }
    );
    
    res.status(200).json({
      success: true,
      count: anonymizedData.length,
      data: anonymizedData
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Apply encryption to model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function applyEncryptionToModel(req, res, next) {
  try {
    const { modelName } = req.params;
    const { options } = req.body;
    
    // Check if model exists
    if (!mongoose.modelNames().includes(modelName)) {
      throw new NotFoundError(`Model ${modelName} not found`);
    }
    
    const model = mongoose.model(modelName);
    
    // Apply encryption to schema
    dataProtectionService.applyEncryptionToSchema(model.schema, modelName, options);
    
    logSecurityEvent(
      'DATA_PROTECTION',
      SEC_EVENT_SEVERITY.INFO,
      `Encryption applied to ${modelName} schema`,
      { 
        component: 'DataProtectionController', 
        action: 'APPLY_ENCRYPTION',
        modelName,
        userId: req.user?.id,
        userRole: req.user?.role
      }
    );
    
    res.status(200).json({
      success: true,
      message: `Encryption applied to ${modelName} schema`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStatus,
  rotateEncryptionKeys,
  securelyDeleteDocument,
  anonymizeData,
  applyEncryptionToModel
}; 