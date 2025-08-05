# Query Result Caching

## Overview

The query result caching system optimizes database performance by caching the results of database queries, reducing the load on the database and improving response times for frequently accessed data.

## Key Features

- Automatic caching of read operations (find, findOne, findById, aggregate, etc.)
- Automatic cache invalidation on write operations (create, update, delete)
- Support for both Redis (preferred) and in-memory caching
- LRU (Least Recently Used) eviction policy for in-memory cache
- Configurable TTL (Time To Live) for cached results
- Cache statistics and monitoring
- API endpoints for cache management

## Configuration

The query caching system can be configured using environment variables:

```
# Enable/disable query result caching
ENABLE_QUERY_CACHE=true

# Cache TTL in seconds (default: 300 - 5 minutes)
QUERY_CACHE_TTL=300

# Maximum number of items in memory cache (default: 1000)
QUERY_CACHE_MAX_SIZE=1000

# Redis connection URL (if not specified, in-memory cache is used)
REDIS_URL=redis://localhost:6379
```

## Using the Cache

The query result caching is integrated with the `queryOptimizer` utility, so any code that uses this utility will automatically benefit from caching.

### Basic Usage

```javascript
const { executeOptimizedQuery } = require('../utils/queryOptimizer');

// This query will be cached automatically
const users = await executeOptimizedQuery(User, 'find', { active: true }, { 
  select: 'name email role',
  sort: { createdAt: -1 },
  limit: 10
});
```

### Disabling Cache for Specific Queries

```javascript
// Skip cache for this specific query
const userData = await executeOptimizedQuery(User, 'findById', userId, {
  skipCache: true
});
```

### Custom Cache TTL

```javascript
// Set a custom TTL (in seconds) for this query
const products = await executeOptimizedQuery(Product, 'find', { inStock: true }, {
  cacheTTL: 600 // 10 minutes
});
```

## Cache Invalidation

Cache invalidation happens automatically when write operations (create, update, delete) are performed through the `executeOptimizedQuery` function.

### Manual Invalidation

To manually invalidate cache entries, you can use the following functions:

```javascript
const { invalidateQueryCache, invalidateAllQueryCache } = require('../utils/queryOptimizer');

// Invalidate cache for a specific model
await invalidateQueryCache('User');

// Invalidate all cache entries
await invalidateAllQueryCache();
```

## API Endpoints

The following API endpoints are available for cache management (admin access only):

- `GET /api/cache/stats` - Get cache statistics
- `POST /api/cache/stats/reset` - Reset cache statistics
- `DELETE /api/cache/model/:modelName` - Invalidate cache for a specific model
- `DELETE /api/cache` - Invalidate all cache entries

## Monitoring

Cache statistics are available through the `getQueryStats()` function in the `queryOptimizer` utility. The statistics include:

- Hit/miss count and ratio
- Cache size
- Eviction count
- Cache engine (Redis or Memory)
- Uptime
- Average query execution time

## Handling Cache-Related Errors

The caching system is designed to be fault-tolerant. If a cache-related error occurs, the system will:

1. Log the error
2. Continue with the original database query
3. Not disrupt the application flow

## Performance Considerations

- Consider adjusting the TTL based on how frequently your data changes
- For very large result sets, consider paging or limiting the results
- For real-time data requirements, consider skipping the cache or using a shorter TTL

## Implementation Details

The query result caching system consists of the following components:

- `queryCacheManager.js` - Core caching functionality
- `queryOptimizer.js` - Integration with database queries
- `cache.controller.js` - API endpoints for cache management
- `cache.routes.js` - Route definitions

## Troubleshooting

If you're experiencing issues with the caching system:

1. Check if caching is enabled (`ENABLE_QUERY_CACHE=true`)
2. Verify Redis connection if using Redis
3. Check cache statistics for hit/miss ratios
4. Look for cache-related errors in the logs

## Future Improvements

Potential future improvements for the caching system include:

- Selective cache invalidation based on query patterns
- Cache warm-up for commonly accessed data
- More sophisticated eviction policies
- Integration with database triggers for cache invalidation 
