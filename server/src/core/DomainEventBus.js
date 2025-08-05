/**
 * DomainEventBus.js
 * 
 * Extends the DomainEvents system to support cross-domain event handling
 * Implements the publisher-subscriber pattern for inter-context communication
 */

const DomainEvents = require('./DomainEvents');
const logger = require('../utils/logger');

class DomainEventBus {
  constructor() {
    this.domainEvents = DomainEvents;
    this.eventSchemas = {};
    this.contextSubscriptions = {};
    this.logger = logger;
    
    // Set logger for the domain events system
    this.domainEvents.setLogger(logger);
  }

  /**
   * Register an event schema
   * @param {string} eventType - Event type
   * @param {Object} schema - JSON schema for event validation
   */
  registerEventSchema(eventType, schema) {
    this.eventSchemas[eventType] = schema;
    this.logger.debug(`Registered schema for event: ${eventType}`);
  }

  /**
   * Validate an event against its schema
   * @param {Object} event - Event to validate
   * @returns {boolean} - True if valid, throws error if not
   */
  validateEvent(event) {
    const { type } = event;
    
    if (!type) {
      throw new Error('Event must have a type');
    }
    
    // If no schema is registered, consider it valid
    if (!this.eventSchemas[type]) {
      return true;
    }
    
    // TODO: Implement JSON Schema validation
    // For now, we'll do basic validation
    const schema = this.eventSchemas[type];
    
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!event.payload || event.payload[field] === undefined) {
          throw new Error(`Event ${type} is missing required field: ${field}`);
        }
      }
    }
    
    return true;
  }

  /**
   * Subscribe a context to events from another context
   * @param {string} sourceContext - Context publishing the events
   * @param {string} targetContext - Context subscribing to the events
   * @param {string} eventType - Event type to subscribe to
   * @param {Function} handler - Handler function
   * @returns {Function} - Unsubscribe function
   */
  subscribeContext(sourceContext, targetContext, eventType, handler) {
    const eventKey = `${sourceContext}:${eventType}`;
    
    // Create wrapper that adds context information
    const wrappedHandler = (event) => {
      this.logger.debug(`${targetContext} handling ${eventKey}`, { event });
      
      try {
        handler(event);
      } catch (error) {
        this.logger.error(`Error in ${targetContext} handler for ${eventKey}`, { 
          error,
          sourceContext,
          targetContext,
          eventType
        });
      }
    };
    
    // Subscribe to the event
    const unsubscribe = this.domainEvents.subscribe(eventType, wrappedHandler);
    
    // Store subscription information
    if (!this.contextSubscriptions[eventKey]) {
      this.contextSubscriptions[eventKey] = [];
    }
    
    this.contextSubscriptions[eventKey].push({
      sourceContext,
      targetContext,
      handler: wrappedHandler
    });
    
    this.logger.info(`${targetContext} subscribed to ${eventKey}`);
    
    return unsubscribe;
  }

  /**
   * Publish an event from a specific context
   * @param {string} sourceContext - Context publishing the event
   * @param {Object} event - Event to publish
   */
  publishFromContext(sourceContext, event) {
    try {
      // Add source context to event
      const enrichedEvent = {
        ...event,
        sourceContext,
        timestamp: new Date().toISOString()
      };
      
      // Validate event
      this.validateEvent(enrichedEvent);
      
      // Log the event
      this.logger.debug(`Publishing event from ${sourceContext}`, { event: enrichedEvent });
      
      // Publish the event
      this.domainEvents.publish(enrichedEvent);
    } catch (error) {
      this.logger.error(`Error publishing event from ${sourceContext}`, { 
        error,
        sourceContext,
        event
      });
      throw error;
    }
  }

  /**
   * Get all subscriptions for a specific event type
   * @param {string} eventType - Event type
   * @returns {Array} - Array of subscriptions
   */
  getSubscriptionsForEvent(eventType) {
    return Object.keys(this.contextSubscriptions)
      .filter(key => key.endsWith(`:${eventType}`))
      .flatMap(key => this.contextSubscriptions[key]);
  }

  /**
   * Get all subscriptions between two contexts
   * @param {string} sourceContext - Source context
   * @param {string} targetContext - Target context
   * @returns {Array} - Array of subscriptions
   */
  getSubscriptionsBetweenContexts(sourceContext, targetContext) {
    return Object.values(this.contextSubscriptions)
      .flat()
      .filter(sub => 
        sub.sourceContext === sourceContext && 
        sub.targetContext === targetContext
      );
  }

  /**
   * Clear all subscriptions (useful for testing)
   */
  clearSubscriptions() {
    this.contextSubscriptions = {};
    this.domainEvents.clearSubscribers();
  }
}

// Export singleton instance
module.exports = new DomainEventBus(); 