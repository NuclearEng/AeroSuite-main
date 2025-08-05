/**
 * Constants.js
 * 
 * Shared constants used by multiple domains
 */

// Severity levels for defects and issues
const SEVERITY = {
  CRITICAL: 'critical',
  MAJOR: 'major',
  MINOR: 'minor',
  COSMETIC: 'cosmetic'
};

// Status values for various entities
const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DRAFT: 'draft',
  REVIEW: 'review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  OBSOLETE: 'obsolete',
  DEVELOPMENT: 'development',
  DISCONTINUED: 'discontinued'
};

// Common units of measure
const UNITS = {
  // Length
  MILLIMETER: 'mm',
  CENTIMETER: 'cm',
  METER: 'm',
  INCH: 'in',
  FOOT: 'ft',
  
  // Weight
  GRAM: 'g',
  KILOGRAM: 'kg',
  POUND: 'lb',
  
  // Volume
  MILLILITER: 'ml',
  LITER: 'l',
  CUBIC_CENTIMETER: 'cm³',
  CUBIC_METER: 'm³',
  
  // Pressure
  PASCAL: 'Pa',
  KILOPASCAL: 'kPa',
  BAR: 'bar',
  PSI: 'psi',
  
  // Temperature
  CELSIUS: '°C',
  FAHRENHEIT: '°F',
  KELVIN: 'K',
  
  // Electrical
  VOLT: 'V',
  AMPERE: 'A',
  OHM: 'Ω',
  WATT: 'W',
  
  // Time
  SECOND: 's',
  MINUTE: 'min',
  HOUR: 'h'
};

// Component categories
const COMPONENT_CATEGORIES = {
  MECHANICAL: 'mechanical',
  ELECTRICAL: 'electrical',
  HYDRAULIC: 'hydraulic',
  PNEUMATIC: 'pneumatic',
  STRUCTURAL: 'structural',
  ELECTRONIC: 'electronic',
  SOFTWARE: 'software'
};

// Inspection types
const INSPECTION_TYPES = {
  INCOMING: 'incoming',
  IN_PROCESS: 'in-process',
  FINAL: 'final',
  AUDIT: 'audit'
};

// Defect resolution types
const RESOLUTION_TYPES = {
  REWORK: 'rework',
  REPAIR: 'repair',
  REPLACE: 'replace',
  SCRAP: 'scrap',
  USE_AS_IS: 'use-as-is',
  WAIVER: 'waiver'
};

// Document types
const DOCUMENT_TYPES = {
  SPECIFICATION: 'specification',
  DRAWING: 'drawing',
  PROCEDURE: 'procedure',
  REPORT: 'report',
  CERTIFICATE: 'certificate',
  PHOTO: 'photo',
  OTHER: 'other'
};

module.exports = {
  SEVERITY,
  STATUS,
  UNITS,
  COMPONENT_CATEGORIES,
  INSPECTION_TYPES,
  RESOLUTION_TYPES,
  DOCUMENT_TYPES
}; 