const PDFDocument = require('pdfkit');
const PDFTable = require('pdfkit-table');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdirAsync = promisify(fs.mkdir);
const dateFormat = require('../utils/dateFormat');
const { ServerError } = require('../utils/errorHandler');

// Constants for PDF generation
const PDF_DIR = path.join(process.cwd(), 'uploads', 'pdfs');
const TEMP_DIR = path.join(process.cwd(), 'uploads', 'temp');
const COMPANY_LOGO = path.join(process.cwd(), 'public', 'logo.png');
const DEFAULT_MARGIN = 50;
const DEFAULT_PAGE_SIZE = 'A4';

// Colors for PDF styling
const COLORS = {
  primary: '#1976d2',
  secondary: '#424242',
  success: '#4caf50',
  warning: '#ff9800',
  danger: '#f44336',
  light: '#f5f5f5',
  dark: '#212121',
  text: '#333333',
  border: '#e0e0e0'
};

// Font sizes
const FONT_SIZES = {
  title: 20,
  subtitle: 16,
  heading: 14,
  subheading: 12,
  body: 10,
  small: 8
};

/**
 * Ensure the necessary directories exist
 */
const ensureDirectories = async () => {
  try {
    await mkdirAsync(PDF_DIR, { recursive: true });
    await mkdirAsync(TEMP_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw new ServerError(`Failed to create PDF directories: ${err.message}`);
    }
  }
};

/**
 * Create a new PDF document with standard settings
 * @param {Object} options - PDF configuration options
 * @returns {PDFDocument} The PDF document
 */
const createDocument = (options = {}) => {
  const {
    size = DEFAULT_PAGE_SIZE,
    margin = DEFAULT_MARGIN,
    title = 'Report',
    author = 'AeroSuite System',
    subject = 'Generated Report',
    keywords = 'report, aerospace',
    landscape = false
  } = options;

  return new PDFDocument({
    size,
    margin,
    layout: landscape ? 'landscape' : 'portrait',
    info: {
      Title: title,
      Author: author,
      Subject: subject,
      Keywords: keywords,
      CreationDate: new Date()
    }
  });
};

/**
 * Generate a unique filename for a PDF
 * @param {string} prefix - Prefix for the filename
 * @param {string} identifier - Unique identifier (e.g., report number)
 * @returns {string} The generated filename
 */
