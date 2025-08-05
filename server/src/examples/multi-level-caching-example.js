/**
 * multi-level-caching-example.js
 * 
 * Example usage of multi-level caching strategy
 * Implements RF025 - Implement multi-level caching strategy
 */

const { 
  createDefaultCacheManager, 
  CachePolicies, 
  MemoryCacheProvider,
  RedisCacheProvider,
  DatabaseCacheProvider
} = require('../infrastructure/caching');
const Redis = require('ioredis');
const { MongoClient } = require('mongodb');

/**
 * Example function to demonstrate multi-level caching
 */
async function runCachingExample() {
  console.log('Starting multi-level caching example...');
  
  // Create Redis client
  const redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0
  });
  
  // Connect to MongoDB
  const mongoClient = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/aerosuite');
  await mongoClient.connect();
  const db = mongoClient.db();
  
  try {
    // Create cache manager with all three levels
    const cacheManager = createDefaultCacheManager({
      memory: {
        max: 500, // Max 500 items in memory
        maxSize: 50 * 1024 * 1024, // 50MB max size
        ttl: 60 // 1 minute default TTL
      },
      redis: {
        redisConfig: { client: redisClient },
        keyPrefix: 'example:cache:',
        ttl: 300 // 5 minutes default TTL
      },
      database: {
        db,
        collection: 'cache_example',
        ttl: 3600 // 1 hour default TTL
      },
      defaultPolicy: CachePolicies.DYNAMIC
    });
    
    console.log('Cache manager created with 3 levels');
    
    // Example 1: Basic caching
    console.log('\nExample 1: Basic caching');
    
    // Function that simulates a slow data fetch
    const fetchUserData = async (userId) => {
      console.log(`Fetching user data for ${userId} (slow operation)`);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`,
        lastLogin: new Date().toISOString()
      };
    };
    
    // Cache key for user data
    const getUserCacheKey = (userId) => `user:${userId}`;
    
    // Get user data with caching
    const getUserData = async (userId) => {
      return cacheManager.get(getUserCacheKey(userId), {
        fetchFn: () => fetchUserData(userId),
        policy: CachePolicies.USER
      });
    };
    
    // First call - should fetch from source
    console.log('First call for user 123:');
    const user1 = await getUserData('123');
    console.log('User data:', user1);
    
    // Second call - should get from cache
    console.log('\nSecond call for user 123:');
    const user2 = await getUserData('123');
    console.log('User data:', user2);
    
    // Different user - should fetch from source
    console.log('\nCall for different user 456:');
    const user3 = await getUserData('456');
    console.log('User data:', user3);
    
    // Example 2: Using different cache policies
    console.log('\nExample 2: Using different cache policies');
    
    // Function that simulates fetching static reference data
    const fetchReferenceData = async () => {
      console.log('Fetching reference data (slow operation)');
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        categories: ['Electronics', 'Clothing', 'Books', 'Home'],
        statuses: ['Active', 'Inactive', 'Pending', 'Archived'],
        timestamp: new Date().toISOString()
      };
    };
    
    // Get reference data with static cache policy
    const getReferenceData = async () => {
      return cacheManager.get('reference:data', {
        fetchFn: fetchReferenceData,
        policy: CachePolicies.STATIC
      });
    };
    
    // First call - should fetch from source
    console.log('First call for reference data:');
    const ref1 = await getReferenceData();
    console.log('Reference data:', ref1);
    
    // Second call - should get from cache
    console.log('\nSecond call for reference data:');
    const ref2 = await getReferenceData();
    console.log('Reference data:', ref2);
    
    // Example 3: Cache invalidation
    console.log('\nExample 3: Cache invalidation');
    
    // Set a value in cache
    await cacheManager.set('test:key', { value: 'test value' });
    console.log('Set test:key in cache');
    
    // Get the value from cache
    const cachedValue = await cacheManager.get('test:key');
    console.log('Get test:key from cache:', cachedValue);
    
    // Delete the value from cache
    await cacheManager.del('test:key');
    console.log('Deleted test:key from cache');
    
    // Try to get the value again
    const deletedValue = await cacheManager.get('test:key');
    console.log('Get test:key after deletion:', deletedValue);
    
    // Example 4: Cache statistics
    console.log('\nExample 4: Cache statistics');
    const stats = cacheManager.getStats();
    console.log('Cache statistics:', stats);
    
    // Example 5: Cache propagation between levels
    console.log('\nExample 5: Cache propagation between levels');
    
    // Create separate providers to demonstrate propagation
    const memoryProvider = new MemoryCacheProvider();
    const redisProvider = new RedisCacheProvider({ redisConfig: { client: redisClient } });
    const dbProvider = new DatabaseCacheProvider({ db, collection: 'cache_demo' });
    
    // Initialize providers
    await memoryProvider.initialize();
    await redisProvider.initialize();
    await dbProvider.initialize();
    
    // Set value only in Redis (level 2)
    await redisProvider.set('propagation:test', { 
      value: 'This value should propagate', 
      metadata: { 
        createdAt: Date.now(),
        expiresAt: Date.now() + 3600000 
      }
    }, 3600);
    console.log('Set value in Redis only');
    
    // Create cache manager with all three providers
    const propagationManager = new CacheManager({
      providers: [memoryProvider, redisProvider, dbProvider]
    });
    
    // Get value - should find in Redis and propagate to memory
    const propagatedValue = await propagationManager.get('propagation:test');
    console.log('Value from cache manager:', propagatedValue);
    
    // Check if value propagated to memory
    const memoryValue = await memoryProvider.get('propagation:test');
    console.log('Value in memory cache:', memoryValue ? 'Found' : 'Not found');
    
    // Example 6: Background refresh
    console.log('\nExample 6: Background refresh');
    
    let counter = 0;
    
    // Function that returns incremented counter
    const getCounterValue = async () => {
      counter++;
      console.log(`Generating counter value: ${counter}`);
      return { counter };
    };
    
    // Cache with background refresh policy
    const refreshPolicy = CachePolicies.custom({
      ttl: 5, // 5 seconds TTL
      backgroundRefresh: true,
      staleWhileRevalidate: true
    });
    
    // Set initial value
    await cacheManager.set('counter:key', { value: { counter: 0 } }, refreshPolicy.ttl);
    
    // Get value with background refresh
    const getCounter = async () => {
      return cacheManager.get('counter:key', {
        fetchFn: getCounterValue,
        policy: refreshPolicy
      });
    };
    
    console.log('First counter fetch:');
    const count1 = await getCounter();
    console.log('Counter value:', count1);
    
    console.log('\nSecond counter fetch (should use cache):');
    const count2 = await getCounter();
    console.log('Counter value:', count2);
    
    // Wait for cache to expire
    console.log('\nWaiting for cache to expire (6 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    console.log('\nThird counter fetch (should get stale value and refresh in background):');
    const count3 = await getCounter();
    console.log('Counter value:', count3);
    
    // Wait a moment for background refresh to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('\nFourth counter fetch (should get refreshed value):');
    const count4 = await getCounter();
    console.log('Counter value:', count4);
  } catch (error) {
    console.error('Error in caching example:', error);
  } finally {
    // Clean up resources
    await redisClient.quit();
    await mongoClient.close();
    console.log('\nCaching example completed');
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runCachingExample().catch(error => {
    console.error('Error running caching example:', error);
    process.exit(1);
  });
}

module.exports = { runCachingExample }; 