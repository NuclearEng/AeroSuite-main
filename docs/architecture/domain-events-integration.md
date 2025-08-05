# Domain Events Integration

## Overview

This document describes the implementation of domain events integration between bounded contexts in the AeroSuite application. Domain events enable loose coupling between domains while allowing them to react to changes in other domains.

## Architecture

The domain events integration is built on the following components:

1. **DomainEvents**: A base publisher-subscriber system for events
2. **DomainEventBus**: Extends DomainEvents with context-aware event handling
3. **Event Schemas**: Define the structure and validation rules for events
4. **Event Handlers**: React to events from other domains
5. **Event Publishers**: Publish events from a domain

```
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
```

## Implementation

### DomainEventBus

The `DomainEventBus` extends the base `DomainEvents` system with context awareness. It provides methods for:

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
```

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
```

### Event Handlers

Each domain implements handlers for events from other domains:

```javascript
async function handleCustomerCreated(event) {
  const { customerId, name } = event.payload;
  // Handle the event
}
```

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
```

## Domain Integrations

### Customer → Inspection

The Customer domain publishes the following events that are consumed by the Inspection domain:

| Event | Description | Payload | Handler Action |
|-------|-------------|---------|---------------|
| CustomerCreated | Triggered when a new customer is created | customerId, name, code, type, status | Set up default inspection templates |
| CustomerStatusUpdated | Triggered when customer status changes | customerId, status, previousStatus | Handle scheduled inspections if customer becomes inactive |

### Inspection → Customer

The Inspection domain publishes the following events that are consumed by the Customer domain:

| Event | Description | Payload | Handler Action |
|-------|-------------|---------|---------------|
| InspectionCompleted | Triggered when an inspection is completed | inspectionId, customerId, result, defectCount | Update customer with inspection result |
| InspectionScheduled | Triggered when an inspection is scheduled | inspectionId, customerId, scheduledDate | Update customer with upcoming inspection |

### Supplier → Customer

The Supplier domain publishes the following events that are consumed by the Customer domain:

| Event | Description | Payload | Handler Action |
|-------|-------------|---------|---------------|
| SupplierCustomerAssociated | Triggered when a supplier is associated with a customer | supplierId, customerId, relationshipType | Update customer with supplier association |

### Component → Inspection

The Component domain publishes the following events that are consumed by the Inspection domain:

| Event | Description | Payload | Handler Action |
|-------|-------------|---------|---------------|
| ComponentCreated | Triggered when a new component is created | componentId, name, type | Set up default inspection templates |
| ComponentSpecificationUpdated | Triggered when component specifications change | componentId, specificationId, changes | Update inspection criteria |

## Initialization

Domain events are initialized during application startup:

```javascript
const { DomainEventInitializer } = require('./core');

// Initialize all domain events
DomainEventInitializer.initializeDomainEvents();
```

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
```

## Best Practices

1. **Event Naming**: Use past tense verbs for event names (e.g., `CustomerCreated`, not `CreateCustomer`)
2. **Payload Design**: Include only necessary data in event payloads
3. **Idempotency**: Design event handlers to be idempotent (can be processed multiple times without side effects)
4. **Error Handling**: Handle errors in event handlers gracefully
5. **Validation**: Always validate events against schemas
6. **Logging**: Log all event publishing and handling for debugging

## Future Enhancements

1. **Event Persistence**: Store events for replay and audit
2. **Event Versioning**: Support versioning of event schemas
3. **Dead Letter Queue**: Handle failed event processing
4. **Event Sourcing**: Rebuild domain state from events
5. **External Message Broker**: Replace in-memory event bus with a message broker 