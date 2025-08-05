/**
 * cache-invalidation-example.js
 * 
 * Example script demonstrating the cache invalidation patterns
 * Implements RF027 - Implement cache invalidation patterns
 * 
 * To run this example:
 * node src/examples/cache-invalidation-example.js
 */

const { createDefaultCacheManager, CachePolicies } = require('../infrastructure/caching');
const CachedSupplierService = require('../domains/supplier/services/CachedSupplierService');
const CachedCustomerService = require('../domains/customer/services/CachedCustomerService');

async function runExample() {
  console.log('Cache Invalidation Patterns Example');
  console.log('===================================');
  
  // Create cache manager
  const cacheManager = createDefaultCacheManager();
  
  // Create cached services
  const supplierService = new CachedSupplierService({ cacheManager });
  const customerService = new CachedCustomerService({ cacheManager });
  
  try {
    // Example 1: Basic caching with tags
    console.log('\nExample 1: Basic caching with tags');
    console.log('----------------------------------');
    
    // Cache a value with tags
    await cacheManager.set('example:key1', { data: 'example data 1' }, CachePolicies.DYNAMIC, {
      tags: ['example', 'demo', 'data']
    });
    
    // Cache another value with the same tags
    await cacheManager.set('example:key2', { data: 'example data 2' }, CachePolicies.DYNAMIC, {
      tags: ['example', 'demo']
    });
    
    // Retrieve the values
    const value1 = await cacheManager.get('example:key1');
    const value2 = await cacheManager.get('example:key2');
    
    console.log('Cached value 1:', value1);
    console.log('Cached value 2:', value2);
    
    // Invalidate by tag
    console.log('\nInvalidating all entries with tag "demo"...');
    const invalidatedCount = await cacheManager.invalidateByTag('demo');
    console.log(`Invalidated ${invalidatedCount} entries`);
    
    // Try to retrieve the values again
    const value1After = await cacheManager.get('example:key1');
    const value2After = await cacheManager.get('example:key2');
    
    console.log('Cached value 1 after invalidation:', value1After);
    console.log('Cached value 2 after invalidation:', value2After);
    
    // Example 2: Entity-based invalidation
    console.log('\nExample 2: Entity-based invalidation');
    console.log('----------------------------------');
    
    // Simulate supplier data
    const supplier = { id: '123', name: 'Test Supplier', status: 'active' };
    
    // Cache supplier by ID
    console.log('Caching supplier data...');
    await cacheManager.set('supplier:123', supplier, CachePolicies.ENTITY, {
      tags: ['supplier', 'entity:supplier:123', 'supplier:status:active']
    });
    
    // Cache supplier list that includes this supplier
    await cacheManager.set('supplier:list', [supplier], CachePolicies.DYNAMIC, {
      tags: ['supplier:list'],
      dependencies: ['entity:supplier:123']
    });
    
    // Retrieve the supplier
    const cachedSupplier = await cacheManager.get('supplier:123');
    const cachedList = await cacheManager.get('supplier:list');
    
    console.log('Cached supplier:', cachedSupplier);
    console.log('Cached list:', cachedList);
    
    // Invalidate the supplier entity
    console.log('\nInvalidating supplier entity...');
    await cacheManager.invalidateByTag('entity:supplier:123');
    
    // Try to retrieve the supplier and list again
    const cachedSupplierAfter = await cacheManager.get('supplier:123');
    const cachedListAfter = await cacheManager.get('supplier:list');
    
    console.log('Cached supplier after invalidation:', cachedSupplierAfter);
    console.log('Cached list after invalidation:', cachedListAfter);
    
    // Example 3: Pattern-based invalidation
    console.log('\nExample 3: Pattern-based invalidation');
    console.log('----------------------------------');
    
    // Cache multiple keys with a common prefix
    await cacheManager.set('customer:region:north', { count: 10 }, CachePolicies.DYNAMIC);
    await cacheManager.set('customer:region:south', { count: 15 }, CachePolicies.DYNAMIC);
    await cacheManager.set('customer:region:east', { count: 20 }, CachePolicies.DYNAMIC);
    await cacheManager.set('customer:region:west', { count: 25 }, CachePolicies.DYNAMIC);
    
    // Retrieve one of the values
    const northRegion = await cacheManager.get('customer:region:north');
    console.log('North region customers:', northRegion);
    
    // Invalidate all region caches using a pattern
    console.log('\nInvalidating all region caches...');
    const clearedCount = await cacheManager.clear('customer:region:*');
    console.log(`Cleared ${clearedCount} entries`);
    
    // Try to retrieve the value again
    const northRegionAfter = await cacheManager.get('customer:region:north');
    console.log('North region customers after invalidation:', northRegionAfter);
    
    // Example 4: Time-based invalidation
    console.log('\nExample 4: Time-based invalidation');
    console.log('----------------------------------');
    
    // Cache a value with a short TTL and hardTTL enabled
    console.log('Caching value with 2 second TTL...');
    await cacheManager.set('example:shortlived', { timestamp: Date.now() }, {
      ...CachePolicies.MICRO,
      ttl: 2, // 2 seconds
      hardTTL: true
    });
    
    // Retrieve the value immediately
    const shortlivedValue = await cacheManager.get('example:shortlived');
    console.log('Value immediately after caching:', shortlivedValue);
    
    // Wait for the TTL to expire
    console.log('Waiting for TTL to expire...');
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Try to retrieve the value again
    const expiredValue = await cacheManager.get('example:shortlived');
    console.log('Value after TTL expiration:', expiredValue);
    
    // Example 5: Using cached services
    console.log('\nExample 5: Using cached services');
    console.log('----------------------------------');
    
    // Mock the supplier service to return test data
    supplierService.service.findById = async (id) => {
      return { id, name: `Supplier ${id}`, status: 'active' };
    };
    
    // Get a supplier (will be cached)
    console.log('Fetching supplier 456...');
    const supplier456 = await supplierService.findById('456');
    console.log('Supplier:', supplier456);
    
    // Get the same supplier again (should be from cache)
    console.log('\nFetching the same supplier again...');
    const supplier456Again = await supplierService.findById('456');
    console.log('Supplier (from cache):', supplier456Again);
    
    // Invalidate the supplier entity
    console.log('\nInvalidating supplier entity...');
    await supplierService.invalidateEntityCache('456');
    
    // Get the supplier again (should be fetched fresh)
    console.log('\nFetching the supplier after invalidation...');
    const supplier456Fresh = await supplierService.findById('456');
    console.log('Supplier (fresh):', supplier456Fresh);
    
    console.log('\nCache statistics:');
    console.log(cacheManager.getStats());
    
  } catch (error) {
    console.error('Error running example:', error);
  } finally {
    // Clean up
    await cacheManager.close();
  }
}

// Run the example
runExample().catch(console.error); 