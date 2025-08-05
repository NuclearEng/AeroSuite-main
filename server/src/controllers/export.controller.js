/**
 * Export Controller
 * 
 * Controller for exporting data in various formats (CSV, Excel, PDF, JSON).
 * Handles dashboard data export and other exportable data.
 * 
 * Part of TS369: Dashboard data export implementation
 */

const fs = require('fs-extra');
const path = require('path');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// Temp directory for file generation
const TEMP_DIR = path.join(__dirname, '..', '..', 'temp');

// Ensure temp directory exists
fs.ensureDirSync(TEMP_DIR);

/**
 * Export dashboard data in specified format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.exportDashboard = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    // Sample dashboard data (in production, this would come from a database)
    const dashboardData = {
      widgets: [
        { id: 'inspections-summary', visible: true, position: 0, size: 'medium' },
        { id: 'upcoming-inspections', visible: true, position: 1, size: 'large' },
        { id: 'supplier-performance', visible: true, position: 2, size: 'medium' },
        { id: 'inspection-status', visible: true, position: 3, size: 'medium' },
        { id: 'quality-metrics', visible: true, position: 4, size: 'medium' }
      ],
      layout: {
        columnCount: 2,
        compactView: false,
        showAnimations: true,
        refreshInterval: 300
      }
    };
    
    // Process export based on format
    switch (format.toLowerCase()) {
      case 'csv':
        return exportToCsv(res, dashboardData, 'dashboard-export');
      case 'excel':
        return exportToExcel(res, dashboardData, 'dashboard-export');
      case 'pdf':
        return exportToPdf(res, dashboardData, 'dashboard-export');
      case 'json':
      default:
        return res.json(dashboardData);
    }
  } catch (error) {
    logger.error('Error exporting dashboard data:', error);
    return res.status(500).json({ error: 'Failed to export dashboard data' });
  }
};

/**
 * Export dashboard data with custom configuration
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.exportDashboardCustom = async (req, res) => {
  try {
    const { format = 'json', config } = req.body;
    
    // Get dashboard data based on config
    // In a real implementation, this would query the database based on config
    const dashboardData = {
      // Sample data would be replaced with actual data based on config
      widgets: [
        { id: 'inspections-summary', visible: true, position: 0, size: 'medium' },
        { id: 'upcoming-inspections', visible: true, position: 1, size: 'large' }
      ],
      layout: {
        columnCount: 2,
        compactView: false,
        showAnimations: true,
        refreshInterval: 300
      }
    };
    
    // Process export based on format
    switch (format.toLowerCase()) {
      case 'csv':
        return exportToCsv(res, dashboardData, 'dashboard-export-custom');
      case 'excel':
        return exportToExcel(res, dashboardData, 'dashboard-export-custom');
      case 'pdf':
        return exportToPdf(res, dashboardData, 'dashboard-export-custom');
      case 'json':
      default:
        return res.json(dashboardData);
    }
  } catch (error) {
    logger.error('Error exporting custom dashboard data:', error);
    return res.status(500).json({ error: 'Failed to export dashboard data' });
  }
};

/**
 * Helper function to export data as CSV
 * @param {Object} res - Express response object
 * @param {Object} data - Data to export
 * @param {String} filename - Base filename
 */
const exportToCsv = (res, data, filename) => {
  try {
    // Flatten widgets for CSV export
    const widgetsData = data.widgets.map(widget => ({
      Widget_ID: widget.id,
      Visible: widget.visible ? 'Yes' : 'No',
      Position: widget.position,
      Size: widget.size
    }));
    
    // Create layout data for CSV export
    const layoutData = [{
      Column_Count: data.layout.columnCount,
      Compact_View: data.layout.compactView ? 'Yes' : 'No',
      Show_Animations: data.layout.showAnimations ? 'Yes' : 'No',
      Refresh_Interval: `${data.layout.refreshInterval} seconds`
    }];
    
    // Convert widgets to CSV
    const widgetParser = new Parser({ fields: Object.keys(widgetsData[0] || {}) });
    const widgetsCsv = widgetsData.length ? widgetParser.parse(widgetsData) : '';
    
    // Convert layout to CSV
    const layoutParser = new Parser({ fields: Object.keys(layoutData[0] || {}) });
    const layoutCsv = layoutData.length ? layoutParser.parse(layoutData) : '';
    
    // Combine CSVs with headers
    const combinedCsv = `DASHBOARD WIDGETS\n${widgetsCsv}\n\nDASHBOARD LAYOUT\n${layoutCsv}`;
    
    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
    
    // Send CSV data
    return res.send(combinedCsv);
  } catch (error) {
    logger.error('Error generating CSV:', error);
    return res.status(500).json({ error: 'Failed to generate CSV' });
  }
};

/**
 * Helper function to export data as Excel
 * @param {Object} res - Express response object
 * @param {Object} data - Data to export
 * @param {String} filename - Base filename
 */
