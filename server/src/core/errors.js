/**
 * errors.js
 * 
 * Defines custom error classes for the application
 * Enables consistent error handling across domains
 */

class ApplicationError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends ApplicationError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ValidationError extends ApplicationError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends ApplicationError {
  constructor(message = 'Not authorized') {
    super(message, 403);
  }
}

class ConflictError extends ApplicationError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class BusinessRuleError extends ApplicationError {
  constructor(message = 'Business rule violation') {
    super(message, 422);
  }
}

class DomainError extends ApplicationError {
  constructor(message = 'Domain error') {
    super(message, 422);
  }
}

class InfrastructureError extends ApplicationError {
  constructor(message = 'Infrastructure error') {
    super(message, 500);
  }
}

module.exports = {
  ApplicationError,
  NotFoundError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  BusinessRuleError,
  DomainError,
  InfrastructureError
}; 