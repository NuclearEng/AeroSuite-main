/**
 * Inspection domain event schemas
 * 
 * Defines the structure and validation rules for inspection domain events
 * These schemas are used for validating events before they are published
 */

const inspectionEventSchemas = {
  // Inspection lifecycle events
  InspectionCreated: {
    description: 'Triggered when a new inspection is created',
    required: ['inspectionId', 'title', 'scheduledDate'],
    properties: {
      inspectionId: { type: 'string' },
      title: { type: 'string' },
      customerId: { type: 'string' },
      supplierId: { type: 'string' },
      componentId: { type: 'string' },
      scheduledDate: { type: 'string' },
      inspectionType: { type: 'string' }
    }
  },
  
  InspectionScheduled: {
    description: 'Triggered when an inspection is scheduled',
    required: ['inspectionId', 'scheduledDate'],
    properties: {
      inspectionId: { type: 'string' },
      title: { type: 'string' },
      customerId: { type: 'string' },
      supplierId: { type: 'string' },
      scheduledDate: { type: 'string' }
    }
  },
  
  InspectionRescheduled: {
    description: 'Triggered when an inspection is rescheduled',
    required: ['inspectionId', 'scheduledDate', 'previousDate'],
    properties: {
      inspectionId: { type: 'string' },
      scheduledDate: { type: 'string' },
      previousDate: { type: 'string' },
      customerId: { type: 'string' },
      supplierId: { type: 'string' }
    }
  },
  
  InspectionStarted: {
    description: 'Triggered when an inspection is started',
    required: ['inspectionId'],
    properties: {
      inspectionId: { type: 'string' },
      customerId: { type: 'string' },
      supplierId: { type: 'string' },
      startedAt: { type: 'string' },
      inspectorId: { type: 'string' }
    }
  },
  
  InspectionCompleted: {
    description: 'Triggered when an inspection is completed',
    required: ['inspectionId', 'result'],
    properties: {
      inspectionId: { type: 'string' },
      customerId: { type: 'string' },
      supplierId: { type: 'string' },
      completedDate: { type: 'string' },
      result: { type: 'string' },
      defectCount: { type: 'number' }
    }
  },
  
  InspectionCancelled: {
    description: 'Triggered when an inspection is cancelled',
    required: ['inspectionId', 'reason'],
    properties: {
      inspectionId: { type: 'string' },
      customerId: { type: 'string' },
      supplierId: { type: 'string' },
      reason: { type: 'string' }
    }
  },
  
  // Inspection item events
  InspectionItemAdded: {
    description: 'Triggered when an item is added to an inspection',
    required: ['inspectionId', 'itemId'],
    properties: {
      inspectionId: { type: 'string' },
      itemId: { type: 'string' },
      name: { type: 'string' },
      specificationId: { type: 'string' }
    }
  },
  
  InspectionItemCompleted: {
    description: 'Triggered when an inspection item is completed',
    required: ['inspectionId', 'itemId', 'result'],
    properties: {
      inspectionId: { type: 'string' },
      itemId: { type: 'string' },
      result: { type: 'string' },
      measurements: { type: 'object' }
    }
  },
  
  // Defect events
  DefectRecorded: {
    description: 'Triggered when a defect is recorded during inspection',
    required: ['inspectionId', 'defectId', 'severity'],
    properties: {
      inspectionId: { type: 'string' },
      defectId: { type: 'string' },
      itemId: { type: 'string' },
      customerId: { type: 'string' },
      supplierId: { type: 'string' },
      componentId: { type: 'string' },
      severity: { type: 'string' },
      description: { type: 'string' }
    }
  }
};

module.exports = inspectionEventSchemas; 