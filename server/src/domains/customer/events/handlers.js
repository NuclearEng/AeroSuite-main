/**
 * Customer domain event handlers
 * 
 * Handles events from other domains that are relevant to the customer domain
 */

const domainEventBus = require('../../../core/DomainEventBus');
const logger = require('../../../utils/logger');
const customerRepository = require('../repositories/customerRepository');

/**
 * Initialize event handlers for the customer domain
 */
function initializeCustomerEventHandlers() {
  logger.info('Initializing Customer domain event handlers');
  
  // Handle inspection events
  domainEventBus.subscribeContext(
    'inspection',
    'customer',
    'InspectionCompleted',
    handleInspectionCompleted
  );
  
  domainEventBus.subscribeContext(
    'inspection',
    'customer',
    'InspectionScheduled',
    handleInspectionScheduled
  );
  
  domainEventBus.subscribeContext(
    'supplier',
    'customer',
    'SupplierCustomerAssociated',
    handleSupplierCustomerAssociated
  );
}

/**
 * Handle InspectionCompleted event
 * Updates customer with latest inspection data
 * 
 * @param {Object} event - The event object
 */
async function handleInspectionCompleted(event) {
  const { customerId, inspectionId, result } = event.payload;
  
  if (!customerId) {
    logger.warn('Received InspectionCompleted event without customerId', { event });
    return;
  }
  
  try {
    logger.debug(`Handling InspectionCompleted for customer ${customerId}`, { inspectionId });
    
    const customer = await customerRepository.findById(customerId);
    
    if (!customer) {
      logger.warn(`Customer ${customerId} not found for InspectionCompleted event`, { inspectionId });
      return;
    }
    
    // Update customer with inspection result
    // This could update metrics, add to inspection history, etc.
    // For now, we'll just log it
    logger.info(`Updated customer ${customerId} with inspection result: ${result}`, { inspectionId });
    
    // In a real implementation, we might do something like:
    // customer.addInspectionToHistory(inspectionId, result);
    // await customerRepository.save(customer);
  } catch (error) {
    logger.error(`Error handling InspectionCompleted event for customer ${customerId}`, {
      error,
      customerId,
      inspectionId
    });
  }
}

/**
 * Handle InspectionScheduled event
 * Updates customer with upcoming inspection information
 * 
 * @param {Object} event - The event object
 */
async function handleInspectionScheduled(event) {
  const { customerId, inspectionId, scheduledDate } = event.payload;
  
  if (!customerId) {
    logger.warn('Received InspectionScheduled event without customerId', { event });
    return;
  }
  
  try {
    logger.debug(`Handling InspectionScheduled for customer ${customerId}`, { inspectionId });
    
    const customer = await customerRepository.findById(customerId);
    
    if (!customer) {
      logger.warn(`Customer ${customerId} not found for InspectionScheduled event`, { inspectionId });
      return;
    }
    
    // Update customer with scheduled inspection
    // This could add to upcoming inspections, update calendar, etc.
    // For now, we'll just log it
    logger.info(`Updated customer ${customerId} with scheduled inspection on ${scheduledDate}`, { inspectionId });
    
    // In a real implementation, we might do something like:
    // customer.addUpcomingInspection(inspectionId, scheduledDate);
    // await customerRepository.save(customer);
  } catch (error) {
    logger.error(`Error handling InspectionScheduled event for customer ${customerId}`, {
      error,
      customerId,
      inspectionId
    });
  }
}

/**
 * Handle SupplierCustomerAssociated event
 * Updates customer with supplier association
 * 
 * @param {Object} event - The event object
 */
async function handleSupplierCustomerAssociated(event) {
  const { customerId, supplierId, relationshipType } = event.payload;
  
  try {
    logger.debug(`Handling SupplierCustomerAssociated for customer ${customerId}`, { supplierId });
    
    const customer = await customerRepository.findById(customerId);
    
    if (!customer) {
      logger.warn(`Customer ${customerId} not found for SupplierCustomerAssociated event`, { supplierId });
      return;
    }
    
    // Update customer with supplier association
    // For now, we'll just log it
    logger.info(`Associated customer ${customerId} with supplier ${supplierId} (${relationshipType})`);
    
    // In a real implementation, we might do something like:
    // customer.addSupplierAssociation(supplierId, relationshipType);
    // await customerRepository.save(customer);
  } catch (error) {
    logger.error(`Error handling SupplierCustomerAssociated event for customer ${customerId}`, {
      error,
      customerId,
      supplierId
    });
  }
}

module.exports = {
  initializeCustomerEventHandlers
}; 