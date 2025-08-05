/**
 * Contact.js
 * 
 * Contact entity for the Supplier domain
 */

const Entity = require('../../../core/Entity');
const { DomainError } = require('../../../core/errors');

class Contact extends Entity {
  constructor({
    id,
    name,
    email,
    phone,
    role,
    isPrimary = false,
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.role = role;
    this.isPrimary = isPrimary;
    
    this.validate();
  }
  
  validate() {
    if (!this.name) {
      throw new DomainError('Contact name is required');
    }
    
    if (!this.email) {
      throw new DomainError('Contact email is required');
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new DomainError('Invalid email format');
    }
  }
  
  makePrimary() {
    this.isPrimary = true;
    this.markModified();
  }
  
  removePrimary() {
    this.isPrimary = false;
    this.markModified();
  }
  
  updateDetails({ name, email, phone, role }) {
    if (name) this.name = name;
    if (email) {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new DomainError('Invalid email format');
      }
      this.email = email;
    }
    if (phone) this.phone = phone;
    if (role) this.role = role;
    
    this.markModified();
  }
  
  toObject() {
    return {
      ...super.toObject(),
      name: this.name,
      email: this.email,
      phone: this.phone,
      role: this.role,
      isPrimary: this.isPrimary
    };
  }
}

module.exports = Contact; 