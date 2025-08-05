/**
 * Value Objects Index
 * 
 * This module contains value objects that are shared between domains.
 * Value objects are immutable objects that represent concepts with no identity.
 */

const Measurement = require('./Measurement');
const Tolerance = require('./Tolerance');
const Range = require('./Range');
const UnitOfMeasure = require('./UnitOfMeasure');

module.exports = {
  Measurement,
  Tolerance,
  Range,
  UnitOfMeasure
}; 