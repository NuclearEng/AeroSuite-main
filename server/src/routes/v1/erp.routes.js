/**
 * ERP Routes
 * 
 * API routes for ERP system integration.
 */

const express = require('express');
const erpController = require('../../controllers/erp.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const router = express.Router();

// Apply authentication middleware to all ERP routes
router.use(authenticate);

// Get data from ERP
router.get('/vendors', erpController.getVendors);
router.get('/inventory', erpController.getInventory);
router.get('/purchase-orders', erpController.getPurchaseOrders);
router.get('/quality-inspections', erpController.getQualityInspections);

// Create and update data in ERP
router.post('/vendors', erpController.createVendor);
router.put('/vendors/:id', erpController.updateVendor);
router.post('/purchase-orders', erpController.createPurchaseOrder);
router.put('/purchase-orders/:id', erpController.updatePurchaseOrder);
router.post('/quality-inspections', erpController.createQualityInspection);
router.put('/quality-inspections/:id', erpController.updateQualityInspection);

// Sync data to ERP
router.post('/sync/suppliers/to-erp', erpController.syncSuppliersToERP);
router.post('/sync/inspections/to-erp', erpController.syncInspectionsToERP);

// Sync data from ERP
router.post('/sync/vendors/from-erp', erpController.syncVendorsFromERP);
router.post('/sync/inventory/from-erp', erpController.syncInventoryFromERP);
router.post('/sync/purchase-orders/from-erp', erpController.syncPurchaseOrdersFromERP);

module.exports = router; 