/**
 * Inspection domain events
 * 
 * Exports all inspection event-related functionality
 */

const schemas = require('./schemas');
const handlers = require('./handlers');
const publishers = require('./publishers');

module.exports = {
  schemas,
  handlers,
  publishers,
  
  /**
   * Initialize all inspection event functionality
   */
  initialize: () => {
    publishers.initializeInspectionEventPublishers();
    handlers.initializeInspectionEventHandlers();
  }
}; 