/**
 * core/index.js
 * 
 * Export all core modules
 */

const Entity = require('./Entity');
const ValueObject = require('./ValueObject');
const AggregateRoot = require('./AggregateRoot');
const Repository = require('./Repository');
const Service = require('./Service');
const Controller = require('./Controller');
const DomainEvents = require('./DomainEvents');
const DomainEventBus = require('./DomainEventBus');
const DomainEventInitializer = require('./DomainEventInitializer');
const errors = require('./errors');
const middleware = require('./middleware');

module.exports = {
  Entity,
  ValueObject,
  AggregateRoot,
  Repository,
  Service,
  Controller,
  DomainEvents,
  DomainEventBus,
  DomainEventInitializer,
  errors,
  middleware
}; 