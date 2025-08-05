/**
 * redis-caching-example.js
 * 
 * Example demonstrating Redis caching for frequently accessed data
 * Implements RF026 - Add Redis caching for frequently accessed data
 */

const { getServiceFactory } = require('../infrastructure/caching/ServiceFactory');
const { CachePolicies } = require('../infrastructure/caching');
const Redis = require('ioredis');
const { MongoClient } = require('mongodb');

/**
 * Run the Redis caching example
 */
async function runRedisCachingExample() {
  console.log('Starting Redis caching for frequently accessed data example...');
  
  // Connect to MongoDB
  const mongoClient = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017/aerosuite');
  await mongoClient.connect();
  const db = mongoClient.db();
  
  try {
    // Create service factory with Redis caching
    const serviceFactory = getServiceFactory({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0
      },
      cachePolicies: {
        supplier: {
          findById: CachePolicies.DYNAMIC,
          findAll: CachePolicies.custom({ ttl: 60, staleWhileRevalidate: true }),
          search: CachePolicies.MICRO
        },
        customer: {
          findById: CachePolicies.DYNAMIC,
          findAll: CachePolicies.custom({ ttl: 60, staleWhileRevalidate: true }),
          search: CachePolicies.MICRO
        }
      }
    });
    
    // Get cached services
    const supplierService = serviceFactory.getSupplierService();
    const customerService = serviceFactory.getCustomerService();
    
    // Example 1: Cached supplier lookup
    console.log('\nExample 1: Cached supplier lookup');
    
    // Create a test supplier if none exists
    let supplier = null;
    try {
      const suppliers = await supplierService.findAll({ limit: 1 });
      
      if (suppliers.data.length === 0) {
        console.log('Creating test supplier...');
        supplier = await supplierService.create({
          name: 'Test Supplier',
          code: 'TS-' + Date.now(),
          type: 'manufacturer',
          status: 'active'
        });
      } else {
        supplier = suppliers.data[0];
      }
      
      console.log(`Using supplier: ${supplier.name} (${supplier.id})`);
    } catch (error) {
      console.log('Error finding/creating supplier:', error.message);
      // Create a mock supplier for demo purposes
      supplier = { id: 'mock-supplier-id', name: 'Mock Supplier' };
    }
    
    // First lookup - should hit the database
    console.log('\nFirst supplier lookup (cache miss expected):');
    console.time('First lookup');
    const supplier1 = await supplierService.findById(supplier.id);
    console.timeEnd('First lookup');
    console.log(`Found supplier: ${supplier1 ? supplier1.name : 'Not found'}`);
    
    // Second lookup - should hit the cache
    console.log('\nSecond supplier lookup (cache hit expected):');
    console.time('Second lookup');
    const supplier2 = await supplierService.findById(supplier.id);
    console.timeEnd('Second lookup');
    console.log(`Found supplier: ${supplier2 ? supplier2.name : 'Not found'}`);
    
    // Example 2: Cache invalidation on update
    console.log('\nExample 2: Cache invalidation on update');
    
    // Update the supplier
    try {
      const updatedDescription = 'Updated at ' + new Date().toISOString();
      console.log(`Updating supplier description to: ${updatedDescription}`);
      
      await supplierService.update(supplier.id, { description: updatedDescription });
      
      // Lookup after update - should hit the database again
      console.log('\nLookup after update (cache miss expected):');
      console.time('Lookup after update');
      const supplier3 = await supplierService.findById(supplier.id);
      console.timeEnd('Lookup after update');
      console.log(`Found supplier: ${supplier3 ? supplier3.name : 'Not found'}`);
      console.log(`Description: ${supplier3 ? supplier3.description : 'N/A'}`);
    } catch (error) {
      console.log('Error updating supplier:', error.message);
    }
    
    // Example 3: Cached customer search
    console.log('\nExample 3: Cached customer search');
    
    // First search - should hit the database
    console.log('\nFirst customer search (cache miss expected):');
    console.time('First search');
    const searchResults1 = await customerService.search('test', { limit: 5 });
    console.timeEnd('First search');
    console.log(`Found ${searchResults1.total} customers`);
    
    // Second search with same query - should hit the cache
    console.log('\nSecond customer search (cache hit expected):');
    console.time('Second search');
    const searchResults2 = await customerService.search('test', { limit: 5 });
    console.timeEnd('Second search');
    console.log(`Found ${searchResults2.total} customers`);
    
    // Example 4: Cache statistics
    console.log('\nExample 4: Cache statistics');
    const stats = serviceFactory.getStats();
    console.log('Cache statistics:', stats);
    
    // Example 5: Different cache policies for different methods
    console.log('\nExample 5: Different cache policies for different methods');
    
    // findAll uses a different cache policy than findById
    console.log('\nFindAll with custom cache policy:');
    console.time('First findAll');
    const allSuppliers1 = await supplierService.findAll({ limit: 10 });
    console.timeEnd('First findAll');
    console.log(`Found ${allSuppliers1.total} suppliers`);
    
    console.log('\nSecond findAll (cache hit expected):');
    console.time('Second findAll');
    const allSuppliers2 = await supplierService.findAll({ limit: 10 });
    console.timeEnd('Second findAll');
    console.log(`Found ${allSuppliers2.total} suppliers`);
    
    // Example 6: Cache persistence across service instances
    console.log('\nExample 6: Cache persistence across service instances');
    
    // Create a new service instance
    const newSupplierService = serviceFactory.getSupplierService();
    
    // Lookup should still hit the cache
    console.log('\nLookup from new service instance (cache hit expected):');
    console.time('New instance lookup');
    const supplier4 = await newSupplierService.findById(supplier.id);
    console.timeEnd('New instance lookup');
    console.log(`Found supplier: ${supplier4 ? supplier4.name : 'Not found'}`);
  } catch (error) {
    console.error('Error in Redis caching example:', error);
  } finally {
    // Clean up resources
    try {
      const serviceFactory = getServiceFactory();
      await serviceFactory.close();
    } catch (e) {
      console.error('Error closing service factory:', e);
    }
    
    await mongoClient.close();
    console.log('\nRedis caching example completed');
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  runRedisCachingExample().catch(error => {
    console.error('Error running Redis caching example:', error);
    process.exit(1);
  });
}

module.exports = { runRedisCachingExample }; 