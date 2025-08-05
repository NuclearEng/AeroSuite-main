/**
 * Export Routes
 * 
 * API endpoints for exporting data in various formats (CSV, Excel, PDF, JSON).
 * Supports dashboard data export and other exportable data.
 * 
 * Part of TS369: Dashboard data export implementation
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const exportController = require('../controllers/export.controller');

/**
 * @route GET /api/export/dashboard
 * @desc Export dashboard data in specified format
 * @access Private
 * @query {string} format - Export format (csv, excel, pdf, json)
 */
router.get(
  '/dashboard',
  authenticate,
  exportController.exportDashboard
);

/**
 * @route POST /api/export/dashboard
 * @desc Export dashboard data with custom configuration
 * @access Private
 * @body {Object} config - Dashboard export configuration
 * @body {string} format - Export format (csv, excel, pdf, json)
 */
router.post(
  '/dashboard',
  authenticate,
  exportController.exportDashboardCustom
);

module.exports = router; 