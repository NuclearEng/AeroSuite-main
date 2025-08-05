const express = require('express');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth.middleware');
const reportController = require('../controllers/report.controller');
const { checkPermission } = require('../middleware/permission.middleware');

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

// Add permission check for export/download
router.use(['/generate', '/export-excel', '/*'], checkPermission('canExportReports'));

/**
 * @route GET /api/reports/*
 * @desc Serve generated report files
 * @access Private
 */
router.get('/*', (req, res) => {
  try {
    // Get the requested file path
    const filePath = path.join(process.cwd(), req.path);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Report file not found'
      });
    }
    
    // Set Content-Type header for PDF
    res.setHeader('Content-Type', 'application/pdf');
    
    // Stream the file to the response
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving report file:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving report file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/reports/templates
 * @desc Get all report templates
 * @access Private
 */
router.get(
  '/templates',
  reportController.getAllReportTemplates
);

/**
 * @route GET /api/reports/templates/:id
 * @desc Get a single report template
 * @access Private
 */
router.get(
  '/templates/:id',
  reportController.getReportTemplate
);

/**
 * @route POST /api/reports/templates
 * @desc Create a new report template
 * @access Private
 */
router.post(
  '/templates',
  reportController.createReportTemplate
);

/**
 * @route PUT /api/reports/templates/:id
 * @desc Update a report template
 * @access Private
 */
router.put(
  '/templates/:id',
  reportController.updateReportTemplate
);

/**
 * @route DELETE /api/reports/templates/:id
 * @desc Delete a report template
 * @access Private
 */
router.delete(
  '/templates/:id',
  reportController.deleteReportTemplate
);

/**
 * @route POST /api/reports/generate
 * @desc Generate a custom report
 * @access Private
 */
router.post(
  '/generate',
  reportController.generateCustomReport
);

/**
 * @route POST /api/reports/preview
 * @desc Preview a report template
 * @access Private
 */
router.post(
  '/preview',
  reportController.previewReport
);

/**
 * @route GET /api/reports/data-sources
 * @desc Get available data sources and fields for report builder
 * @access Private
 */
router.get(
  '/data-sources',
  reportController.getDataSources
);

/**
 * @route POST /api/reports/export-excel
 * @desc Export a report to Excel
 * @access Private
 */
router.post(
  '/export-excel',
  reportController.exportToExcel
);

/**
 * Serve static report files
 */
router.use('/', express.static('uploads/reports'));

module.exports = router; 