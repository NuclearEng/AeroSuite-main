/**
 * CRUD Operations Test Scenario
 * 
 * This scenario tests Create, Read, Update, Delete operations
 * on a specific resource (suppliers in this case).
 * 
 * Task: TS354 - Load testing implementation
 */

/**
 * Run the CRUD operations scenario
 * @param {Object} client - HTTP client instance
 * @param {Object} config - Test configuration
 * @returns {Promise<void>}
 */
async function run(client, config) {
  // Generate a unique identifier for this test run
  const testId = Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  
  // Create test data
  const newSupplier = {
    name: `Test Supplier ${testId}`,
    email: `supplier-${testId}@example.com`,
    phone: `555-${Math.floor(1000 + Math.random() * 9000)}`,
    address: {
      street: `${Math.floor(100 + Math.random() * 900)} Main St`,
      city: 'Test City',
      state: 'TS',
      zipCode: `${Math.floor(10000 + Math.random() * 90000)}`,
      country: 'Test Country'
    },
    status: 'active',
    category: 'test',
    notes: `Test supplier created by load test on ${new Date().toISOString()}`
  };
  
  try {
    // Step 1: Create a new supplier
    const createResponse = await client.post('/api/suppliers', newSupplier);
    const createdSupplier = createResponse.data;
    const supplierId = createdSupplier.id;
    
    // Step 2: Get the created supplier
    await client.get(`/api/suppliers/${supplierId}`);
    
    // Step 3: Update the supplier
    const updateData = {
      name: `${newSupplier.name} (Updated)`,
      notes: `${newSupplier.notes} - Updated on ${new Date().toISOString()}`
    };
    
    await client.put(`/api/suppliers/${supplierId}`, updateData);
    
    // Step 4: Get the updated supplier
    await client.get(`/api/suppliers/${supplierId}`);
    
    // Step 5: Delete the supplier
    await client.delete(`/api/suppliers/${supplierId}`);
    
    // Step 6: Verify deletion (should return 404)
    try {
      await client.get(`/api/suppliers/${supplierId}`);
    } catch (error) {
      // Expected 404 error - this is good
      if (error.response && error.response.status === 404) {
        // This is the expected outcome
      } else {
        // Unexpected error, rethrow
        throw error;
      }
    }
  } catch (error) {
    // Log the error and rethrow
    console.error(`CRUD scenario failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  run
}; 