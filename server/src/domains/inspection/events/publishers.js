/**
 * Inspection domain event publishers
 * 
 * Publishes events from the inspection domain to be consumed by other domains
 */

const domainEventBus = require('../../../core/DomainEventBus');
const logger = require('../../../utils/logger');
const inspectionEventSchemas = require('./schemas');

/**
 * Initialize event publishers for the inspection domain
 */
function initializeInspectionEventPublishers() {
  logger.info('Initializing Inspection domain event publishers');
  
  // Register event schemas
  Object.entries(inspectionEventSchemas).forEach(([eventType, schema]) => {
    domainEventBus.registerEventSchema(eventType, schema);
  });
}

/**
 * Publish an inspection created event
 * 
 * @param {Object} inspection - The created inspection
 */
function publishInspectionCreated(inspection) {
  const inspectionData = inspection.toObject ? inspection.toObject() : inspection;
  
  domainEventBus.publishFromContext('inspection', {
    type: 'InspectionCreated',
    payload: {
      inspectionId: inspectionData.id,
      title: inspectionData.title,
      customerId: inspectionData.customerId,
      supplierId: inspectionData.supplierId,
      componentId: inspectionData.componentId,
      scheduledDate: inspectionData.scheduledDate ? inspectionData.scheduledDate.toISOString() : null,
      inspectionType: inspectionData.inspectionType
    }
  });
}

/**
 * Publish an inspection scheduled event
 * 
 * @param {Object} inspection - The scheduled inspection
 */
function publishInspectionScheduled(inspection) {
  const inspectionData = inspection.toObject ? inspection.toObject() : inspection;
  
  domainEventBus.publishFromContext('inspection', {
    type: 'InspectionScheduled',
    payload: {
      inspectionId: inspectionData.id,
      title: inspectionData.title,
      customerId: inspectionData.customerId,
      supplierId: inspectionData.supplierId,
      scheduledDate: inspectionData.scheduledDate ? inspectionData.scheduledDate.toISOString() : null
    }
  });
}

/**
 * Publish an inspection rescheduled event
 * 
 * @param {Object} inspection - The rescheduled inspection
 * @param {Date} previousDate - The previous scheduled date
 */
function publishInspectionRescheduled(inspection, previousDate) {
  const inspectionData = inspection.toObject ? inspection.toObject() : inspection;
  
  domainEventBus.publishFromContext('inspection', {
    type: 'InspectionRescheduled',
    payload: {
      inspectionId: inspectionData.id,
      customerId: inspectionData.customerId,
      supplierId: inspectionData.supplierId,
      scheduledDate: inspectionData.scheduledDate ? inspectionData.scheduledDate.toISOString() : null,
      previousDate: previousDate ? previousDate.toISOString() : null
    }
  });
}

/**
 * Publish an inspection started event
 * 
 * @param {Object} inspection - The started inspection
 */
function publishInspectionStarted(inspection) {
  const inspectionData = inspection.toObject ? inspection.toObject() : inspection;
  
  domainEventBus.publishFromContext('inspection', {
    type: 'InspectionStarted',
    payload: {
      inspectionId: inspectionData.id,
      customerId: inspectionData.customerId,
      supplierId: inspectionData.supplierId,
      startedAt: new Date().toISOString(),
      inspectorId: inspectionData.inspectorId
    }
  });
}

/**
 * Publish an inspection completed event
 * 
 * @param {Object} inspection - The completed inspection
 * @param {string} result - The inspection result
 */
function publishInspectionCompleted(inspection, result) {
  const inspectionData = inspection.toObject ? inspection.toObject() : inspection;
  
  domainEventBus.publishFromContext('inspection', {
    type: 'InspectionCompleted',
    payload: {
      inspectionId: inspectionData.id,
      customerId: inspectionData.customerId,
      supplierId: inspectionData.supplierId,
      completedDate: inspectionData.completedDate ? inspectionData.completedDate.toISOString() : new Date().toISOString(),
      result: result || 'completed',
      defectCount: inspectionData.defects ? inspectionData.defects.length : 0
    }
  });
}

/**
 * Publish an inspection cancelled event
 * 
 * @param {Object} inspection - The cancelled inspection
 * @param {string} reason - The cancellation reason
 */
function publishInspectionCancelled(inspection, reason) {
  const inspectionData = inspection.toObject ? inspection.toObject() : inspection;
  
  domainEventBus.publishFromContext('inspection', {
    type: 'InspectionCancelled',
    payload: {
      inspectionId: inspectionData.id,
      customerId: inspectionData.customerId,
      supplierId: inspectionData.supplierId,
      reason: reason || 'No reason provided'
    }
  });
}

/**
 * Publish a defect recorded event
 * 
 * @param {Object} inspection - The inspection
 * @param {Object} defect - The recorded defect
 */
function publishDefectRecorded(inspection, defect) {
  const inspectionData = inspection.toObject ? inspection.toObject() : inspection;
  const defectData = defect.toObject ? defect.toObject() : defect;
  
  domainEventBus.publishFromContext('inspection', {
    type: 'DefectRecorded',
    payload: {
      inspectionId: inspectionData.id,
      defectId: defectData.id,
      itemId: defectData.itemId,
      customerId: inspectionData.customerId,
      supplierId: inspectionData.supplierId,
      componentId: inspectionData.componentId,
      severity: defectData.severity,
      description: defectData.description
    }
  });
}

module.exports = {
  initializeInspectionEventPublishers,
  publishInspectionCreated,
  publishInspectionScheduled,
  publishInspectionRescheduled,
  publishInspectionStarted,
  publishInspectionCompleted,
  publishInspectionCancelled,
  publishDefectRecorded
}; 