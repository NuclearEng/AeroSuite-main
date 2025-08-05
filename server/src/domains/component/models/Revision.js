/**
 * Revision.js
 * 
 * Revision entity for the Component domain
 * Represents a revision of a component
 */

const Entity = require('../../../core/Entity');
const { DomainError } = require('../../../core/errors');

class Revision extends Entity {
  constructor({
    id,
    version,
    description,
    changes = [],
    author,
    status = 'draft',
    approvedBy = null,
    approvedAt = null,
    effectiveDate = null,
    documents = [],
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.version = version;
    this.description = description;
    this.changes = [...changes];
    this.author = author;
    this.status = status;
    this.approvedBy = approvedBy;
    this.approvedAt = approvedAt ? new Date(approvedAt) : null;
    this.effectiveDate = effectiveDate ? new Date(effectiveDate) : null;
    this.documents = [...documents];
    
    this.validate();
  }
  
  validate() {
    if (!this.version) {
      throw new DomainError('Revision version is required');
    }
    
    // Validate version format (e.g., 1.0.0)
    const versionRegex = /^\d+\.\d+\.\d+$/;
    if (!versionRegex.test(this.version)) {
      throw new DomainError('Version must be in format X.Y.Z (e.g., 1.0.0)');
    }
    
    const validStatuses = ['draft', 'review', 'approved', 'obsolete'];
    if (!validStatuses.includes(this.status)) {
      throw new DomainError(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // If status is approved, approvedBy and approvedAt are required
    if (this.status === 'approved') {
      if (!this.approvedBy) {
        throw new DomainError('Approved revisions must have an approver');
      }
      
      if (!this.approvedAt) {
        throw new DomainError('Approved revisions must have an approval date');
      }
    }
  }
  
  updateDetails({
    description,
    changes,
    effectiveDate
  }) {
    if (this.status === 'approved' || this.status === 'obsolete') {
      throw new DomainError(`Cannot update details of a revision with status: ${this.status}`);
    }
    
    if (description !== undefined) this.description = description;
    if (changes) this.changes = [...changes];
    if (effectiveDate) this.effectiveDate = new Date(effectiveDate);
    
    this.markModified();
  }
  
  addChange(change) {
    if (this.status === 'approved' || this.status === 'obsolete') {
      throw new DomainError(`Cannot add changes to a revision with status: ${this.status}`);
    }
    
    if (!change.field || !change.description) {
      throw new DomainError('Change must have a field and description');
    }
    
    const newChange = {
      id: change.id || require('uuid').v4(),
      field: change.field,
      description: change.description,
      oldValue: change.oldValue,
      newValue: change.newValue,
      addedAt: new Date()
    };
    
    this.changes.push(newChange);
    this.markModified();
    
    return newChange;
  }
  
  removeChange(changeId) {
    if (this.status === 'approved' || this.status === 'obsolete') {
      throw new DomainError(`Cannot remove changes from a revision with status: ${this.status}`);
    }
    
    const initialLength = this.changes.length;
    this.changes = this.changes.filter(c => c.id !== changeId);
    
    if (initialLength === this.changes.length) {
      throw new DomainError(`Change with ID ${changeId} not found`);
    }
    
    this.markModified();
    return true;
  }
  
  updateStatus(status, approver = null) {
    const validStatuses = ['draft', 'review', 'approved', 'obsolete'];
    if (!validStatuses.includes(status)) {
      throw new DomainError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Validate status transitions
    const validTransitions = {
      'draft': ['review', 'obsolete'],
      'review': ['draft', 'approved', 'obsolete'],
      'approved': ['obsolete'],
      'obsolete': []
    };
    
    if (!validTransitions[this.status].includes(status)) {
      throw new DomainError(`Invalid status transition from ${this.status} to ${status}`);
    }
    
    // If transitioning to approved, require approver
    if (status === 'approved') {
      if (!approver) {
        throw new DomainError('Approver is required when setting status to approved');
      }
      
      this.approvedBy = approver;
      this.approvedAt = new Date();
      
      // Set effective date to today if not already set
      if (!this.effectiveDate) {
        this.effectiveDate = new Date();
      }
    }
    
    this.status = status;
    this.markModified();
  }
  
  addDocument(document) {
    if (this.status === 'approved' || this.status === 'obsolete') {
      throw new DomainError(`Cannot add documents to a revision with status: ${this.status}`);
    }
    
    if (!document.url || !document.type || !document.title) {
      throw new DomainError('Document must have a URL, type, and title');
    }
    
    const newDocument = {
      id: document.id || require('uuid').v4(),
      url: document.url,
      type: document.type,
      title: document.title,
      description: document.description || '',
      uploadedAt: new Date()
    };
    
    this.documents.push(newDocument);
    this.markModified();
    
    return newDocument;
  }
  
  removeDocument(documentId) {
    if (this.status === 'approved' || this.status === 'obsolete') {
      throw new DomainError(`Cannot remove documents from a revision with status: ${this.status}`);
    }
    
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(d => d.id !== documentId);
    
    if (initialLength === this.documents.length) {
      throw new DomainError(`Document with ID ${documentId} not found`);
    }
    
    this.markModified();
    return true;
  }
  
  isDraft() {
    return this.status === 'draft';
  }
  
  isApproved() {
    return this.status === 'approved';
  }
  
  isObsolete() {
    return this.status === 'obsolete';
  }
  
  toObject() {
    return {
      ...super.toObject(),
      version: this.version,
      description: this.description,
      changes: this.changes,
      author: this.author,
      status: this.status,
      approvedBy: this.approvedBy,
      approvedAt: this.approvedAt,
      effectiveDate: this.effectiveDate,
      documents: this.documents,
      isDraft: this.isDraft(),
      isApproved: this.isApproved(),
      isObsolete: this.isObsolete()
    };
  }
}

module.exports = Revision; 