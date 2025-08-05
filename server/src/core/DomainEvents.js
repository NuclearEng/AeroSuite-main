/**
 * DomainEvents.js
 * 
 * Implements the publisher-subscriber pattern for domain events
 * Enables loose coupling between bounded contexts
 */

class DomainEvents {
  constructor() {
    this.subscribers = {};
    this.logger = null;
  }

  /**
   * Set logger for event tracking
   * @param {Object} logger - Logger instance
   */
  setLogger(logger) {
    this.logger = logger;
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event to subscribe to
   * @param {Function} callback - Function to call when event is published
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventName, callback) {
    if (!this.subscribers[eventName]) {
      this.subscribers[eventName] = [];
    }
    
    this.subscribers[eventName].push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers[eventName] = this.subscribers[eventName].filter(
        cb => cb !== callback
      );
    };
  }

  /**
   * Publish an event
   * @param {Object} event - Event object with type property
   */
  publish(event) {
    if (!event || !event.type) {
      throw new Error('Published event must have a type property');
    }
    
    const { type } = event;
    
    if (this.logger) {
      this.logger.debug(`Domain event published: ${type}`, { event });
    }
    
    if (!this.subscribers[type]) {
      return; // No subscribers for this event
    }
    
    // Execute all subscriber callbacks
    this.subscribers[type].forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        if (this.logger) {
          this.logger.error(`Error in event subscriber for ${type}`, { error });
        } else {
          console.error(`Error in event subscriber for ${type}:`, error);
        }
      }
    });
  }

  /**
   * Clear all subscribers (useful for testing)
   */
  clearSubscribers() {
    this.subscribers = {};
  }
}

// Export singleton instance
module.exports = new DomainEvents(); 