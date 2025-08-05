/**
 * Specification.js
 * 
 * Shared kernel implementation of Specification model
 * Used by both Component and Inspection domains
 */

const { v4: uuidv4 } = require('uuid');

class Specification {
  constructor({
    id = uuidv4(),
    name,
    value,
    unit,
    description = '',
    category,
    isRequired = false,
    tolerance = null,
    minValue = null,
    maxValue = null,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.unit = unit;
    this.description = description;
    this.category = category;
    this.isRequired = isRequired;
    this.tolerance = tolerance;
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    
    this.validate();
  }
  
  validate() {
    if (!this.name) {
      throw new Error('Specification name is required');
    }
    
    // If min and max values are provided, validate them
    if (this.minValue !== null && this.maxValue !== null) {
      if (typeof this.minValue !== typeof this.maxValue) {
        throw new Error('Min and max values must be of the same type');
      }
      
      if (this.minValue > this.maxValue) {
        throw new Error('Min value cannot be greater than max value');
      }
    }
    
    // If value and min/max are provided, validate value is within range
    if (this.value !== null && this.minValue !== null && this.maxValue !== null) {
      if (typeof this.value === 'number') {
        if (this.value < this.minValue || this.value > this.maxValue) {
          throw new Error(`Value ${this.value} is outside the allowed range (${this.minValue} - ${this.maxValue})`);
        }
      }
    }
    
    // If tolerance is provided, validate it's a number and positive
    if (this.tolerance !== null) {
      if (typeof this.tolerance !== 'number') {
        throw new Error('Tolerance must be a number');
      }
      
      if (this.tolerance < 0) {
        throw new Error('Tolerance cannot be negative');
      }
    }
  }
  
  isWithinTolerance(testValue) {
    if (this.value === null || this.tolerance === null || testValue === null) {
      return null; // Cannot determine
    }
    
    if (typeof this.value !== 'number' || typeof testValue !== 'number') {
      return null; // Can only determine for numeric values
    }
    
    const diff = Math.abs(this.value - testValue);
    return diff <= this.tolerance;
  }
  
  isWithinRange(testValue) {
    if (this.minValue === null || this.maxValue === null || testValue === null) {
      return null; // Cannot determine
    }
    
    if (typeof this.minValue !== typeof testValue || typeof this.maxValue !== typeof testValue) {
      return null; // Types don't match, cannot compare
    }
    
    return testValue >= this.minValue && testValue <= this.maxValue;
  }
  
  /**
   * Convert units if possible
   * @param {string} targetUnit - The unit to convert to
   * @returns {number|null} - The converted value or null if conversion is not possible
   */
  convertTo(targetUnit) {
    if (this.value === null || typeof this.value !== 'number') {
      return null;
    }
    
    // Define unit conversion factors
    const unitConversions = {
      // Length
      'm_to_cm': { from: 'm', to: 'cm', factor: 100 },
      'cm_to_m': { from: 'cm', to: 'm', factor: 0.01 },
      'm_to_mm': { from: 'm', to: 'mm', factor: 1000 },
      'mm_to_m': { from: 'mm', to: 'm', factor: 0.001 },
      'in_to_cm': { from: 'in', to: 'cm', factor: 2.54 },
      'cm_to_in': { from: 'cm', to: 'in', factor: 0.3937 },
      
      // Weight
      'kg_to_g': { from: 'kg', to: 'g', factor: 1000 },
      'g_to_kg': { from: 'g', to: 'kg', factor: 0.001 },
      'lb_to_kg': { from: 'lb', to: 'kg', factor: 0.4536 },
      'kg_to_lb': { from: 'kg', to: 'lb', factor: 2.2046 },
      
      // Pressure
      'psi_to_bar': { from: 'psi', to: 'bar', factor: 0.0689 },
      'bar_to_psi': { from: 'bar', to: 'psi', factor: 14.5038 },
      'bar_to_kPa': { from: 'bar', to: 'kPa', factor: 100 },
      'kPa_to_bar': { from: 'kPa', to: 'bar', factor: 0.01 },
      
      // Temperature (special cases)
      'c_to_f': { from: '°C', to: '°F', special: true },
      'f_to_c': { from: '°F', to: '°C', special: true }
    };
    
    // Find the conversion
    const conversionKey = Object.keys(unitConversions).find(key => {
      const conversion = unitConversions[key];
      return conversion.from === this.unit && conversion.to === targetUnit;
    });
    
    if (!conversionKey) {
      return null; // Conversion not supported
    }
    
    const conversion = unitConversions[conversionKey];
    
    // Handle special conversions
    if (conversion.special) {
      if (conversionKey === 'c_to_f') {
        return (this.value * 9/5) + 32;
      } else if (conversionKey === 'f_to_c') {
        return (this.value - 32) * 5/9;
      }
    }
    
    // Standard conversion
    return this.value * conversion.factor;
  }
  
  /**
   * Create a copy of this specification with updated properties
   * @param {Object} updates - Properties to update
   * @returns {Specification} - A new Specification instance
   */
  update(updates) {
    return new Specification({
      ...this.toObject(),
      ...updates,
      updatedAt: new Date()
    });
  }
  
  /**
   * Convert to a plain object
   * @returns {Object} - Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      name: this.name,
      value: this.value,
      unit: this.unit,
      description: this.description,
      category: this.category,
      isRequired: this.isRequired,
      tolerance: this.tolerance,
      minValue: this.minValue,
      maxValue: this.maxValue,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
  
  /**
   * Create a specification from a plain object
   * @param {Object} obj - Plain object
   * @returns {Specification} - A new Specification instance
   */
  static fromObject(obj) {
    return new Specification(obj);
  }
}

module.exports = Specification; 