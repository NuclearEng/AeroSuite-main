/**
 * StatelessSupplierController.js
 * 
 * Controller for supplier endpoints using stateless services
 * Implements RF037 - Ensure all services are stateless
 */

const StatelessController = require('../../../core/StatelessController');
const StatelessServiceFactory = require('../../../core/StatelessServiceFactory');
const StatelessSupplierService = require('../services/StatelessSupplierService');
const supplierRepository = require('../repositories/SupplierRepository');

/**
 * Register the supplier service with the factory
 */
const serviceFactory = StatelessServiceFactory.getInstance();
serviceFactory.registerServiceType('supplier', StatelessSupplierService, {
  supplierRepository
});

/**
 * Controller for supplier endpoints
 */
class StatelessSupplierController extends StatelessController {
  /**
   * Create a new supplier controller
   */
  constructor() {
    super();
    
    // Define route handlers
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
        filters: req.query.filters ? JSON.parse(req.query.filters) : {}
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
  }
  
  /**
   * Custom handler for searching suppliers
   */
  async searchSuppliers(req, res, next) {
    try {
      const supplierService = this.getService('supplier');
      const searchTerm = req.query.q || '';
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        filters: {
          searchTerm
        }
      };
      
      // Execute service method with request context
      const result = await this.executeServiceMethod(
        supplierService,
        'findAll',
        req,
        options
      );
      
      this.sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new StatelessSupplierController(); 