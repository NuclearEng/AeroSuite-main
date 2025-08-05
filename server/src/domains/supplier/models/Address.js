/**
 * Address.js
 * 
 * Address value object for the Supplier domain
 */

const ValueObject = require('../../../core/ValueObject');

class Address extends ValueObject {
  constructor({
    street,
    city,
    state,
    postalCode,
    country
  }) {
    super();
    this.street = street;
    this.city = city;
    this.state = state;
    this.postalCode = postalCode;
    this.country = country;
    
    this.validate();
  }
  
  validate() {
    if (!this.street) {
      throw new Error('Street is required');
    }
    
    if (!this.city) {
      throw new Error('City is required');
    }
    
    if (!this.country) {
      throw new Error('Country is required');
    }
  }
  
  getFullAddress() {
    return `${this.street}, ${this.city}, ${this.state || ''} ${this.postalCode || ''}, ${this.country}`.trim().replace(/,\s+,/g, ',');
  }
}

module.exports = Address; 