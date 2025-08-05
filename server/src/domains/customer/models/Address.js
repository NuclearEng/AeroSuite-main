/**
 * Address.js
 * 
 * Address value object for the Customer domain
 */

const ValueObject = require('../../../core/ValueObject');
const { DomainError } = require('../../../core/errors');

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
      throw new DomainError('Street is required');
    }
    
    if (!this.city) {
      throw new DomainError('City is required');
    }
    
    if (!this.country) {
      throw new DomainError('Country is required');
    }
  }
  
  getFullAddress() {
    return `${this.street}, ${this.city}, ${this.state || ''} ${this.postalCode || ''}, ${this.country}`.trim().replace(/,\s+,/g, ',');
  }
}

module.exports = Address; 