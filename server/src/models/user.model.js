/**
 * Mock User Model
 * 
 * This is a simplified mock implementation of the User model
 * for development and testing purposes.
 */

// Mock implementation without mongoose dependency
class User {
  constructor(data = {}) {
    this._id = data._id || `user_${Math.random().toString(36).substr(2, 9)}`;
    this.email = data.email || '';
    this.username = data.username || '';
    this.role = data.role || 'user';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.lastLogin = data.lastLogin || null;
    this.loginHistory = data.loginHistory || [];
    this.accountLocked = data.accountLocked || false;
    this.accountLockedUntil = data.accountLockedUntil || null;
    this.tokenVersion = data.tokenVersion || 1;
  }

  // Mock static methods
  static findOne() {
    return Promise.resolve(null);
  }

  static findById() {
    return Promise.resolve(null);
  }

  static findOneAndUpdate() {
    return Promise.resolve(null);
  }

  static updateOne() {
    return Promise.resolve({ modifiedCount: 0 });
  }
}

// Export the mock model
module.exports = User; 