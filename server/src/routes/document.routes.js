const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const documentService = require('../services/document.service');
const authMiddleware = require('../middleware/auth.middleware');

// Configure upload middleware
const uploadMiddleware = documentService.getUploadMiddleware({
  fieldName: 'document',
  maxFileSize: 20 * 1024 * 1024 // 20MB
}).single('document');

const multiUploadMiddleware = documentService.getUploadMiddleware({
  fieldName: 'documents',
  maxFileSize: 20 * 1024 * 1024 // 20MB
}).array('documents', 10);

/**
 * @route   POST /api/documents
 * @desc    Upload a new document
 * @access  Private
 */
router.post(
  '/',
  authMiddleware.protect,
  uploadMiddleware,
  documentController.uploadDocument
);

/**
 * @route   GET /api/documents
 * @desc    Get all documents (with filtering)
 * @access  Private
 */
router.get(
  '/',
  authMiddleware.protect,
  documentController.getDocuments
);

/**
 * @route   GET /api/documents/:id
 * @desc    Get a document by ID
 * @access  Private
 */
router.get(
  '/:id',
  authMiddleware.protect,
  documentController.getDocument
);

/**
 * @route   GET /api/documents/download/:id
 * @desc    Download a document
 * @access  Private
 */
router.get(
  '/download/:id',
  authMiddleware.protect,
  documentController.downloadDocument
);

/**
 * @route   GET /api/documents/preview/:id
 * @desc    Get document preview/thumbnail
 * @access  Private
 */
router.get(
  '/preview/:id',
  authMiddleware.protect,
  documentController.previewDocument
);

/**
 * @route   PUT /api/documents/:id
 * @desc    Update document metadata
 * @access  Private
 */
router.put(
  '/:id',
  authMiddleware.protect,
  documentController.updateDocument
);

/**
 * @route   DELETE /api/documents/:id
 * @desc    Delete a document
 * @access  Private
 */
router.delete(
  '/:id',
  authMiddleware.protect,
  documentController.deleteDocument
);

/**
 * @route   POST /api/documents/archive
 * @desc    Create a ZIP archive of multiple documents
 * @access  Private
 */
router.post(
  '/archive',
  authMiddleware.protect,
  documentController.createArchive
);

/**
 * @route   GET /api/documents/:id/versions
 * @desc    Get document versions
 * @access  Private
 */
router.get(
  '/:id/versions',
  authMiddleware.protect,
  documentController.getDocumentVersions
);

/**
 * @route   POST /api/documents/:id/versions
 * @desc    Create a new document version
 * @access  Private
 */
router.post(
  '/:id/versions',
  authMiddleware.protect,
  uploadMiddleware,
  documentController.createDocumentVersion
);

/**
 * @route   POST /api/documents/bulk
 * @desc    Upload multiple documents at once
 * @access  Private
 */
router.post(
  '/bulk',
  authMiddleware.protect,
  multiUploadMiddleware,
  (req, res, next) => {
    // This route needs to be implemented in the controller
    res.status(501).json({
      success: false,
      error: 'Not implemented yet'
    });
  }
);

/**
 * @route   POST /api/documents/entity/:entityType/:entityId
 * @desc    Upload document for a specific entity
 * @access  Private
 */
router.post(
  '/entity/:entityType/:entityId',
  authMiddleware.protect,
  uploadMiddleware,
  (req, res, next) => {
    // Add entity info to request body
    req.body.entityType = req.params.entityType;
    req.body.entityId = req.params.entityId;
    
    // Pass to the regular upload handler
    documentController.uploadDocument(req, res, next);
  }
);

/**
 * @route   GET /api/documents/entity/:entityType/:entityId
 * @desc    Get documents for a specific entity
 * @access  Private
 */
router.get(
  '/entity/:entityType/:entityId',
  authMiddleware.protect,
  (req, res, next) => {
    // Add entity filter to query parameters
    req.query.entityType = req.params.entityType;
    req.query.entityId = req.params.entityId;
    
    // Pass to the regular documents list handler
    documentController.getDocuments(req, res, next);
  }
);

module.exports = router; 