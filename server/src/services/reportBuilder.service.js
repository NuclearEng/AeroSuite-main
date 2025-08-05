const PDFDocument = require('pdfkit');
const PDFTable = require('pdfkit-table');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdirAsync = promisify(fs.mkdir);
const dateFormat = require('../utils/dateFormat');
const mongoose = require('mongoose');
const sharp = require('sharp'); // Add sharp for image optimization
const { Worker } = require('worker_threads'); // For parallel processing

// Constants for report generation
const REPORTS_DIR = path.join(process.cwd(), 'uploads', 'reports');
const COMPANY_LOGO = path.join(process.cwd(), 'public', 'logo.png');
const REPORT_MARGIN = 50;
const PAGE_SIZE = 'A4';
const BATCH_SIZE = 50; // Number of items to process in each batch
const QUERY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Cache for optimized images
const imageCache = new Map();

// Cache for query results
const queryCache = new Map();

/**
 * Ensure the reports directory exists
 */
const ensureReportsDirectory = async () => {
  try {
    await mkdirAsync(REPORTS_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
};

/**
 * Optimize image for faster PDF rendering
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<Buffer>} - Optimized image buffer
 */
const optimizeImage = async (imagePath) => {
  // Check cache first
  if (imageCache.has(imagePath)) {
    return imageCache.get(imagePath);
  }
  
  try {
    // Optimize image using sharp
    const optimizedImage = await sharp(imagePath)
      .resize({ width: 200 }) // Resize to reasonable size for reports
      .jpeg({ quality: 80 }) // Use JPEG format with good quality
      .toBuffer();
    
    // Cache the optimized image
    imageCache.set(imagePath, optimizedImage);
    
    return optimizedImage;
  } catch (err) {
    console.error('Error optimizing image:', err);
    throw err;
  }
};

/**
 * Generate a custom report as PDF based on provided configuration
 * @param {Object} reportConfig - The report configuration with sections, filters, etc.
 * @param {Object} options - Options for report generation
 * @returns {Promise<string>} - Path to the generated PDF file
 */
exports.generateCustomReport = async (reportConfig, options = {}) => {
  await ensureReportsDirectory();
  
  // Create unique filename based on report name and date
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportName = reportConfig.name || 'custom-report';
  const sanitizedReportName = reportName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const filename = `${sanitizedReportName}-${timestamp}.pdf`;
  const filePath = path.join(REPORTS_DIR, filename);
  
  // Create a document with optimized settings
  const doc = new PDFDocument({
    size: PAGE_SIZE,
    margin: REPORT_MARGIN,
    bufferPages: true, // Enable page buffering for faster generation
    autoFirstPage: true,
    compress: true, // Enable compression for smaller file size
    info: {
      Title: reportConfig.name || 'Custom Report',
      Author: 'AeroSuite System',
      Subject: reportConfig.description || 'Custom Report',
      Keywords: reportConfig.keywords || 'report, aerospace',
      CreationDate: new Date()
    }
  });
  
  // Pipe output to file
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  
  // Add content to the document based on report configuration
  await addReportHeader(doc, reportConfig);
  
  // Process sections in parallel for better performance
  if (reportConfig.sections && reportConfig.sections.length > 0) {
    // Prepare sections with fixed positions
    const sectionsWithPositions = reportConfig.sections.map((section, index) => ({
      ...section,
      position: index
    }));
    
    // Generate each section
    const sectionPromises = sectionsWithPositions.map(section => 
      generateSectionContent(section)
    );
    
    // Wait for all section content to be prepared
    const preparedSections = await Promise.all(sectionPromises);
    
    // Sort sections back to original order and render them
    preparedSections
      .sort((a, b) => a.position - b.position)
      .forEach(section => {
        // Check if we need to add a new page
        if (doc.y > doc.page.height - 100) {
          doc.addPage();
        }
        
        // Generate the section in the document
        generateReportSection(doc, section);
      });
  }
  
  // Add footer with page numbers
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).text(
      `Page ${i + 1} of ${totalPages}`,
      REPORT_MARGIN,
      doc.page.height - 20,
      { align: 'center', width: doc.page.width - (2 * REPORT_MARGIN) }
    );
  }
  
  // Finalize the document
  doc.end();
  
  // Return a promise that resolves when the stream is finished
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

/**
 * Prepare section content for rendering
 * @param {Object} section - The section to prepare
 * @returns {Promise<Object>} - Prepared section with data
 */
async function generateSectionContent(section) {
  // Make a copy of the section to avoid modifying the original
  const preparedSection = { ...section };
  
  // Process data source if available
  if (section.dataSource && section.dataSource.model) {
    try {
      // Execute the data query
      const data = await executeDataQuery(section.dataSource);
      preparedSection.data = data;
    } catch (err) {
      console.error(`Error fetching data for section ${section.title}:`, err);
      preparedSection.data = [];
      preparedSection.error = `Error fetching data: ${err.message}`;
    }
  }
  
  return preparedSection;
}

/**
 * Add the report header with logo and title
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} reportConfig - The report configuration
 */
async function addReportHeader(doc, reportConfig) {
  try {
    // Try to add optimized logo if it exists
    if (fs.existsSync(COMPANY_LOGO)) {
      const optimizedLogo = await optimizeImage(COMPANY_LOGO);
      doc.image(optimizedLogo, REPORT_MARGIN, REPORT_MARGIN, { width: 100 });
    }
  } catch (err) {
    console.error('Error adding logo to PDF:', err);
  }
  
  // Add title and description
  doc.fontSize(18).text(reportConfig.name.toUpperCase(), { align: 'center' });
  doc.moveDown(0.5);
  
  if (reportConfig.description) {
    doc.fontSize(12).text(reportConfig.description, { align: 'center' });
    doc.moveDown(0.5);
  }
  
  doc.fontSize(10).text(`Generated on: ${dateFormat(new Date())}`, { align: 'center' });
  
  if (reportConfig.author) {
    doc.fontSize(10).text(`Created by: ${reportConfig.author}`, { align: 'center' });
  }
  
  doc.moveDown(2);
}

/**
 * Generate a report section based on section configuration
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} section - The section configuration
 */
function generateReportSection(doc, section) {
  // Add section title
  doc.fontSize(14).text(section.title, { underline: true });
  doc.moveDown(0.5);
  
  // Add section description if available
  if (section.description) {
    doc.fontSize(10).text(section.description);
    doc.moveDown(1);
  }
  
  // Display error if any
  if (section.error) {
    doc.fontSize(10).fillColor('#FF0000').text(section.error);
    doc.fillColor('#000000').moveDown(1);
    return;
  }
  
  // Handle different section types
  switch (section.type) {
    case 'text':
      doc.fontSize(11).text(section.content);
      break;
      
    case 'table':
      generateDataTable(doc, section);
      break;
      
    case 'chart':
      // For PDF generation, we'll convert charts to tables
      // In a real implementation, this would generate chart images
      doc.fontSize(11).text('Chart data representation:');
      doc.moveDown(0.5);
      generateDataTable(doc, {
        ...section,
        type: 'table',
        data: section.data
      });
      break;
      
    case 'metrics':
      generateMetricsSection(doc, section);
      break;
      
    case 'image':
      // Handle image embedding (placeholder)
      doc.fontSize(11).text('Image would be placed here');
      break;
      
    default:
      doc.fontSize(11).text('Unsupported section type: ' + section.type);
  }
  
  doc.moveDown(2);
}

/**
 * Generate a data table from the section configuration
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} section - The section configuration with data
 */
function generateDataTable(doc, section) {
  if (!section.data || !Array.isArray(section.data) || section.data.length === 0) {
    doc.fontSize(10).text('No data available for this table.');
    return;
  }
  
  try {
    // Extract columns from data or use provided columns
    const columns = section.columns || Object.keys(section.data[0]).map(key => ({
      id: key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
    }));
    
    // Process data in batches to improve performance with large datasets
    const allData = section.data;
    const batchCount = Math.ceil(allData.length / BATCH_SIZE);
    
    for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
      const startIdx = batchIndex * BATCH_SIZE;
      const endIdx = Math.min((batchIndex + 1) * BATCH_SIZE, allData.length);
      const batchData = allData.slice(startIdx, endIdx);
      
      // Prepare rows for this batch
      const tableRows = batchData.map(item => {
        return columns.map(col => {
          const value = item[col.id];
          
          // Format value based on type
          if (value instanceof Date) {
            return dateFormat(value);
          } else if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
          } else if (value === null || value === undefined) {
            return '-';
          } else {
            return String(value);
          }
        });
      });
      
      // Create the table for this batch
      doc.table({
        headers: batchIndex === 0 ? columns.map(col => col.label) : [], // Only show headers for first batch
        rows: tableRows
      }, {
        width: doc.page.width - (2 * REPORT_MARGIN),
        divider: {
          header: { disabled: false, width: 1, opacity: 0.5 },
          horizontal: { disabled: false, width: 0.5, opacity: 0.3 }
        },
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: () => doc.font('Helvetica').fontSize(10)
      });
      
      // Add a small gap between batches
      if (batchIndex < batchCount - 1) {
        doc.moveDown(0.5);
      }
    }
  } catch (err) {
    console.error('Error generating table:', err);
    doc.fontSize(10).text('Error generating table: ' + err.message);
  }
}

