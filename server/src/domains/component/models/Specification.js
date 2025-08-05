/**
 * Specification.js
 * 
 * Specification entity for the Component domain
 * Represents a technical specification for a component
 */

const Entity = require('../../../core/Entity');
const { DomainError } = require('../../../core/errors');

class Specification extends Entity {
  constructor({
    id,
    name,
    value,
    unit,
    description = '',
    category,
    isRequired = false,
    tolerance = null,
    minValue = null,
    maxValue = null,
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.name = name;
    this.value = value;
    this.unit = unit;
    this.description = description;
    this.category = category;
    this.isRequired = isRequired;
    this.tolerance = tolerance;
    this.minValue = minValue;
    this.maxValue = maxValue;
    
    this.validate();
  }
  
  validate() {
    if (!this.name) {
      throw new DomainError('Specification name is required');
    }
    
    // If min and max values are provided, validate them
    if (this.minValue !== null && this.maxValue !== null) {
      if (typeof this.minValue !== typeof this.maxValue) {
        throw new DomainError('Min and max values must be of the same type');
      }
      
      if (this.minValue > this.maxValue) {
        throw new DomainError('Min value cannot be greater than max value');
      }
    }
    
    // If value and min/max are provided, validate value is within range
    if (this.value !== null && this.minValue !== null && this.maxValue !== null) {
      if (typeof this.value === 'number') {
        if (this.value < this.minValue || this.value > this.maxValue) {
          throw new DomainError(`Value ${this.value} is outside the allowed range (${this.minValue} - ${this.maxValue})`);
        }
      }
    }
    
    // If tolerance is provided, validate it's a number and positive
    if (this.tolerance !== null) {
      if (typeof this.tolerance !== 'number') {
        throw new DomainError('Tolerance must be a number');
      }
      
      if (this.tolerance < 0) {
        throw new DomainError('Tolerance cannot be negative');
      }
    }
  }
  
  updateDetails({
    name,
    value,
    unit,
    description,
    category,
    isRequired,
    tolerance,
    minValue,
    maxValue
  }) {
    if (name) this.name = name;
    if (value !== undefined) this.value = value;
    if (unit !== undefined) this.unit = unit;
    if (description !== undefined) this.description = description;
    if (category !== undefined) this.category = category;
    if (isRequired !== undefined) this.isRequired = isRequired;
    if (tolerance !== undefined) this.tolerance = tolerance;
    if (minValue !== undefined) this.minValue = minValue;
    if (maxValue !== undefined) this.maxValue = maxValue;
    
    this.validate();
    this.markModified();
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
  
  toObject() {
    return {
      ...super.toObject(),
      name: this.name,
      value: this.value,
      unit: this.unit,
      description: this.description,
      category: this.category,
      isRequired: this.isRequired,
      tolerance: this.tolerance,
      minValue: this.minValue,
      maxValue: this.maxValue
    };
  }
}

module.exports = Specification; 