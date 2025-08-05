/**
 * JWT Configuration
 * Centralizes JWT configuration for better security and management
 */

module.exports = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  algorithm: 'HS256',
  issuer: 'aerosuite-api'
}; 