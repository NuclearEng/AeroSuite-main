/**
 * Customer domain events
 * 
 * Exports all customer event-related functionality
 */

const schemas = require('./schemas');
const handlers = require('./handlers');
const publishers = require('./publishers');

module.exports = {
  schemas,
  handlers,
  publishers,
  
  /**
   * Initialize all customer event functionality
   */
  initialize: () => {
    publishers.initializeCustomerEventPublishers();
    handlers.initializeCustomerEventHandlers();
  }
}; 