/**
 * EventEmitter.js
 * 
 * Singleton implementation of an event emitter for the application
 * Implements RF037 - Ensure all services are stateless
 */

const { EventEmitter: NodeEventEmitter } = require('events');

/**
 * Singleton EventEmitter class
 * Provides a centralized event bus for the application
 * Enables stateless services by moving state to a central location
 */
class EventEmitter {
  /**
   * Private constructor to prevent direct instantiation
   * Use getInstance() instead
   */
  constructor() {
    this._emitter = new NodeEventEmitter();
    
    // Configure maximum number of listeners to avoid memory leaks
    this._emitter.setMaxListeners(100);
    
    // Keep track of all registered listeners for cleanup
    this._registeredListeners = new Map();
  }
  
  /**
   * Get the singleton instance of the EventEmitter
   * @returns {EventEmitter} - The singleton instance
   */
  static getInstance() {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    
    return EventEmitter.instance;
  }
  
  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   * @returns {Function} - Unsubscribe function
   */
  on(event, listener) {
    this._emitter.on(event, listener);
    
    // Store the listener for potential cleanup
    if (!this._registeredListeners.has(event)) {
      this._registeredListeners.set(event, new Set());
    }
    this._registeredListeners.get(event).add(listener);
    
    // Return unsubscribe function
    return () => {
      this.off(event, listener);
    };
  }
  
  /**
   * Register a one-time event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  once(event, listener) {
    this._emitter.once(event, listener);
  }
  
  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} listener - Event listener
   */
  off(event, listener) {
    this._emitter.off(event, listener);
    
    // Remove from registered listeners
    if (this._registeredListeners.has(event)) {
      this._registeredListeners.get(event).delete(listener);
    }
  }
  
  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...any} args - Event arguments
   */
  emit(event, ...args) {
    this._emitter.emit(event, ...args);
  }
  
  /**
   * Remove all listeners for an event
   * @param {string} event - Event name (optional, if not provided removes all listeners)
   */
  removeAllListeners(event) {
    if (event) {
      this._emitter.removeAllListeners(event);
      this._registeredListeners.delete(event);
    } else {
      this._emitter.removeAllListeners();
      this._registeredListeners.clear();
    }
  }
  
  /**
   * Get all registered listeners for an event
   * @param {string} event - Event name
   * @returns {Function[]} - Array of listener functions
   */
  listeners(event) {
    return this._emitter.listeners(event);
  }
  
  /**
   * Get the number of listeners for an event
   * @param {string} event - Event name
   * @returns {number} - Number of listeners
   */
  listenerCount(event) {
    return this._emitter.listenerCount(event);
  }
}

module.exports = EventEmitter; 