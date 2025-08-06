# Domain Events for Cross-Domain Communication

## Introduction

This document defines the domain events used for communication between different bounded contexts
in the AeroSuite application. Domain events represent significant occurrences within a domain that
other domains might be interested in. They enable loose coupling between domains while allowing for
necessary integration.

## Event Structure

All domain events follow this standard structure:

```json
{
  "type": "EventName",
  "id": "unique-event-id",
  "timestamp": "2023-06-15T14:30:00Z",
  "source": "domain-name",
  "payload": {
    // Event-specific data
  }
}
```bash

## Supplier Domain Events

### SupplierCreated

Emitted when a new supplier is created in the system.

```json
{
  "type": "SupplierCreated",
  "payload": {
    "supplierId": "supplier-123",
    "name": "Acme Components",
    "category": "hardware",
    "status": "active"
  }
}
```bash

__Consumers__:
- Component Domain: To associate components with the new supplier
- Inspection Domain: To schedule initial supplier audits
- Notification Domain: To notify relevant users

### SupplierStatusChanged

Emitted when a supplier's status changes.

```json
{
  "type": "SupplierStatusChanged",
  "payload": {
    "supplierId": "supplier-123",
    "previousStatus": "active",
    "newStatus": "suspended",
    "reason": "Failed quality audit"
  }
}
```bash

__Consumers__:
- Component Domain: To update component sourcing status
- Inspection Domain: To schedule follow-up inspections
- Notification Domain: To notify relevant users

### SupplierQualificationAdded

Emitted when a supplier receives a new qualification.

```json
{
  "type": "SupplierQualificationAdded",
  "payload": {
    "supplierId": "supplier-123",
    "qualificationId": "qual-456",
    "qualificationType": "ISO9001",
    "expirationDate": "2024-12-31T23:59:59Z"
  }
}
```bash

__Consumers__:
- Component Domain: To update component qualification requirements
- Notification Domain: To notify relevant users

### SupplierPerformanceUpdated

Emitted when a supplier's performance metrics are updated.

```json
{
  "type": "SupplierPerformanceUpdated",
  "payload": {
    "supplierId": "supplier-123",
    "metrics": {
      "qualityScore": 95,
      "deliveryScore": 87,
      "responseTimeScore": 92
    },
    "period": "2023-Q2"
  }
}
```bash

__Consumers__:
- Reporting Domain: To update dashboards and reports
- Notification Domain: To trigger alerts for significant changes

## Customer Domain Events

### CustomerCreated

Emitted when a new customer is created in the system.

```json
{
  "type": "CustomerCreated",
  "payload": {
    "customerId": "customer-123",
    "name": "Skyway Airlines",
    "segment": "aerospace",
    "status": "active"
  }
}
```bash

__Consumers__:
- Inspection Domain: To associate inspections with the customer
- Notification Domain: To notify relevant users

### CustomerStatusChanged

Emitted when a customer's status changes.

```json
{
  "type": "CustomerStatusChanged",
  "payload": {
    "customerId": "customer-123",
    "previousStatus": "active",
    "newStatus": "inactive",
    "reason": "Contract ended"
  }
}
```bash

__Consumers__:
- Inspection Domain: To update inspection schedules
- Notification Domain: To notify relevant users

### CustomerActivityRecorded

Emitted when significant customer activity occurs.

```json
{
  "type": "CustomerActivityRecorded",
  "payload": {
    "customerId": "customer-123",
    "activityId": "activity-789",
    "activityType": "meeting",
    "description": "Quarterly review meeting",
    "date": "2023-06-15T14:30:00Z"
  }
}
```bash

__Consumers__:
- Reporting Domain: To update customer engagement metrics
- Notification Domain: To notify account managers

## Inspection Domain Events

### InspectionCreated

Emitted when a new inspection is created.

```json
{
  "type": "InspectionCreated",
  "payload": {
    "inspectionId": "insp-123",
    "type": "incoming",
    "supplierId": "supplier-123",
    "componentId": "comp-456",
    "scheduledDate": "2023-06-20T10:00:00Z"
  }
}
```bash

__Consumers__:
- Supplier Domain: To track inspection activities
- Component Domain: To associate with component history
- Notification Domain: To notify inspectors and suppliers

### InspectionCompleted

Emitted when an inspection is completed.

```json
{
  "type": "InspectionCompleted",
  "payload": {
    "inspectionId": "insp-123",
    "result": "passed",
    "completedDate": "2023-06-20T11:30:00Z",
    "inspectorId": "user-789",
    "summary": "All items passed inspection"
  }
}
```bash

__Consumers__:
- Supplier Domain: To update supplier performance metrics
- Component Domain: To update component status
- Reporting Domain: To update quality metrics
- Notification Domain: To notify relevant users

### DefectRecorded

Emitted when a defect is found during an inspection.

```json
{
  "type": "DefectRecorded",
  "payload": {
    "defectId": "defect-123",
    "inspectionId": "insp-123",
    "componentId": "comp-456",
    "supplierId": "supplier-123",
    "severity": "major",
    "description": "Surface finish does not meet requirements",
    "recordedDate": "2023-06-20T10:45:00Z"
  }
}
```bash

__Consumers__:
- Supplier Domain: To update supplier quality metrics
- Component Domain: To update component quality history
- Reporting Domain: To update defect metrics
- Notification Domain: To notify quality team and supplier

