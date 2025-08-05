/**
 * @task TS008 - Client error reporting to server
 */
const PDFDocument = require('pdfkit');
const PDFTable = require('pdfkit-table');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdirAsync = promisify(fs.mkdir);
const dateFormat = require('../utils/dateFormat');
const sharp = require('sharp'); // Add sharp for image optimization

// Constants for report generation
const REPORTS_DIR = path.join(process.cwd(), 'uploads', 'reports');
const COMPANY_LOGO = path.join(process.cwd(), 'public', 'logo.png');
const REPORT_MARGIN = 50;
const PAGE_SIZE = 'A4';
const BATCH_SIZE = 50; // Number of items to process in each batch

// Cache for optimized images
const imageCache = new Map();

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
 * Generate an inspection report as PDF
 * @param {Object} inspection - The inspection object with all data
 * @param {Object} options - Options for report generation
 * @returns {Promise<string>} - Path to the generated PDF file
 */
exports.generateInspectionReport = async (inspection, options = {}) => {
  await ensureReportsDirectory();
  
  // Create unique filename based on inspection number and date
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `inspection-report-${inspection.inspectionNumber}-${timestamp}.pdf`;
  const filePath = path.join(REPORTS_DIR, filename);
  
  // Create a document with optimized settings
  const doc = new PDFDocument({
    size: PAGE_SIZE,
    margin: REPORT_MARGIN,
    bufferPages: true, // Enable page buffering for faster generation
    autoFirstPage: true,
    compress: true, // Enable compression for smaller file size
    info: {
      Title: `Inspection Report - ${inspection.inspectionNumber}`,
      Author: 'AeroSuite System',
      Subject: `Inspection Report for ${inspection.title}`,
      Keywords: 'inspection, report, aerospace',
      CreationDate: new Date()
    }
  });
  
  // Pipe output to file
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);
  
  // Add content to the document
  await addReportHeader(doc, inspection);
  await addInspectionDetails(doc, inspection);
  await addChecklistTable(doc, inspection);
  await addDefectsSection(doc, inspection);
  await addAttachmentsSection(doc, inspection);
  await addSignatureSection(doc, inspection);
  
  // Finalize the document
  doc.end();
  
  // Return a promise that resolves when the stream is finished
  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

/**
 * Add the report header with logo and title
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} inspection - The inspection object
 */
