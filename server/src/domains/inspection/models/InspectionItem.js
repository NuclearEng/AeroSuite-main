/**
 * InspectionItem.js
 * 
 * InspectionItem entity for the Inspection domain
 * Represents a single item to be checked during an inspection
 */

const Entity = require('../../../core/Entity');
const { DomainError } = require('../../../core/errors');

class InspectionItem extends Entity {
  constructor({
    id,
    name,
    description,
    category,
    order = 0,
    status = 'pending',
    result = null,
    expectedValue = null,
    actualValue = null,
    tolerance = null,
    unitOfMeasure = null,
    isRequired = true,
    photos = [],
    notes = '',
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.name = name;
    this.description = description;
    this.category = category;
    this.order = order;
    this.status = status;
    this.result = result;
    this.expectedValue = expectedValue;
    this.actualValue = actualValue;
    this.tolerance = tolerance;
    this.unitOfMeasure = unitOfMeasure;
    this.isRequired = isRequired;
    this.photos = [...photos];
    this.notes = notes;
    
    this.validate();
  }
  
  validate() {
    if (!this.name) {
      throw new DomainError('Inspection item name is required');
    }
    
    const validStatuses = ['pending', 'passed', 'failed', 'na'];
    if (!validStatuses.includes(this.status)) {
      throw new DomainError(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // If numeric values are provided, validate them
    if (this.expectedValue !== null && this.actualValue !== null && this.tolerance !== null) {
      if (typeof this.expectedValue !== 'number' || typeof this.actualValue !== 'number' || typeof this.tolerance !== 'number') {
        throw new DomainError('Expected value, actual value, and tolerance must be numbers');
      }
    }
  }
  
  updateDetails({
    name,
    description,
    category,
    order,
    isRequired,
    expectedValue,
    tolerance,
    unitOfMeasure,
    notes
  }) {
    if (name) this.name = name;
    if (description !== undefined) this.description = description;
    if (category) this.category = category;
    if (order !== undefined) this.order = order;
    if (isRequired !== undefined) this.isRequired = isRequired;
    if (expectedValue !== undefined) this.expectedValue = expectedValue;
    if (tolerance !== undefined) this.tolerance = tolerance;
    if (unitOfMeasure !== undefined) this.unitOfMeasure = unitOfMeasure;
    if (notes !== undefined) this.notes = notes;
    
    this.markModified();
  }
  
  complete(result, actualValue = null, notes = null) {
    const validResults = ['passed', 'failed', 'na'];
    if (!validResults.includes(result)) {
      throw new DomainError(`Invalid result: ${result}. Must be one of: ${validResults.join(', ')}`);
    }
    
    this.status = result;
    this.result = result;
    
    if (actualValue !== null) {
      this.actualValue = actualValue;
    }
    
    if (notes !== null) {
      this.notes = notes;
    }
    
    this.markModified();
  }
  
  reset() {
    this.status = 'pending';
    this.result = null;
    this.actualValue = null;
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
  
  isCompleted() {
    return this.status !== 'pending';
  }
  
  isPassed() {
    return this.status === 'passed';
  }
  
  isFailed() {
    return this.status === 'failed';
  }
  
  isWithinTolerance() {
    if (this.expectedValue === null || this.actualValue === null || this.tolerance === null) {
      return null; // Cannot determine
    }
    
    const diff = Math.abs(this.expectedValue - this.actualValue);
    return diff <= this.tolerance;
  }
  
  toObject() {
    return {
      ...super.toObject(),
      name: this.name,
      description: this.description,
      category: this.category,
      order: this.order,
      status: this.status,
      result: this.result,
      expectedValue: this.expectedValue,
      actualValue: this.actualValue,
      tolerance: this.tolerance,
      unitOfMeasure: this.unitOfMeasure,
      isRequired: this.isRequired,
      photos: this.photos,
      notes: this.notes,
      isCompleted: this.isCompleted(),
      isWithinTolerance: this.isWithinTolerance()
    };
  }
}

module.exports = InspectionItem; 