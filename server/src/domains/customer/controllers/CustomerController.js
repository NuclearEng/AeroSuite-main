/**
 * CustomerController.js
 *
 * Controller for customer endpoints using stateless services
 * Implements RF076 - Customer controller implementation
 */

const StatelessController = require('../../../core/StatelessController');
const StatelessServiceFactory = require('../../../core/StatelessServiceFactory');
const CustomerService = require('../services/CustomerService');
const CustomerServiceInterface = require('../interfaces/CustomerServiceInterface');
const customerRepository = require('../repositories/CustomerRepository');

// Register the customer service with the factory
const serviceFactory = StatelessServiceFactory.getInstance();
serviceFactory.registerServiceType('customer', CustomerService, {
  customerRepository
});

/**
 * Controller for customer endpoints
 */
class CustomerController extends StatelessController {
  constructor() {
    super();
    this.getCustomerById = this.createServiceHandler(
      'customer',
      'findById',
      req => [req.params.id]
    );
    this.getAllCustomers = this.createServiceHandler(
      'customer',
      'findAll',
      req => [{
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        filter: req.query.filter ? JSON.parse(req.query.filter) : {}
      }]
    );
    this.createCustomer = this.createServiceHandler(
      'customer',
      'create',
      req => [req.body]
    );
    this.updateCustomer = this.createServiceHandler(
      'customer',
      'update',
      req => [req.params.id, req.body]
    );
    this.deleteCustomer = this.createServiceHandler(
      'customer',
      'delete',
      req => [req.params.id]
    );
    this.addContact = this.createServiceHandler(
      'customer',
      'addContact',
      req => [req.params.id, req.body]
    );
    this.updateContact = this.createServiceHandler(
      'customer',
      'updateContact',
      req => [req.params.id, req.params.contactId, req.body]
    );
    this.removeContact = this.createServiceHandler(
      'customer',
      'removeContact',
      req => [req.params.id, req.params.contactId]
    );
    this.searchCustomers = this.createServiceHandler(
      'customer',
      'search',
      req => [req.query.q, { page: parseInt(req.query.page) || 1, limit: parseInt(req.query.limit) || 10 }]
    );
  }
}

module.exports = new CustomerController(); 