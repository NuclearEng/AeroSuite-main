/**
 * Customer domain event publishers
 * 
 * Publishes events from the customer domain to be consumed by other domains
 */

const domainEventBus = require('../../../core/DomainEventBus');
const logger = require('../../../utils/logger');
const customerEventSchemas = require('./schemas');

/**
 * Initialize event publishers for the customer domain
 */
function initializeCustomerEventPublishers() {
  logger.info('Initializing Customer domain event publishers');
  
  // Register event schemas
  Object.entries(customerEventSchemas).forEach(([eventType, schema]) => {
    domainEventBus.registerEventSchema(eventType, schema);
  });
}

/**
 * Publish a customer created event
 * 
 * @param {Object} customer - The created customer
 */
function publishCustomerCreated(customer) {
  const customerData = customer.toObject ? customer.toObject() : customer;
  
  domainEventBus.publishFromContext('customer', {
    type: 'CustomerCreated',
    payload: {
      customerId: customerData.id,
      name: customerData.name,
      code: customerData.code,
      type: customerData.type,
      status: customerData.status
    }
  });
}

/**
 * Publish a customer status updated event
 * 
 * @param {Object} customer - The updated customer
 * @param {string} previousStatus - The previous status
 */
function publishCustomerStatusUpdated(customer, previousStatus) {
  const customerData = customer.toObject ? customer.toObject() : customer;
  
  domainEventBus.publishFromContext('customer', {
    type: 'CustomerStatusUpdated',
    payload: {
      customerId: customerData.id,
      status: customerData.status,
      previousStatus
    }
  });
}

/**
 * Publish a customer details updated event
 * 
 * @param {Object} customer - The updated customer
 * @param {Object} updatedFields - The fields that were updated
 */
function publishCustomerDetailsUpdated(customer, updatedFields) {
  const customerData = customer.toObject ? customer.toObject() : customer;
  
  domainEventBus.publishFromContext('customer', {
    type: 'CustomerDetailsUpdated',
    payload: {
      customerId: customerData.id,
      updatedFields
    }
  });
}

/**
 * Publish a customer address updated event
 * 
 * @param {Object} customer - The customer
 * @param {Object} address - The updated address
 */
function publishCustomerAddressUpdated(customer, address) {
  const customerData = customer.toObject ? customer.toObject() : customer;
  const addressData = address.toObject ? address.toObject() : address;
  
  domainEventBus.publishFromContext('customer', {
    type: 'CustomerAddressUpdated',
    payload: {
      customerId: customerData.id,
      address: addressData
    }
  });
}

/**
 * Publish a customer contact added event
 * 
 * @param {Object} customer - The customer
 * @param {Object} contact - The added contact
 */
function publishCustomerContactAdded(customer, contact) {
  const customerData = customer.toObject ? customer.toObject() : customer;
  const contactData = contact.toObject ? contact.toObject() : contact;
  
  domainEventBus.publishFromContext('customer', {
    type: 'CustomerContactAdded',
    payload: {
      customerId: customerData.id,
      contactId: contactData.id,
      contact: {
        name: contactData.name,
        email: contactData.email,
        isPrimary: contactData.isPrimary
      }
    }
  });
}

module.exports = {
  initializeCustomerEventPublishers,
  publishCustomerCreated,
  publishCustomerStatusUpdated,
  publishCustomerDetailsUpdated,
  publishCustomerAddressUpdated,
  publishCustomerContactAdded
}; 