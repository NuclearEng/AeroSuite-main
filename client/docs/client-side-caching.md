# Client-Side Query Result Caching

## Overview

The client-side query result caching system complements the server-side caching to improve application performance and reduce unnecessary API calls. This system caches API responses in memory based on request parameters and provides automatic cache invalidation when data is modified.

## Key Features

- In-memory caching of API responses
- Automatic cache invalidation on write operations
- LRU (Least Recently Used) eviction policy
- Configurable TTL (Time To Live) for cached results
- Typed cache for better type safety
- Cache statistics and monitoring
- Integration with React components via hooks

## Configuration

The client-side caching system can be configured using environment variables:

```
# Enable/disable client-side caching
REACT_APP_ENABLE_CLIENT_CACHE=true
```

## Cache Service

The core of the caching system is the `cacheService.ts` file, which provides a ClientCache class with the following features:

- Memory-efficient cache storage
- Automatic expiry of cached items
- LRU eviction policy
- Cache statistics

## Integration with API Service

The caching system is integrated with the main API service, allowing for:

- Automatic caching of GET requests
- Automatic cache invalidation on POST, PUT, PATCH, and DELETE requests
- Cache key generation based on request parameters
- Custom cache TTL for different types of data

## Using the Cache in Components

### Basic Usage with the API Service

```typescript
import api from '../services/api';

// Fetch data with caching (enabled by default for GET requests)
const data = await api.get<UserData[]>('/users');

// Disable caching for specific requests
const freshData = await api.get<UserData[]>('/users', {}, { useCache: false });

// Custom cache TTL (in milliseconds)
const data = await api.get<UserData[]>('/users', {}, { ttl: 60000 }); // 1 minute
```

### Using the useCachedData Hook

For React components, the `useCachedData` hook provides a simple way to fetch and cache data:

```typescript
import useCachedData from '../hooks/useCachedData';

function UserList() {
  const { data, loading, error, refetch } = useCachedData<UserData[]>('/users', {
    useCache: true,        // Enable caching (default: true)
    ttl: 300000,           // Cache TTL in milliseconds (default: 5 minutes)
    deps: [userId],        // Dependencies that trigger refetch
    initialData: [],       // Initial data while loading
    autoFetch: true        // Auto fetch on mount (default: true)
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={refetch}>Refresh</button>
      <ul>
        {data?.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Cache Invalidation

The caching system automatically invalidates related cache entries when data is modified:

- POST requests invalidate list endpoints
- PUT and PATCH requests invalidate the specific resource
- DELETE requests invalidate both the specific resource and list endpoints

You can also manually invalidate cache entries:

```typescript
import { clearCacheByPattern, clearAllCache } from '../services/api';

// Clear specific cache entries
clearCacheByPattern(/^GET:\/users.*/);

// Clear all cache
clearAllCache();
```

## Performance Considerations

- Use appropriate TTL values based on how frequently your data changes
- Consider disabling cache for sensitive data
- For large datasets, consider using a more persistent cache solution

## Implementation Details

The client-side caching system consists of the following components:

- `cacheService.ts` - Core caching functionality
- `api.ts` - Integration with the API service
- `useCachedData.ts` - React hook for easy use in components

## Cache Statistics

You can monitor cache performance with the following:

```typescript
import { getCacheStats } from '../services/api';

const stats = getCacheStats();
console.log(`Cache size: ${stats.size}/${stats.maxSize}, Enabled: ${stats.enabled}`);
```

## Troubleshooting

If you're experiencing issues with the caching system:

1. Ensure caching is enabled (`REACT_APP_ENABLE_CLIENT_CACHE=true`)
2. Check if the data is being modified by another user
3. Try clearing the cache manually
4. Disable caching for the specific request that's causing issues

## Future Improvements

Potential future improvements for the client-side caching system include:

- IndexedDB storage for larger datasets and persistence across sessions
- Synchronization with server-side cache invalidation events
- Prefetching commonly accessed data
- Improved cache compression for memory efficiency 