### DefectResolved

Emitted when a defect is resolved.

```json
{
  "type": "DefectResolved",
  "payload": {
    "defectId": "defect-123",
    "resolution": "rework",
    "resolvedDate": "2023-06-25T14:20:00Z",
    "verifiedBy": "user-456",
    "notes": "Component reworked to meet surface finish requirements"
  }
}
```bash

__Consumers__:
- Supplier Domain: To update supplier performance metrics
- Component Domain: To update component status
- Reporting Domain: To update resolution metrics
- Notification Domain: To notify relevant users

## Component Domain Events

### ComponentCreated

Emitted when a new component is created.

```json
{
  "type": "ComponentCreated",
  "payload": {
    "componentId": "comp-123",
    "name": "Hydraulic Pump",
    "code": "HYD-PUMP-001",
    "category": "hydraulics",
    "supplierId": "supplier-456"
  }
}
```bash

__Consumers__:
- Supplier Domain: To associate with supplier catalog
- Inspection Domain: To create inspection templates
- Notification Domain: To notify engineering team

### ComponentStatusUpdated

Emitted when a component's status changes.

```json
{
  "type": "ComponentStatusUpdated",
  "payload": {
    "componentId": "comp-123",
    "previousStatus": "active",
    "status": "obsolete",
    "reason": "Replaced by newer model"
  }
}
```bash

__Consumers__:
- Supplier Domain: To update supplier catalog
- Inspection Domain: To update inspection requirements
- Notification Domain: To notify engineering and procurement teams

### ComponentSpecificationAdded

Emitted when a specification is added to a component.

```json
{
  "type": "ComponentSpecificationAdded",
  "payload": {
    "componentId": "comp-123",
    "specificationId": "spec-456",
    "name": "Max Pressure",
    "value": 5000,
    "unit": "psi",
    "tolerance": 100
  }
}
```bash

__Consumers__:
- Inspection Domain: To update inspection criteria
- Notification Domain: To notify engineering team

### RevisionCreated

Emitted when a new component revision is created.

```json
{
  "type": "RevisionCreated",
  "payload": {
    "componentId": "comp-123",
    "revisionId": "rev-456",
    "version": "2.0.0",
    "description": "Updated hydraulic fittings",
    "author": "user-789",
    "status": "draft"
  }
}
```bash

__Consumers__:
- Supplier Domain: To update manufacturing requirements
- Inspection Domain: To update inspection criteria
- Notification Domain: To notify engineering and procurement teams

## User Domain Events

### UserCreated

Emitted when a new user is created.

```json
{
  "type": "UserCreated",
  "payload": {
    "userId": "user-123",
    "email": "john.doe@example.com",
    "roles": ["inspector", "engineer"]
  }
}
```bash

__Consumers__:
- Notification Domain: To set up notification preferences
- All domains: To update access control

### UserRoleChanged

Emitted when a user's roles change.

```json
{
  "type": "UserRoleChanged",
  "payload": {
    "userId": "user-123",
    "previousRoles": ["inspector", "engineer"],
    "newRoles": ["inspector", "manager"]
  }
}
```bash

__Consumers__:
- All domains: To update access control
- Notification Domain: To update notification routing

## Notification Domain Events

### NotificationSent

Emitted when a notification is sent.

```json
{
  "type": "NotificationSent",
  "payload": {
    "notificationId": "notif-123",
    "userId": "user-456",
    "channels": ["email", "in-app"],
    "type": "alert",
    "subject": "Critical defect found",
    "sentAt": "2023-06-15T14:35:00Z"
  }
}
```bash

__Consumers__:
- Reporting Domain: To track notification metrics

### NotificationRead

Emitted when a notification is read by a user.

```json
{
  "type": "NotificationRead",
  "payload": {
    "notificationId": "notif-123",
    "userId": "user-456",
    "readAt": "2023-06-15T15:10:00Z"
  }
}
```bash

__Consumers__:
- Reporting Domain: To track user engagement

## Event Handling Guidelines

1. __Idempotency__: Event handlers should be idempotent to handle potential duplicate events.

2. __Failure Handling__: Event handlers should gracefully handle failures and provide appropriate
error logging.

3. __Event Versioning__: As events evolve, maintain backward compatibility or implement versioning.

4. __Event Ordering__: Do not assume events will arrive in a specific order. Design handlers to
work with events arriving in any order.

5. __Event Ownership__: Each domain owns the definition of its events. Other domains should not
emit events on behalf of another domain.

## Implementation Considerations

1. __Event Bus__: Use a reliable event bus or message broker for event distribution.

2. __Event Store__: Consider implementing an event store for event sourcing and audit purposes.

3. __Event Schemas__: Maintain formal schemas for all events to ensure consistency.

4. __Monitoring__: Implement monitoring for event processing to detect failures or delays.

5. __Testing__: Create comprehensive tests for event producers and consumers.

## Event Evolution Strategy

As the system evolves, events will need to change. Follow these guidelines:

1. __Backward Compatibility__: Whenever possible, make changes backward compatible.

2. __Versioning__: When backward compatibility isn't possible, version the events.

3. __Deprecation Process__: Clearly communicate deprecated events and provide migration paths.

4. __Documentation__: Keep this document updated with all event changes.
