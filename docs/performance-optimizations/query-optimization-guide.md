# Query Optimization Guide

This document outlines the query optimization strategies implemented as part of RF031 in the
AeroSuite project.

## Overview

Database query optimization is critical for application performance, especially as data volumes
grow. This guide explains the query optimization techniques implemented in AeroSuite and provides
best practices for writing efficient queries.

## Key Optimization Strategies

### 1. Query Analysis and Monitoring

The AeroSuite platform includes a query analysis system that:

- Monitors slow queries (execution time > 100ms)
- Analyzes query patterns to identify optimization opportunities
- Generates reports with specific recommendations
- Tracks index usage to identify unused or underused indexes

### 2. Projection Optimization

Projection limits the fields returned by a query, reducing network transfer and memory usage:

```javascript
// Unoptimized: Returns all fields
const supplier = await Supplier.findById(id);

// Optimized: Returns only needed fields
const supplier = await QueryOptimizer.optimizedFindById(Supplier, id,
  ['name', 'code', 'status', 'type', 'address']);
```bash

### 3. Pagination

All list queries should implement pagination to limit the result set size:

```javascript
// Unoptimized: May return too many documents
const suppliers = await Supplier.find({ status: 'active' });

// Optimized: Uses pagination
const suppliers = await QueryOptimizer.optimizedFind(
  Supplier,
  { status: 'active' },
  { skip: 0, limit: 50, sort: { createdAt: -1 } }
);
```bash

### 4. Index Utilization

Queries should be designed to utilize existing indexes:

```javascript
// Inefficient: Doesn't use indexes effectively
const suppliers = await Supplier.find({
  $or: [
    { name: { $regex: 'Air', $options: 'i' } },
    { description: { $regex: 'Air', $options: 'i' } }
  ]
});

// Efficient: Uses text index
const suppliers = await Supplier.find({
  $text: { $search: 'Air' }
});
```bash

### 5. Aggregation Pipeline Optimization

For complex data transformations, optimize aggregation pipelines:

```javascript
// Unoptimized pipeline
const pipeline = [
  { $project: { name: 1, status: 1, type: 1 } },
  { $match: { status: 'active' } },
  { $sort: { name: 1 } }
];

// Optimized pipeline (match first, then project)
const optimizedPipeline = [
  { $match: { status: 'active' } },
  { $project: { name: 1, status: 1, type: 1 } },
  { $sort: { name: 1 } },
  { $limit: 1000 }
];

const results = await QueryOptimizer.optimizedAggregate(Supplier, optimizedPipeline);
```bash

## The QueryOptimizer Utility

AeroSuite includes a `QueryOptimizer` utility class with methods for optimizing common query
patterns:

### Key Methods

- `optimizedFind`: Optimized version of `Model.find()`
- `optimizedFindOne`: Optimized version of `Model.findOne()`
- `optimizedFindById`: Optimized version of `Model.findById()`
- `optimizedCount`: Optimized version of `Model.countDocuments()`
- `optimizedAggregate`: Optimized version of `Model.aggregate()`
- `explainQuery`: Analyzes query execution plan
- `getSuggestedIndexes`: Suggests indexes for a query

### Usage Example

```javascript
const QueryOptimizer = require('../utils/QueryOptimizer');
const Supplier = require('../models/supplier.model');

async function getActiveSuppliers(page = 1, limit = 50) {
  // Optimize the query
  return await QueryOptimizer.optimizedFind(
    Supplier,
    { status: 'active' },
    {
      skip: (page - 1) * limit,
      limit,
      sort: { name: 1 }
    },
    ['name', 'code', 'type', 'address.country'] // Projection
  );
}
```bash

## Query Anti-Patterns to Avoid

### 1. Unbounded Queries

❌ __Bad__:
```javascript
const allSuppliers = await Supplier.find({});
```bash

✅ __Good__:
```javascript
const suppliers = await QueryOptimizer.optimizedFind(
  Supplier,
  {},
  { limit: 50, skip: 0 }
);
```bash

### 2. Inefficient Regex Queries

❌ __Bad__:
```javascript
const suppliers = await Supplier.find({
  name: { $regex: '^Air' }
});
```bash

✅ __Good__:
```javascript
// For prefix queries, use standard comparison operators
const suppliers = await Supplier.find({
  name: { $gte: 'Air', $lt: 'Ais' }
});

// For full-text search, use text indexes
const suppliers = await Supplier.find({
  $text: { $search: 'Air' }
});
```bash

### 3. Overusing $or and $in with Large Arrays

❌ __Bad__:
```javascript
const suppliers = await Supplier.find({
  $or: [
    { id: '123' },
    { id: '456' },
    { id: '789' },
    // ... hundreds more
  ]
});
```bash

✅ __Good__:
```javascript
// Use $in for ID lookups
const suppliers = await Supplier.find({
  id: { $in: ['123', '456', '789', /_ ... _/] }
});

// For very large sets, use batching
const allResults = [];
const idBatches = chunk(ids, 100);
for (const batch of idBatches) {
  const results = await Supplier.find({ id: { $in: batch } });
  allResults.push(...results);
}
```bash

### 4. Neglecting Compound Indexes for Common Query Patterns

❌ __Bad__:
```javascript
// Single indexes on customerId and status
const inspections = await Inspection.find({
  customerId: '123',
  status: 'pending'
});
```bash

✅ __Good__:
```javascript
// Using a compound index on { customerId: 1, status: 1 }
const inspections = await Inspection.find({
  customerId: '123',
  status: 'pending'
});
```bash

## Query Optimization Analysis Tool

AeroSuite includes a query optimization analysis tool that:

1. Analyzes slow queries from the MongoDB profiler
2. Checks index usage statistics
3. Generates recommendations for new indexes
4. Identifies unused indexes
5. Suggests query optimizations

### Running the Tool

```bash
./scripts/optimize-queries.sh
```bash

The tool generates a report in both JSON and HTML formats in the `reports` directory.

## Best Practices for Query Optimization

1. __Always use pagination__ for list queries
2. __Include only needed fields__ using projection
3. __Design queries to use existing indexes__
4. __Create indexes for common query patterns__
5. __Monitor slow queries__ regularly
6. __Use text indexes__ for text search operations
7. __Avoid negation operators__ (`$ne`, `$nin`) when possible
8. __Use the QueryOptimizer utility__ for common query patterns
9. __Order aggregation pipeline stages__ for optimal performance (filter early, project early)
10. __Analyze query performance__ with `explain()` for complex queries

## Conclusion

Query optimization is an ongoing process that should adapt to changing data patterns and
application usage. By following the principles outlined in this guide and regularly analyzing query
performance, we can ensure that AeroSuite's database operations remain efficient as the application
grows.

Remember that each optimization comes with trade-offs. For example, adding indexes improves read
performance but can slow down writes. Always measure the impact of optimizations in your specific
use case.
