/**
 * Concurrent Operations Test Scenario
 * 
 * This scenario tests the system's ability to handle multiple concurrent operations.
 * It verifies the horizontal scaling capabilities implemented in TS350.
 * 
 * Task: TS354 - Load testing implementation
 */

/**
 * Run the concurrent operations scenario
 * @param {Object} client - HTTP client instance
 * @param {Object} config - Test configuration
 * @returns {Promise<void>}
 */
async function run(client, config) {
  // Generate a unique identifier for this test run
  const testId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  
  try {
    // Step 1: Authentication if credentials provided
    let token = null;
    if (config.auth) {
      const credentials = {
        email: config.auth.email || 'test@example.com',
        password: config.auth.password || 'testpassword'
      };
      
      const loginResponse = await client.post('/api/auth/login', credentials);
      token = loginResponse.data.token;
      
      // Update client authorization header
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Step 2: Create multiple resources in parallel
    const createPromises = [];
    const createdIds = [];
    const numResources = 5; // Create 5 resources simultaneously
    
    for (let i = 0; i < numResources; i++) {
      const resourcePromise = (async () => {
        // Create a test supplier
        const supplier = {
          name: `Concurrent Test Supplier ${testId}-${i}`,
          email: `concurrent-${testId}-${i}@example.com`,
          phone: `555-${Math.floor(1000 + Math.random() * 9000)}`,
          address: {
            street: `${Math.floor(100 + Math.random() * 900)} Test St`,
            city: 'Test City',
            state: 'TS',
            zipCode: `${Math.floor(10000 + Math.random() * 90000)}`,
            country: 'Test Country'
          },
          status: 'active',
          category: 'test',
          notes: `Concurrent test supplier ${i} created on ${new Date().toISOString()}`
        };
        
        const response = await client.post('/api/suppliers', supplier);
        return response.data.id;
      })();
      
      createPromises.push(resourcePromise);
    }
    
    // Wait for all resources to be created
    const ids = await Promise.all(createPromises);
    createdIds.push(...ids);
    
    // Step 3: Retrieve all resources in parallel
    const getPromises = createdIds.map(id => 
      client.get(`/api/suppliers/${id}`)
    );
    
    await Promise.all(getPromises);
    
    // Step 4: Update all resources in parallel
    const updatePromises = createdIds.map((id, index) => 
      client.put(`/api/suppliers/${id}`, {
        status: 'inactive',
        notes: `Concurrent test supplier ${index} updated on ${new Date().toISOString()}`
      })
    );
    
    await Promise.all(updatePromises);
    
    // Step 5: Perform multiple search operations in parallel
    const searchPromises = [
      client.get('/api/suppliers/search?q=concurrent'),
      client.get('/api/customers?limit=10'),
      client.get('/api/inspections?limit=10'),
      client.get('/api/dashboard'),
      client.get('/api/notifications')
    ];
    
    await Promise.all(searchPromises);
    
    // Step 6: Delete all resources in parallel
    const deletePromises = createdIds.map(id => 
      client.delete(`/api/suppliers/${id}`)
    );
    
    await Promise.all(deletePromises);
    
    // Step 7: Verify deletion with parallel checks
    const verifyPromises = createdIds.map(async (id) => {
      try {
        await client.get(`/api/suppliers/${id}`);
        // If we reach here, the resource still exists (unexpected)
        throw new Error(`Resource ${id} was not deleted`);
      } catch (error) {
        // Expected 404 error - resource was deleted
        if (error.response && error.response.status === 404) {
          return true;
        }
        throw error;
      }
    });
    
    await Promise.all(verifyPromises);
    
    // Clean up
    if (token) {
      try {
        await client.post('/api/auth/logout');
      } catch (e) {
        // Ignore logout errors
      }
      
      delete client.defaults.headers.common['Authorization'];
    }
  } catch (error) {
    console.error(`Concurrent operations scenario failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  run
}; 