async function addReportHeader(doc, inspection) {
  try {
    // Try to add optimized logo if it exists
    if (fs.existsSync(COMPANY_LOGO)) {
      const optimizedLogo = await optimizeImage(COMPANY_LOGO);
      doc.image(optimizedLogo, REPORT_MARGIN, REPORT_MARGIN, { width: 100 });
    }
  } catch (err) {
    console.error('Error adding logo to PDF:', err);
  }
  
  // Add title and inspection number
  doc.fontSize(18).text('INSPECTION REPORT', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).text(`Inspection #: ${inspection.inspectionNumber}`, { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Generated on: ${dateFormat(new Date())}`, { align: 'center' });
  doc.moveDown(2);
}

/**
 * Add inspection details section
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} inspection - The inspection object
 */
async function addInspectionDetails(doc, inspection) {
  doc.fontSize(14).text('Inspection Details', { underline: true });
  doc.moveDown(0.5);
  
  // Create a two-column layout for details
  const tableLayout = {
    width: doc.page.width - (2 * REPORT_MARGIN),
    rows: [
      // Row 1
      {
        height: 20,
        columns: [
          { text: 'Title:', width: '30%', fontWeight: 'bold' },
          { text: inspection.title, width: '70%' }
        ]
      },
      // Row 2
      {
        height: 20,
        columns: [
          { text: 'Inspection Type:', width: '30%', fontWeight: 'bold' },
          { 
            text: inspection.inspectionType.charAt(0).toUpperCase() + 
                 inspection.inspectionType.slice(1), 
            width: '70%' 
          }
        ]
      },
      // Row 3
      {
        height: 20,
        columns: [
          { text: 'Status:', width: '30%', fontWeight: 'bold' },
          { 
            text: inspection.status.charAt(0).toUpperCase() + 
                 inspection.status.slice(1), 
            width: '70%' 
          }
        ]
      },
      // Row 4
      {
        height: 20,
        columns: [
          { text: 'Result:', width: '30%', fontWeight: 'bold' },
          { 
            text: inspection.result.charAt(0).toUpperCase() + 
                 inspection.result.slice(1), 
            width: '70%' 
          }
        ]
      },
      // Row 5
      {
        height: 20,
        columns: [
          { text: 'Customer:', width: '30%', fontWeight: 'bold' },
          { 
            text: inspection.customerId && typeof inspection.customerId === 'object' 
              ? inspection.customerId.name 
              : 'Unknown Customer', 
            width: '70%' 
          }
        ]
      },
      // Row 6
      {
        height: 20,
        columns: [
          { text: 'Supplier:', width: '30%', fontWeight: 'bold' },
          { 
            text: inspection.supplierId && typeof inspection.supplierId === 'object' 
              ? inspection.supplierId.name 
              : 'Unknown Supplier', 
            width: '70%' 
          }
        ]
      },
      // Row 7
      {
        height: 20,
        columns: [
          { text: 'Inspector:', width: '30%', fontWeight: 'bold' },
          { 
            text: inspection.inspectedBy && typeof inspection.inspectedBy === 'object' 
              ? `${inspection.inspectedBy.firstName} ${inspection.inspectedBy.lastName}` 
              : 'Unknown Inspector', 
            width: '70%' 
          }
        ]
      },
      // Row 8
      {
        height: 20,
        columns: [
          { text: 'Scheduled Date:', width: '30%', fontWeight: 'bold' },
          { 
            text: inspection.scheduledDate ? dateFormat(inspection.scheduledDate) : 'N/A', 
            width: '70%' 
          }
        ]
      },
      // Row 9
      {
        height: 20,
        columns: [
          { text: 'Completion Date:', width: '30%', fontWeight: 'bold' },
          { 
            text: inspection.completionDate ? dateFormat(inspection.completionDate) : 'N/A', 
            width: '70%' 
          }
        ]
      }
    ]
  };
  
  doc.table(tableLayout, { width: doc.page.width - (2 * REPORT_MARGIN) });
  
  // Add description if available
  if (inspection.description) {
    doc.moveDown(1);
    doc.fontSize(12).text('Description:', { fontWeight: 'bold' });
    doc.fontSize(12).text(inspection.description);
  }
  
  doc.moveDown(2);
}

/**
 * Add inspection checklist table
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} inspection - The inspection object
 */
async function addChecklistTable(doc, inspection) {
  if (!inspection.checklistItems || inspection.checklistItems.length === 0) {
    return;
  }
  
  doc.addPage();
  doc.fontSize(14).text('Inspection Checklist', { underline: true });
  doc.moveDown(1);
  
  // Process checklist items in batches to improve performance
  const items = inspection.checklistItems;
  const batchCount = Math.ceil(items.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const startIdx = batchIndex * BATCH_SIZE;
    const endIdx = Math.min((batchIndex + 1) * BATCH_SIZE, items.length);
    const batchItems = items.slice(startIdx, endIdx);
    
    // Prepare table data for this batch
    const tableData = {
      headers: ['Item', 'Status', 'Comments'],
      rows: batchItems.map(item => [
        item.name,
        item.status.toUpperCase(),
        item.comments || ''
      ])
    };
    
    // Create the table for this batch
    doc.table({
      headers: tableData.headers,
      rows: tableData.rows,
      width: doc.page.width - (2 * REPORT_MARGIN),
      headerColor: '#eeeeee',
      headerOpacity: 1,
      cellsPadding: 5,
      marginLeft: 0,
      marginRight: 0
    });
    
    // Add a small gap between batches
    if (batchIndex < batchCount - 1) {
      doc.moveDown(0.5);
    }
  }
  
  doc.moveDown(2);
}

/**
 * Add defects section
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} inspection - The inspection object
 */
async function addDefectsSection(doc, inspection) {
  if (!inspection.defects || inspection.defects.length === 0) {
    return;
  }
  
  doc.addPage();
  doc.fontSize(14).text('Defects Found', { underline: true });
  doc.moveDown(1);
  
  // Process defects in batches to improve performance
  const defects = inspection.defects;
  const batchCount = Math.ceil(defects.length / BATCH_SIZE);
  
  for (let batchIndex = 0; batchIndex < batchCount; batchIndex++) {
    const startIdx = batchIndex * BATCH_SIZE;
    const endIdx = Math.min((batchIndex + 1) * BATCH_SIZE, defects.length);
    const batchDefects = defects.slice(startIdx, endIdx);
    
    // Prepare table data for this batch
    const tableData = {
      headers: ['Type', 'Severity', 'Quantity', 'Description'],
      rows: batchDefects.map(defect => [
        defect.defectType,
        defect.severity.toUpperCase(),
        defect.quantity.toString(),
        defect.description || ''
      ])
    };
    
    // Create the table for this batch
    doc.table({
      headers: tableData.headers,
      rows: tableData.rows,
      width: doc.page.width - (2 * REPORT_MARGIN),
      headerColor: '#eeeeee',
      headerOpacity: 1,
      cellsPadding: 5,
      marginLeft: 0,
      marginRight: 0
    });
    
    // Add a small gap between batches
    if (batchIndex < batchCount - 1) {
      doc.moveDown(0.5);
    }
  }
  
  // If there's a non-conformance report, add it
  if (inspection.nonConformanceReport && inspection.nonConformanceReport.ncNumber) {
    doc.moveDown(2);
    doc.fontSize(12).text('Non-Conformance Report:', { fontWeight: 'bold' });
    doc.moveDown(0.5);
    
    doc.text(`NCR Number: ${inspection.nonConformanceReport.ncNumber}`);
    doc.text(`Disposition: ${inspection.nonConformanceReport.disposition || 'N/A'}`);
    
    if (inspection.nonConformanceReport.rootCause) {
      doc.moveDown(0.5);
      doc.text('Root Cause:', { fontWeight: 'bold' });
      doc.text(inspection.nonConformanceReport.rootCause);
    }
    
    if (inspection.nonConformanceReport.correctiveAction) {
      doc.moveDown(0.5);
      doc.text('Corrective Action:', { fontWeight: 'bold' });
      doc.text(inspection.nonConformanceReport.correctiveAction);
    }
  }
  
  doc.moveDown(2);
}

/**
 * Add attachments section
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} inspection - The inspection object
 */
async function addAttachmentsSection(doc, inspection) {
  if (!inspection.attachments || inspection.attachments.length === 0) {
    return;
  }
  
  doc.addPage();
  doc.fontSize(14).text('Attachments', { underline: true });
  doc.moveDown(1);
  
  // List all attachments
  inspection.attachments.forEach((attachment, index) => {
    doc.fontSize(12).text(`${index + 1}. ${attachment.fileName || 'Unnamed file'}`);
    if (attachment.description) {
      doc.fontSize(10).text(`   Description: ${attachment.description}`, { indent: 20 });
    }
    doc.fontSize(10).text(`   Uploaded: ${dateFormat(attachment.uploadDate)}`, { indent: 20 });
    doc.moveDown(0.5);
  });
  
  doc.moveDown(2);
}

/**
 * Add signature section
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} inspection - The inspection object
 */
async function addSignatureSection(doc, inspection) {
  doc.addPage();
  doc.fontSize(14).text('Approval and Signatures', { underline: true });
  doc.moveDown(2);
  
  // Inspector signature
  doc.fontSize(12).text('Inspector:', { continued: true });
  doc.text(inspection.inspectedBy && typeof inspection.inspectedBy === 'object' 
    ? `${inspection.inspectedBy.firstName} ${inspection.inspectedBy.lastName}` 
    : 'Unknown Inspector');
  doc.moveDown(1);
  
  // Signature line
  doc.moveTo(REPORT_MARGIN, doc.y)
     .lineTo(300, doc.y)
     .stroke();
  doc.text('Inspector Signature', REPORT_MARGIN, doc.y + 5);
  doc.moveDown(3);
  
  // Customer approval
  doc.fontSize(12).text('Customer Approval:', { continued: true });
  doc.text(inspection.customerId && typeof inspection.customerId === 'object' 
    ? inspection.customerId.name 
    : 'Unknown Customer');
  doc.moveDown(1);
  
  // Signature line
  doc.moveTo(REPORT_MARGIN, doc.y)
     .lineTo(300, doc.y)
     .stroke();
  doc.text('Customer Signature', REPORT_MARGIN, doc.y + 5);
  doc.moveDown(3);
  
  // Date line
  doc.moveTo(350, doc.y - 50)
     .lineTo(550, doc.y - 50)
     .stroke();
  doc.text('Date', 430, doc.y - 45);
  
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
}

// Clear image cache periodically to prevent memory leaks
setInterval(() => {
  imageCache.clear();
}, 3600000); // Clear cache every hour

module.exports = exports; 