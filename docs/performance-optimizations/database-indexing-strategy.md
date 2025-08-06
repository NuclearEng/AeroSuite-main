# Database Indexing Strategy

This document outlines the database indexing strategy implemented as part of RF030 in the AeroSuite
project.

## Overview

Indexes are critical for database performance, especially for large datasets. They improve query
performance by allowing the database to find data without scanning entire collections. However,
indexes also come with costs: they increase storage requirements and can slow down write
operations. This document describes our approach to database indexing in the AeroSuite application.

## Indexing Principles

Our indexing strategy follows these core principles:

1. __Index fields used in query filters__: Fields frequently used in query conditions should be
indexed.
2. __Index fields used for sorting__: Fields used in sort operations should be indexed.
3. __Create compound indexes for common query patterns__: When queries filter on multiple fields
together, create compound indexes.
4. __Use text indexes for search functionality__: For text search operations, create text indexes
with appropriate weights.
5. __Avoid over-indexing__: Each index adds overhead to write operations and storage requirements.
6. __Monitor index usage__: Regularly review index usage to identify unused or underused indexes.
7. __Use background indexing__: Create indexes in the background to avoid blocking database
operations.

## Index Types Used

### Single Field Indexes

Single field indexes are used for fields that are frequently queried or sorted individually:

```javascript
// Example: Index on status field
collection.createIndex({ status: 1 }, { background: true });
```bash

### Compound Indexes

Compound indexes are used for queries that filter or sort on multiple fields:

```javascript
// Example: Index on customerId and status fields
collection.createIndex({ customerId: 1, status: 1 }, { background: true });
```bash

### Text Indexes

Text indexes are used for full-text search functionality with weighted fields:

```javascript
// Example: Text index on name, description, and tags fields
collection.createIndex(
  { name: 'text', description: 'text', tags: 'text' },
  { weights: { name: 10, description: 5, tags: 3 }, background: true }
);
```bash

### Unique Indexes

Unique indexes are used to enforce uniqueness constraints:

```javascript
// Example: Unique index on email field
collection.createIndex({ email: 1 }, { unique: true, background: true });
```bash

## Collection-Specific Indexing Strategy

### Supplier Collection

| Field | Index Type | Justification |
|-------|------------|---------------|
| `name` | Unique | Ensure supplier names are unique and enable fast lookups |
| `code` | Unique | Ensure supplier codes are unique and enable fast lookups |
| `status` | Single | Frequently filtered by status (active, inactive, etc.) |
| `type` | Single | Filtered by supplier type |
| `address.country` | Single | Support geographical queries |
| `overallRating` | Single (-1) | Support sorting by rating (descending) |
| `createdAt` | Single (-1) | Support chronological sorting |
| `name`, `description`, `tags` | Text (weighted) | Support full-text search with appropriate
weights |

### Customer Collection

| Field | Index Type | Justification |
|-------|------------|---------------|
| `name` | Unique | Ensure customer names are unique and enable fast lookups |
| `code` | Unique | Ensure customer codes are unique and enable fast lookups |
| `status` | Single | Frequently filtered by status |
| `industry` | Single | Filtered by industry |
| `serviceLevel` | Single | Filtered by service level |
| `billingAddress.country` | Single | Support geographical queries |
| `createdAt` | Single (-1) | Support chronological sorting |
| `name`, `description` | Text (weighted) | Support full-text search with appropriate weights |

### Inspection Collection

