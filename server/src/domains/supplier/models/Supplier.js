/**
 * Supplier.js
 * 
 * Supplier aggregate root for the Supplier domain
 */

const AggregateRoot = require('../../../core/AggregateRoot');
const Address = require('./Address');
const Contact = require('./Contact');
const Qualification = require('./Qualification');
const { DomainError } = require('../../../core/errors');

class Supplier extends AggregateRoot {
  constructor({
    id,
    name,
    code,
    type,
    status = 'active',
    address,
    contacts = [],
    qualifications = [],
    website,
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
    this.website = website;
    this.description = description;
    this.tags = tags;
    
    // Create value objects and entities
    this.address = address instanceof Address ? address : new Address(address);
    this.contacts = contacts.map(contact => 
      contact instanceof Contact ? contact : new Contact(contact)
    );
    this.qualifications = qualifications.map(qual => 
      qual instanceof Qualification ? qual : new Qualification(qual)
    );
    
    this.validate();
  }
  
  validate() {
    if (!this.name) {
      throw new DomainError('Supplier name is required');
    }
    
    if (!this.code) {
      throw new DomainError('Supplier code is required');
    }
    
    const validStatuses = ['active', 'inactive', 'pending', 'blacklisted'];
    if (!validStatuses.includes(this.status)) {
      throw new DomainError(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
  
  updateDetails({ name, code, type, website, description, tags }) {
    if (name) this.name = name;
    if (code) this.code = code;
    if (type) this.type = type;
    if (website !== undefined) this.website = website;
    if (description !== undefined) this.description = description;
    if (tags) this.tags = tags;
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'SupplierDetailsUpdated',
      payload: {
        supplierId: this.id,
        updatedFields: { name, code, type, website, description, tags }
      }
    });
  }
  
  updateAddress(addressData) {
    this.address = addressData instanceof Address ? addressData : new Address(addressData);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'SupplierAddressUpdated',
      payload: {
        supplierId: this.id,
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
      type: 'SupplierContactAdded',
      payload: {
        supplierId: this.id,
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
      type: 'SupplierContactUpdated',
      payload: {
        supplierId: this.id,
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
      type: 'SupplierContactRemoved',
      payload: {
        supplierId: this.id,
        contactId
      }
    });
    
    return initialLength !== this.contacts.length;
  }
  
  addQualification(qualificationData) {
    const qualification = qualificationData instanceof Qualification 
      ? qualificationData 
      : new Qualification(qualificationData);
    
    this.qualifications.push(qualification);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'SupplierQualificationAdded',
      payload: {
        supplierId: this.id,
        qualificationId: qualification.id
      }
    });
    
    return qualification;
  }
  
  updateQualification(qualificationId, qualificationData) {
    const qualification = this.qualifications.find(q => q.id === qualificationId);
    
    if (!qualification) {
      throw new DomainError(`Qualification with ID ${qualificationId} not found`);
    }
    
    if (qualificationData.status) {
      qualification.updateStatus(qualificationData.status);
    }
    
    if (qualificationData.expiryDate) {
      qualification.updateExpiryDate(qualificationData.expiryDate);
    }
    
    if (qualificationData.documentUrl) {
      qualification.updateDocumentUrl(qualificationData.documentUrl);
    }
    
    if (qualificationData.notes) {
      qualification.addNotes(qualificationData.notes);
    }
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'SupplierQualificationUpdated',
      payload: {
        supplierId: this.id,
        qualificationId: qualification.id
      }
    });
    
    return qualification;
  }
  
  removeQualification(qualificationId) {
    const initialLength = this.qualifications.length;
    this.qualifications = this.qualifications.filter(q => q.id !== qualificationId);
    
    if (initialLength !== this.qualifications.length) {
      this.markModified();
      
      // Add domain event
      this.addDomainEvent({
        type: 'SupplierQualificationRemoved',
        payload: {
          supplierId: this.id,
          qualificationId
        }
      });
      
      return true;
    }
    
    return false;
  }
  
  activate() {
    if (this.status !== 'active') {
      this.status = 'active';
      this.markModified();
      
      // Add domain event
      this.addDomainEvent({
        type: 'SupplierStatusChanged',
        payload: {
          supplierId: this.id,
          status: 'active'
        }
      });
    }
  }
  
  deactivate() {
    if (this.status !== 'inactive') {
      this.status = 'inactive';
      this.markModified();
      
      // Add domain event
      this.addDomainEvent({
        type: 'SupplierStatusChanged',
        payload: {
          supplierId: this.id,
          status: 'inactive'
        }
      });
    }
  }
  
  blacklist() {
    if (this.status !== 'blacklisted') {
      this.status = 'blacklisted';
      this.markModified();
      
      // Add domain event
      this.addDomainEvent({
        type: 'SupplierStatusChanged',
        payload: {
          supplierId: this.id,
          status: 'blacklisted'
        }
      });
    }
  }
  
  toObject() {
    return {
      ...super.toObject(),
      name: this.name,
      code: this.code,
      type: this.type,
      status: this.status,
      website: this.website,
      description: this.description,
      tags: this.tags,
      address: this.address.toObject(),
      contacts: this.contacts.map(c => c.toObject()),
      qualifications: this.qualifications.map(q => q.toObject())
    };
  }
  
  // Factory method
  static create(data) {
    const supplier = new Supplier(data);
    
    // Add domain event
    supplier.addDomainEvent({
      type: 'SupplierCreated',
      payload: {
        supplierId: supplier.id
      }
    });
    
    return supplier;
  }
}

module.exports = Supplier; 