/**
 * Generate metrics section with key-value pairs
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} section - The section configuration with metrics data
 */
async function generateMetricsSection(doc, section) {
  if (!section.metrics || !Array.isArray(section.metrics) || section.metrics.length === 0) {
    doc.fontSize(10).text('No metrics available for this section.');
    return;
  }
  
  try {
    // Create a grid layout for metrics
    const columns = 2;
    const metrics = section.metrics;
    const rows = Math.ceil(metrics.length / columns);
    
    for (let row = 0; row < rows; row++) {
      const rowY = doc.y;
      let maxHeight = 0;
      
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index >= metrics.length) continue;
        
        const metric = metrics[index];
        const x = REPORT_MARGIN + (col * ((doc.page.width - (2 * REPORT_MARGIN)) / columns));
        const width = (doc.page.width - (2 * REPORT_MARGIN)) / columns - 10;
        
        // Draw metric box
        const boxY = doc.y;
        doc.roundedRect(x, boxY, width, 60, 5).fillAndStroke('#f5f5f5', '#e0e0e0');
        
        // Add metric label
        doc.fillColor('#333333').fontSize(10).text(metric.label, x + 10, boxY + 10, {
          width: width - 20,
          align: 'left'
        });
        
        // Add metric value
        const valueText = formatMetricValue(metric.value, metric.format);
        doc.fillColor('#000000').fontSize(16).text(valueText, x + 10, boxY + 25, {
          width: width - 20,
          align: 'center'
        });
        
        // Add trend indicator if available
        if (metric.trend) {
          const trendText = metric.trend > 0 ? `↑ ${metric.trend}%` : `↓ ${Math.abs(metric.trend)}%`;
          const trendColor = metric.trend > 0 ? '#4CAF50' : '#F44336';
          doc.fillColor(trendColor).fontSize(9).text(trendText, x + 10, boxY + 45, {
            width: width - 20,
            align: 'center'
          });
        }
        
        maxHeight = Math.max(maxHeight, 70); // Box height plus margin
      }
      
      // Move to next row
      doc.y = rowY + maxHeight;
    }
    
  } catch (err) {
    console.error('Error generating metrics section:', err);
    doc.fontSize(10).text('Error generating metrics: ' + err.message);
  }
}

