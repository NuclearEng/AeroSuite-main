/**
 * DomainEventInitializer.js
 * 
 * Initializes domain events for all domains
 * This is the entry point for setting up all domain event handlers and publishers
 */

const logger = require('../utils/logger');
const domainEventBus = require('./DomainEventBus');

// Import domain event modules
const customerEvents = require('../domains/customer/events');
const inspectionEvents = require('../domains/inspection/events');

// We'll add these when they're implemented
// const supplierEvents = require('../domains/supplier/events');
// const componentEvents = require('../domains/component/events');

/**
 * Initialize all domain events
 */
function initializeDomainEvents() {
  logger.info('Initializing domain events system');
  
  try {
    // Set up customer domain events
    customerEvents.initialize();
    
    // Set up inspection domain events
    inspectionEvents.initialize();
    
    // These will be uncommented when implemented
    // supplierEvents.initialize();
    // componentEvents.initialize();
    
    logger.info('Domain events system initialized successfully');
  } catch (error) {
    logger.error('Error initializing domain events system', { error });
    throw error;
  }
}

/**
 * Reset domain events (useful for testing)
 */
function resetDomainEvents() {
  logger.info('Resetting domain events system');
  domainEventBus.clearSubscriptions();
}

module.exports = {
  initializeDomainEvents,
  resetDomainEvents
}; 