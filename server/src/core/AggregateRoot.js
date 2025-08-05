/**
 * AggregateRoot.js
 * 
 * Base class for all domain aggregate roots
 * Aggregate roots are entities that are the entry point to an aggregate
 * They ensure the consistency of changes to the aggregate
 */

const Entity = require('./Entity');
const DomainEvents = require('./DomainEvents');

class AggregateRoot extends Entity {
  constructor(props) {
    super(props);
    this._domainEvents = [];
  }

  /**
   * Get all domain events that have been raised
   * @returns {Array} - Array of domain events
   */
  getDomainEvents() {
    return [...this._domainEvents];
  }

  /**
   * Clear all domain events
   */
  clearDomainEvents() {
    this._domainEvents = [];
  }

  /**
   * Add a domain event
   * @param {Object} domainEvent - Domain event to add
   */
  addDomainEvent(domainEvent) {
    if (!domainEvent.type) {
      throw new Error('Domain events must have a type property');
    }
    
    this._domainEvents.push(domainEvent);
  }

  /**
   * Publish all domain events and clear them
   */
  publishDomainEvents() {
    this.getDomainEvents().forEach(event => {
      DomainEvents.publish(event);
    });
    
    this.clearDomainEvents();
  }

  /**
   * Convert aggregate root to a plain object
   * @returns {Object} - Plain object representation of the aggregate root
   */
  toObject() {
    const obj = super.toObject();
    
    // Don't include domain events in the object representation
    return obj;
  }
}

module.exports = AggregateRoot; 