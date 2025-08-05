# Multi-Level Caching Strategy

This document describes the multi-level caching strategy implemented for the AeroSuite application.

## Overview

The multi-level caching strategy provides a way to cache data at multiple levels with different characteristics:

1. **Memory Cache (Level 1)**: Fast in-memory caching with limited capacity
2. **Redis Cache (Level 2)**: Distributed caching with moderate capacity and persistence
3. **Database Cache (Level 3)**: Long-term persistent caching with high capacity

The system automatically propagates data between cache levels and provides configurable policies for different types of data.

## Architecture

The caching system consists of the following components:

1. **CacheManager**: Core component that manages multiple cache providers
2. **CacheProvider**: Interface for cache providers
   - **MemoryCacheProvider**: In-memory implementation using LRU cache
   - **RedisCacheProvider**: Redis-based implementation
   - **DatabaseCacheProvider**: Database-based implementation
3. **CachePolicies**: Predefined cache policies for different data types

## Cache Flow

When retrieving data from the cache:

1. First, check the Memory Cache (fastest)
2. If not found, check the Redis Cache (moderate speed)
3. If not found, check the Database Cache (slowest)
4. If not found in any cache, fetch from the original data source
5. Store the fetched data in all cache levels
6. Return the data to the caller

When a value is found in a lower-level cache (e.g., Redis), it is automatically propagated to higher-level caches (e.g., Memory) for faster access in future requests.

## Cache Policies

Cache policies define how data is cached and when it is considered stale. The system provides several predefined policies:

- **DEFAULT**: Basic caching with 1-hour TTL
- **STATIC**: Long-lived cache (24 hours) for rarely changing data
- **DYNAMIC**: Short-lived cache (5 minutes) for frequently changing data
- **USER**: Medium-lived cache (30 minutes) for user-specific data
- **API**: Short-lived cache (10 minutes) for external API responses
- **MICRO**: Very short-lived cache (10 seconds) to prevent thundering herd
- **REPORT**: Medium-lived cache (1 hour) for expensive report data

Each policy configures:
- **TTL**: Time-to-live in seconds
- **staleWhileRevalidate**: Whether to return stale data while refreshing
- **staleIfError**: Whether to return stale data on refresh errors
- **backgroundRefresh**: Whether to refresh data in the background

## Usage

### Basic Setup

```javascript
const { createDefaultCacheManager, CachePolicies } = require('../infrastructure/caching');

// Create cache manager with default configuration
const cacheManager = createDefaultCacheManager();

// Create cache manager with custom configuration
const customCacheManager = createDefaultCacheManager({
  memory: {
    max: 1000, // Max 1000 items in memory
    maxSize: 100 * 1024 * 1024, // 100MB max size
    ttl: 60 // 1 minute default TTL
  },
  redis: {
    keyPrefix: 'app:cache:',
    ttl: 300 // 5 minutes default TTL
  },
  database: {
    db: mongoDb,
    collection: 'cache',
    ttl: 3600 // 1 hour default TTL
  },
  defaultPolicy: CachePolicies.DYNAMIC
});
```

### Basic Caching

```javascript
// Get data with caching
const getData = async (id) => {
  return cacheManager.get(`data:${id}`, {
    fetchFn: () => fetchDataFromSource(id),
    policy: CachePolicies.DYNAMIC
  });
};

// Set data in cache
await cacheManager.set(`data:${id}`, value, CachePolicies.DYNAMIC.ttl);

// Delete data from cache
await cacheManager.del(`data:${id}`);

// Clear cache by pattern
await cacheManager.clear('data:*');
```

### Advanced Features

#### Stale-While-Revalidate

This pattern allows returning stale data immediately while refreshing it in the background:

```javascript
const getData = async (id) => {
  return cacheManager.get(`data:${id}`, {
    fetchFn: () => fetchDataFromSource(id),
    policy: CachePolicies.STATIC // Uses staleWhileRevalidate and backgroundRefresh
  });
};
```

#### Custom Cache Policies

```javascript
const customPolicy = CachePolicies.custom({
  ttl: 120, // 2 minutes
  staleWhileRevalidate: true,
  staleIfError: true,
  backgroundRefresh: false
});

const getData = async (id) => {
  return cacheManager.get(`data:${id}`, {
    fetchFn: () => fetchDataFromSource(id),
    policy: customPolicy
  });
};
```

#### Cache Events

```javascript
// Subscribe to cache events
cacheManager.on('hit', (event) => {
  console.log(`Cache hit for key ${event.key} in provider ${event.provider}`);
});

cacheManager.on('miss', (event) => {
  console.log(`Cache miss for key ${event.key}`);
});

cacheManager.on('set', (event) => {
  console.log(`Cache set for key ${event.key}`);
});

cacheManager.on('delete', (event) => {
  console.log(`Cache delete for key ${event.key}`);
});

cacheManager.on('clear', (event) => {
  console.log(`Cache clear for pattern ${event.pattern}, deleted ${event.count} keys`);
});

cacheManager.on('refresh', (event) => {
  console.log(`Cache refresh for key ${event.key}`);
});
```

## Best Practices

1. **Choose appropriate cache policies**: Use the right policy for each type of data based on how frequently it changes and how critical freshness is.

2. **Use meaningful cache keys**: Create a consistent naming scheme for cache keys, such as `entity:id:action` (e.g., `user:123:profile`).

3. **Handle cache invalidation**: Invalidate cache entries when the underlying data changes to prevent serving stale data.

4. **Monitor cache performance**: Track cache hit rates and response times to optimize cache policies.

5. **Consider data size**: Be mindful of the size of cached data, especially for memory cache.

6. **Use cache propagation**: Take advantage of automatic propagation between cache levels.

7. **Implement circuit breakers**: Use `staleIfError` for critical data to prevent cascading failures if the data source is unavailable.

## Integration with Domain Services

The multi-level caching system integrates with domain services to cache frequently accessed data:

```javascript
const { createDefaultCacheManager, CachePolicies } = require('../infrastructure/caching');
const SupplierService = require('../domains/supplier/services/SupplierService');

class CachedSupplierService extends SupplierService {
  constructor(options) {
    super(options);
    this.cacheManager = options.cacheManager || createDefaultCacheManager();
  }
  
  async getSupplierById(id) {
    return this.cacheManager.get(`supplier:${id}`, {
      fetchFn: () => super.getSupplierById(id),
      policy: CachePolicies.DYNAMIC
    });
  }
  
  async getAllSuppliers() {
    return this.cacheManager.get('suppliers:all', {
      fetchFn: () => super.getAllSuppliers(),
      policy: CachePolicies.DYNAMIC
    });
  }
  
  async updateSupplier(id, data) {
    const result = await super.updateSupplier(id, data);
    // Invalidate cache entries
    await this.cacheManager.del(`supplier:${id}`);
    await this.cacheManager.del('suppliers:all');
    return result;
  }
}
```

## Conclusion

The multi-level caching strategy provides a robust foundation for improving application performance by reducing database load and API calls. By caching data at multiple levels with different characteristics, the system can provide optimal performance for different types of data and access patterns. 