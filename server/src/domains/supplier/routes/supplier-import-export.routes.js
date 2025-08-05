/**
 * Supplier Import/Export Routes
 */

const express = require('express');
const router = express.Router();
const supplierImportExportController = require('../controllers/supplier-import-export.controller');
const { authenticate } = require('../../../middleware/auth');
const { authorize } = require('../../../middleware/rbac');

/**
 * @route POST /api/v1/suppliers/import
 * @desc Import suppliers from a file
 * @access Private (Admin, Manager)
 */
router.post(
  '/import',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  supplierImportExportController.importSuppliers
);

/**
 * @route GET /api/v1/suppliers/export
 * @desc Export suppliers to a file
 * @access Private (Admin, Manager, User)
 */
router.get(
  '/export',
  authenticate,
  authorize(['ADMIN', 'MANAGER', 'USER']),
  supplierImportExportController.exportSuppliers
);

/**
 * @route GET /api/v1/suppliers/import-template
 * @desc Get a template file for supplier import
 * @access Private (Admin, Manager)
 */
router.get(
  '/import-template',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  supplierImportExportController.getImportTemplate
);

/**
 * @route GET /api/v1/suppliers/import-progress/:importId
 * @desc Get import progress status
 * @access Private (Admin, Manager)
 */
router.get(
  '/import-progress/:importId',
  authenticate,
  authorize(['ADMIN', 'MANAGER']),
  supplierImportExportController.getImportProgress
);

module.exports = router; 