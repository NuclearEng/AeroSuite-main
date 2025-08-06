# Domain Events Integration

## Overview

This document describes the implementation of domain events integration between bounded contexts in
the AeroSuite application. Domain events enable loose coupling between domains while allowing them
to react to changes in other domains.

## Architecture

The domain events integration is built on the following components:

1. __DomainEvents__: A base publisher-subscriber system for events
2. __DomainEventBus__: Extends DomainEvents with context-aware event handling
3. __Event Schemas__: Define the structure and validation rules for events
4. __Event Handlers__: React to events from other domains
5. __Event Publishers__: Publish events from a domain

```bash
+----------------+        +----------------+        +----------------+
|                |        |                |        |                |
|  Publisher     |------->|  Domain        |------->|  Subscriber    |
|  Domain        |        |  Event Bus     |        |  Domain        |
|                |        |                |        |                |
+----------------+        +----------------+        +----------------+
                                  |
                                  |
                                  v
                          +----------------+
                          |                |
                          |  Schema        |
                          |  Registry      |
                          |                |
                          +----------------+
```bash

## Implementation

### DomainEventBus

The `DomainEventBus` extends the base `DomainEvents` system with context awareness. It provides
methods for:

- Publishing events from a specific context
- Subscribing to events from a specific context
- Validating events against schemas
- Tracking subscriptions between contexts

```javascript
// Example usage
domainEventBus.publishFromContext('customer', {
  type: 'CustomerCreated',
  payload: {
    customerId: '123',
    name: 'ACME Corp'
  }
});

domainEventBus.subscribeContext(
  'customer',
  'inspection',
  'CustomerCreated',
  handleCustomerCreated
);
```bash

### Event Schemas

Each domain defines schemas for its events, which are used for validation:

```javascript
const customerEventSchemas = {
  CustomerCreated: {
    description: 'Triggered when a new customer is created',
    required: ['customerId', 'name'],
    properties: {
      customerId: { type: 'string' },
      name: { type: 'string' }
    }
  }
};
```bash

### Event Handlers

Each domain implements handlers for events from other domains:

```javascript
async function handleCustomerCreated(event) {
  const { customerId, name } = event.payload;
  // Handle the event
}
```bash

### Event Publishers

Each domain implements publishers for its events:

```javascript
function publishCustomerCreated(customer) {
  domainEventBus.publishFromContext('customer', {
    type: 'CustomerCreated',
    payload: {
      customerId: customer.id,
      name: customer.name
    }
  });
}
```bash

## Domain Integrations

### Customer → Inspection

The Customer domain publishes the following events that are consumed by the Inspection domain:

| Event | Description | Payload | Handler Action |
|-------|-------------|---------|---------------|
| CustomerCreated | Triggered when a new customer is created | customerId, name, code, type, status
| Set up default inspection templates |
| CustomerStatusUpdated | Triggered when customer status changes | customerId, status,
previousStatus | Handle scheduled inspections if customer becomes inactive |

### Inspection → Customer

The Inspection domain publishes the following events that are consumed by the Customer domain:

| Event | Description | Payload | Handler Action |
|-------|-------------|---------|---------------|
| InspectionCompleted | Triggered when an inspection is completed | inspectionId, customerId,
result, defectCount | Update customer with inspection result |
| InspectionScheduled | Triggered when an inspection is scheduled | inspectionId, customerId,
scheduledDate | Update customer with upcoming inspection |

### Supplier → Customer

The Supplier domain publishes the following events that are consumed by the Customer domain:

| Event | Description | Payload | Handler Action |
|-------|-------------|---------|---------------|
| SupplierCustomerAssociated | Triggered when a supplier is associated with a customer |
supplierId, customerId, relationshipType | Update customer with supplier association |

### Component → Inspection

The Component domain publishes the following events that are consumed by the Inspection domain:

| Event | Description | Payload | Handler Action |
|-------|-------------|---------|---------------|
| ComponentCreated | Triggered when a new component is created | componentId, name, type | Set up
default inspection templates |
| ComponentSpecificationUpdated | Triggered when component specifications change | componentId,
specificationId, changes | Update inspection criteria |

## Initialization

Domain events are initialized during application startup:

```javascript
const { DomainEventInitializer } = require('./core');

// Initialize all domain events
DomainEventInitializer.initializeDomainEvents();
```bash

## Testing

Domain events integration is tested using Jest:

```javascript
test('CustomerStatusUpdated event should be handled by inspection domain', async () => {
  // Publish event
  customerEvents.publishers.publishCustomerStatusUpdated(
    { id: 'customer-1', status: 'inactive' },
    'active'
  );

  // Assert that the handler was called
  expect(inspectionRepository.findByCustomerAndStatus)
    .toHaveBeenCalledWith('customer-1', 'scheduled');
});
```bash

## Best Practices

1. __Event Naming__: Use past tense verbs for event names (e.g., `CustomerCreated`, not
`CreateCustomer`)
2. __Payload Design__: Include only necessary data in event payloads
3. __Idempotency__: Design event handlers to be idempotent (can be processed multiple times without
side effects)
4. __Error Handling__: Handle errors in event handlers gracefully
5. __Validation__: Always validate events against schemas
6. __Logging__: Log all event publishing and handling for debugging

## Future Enhancements

1. __Event Persistence__: Store events for replay and audit
2. __Event Versioning__: Support versioning of event schemas
3. __Dead Letter Queue__: Handle failed event processing
4. __Event Sourcing__: Rebuild domain state from events
5. __External Message Broker__: Replace in-memory event bus with a message broker
