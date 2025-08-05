/**
 * Component.test.js
 * 
 * Tests for the Component domain model
 */

const { Component, Specification, Revision } = require('../../../domains/component/models');
const { DomainError } = require('../../../core/errors');

describe('Component Domain Model', () => {
  describe('Component Aggregate', () => {
    it('should create a valid component', () => {
      const component = new Component({
        name: 'Hydraulic Pump',
        code: 'HYD-PUMP-001',
        description: 'High-pressure hydraulic pump',
        category: 'hydraulics',
        supplierId: 'supplier-123',
        specifications: [
          {
            name: 'Max Pressure',
            value: 5000,
            unit: 'psi',
            category: 'performance'
          }
        ]
      });
      
      expect(component.id).toBeDefined();
      expect(component.name).toBe('Hydraulic Pump');
      expect(component.code).toBe('HYD-PUMP-001');
      expect(component.description).toBe('High-pressure hydraulic pump');
      expect(component.category).toBe('hydraulics');
      expect(component.status).toBe('active');
      expect(component.supplierId).toBe('supplier-123');
      
      // Check specifications
      expect(component.specifications).toHaveLength(1);
      expect(component.specifications[0]).toBeInstanceOf(Specification);
      expect(component.specifications[0].name).toBe('Max Pressure');
      expect(component.specifications[0].value).toBe(5000);
    });
    
    it('should throw error for invalid component', () => {
      expect(() => {
        new Component({
          code: 'HYD-PUMP-001',
          description: 'High-pressure hydraulic pump'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Component({
          name: 'Hydraulic Pump',
          description: 'High-pressure hydraulic pump'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Component({
          name: 'Hydraulic Pump',
          code: 'HYD-PUMP-001',
          status: 'invalid'
        });
      }).toThrow(DomainError);
    });
    
    it('should update component details', () => {
      const component = new Component({
        name: 'Hydraulic Pump',
        code: 'HYD-PUMP-001',
        category: 'hydraulics'
      });
      
      component.updateDetails({
        name: 'Advanced Hydraulic Pump',
        description: 'High-performance hydraulic pump',
        tags: ['hydraulics', 'high-pressure']
      });
      
      expect(component.name).toBe('Advanced Hydraulic Pump');
      expect(component.description).toBe('High-performance hydraulic pump');
      expect(component.tags).toEqual(['hydraulics', 'high-pressure']);
      
      // Check domain events
      const events = component.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('ComponentDetailsUpdated');
      expect(events[0].payload.componentId).toBe(component.id);
    });
    
    it('should update component status', () => {
      const component = new Component({
        name: 'Hydraulic Pump',
        code: 'HYD-PUMP-001',
        category: 'hydraulics'
      });
      
      component.updateStatus('development');
      expect(component.status).toBe('development');
      
      component.updateStatus('obsolete');
      expect(component.status).toBe('obsolete');
      
      // Check domain events
      const events = component.getDomainEvents();
      expect(events).toHaveLength(2);
      expect(events[1].type).toBe('ComponentStatusUpdated');
      expect(events[1].payload.status).toBe('obsolete');
      
      // Should throw for invalid status
      expect(() => {
        component.updateStatus('invalid');
      }).toThrow(DomainError);
    });
    
    it('should manage specifications correctly', () => {
      const component = new Component({
        name: 'Hydraulic Pump',
        code: 'HYD-PUMP-001',
        category: 'hydraulics'
      });
      
      // Add specification
      const spec = component.addSpecification({
        name: 'Max Pressure',
        value: 5000,
        unit: 'psi',
        category: 'performance'
      });
      
      expect(component.specifications).toHaveLength(1);
      expect(spec.name).toBe('Max Pressure');
      
      // Update specification
      component.updateSpecification(spec.id, {
        value: 5500,
        tolerance: 100
      });
      
      const updatedSpec = component.specifications.find(s => s.id === spec.id);
      expect(updatedSpec.value).toBe(5500);
      expect(updatedSpec.tolerance).toBe(100);
      
      // Remove specification
      component.removeSpecification(spec.id);
      expect(component.specifications).toHaveLength(0);
      
      // Should throw for invalid specification ID
      expect(() => {
        component.updateSpecification('invalid-id', {});
      }).toThrow(DomainError);
    });
    
    it('should manage revisions correctly', () => {
      const component = new Component({
        name: 'Hydraulic Pump',
        code: 'HYD-PUMP-001',
        category: 'hydraulics'
      });
      
      // Create revision
      const revision = component.createRevision({
        description: 'Initial version',
        author: 'user-123'
      });
      
      expect(component.revisions).toHaveLength(1);
      expect(revision.version).toBe('1.0.0');
      expect(revision.status).toBe('draft');
      
      // Create another revision
      const revision2 = component.createRevision({
        description: 'Updated specifications',
        author: 'user-123'
      });
      
      expect(component.revisions).toHaveLength(2);
      expect(revision2.version).toBe('1.0.1');
      
      // Check current revision
      const currentRevision = component.getCurrentRevision();
      expect(currentRevision.id).toBe(revision2.id);
      
      // Check domain events
      const events = component.getDomainEvents();
      expect(events.some(e => e.type === 'ComponentRevisionCreated')).toBe(true);
    });
    
    it('should manage documents correctly', () => {
      const component = new Component({
        name: 'Hydraulic Pump',
        code: 'HYD-PUMP-001',
        category: 'hydraulics'
      });
      
      // Add document
      const document = component.addDocument({
        url: 'https://example.com/specs.pdf',
        type: 'application/pdf',
        title: 'Technical Specifications'
      });
      
      expect(component.documents).toHaveLength(1);
      expect(document.url).toBe('https://example.com/specs.pdf');
      expect(document.title).toBe('Technical Specifications');
      
      // Update document
      const updatedDocument = component.updateDocument(document.id, {
        title: 'Updated Technical Specifications',
        version: '1.1'
      });
      
      expect(updatedDocument.title).toBe('Updated Technical Specifications');
      expect(updatedDocument.version).toBe('1.1');
      
      // Remove document
      component.removeDocument(document.id);
      expect(component.documents).toHaveLength(0);
      
      // Should throw for invalid document
      expect(() => {
        component.addDocument({});
      }).toThrow(DomainError);
    });
    
    it('should manage related components correctly', () => {
      const component = new Component({
        name: 'Hydraulic Pump',
        code: 'HYD-PUMP-001',
        category: 'hydraulics'
      });
      
      // Add related component
      const relation = component.addRelatedComponent('component-123', 'assembly');
      
      expect(component.relatedComponents).toHaveLength(1);
      expect(relation.componentId).toBe('component-123');
      expect(relation.relationType).toBe('assembly');
      
      // Update relation
      const updatedRelation = component.updateRelation('component-123', 'part');
      
      expect(updatedRelation.relationType).toBe('part');
      
      // Remove relation
      component.removeRelation('component-123');
      expect(component.relatedComponents).toHaveLength(0);
      
      // Should throw for invalid relation
      expect(() => {
        component.addRelatedComponent('', 'assembly');
      }).toThrow(DomainError);
      
      expect(() => {
        component.addRelatedComponent('component-123', 'invalid');
      }).toThrow(DomainError);
    });
    
    it('should create component with factory method', () => {
      const component = Component.create({
        name: 'Hydraulic Pump',
        code: 'HYD-PUMP-001',
        category: 'hydraulics'
      });
      
      expect(component).toBeInstanceOf(Component);
      
      // Check domain events
      const events = component.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('ComponentCreated');
      expect(events[0].payload.componentId).toBe(component.id);
    });
  });
  
  describe('Specification Entity', () => {
    it('should create a valid specification', () => {
      const spec = new Specification({
        name: 'Max Pressure',
        value: 5000,
        unit: 'psi',
        category: 'performance',
        tolerance: 100,
        minValue: 4900,
        maxValue: 5100
      });
      
      expect(spec.id).toBeDefined();
      expect(spec.name).toBe('Max Pressure');
      expect(spec.value).toBe(5000);
      expect(spec.unit).toBe('psi');
      expect(spec.category).toBe('performance');
      expect(spec.tolerance).toBe(100);
      expect(spec.minValue).toBe(4900);
      expect(spec.maxValue).toBe(5100);
    });
    
    it('should throw error for invalid specification', () => {
      expect(() => {
        new Specification({
          value: 5000,
          unit: 'psi'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Specification({
          name: 'Max Pressure',
          value: 5000,
          minValue: 5500,
          maxValue: 5000
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Specification({
          name: 'Max Pressure',
          value: 5000,
          tolerance: -100
        });
      }).toThrow(DomainError);
    });
    
    it('should check if value is within tolerance', () => {
      const spec = new Specification({
        name: 'Max Pressure',
        value: 5000,
        unit: 'psi',
        tolerance: 100
      });
      
      expect(spec.isWithinTolerance(5050)).toBe(true);
      expect(spec.isWithinTolerance(5150)).toBe(false);
      
      const specWithoutTolerance = new Specification({
        name: 'Material',
        value: 'Steel'
      });
      
      expect(specWithoutTolerance.isWithinTolerance('Aluminum')).toBeNull();
    });
    
    it('should check if value is within range', () => {
      const spec = new Specification({
        name: 'Operating Temperature',
        minValue: -20,
        maxValue: 80,
        unit: '°C'
      });
      
      expect(spec.isWithinRange(25)).toBe(true);
      expect(spec.isWithinRange(-30)).toBe(false);
      expect(spec.isWithinRange(90)).toBe(false);
      
      const specWithoutRange = new Specification({
        name: 'Color',
        value: 'Red'
      });
      
      expect(specWithoutRange.isWithinRange('Blue')).toBeNull();
    });
  });
  
  describe('Revision Entity', () => {
    it('should create a valid revision', () => {
      const revision = new Revision({
        version: '1.0.0',
        description: 'Initial version',
        author: 'user-123'
      });
      
      expect(revision.id).toBeDefined();
      expect(revision.version).toBe('1.0.0');
      expect(revision.description).toBe('Initial version');
      expect(revision.author).toBe('user-123');
      expect(revision.status).toBe('draft');
      expect(revision.isDraft()).toBe(true);
    });
    
    it('should throw error for invalid revision', () => {
      expect(() => {
        new Revision({
          description: 'Initial version',
          author: 'user-123'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Revision({
          version: '1.0',
          description: 'Initial version'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Revision({
          version: '1.0.0',
          description: 'Initial version',
          status: 'invalid'
        });
      }).toThrow(DomainError);
    });
    
    it('should manage revision changes correctly', () => {
      const revision = new Revision({
        version: '1.0.0',
        description: 'Initial version',
        author: 'user-123'
      });
      
      // Add change
      const change = revision.addChange({
        field: 'Max Pressure',
        description: 'Increased max pressure',
        oldValue: 5000,
        newValue: 5500
      });
      
      expect(revision.changes).toHaveLength(1);
      expect(change.field).toBe('Max Pressure');
      
      // Remove change
      revision.removeChange(change.id);
      expect(revision.changes).toHaveLength(0);
      
      // Should throw for invalid change
      expect(() => {
        revision.addChange({});
      }).toThrow(DomainError);
    });
    
    it('should update revision status correctly', () => {
      const revision = new Revision({
        version: '1.0.0',
        description: 'Initial version',
        author: 'user-123'
      });
      
      // Update to review
      revision.updateStatus('review');
      expect(revision.status).toBe('review');
      
      // Update to approved
      revision.updateStatus('approved', 'user-456');
      expect(revision.status).toBe('approved');
      expect(revision.approvedBy).toBe('user-456');
      expect(revision.approvedAt).toBeInstanceOf(Date);
      expect(revision.isApproved()).toBe(true);
      
      // Update to obsolete
      revision.updateStatus('obsolete');
      expect(revision.status).toBe('obsolete');
      expect(revision.isObsolete()).toBe(true);
      
      // Should throw for invalid status transition
      const draftRevision = new Revision({
        version: '1.0.0',
        description: 'Initial version',
        author: 'user-123'
      });
      
      expect(() => {
        draftRevision.updateStatus('approved');
      }).toThrow(DomainError);
    });
    
    it('should prevent changes to approved revisions', () => {
      const revision = new Revision({
        version: '1.0.0',
        description: 'Initial version',
        author: 'user-123'
      });
      
      // Add change while draft
      revision.addChange({
        field: 'Max Pressure',
        description: 'Increased max pressure',
        oldValue: 5000,
        newValue: 5500
      });
      
      // Approve revision
      revision.updateStatus('review');
      revision.updateStatus('approved', 'user-456');
      
      // Should throw when trying to modify approved revision
      expect(() => {
        revision.updateDetails({ description: 'Updated description' });
      }).toThrow(DomainError);
      
      expect(() => {
        revision.addChange({
          field: 'Weight',
          description: 'Updated weight'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        revision.removeChange(revision.changes[0].id);
      }).toThrow(DomainError);
    });
  });
}); 