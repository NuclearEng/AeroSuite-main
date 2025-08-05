/**
 * cache-monitoring-example.js
 * 
 * Example script demonstrating the cache monitoring
 * Implements RF028 - Add cache monitoring and metrics
 * 
 * To run this example:
 * node src/examples/cache-monitoring-example.js
 */

const { 
  createDefaultCacheManager, 
  createCacheMonitor, 
  createCachePrometheusExporter,
  CachePolicies
} = require('../infrastructure/caching');

async function runExample() {
  console.log('Cache Monitoring Example');
  console.log('=======================');
  
  // Create cache manager
  const cacheManager = createDefaultCacheManager();
  
  // Create cache monitor
  const cacheMonitor = createCacheMonitor({ cacheManager });
  
  // Create Prometheus exporter
  const prometheusExporter = createCachePrometheusExporter({ cacheMonitor });
  
  try {
    // Simulate cache operations
    console.log('\nSimulating cache operations...');
    
    // Cache hits and misses
    await simulateCacheOperations(cacheManager, 50, 20);
    
    // Print basic metrics
    console.log('\nBasic Metrics:');
    console.log(JSON.stringify(cacheMonitor.getMetrics(), null, 2));
    
    // Print detailed metrics (truncated for readability)
    console.log('\nDetailed Metrics (truncated):');
    const detailedMetrics = cacheMonitor.getDetailedMetrics();
    console.log('Hot Keys:', JSON.stringify(detailedMetrics.hotKeys, null, 2));
    console.log('Provider Metrics:', JSON.stringify(detailedMetrics.providerMetrics, null, 2));
    
    // Get Prometheus metrics
    console.log('\nPrometheus Metrics (first 500 chars):');
    const prometheusMetrics = await prometheusExporter.getMetrics();
    console.log(prometheusMetrics.substring(0, 500) + '...');
    
    // Simulate more operations with different patterns
    console.log('\nSimulating more operations with different patterns...');
    await simulatePatternedOperations(cacheManager);
    
    // Print updated metrics
    console.log('\nUpdated Metrics:');
    console.log(JSON.stringify(cacheMonitor.getMetrics(), null, 2));
    
    // Reset metrics
    console.log('\nResetting metrics...');
    cacheMonitor.resetMetrics();
    
    // Print metrics after reset
    console.log('\nMetrics after reset:');
    console.log(JSON.stringify(cacheMonitor.getMetrics(), null, 2));
    
  } catch (error) {
    console.error('Error running example:', error);
  } finally {
    // Clean up
    prometheusExporter.close();
    cacheMonitor.close();
    await cacheManager.close();
  }
}

/**
 * Simulate cache operations with hits and misses
 * @param {Object} cacheManager - Cache manager
 * @param {number} hits - Number of hits to simulate
 * @param {number} misses - Number of misses to simulate
 */
async function simulateCacheOperations(cacheManager, hits, misses) {
  // Simulate cache hits
  for (let i = 0; i < hits; i++) {
    const key = `key:${i % 10}`; // Reuse keys to generate hits
    
    // First set the value
    await cacheManager.set(key, { value: `value-${i}` }, CachePolicies.DEFAULT);
    
    // Then get it to generate a hit
    await cacheManager.get(key);
    
    // Add some delay to spread operations over time
    await delay(10);
  }
  
  // Simulate cache misses
  for (let i = 0; i < misses; i++) {
    const key = `missing:${i}`; // Always use new keys to generate misses
    await cacheManager.get(key);
    
    // Add some delay
    await delay(5);
  }
}

/**
 * Simulate cache operations with different patterns
 * @param {Object} cacheManager - Cache manager
 */
async function simulatePatternedOperations(cacheManager) {
  // Simulate operations with different latencies
  for (let i = 0; i < 20; i++) {
    const key = `pattern:${i % 5}`;
    
    // Set with different tags
    await cacheManager.set(key, { data: `data-${i}` }, CachePolicies.DEFAULT, {
      tags: [`tag:${i % 3}`, 'common-tag']
    });
    
    // Simulate different latencies
    await delay(i * 5);
    
    // Get the value
    await cacheManager.get(key);
  }
  
  // Simulate some deletes and invalidations
  for (let i = 0; i < 5; i++) {
    await cacheManager.del(`pattern:${i}`);
  }
  
  // Clear a pattern
  await cacheManager.clear('pattern:*');
}

/**
 * Simple delay function
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after the delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the example
runExample().catch(console.error); 