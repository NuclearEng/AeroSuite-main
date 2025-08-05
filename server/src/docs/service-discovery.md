# Service Discovery for Microservices

This document describes the service discovery system implemented for AeroSuite microservices architecture.

## Overview

The service discovery system provides a way for microservices to register themselves and discover other services in the system. It supports:

- Service registration and deregistration
- Service discovery by name, metadata, and other criteria
- Health monitoring via heartbeats
- Load balancing across service instances
- Storage adapters for different persistence mechanisms
- Event-based notifications for service status changes

## Architecture

The service discovery system consists of the following components:

1. **ServiceDiscovery**: Core service discovery functionality
2. **ServiceDiscoveryClient**: Client for interacting with the service discovery system
3. **StorageAdapter**: Interface for service registry persistence
   - **InMemoryStorageAdapter**: In-memory implementation (non-persistent)
   - **RedisStorageAdapter**: Redis-based implementation
   - **MongoStorageAdapter**: MongoDB-based implementation

## Usage

### Basic Setup

```javascript
const { 
  ServiceDiscovery, 
  ServiceDiscoveryClient, 
  InMemoryStorageAdapter 
} = require('../core/discovery');

// Create storage adapter
const storageAdapter = new InMemoryStorageAdapter();

// Create service discovery instance
const discovery = ServiceDiscovery.getInstance({
  storage: storageAdapter,
  heartbeatInterval: 30000,  // 30 seconds
  timeoutThreshold: 90000    // 90 seconds
});

// Start the service discovery system
await discovery.start();
```

### Registering a Service

```javascript
// Create a client for the service
const serviceClient = new ServiceDiscoveryClient({
  discovery,
  serviceInfo: {
    name: 'my-service',
    version: '1.0.0',
    host: 'localhost',
    port: 5001,
    protocol: 'http',
    metadata: {
      type: 'api',
      capabilities: ['users', 'auth']
    }
  }
});

// Register the service
const serviceId = await serviceClient.register();
console.log(`Service registered with ID: ${serviceId}`);
```

### Discovering Services

```javascript
// Discover all services
const allServices = await discovery.discoverServices();

// Discover services by name
const authServices = await discovery.discoverServices('auth-service');

// Discover services by metadata
const apiServices = await discovery.discoverServices(null, {
  metadata: { type: 'api' }
});

// Discover services by name and metadata
const userApiServices = await discovery.discoverServices('user-service', {
  metadata: { type: 'api' }
});
```

### Using Load Balancing

```javascript
// Create a client for consuming services
const client = new ServiceDiscoveryClient({ discovery });

// Get a service instance using round-robin load balancing (default)
const service = await client.getServiceInstance('user-service');

// Get a service instance using random load balancing
const service = await client.getServiceInstance('user-service', {
  strategy: 'random'
});

// Get a service URL with load balancing
const serviceUrl = await client.getServiceUrl('user-service', '/api/v1/users');
```

### Filtering Services

```javascript
// Filter services by metadata
const service = await client.getServiceInstance('api-service', {
  filter: {
    metadata: { region: 'us-east' }
  }
});

// Filter services by version
const service = await client.getServiceInstance('api-service', {
  filter: {
    version: '2.0.0'
  }
});
```

### Updating Service Metadata

```javascript
// Update service metadata
await serviceClient.updateMetadata({
  status: 'ready',
  capabilities: ['users', 'auth', 'admin']
});
```

### Deregistering a Service

```javascript
// Deregister the service
await serviceClient.deregister();
```

### Subscribing to Events

```javascript
// Subscribe to service registration events
discovery.on('service:registered', (service) => {
  console.log(`Service registered: ${service.name} (${service.id})`);
});

// Subscribe to service deregistration events
discovery.on('service:deregistered', (service) => {
  console.log(`Service deregistered: ${service.name} (${service.id})`);
});

// Subscribe to service status change events
discovery.on('service:up', (service) => {
  console.log(`Service is up: ${service.name} (${service.id})`);
});

discovery.on('service:down', (service) => {
  console.log(`Service is down: ${service.name} (${service.id})`);
});
```

## Storage Adapters

### In-Memory Storage Adapter

```javascript
const { InMemoryStorageAdapter } = require('../core/discovery');

const storage = new InMemoryStorageAdapter();
```

### Redis Storage Adapter

```javascript
const { RedisStorageAdapter } = require('../core/discovery');
const Redis = require('ioredis');

const redisClient = new Redis({
  host: 'localhost',
  port: 6379
});

const storage = new RedisStorageAdapter({
  client: redisClient,
  keyPrefix: 'aerosuite:service-discovery:'
});
```

### MongoDB Storage Adapter

```javascript
const { MongoStorageAdapter } = require('../core/discovery');
const { MongoClient } = require('mongodb');

const mongoClient = new MongoClient('mongodb://localhost:27017');
await mongoClient.connect();
const db = mongoClient.db('aerosuite');

const storage = new MongoStorageAdapter({
  db,
  collection: 'services'
});

// Initialize indexes
await storage.initialize();
```

## Service Information

When registering a service, the following information can be provided:

- **name**: Name of the service (required)
- **version**: Version of the service (default: '1.0.0')
- **host**: Host of the service (default: hostname of the machine)
- **port**: Port of the service
- **protocol**: Protocol of the service (default: 'http')
- **metadata**: Additional metadata for the service

## Events

The service discovery system emits the following events:

- **service:registered**: When a service is registered
- **service:deregistered**: When a service is deregistered
- **service:updated**: When a service is updated
- **service:up**: When a service changes status to 'up'
- **service:down**: When a service changes status to 'down'
- **discovery:started**: When the discovery system is started
- **discovery:stopped**: When the discovery system is stopped

## Best Practices

1. **Use persistent storage in production**: Use Redis or MongoDB storage adapters in production environments for persistence and distributed access.

2. **Register on startup, deregister on shutdown**: Services should register themselves on startup and deregister on shutdown to maintain an accurate service registry.

3. **Include relevant metadata**: Include metadata that can be used for filtering and service selection, such as region, capabilities, or instance type.

4. **Use health monitoring**: Configure appropriate heartbeat intervals and timeout thresholds based on your infrastructure and requirements.

5. **Handle service unavailability**: Implement circuit breakers and fallback mechanisms when services are unavailable.

6. **Use load balancing**: Utilize the built-in load balancing capabilities for distributing requests across service instances.

7. **Monitor service discovery events**: Subscribe to service discovery events for monitoring and logging purposes.

## Integration with Service Interfaces

The service discovery system integrates with the existing service interface system (RF022) to provide a complete service management solution:

```javascript
const { ServiceDiscoveryClient } = require('../core/discovery');
const ServiceProvider = require('../core/interfaces/ServiceProvider');

// Get a service implementation through the service provider
const supplierService = ServiceProvider.getSupplierService();

// Use service discovery to find and call external services
const discoveryClient = new ServiceDiscoveryClient();
const notificationServiceUrl = await discoveryClient.getServiceUrl('notification-service');

// Make API calls to the discovered service
const response = await fetch(`${notificationServiceUrl}/api/v1/notifications`, {
  method: 'POST',
  body: JSON.stringify({ message: 'Hello from supplier service!' })
});
```

## Conclusion

The service discovery system provides a robust foundation for building and scaling microservices in the AeroSuite application. It enables services to dynamically discover and communicate with each other, supporting the evolution of the application architecture over time. 
