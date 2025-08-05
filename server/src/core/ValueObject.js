/**
 * ValueObject.js
 * 
 * Base class for all domain value objects
 * Value objects are immutable and equality is based on their properties
 */

class ValueObject {
  /**
   * Check if this value object is equal to another value object
   * Value objects are equal if all their properties are equal
   * 
   * @param {ValueObject} valueObject - Value object to compare with
   * @returns {boolean} - True if value objects are equal
   */
  equals(valueObject) {
    if (valueObject === null || valueObject === undefined) {
      return false;
    }
    
    if (this === valueObject) {
      return true;
    }
    
    if (this.constructor !== valueObject.constructor) {
      return false;
    }
    
    const thisProps = Object.getOwnPropertyNames(this);
    const valueObjectProps = Object.getOwnPropertyNames(valueObject);
    
    if (thisProps.length !== valueObjectProps.length) {
      return false;
    }
    
    for (const prop of thisProps) {
      if (this[prop] !== valueObject[prop]) {
        // Handle nested objects/arrays
        if (
          typeof this[prop] === 'object' && 
          this[prop] !== null && 
          typeof valueObject[prop] === 'object' && 
          valueObject[prop] !== null
        ) {
          // If the property is a value object with equals method
          if (typeof this[prop].equals === 'function') {
            if (!this[prop].equals(valueObject[prop])) {
              return false;
            }
          } 
          // For arrays and plain objects, use JSON.stringify for comparison
          else if (JSON.stringify(this[prop]) !== JSON.stringify(valueObject[prop])) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Convert value object to a plain object
   * @returns {Object} - Plain object representation of the value object
   */
  toObject() {
    const obj = {};
    
    for (const prop of Object.getOwnPropertyNames(this)) {
      if (typeof this[prop] !== 'function') {
        if (this[prop] !== null && typeof this[prop] === 'object' && typeof this[prop].toObject === 'function') {
          obj[prop] = this[prop].toObject();
        } else {
          obj[prop] = this[prop];
        }
      }
    }
    
    return obj;
  }

  /**
   * Convert value object to JSON
   * @returns {Object} - JSON representation of the value object
   */
  toJSON() {
    return this.toObject();
  }
}

module.exports = ValueObject; 