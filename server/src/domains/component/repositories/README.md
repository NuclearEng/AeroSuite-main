# ComponentRepository

## Overview
The `ComponentRepository` implements best-in-class patterns for data access in the Component domain, including:
- Multi-level caching (memory/Redis) for read-heavy operations
- Query time logging and projection support for performance
- Comprehensive Jest unit tests
- Consistent error and observability logging

## Features
- **Caching:**
  - `findById` and `findByName` use multi-level cache (TTL: 5 min)
  - Cache is invalidated on `save` and `delete`
  - Namespaced cache keys: `component:{id}`, `component:name:{name}`
- **Performance:**
  - Query time logging for `findById` and `findAll`
  - Projection support in `findAll` for efficient data retrieval
  - Pagination and sorting supported
- **Testing:**
  - Jest unit tests cover all CRUD, query, and edge cases
  - Caching logic is tested (cache hit, miss, invalidation)
- **Observability:**
  - All errors and slow queries are logged via the centralized logger

## Usage
```js
const repo = require('./componentRepository');
const component = await repo.findById('abc123');
const components = await repo.findAll({ status: 'active' }, { limit: 10, projection: { name: 1 } });
```

## Extending
- To add new query methods, follow the same caching and logging patterns.
- For cache metrics, extend `CacheManager` to track hit/miss rates.

## Testing
Run all repository tests:
```sh
npm test server/src/domains/component/repositories/__tests__
``` 