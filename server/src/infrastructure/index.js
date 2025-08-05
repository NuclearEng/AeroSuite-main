/**
 * infrastructure/index.js
 * 
 * Export all infrastructure modules
 */

const database = require('./database');
const logger = require('./logger');
const cache = require('./cache');
const MongoRepository = require('./MongoRepository');
const acl = require('./anti-corruption-layer');
const { CircuitBreaker, CircuitState } = require('./CircuitBreaker');
const CircuitBreakerRegistry = require('./CircuitBreakerRegistry');

module.exports = {
  database,
  logger,
  cache,
  MongoRepository,
  acl,
  CircuitBreaker,
  CircuitState,
  CircuitBreakerRegistry
}; 