/**
 * Format metric value based on format string
 * @param {any} value - The value to format
 * @param {string} format - Format string (percentage, currency, number, date)
 * @returns {string} - Formatted value
 */
function formatMetricValue(value, format) {
  if (value === null || value === undefined) {
    return '-';
  }
  
  try {
    switch (format) {
      case 'percentage':
        return `${parseFloat(value).toFixed(1)}%`;
      case 'currency':
        return `$${parseFloat(value).toFixed(2)}`;
      case 'number':
        return parseFloat(value).toLocaleString();
      case 'date':
        return dateFormat(new Date(value));
      default:
        return String(value);
    }
  } catch (err) {
    console.error('Error formatting metric value:', err);
    return String(value);
  }
}

/**
 * Execute a database query to fetch data for the report
 * @param {Object} dataSource - Data source configuration
 * @returns {Promise<Array>} - Query results
 */
async function executeDataQuery(dataSource) {
  try {
    // Validate data source
    if (!dataSource || !dataSource.model || !dataSource.query) {
      throw new Error('Invalid data source configuration');
    }
    
    // Generate cache key based on data source configuration
    const cacheKey = JSON.stringify({
      model: dataSource.model,
      query: dataSource.query
    });
    
    // Check cache first
    const cachedResult = queryCache.get(cacheKey);
    if (cachedResult && cachedResult.timestamp > Date.now() - QUERY_CACHE_TTL) {
      return cachedResult.data;
    }
    
    // Get model
    const Model = mongoose.model(dataSource.model);
    if (!Model) {
      throw new Error(`Model not found: ${dataSource.model}`);
    }
    
    // Build query with optimized options
    let query = Model.find(dataSource.query.filter || {}).lean();
    
    // Add specific field selection if provided (projection)
    if (dataSource.query.fields) {
      query = query.select(dataSource.query.fields);
    }
    
    // Add population
    if (dataSource.query.populate && Array.isArray(dataSource.query.populate)) {
      for (const populateField of dataSource.query.populate) {
        query = query.populate(populateField);
      }
    }
    
    // Add sorting
    if (dataSource.query.sort) {
      query = query.sort(dataSource.query.sort);
    }
    
    // Add limit
    if (dataSource.query.limit) {
      query = query.limit(dataSource.query.limit);
    }
    
    // Execute query with a timeout
    const results = await query.exec();
    
    // Transform results if needed
    let transformedResults = results;
    if (dataSource.transform && typeof dataSource.transform === 'function') {
      transformedResults = dataSource.transform(results);
    }
    
    // Cache the results
    queryCache.set(cacheKey, {
      data: transformedResults,
      timestamp: Date.now()
    });
    
    return transformedResults;
  } catch (err) {
    console.error('Error executing data query:', err);
    throw err;
  }
}

