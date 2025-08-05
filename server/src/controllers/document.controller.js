const fs = require('fs');
const path = require('path');
const documentService = require('../services/document.service');
const Document = require('../models/document.model');
const logger = require('../utils/logger');
const config = require('../config');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../utils/errorHandler');

/**
 * Upload a new document
 * @route POST /api/documents
 * @access Private
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return next(new BadRequestError('No file uploaded'));
    }

    const { title, description, category, tags, entityType, entityId, isPublic, allowedRoles } = req.body;

    // Convert tags string to array if provided
    const parsedTags = tags ? tags.split(',').map(tag => tag.trim()) : [];

    // Store the document using the service
    const storedDocument = await documentService.storeDocument(req.file.path, {
      title,
      description,
      category,
      uploadedBy: req.user.id
    });

    // Create document record in database
    const document = new Document({
      documentId: storedDocument.id,
      originalFilename: storedDocument.originalFilename,
      title: title || storedDocument.originalFilename,
      description,
      mimeType: storedDocument.mimeType,
      size: storedDocument.size,
      storageType: storedDocument.storageType,
      storagePath: storedDocument.storagePath,
      category: category || 'other',
      tags: parsedTags,
      type: getDocumentType(storedDocument.mimeType),
      entity: {
        entityType: entityType || 'none',
        entityId: entityId || null
      },
      access: {
        isPublic: isPublic === 'true',
        allowedRoles: allowedRoles ? allowedRoles.split(',').map(role => role.trim()) : ['admin']
      },
      uploadedBy: req.user.id
    });

    await document.save();

    // Generate thumbnail for images
    const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (imageTypes.includes(storedDocument.mimeType)) {
      try {
        const thumbnail = await documentService.generateThumbnail(storedDocument);
        
        // Update document with thumbnail info
        document.thumbnail = {
          hasThumbnail: true,
          thumbnailId: thumbnail.id
        };
        
        await document.save();
      } catch (thumbnailError) {
        logger.error('Failed to generate thumbnail:', thumbnailError);
        // Continue without thumbnail
      }
    }

    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) logger.error('Failed to delete temp file:', err);
    });

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all documents (with filtering)
 * @route GET /api/documents
 * @access Private
 */
exports.getDocuments = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      entityType,
      entityId,
      search,
      tags,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = { status: 'active' };

    // Filter by category
    if (category) {
      filter.category = category;
    }

    // Filter by entity
    if (entityType) {
      filter['entity.entityType'] = entityType;
      
      if (entityId) {
        filter['entity.entityId'] = entityId;
      }
    }

    // Filter by tags
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.createdAt = {};
      
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Search by title, description, or filename
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { originalFilename: { $regex: search, $options: 'i' } },
        { tags: { $in: [search] } }
      ];
    }

    // Access control - if not admin, only show documents the user has access to
    if (req.user.role !== 'admin') {
      filter.$or = filter.$or || [];
      filter.$or.push(
        { 'access.isPublic': true },
        { uploadedBy: req.user.id },
        { 'access.allowedRoles': req.user.role },
        { 'access.allowedUsers': req.user.id }
      );
    }

    // Sort options
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const documents = await Document.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('uploadedBy', 'firstName lastName email');

    // Get total count for pagination
    const total = await Document.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: documents.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a document by ID
 * @route GET /api/documents/:id
 * @access Private
 */
