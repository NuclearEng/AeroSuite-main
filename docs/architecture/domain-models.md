# Domain Models

## Supplier
- id, name, email, phone, address, qualifications, contacts

## Customer
- id, name, email, phone, address, contacts

## Inspection
- id, type, scheduledDate, customerId, supplierId, findings, status

## Component
- id, name, partNumber, category, supplierId, stockQuantity, documents

```mermaid
classDiagram
  class Supplier {
    id
    name
    email
    phone
    address
    qualifications
    contacts
  }
  class Customer {
    id
    name
    email
    phone
    address
    contacts
  }
  class Inspection {
    id
    type
    scheduledDate
    customerId
    supplierId
    findings
    status
  }
  class Component {
    id
    name
    partNumber
    category
    supplierId
    stockQuantity
    documents
  }
  Supplier <|-- Inspection
  Customer <|-- Inspection
  Supplier <|-- Component
```

See code for full field definitions and validation. 
