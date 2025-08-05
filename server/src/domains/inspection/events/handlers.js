/**
 * Inspection domain event handlers
 * 
 * Handles events from other domains that are relevant to the inspection domain
 */

const domainEventBus = require('../../../core/DomainEventBus');
const logger = require('../../../utils/logger');
const inspectionRepository = require('../repositories/inspectionRepository');

/**
 * Initialize event handlers for the inspection domain
 */
function initializeInspectionEventHandlers() {
  logger.info('Initializing Inspection domain event handlers');
  
  // Handle customer events
  domainEventBus.subscribeContext(
    'customer',
    'inspection',
    'CustomerCreated',
    handleCustomerCreated
  );
  
  domainEventBus.subscribeContext(
    'customer',
    'inspection',
    'CustomerStatusUpdated',
    handleCustomerStatusUpdated
  );
  
  // Handle supplier events
  domainEventBus.subscribeContext(
    'supplier',
    'inspection',
    'SupplierCreated',
    handleSupplierCreated
  );
  
  domainEventBus.subscribeContext(
    'supplier',
    'inspection',
    'SupplierStatusUpdated',
    handleSupplierStatusUpdated
  );
  
  // Handle component events
  domainEventBus.subscribeContext(
    'component',
    'inspection',
    'ComponentCreated',
    handleComponentCreated
  );
  
  domainEventBus.subscribeContext(
    'component',
    'inspection',
    'ComponentSpecificationUpdated',
    handleComponentSpecificationUpdated
  );
}

/**
 * Handle CustomerCreated event
 * May set up default inspection templates for the customer
 * 
 * @param {Object} event - The event object
 */
async function handleCustomerCreated(event) {
  const { customerId, name, type } = event.payload;
  
  logger.debug(`Handling CustomerCreated for inspection domain: ${name} (${customerId})`);
  
  // In a real implementation, we might create default inspection templates
  // or set up customer-specific inspection configurations
  logger.info(`Processed new customer ${name} (${customerId}) in inspection domain`);
}

/**
 * Handle CustomerStatusUpdated event
 * May affect scheduled inspections for the customer
 * 
 * @param {Object} event - The event object
 */
async function handleCustomerStatusUpdated(event) {
  const { customerId, status, previousStatus } = event.payload;
  
  logger.debug(`Handling CustomerStatusUpdated for inspection domain: ${customerId}, status: ${status}`);
  
  try {
    // If customer becomes inactive, we might need to handle their scheduled inspections
    if (status === 'inactive' && previousStatus === 'active') {
      // Find scheduled inspections for this customer
      const scheduledInspections = await inspectionRepository.findByCustomerAndStatus(
        customerId,
        'scheduled'
      );
      
      logger.info(`Found ${scheduledInspections.length} scheduled inspections for now inactive customer ${customerId}`);
      
      // In a real implementation, we might cancel or reschedule these inspections
      // For now, we'll just log it
      logger.info(`Would handle ${scheduledInspections.length} inspections for inactive customer ${customerId}`);
    }
  } catch (error) {
    logger.error(`Error handling CustomerStatusUpdated event for inspection domain`, {
      error,
      customerId,
      status
    });
  }
}

/**
 * Handle SupplierCreated event
 * May set up default inspection templates for the supplier
 * 
 * @param {Object} event - The event object
 */
async function handleSupplierCreated(event) {
  const { supplierId, name, type } = event.payload;
  
  logger.debug(`Handling SupplierCreated for inspection domain: ${name} (${supplierId})`);
  
  // In a real implementation, we might create default inspection templates
  // or set up supplier-specific inspection configurations
  logger.info(`Processed new supplier ${name} (${supplierId}) in inspection domain`);
}

/**
 * Handle SupplierStatusUpdated event
 * May affect scheduled inspections for the supplier
 * 
 * @param {Object} event - The event object
 */
async function handleSupplierStatusUpdated(event) {
  const { supplierId, status, previousStatus } = event.payload;
  
  logger.debug(`Handling SupplierStatusUpdated for inspection domain: ${supplierId}, status: ${status}`);
  
  try {
    // If supplier becomes inactive, we might need to handle their scheduled inspections
    if (status === 'inactive' && previousStatus === 'active') {
      // Find scheduled inspections for this supplier
      const scheduledInspections = await inspectionRepository.findBySupplierAndStatus(
        supplierId,
        'scheduled'
      );
      
      logger.info(`Found ${scheduledInspections.length} scheduled inspections for now inactive supplier ${supplierId}`);
      
      // In a real implementation, we might cancel or reschedule these inspections
      // For now, we'll just log it
      logger.info(`Would handle ${scheduledInspections.length} inspections for inactive supplier ${supplierId}`);
    }
  } catch (error) {
    logger.error(`Error handling SupplierStatusUpdated event for inspection domain`, {
      error,
      supplierId,
      status
    });
  }
}

/**
 * Handle ComponentCreated event
 * May set up default inspection templates for the component
 * 
 * @param {Object} event - The event object
 */
async function handleComponentCreated(event) {
  const { componentId, name, type } = event.payload;
  
  logger.debug(`Handling ComponentCreated for inspection domain: ${name} (${componentId})`);
  
  // In a real implementation, we might create default inspection templates
  // based on component specifications
  logger.info(`Processed new component ${name} (${componentId}) in inspection domain`);
}

/**
 * Handle ComponentSpecificationUpdated event
 * May affect inspection criteria for the component
 * 
 * @param {Object} event - The event object
 */
async function handleComponentSpecificationUpdated(event) {
  const { componentId, specificationId, changes } = event.payload;
  
  logger.debug(`Handling ComponentSpecificationUpdated for inspection domain: ${componentId}, spec: ${specificationId}`);
  
  try {
    // Find inspections that use this component
    const affectedInspections = await inspectionRepository.findByComponentId(componentId);
    
    logger.info(`Found ${affectedInspections.length} inspections affected by component ${componentId} specification update`);
    
    // In a real implementation, we might update inspection criteria
    // For now, we'll just log it
    logger.info(`Would update inspection criteria for ${affectedInspections.length} inspections`);
  } catch (error) {
    logger.error(`Error handling ComponentSpecificationUpdated event for inspection domain`, {
      error,
      componentId,
      specificationId
    });
  }
}

module.exports = {
  initializeInspectionEventHandlers
}; 