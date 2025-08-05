/**
 * Customer domain event schemas
 * 
 * Defines the structure and validation rules for customer domain events
 * These schemas are used for validating events before they are published
 */

const customerEventSchemas = {
  // Customer lifecycle events
  CustomerCreated: {
    description: 'Triggered when a new customer is created',
    required: ['customerId', 'name', 'code'],
    properties: {
      customerId: { type: 'string' },
      name: { type: 'string' },
      code: { type: 'string' },
      type: { type: 'string' },
      status: { type: 'string' }
    }
  },
  
  CustomerDetailsUpdated: {
    description: 'Triggered when customer details are updated',
    required: ['customerId', 'updatedFields'],
    properties: {
      customerId: { type: 'string' },
      updatedFields: { type: 'object' }
    }
  },
  
  CustomerStatusUpdated: {
    description: 'Triggered when customer status changes',
    required: ['customerId', 'status'],
    properties: {
      customerId: { type: 'string' },
      status: { type: 'string' }
    }
  },
  
  CustomerAddressUpdated: {
    description: 'Triggered when customer address is updated',
    required: ['customerId', 'address'],
    properties: {
      customerId: { type: 'string' },
      address: { type: 'object' }
    }
  },
  
  // Contact-related events
  CustomerContactAdded: {
    description: 'Triggered when a contact is added to a customer',
    required: ['customerId', 'contactId'],
    properties: {
      customerId: { type: 'string' },
      contactId: { type: 'string' }
    }
  },
  
  CustomerContactUpdated: {
    description: 'Triggered when a customer contact is updated',
    required: ['customerId', 'contactId'],
    properties: {
      customerId: { type: 'string' },
      contactId: { type: 'string' }
    }
  },
  
  CustomerContactRemoved: {
    description: 'Triggered when a contact is removed from a customer',
    required: ['customerId', 'contactId'],
    properties: {
      customerId: { type: 'string' },
      contactId: { type: 'string' }
    }
  }
};

module.exports = customerEventSchemas; 