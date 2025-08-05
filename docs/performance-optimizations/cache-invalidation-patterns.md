# Cache Invalidation Patterns

This document describes the cache invalidation patterns implemented as part of RF027 in the AeroSuite project.

## Overview

Cache invalidation is the process of removing or refreshing cached data when it becomes stale or invalid. Proper cache invalidation ensures that users always see the most up-to-date information while maintaining the performance benefits of caching.

The AeroSuite project implements several advanced cache invalidation patterns to handle different scenarios and use cases.

## Invalidation Patterns

### 1. Tag-Based Invalidation

Tags allow grouping related cache entries together, making it possible to invalidate multiple entries at once based on their relationship.

**Implementation:**
- Cache entries can be tagged with one or more string identifiers
- When a resource changes, all cache entries with related tags can be invalidated

**Example:**
```javascript
// Cache with tags
cacheManager.get('supplier:123', {
  fetchFn: () => fetchSupplier(123),
  tags: ['supplier', 'supplier:123', 'active-supplier']
});

// Invalidate all supplier-related caches
cacheManager.invalidateByTag('supplier');
```

### 2. Dependency-Based Invalidation

Dependencies establish relationships between cache entries, allowing automatic invalidation of dependent entries when a parent entry changes.

**Implementation:**
- Cache entries can declare dependencies on other cache keys
- When a key is invalidated, all entries that depend on it are also invalidated

**Example:**
```javascript
// Cache with dependencies
cacheManager.get('supplier-list', {
  fetchFn: () => fetchSupplierList(),
  dependencies: ['supplier:123', 'supplier:456']
});

// Invalidate all caches that depend on supplier:123
cacheManager.invalidateDependents('supplier:123');
```

### 3. Time-Based Invalidation

Time-based invalidation ensures that cache entries are automatically invalidated after a certain period, even if they haven't been explicitly invalidated.

**Implementation:**
- Hard TTL (Time To Live) can be set for cache entries
- When the TTL expires, the entry is automatically invalidated

**Example:**
```javascript
// Cache with hard TTL
cacheManager.get('weather-data', {
  fetchFn: () => fetchWeatherData(),
  policy: {
    ttl: 3600, // 1 hour
    hardTTL: true // Force invalidation after TTL expires
  }
});
```

### 4. Pattern-Based Invalidation

Pattern-based invalidation allows invalidating multiple cache entries that match a specific pattern, such as a prefix or glob pattern.

**Implementation:**
- Cache keys can be invalidated using glob patterns
- Useful for invalidating groups of related keys without explicit tagging

**Example:**
```javascript
// Invalidate all supplier list caches
cacheManager.clear('supplier:list:*');
```

### 5. Batch Invalidation

Batch invalidation allows invalidating multiple cache entries at once, improving performance when multiple entries need to be invalidated.

**Implementation:**
- Multiple cache keys can be invalidated in a single operation
- Reduces overhead when many keys need to be invalidated

**Example:**
```javascript
// Batch invalidate multiple keys
cacheManager.batchInvalidate(['supplier:123', 'supplier:456', 'supplier-list']);
```

### 6. Entity-Based Invalidation

Entity-based invalidation is a specialized pattern for invalidating all cache entries related to a specific entity.

**Implementation:**
- Cache entries can be associated with entities using tags
- When an entity changes, all related cache entries are invalidated

**Example:**
```javascript
// Invalidate all caches related to supplier 123
cachedService.invalidateEntityCache('123');
```

## Implementation in AeroSuite

The cache invalidation patterns are implemented through the following classes:

1. **CacheInvalidator**: Core class that implements the invalidation patterns
2. **CacheManager**: Enhanced with invalidation capabilities
3. **CachePolicies**: Extended with invalidation-related options
4. **CachedService**: Base class for domain services with caching and invalidation support

### CacheInvalidator

The `CacheInvalidator` class provides the core invalidation functionality:

- Maintains maps of tags to keys and dependencies between keys
- Schedules invalidation of keys after a certain time
- Provides methods for invalidating by tags, dependencies, and patterns
- Handles cleanup of metadata when keys are invalidated

### CacheManager

The `CacheManager` class integrates with the `CacheInvalidator`:

- Provides a high-level API for cache operations
- Integrates invalidation patterns with the multi-level caching strategy
- Forwards invalidation requests to the `CacheInvalidator`

### CachePolicies

The `CachePolicies` module defines policies for different types of data:

- Added `hardTTL` option to control whether keys should be forcibly invalidated
- Added new policy types: `VERSIONED` and `ENTITY`

### CachedService

The `CachedService` base class provides domain-specific invalidation methods:

- Generates tags and dependencies for cached data
- Provides entity-based invalidation methods
- Implements batch invalidation for multiple entities

## Usage Examples

### Basic Invalidation

```javascript
// Invalidate a specific key
await cacheManager.del('supplier:123');
```

### Tag-Based Invalidation

```javascript
// Invalidate all keys with the 'supplier' tag
await cacheManager.invalidateByTag('supplier');

// Invalidate keys with multiple tags
await cacheManager.invalidateByTags(['supplier', 'active-supplier']);
```

### Entity-Based Invalidation

```javascript
// Invalidate all caches related to supplier 123
await cachedSupplierService.invalidateEntityCache('123');

// Batch invalidate multiple entities
await cachedSupplierService.batchInvalidateEntities(['123', '456']);
```

### Pattern-Based Invalidation

```javascript
// Invalidate all supplier list caches
await cacheManager.clear('supplier:list:*');
```

## Best Practices

1. **Use Tags for Related Data**: Tag cache entries with meaningful identifiers that represent their relationships.

2. **Be Specific with Invalidation**: Invalidate only what's necessary to avoid over-invalidation.

3. **Consider Invalidation Hierarchies**: Structure tags and dependencies to allow for granular invalidation.

4. **Use Entity-Based Invalidation**: For domain-driven applications, use entity-based invalidation to maintain consistency.

5. **Monitor Invalidation Metrics**: Track invalidation patterns to identify potential optimizations.

## Conclusion

The cache invalidation patterns implemented in AeroSuite provide a robust foundation for maintaining cache consistency while maximizing performance. By using these patterns appropriately, the system can ensure that users always see the most up-to-date information without sacrificing the performance benefits of caching. 