/**
 * InspectionController.js
 *
 * Controller for inspection endpoints using stateless services
 * Implements RF077 - Inspection controller implementation
 */

const StatelessController = require('../../../core/StatelessController');
const StatelessServiceFactory = require('../../../core/StatelessServiceFactory');
const InspectionService = require('../services/InspectionService');
const InspectionServiceInterface = require('../interfaces/InspectionServiceInterface');
const inspectionRepository = require('../repositories/InspectionRepository');

// Register the inspection service with the factory
const serviceFactory = StatelessServiceFactory.getInstance();
serviceFactory.registerServiceType('inspection', InspectionService, {
  inspectionRepository
});

/**
 * Controller for inspection endpoints
 */
class InspectionController extends StatelessController {
  constructor() {
    super();
    this.getInspectionById = this.createServiceHandler(
      'inspection',
      'getInspection',
      req => [req.params.id]
    );
    this.getAllInspections = this.createServiceHandler(
      'inspection',
      'findAll',
      req => [{
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        filter: req.query.filter ? JSON.parse(req.query.filter) : {}
      }]
    );
    this.createInspection = this.createServiceHandler(
      'inspection',
      'create',
      req => [req.body]
    );
    this.updateInspection = this.createServiceHandler(
      'inspection',
      'update',
      req => [req.params.id, req.body]
    );
    this.deleteInspection = this.createServiceHandler(
      'inspection',
      'delete',
      req => [req.params.id]
    );
    this.addFinding = this.createServiceHandler(
      'inspection',
      'addFinding',
      req => [req.params.id, req.body]
    );
    this.updateFinding = this.createServiceHandler(
      'inspection',
      'updateFinding',
      req => [req.params.id, req.params.findingId, req.body]
    );
    this.removeFinding = this.createServiceHandler(
      'inspection',
      'removeFinding',
      req => [req.params.id, req.params.findingId]
    );
    this.searchInspections = this.createServiceHandler(
      'inspection',
      'search',
      req => [req.query.q, { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 }]
    );
    this.getInspectionStats = this.createServiceHandler(
      'inspection',
      'getStats',
      req => []
    );
    this.getInspectionsBySupplier = this.createServiceHandler(
      'inspection',
      'findBySupplier',
      req => [req.params.supplierId, { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 }]
    );
  }
}

module.exports = new InspectionController(); 