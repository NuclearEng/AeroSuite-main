/**
 * SupplierController.js
 *
 * Controller for supplier endpoints using stateless services
 * Implements RF075 - Supplier controller implementation
 */

const StatelessController = require('../../../core/StatelessController');
const StatelessServiceFactory = require('../../../core/StatelessServiceFactory');
const SupplierService = require('../services/SupplierService');
const SupplierServiceInterface = require('../interfaces/SupplierServiceInterface');
const supplierRepository = require('../repositories/SupplierRepository');

// Register the supplier service with the factory
const serviceFactory = StatelessServiceFactory.getInstance();
serviceFactory.registerServiceType('supplier', SupplierService, {
  supplierRepository
});

/**
 * Controller for supplier endpoints
 */
class SupplierController extends StatelessController {
  constructor() {
    super();
    this.getSupplierById = this.createServiceHandler(
      'supplier',
      'findById',
      req => [req.params.id]
    );
    this.getAllSuppliers = this.createServiceHandler(
      'supplier',
      'findAll',
      req => [{
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        filter: req.query.filter ? JSON.parse(req.query.filter) : {}
      }]
    );
    this.createSupplier = this.createServiceHandler(
      'supplier',
      'create',
      req => [req.body]
    );
    this.updateSupplier = this.createServiceHandler(
      'supplier',
      'update',
      req => [req.params.id, req.body]
    );
    this.deleteSupplier = this.createServiceHandler(
      'supplier',
      'delete',
      req => [req.params.id]
    );
    this.addContact = this.createServiceHandler(
      'supplier',
      'addContact',
      req => [req.params.id, req.body]
    );
    this.updateContact = this.createServiceHandler(
      'supplier',
      'updateContact',
      req => [req.params.id, req.params.contactId, req.body]
    );
    this.removeContact = this.createServiceHandler(
      'supplier',
      'removeContact',
      req => [req.params.id, req.params.contactId]
    );
    this.searchSuppliers = this.createServiceHandler(
      'supplier',
      'search',
      req => [req.query.q, { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 }]
    );
    this.getMetrics = this.createServiceHandler(
      'supplier',
      'getMetrics',
      req => [req.params.id]
    );
  }
}

module.exports = new SupplierController(); 