/**
 * ComponentController.js
 *
 * Controller for component endpoints using stateless services
 * Implements RF078 - Component controller implementation
 */

const StatelessController = require('../../../core/StatelessController');
const StatelessServiceFactory = require('../../../core/StatelessServiceFactory');
const ComponentService = require('../services/ComponentService');
const ComponentServiceInterface = require('../interfaces/ComponentServiceInterface');
const componentRepository = require('../repositories/ComponentRepository');

// Register the component service with the factory
const serviceFactory = StatelessServiceFactory.getInstance();
serviceFactory.registerServiceType('component', ComponentService, {
  componentRepository
});

/**
 * Controller for component endpoints
 */
class ComponentController extends StatelessController {
  constructor() {
    super();
    this.getComponentById = this.createServiceHandler(
      'component',
      'findById',
      req => [req.params.id]
    );
    this.getAllComponents = this.createServiceHandler(
      'component',
      'findAll',
      req => [{
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        filter: req.query.filter ? JSON.parse(req.query.filter) : {}
      }]
    );
    this.createComponent = this.createServiceHandler(
      'component',
      'create',
      req => [req.body]
    );
    this.updateComponent = this.createServiceHandler(
      'component',
      'update',
      req => [req.params.id, req.body]
    );
    this.deleteComponent = this.createServiceHandler(
      'component',
      'delete',
      req => [req.params.id]
    );
    this.addDocument = this.createServiceHandler(
      'component',
      'addDocument',
      req => [req.params.id, req.body]
    );
    this.updateDocument = this.createServiceHandler(
      'component',
      'updateDocument',
      req => [req.params.id, req.params.documentId, req.body]
    );
    this.removeDocument = this.createServiceHandler(
      'component',
      'removeDocument',
      req => [req.params.id, req.params.documentId]
    );
    this.searchComponents = this.createServiceHandler(
      'component',
      'search',
      req => [req.query.q, { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 }]
    );
  }
}

module.exports = new ComponentController(); 