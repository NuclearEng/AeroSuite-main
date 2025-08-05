/**
 * Supplier Import/Export Controller
 * 
 * Handles HTTP requests for importing and exporting supplier data
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { SuccessResponse, ErrorResponse } = require('../../../utils/apiResponse');
const { ValidationError } = require('../../../utils/errorHandler');
const supplierImportExportService = require('../services/supplier-import-export.service');
const logger = require('../../../utils/logger');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../../uploads/temp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, `supplier-import-${uniqueSuffix}${fileExt}`);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError(`Unsupported file type: ${file.mimetype}`), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

/**
 * Import suppliers from uploaded file
 */
exports.importSuppliers = [
  // Middleware to handle file upload
  upload.single('file'),
  
  // Controller function
  async (req, res, next) => {
    try {
      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }
      
      // Get file type from extension
      const fileExt = path.extname(req.file.originalname).toLowerCase();
      let fileType;
      
      switch (fileExt) {
        case '.csv':
          fileType = 'csv';
          break;
        case '.xlsx':
        case '.xls':
          fileType = 'excel';
          break;
        case '.json':
          fileType = 'json';
          break;
        default:
          throw new ValidationError(`Unsupported file extension: ${fileExt}`);
      }
      
      // Get import options from request
      const options = {
        updateExisting: req.body.updateExisting === 'true'
      };
      
      // Process the import
      const importResults = await supplierImportExportService.importSuppliers(
        req.file.path,
        fileType,
        options
      );
      
      // Return results
      return res.json(new SuccessResponse('Suppliers imported successfully', { importResults }));
    } catch (error) {
      logger.error('Error in importSuppliers controller', { error });
      
      // Clean up uploaded file in case of error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          logger.error('Error deleting temporary import file', { error: unlinkError });
        }
      }
      
      next(error);
    }
  }
];

/**
 * Export suppliers to a file
 */
exports.exportSuppliers = async (req, res, next) => {
  try {
    // Get export format from query params
    const { format = 'csv' } = req.query;
    
    // Validate format
    const validFormats = ['csv', 'excel', 'json'];
    if (!validFormats.includes(format)) {
      throw new ValidationError(`Unsupported export format: ${format}. Valid formats are: ${validFormats.join(', ')}`);
    }
    
    // Parse filters from query params
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.type) filters.type = req.query.type;
    if (req.query.search) {
      filters.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../../../../uploads/exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Export the data
    const filePath = await supplierImportExportService.exportSuppliers(filters, format, exportsDir);
    
    // Set appropriate headers based on format
    let contentType;
    let filename = path.basename(filePath);
    
    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        break;
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'json':
        contentType = 'application/json';
        break;
    }
    
    // Stream the file to the response
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Clean up the file after sending
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) {
          logger.error('Error deleting temporary export file', { error: err, filePath });
        }
      });
    });
  } catch (error) {
    logger.error('Error in exportSuppliers controller', { error });
    next(error);
  }
};

/**
 * Get a template file for supplier import
 */
exports.getImportTemplate = async (req, res, next) => {
  try {
    // Get template format from query params
    const { format = 'csv' } = req.query;
    
    // Validate format
    const validFormats = ['csv', 'excel'];
    if (!validFormats.includes(format)) {
      throw new ValidationError(`Unsupported template format: ${format}. Valid formats are: ${validFormats.join(', ')}`);
    }
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, '../../../../uploads/exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    // Template data
    const templateData = [
      {
        name: 'Example Supplier',
        code: 'SUP001',
        status: 'active',
        type: 'vendor',
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postalCode: '12345',
        country: 'USA',
        contactEmail: 'contact@example.com',
        contactPhone: '555-123-4567',
        website: 'https://example.com'
      }
    ];
    
    // Generate template file
    let filePath;
    let contentType;
    let filename;
    
    if (format === 'csv') {
      filePath = path.join(exportsDir, 'supplier-import-template.csv');
      await supplierImportExportService.exportToCsv(templateData, filePath);
      contentType = 'text/csv';
      filename = 'supplier-import-template.csv';
    } else {
      filePath = path.join(exportsDir, 'supplier-import-template.xlsx');
      await supplierImportExportService.exportToExcel(templateData, filePath);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = 'supplier-import-template.xlsx';
    }
    
    // Stream the file to the response
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Clean up the file after sending
    fileStream.on('end', () => {
      fs.unlink(filePath, (err) => {
        if (err) {
          logger.error('Error deleting temporary template file', { error: err, filePath });
        }
      });
    });
  } catch (error) {
    logger.error('Error in getImportTemplate controller', { error });
    next(error);
  }
};

/**
 * Get import progress status
 */
exports.getImportProgress = async (req, res, next) => {
  try {
    const { importId } = req.params;
    
    // TODO: Implement a proper job tracking system for long-running imports
    // This is a placeholder for future implementation
    
    return res.json(new SuccessResponse('Import progress retrieved', {
      importId,
      status: 'completed',
      progress: 100,
      results: {
        total: 100,
        created: 80,
        updated: 15,
        failed: 5
      }
    }));
  } catch (error) {
    logger.error('Error in getImportProgress controller', { error });
    next(error);
  }
}; 