/**
 * Defect.js
 * 
 * Defect entity for the Inspection domain
 * Represents a defect found during an inspection
 */

const Entity = require('../../../core/Entity');
const { DomainError } = require('../../../core/errors');

class Defect extends Entity {
  constructor({
    id,
    title,
    description,
    severity = 'minor',
    status = 'open',
    category,
    location,
    photos = [],
    measurements = {},
    reportedBy,
    assignedTo = null,
    dueDate = null,
    resolutionNotes = '',
    relatedItemId = null,
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.title = title;
    this.description = description;
    this.severity = severity;
    this.status = status;
    this.category = category;
    this.location = location;
    this.photos = [...photos];
    this.measurements = { ...measurements };
    this.reportedBy = reportedBy;
    this.assignedTo = assignedTo;
    this.dueDate = dueDate ? new Date(dueDate) : null;
    this.resolutionNotes = resolutionNotes;
    this.relatedItemId = relatedItemId;
    
    this.validate();
  }
  
  validate() {
    if (!this.title) {
      throw new DomainError('Defect title is required');
    }
    
    if (!this.description) {
      throw new DomainError('Defect description is required');
    }
    
    const validSeverities = ['critical', 'major', 'minor', 'cosmetic'];
    if (!validSeverities.includes(this.severity)) {
      throw new DomainError(`Invalid severity: ${this.severity}. Must be one of: ${validSeverities.join(', ')}`);
    }
    
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed', 'rejected'];
    if (!validStatuses.includes(this.status)) {
      throw new DomainError(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
  
  updateDetails({
    title,
    description,
    severity,
    category,
    location,
    measurements,
    relatedItemId
  }) {
    if (title) this.title = title;
    if (description) this.description = description;
    
    if (severity) {
      const validSeverities = ['critical', 'major', 'minor', 'cosmetic'];
      if (!validSeverities.includes(severity)) {
        throw new DomainError(`Invalid severity: ${severity}. Must be one of: ${validSeverities.join(', ')}`);
      }
      this.severity = severity;
    }
    
    if (category) this.category = category;
    if (location) this.location = location;
    if (measurements) this.measurements = { ...this.measurements, ...measurements };
    if (relatedItemId !== undefined) this.relatedItemId = relatedItemId;
    
    this.markModified();
  }
  
  updateStatus(status) {
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed', 'rejected'];
    if (!validStatuses.includes(status)) {
      throw new DomainError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    this.status = status;
    this.markModified();
  }
  
  assignTo(userId, dueDate = null) {
    if (!userId) {
      throw new DomainError('User ID is required for assignment');
    }
    
    this.assignedTo = userId;
    
    if (dueDate) {
      this.dueDate = new Date(dueDate);
    }
    
    this.markModified();
  }
  
  resolve(resolutionNotes) {
    if (!resolutionNotes) {
      throw new DomainError('Resolution notes are required');
    }
    
    this.status = 'resolved';
    this.resolutionNotes = resolutionNotes;
    this.markModified();
  }
  
  close() {
    if (this.status !== 'resolved') {
      throw new DomainError('Defect must be resolved before closing');
    }
    
    this.status = 'closed';
    this.markModified();
  }
  
  reject(reason) {
    if (!reason) {
      throw new DomainError('Rejection reason is required');
    }
    
    this.status = 'rejected';
    this.resolutionNotes = reason;
    this.markModified();
  }
  
  reopen(reason = null) {
    if (this.status !== 'resolved' && this.status !== 'closed' && this.status !== 'rejected') {
      throw new DomainError('Only resolved, closed, or rejected defects can be reopened');
    }
    
    this.status = 'open';
    if (reason) {
      this.resolutionNotes += `\n\nReopened: ${reason}`;
    }
    
    this.markModified();
  }
  
  addPhoto(photoUrl) {
    if (!photoUrl) {
      throw new DomainError('Photo URL is required');
    }
    
    const photo = {
      id: require('uuid').v4(),
      url: photoUrl,
      uploadedAt: new Date()
    };
    
    this.photos.push(photo);
    this.markModified();
    
    return photo;
  }
  
  removePhoto(photoId) {
    const initialLength = this.photos.length;
    this.photos = this.photos.filter(p => p.id !== photoId);
    
    if (initialLength === this.photos.length) {
      throw new DomainError(`Photo with ID ${photoId} not found`);
    }
    
    this.markModified();
    return true;
  }
  
  isOpen() {
    return this.status === 'open' || this.status === 'in-progress';
  }
  
  isResolved() {
    return this.status === 'resolved' || this.status === 'closed';
  }
  
  isCritical() {
    return this.severity === 'critical';
  }
  
  toObject() {
    return {
      ...super.toObject(),
      title: this.title,
      description: this.description,
      severity: this.severity,
      status: this.status,
      category: this.category,
      location: this.location,
      photos: this.photos,
      measurements: this.measurements,
      reportedBy: this.reportedBy,
      assignedTo: this.assignedTo,
      dueDate: this.dueDate,
      resolutionNotes: this.resolutionNotes,
      relatedItemId: this.relatedItemId,
      isOpen: this.isOpen(),
      isResolved: this.isResolved(),
      isCritical: this.isCritical()
    };
  }
}

module.exports = Defect; 