const exportToExcel = async (res, data, filename) => {
  try {
    // Create a new Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // Add widgets worksheet
    const widgetsSheet = workbook.addWorksheet('Widgets');
    widgetsSheet.columns = [
      { header: 'Widget ID', key: 'id' },
      { header: 'Visible', key: 'visible' },
      { header: 'Position', key: 'position' },
      { header: 'Size', key: 'size' }
    ];
    
    // Add widget data
    data.widgets.forEach(widget => {
      widgetsSheet.addRow({
        id: widget.id,
        visible: widget.visible ? 'Yes' : 'No',
        position: widget.position,
        size: widget.size
      });
    });
    
    // Add layout worksheet
    const layoutSheet = workbook.addWorksheet('Layout');
    layoutSheet.columns = [
      { header: 'Property', key: 'property' },
      { header: 'Value', key: 'value' }
    ];
    
    // Add layout data
    layoutSheet.addRow({ property: 'Column Count', value: data.layout.columnCount });
    layoutSheet.addRow({ property: 'Compact View', value: data.layout.compactView ? 'Yes' : 'No' });
    layoutSheet.addRow({ property: 'Show Animations', value: data.layout.showAnimations ? 'Yes' : 'No' });
    layoutSheet.addRow({ property: 'Refresh Interval', value: `${data.layout.refreshInterval} seconds` });
    
    // Format cells
    widgetsSheet.getRow(1).font = { bold: true };
    layoutSheet.getRow(1).font = { bold: true };
    
    // Set column widths
    widgetsSheet.columns.forEach(column => {
      column.width = 20;
    });
    layoutSheet.columns.forEach(column => {
      column.width = 20;
    });
    
    // Create a temporary file
    const tempFilePath = path.join(TEMP_DIR, `${filename}-${uuidv4()}.xlsx`);
    await workbook.xlsx.writeFile(tempFilePath);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.xlsx`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);
    
    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlink(tempFilePath, err => {
        if (err) logger.error('Error deleting temp Excel file:', err);
      });
    });
  } catch (error) {
    logger.error('Error generating Excel:', error);
    return res.status(500).json({ error: 'Failed to generate Excel file' });
  }
};

/**
 * Helper function to export data as PDF
 * @param {Object} res - Express response object
 * @param {Object} data - Data to export
 * @param {String} filename - Base filename
 */
const exportToPdf = async (res, data, filename) => {
  try {
    // Create a temporary file
    const tempFilePath = path.join(TEMP_DIR, `${filename}-${uuidv4()}.pdf`);
    
    // Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Pipe the PDF to a file
    const writeStream = fs.createWriteStream(tempFilePath);
    doc.pipe(writeStream);
    
    // Add title
    doc.fontSize(20).text('Dashboard Export', { align: 'center' });
    doc.moveDown();
    
    // Add widgets section
    doc.fontSize(16).text('Dashboard Widgets', { underline: true });
    doc.moveDown();
    
    // Create a simple table for widgets
    const widgetTableTop = doc.y;
    const widgetTableLeft = 50;
    const widgetColWidth = 120;
    
    // Table headers
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Widget ID', widgetTableLeft, widgetTableTop);
    doc.text('Visible', widgetTableLeft + widgetColWidth, widgetTableTop);
    doc.text('Position', widgetTableLeft + widgetColWidth * 2, widgetTableTop);
    doc.text('Size', widgetTableLeft + widgetColWidth * 3, widgetTableTop);
    
    // Table rows
    doc.font('Helvetica');
    let rowY = widgetTableTop + 20;
    
    data.widgets.forEach(widget => {
      doc.text(widget.id, widgetTableLeft, rowY);
      doc.text(widget.visible ? 'Yes' : 'No', widgetTableLeft + widgetColWidth, rowY);
      doc.text(widget.position.toString(), widgetTableLeft + widgetColWidth * 2, rowY);
      doc.text(widget.size, widgetTableLeft + widgetColWidth * 3, rowY);
      rowY += 20;
    });
    
    doc.moveDown(2);
    
    // Add layout section
    doc.fontSize(16).text('Dashboard Layout', { underline: true });
    doc.moveDown();
    
    // Create a simple table for layout
    const layoutTableTop = doc.y;
    const layoutTableLeft = 50;
    const layoutColWidth = 200;
    
    // Table headers
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Property', layoutTableLeft, layoutTableTop);
    doc.text('Value', layoutTableLeft + layoutColWidth, layoutTableTop);
    
    // Table rows
    doc.font('Helvetica');
    rowY = layoutTableTop + 20;
    
    doc.text('Column Count', layoutTableLeft, rowY);
    doc.text(data.layout.columnCount.toString(), layoutTableLeft + layoutColWidth, rowY);
    rowY += 20;
    
    doc.text('Compact View', layoutTableLeft, rowY);
    doc.text(data.layout.compactView ? 'Yes' : 'No', layoutTableLeft + layoutColWidth, rowY);
    rowY += 20;
    
    doc.text('Show Animations', layoutTableLeft, rowY);
    doc.text(data.layout.showAnimations ? 'Yes' : 'No', layoutTableLeft + layoutColWidth, rowY);
    rowY += 20;
    
    doc.text('Refresh Interval', layoutTableLeft, rowY);
    doc.text(`${data.layout.refreshInterval} seconds`, layoutTableLeft + layoutColWidth, rowY);
    
    // Add timestamp
    doc.moveDown(4);
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });
    
    // Finalize the PDF
    doc.end();
    
    // Wait for the PDF to be written
    await new Promise(resolve => {
      writeStream.on('finish', resolve);
    });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(tempFilePath);
    fileStream.pipe(res);
    
    // Clean up temp file after sending
    fileStream.on('end', () => {
      fs.unlink(tempFilePath, err => {
        if (err) logger.error('Error deleting temp PDF file:', err);
      });
    });
  } catch (error) {
    logger.error('Error generating PDF:', error);
    return res.status(500).json({ error: 'Failed to generate PDF file' });
  }
}; 