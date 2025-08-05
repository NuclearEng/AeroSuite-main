/**
 * Component.js
 * 
 * Component aggregate root for the Component domain
 */

const AggregateRoot = require('../../../core/AggregateRoot');
const Specification = require('./Specification');
const Revision = require('./Revision');
const { DomainError } = require('../../../core/errors');

class Component extends AggregateRoot {
  constructor({
    id,
    name,
    code,
    description,
    category,
    status = 'active',
    supplierId,
    specifications = [],
    revisions = [],
    documents = [],
    relatedComponents = [],
    tags = [],
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.name = name;
    this.code = code;
    this.description = description;
    this.category = category;
    this.status = status;
    this.supplierId = supplierId;
    this.tags = tags;
    
    // Create value objects and entities
    this.specifications = specifications.map(spec => 
      spec instanceof Specification ? spec : new Specification(spec)
    );
    
    this.revisions = revisions.map(revision => 
      revision instanceof Revision ? revision : new Revision(revision)
    );
    
    this.documents = [...documents];
    this.relatedComponents = [...relatedComponents];
    
    this.validate();
  }
  
  validate() {
    if (!this.name) {
      throw new DomainError('Component name is required');
    }
    
    if (!this.code) {
      throw new DomainError('Component code is required');
    }
    
    const validStatuses = ['active', 'obsolete', 'development', 'discontinued'];
    if (!validStatuses.includes(this.status)) {
      throw new DomainError(`Invalid status: ${this.status}. Must be one of: ${validStatuses.join(', ')}`);
    }
  }
  
  updateDetails({ 
    name, 
    code, 
    description, 
    category, 
    supplierId, 
    tags 
  }) {
    if (name) this.name = name;
    if (code) this.code = code;
    if (description !== undefined) this.description = description;
    if (category) this.category = category;
    if (supplierId !== undefined) this.supplierId = supplierId;
    if (tags) this.tags = tags;
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentDetailsUpdated',
      payload: {
        componentId: this.id,
        updatedFields: { name, code, description, category, supplierId, tags }
      }
    });
  }
  
  updateStatus(status) {
    const validStatuses = ['active', 'obsolete', 'development', 'discontinued'];
    if (!validStatuses.includes(status)) {
      throw new DomainError(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
    }
    
    this.status = status;
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentStatusUpdated',
      payload: {
        componentId: this.id,
        status: this.status
      }
    });
  }
  
  addSpecification(specData) {
    const specification = specData instanceof Specification 
      ? specData 
      : new Specification(specData);
    
    this.specifications.push(specification);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentSpecificationAdded',
      payload: {
        componentId: this.id,
        specificationId: specification.id
      }
    });
    
    return specification;
  }
  
  updateSpecification(specId, specData) {
    const specification = this.specifications.find(s => s.id === specId);
    
    if (!specification) {
      throw new DomainError(`Specification with ID ${specId} not found`);
    }
    
    specification.updateDetails(specData);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentSpecificationUpdated',
      payload: {
        componentId: this.id,
        specificationId: specification.id
      }
    });
    
    return specification;
  }
  
  removeSpecification(specId) {
    const initialLength = this.specifications.length;
    this.specifications = this.specifications.filter(s => s.id !== specId);
    
    if (initialLength === this.specifications.length) {
      throw new DomainError(`Specification with ID ${specId} not found`);
    }
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentSpecificationRemoved',
      payload: {
        componentId: this.id,
        specificationId: specId
      }
    });
    
    return true;
  }
  
  createRevision(revisionData) {
    const revision = revisionData instanceof Revision 
      ? revisionData 
      : new Revision({
          ...revisionData,
          version: this.getNextRevisionVersion()
        });
    
    this.revisions.push(revision);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentRevisionCreated',
      payload: {
        componentId: this.id,
        revisionId: revision.id,
        version: revision.version
      }
    });
    
    return revision;
  }
  
  getNextRevisionVersion() {
    if (this.revisions.length === 0) {
      return '1.0.0';
    }
    
    // Find the highest version
    const versions = this.revisions.map(r => r.version);
    const highestVersion = versions.sort((a, b) => {
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);
      
      for (let i = 0; i < aParts.length; i++) {
        if (aParts[i] !== bParts[i]) {
          return bParts[i] - aParts[i];
        }
      }
      
      return 0;
    })[0];
    
    // Increment the version
    const parts = highestVersion.split('.').map(Number);
    parts[2] += 1;
    
    // If minor version reaches 10, increment major and reset minor
    if (parts[2] >= 10) {
      parts[1] += 1;
      parts[2] = 0;
      
      // If major version reaches 10, increment major and reset minor
      if (parts[1] >= 10) {
        parts[0] += 1;
        parts[1] = 0;
      }
    }
    
    return parts.join('.');
  }
  
  getCurrentRevision() {
    if (this.revisions.length === 0) {
      return null;
    }
    
    // Sort revisions by version (descending)
    const sortedRevisions = [...this.revisions].sort((a, b) => {
      const aParts = a.version.split('.').map(Number);
      const bParts = b.version.split('.').map(Number);
      
      for (let i = 0; i < aParts.length; i++) {
        if (aParts[i] !== bParts[i]) {
          return bParts[i] - aParts[i];
        }
      }
      
      return 0;
    });
    
    return sortedRevisions[0];
  }
  
  addDocument(document) {
    if (!document.url || !document.type || !document.title) {
      throw new DomainError('Document must have a URL, type, and title');
    }
    
    const newDocument = {
      id: document.id || require('uuid').v4(),
      url: document.url,
      type: document.type,
      title: document.title,
      description: document.description || '',
      version: document.version || '1.0',
      uploadedAt: document.uploadedAt || new Date()
    };
    
    this.documents.push(newDocument);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentDocumentAdded',
      payload: {
        componentId: this.id,
        documentId: newDocument.id
      }
    });
    
    return newDocument;
  }
  
  updateDocument(documentId, documentData) {
    const documentIndex = this.documents.findIndex(d => d.id === documentId);
    
    if (documentIndex === -1) {
      throw new DomainError(`Document with ID ${documentId} not found`);
    }
    
    const updatedDocument = {
      ...this.documents[documentIndex],
      ...documentData,
      id: documentId // Ensure ID doesn't change
    };
    
    this.documents[documentIndex] = updatedDocument;
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentDocumentUpdated',
      payload: {
        componentId: this.id,
        documentId
      }
    });
    
    return updatedDocument;
  }
  
  removeDocument(documentId) {
    const initialLength = this.documents.length;
    this.documents = this.documents.filter(d => d.id !== documentId);
    
    if (initialLength === this.documents.length) {
      throw new DomainError(`Document with ID ${documentId} not found`);
    }
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentDocumentRemoved',
      payload: {
        componentId: this.id,
        documentId
      }
    });
    
    return true;
  }
  
  addRelatedComponent(componentId, relationType) {
    if (!componentId) {
      throw new DomainError('Related component ID is required');
    }
    
    const validRelationTypes = ['parent', 'child', 'sibling', 'assembly', 'part'];
    if (!validRelationTypes.includes(relationType)) {
      throw new DomainError(`Invalid relation type: ${relationType}. Must be one of: ${validRelationTypes.join(', ')}`);
    }
    
    // Check if relation already exists
    const existingRelation = this.relatedComponents.find(rc => rc.componentId === componentId);
    if (existingRelation) {
      throw new DomainError(`Component relation with ID ${componentId} already exists`);
    }
    
    const relation = {
      componentId,
      relationType,
      addedAt: new Date()
    };
    
    this.relatedComponents.push(relation);
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentRelationAdded',
      payload: {
        componentId: this.id,
        relatedComponentId: componentId,
        relationType
      }
    });
    
    return relation;
  }
  
  updateRelation(componentId, relationType) {
    const relationIndex = this.relatedComponents.findIndex(rc => rc.componentId === componentId);
    
    if (relationIndex === -1) {
      throw new DomainError(`Component relation with ID ${componentId} not found`);
    }
    
    const validRelationTypes = ['parent', 'child', 'sibling', 'assembly', 'part'];
    if (!validRelationTypes.includes(relationType)) {
      throw new DomainError(`Invalid relation type: ${relationType}. Must be one of: ${validRelationTypes.join(', ')}`);
    }
    
    this.relatedComponents[relationIndex].relationType = relationType;
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentRelationUpdated',
      payload: {
        componentId: this.id,
        relatedComponentId: componentId,
        relationType
      }
    });
    
    return this.relatedComponents[relationIndex];
  }
  
  removeRelation(componentId) {
    const initialLength = this.relatedComponents.length;
    this.relatedComponents = this.relatedComponents.filter(rc => rc.componentId !== componentId);
    
    if (initialLength === this.relatedComponents.length) {
      throw new DomainError(`Component relation with ID ${componentId} not found`);
    }
    
    this.markModified();
    
    // Add domain event
    this.addDomainEvent({
      type: 'ComponentRelationRemoved',
      payload: {
        componentId: this.id,
        relatedComponentId: componentId
      }
    });
    
    return true;
  }
  
  toObject() {
    return {
      ...super.toObject(),
      name: this.name,
      code: this.code,
      description: this.description,
      category: this.category,
      status: this.status,
      supplierId: this.supplierId,
      tags: this.tags,
      specifications: this.specifications.map(s => s.toObject()),
      revisions: this.revisions.map(r => r.toObject()),
      documents: this.documents,
      relatedComponents: this.relatedComponents,
      currentRevision: this.getCurrentRevision()?.toObject() || null
    };
  }
  
  // Factory method
  static create(data) {
    const component = new Component(data);
    
    // Add domain event
    component.addDomainEvent({
      type: 'ComponentCreated',
      payload: {
        componentId: component.id
      }
    });
    
    return component;
  }
}

module.exports = Component; 