exports.getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({ 
      documentId: req.params.id,
      status: { $ne: 'deleted' }
    }).populate('uploadedBy', 'firstName lastName email');

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    // Check access permission
    if (!document.hasAccess(req.user)) {
      return next(new ForbiddenError('You do not have permission to access this document'));
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download a document
 * @route GET /api/documents/download/:id
 * @access Private
 */
exports.downloadDocument = async (req, res, next) => {
  try {
    // Find document by ID
    const document = await Document.findOne({ 
      documentId: req.params.id,
      status: { $ne: 'deleted' }
    });

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    // Check access permission
    if (!document.hasAccess(req.user)) {
      return next(new ForbiddenError('You do not have permission to download this document'));
    }

    try {
      // Get document stream
      const fileStream = await documentService.getDocumentStream({
        id: document.documentId,
        storagePath: document.storagePath,
        storageType: document.storageType
      });

      // Set headers
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.originalFilename}"`);
      
      if (config.documents.cache.enabled) {
        res.setHeader('Cache-Control', config.documents.cache.cacheControl);
      }

      // Pipe file to response
      fileStream.pipe(res);
    } catch (streamError) {
      logger.error('Failed to stream document:', streamError);
      return next(new Error('Failed to download document'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Get document preview/thumbnail
 * @route GET /api/documents/preview/:id
 * @access Private
 */
exports.previewDocument = async (req, res, next) => {
  try {
    // Find document by ID
    const document = await Document.findOne({ 
      documentId: req.params.id,
      status: { $ne: 'deleted' }
    });

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    // Check access permission
    if (!document.hasAccess(req.user)) {
      return next(new ForbiddenError('You do not have permission to preview this document'));
    }

    // If document has a thumbnail, serve it
    if (document.thumbnail.hasThumbnail) {
      try {
        // Find thumbnail document
        const thumbnailDoc = await Document.findOne({ 
          documentId: document.thumbnail.thumbnailId
        });
        
        if (!thumbnailDoc) {
          throw new Error('Thumbnail not found');
        }
        
        // Get thumbnail stream
        const fileStream = await documentService.getDocumentStream({
          id: thumbnailDoc.documentId,
          storagePath: thumbnailDoc.storagePath,
          storageType: thumbnailDoc.storageType
        });

        // Set headers
        res.setHeader('Content-Type', thumbnailDoc.mimeType);
        
        if (config.documents.cache.enabled) {
          res.setHeader('Cache-Control', config.documents.cache.cacheControl);
        }

        // Pipe file to response
        fileStream.pipe(res);
      } catch (thumbnailError) {
        logger.error('Failed to stream thumbnail:', thumbnailError);
        return next(new Error('Failed to get document preview'));
      }
    } else if (document.mimeType.startsWith('image/')) {
      // If it's an image but no thumbnail, serve the original
      try {
        const fileStream = await documentService.getDocumentStream({
          id: document.documentId,
          storagePath: document.storagePath,
          storageType: document.storageType
        });

        // Set headers
        res.setHeader('Content-Type', document.mimeType);
        
        if (config.documents.cache.enabled) {
          res.setHeader('Cache-Control', config.documents.cache.cacheControl);
        }

        // Pipe file to response
        fileStream.pipe(res);
      } catch (streamError) {
        logger.error('Failed to stream image:', streamError);
        return next(new Error('Failed to get document preview'));
      }
    } else {
      // For non-image documents with no thumbnail
      return next(new BadRequestError('Preview not available for this document type'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update document metadata
 * @route PUT /api/documents/:id
 * @access Private
 */
exports.updateDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({ 
      documentId: req.params.id,
      status: { $ne: 'deleted' }
    });

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    // Check if user has permission to update
    if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user.id) {
      return next(new ForbiddenError('You do not have permission to update this document'));
    }

    const { title, description, category, tags, isPublic, allowedRoles, allowedUsers, status } = req.body;

    // Update fields if provided
    if (title) document.title = title;
    if (description !== undefined) document.description = description;
    if (category) document.category = category;
    if (tags) document.tags = tags.split(',').map(tag => tag.trim());
    if (isPublic !== undefined) document.access.isPublic = isPublic === 'true';
    if (allowedRoles) document.access.allowedRoles = allowedRoles.split(',').map(role => role.trim());
    if (allowedUsers) document.access.allowedUsers = allowedUsers.split(',').map(user => user.trim());
    if (status && ['active', 'archived'].includes(status)) document.status = status;

    await document.save();

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a document
 * @route DELETE /api/documents/:id
 * @access Private
 */
exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({ documentId: req.params.id });

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    // Check if user has permission to delete
    if (req.user.role !== 'admin' && document.uploadedBy.toString() !== req.user.id) {
      return next(new ForbiddenError('You do not have permission to delete this document'));
    }

    // Soft delete by updating status
    document.status = 'deleted';
    await document.save();

    // If hard delete is requested, actually remove the file
    if (req.query.hard === 'true' && req.user.role === 'admin') {
      try {
        await documentService.deleteDocument({
          id: document.documentId,
          storagePath: document.storagePath,
          storageType: document.storageType
        });
        
        // If document has a thumbnail, delete that too
        if (document.thumbnail.hasThumbnail) {
          const thumbnailDoc = await Document.findOne({ 
            documentId: document.thumbnail.thumbnailId
          });
          
          if (thumbnailDoc) {
            await documentService.deleteDocument({
              id: thumbnailDoc.documentId,
              storagePath: thumbnailDoc.storagePath,
              storageType: thumbnailDoc.storageType
            });
            
            // Delete thumbnail record
            await Document.deleteOne({ documentId: document.thumbnail.thumbnailId });
          }
        }
        
        // Delete document record
        await Document.deleteOne({ documentId: req.params.id });
      } catch (deleteError) {
        logger.error('Failed to hard delete document:', deleteError);
        // Continue with soft delete if hard delete fails
      }
    }

    res.status(200).json({
      success: true,
      data: { message: 'Document deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a ZIP archive of multiple documents
 * @route POST /api/documents/archive
 * @access Private
 */
exports.createArchive = async (req, res, next) => {
  try {
    const { documentIds, archiveName } = req.body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return next(new BadRequestError('Document IDs array is required'));
    }

    // Get all requested documents
    const documents = await Document.find({
      documentId: { $in: documentIds },
      status: { $ne: 'deleted' }
    });

    if (documents.length === 0) {
      return next(new NotFoundError('No valid documents found'));
    }

    // Check permissions for each document
    const unauthorizedDocs = documents.filter(doc => !doc.hasAccess(req.user));
    if (unauthorizedDocs.length > 0) {
      return next(new ForbiddenError('You do not have permission to access one or more of the requested documents'));
    }

    // Convert to format expected by document service
    const docsToArchive = documents.map(doc => ({
      id: doc.documentId,
      originalFilename: doc.originalFilename,
      storagePath: doc.storagePath,
      storageType: doc.storageType
    }));

    // Create archive
    const archive = await documentService.createDocumentsArchive(docsToArchive, archiveName || 'documents.zip');

    // Save archive metadata to database
    const archiveDoc = new Document({
      documentId: archive.id,
      originalFilename: archive.originalFilename,
      title: archiveName || 'Document Archive',
      description: `Archive containing ${documents.length} documents`,
      mimeType: 'application/zip',
      size: archive.size,
      storageType: archive.storageType,
      storagePath: archive.storagePath,
      category: 'other',
      type: 'archive',
      uploadedBy: req.user.id,
      metadata: {
        containsDocuments: documentIds,
        documentCount: documents.length
      }
    });

    await archiveDoc.save();

    res.status(201).json({
      success: true,
      data: archiveDoc
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get document versions
 * @route GET /api/documents/:id/versions
 * @access Private
 */
exports.getDocumentVersions = async (req, res, next) => {
  try {
    const document = await Document.findOne({ 
      documentId: req.params.id,
      status: { $ne: 'deleted' }
    });

    if (!document) {
      return next(new NotFoundError('Document not found'));
    }

    // Check if user has access to the document
    if (!document.hasAccess(req.user)) {
      return next(new ForbiddenError('You do not have permission to access this document'));
    }

    // Get all versions of this document
    const versions = await Document.find({
      'version.originalDocumentId': document.documentId,
      'version.isVersion': true,
      status: { $ne: 'deleted' }
    }).sort({ 'version.versionNumber': -1 })
      .populate('uploadedBy', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: versions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new document version
 * @route POST /api/documents/:id/versions
 * @access Private
 */
exports.createDocumentVersion = async (req, res, next) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return next(new BadRequestError('No file uploaded'));
    }

    const { versionNotes } = req.body;

    // Get original document
    const originalDocument = await Document.findOne({ 
      documentId: req.params.id,
      status: { $ne: 'deleted' }
    });

    if (!originalDocument) {
      return next(new NotFoundError('Original document not found'));
    }

    // Check if user has permission to create version
    if (req.user.role !== 'admin' && originalDocument.uploadedBy.toString() !== req.user.id) {
      return next(new ForbiddenError('You do not have permission to create a new version of this document'));
    }

    // Get latest version number
    const latestVersion = await Document.findOne({
      'version.originalDocumentId': originalDocument.documentId,
      'version.isVersion': true
    }).sort({ 'version.versionNumber': -1 });

    const versionNumber = latestVersion ? latestVersion.version.versionNumber + 1 : 1;

    // Store the new version file
    const storedDocument = await documentService.storeDocument(req.file.path, {
      versionNumber,
      versionNotes,
      originalDocumentId: originalDocument.documentId,
      previousVersionId: latestVersion ? latestVersion.documentId : null
    });

    // Create document record for the version
    const versionDocument = new Document({
      documentId: storedDocument.id,
      originalFilename: originalDocument.originalFilename,
      title: originalDocument.title,
      description: originalDocument.description,
      mimeType: storedDocument.mimeType,
      size: storedDocument.size,
      storageType: storedDocument.storageType,
      storagePath: storedDocument.storagePath,
      category: originalDocument.category,
      tags: originalDocument.tags,
      type: getDocumentType(storedDocument.mimeType),
      version: {
        isVersion: true,
        versionNumber,
        originalDocumentId: originalDocument.documentId,
        previousVersionId: latestVersion ? latestVersion.documentId : null,
        versionNotes: versionNotes || ''
      },
      entity: {
        entityType: originalDocument.entity.entityType,
        entityId: originalDocument.entity.entityId
      },
      access: {
        isPublic: originalDocument.access.isPublic,
        allowedRoles: originalDocument.access.allowedRoles,
        allowedUsers: originalDocument.access.allowedUsers
      },
      uploadedBy: req.user.id
    });

    await versionDocument.save();

    // Clean up the temporary file
    fs.unlink(req.file.path, (err) => {
      if (err) logger.error('Failed to delete temp file:', err);
    });

    res.status(201).json({
      success: true,
      data: versionDocument
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to determine document type from MIME type
 */
function getDocumentType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType === 'application/vnd.ms-excel') return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType === 'application/vnd.ms-powerpoint') return 'presentation';
  if (mimeType.includes('wordprocessing') || mimeType === 'application/msword') return 'document';
  if (mimeType.startsWith('text/')) return 'text';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
  if (mimeType === 'application/dxf' || mimeType === 'application/dwg') return 'cad';
  return 'other';
} 