/**
 * Contact.js
 * 
 * Contact entity for the Customer domain
 */

const Entity = require('../../../core/Entity');
const { DomainError } = require('../../../core/errors');

class Contact extends Entity {
  constructor({
    id,
    name,
    email,
    phone,
    position,
    department,
    isPrimary = false,
    createdAt,
    updatedAt
  }) {
    super({ id, createdAt, updatedAt });
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.position = position;
    this.department = department;
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
  
  updateDetails({ name, email, phone, position, department }) {
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
    if (position) this.position = position;
    if (department) this.department = department;
    
    this.markModified();
  }
  
  toObject() {
    return {
      ...super.toObject(),
      name: this.name,
      email: this.email,
      phone: this.phone,
      position: this.position,
      department: this.department,
      isPrimary: this.isPrimary
    };
  }
}

module.exports = Contact; 