// Clear caches periodically to prevent memory leaks
setInterval(() => {
  // Clear image cache
  imageCache.clear();
  
  // Clear expired query cache entries
  const now = Date.now();
  for (const [key, value] of queryCache.entries()) {
    if (value.timestamp < now - QUERY_CACHE_TTL) {
      queryCache.delete(key);
    }
  }
}, 3600000); // Run every hour

/**
 * Save a report template to the database
 * @param {Object} template - The report template object
 * @returns {Promise<Object>} - Saved template
 */
exports.saveReportTemplate = async (template) => {
  try {
    const ReportTemplate = mongoose.model('ReportTemplate');
    const savedTemplate = await ReportTemplate.create(template);
    return savedTemplate;
  } catch (err) {
    console.error('Error saving report template:', err);
    throw err;
  }
};

/**
 * Get a report template from the database
 * @param {string} templateId - The template ID
 * @returns {Promise<Object>} - Report template
 */
exports.getReportTemplate = async (templateId) => {
  try {
    const ReportTemplate = mongoose.model('ReportTemplate');
    const template = await ReportTemplate.findById(templateId);
    if (!template) {
      throw new Error(`Template not found with ID: ${templateId}`);
    }
    return template;
  } catch (err) {
    console.error('Error getting report template:', err);
    throw err;
  }
};

/**
 * Get all report templates from the database
 * @param {Object} filter - Filter criteria
 * @returns {Promise<Array>} - Report templates
 */
exports.getAllReportTemplates = async (filter = {}) => {
  try {
    const ReportTemplate = mongoose.model('ReportTemplate');
    const templates = await ReportTemplate.find(filter).sort({ name: 1 });
    return templates;
  } catch (err) {
    console.error('Error getting report templates:', err);
    throw err;
  }
};

/**
 * Generate a custom report as Excel based on provided configuration
 * @param {Object} reportConfig - The report configuration with sections, filters, etc.
 * @param {Object} options - Options for report generation
 * @returns {Promise<string>} - Path to the generated Excel file
 */
