/**
 * Customer.js
 * 
 * Customer aggregate root for the Customer domain
 */

const AggregateRoot = require('../../../core/AggregateRoot');
const Address = require('./Address');
const Contact = require('./Contact');
const { DomainError } = require('../../../core/errors');

class Customer extends AggregateRoot {
  constructor({
    id,
    name,
    code,
    type,
    status = 'active',
    address,
    contacts = [],
    creditRating,
    paymentTerms,
    website,
    industry,
    description,
    tags = [],
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.name = name;
    this.code = code;
    this.type = type;
    this.status = status;
    this.creditRating = creditRating;
    this.paymentTerms = paymentTerms;
    this.website = website;
    this.industry = industry;
    this.description = description;
    this.tags = tags;
    
    // Create value objects and entities
    this.address = address instanceof Address ? address : new Address(address);
    this.contacts = contacts.map(contact => 
      contact instanceof Contact ? contact : new Contact(contact)
    );
    
    this.validate();
  }
  
  validate() {
    if (!this.name) {
      throw new DomainError('Customer name is required');
    }
    
    if (!this.code) {
      throw new DomainError('Customer code is required');
    }
    
    const validStatuses = ['active', 'inactive', 'prospect', 'former'];
    if (!validStatuses.includes(this.status)) {
      throw new DomainError(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
  
  updateDetails({ name, code, type, creditRating, paymentTerms, website, industry, description, tags }) {
    if (name) this.name = name;
    if (code) this.code = code;
    if (type) this.type = type;
    if (creditRating !== undefined) this.creditRating = creditRating;
    if (paymentTerms !== undefined) this.paymentTerms = paymentTerms;
    if (website !== undefined) this.website = website;
    if (industry !== undefined) this.industry = industry;
    if (description !== undefined) this.description = description;
    if (tags) this.tags = tags;
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'CustomerDetailsUpdated',
      payload: {
        customerId: this.id,
        updatedFields: { name, code, type, creditRating, paymentTerms, website, industry, description, tags }
      }
    });
  }
  
  updateStatus(status) {
    const validStatuses = ['active', 'inactive', 'prospect', 'former'];
    if (!validStatuses.includes(status)) {
      throw new DomainError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    this.status = status;
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'CustomerStatusUpdated',
      payload: {
        customerId: this.id,
        status: this.status
      }
    });
  }
  
  updateAddress(addressData) {
    this.address = addressData instanceof Address ? addressData : new Address(addressData);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'CustomerAddressUpdated',
      payload: {
        customerId: this.id,
        address: this.address.toObject()
      }
    });
  }
  
  addContact(contactData) {
    const contact = contactData instanceof Contact ? contactData : new Contact(contactData);
    
    // If this is the first contact or marked as primary, ensure it's the only primary
    if (contact.isPrimary || this.contacts.length === 0) {
      this.contacts.forEach(c => c.removePrimary());
      contact.makePrimary();
    }
    
    this.contacts.push(contact);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'CustomerContactAdded',
      payload: {
        customerId: this.id,
        contactId: contact.id
      }
    });
    
    return contact;
  }
  
  updateContact(contactId, contactData) {
    const contact = this.contacts.find(c => c.id === contactId);
    
    if (!contact) {
      throw new DomainError(`Contact with ID ${contactId} not found`);
    }
    
    contact.updateDetails(contactData);
    
    // Handle primary contact changes
    if (contactData.isPrimary === true) {
      this.contacts.forEach(c => {
        if (c.id !== contactId) {
          c.removePrimary();
        }
      });
      contact.makePrimary();
    }
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'CustomerContactUpdated',
      payload: {
        customerId: this.id,
        contactId: contact.id
      }
    });
    
    return contact;
  }
  
  removeContact(contactId) {
    const initialLength = this.contacts.length;
    const contactToRemove = this.contacts.find(c => c.id === contactId);
    
    if (!contactToRemove) {
      throw new DomainError(`Contact with ID ${contactId} not found`);
    }
    
    this.contacts = this.contacts.filter(c => c.id !== contactId);
    
    // If we removed the primary contact, set a new one
    if (contactToRemove.isPrimary && this.contacts.length > 0) {
      this.contacts[0].makePrimary();
    }
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'CustomerContactRemoved',
      payload: {
        customerId: this.id,
        contactId
      }
    });
    
    return initialLength !== this.contacts.length;
  }
  
  toObject() {
    return {
      ...super.toObject(),
      name: this.name,
      code: this.code,
      type: this.type,
      status: this.status,
      creditRating: this.creditRating,
      paymentTerms: this.paymentTerms,
      website: this.website,
      industry: this.industry,
      description: this.description,
      tags: this.tags,
      address: this.address.toObject(),
      contacts: this.contacts.map(c => c.toObject())
    };
  }
  
  // Factory method
  static create(data) {
    const customer = new Customer(data);
    
    // Add domain event
    customer.addDomainEvent({
      type: 'CustomerCreated',
      payload: {
        customerId: customer.id
      }
    });
    
    return customer;
  }
}

module.exports = Customer; 