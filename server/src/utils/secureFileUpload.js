const path = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;
const fileType = require('file-type');
const logger = require('./logger');

/**
 * Secure file upload utility with comprehensive security checks
 */
class SecureFileUpload {
  constructor(options = {}) {
    this.allowedMimeTypes = options.allowedMimeTypes || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB default
    this.uploadDir = options.uploadDir || path.join(process.cwd(), 'uploads');
    this.quarantineDir = path.join(this.uploadDir, 'quarantine');
  }

  /**
   * Validate and sanitize filename
   * @param {string} filename - Original filename
   * @returns {string} Sanitized filename
   */
  sanitizeFilename(filename) {
    // Remove any path traversal attempts
    const basename = path.basename(filename);
    
    // Remove special characters and spaces
    const sanitized = basename
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .toLowerCase();
    
    // Ensure filename is not too long
    const maxLength = 255;
    if (sanitized.length > maxLength) {
      const ext = path.extname(sanitized);
      const name = path.basename(sanitized, ext);
      return name.substring(0, maxLength - ext.length - 1) + ext;
    }
    
    return sanitized;
  }

  /**
   * Generate secure filename with UUID
   * @param {string} originalFilename - Original filename
   * @returns {string} Secure filename
   */
  generateSecureFilename(originalFilename) {
    const ext = path.extname(originalFilename).toLowerCase();
    const uuid = crypto.randomUUID();
    const timestamp = Date.now();
    return `${timestamp}-${uuid}${ext}`;
  }

  /**
   * Validate file type by checking magic bytes
   * @param {Buffer} buffer - File buffer
   * @param {string} expectedMimeType - Expected MIME type
   * @returns {Promise<boolean>} Is valid
   */
  async validateFileType(buffer, expectedMimeType) {
    try {
      const fileTypeResult = await fileType.fromBuffer(buffer);
      
      if (!fileTypeResult) {
        logger.warn('Could not determine file type from magic bytes');
        return false;
      }
      
      // Check if detected MIME type matches expected
      if (fileTypeResult.mime !== expectedMimeType) {
        logger.warn('File type mismatch', {
          expected: expectedMimeType,
          detected: fileTypeResult.mime
        });
        return false;
      }
      
      return true;
    } catch (error) {
      logger.error('Error validating file type:', error);
      return false;
    }
  }

  /**
   * Scan file for malware patterns (basic implementation)
   * @param {Buffer} buffer - File buffer
   * @returns {Promise<boolean>} Is safe
   */
  async scanForMalware(buffer) {
    // Basic pattern matching for common malware signatures
    const malwarePatterns = [
      /MZ[\s\S]{58}PE\u0000\u0000/, // PE executable (human-readable fallback)
      /<script[^>]*>[\s\S]*?<\/script>/gi, // Script tags
      /eval\s*\(/gi, // Eval functions
      /\bexec\s*\(/gi, // Exec functions
      /\bsystem\s*\(/gi, // System calls
      /%3Cscript/gi, // URL encoded script
      /javascript:/gi, // JavaScript protocol
      /vbscript:/gi // VBScript protocol
    ];
    
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1024 * 10)); // Check first 10KB
    
    for (const pattern of malwarePatterns) {
      if (pattern.test(content)) {
        logger.warn('Potential malware pattern detected', {
          pattern: pattern.toString()
        });
        return false;
      }
    }
    
    return true;
  }

  /**
   * Check if file size is within limits
   * @param {number} size - File size in bytes
   * @returns {boolean} Is valid
   */
  validateFileSize(size) {
    if (size > this.maxFileSize) {
      logger.warn('File size exceeds maximum allowed', {
        size,
        maxSize: this.maxFileSize
      });
      return false;
    }
    return true;
  }

  /**
   * Validate MIME type against whitelist
   * @param {string} mimeType - MIME type to validate
   * @returns {boolean} Is allowed
   */
  validateMimeType(mimeType) {
    if (!this.allowedMimeTypes.includes(mimeType)) {
      logger.warn('MIME type not allowed', {
        mimeType,
        allowed: this.allowedMimeTypes
      });
      return false;
    }
    return true;
  }

  /**
   * Ensure upload directory exists with proper permissions
   * @param {string} dir - Directory path
   */
  async ensureUploadDirectory(dir) {
    try {
      await fs.mkdir(dir, { recursive: true, mode: 0o750 });
    } catch (error) {
      logger.error('Error creating upload directory:', error);
      throw error;
    }
  }

  /**
   * Process and validate uploaded file
   * @param {Object} file - Multer file object
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed file info
   */
  async processUploadedFile(file, options = {}) {
    const {
      additionalValidation = null,
      preserveOriginalName = false,
      subDirectory = ''
    } = options;

    try {
      // Validate file size
      if (!this.validateFileSize(file.size)) {
        throw new Error('File size exceeds maximum allowed');
      }

      // Validate MIME type
      if (!this.validateMimeType(file.mimetype)) {
        throw new Error('File type not allowed');
      }

      // Read file buffer for additional checks
      const buffer = await fs.readFile(file.path);

      // Validate file type by magic bytes
      const isValidType = await this.validateFileType(buffer, file.mimetype);
      if (!isValidType) {
        throw new Error('File type validation failed');
      }

      // Scan for malware
      const isSafe = await this.scanForMalware(buffer);
      if (!isSafe) {
        throw new Error('File failed security scan');
      }

      // Run additional validation if provided
      if (additionalValidation) {
        const isValid = await additionalValidation(file, buffer);
        if (!isValid) {
          throw new Error('File failed custom validation');
        }
      }

      // Generate secure filename
      const filename = preserveOriginalName
        ? this.sanitizeFilename(file.originalname)
        : this.generateSecureFilename(file.originalname);

      // Determine final path
      const targetDir = subDirectory
        ? path.join(this.uploadDir, subDirectory)
        : this.uploadDir;
      
      await this.ensureUploadDirectory(targetDir);
      
      const finalPath = path.join(targetDir, filename);

      // Move file to final location
      await fs.rename(file.path, finalPath);

      // Set proper permissions
      await fs.chmod(finalPath, 0o640);

      logger.info('File uploaded successfully', {
        originalName: file.originalname,
        savedAs: filename,
        size: file.size,
        mimeType: file.mimetype
      });

      return {
        filename,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: finalPath,
        relativePath: path.relative(this.uploadDir, finalPath)
      };
    } catch (error) {
      // Clean up file on error
      try {
        await fs.unlink(file.path);
      } catch (unlinkError) {
        logger.error('Error cleaning up file:', unlinkError);
      }

      logger.error('File upload processing error:', error);
      throw error;
    }
  }

  /**
   * Create multer storage configuration
   * @returns {Object} Multer storage config
   */
  createMulterStorage() {
    const multer = require('multer');
    
    return multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          await this.ensureUploadDirectory(this.quarantineDir);
          cb(null, this.quarantineDir);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        // Use temporary name in quarantine
        const tempName = `temp-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
        cb(null, tempName);
      }
    });
  }

  /**
   * Create multer file filter
   * @returns {Function} File filter function
   */
  createFileFilter() {
    return (req, file, cb) => {
      if (this.validateMimeType(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
      }
    };
  }
}

module.exports = SecureFileUpload;