const generateFilename = (prefix, identifier) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${identifier}-${timestamp}.pdf`;
};

/**
 * Add standard header to a PDF document
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} options - Header options
 */
const addHeader = (doc, options = {}) => {
  const {
    title = 'Report',
    subtitle = '',
    showLogo = true,
    logoWidth = 100,
    textAlign = 'center'
  } = options;

  // Add logo if it exists and is requested
  if (showLogo) {
    try {
      if (fs.existsSync(COMPANY_LOGO)) {
        doc.image(COMPANY_LOGO, doc.page.margins.left, doc.page.margins.top, { width: logoWidth });
      }
    } catch (err) {
      console.error('Error adding logo to PDF:', err);
    }
  }

  // Add title and subtitle
  const startY = showLogo ? doc.y + 20 : doc.page.margins.top;
  doc.fontSize(FONT_SIZES.title)
     .fillColor(COLORS.primary)
     .text(title.toUpperCase(), { align: textAlign, continued: false });

  if (subtitle) {
    doc.moveDown(0.5)
       .fontSize(FONT_SIZES.subtitle)
       .fillColor(COLORS.secondary)
       .text(subtitle, { align: textAlign });
  }

  doc.moveDown(1)
     .fontSize(FONT_SIZES.small)
     .fillColor(COLORS.secondary)
     .text(`Generated on: ${dateFormat(new Date())}`, { align: textAlign });

  // Add a separator line
  doc.moveDown(1)
     .strokeColor(COLORS.border)
     .lineWidth(1)
     .moveTo(doc.page.margins.left, doc.y)
     .lineTo(doc.page.width - doc.page.margins.right, doc.y)
     .stroke();

  doc.moveDown(1);
};

/**
 * Add a section heading to the PDF
 * @param {PDFDocument} doc - The PDF document
 * @param {string} title - Section title
 * @param {Object} options - Section options
 */
const addSectionHeading = (doc, title, options = {}) => {
  const {
    fontSize = FONT_SIZES.heading,
    color = COLORS.primary,
    underline = true,
    marginTop = 0.5,
    marginBottom = 0.5
  } = options;

  doc.moveDown(marginTop)
     .fontSize(fontSize)
     .fillColor(color)
     .text(title, { underline });

  doc.moveDown(marginBottom);
};

/**
 * Add a table to the PDF
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} tableData - Table data and configuration
 * @returns {Promise<void>}
 */
const addTable = async (doc, tableData) => {
  const {
    title,
    subtitle,
    headers,
    rows,
    widths = [],
    headerColor = COLORS.light,
    headerTextColor = COLORS.dark,
    zebra = true,
    zebraColor = COLORS.light,
    borders = true,
    borderColor = COLORS.border
  } = tableData;

  // Add table title if provided
  if (title) {
    doc.fontSize(FONT_SIZES.subheading)
       .fillColor(COLORS.primary)
       .text(title);
    
    if (subtitle) {
      doc.fontSize(FONT_SIZES.body)
         .fillColor(COLORS.secondary)
         .text(subtitle);
    }
    
    doc.moveDown(0.5);
  }

  // Build table options
  const tableOptions = {
    prepareHeader: () => doc.fontSize(FONT_SIZES.body).fillColor(headerTextColor),
    prepareRow: (row, indexColumn, indexRow, rectRow) => {
      doc.fontSize(FONT_SIZES.body).fillColor(COLORS.text);
      if (zebra && indexRow % 2 !== 0) {
        doc.fillColor(COLORS.text).rect(
          rectRow.x,
          rectRow.y,
          rectRow.width,
          rectRow.height
        ).fill(zebraColor);
      }
    }
  };

  // Add table to document
  await doc.table({
    headers,
    rows,
    widths,
    headerColor,
    borderColor: borders ? borderColor : null
  }, tableOptions);
};

/**
 * Add a signature block to the PDF
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} options - Signature options
 */
const addSignatureBlock = (doc, options = {}) => {
  const {
    title = 'Signatures',
    signatureLines = [
      { label: 'Inspector', name: '' },
      { label: 'Supplier Representative', name: '' },
      { label: 'Customer Representative', name: '' }
    ],
    includeDate = true
  } = options;

  addSectionHeading(doc, title);

  const lineWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / signatureLines.length;
  const startX = doc.page.margins.left;
  const startY = doc.y;

  // Add signature lines
  signatureLines.forEach((line, index) => {
    const x = startX + (lineWidth * index);
    
    // Draw signature line
    doc.strokeColor(COLORS.border)
       .lineWidth(1)
       .moveTo(x + 20, startY + 40)
       .lineTo(x + lineWidth - 20, startY + 40)
       .stroke();
    
    // Add label below line
    doc.fontSize(FONT_SIZES.body)
       .fillColor(COLORS.text)
       .text(line.label, x + 20, startY + 45, { width: lineWidth - 40, align: 'center' });
    
    // Add name if provided
    if (line.name) {
      doc.fontSize(FONT_SIZES.body)
         .fillColor(COLORS.dark)
         .text(line.name, x + 20, startY + 15, { width: lineWidth - 40, align: 'center' });
    }
    
    // Add date line if requested
    if (includeDate) {
      doc.strokeColor(COLORS.border)
         .lineWidth(1)
         .moveTo(x + 30, startY + 80)
         .lineTo(x + lineWidth - 30, startY + 80)
         .stroke();
      
      doc.fontSize(FONT_SIZES.small)
         .fillColor(COLORS.text)
         .text('Date', x + 30, startY + 85, { width: lineWidth - 60, align: 'center' });
    }
  });

  doc.moveDown(5); // Move down to provide space after signature block
};

/**
 * Add footer with page numbers
 * @param {PDFDocument} doc - The PDF document
 * @param {Object} options - Footer options
 */
const addFooter = (doc, options = {}) => {
  const {
    text = 'Confidential - AeroSuite System',
    showPageNumbers = true,
    color = COLORS.secondary
  } = options;

  const totalPages = doc.bufferedPageRange().count;
  
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    
    // Add a line above the footer
    const footerTop = doc.page.height - doc.page.margins.bottom + 10;
    doc.strokeColor(COLORS.border)
       .lineWidth(0.5)
       .moveTo(doc.page.margins.left, footerTop)
       .lineTo(doc.page.width - doc.page.margins.right, footerTop)
       .stroke();
    
    // Add footer text
    doc.fontSize(FONT_SIZES.small)
       .fillColor(color)
       .text(
        text,
        doc.page.margins.left,
        footerTop + 5,
        { align: 'left', width: 300 }
      );
    
    // Add page numbers if requested
    if (showPageNumbers) {
      doc.text(
        `Page ${i + 1} of ${totalPages}`,
        doc.page.margins.left,
        footerTop + 5,
        { align: 'right', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
      );
    }
  }
};

/**
 * Generate a PDF report
 * @param {Object} data - The data for the report
 * @param {Object} options - PDF generation options
 * @returns {Promise<string>} - Path to the generated PDF file
 */
exports.generatePDF = async (data, options = {}) => {
  try {
    await ensureDirectories();
    
    const {
      title = 'Report',
      filename = generateFilename('report', data.id || 'generic'),
      landscape = false,
      margin = DEFAULT_MARGIN,
      generator = null // Function to customize PDF generation
    } = options;
    
    const filePath = path.join(PDF_DIR, filename);
    
    // Create a document
    const doc = createDocument({
      title,
      landscape,
      margin
    });
    
    // Pipe output to file
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // If a custom generator is provided, use it
    if (generator && typeof generator === 'function') {
      await generator(doc, data, {
        addHeader,
        addSectionHeading,
        addTable,
        addSignatureBlock,
        addFooter
      });
    } else {
      // Default simple report generation
      addHeader(doc, { title });
      
      // Add basic content
      doc.fontSize(FONT_SIZES.body)
         .fillColor(COLORS.text)
         .text('This is a generated report. No custom generator was provided.');
      
      // Add footer
      addFooter(doc);
    }
    
    // Finalize the document
    doc.end();
    
    // Return a promise that resolves when the stream is finished
    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
    });
  } catch (error) {
    throw new ServerError(`PDF Generation failed: ${error.message}`);
  }
};

// Export utility functions
exports.utils = {
  createDocument,
  addHeader,
  addSectionHeading,
  addTable,
  addSignatureBlock,
  addFooter,
  generateFilename,
  ensureDirectories,
  COLORS,
  FONT_SIZES
}; 