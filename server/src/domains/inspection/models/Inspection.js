/**
 * Inspection.js
 * 
 * Inspection aggregate root for the Inspection domain
 */

const AggregateRoot = require('../../../core/AggregateRoot');
const InspectionItem = require('./InspectionItem');
const Defect = require('./Defect');
const { DomainError } = require('../../../core/errors');

class Inspection extends AggregateRoot {
  constructor({
    id,
    title,
    description,
    customerId,
    supplierId,
    componentId,
    status = 'scheduled',
    scheduledDate,
    completedDate,
    inspectorId,
    location,
    inspectionType,
    items = [],
    defects = [],
    attachments = [],
    notes = '',
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.title = title;
    this.description = description;
    this.customerId = customerId;
    this.supplierId = supplierId;
    this.componentId = componentId;
    this.status = status;
    this.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
    this.completedDate = completedDate ? new Date(completedDate) : null;
    this.inspectorId = inspectorId;
    this.location = location;
    this.inspectionType = inspectionType;
    this.notes = notes;
    
    // Create entities
    this.items = items.map(item => 
      item instanceof InspectionItem ? item : new InspectionItem(item)
    );
    
    this.defects = defects.map(defect => 
      defect instanceof Defect ? defect : new Defect(defect)
    );
    
    this.attachments = [...attachments];
    
    this.validate();
  }
  
  validate() {
    if (!this.title) {
      throw new DomainError('Inspection title is required');
    }
    
    if (!this.scheduledDate) {
      throw new DomainError('Scheduled date is required');
    }
    
    if (!this.customerId && !this.supplierId) {
      throw new DomainError('Either customer ID or supplier ID is required');
    }
    
    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(this.status)) {
      throw new DomainError(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    if (this.status === 'completed' && !this.completedDate) {
      throw new DomainError('Completed date is required when status is completed');
    }
  }
  
  updateDetails({ 
    title, 
    description, 
    customerId, 
    supplierId, 
    componentId, 
    scheduledDate, 
    inspectorId, 
    location, 
    inspectionType, 
    notes 
  }) {
    if (title) this.title = title;
    if (description !== undefined) this.description = description;
    if (customerId) this.customerId = customerId;
    if (supplierId) this.supplierId = supplierId;
    if (componentId) this.componentId = componentId;
    if (scheduledDate) this.scheduledDate = new Date(scheduledDate);
    if (inspectorId) this.inspectorId = inspectorId;
    if (location) this.location = location;
    if (inspectionType) this.inspectionType = inspectionType;
    if (notes !== undefined) this.notes = notes;
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'InspectionDetailsUpdated',
      payload: {
        inspectionId: this.id,
        updatedFields: { 
          title, 
          description, 
          customerId, 
          supplierId, 
          componentId, 
          scheduledDate, 
          inspectorId, 
          location, 
          inspectionType, 
          notes 
        }
      }
    });
  }
  
