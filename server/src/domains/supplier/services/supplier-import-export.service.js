/**
 * Supplier Import/Export Service
 * 
 * Handles importing and exporting supplier data in various formats (CSV, Excel, JSON)
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const XLSX = require('xlsx');
const Supplier = require('../models/supplier.model');
const { ValidationError } = require('../../../utils/errorHandler');
const logger = require('../../../utils/logger');

/**
 * Service for handling supplier data import and export
 */
class SupplierImportExportService {
  /**
   * Parse and validate a CSV file containing supplier data
   * @param {string} filePath - Path to the uploaded file
   * @returns {Promise<Array>} - Array of validated supplier objects
   */
  async parseAndValidateCsv(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const errors = [];
      let rowIndex = 1; // Header is row 0

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          rowIndex++;
          try {
            const validatedData = this.validateSupplierRow(data, rowIndex);
            results.push(validatedData);
          } catch (error) {
            errors.push(error.message);
          }
        })
        .on('end', () => {
          if (errors.length > 0) {
            reject(new ValidationError(`Validation errors in CSV: ${errors.join('; ')}`));
          } else {
            resolve(results);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  /**
   * Parse and validate an Excel file containing supplier data
   * @param {string} filePath - Path to the uploaded file
   * @returns {Promise<Array>} - Array of validated supplier objects
   */
  async parseAndValidateExcel(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      const results = [];
      const errors = [];
      
      data.forEach((row, index) => {
        try {
          const validatedData = this.validateSupplierRow(row, index + 2); // +2 because of header row and 0-indexing
          results.push(validatedData);
        } catch (error) {
          errors.push(error.message);
        }
      });
      
      if (errors.length > 0) {
        throw new ValidationError(`Validation errors in Excel: ${errors.join('; ')}`);
      }
      
      return results;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Error parsing Excel file: ${error.message}`);
    }
  }

  /**
   * Validate a single supplier data row
   * @param {Object} row - Row data from import file
   * @param {number} rowIndex - Row index for error reporting
   * @returns {Object} - Validated supplier object
   */
  validateSupplierRow(row, rowIndex) {
    const validatedData = {};
    
    // Required fields
    if (!row.name) {
      throw new ValidationError(`Row ${rowIndex}: Supplier name is required`);
    }
    validatedData.name = row.name;
    
    if (!row.code) {
      throw new ValidationError(`Row ${rowIndex}: Supplier code is required`);
    }
    validatedData.code = row.code;
    
    // Optional fields with defaults
    validatedData.status = row.status || 'active';
    validatedData.type = row.type || 'vendor';
    
    // Address fields
    validatedData.address = {
      street: row.street || '',
      city: row.city || '',
      state: row.state || '',
      postalCode: row.postalCode || '',
      country: row.country || ''
    };
    
    // Contact information
    validatedData.contactEmail = row.contactEmail || '';
    validatedData.contactPhone = row.contactPhone || '';
    validatedData.website = row.website || '';
    
    return validatedData;
  }

  /**
   * Import suppliers from a file
   * @param {string} filePath - Path to the uploaded file
   * @param {string} fileType - Type of file (csv, excel, json)
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import results
   */
  async importSuppliers(filePath, fileType, options = {}) {
    try {
      let suppliersToImport;
      
      switch (fileType.toLowerCase()) {
        case 'csv':
          suppliersToImport = await this.parseAndValidateCsv(filePath);
          break;
        case 'excel':
          suppliersToImport = await this.parseAndValidateExcel(filePath);
          break;
        case 'json': {
          const fileData = fs.readFileSync(filePath, 'utf8');
          suppliersToImport = JSON.parse(fileData);
          break;
        }
        default:
          throw new ValidationError(`Unsupported file type: ${fileType}`);
      }
      
      const importResults = {
        total: suppliersToImport.length,
        created: 0,
        updated: 0,
        failed: 0,
        errors: []
      };
      
      // Process each supplier
      for (const supplierData of suppliersToImport) {
        try {
          if (options.updateExisting) {
            // Try to find existing supplier by code
            const existingSupplier = await Supplier.findOne({ code: supplierData.code });
            
            if (existingSupplier) {
              // Update existing supplier
              await Supplier.findByIdAndUpdate(existingSupplier._id, supplierData);
              importResults.updated++;
            } else {
              // Create new supplier
              await Supplier.create(supplierData);
              importResults.created++;
            }
          } else {
            // Always create new supplier
            await Supplier.create(supplierData);
            importResults.created++;
          }
        } catch (error) {
          importResults.failed++;
          importResults.errors.push(`Error with supplier ${supplierData.name || 'unknown'}: ${error.message}`);
        }
      }
      
      return importResults;
    } catch (error) {
      logger.error('Error importing suppliers', { error });
      throw error;
    } finally {
      // Clean up the uploaded file
      try {
        fs.unlinkSync(filePath);
      } catch (error) {
        logger.error('Error deleting temporary import file', { error, filePath });
      }
    }
  }

  /**
   * Export suppliers to a file
   * @param {Object} filters - Filters to apply when selecting suppliers
   * @param {string} format - Export format (csv, excel, json)
   * @param {string} outputPath - Directory to save the exported file
   * @returns {Promise<string>} - Path to the exported file
   */
  async exportSuppliers(filters, format, outputPath) {
    try {
      // Query suppliers with filters
      const suppliers = await Supplier.find(filters)
        .select('-__v -createdAt -updatedAt')
        .lean();
      
      // Prepare export data
      const exportData = suppliers.map(supplier => ({
        id: supplier._id.toString(),
        name: supplier.name,
        code: supplier.code,
        status: supplier.status,
        type: supplier.type,
        street: supplier.address?.street || '',
        city: supplier.address?.city || '',
        state: supplier.address?.state || '',
        postalCode: supplier.address?.postalCode || '',
        country: supplier.address?.country || '',
        contactEmail: supplier.contactEmail || '',
        contactPhone: supplier.contactPhone || '',
        website: supplier.website || ''
      }));
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      let filePath;
      
      switch (format.toLowerCase()) {
        case 'csv':
          filePath = path.join(outputPath, `suppliers-export-${timestamp}.csv`);
          await this.exportToCsv(exportData, filePath);
          break;
        case 'excel':
          filePath = path.join(outputPath, `suppliers-export-${timestamp}.xlsx`);
          await this.exportToExcel(exportData, filePath);
          break;
        case 'json':
          filePath = path.join(outputPath, `suppliers-export-${timestamp}.json`);
          await this.exportToJson(exportData, filePath);
          break;
        default:
          throw new ValidationError(`Unsupported export format: ${format}`);
      }
      
      return filePath;
    } catch (error) {
      logger.error('Error exporting suppliers', { error });
      throw error;
    }
  }

  /**
   * Export data to CSV format
   * @param {Array} data - Data to export
   * @param {string} filePath - Path to save the file
   * @returns {Promise<void>}
   */
  async exportToCsv(data, filePath) {
    // Get headers from the first object
    const headers = data.length > 0 ? Object.keys(data[0]).map(key => ({
      id: key,
      title: key.charAt(0).toUpperCase() + key.slice(1) // Capitalize first letter
    })) : [];
    
    const csvWriter = createCsvWriter({
      path: filePath,
      header: headers
    });
    
    await csvWriter.writeRecords(data);
  }

  /**
   * Export data to Excel format
   * @param {Array} data - Data to export
   * @param {string} filePath - Path to save the file
   * @returns {Promise<void>}
   */
  async exportToExcel(data, filePath) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers');
    XLSX.writeFile(workbook, filePath);
  }

  /**
   * Export data to JSON format
   * @param {Array} data - Data to export
   * @param {string} filePath - Path to save the file
   * @returns {Promise<void>}
   */
  async exportToJson(data, filePath) {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
  }
}

module.exports = new SupplierImportExportService(); 