| Field | Index Type | Justification |
|-------|------------|---------------|
| `inspectionNumber` | Unique | Ensure inspection numbers are unique and enable fast lookups |
| `customerId`, `status` | Compound | Common query pattern: inspections for a customer with a
specific status |
| `supplierId`, `status` | Compound | Common query pattern: inspections for a supplier with a
specific status |
| `componentId` | Single | Filtered by component |
| `scheduledDate` | Single | Filtered and sorted by scheduled date |
| `startDate` | Single | Filtered and sorted by start date |
| `completionDate` | Single | Filtered and sorted by completion date |
| `status` | Single | Frequently filtered by status |
| `result`, `status` | Compound | Common query pattern: inspections with a specific result and
status |
| `inspectionType`, `status` | Compound | Common query pattern: inspections of a specific type and
status |
| `customerId`, `supplierId`, `status` | Compound | Complex filtering pattern |
| `createdAt` | Single (-1) | Support chronological sorting |
| `inspectionNumber`, `title`, `description`, `tags` | Text (weighted) | Support full-text search
with appropriate weights |

### Component Collection

| Field | Index Type | Justification |
|-------|------------|---------------|
| `partNumber` | Unique | Ensure part numbers are unique and enable fast lookups |
| `partNumber`, `revision` | Compound | Common query pattern: specific part number and revision |
| `customerId` | Single | Filtered by customer |
| `supplierId` | Single | Filtered by supplier |
| `customerId`, `supplierId` | Compound | Common query pattern: components for a specific customer
and supplier |
| `status` | Single | Frequently filtered by status |
| `materialInfo.material` | Single | Material-based queries |
| `createdAt` | Single (-1) | Support chronological sorting |
| `name`, `partNumber`, `description`, `tags` | Text (weighted) | Support full-text search with
appropriate weights |

### User Collection

| Field | Index Type | Justification |
|-------|------------|---------------|
| `email` | Unique | Ensure email addresses are unique and enable fast lookups |
| `role`, `isActive` | Compound | Common query pattern: active users with a specific role |
| `customerId`, `role` | Compound | Common query pattern: users for a specific customer with a
specific role |
| `lastLogin` | Single (-1) | Sort by last login time |
| `createdAt` | Single (-1) | Support chronological sorting |
| `permissions.role` | Single | Filter by permission role |

## Implementation

The indexes are implemented in two ways:

1. __Schema-level indexes__: Defined in the Mongoose schema for each model.
2. __Script-based indexes__: Added using the `add-missing-indexes.js` script.

### Schema-level indexes example:

```javascript
// Supplier model
supplierSchema.index({ status: 1 });
supplierSchema.index({ type: 1 });
supplierSchema.index({ 'address.country': 1 });
supplierSchema.index({ overallRating: -1 });
supplierSchema.index({ createdAt: -1 });

// Text index with weights
supplierSchema.index(
  { name: 'text', description: 'text', tags: 'text' },
  { weights: { name: 10, description: 5, tags: 3 } }
);
```bash

### Script-based indexes:

The `add-missing-indexes.js` script:
1. Connects to the database
2. For each collection:
   - Gets existing indexes
   - Defines required indexes based on the collection
   - Creates missing indexes in the background
3. Generates a report of added and skipped indexes

## Monitoring and Maintenance

To ensure optimal index performance:

1. __Regular monitoring__: Use the MongoDB profiler to identify slow queries.
2. __Index usage analysis__: Analyze index usage statistics to identify unused indexes.
3. __Index optimization__: Periodically review and optimize indexes based on changing query
patterns.

### Monitoring commands:

```javascript
// Get index usage statistics
db.collection.aggregate([{ $indexStats: {} }])

// Get index size
db.collection.stats().indexSizes

// Identify slow queries
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find({ millis: { $gt: 100 } })
```bash

## Running the Index Addition Script

To add missing indexes to the database:

```bash
./scripts/add-missing-indexes.sh
```bash

This script:
1. Connects to the database
2. Identifies missing indexes
3. Creates the missing indexes in the background
4. Generates a report in the `reports` directory

## Conclusion

A well-designed indexing strategy is crucial for database performance. By following the principles
outlined in this document and regularly monitoring index usage, we can ensure that our database
operations remain efficient as the application grows.

Remember that indexing is not a one-time task but an ongoing process that should adapt to changing
query patterns and data growth.