exports.generateExcelReport = async (reportConfig, options = {}) => {
  await ensureReportsDirectory();
  
  // Create Excel workbook using exceljs
  const Excel = require('exceljs');
  const workbook = new Excel.Workbook();
  workbook.creator = reportConfig.author || 'AeroSuite System';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Create unique filename based on report name and date
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportName = reportConfig.name || 'custom-report';
  const sanitizedReportName = reportName.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  const filename = `${sanitizedReportName}-${timestamp}.xlsx`;
  const filePath = path.join(REPORTS_DIR, filename);
  
  // Add a summary worksheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Report Information', key: 'info', width: 30 },
    { header: '', key: 'value', width: 50 }
  ];
  
  // Add report information
  summarySheet.addRow({ info: 'Report Name', value: reportConfig.name });
  summarySheet.addRow({ info: 'Description', value: reportConfig.description || '' });
  summarySheet.addRow({ info: 'Generated On', value: dateFormat(new Date()) });
  summarySheet.addRow({ info: 'Author', value: reportConfig.author || '' });
  summarySheet.addRow({ info: 'Category', value: reportConfig.category || '' });
  
  // Style header row
  summarySheet.getRow(1).font = { bold: true };
  summarySheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
  
  // Process each section
  for (const section of reportConfig.sections) {
    if (['table', 'chart'].includes(section.type) && section.data) {
      // Create a worksheet for this section
      const worksheet = workbook.addWorksheet(section.title.substring(0, 31)); // Excel has 31 char limit for sheet names
      
      // Add section description as a note
      if (section.description) {
        worksheet.getCell('A1').value = section.description;
        worksheet.getCell('A1').font = { italic: true, size: 10 };
        worksheet.getRow(1).height = 30;
      }
      
      // Determine the starting row based on whether there's a description
      const startRow = section.description ? 3 : 1;
      
      // Extract columns from data or use provided columns
      const columns = section.columns || Object.keys(section.data[0] || {}).map(key => ({
        id: key,
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
      }));
      
      // Set up columns
      worksheet.columns = columns.map(col => ({
        header: col.label,
        key: col.id,
        width: Math.max(15, col.label.length * 1.2)
      }));
      
      // Add data rows
      section.data.forEach(item => {
        const rowData = {};
        columns.forEach(col => {
          rowData[col.id] = formatExcelValue(item[col.id], col.format);
        });
        worksheet.addRow(rowData);
      });
      
      // Style header row
      const headerRow = worksheet.getRow(startRow);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
      };
      
      // Add border to all cells
      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex >= startRow) {
          row.eachCell(cell => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });
      
      // If it's a chart section, try to create a chart
      if (section.type === 'chart' && section.chartOptions) {
        try {
          // Note: Excel charts require a lot of complex setup
          // This is a simplified placeholder that would need to be expanded
          worksheet.addRow([]); // Add empty row
          worksheet.addRow(['Note: For full chart visualization, please use the PDF or web view']);
        } catch (err) {
          console.error('Error creating Excel chart:', err);
        }
      }
    } else if (section.type === 'text') {
      // For text sections, add them to a notes sheet
      let notesSheet = workbook.getWorksheet('Notes');
      if (!notesSheet) {
        notesSheet = workbook.addWorksheet('Notes');
        notesSheet.columns = [
          { header: 'Section', key: 'section', width: 30 },
          { header: 'Content', key: 'content', width: 70 }
        ];
        
        // Style header row
        notesSheet.getRow(1).font = { bold: true };
        notesSheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' }
        };
      }
      
      notesSheet.addRow({ section: section.title, content: section.content });
    }
  }
  
  // Save workbook to file
  await workbook.xlsx.writeFile(filePath);
  
  return filePath;
};

/**
 * Format a value for Excel output
 * @param {any} value - The value to format
 * @param {string} format - The format type
 * @returns {any} - The formatted value
 */
function formatExcelValue(value, format) {
  if (value === null || value === undefined) {
    return '';
  }
  
  switch (format) {
    case 'date':
      return value instanceof Date ? value : new Date(value);
    case 'number':
      return typeof value === 'number' ? value : Number(value) || 0;
    case 'currency':
      return typeof value === 'number' ? value : Number(value) || 0;
    case 'percentage':
      return typeof value === 'number' ? value / 100 : Number(value) / 100 || 0;
    case 'boolean':
      return Boolean(value);
    default:
      return String(value);
  }
}

// Export the functions needed by other modules
exports.executeDataQuery = executeDataQuery;
// ... other exports ... 