/**
 * Document Management System Configuration
 * 
 * This file contains configuration settings for the document management service
 */

const path = require('path');

module.exports = {
  // Storage type: 'local' or 's3'
  storageType: process.env.DOCUMENT_STORAGE_TYPE || 'local',
  
  // Local storage settings
  localStoragePath: process.env.DOCUMENT_LOCAL_PATH || path.join(process.cwd(), 'uploads'),
  
  // Secret key for download token generation
  downloadSecretKey: process.env.DOCUMENT_DOWNLOAD_SECRET || 'aerosuite-document-secret',
  
  // Download token expiration in seconds
  downloadTokenExpiration: 3600, // 1 hour
  
  // S3 storage settings
  s3: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET_NAME || 'aerosuite-documents'
  },
  
  // Upload limits
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE, 10) : 10 * 1024 * 1024, // 10MB
    maxFilesPerRequest: process.env.MAX_FILES_PER_REQUEST ? parseInt(process.env.MAX_FILES_PER_REQUEST, 10) : 10,
    allowedMimeTypes: [
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp',
      
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
      
      // CAD and other engineering files
      'application/dxf',
      'application/dwg',
      'model/stl',
      'model/obj',
      
      // Others - can be restricted as needed
      'application/json',
      'application/xml'
    ]
  },
  
  // Document preview settings
  preview: {
    enabled: true,
    thumbnailWidth: 200,
    thumbnailHeight: 200,
    thumbnailFormat: 'jpeg',
    thumbnailQuality: 80,
    maxPreviewSize: 5 * 1024 * 1024 // 5MB max for preview generation
  },
  
  // Document versioning settings
  versioning: {
    enabled: true,
    maxVersions: 10, // Maximum number of versions to keep per document
    autoCreateVersions: true // Automatically create a new version on update
  },
  
  // Security settings
  security: {
    scanForViruses: process.env.DOCUMENT_VIRUS_SCAN === 'true',
    virusScanCommand: process.env.VIRUS_SCAN_COMMAND || 'clamdscan --fdpass',
    validateFileTypes: true, // Validate file types match their extension
    sanitizeFilenames: true, // Remove special characters from filenames
    requireAuth: true // Require authentication for all document operations
  },
  
  // Cache settings
  cache: {
    enabled: true,
    maxAge: 3600, // Cache max age in seconds
    cacheControl: 'private, max-age=3600'
  },
  
  // Document relationships
  relationships: {
    // Define which entity types can have associated documents
    allowedEntities: [
      'supplier',
      'customer',
      'inspection',
      'component',
      'user',
      'report'
    ]
  }
}; 