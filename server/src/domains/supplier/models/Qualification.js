/**
 * Qualification.js
 * 
 * Qualification entity for the Supplier domain
 */

const Entity = require('../../../core/Entity');
const { DomainError } = require('../../../core/errors');

class Qualification extends Entity {
  constructor({
    id,
    type,
    issueDate,
    expiryDate,
    status = 'active',
    documentUrl,
    notes,
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.type = type;
    this.issueDate = issueDate ? new Date(issueDate) : null;
    this.expiryDate = expiryDate ? new Date(expiryDate) : null;
    this.status = status;
    this.documentUrl = documentUrl;
    this.notes = notes;
    
    this.validate();
  }
  
  validate() {
    if (!this.type) {
      throw new DomainError('Qualification type is required');
    }
    
    if (this.issueDate && this.expiryDate && this.issueDate > this.expiryDate) {
      throw new DomainError('Issue date cannot be after expiry date');
    }
    
    const validStatuses = ['active', 'expired', 'pending', 'revoked'];
    if (!validStatuses.includes(this.status)) {
      throw new DomainError(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
  
  isExpired() {
    if (!this.expiryDate) {
      return false;
    }
    
    return this.expiryDate < new Date();
  }
  
  updateStatus(status) {
    const validStatuses = ['active', 'expired', 'pending', 'revoked'];
    if (!validStatuses.includes(status)) {
      throw new DomainError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    this.status = status;
    this.markModified();
  }
  
  updateExpiryDate(expiryDate) {
    if (!expiryDate) {
      throw new DomainError('Expiry date is required');
    }
    
    const newExpiryDate = new Date(expiryDate);
    
    if (this.issueDate && newExpiryDate < this.issueDate) {
      throw new DomainError('Expiry date cannot be before issue date');
    }
    
    this.expiryDate = newExpiryDate;
    
    // Auto-update status if needed
    if (this.isExpired() && this.status === 'active') {
      this.status = 'expired';
    }
    
    this.markModified();
  }
  
  updateDocumentUrl(documentUrl) {
    this.documentUrl = documentUrl;
    this.markModified();
  }
  
  addNotes(notes) {
    this.notes = notes;
    this.markModified();
  }
  
  toObject() {
    return {
      ...super.toObject(),
      type: this.type,
      issueDate: this.issueDate,
      expiryDate: this.expiryDate,
      status: this.status,
      documentUrl: this.documentUrl,
      notes: this.notes
    };
  }
}

module.exports = Qualification; 