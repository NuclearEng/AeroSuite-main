/**
 * Inspection.test.js
 * 
 * Tests for the Inspection domain model
 */

const { Inspection, InspectionItem, Defect } = require('../../../domains/inspection/models');
const { DomainError } = require('../../../core/errors');

describe('Inspection Domain Model', () => {
  describe('Inspection Aggregate', () => {
    it('should create a valid inspection', () => {
      const inspection = new Inspection({
        title: 'Quality Control Inspection',
        description: 'Routine quality control inspection',
        customerId: 'customer-123',
        supplierId: 'supplier-456',
        scheduledDate: new Date('2023-06-15'),
        inspectorId: 'user-789',
        location: 'Manufacturing Plant A',
        inspectionType: 'quality-control',
        items: [
          {
            name: 'Check dimensions',
            description: 'Verify the product dimensions',
            category: 'dimensional'
          }
        ]
      });
      
      expect(inspection.id).toBeDefined();
      expect(inspection.title).toBe('Quality Control Inspection');
      expect(inspection.description).toBe('Routine quality control inspection');
      expect(inspection.customerId).toBe('customer-123');
      expect(inspection.supplierId).toBe('supplier-456');
      expect(inspection.status).toBe('scheduled');
      expect(inspection.scheduledDate).toBeInstanceOf(Date);
      expect(inspection.completedDate).toBeNull();
      expect(inspection.inspectorId).toBe('user-789');
      expect(inspection.location).toBe('Manufacturing Plant A');
      expect(inspection.inspectionType).toBe('quality-control');
      
      // Check items
      expect(inspection.items).toHaveLength(1);
      expect(inspection.items[0]).toBeInstanceOf(InspectionItem);
      expect(inspection.items[0].name).toBe('Check dimensions');
    });
    
    it('should throw error for invalid inspection', () => {
      expect(() => {
        new Inspection({
          description: 'Routine quality control inspection',
          customerId: 'customer-123',
          scheduledDate: new Date('2023-06-15')
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Inspection({
          title: 'Quality Control Inspection',
          description: 'Routine quality control inspection',
          scheduledDate: new Date('2023-06-15')
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Inspection({
          title: 'Quality Control Inspection',
          description: 'Routine quality control inspection',
          customerId: 'customer-123',
          status: 'invalid'
        });
      }).toThrow(DomainError);
    });
    
    it('should update inspection details', () => {
      const inspection = new Inspection({
        title: 'Quality Control Inspection',
        description: 'Routine quality control inspection',
        customerId: 'customer-123',
        scheduledDate: new Date('2023-06-15')
      });
      
      inspection.updateDetails({
        title: 'Updated Inspection',
        location: 'Factory B',
        notes: 'Important notes'
      });
      
      expect(inspection.title).toBe('Updated Inspection');
      expect(inspection.location).toBe('Factory B');
      expect(inspection.notes).toBe('Important notes');
      
      // Check domain events
      const events = inspection.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('InspectionDetailsUpdated');
      expect(events[0].payload.inspectionId).toBe(inspection.id);
    });
    
    it('should update inspection status', () => {
      const inspection = new Inspection({
        title: 'Quality Control Inspection',
        description: 'Routine quality control inspection',
        customerId: 'customer-123',
        scheduledDate: new Date('2023-06-15')
      });
      
      inspection.updateStatus('in-progress');
      expect(inspection.status).toBe('in-progress');
      
      inspection.updateStatus('completed');
      expect(inspection.status).toBe('completed');
      expect(inspection.completedDate).toBeInstanceOf(Date);
      
      // Check domain events
      const events = inspection.getDomainEvents();
      expect(events).toHaveLength(2);
      expect(events[1].type).toBe('InspectionStatusUpdated');
      expect(events[1].payload.newStatus).toBe('completed');
      
      // Should throw for invalid status
      expect(() => {
        inspection.updateStatus('invalid');
      }).toThrow(DomainError);
      
      // Should throw when trying to change from completed
      expect(() => {
        inspection.updateStatus('scheduled');
      }).toThrow(DomainError);
    });
    
    it('should manage inspection items correctly', () => {
      const inspection = new Inspection({
        title: 'Quality Control Inspection',
        description: 'Routine quality control inspection',
        customerId: 'customer-123',
        scheduledDate: new Date('2023-06-15')
      });
      
      // Add item
      const item = inspection.addItem({
        name: 'Check dimensions',
        description: 'Verify the product dimensions',
        category: 'dimensional'
      });
      
      expect(inspection.items).toHaveLength(1);
      expect(item.name).toBe('Check dimensions');
      
      // Update item
      inspection.updateItem(item.id, {
        name: 'Updated item name',
        expectedValue: 10,
        tolerance: 0.5,
        unitOfMeasure: 'mm'
      });
      
      const updatedItem = inspection.items.find(i => i.id === item.id);
      expect(updatedItem.name).toBe('Updated item name');
      expect(updatedItem.expectedValue).toBe(10);
      
      // Complete item
      updatedItem.complete('passed', 10.2);
      expect(updatedItem.status).toBe('passed');
      expect(updatedItem.actualValue).toBe(10.2);
      
      // Remove item
      inspection.removeItem(item.id);
      expect(inspection.items).toHaveLength(0);
      
      // Should throw for invalid item ID
      expect(() => {
        inspection.updateItem('invalid-id', {});
      }).toThrow(DomainError);
    });
    
    it('should manage defects correctly', () => {
      const inspection = new Inspection({
        title: 'Quality Control Inspection',
        description: 'Routine quality control inspection',
        customerId: 'customer-123',
        scheduledDate: new Date('2023-06-15')
      });
      
      // Add defect
      const defect = inspection.addDefect({
        title: 'Surface scratch',
        description: 'Visible scratch on the surface',
        severity: 'minor',
        category: 'cosmetic',
        reportedBy: 'user-789'
      });
      
      expect(inspection.defects).toHaveLength(1);
      expect(defect.title).toBe('Surface scratch');
      
      // Update defect
      inspection.updateDefect(defect.id, {
        severity: 'major',
        location: 'Front panel'
      });
      
      const updatedDefect = inspection.defects.find(d => d.id === defect.id);
      expect(updatedDefect.severity).toBe('major');
      expect(updatedDefect.location).toBe('Front panel');
      
      // Assign defect
      updatedDefect.assignTo('user-456', new Date('2023-06-30'));
      expect(updatedDefect.assignedTo).toBe('user-456');
      expect(updatedDefect.dueDate).toBeInstanceOf(Date);
      
      // Resolve defect
      updatedDefect.resolve('Fixed by replacing the panel');
      expect(updatedDefect.status).toBe('resolved');
      
      // Remove defect
      inspection.removeDefect(defect.id);
      expect(inspection.defects).toHaveLength(0);
      
      // Should throw for invalid defect ID
      expect(() => {
        inspection.updateDefect('invalid-id', {});
      }).toThrow(DomainError);
    });
    
    it('should manage attachments correctly', () => {
      const inspection = new Inspection({
        title: 'Quality Control Inspection',
        description: 'Routine quality control inspection',
        customerId: 'customer-123',
        scheduledDate: new Date('2023-06-15')
      });
      
      // Add attachment
      const attachment = inspection.addAttachment({
        url: 'https://example.com/photo1.jpg',
        type: 'image/jpeg',
        name: 'Photo 1'
      });
      
      expect(inspection.attachments).toHaveLength(1);
      expect(attachment.url).toBe('https://example.com/photo1.jpg');
      expect(attachment.name).toBe('Photo 1');
      
      // Remove attachment
      inspection.removeAttachment(attachment.id);
      expect(inspection.attachments).toHaveLength(0);
      
      // Should throw for invalid attachment
      expect(() => {
        inspection.addAttachment({});
      }).toThrow(DomainError);
    });
    
    it('should calculate completion percentage correctly', () => {
      const inspection = new Inspection({
        title: 'Quality Control Inspection',
        description: 'Routine quality control inspection',
        customerId: 'customer-123',
        scheduledDate: new Date('2023-06-15'),
        items: [
          {
            name: 'Item 1',
            description: 'First item'
          },
          {
            name: 'Item 2',
            description: 'Second item'
          },
          {
            name: 'Item 3',
            description: 'Third item'
          },
          {
            name: 'Item 4',
            description: 'Fourth item'
          }
        ]
      });
      
      expect(inspection.getCompletionPercentage()).toBe(0);
      
      // Complete first item
      inspection.items[0].complete('passed');
      expect(inspection.getCompletionPercentage()).toBe(25);
      
      // Complete second item
      inspection.items[1].complete('failed');
      expect(inspection.getCompletionPercentage()).toBe(50);
      
      // Complete all items
      inspection.items[2].complete('passed');
      inspection.items[3].complete('na');
      expect(inspection.getCompletionPercentage()).toBe(100);
    });
    
    it('should create inspection with factory method', () => {
      const inspection = Inspection.create({
        title: 'Quality Control Inspection',
        description: 'Routine quality control inspection',
        customerId: 'customer-123',
        scheduledDate: new Date('2023-06-15')
      });
      
      expect(inspection).toBeInstanceOf(Inspection);
      
      // Check domain events
      const events = inspection.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('InspectionCreated');
      expect(events[0].payload.inspectionId).toBe(inspection.id);
    });
    
    it('should create inspection from template', () => {
      const template = {
        id: 'template-123',
        title: 'Standard QC Inspection',
        description: 'Standard quality control inspection template',
        inspectionType: 'quality-control',
        items: [
          {
            name: 'Check dimensions',
            category: 'dimensional'
          },
          {
            name: 'Visual inspection',
            category: 'visual'
          }
        ]
      };
      
      const inspection = Inspection.createFromTemplate(template, {
        customerId: 'customer-123',
        scheduledDate: new Date('2023-06-15')
      });
      
      expect(inspection).toBeInstanceOf(Inspection);
      expect(inspection.title).toBe('Standard QC Inspection');
      expect(inspection.items).toHaveLength(2);
      
      // Check domain events
      const events = inspection.getDomainEvents();
      expect(events).toHaveLength(2);
      expect(events[1].type).toBe('InspectionCreatedFromTemplate');
      expect(events[1].payload.templateId).toBe('template-123');
    });
  });
  
  describe('InspectionItem Entity', () => {
    it('should create a valid inspection item', () => {
      const item = new InspectionItem({
        name: 'Check dimensions',
        description: 'Verify the product dimensions',
        category: 'dimensional',
        expectedValue: 10,
        tolerance: 0.5,
        unitOfMeasure: 'mm'
      });
      
      expect(item.id).toBeDefined();
      expect(item.name).toBe('Check dimensions');
      expect(item.description).toBe('Verify the product dimensions');
      expect(item.category).toBe('dimensional');
      expect(item.status).toBe('pending');
      expect(item.expectedValue).toBe(10);
      expect(item.tolerance).toBe(0.5);
      expect(item.unitOfMeasure).toBe('mm');
    });
    
    it('should throw error for invalid inspection item', () => {
      expect(() => {
        new InspectionItem({
          description: 'Verify the product dimensions'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new InspectionItem({
          name: 'Check dimensions',
          status: 'invalid'
        });
      }).toThrow(DomainError);
    });
    
    it('should complete inspection item correctly', () => {
      const item = new InspectionItem({
        name: 'Check dimensions',
        expectedValue: 10,
        tolerance: 0.5
      });
      
      item.complete('passed', 10.2, 'Within tolerance');
      
      expect(item.status).toBe('passed');
      expect(item.result).toBe('passed');
      expect(item.actualValue).toBe(10.2);
      expect(item.notes).toBe('Within tolerance');
      expect(item.isCompleted()).toBe(true);
      expect(item.isPassed()).toBe(true);
      
      // Should throw for invalid result
      expect(() => {
        item.complete('invalid');
      }).toThrow(DomainError);
    });
    
    it('should reset inspection item correctly', () => {
      const item = new InspectionItem({
        name: 'Check dimensions',
        expectedValue: 10,
        tolerance: 0.5
      });
      
      item.complete('passed', 10.2);
      expect(item.status).toBe('passed');
      
      item.reset();
      expect(item.status).toBe('pending');
      expect(item.result).toBeNull();
      expect(item.actualValue).toBeNull();
      expect(item.isCompleted()).toBe(false);
    });
    
    it('should manage photos correctly', () => {
      const item = new InspectionItem({
        name: 'Check dimensions'
      });
      
      const photo = item.addPhoto('https://example.com/photo1.jpg');
      expect(item.photos).toHaveLength(1);
      expect(photo.url).toBe('https://example.com/photo1.jpg');
      
      item.removePhoto(photo.id);
      expect(item.photos).toHaveLength(0);
      
      // Should throw for invalid photo
      expect(() => {
        item.addPhoto('');
      }).toThrow(DomainError);
    });
    
    it('should check if value is within tolerance', () => {
      const item = new InspectionItem({
        name: 'Check dimensions',
        expectedValue: 10,
        tolerance: 0.5
      });
      
      item.complete('passed', 10.2);
      expect(item.isWithinTolerance()).toBe(true);
      
      item.complete('failed', 10.6);
      expect(item.isWithinTolerance()).toBe(false);
      
      const itemWithoutValues = new InspectionItem({
        name: 'Visual check'
      });
      
      expect(itemWithoutValues.isWithinTolerance()).toBeNull();
    });
  });
  
  describe('Defect Entity', () => {
    it('should create a valid defect', () => {
      const defect = new Defect({
        title: 'Surface scratch',
        description: 'Visible scratch on the surface',
        severity: 'minor',
        category: 'cosmetic',
        location: 'Front panel',
        reportedBy: 'user-789'
      });
      
      expect(defect.id).toBeDefined();
      expect(defect.title).toBe('Surface scratch');
      expect(defect.description).toBe('Visible scratch on the surface');
      expect(defect.severity).toBe('minor');
      expect(defect.status).toBe('open');
      expect(defect.category).toBe('cosmetic');
      expect(defect.location).toBe('Front panel');
      expect(defect.reportedBy).toBe('user-789');
    });
    
    it('should throw error for invalid defect', () => {
      expect(() => {
        new Defect({
          description: 'Visible scratch on the surface'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Defect({
          title: 'Surface scratch'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Defect({
          title: 'Surface scratch',
          description: 'Visible scratch on the surface',
          severity: 'invalid'
        });
      }).toThrow(DomainError);
    });
    
    it('should update defect status correctly', () => {
      const defect = new Defect({
        title: 'Surface scratch',
        description: 'Visible scratch on the surface',
        severity: 'minor',
        reportedBy: 'user-789'
      });
      
      defect.updateStatus('in-progress');
      expect(defect.status).toBe('in-progress');
      
      // Should throw for invalid status
      expect(() => {
        defect.updateStatus('invalid');
      }).toThrow(DomainError);
    });
    
    it('should assign defect correctly', () => {
      const defect = new Defect({
        title: 'Surface scratch',
        description: 'Visible scratch on the surface',
        severity: 'minor',
        reportedBy: 'user-789'
      });
      
      defect.assignTo('user-456', new Date('2023-06-30'));
      expect(defect.assignedTo).toBe('user-456');
      expect(defect.dueDate).toBeInstanceOf(Date);
      
      // Should throw for invalid assignment
      expect(() => {
        defect.assignTo('');
      }).toThrow(DomainError);
    });
    
    it('should handle defect resolution workflow correctly', () => {
      const defect = new Defect({
        title: 'Surface scratch',
        description: 'Visible scratch on the surface',
        severity: 'minor',
        reportedBy: 'user-789'
      });
      
      // Resolve
      defect.resolve('Fixed by polishing the surface');
      expect(defect.status).toBe('resolved');
      expect(defect.resolutionNotes).toBe('Fixed by polishing the surface');
      
      // Close
      defect.close();
      expect(defect.status).toBe('closed');
      
      // Reopen
      defect.reopen('Issue still present');
      expect(defect.status).toBe('open');
      expect(defect.resolutionNotes).toContain('Reopened: Issue still present');
      
      // Reject
      defect.reject('Not a valid defect');
      expect(defect.status).toBe('rejected');
      expect(defect.resolutionNotes).toBe('Not a valid defect');
    });
    
    it('should manage photos correctly', () => {
      const defect = new Defect({
        title: 'Surface scratch',
        description: 'Visible scratch on the surface',
        severity: 'minor',
        reportedBy: 'user-789'
      });
      
      const photo = defect.addPhoto('https://example.com/defect1.jpg');
      expect(defect.photos).toHaveLength(1);
      expect(photo.url).toBe('https://example.com/defect1.jpg');
      
      defect.removePhoto(photo.id);
      expect(defect.photos).toHaveLength(0);
      
      // Should throw for invalid photo
      expect(() => {
        defect.addPhoto('');
      }).toThrow(DomainError);
    });
    
    it('should check defect status correctly', () => {
      const defect = new Defect({
        title: 'Surface scratch',
        description: 'Visible scratch on the surface',
        severity: 'critical',
        reportedBy: 'user-789'
      });
      
      expect(defect.isOpen()).toBe(true);
      expect(defect.isResolved()).toBe(false);
      expect(defect.isCritical()).toBe(true);
      
      defect.resolve('Fixed');
      expect(defect.isOpen()).toBe(false);
      expect(defect.isResolved()).toBe(true);
    });
  });
}); 