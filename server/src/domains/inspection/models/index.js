/**
 * Index.js
 * 
 * Export all Inspection domain models
 */

const Inspection = require('./Inspection');
const InspectionItem = require('./InspectionItem');
const Defect = require('./Defect');

module.exports = {
  Inspection,
  InspectionItem,
  Defect
}; 