  updateStatus(status) {
    const validStatuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new DomainError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    // Handle status transitions
    if (this.status === 'cancelled' && status !== 'scheduled') {
      throw new DomainError('Cancelled inspections can only be rescheduled');
    }
    
    if (this.status === 'completed' && status !== 'completed') {
      throw new DomainError('Completed inspections cannot change status');
    }
    
    // Set completed date when moving to completed status
    if (status === 'completed' && this.status !== 'completed') {
      this.completedDate = new Date();
    }
    
    // Clear completed date when moving from completed status
    if (status !== 'completed' && this.status === 'completed') {
      this.completedDate = null;
    }
    
    this.status = status;
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'InspectionStatusUpdated',
      payload: {
        inspectionId: this.id,
        previousStatus: this.status,
        newStatus: status
      }
    });
  }
  
  addItem(itemData) {
    const item = itemData instanceof InspectionItem 
      ? itemData 
      : new InspectionItem(itemData);
    
    this.items.push(item);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'InspectionItemAdded',
      payload: {
        inspectionId: this.id,
        itemId: item.id
      }
    });
    
    return item;
  }
  
  updateItem(itemId, itemData) {
    const item = this.items.find(i => i.id === itemId);
    
    if (!item) {
      throw new DomainError(`Inspection item with ID ${itemId} not found`);
    }
    
    item.updateDetails(itemData);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'InspectionItemUpdated',
      payload: {
        inspectionId: this.id,
        itemId: item.id
      }
    });
    
    return item;
  }
  
  removeItem(itemId) {
    const initialLength = this.items.length;
    this.items = this.items.filter(i => i.id !== itemId);
    
    if (initialLength === this.items.length) {
      throw new DomainError(`Inspection item with ID ${itemId} not found`);
    }
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'InspectionItemRemoved',
      payload: {
        inspectionId: this.id,
        itemId
      }
    });
    
    return true;
  }
  
  addDefect(defectData) {
    const defect = defectData instanceof Defect 
      ? defectData 
      : new Defect(defectData);
    
    this.defects.push(defect);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'DefectRecorded',
      payload: {
        inspectionId: this.id,
        defectId: defect.id
      }
    });
    
    return defect;
  }
  
  updateDefect(defectId, defectData) {
    const defect = this.defects.find(d => d.id === defectId);
    
    if (!defect) {
      throw new DomainError(`Defect with ID ${defectId} not found`);
    }
    
    defect.updateDetails(defectData);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'DefectUpdated',
      payload: {
        inspectionId: this.id,
        defectId: defect.id
      }
    });
    
    return defect;
  }
  
  removeDefect(defectId) {
    const initialLength = this.defects.length;
    this.defects = this.defects.filter(d => d.id !== defectId);
    
    if (initialLength === this.defects.length) {
      throw new DomainError(`Defect with ID ${defectId} not found`);
    }
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'DefectRemoved',
      payload: {
        inspectionId: this.id,
        defectId
      }
    });
    
    return true;
  }
  
  addAttachment(attachment) {
    if (!attachment.url || !attachment.type) {
      throw new DomainError('Attachment must have a URL and type');
    }
    
    const newAttachment = {
      id: attachment.id || require('uuid').v4(),
      url: attachment.url,
      type: attachment.type,
      name: attachment.name || 'Unnamed attachment',
      uploadedAt: attachment.uploadedAt || new Date()
    };
    
    this.attachments.push(newAttachment);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'AttachmentAdded',
      payload: {
        inspectionId: this.id,
        attachmentId: newAttachment.id
      }
    });
    
    return newAttachment;
  }
  
  removeAttachment(attachmentId) {
    const initialLength = this.attachments.length;
    this.attachments = this.attachments.filter(a => a.id !== attachmentId);
    
    if (initialLength === this.attachments.length) {
      throw new DomainError(`Attachment with ID ${attachmentId} not found`);
    }
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'AttachmentRemoved',
      payload: {
        inspectionId: this.id,
        attachmentId
      }
    });
    
    return true;
  }
  
  getDefectCount() {
    return this.defects.length;
  }
  
  getCompletedItemsCount() {
    return this.items.filter(item => item.isCompleted()).length;
  }
  
  getCompletionPercentage() {
    if (this.items.length === 0) return 0;
    return (this.getCompletedItemsCount() / this.items.length) * 100;
  }
  
  isComplete() {
    return this.status === 'completed';
  }
  
  toObject() {
    return {
      ...super.toObject(),
      title: this.title,
      description: this.description,
      customerId: this.customerId,
      supplierId: this.supplierId,
      componentId: this.componentId,
      status: this.status,
      scheduledDate: this.scheduledDate,
      completedDate: this.completedDate,
      inspectorId: this.inspectorId,
      location: this.location,
      inspectionType: this.inspectionType,
      notes: this.notes,
      items: this.items.map(item => item.toObject()),
      defects: this.defects.map(defect => defect.toObject()),
      attachments: this.attachments,
      completionPercentage: this.getCompletionPercentage()
    };
  }
  
  // Factory method
  static create(data) {
    const inspection = new Inspection(data);
    
    // Add domain event
    inspection.addDomainEvent({
      type: 'InspectionCreated',
      payload: {
        inspectionId: inspection.id
      }
    });
    
    return inspection;
  }
  
  // Factory method for creating from template
  static createFromTemplate(template, overrides = {}) {
    const data = {
      title: template.title,
      description: template.description,
      inspectionType: template.inspectionType,
      items: template.items || [],
      ...overrides
    };
    
    const inspection = Inspection.create(data);
    
    // Add domain event
    inspection.addDomainEvent({
      type: 'InspectionCreatedFromTemplate',
      payload: {
        inspectionId: inspection.id,
        templateId: template.id
      }
    });
    
    return inspection;
  }
}

module.exports = Inspection; 