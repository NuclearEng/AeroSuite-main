/**
 * Shared Kernel Index
 * 
 * This module contains shared models, utilities, and constants
 * that are used by multiple domains, particularly the
 * Inspection and Component domains.
 */

const Specification = require('./models/Specification');
const ValueObjects = require('./value-objects');
const Constants = require('./constants');
const Utils = require('./utils');

module.exports = {
  Specification,
  ValueObjects,
  Constants,
  Utils
}; 