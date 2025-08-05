const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../infrastructure/logger');
const aws = require('aws-sdk');
const { createReadStream, createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const archiver = require('archiver');
const multer = require('multer');
const mime = require('mime-types');
const crypto = require('crypto');
const sharp = require('sharp');

/**
 * Document Management Service
 * 
 * Handles document storage, retrieval, and organization
 * Supports multiple storage backends (local filesystem, S3)
 */
class DocumentService {
  constructor() {
    this.initialized = false;
    this.storageType = config.documents?.storageType || 'local';
    this.s3Client = null;
    this.localStoragePath = config.documents?.localStoragePath || path.join(process.cwd(), 'uploads');
    
    this.initialize();
  }

  /**
   * Initialize the document service
   */
  initialize() {
    try {
      // Create local storage directory if it doesn't exist
      if (this.storageType === 'local') {
        if (!fs.existsSync(this.localStoragePath)) {
          fs.mkdirSync(this.localStoragePath, { recursive: true });
        }
      }
      
      // Initialize S3 client if using S3 storage
      if (this.storageType === 's3') {
        if (!config.documents?.s3) {
          logger.error('S3 configuration missing');
          return;
        }
        
        this.s3Client = new aws.S3({
          accessKeyId: config.documents.s3.accessKeyId,
          secretAccessKey: config.documents.s3.secretAccessKey,
          region: config.documents.s3.region
        });
        
        this.s3Bucket = config.documents.s3.bucket;
      }
      
      this.initialized = true;
      logger.info(`Document service initialized with ${this.storageType} storage`);
    } catch (error) {
      logger.error('Failed to initialize document service:', error);
    }
  }

  /**
   * Create a multer upload middleware for document uploads
   * @param {Object} options - Upload options
   * @returns {Object} - Multer middleware
   */
  getUploadMiddleware(options = {}) {
    const {
      fieldName = 'document',
      maxFileSize = 10 * 1024 * 1024, // 10MB
      allowedMimeTypes = null,
      destination = null,
      fileNameGenerator = null
    } = options;

    // Configure storage
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = destination || path.join(this.localStoragePath, 'temp');
        
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        if (fileNameGenerator) {
          return cb(null, fileNameGenerator(req, file));
        }
        
        // Default filename generator
        const uniqueFilename = `${Date.now()}-${uuidv4()}`;
        const ext = path.extname(file.originalname) || `.${mime.extension(file.mimetype) || 'bin'}`;
        cb(null, `${uniqueFilename}${ext}`);
      }
    });

    // Configure file filter
    const fileFilter = (req, file, cb) => {
      if (!allowedMimeTypes || allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: maxFileSize
      }
    });
  }

  /**
   * Store a document from a local file path
   * @param {string} filePath - Path to the file
   * @param {Object} metadata - Document metadata
   * @returns {Promise<Object>} - Stored document info
   */
  async storeDocument(filePath, metadata = {}) {
    if (!this.initialized) {
      throw new Error('Document service not initialized');
    }

    try {
      const fileStats = await fs.promises.stat(filePath);
      const originalFilename = path.basename(filePath);
      const fileExt = path.extname(originalFilename);
      const mimeType = mime.lookup(fileExt) || 'application/octet-stream';
      
      // Generate a unique document ID
      const documentId = uuidv4();
      
      // Create document record
      const document = {
        id: documentId,
        originalFilename,
        size: fileStats.size,
        mimeType,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString()
        }
      };

      // Store file in the selected storage
      if (this.storageType === 'local') {
        // Create directory structure based on date to organize files
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const storagePath = path.join(this.localStoragePath, String(year), month);
        
        if (!fs.existsSync(storagePath)) {
          fs.mkdirSync(storagePath, { recursive: true });
        }
        
        // Generate target path with document ID
        const targetPath = path.join(storagePath, `${documentId}${fileExt}`);
        
        // Copy file to storage location
        await fs.promises.copyFile(filePath, targetPath);
        
        // Add storage details to document record
        document.storagePath = targetPath;
        document.storageType = 'local';
      } else if (this.storageType === 's3') {
        // Create key with date-based prefix
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const key = `documents/${year}/${month}/${documentId}${fileExt}`;
        
        // Upload to S3
        const fileStream = fs.createReadStream(filePath);
        const uploadParams = {
          Bucket: this.s3Bucket,
          Key: key,
          Body: fileStream,
          ContentType: mimeType,
          Metadata: {
            originalFilename,
            documentId
          }
        };
        
        await this.s3Client.upload(uploadParams).promise();
        
        // Add storage details to document record
        document.storagePath = key;
        document.storageType = 's3';
      }
      
      return document;
    } catch (error) {
      logger.error('Failed to store document:', error);
      throw error;
    }
  }

  /**
   * Store a document from a buffer
   * @param {Buffer} buffer - File buffer
   * @param {string} originalFilename - Original filename
   * @param {string} mimeType - MIME type
   * @param {Object} metadata - Document metadata
   * @returns {Promise<Object>} - Stored document info
   */
  async storeDocumentFromBuffer(buffer, originalFilename, mimeType, metadata = {}) {
    if (!this.initialized) {
      throw new Error('Document service not initialized');
    }

    try {
      const fileExt = path.extname(originalFilename);
      
      // Generate a unique document ID
      const documentId = uuidv4();
      
      // Create document record
      const document = {
        id: documentId,
        originalFilename,
        size: buffer.length,
        mimeType,
        metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString()
        }
      };

      // Store file in the selected storage
      if (this.storageType === 'local') {
        // Create directory structure based on date to organize files
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const storagePath = path.join(this.localStoragePath, String(year), month);
        
        if (!fs.existsSync(storagePath)) {
          fs.mkdirSync(storagePath, { recursive: true });
        }
        
        // Generate target path with document ID
        const targetPath = path.join(storagePath, `${documentId}${fileExt}`);
        
        // Write buffer to file
        await fs.promises.writeFile(targetPath, buffer);
        
        // Add storage details to document record
        document.storagePath = targetPath;
        document.storageType = 'local';
      } else if (this.storageType === 's3') {
        // Create key with date-based prefix
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const key = `documents/${year}/${month}/${documentId}${fileExt}`;
        
        // Upload to S3
        const uploadParams = {
          Bucket: this.s3Bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
          Metadata: {
            originalFilename,
            documentId
          }
        };
        
        await this.s3Client.upload(uploadParams).promise();
        
        // Add storage details to document record
        document.storagePath = key;
        document.storageType = 's3';
      }
      
      return document;
    } catch (error) {
      logger.error('Failed to store document from buffer:', error);
      throw error;
    }
  }

  /**
   * Get a document as a readable stream
   * @param {Object} document - Document object with storage details
   * @returns {Promise<ReadableStream>} - Document content stream
   */
  async getDocumentStream(document) {
    if (!this.initialized) {
      throw new Error('Document service not initialized');
    }

    try {
      if (document.storageType === 'local') {
        // Return file read stream
        return fs.createReadStream(document.storagePath);
      } else if (document.storageType === 's3') {
        // Return S3 object read stream
        const params = {
          Bucket: this.s3Bucket,
          Key: document.storagePath
        };
        
        return this.s3Client.getObject(params).createReadStream();
      }
      
      throw new Error(`Unsupported storage type: ${document.storageType}`);
    } catch (error) {
      logger.error('Failed to get document stream:', error);
      throw error;
    }
  }

  /**
   * Get a document as a buffer
   * @param {Object} document - Document object with storage details
   * @returns {Promise<Buffer>} - Document content as buffer
   */
  async getDocumentBuffer(document) {
    if (!this.initialized) {
      throw new Error('Document service not initialized');
    }

    try {
      if (document.storageType === 'local') {
        // Read file into buffer
        return await fs.promises.readFile(document.storagePath);
      } else if (document.storageType === 's3') {
        // Get S3 object
        const params = {
          Bucket: this.s3Bucket,
          Key: document.storagePath
        };
        
        const result = await this.s3Client.getObject(params).promise();
        return Buffer.from(result.Body);
      }
      
      throw new Error(`Unsupported storage type: ${document.storageType}`);
    } catch (error) {
      logger.error('Failed to get document buffer:', error);
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {Object} document - Document object with storage details
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async deleteDocument(document) {
    if (!this.initialized) {
      throw new Error('Document service not initialized');
    }

    try {
      if (document.storageType === 'local') {
        // Delete local file
        await fs.promises.unlink(document.storagePath);
      } else if (document.storageType === 's3') {
        // Delete S3 object
        const params = {
          Bucket: this.s3Bucket,
          Key: document.storagePath
        };
        
        await this.s3Client.deleteObject(params).promise();
      } else {
        throw new Error(`Unsupported storage type: ${document.storageType}`);
      }
      
      return true;
    } catch (error) {
      logger.error('Failed to delete document:', error);
      throw error;
    }
  }

  /**
   * Generate a download URL for a document
   * @param {Object} document - Document object with storage details
   * @param {number} expiresInSeconds - URL expiration time in seconds (S3 only)
   * @returns {Promise<string>} - Download URL
   */
  async getDownloadUrl(document, expiresInSeconds = 3600) {
    if (!this.initialized) {
      throw new Error('Document service not initialized');
    }

    try {
      if (document.storageType === 's3') {
        // Generate S3 presigned URL
        const params = {
          Bucket: this.s3Bucket,
          Key: document.storagePath,
          Expires: expiresInSeconds,
          ResponseContentDisposition: `attachment; filename="${document.originalFilename}"`,
          ResponseContentType: document.mimeType
        };
        
        return this.s3Client.getSignedUrl('getObject', params);
      }
      
      // For local storage, we return a token that will be resolved to the file
      // in the controller. This prevents direct access to the file system.
      const token = crypto
        .createHash('sha256')
        .update(`${document.id}:${Date.now()}:${config.documents.downloadSecretKey || 'secret'}`)
        .digest('hex');
      
      return `/api/documents/download/${document.id}?token=${token}`;
    } catch (error) {
      logger.error('Failed to generate download URL:', error);
      throw error;
    }
  }

  /**
   * Create a ZIP archive of multiple documents
   * @param {Array<Object>} documents - Array of document objects
   * @param {string} zipName - Name for the ZIP file
   * @returns {Promise<Object>} - ZIP file document object
   */
  async createDocumentsArchive(documents, zipName = 'documents.zip') {
    if (!this.initialized) {
      throw new Error('Document service not initialized');
    }

    if (!documents || !documents.length) {
      throw new Error('No documents provided for archive');
    }

    try {
      // Create temp directory for the ZIP file
      const tempDir = path.join(this.localStoragePath, 'temp');
      
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Generate a unique ZIP file path
      const zipPath = path.join(tempDir, `${Date.now()}-${uuidv4()}-${zipName}`);
      
      // Create a ZIP archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Compression level
      });
      
      const output = createWriteStream(zipPath);
      
      // Promise to track completion
      const archivePromise = new Promise((resolve, reject) => {
        output.on('close', resolve);
        archive.on('error', reject);
      });
      
      // Pipe archive data to the file
      archive.pipe(output);
      
      // Add each document to the archive
      for (const document of documents) {
        const stream = await this.getDocumentStream(document);
        archive.append(stream, { name: document.originalFilename });
      }
      
      // Finalize the archive
      await archive.finalize();
      
      // Wait for the archive to complete
      await archivePromise;
      
      // Store the ZIP file as a document
      const zipDocument = await this.storeDocument(zipPath, {
        type: 'archive',
        documentCount: documents.length,
        documents: documents.map(doc => doc.id)
      });
      
      // Delete the temporary ZIP file
      await fs.promises.unlink(zipPath);
      
      return zipDocument;
    } catch (error) {
      logger.error('Failed to create documents archive:', error);
      throw error;
    }
  }

  /**
   * Generate a thumbnail for an image document
   * @param {Object} document - Document object
   * @param {Object} options - Thumbnail options
   * @returns {Promise<Object>} - Thumbnail document object
   */
  async generateThumbnail(document, options = {}) {
    if (!this.initialized) {
      throw new Error('Document service not initialized');
    }

    const {
      width = 200,
      height = 200,
      format = 'jpeg',
      quality = 80
    } = options;

    // Check if document is an image
    const imageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/tiff'
    ];

    if (!imageTypes.includes(document.mimeType)) {
      throw new Error('Thumbnails can only be generated for image documents');
    }

    try {
      // Get document buffer
      const buffer = await this.getDocumentBuffer(document);
      
      // Generate thumbnail with sharp
      const thumbnailBuffer = await sharp(buffer)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .toFormat(format, { quality })
        .toBuffer();
      
      // Store thumbnail as a new document
      const thumbnailDocument = await this.storeDocumentFromBuffer(
        thumbnailBuffer,
        `thumb_${document.originalFilename}`,
        `image/${format}`,
        {
          type: 'thumbnail',
          originalDocumentId: document.id,
          originalSize: document.size,
          width,
          height,
          format,
          quality
        }
      );
      
      return thumbnailDocument;
    } catch (error) {
      logger.error('Failed to generate thumbnail:', error);
      throw error;
    }
  }

  /**
   * Create document version
   * @param {Object} originalDocument - Original document object
   * @param {string} filePath - Path to the new version file
   * @param {Object} metadata - Version metadata
   * @returns {Promise<Object>} - New version document object
   */
  async createDocumentVersion(originalDocument, filePath, metadata = {}) {
    if (!this.initialized) {
      throw new Error('Document service not initialized');
    }

    try {
      const fileStats = await fs.promises.stat(filePath);
      const fileExt = path.extname(originalDocument.originalFilename);
      const mimeType = mime.lookup(fileExt) || 'application/octet-stream';
      
      // Create document version
      const versionDocument = await this.storeDocument(filePath, {
        type: 'version',
        originalDocumentId: originalDocument.id,
        versionNumber: metadata.versionNumber || 1,
        versionNotes: metadata.versionNotes || '',
        previousVersionId: metadata.previousVersionId || null,
        ...metadata
      });
      
      return versionDocument;
    } catch (error) {
      logger.error('Failed to create document version:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const documentService = new DocumentService();

module.exports = documentService; 