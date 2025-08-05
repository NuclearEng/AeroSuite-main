/**
 * index.js
 * 
 * Export all service discovery components
 * Implements RF024 - Implement service discovery for microservices
 */

const ServiceDiscovery = require('./ServiceDiscovery');
const ServiceDiscoveryClient = require('./ServiceDiscoveryClient');
const StorageAdapter = require('./StorageAdapter');
const InMemoryStorageAdapter = require('./InMemoryStorageAdapter');
const RedisStorageAdapter = require('./RedisStorageAdapter');
const MongoStorageAdapter = require('./MongoStorageAdapter');

module.exports = {
  ServiceDiscovery,
  ServiceDiscoveryClient,
  StorageAdapter,
  InMemoryStorageAdapter,
  RedisStorageAdapter,
  MongoStorageAdapter
}; 