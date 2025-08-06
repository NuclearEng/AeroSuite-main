# Stateless Services Architecture

## Overview

This document describes the stateless services architecture implemented in the AeroSuite project as
part of RF037. Stateless services are designed to not maintain state between requests, making them
more scalable, reliable, and easier to deploy in distributed environments.

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Components](#architecture-components)
3. [Implementation Details](#implementation-details)
4. [Benefits](#benefits)
5. [Usage Guidelines](#usage-guidelines)
6. [Migration Strategy](#migration-strategy)

## Introduction

Stateless services are a key architectural pattern for building scalable and resilient
applications. In a stateless architecture, each request to a service is processed independently,
without relying on stored client session information or previous requests. This approach offers
several advantages:

- __Horizontal Scalability__: Services can be easily scaled horizontally by adding more instances
- __Resilience__: No single point of failure due to stored state
- __Simplified Deployment__: Easier deployment and load balancing
- __Improved Performance__: Better resource utilization and caching opportunities

## Architecture Components

The stateless service architecture consists of the following components:

### 1. EventEmitter

A centralized event bus that enables communication between services without direct coupling. The
`EventEmitter` is implemented as a singleton to ensure all services use the same event bus.

```javascript
// server/src/core/EventEmitter.js
class EventEmitter {
  static getInstance() {
    if (!EventEmitter.instance) {
      EventEmitter.instance = new EventEmitter();
    }
    return EventEmitter.instance;
  }

  // Event methods: on, emit, etc.
}
```bash

### 2. StatelessService

Base class for all stateless services. It extends the existing `DomainService` class and adds
support for request context and stateless execution.

```javascript
// server/src/core/StatelessService.js
class StatelessService extends DomainService {
  async executeStateless(method, context, ...args) {
    this.setRequestContext(context);
    try {
      return await method.apply(this, args);
    } finally {
      this.clearRequestContext();
    }
  }
}
```bash

### 3. StatelessServiceFactory

Factory for creating and managing stateless service instances. It ensures that services are created
with the correct dependencies and configuration.

```javascript
// server/src/core/StatelessServiceFactory.js
class StatelessServiceFactory {
  static getInstance() {
    if (!StatelessServiceFactory.instance) {
      StatelessServiceFactory.instance = new StatelessServiceFactory();
    }
    return StatelessServiceFactory.instance;
  }

  // Service creation methods
}
```bash

### 4. RequestContextMiddleware

Middleware that creates and injects a request context into each request. This context is used by
stateless services to maintain request-specific information.

```javascript
// server/src/core/middleware/RequestContextMiddleware.js
function requestContextMiddleware(options = {}) {
  return (req, res, next) => {
    req.context = {
      requestId: req.headers['x-request-id'] || uuidv4(),
      // Other context properties
    };
    next();
  };
}
```bash

### 5. StatelessController

Controller base class that works with stateless services. It provides methods for executing service
methods in a stateless context.

```javascript
// server/src/core/StatelessController.js
class StatelessController extends BaseController {
  async executeServiceMethod(service, methodName, req, ...args) {
    return service.executeStateless(service[methodName], req.context, ...args);
  }
}
```bash

## Implementation Details

### Request Context

Request context is a key concept in the stateless architecture. It contains request-specific
information that would otherwise be stored as state in the service. The context includes:

- Request ID
- User ID
- Session ID
- IP address
- User agent
- Timestamp
- Request path and method

### Event-Based Communication

Services communicate with each other through events rather than direct method calls. This decouples
services and allows them to operate independently.

```javascript
// Publishing an event
this.publishEvent('supplier.created', { supplierId: '123', name: 'Acme Inc.' });

// Subscribing to an event
this.subscribeToEvent('supplier.created', (payload) => {
  // Handle event
});
```bash

### Dependency Injection

Services receive their dependencies through constructor injection, making them more testable and
configurable.

```javascript
const supplierService = new StatelessSupplierService({
  supplierRepository,
  eventEmitter,
  logger
});
```bash

## Benefits

The stateless service architecture provides several benefits:

1. __Scalability__: Services can be scaled horizontally without session affinity concerns
2. __Reliability__: No state means fewer points of failure
3. __Testability__: Services are easier to test due to dependency injection
4. __Maintainability__: Clear separation of concerns and reduced coupling
5. __Performance__: Better resource utilization and caching opportunities
6. __Deployment__: Simplified deployment and load balancing

## Usage Guidelines

### Creating a New Stateless Service

1. Create a new service class that extends `StatelessService`
2. Implement required methods
3. Register the service with `StatelessServiceFactory`

```javascript
class MyService extends StatelessService {
  async doSomething(param1, param2) {
    // Implementation
  }
}

const serviceFactory = StatelessServiceFactory.getInstance();
serviceFactory.registerServiceType('myService', MyService, { dependency1, dependency2 });
```bash

### Creating a Controller for Stateless Services

1. Create a controller class that extends `StatelessController`
2. Define route handlers using `createServiceHandler`

```javascript
class MyController extends StatelessController {
  constructor() {
    super();

    this.doSomething = this.createServiceHandler(
      'myService',
      'doSomething',
      req => [req.body.param1, req.body.param2]
    );
  }
}
```bash

### Setting Up Routes

1. Create a route file for your controller
2. Apply `requestContextMiddleware` to inject request context
3. Define routes using controller methods

```javascript
const router = express.Router();
router.use(requestContextMiddleware());
router.post('/do-something', myController.doSomething);
```bash

## Migration Strategy

To migrate existing services to the stateless architecture:

1. Identify services with internal state
2. Move state to appropriate external systems (database, cache, etc.)
3. Create new stateless service implementations
4. Update controllers to use stateless services
5. Create new routes for stateless endpoints
6. Test thoroughly
7. Gradually migrate traffic to stateless endpoints
8. Remove old stateful implementations

### Migration Checklist

- [ ] Identify all stateful services
- [ ] Design stateless alternatives
- [ ] Implement stateless services
- [ ] Update controllers
- [ ] Create new routes
- [ ] Write tests
- [ ] Deploy and monitor
- [ ] Complete migration
