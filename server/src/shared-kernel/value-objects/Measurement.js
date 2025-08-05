/**
 * Measurement.js
 * 
 * Value object representing a measurement with a value and unit.
 * Used by both Component and Inspection domains.
 */

const UnitOfMeasure = require('./UnitOfMeasure');

class Measurement {
  constructor(value, unit) {
    if (value !== null && value !== undefined && typeof value !== 'number') {
      throw new Error('Measurement value must be a number');
    }
    
    this.value = value;
    this.unit = unit;
    
    // Freeze the object to make it immutable
    Object.freeze(this);
  }
  
  /**
   * Convert to another unit of measure
   * @param {string} targetUnit - The unit to convert to
   * @returns {Measurement|null} - A new Measurement in the target unit, or null if conversion not possible
   */
  convertTo(targetUnit) {
    const convertedValue = UnitOfMeasure.convert(this.value, this.unit, targetUnit);
    
    if (convertedValue === null) {
      return null;
    }
    
    return new Measurement(convertedValue, targetUnit);
  }
  
  /**
   * Compare this measurement to another
   * @param {Measurement} other - The measurement to compare with
   * @returns {number|null} - Negative if this < other, 0 if equal, positive if this > other, null if incomparable
   */
  compareTo(other) {
    // Can't compare if either is null
    if (this.value === null || other.value === null) {
      return null;
    }
    
    // If units are the same, compare directly
    if (this.unit === other.unit) {
      return this.value - other.value;
    }
    
    // Try to convert the other measurement to this unit
    const convertedOther = other.convertTo(this.unit);
    
    // If conversion failed, measurements are incomparable
    if (convertedOther === null) {
      return null;
    }
    
    return this.value - convertedOther.value;
  }
  
  /**
   * Check if this measurement equals another
   * @param {Measurement} other - The measurement to compare with
   * @returns {boolean|null} - True if equal, false if not equal, null if incomparable
   */
  equals(other) {
    const comparison = this.compareTo(other);
    
    if (comparison === null) {
      return null;
    }
    
    return comparison === 0;
  }
  
  /**
   * Check if this measurement is greater than another
   * @param {Measurement} other - The measurement to compare with
   * @returns {boolean|null} - True if greater, false if not greater, null if incomparable
   */
  greaterThan(other) {
    const comparison = this.compareTo(other);
    
    if (comparison === null) {
      return null;
    }
    
    return comparison > 0;
  }
  
  /**
   * Check if this measurement is less than another
   * @param {Measurement} other - The measurement to compare with
   * @returns {boolean|null} - True if less, false if not less, null if incomparable
   */
  lessThan(other) {
    const comparison = this.compareTo(other);
    
    if (comparison === null) {
      return null;
    }
    
    return comparison < 0;
  }
  
  /**
   * Format the measurement as a string
   * @returns {string} - Formatted measurement
   */
  toString() {
    if (this.value === null || this.value === undefined) {
      return `N/A ${this.unit}`;
    }
    
    return `${this.value} ${this.unit}`;
  }
  
  /**
   * Create a measurement from a string
   * @param {string} str - String representation of a measurement (e.g., "5.2 cm")
   * @returns {Measurement|null} - A new Measurement, or null if parsing failed
   */
  static fromString(str) {
    if (!str || typeof str !== 'string') {
      return null;
    }
    
    const parts = str.trim().split(' ');
    
    if (parts.length !== 2) {
      return null;
    }
    
    const value = parseFloat(parts[0]);
    const unit = parts[1];
    
    if (isNaN(value)) {
      return null;
    }
    
    return new Measurement(value, unit);
  }
  
  /**
   * Create a measurement from an object
   * @param {Object} obj - Object with value and unit properties
   * @returns {Measurement} - A new Measurement
   */
  static fromObject(obj) {
    if (!obj || typeof obj !== 'object') {
      return null;
    }
    
    return new Measurement(obj.value, obj.unit);
  }
  
  /**
   * Convert to a plain object
   * @returns {Object} - Plain object representation
   */
  toObject() {
    return {
      value: this.value,
      unit: this.unit
    };
  }
}

module.exports = Measurement; 