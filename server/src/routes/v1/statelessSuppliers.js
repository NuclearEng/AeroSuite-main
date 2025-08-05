/**
 * Stateless Suppliers Routes
 * Implements RF037 - Ensure all services are stateless
 */

const express = require('express');
const router = express.Router();
const supplierController = require('../../domains/supplier/controllers/StatelessSupplierController');
const requestContextMiddleware = require('../../core/middleware/RequestContextMiddleware');

// Apply request context middleware to all routes
router.use(requestContextMiddleware());

// GET /api/v1/stateless/suppliers
router.get('/', supplierController.getAllSuppliers);

// POST /api/v1/stateless/suppliers
router.post('/', supplierController.createSupplier);

// GET /api/v1/stateless/suppliers/search
router.get('/search', supplierController.searchSuppliers);

// GET /api/v1/stateless/suppliers/:id
router.get('/:id', supplierController.getSupplierById);

// PUT /api/v1/stateless/suppliers/:id
router.put('/:id', supplierController.updateSupplier);

// DELETE /api/v1/stateless/suppliers/:id
router.delete('/:id', supplierController.deleteSupplier);

// POST /api/v1/stateless/suppliers/:id/contacts
router.post('/:id/contacts', supplierController.addContact);

module.exports = router; 