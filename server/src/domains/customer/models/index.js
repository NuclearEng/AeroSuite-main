/**
 * Index.js
 * 
 * Export all Customer domain models
 */

const Customer = require('./Customer');
const Address = require('./Address');
const Contact = require('./Contact');

module.exports = {
  Customer,
  Address,
  Contact
}; 