/**
 * Stress Test Scenario
 * 
 * This scenario combines multiple operations to stress test the system.
 * It performs authentication, data retrieval, and data mutations in sequence.
 * 
 * Task: TS354 - Load testing implementation
 */

const { runNamedScenario } = require('../utils/scenario-runner');

/**
 * Run the stress test scenario
 * @param {Object} client - HTTP client instance
 * @param {Object} config - Test configuration
 * @returns {Promise<void>}
 */
async function run(client, config) {
  // Generate a unique identifier for this test run
  const testId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  
  try {
    // Step 1: Authentication (if credentials provided)
    if (config.auth) {
      const credentials = {
        email: config.auth.email || 'test@example.com',
        password: config.auth.password || 'testpassword'
      };
      
      // Perform login
      const loginResponse = await client.post('/api/auth/login', credentials);
      
      // Get authentication token
      const token = loginResponse.data.token;
      
      // Update client authorization header
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // Step 2: Load dashboard data (heavy operation)
    await client.get('/api/dashboard');
    
    // Step 3: Get multiple data sources in parallel
    await Promise.all([
      client.get('/api/customers?limit=20'),
      client.get('/api/suppliers?limit=20'),
      client.get('/api/inspections?limit=20')
    ]);
    
    // Step 4: Create a test resource (write operation)
    const newSupplier = {
      name: `Stress Test Supplier ${testId}`,
      email: `stress-${testId}@example.com`,
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
      notes: `Stress test supplier created on ${new Date().toISOString()}`
    };
    
    const createResponse = await client.post('/api/suppliers', newSupplier);
    const supplierId = createResponse.data.id;
    
    // Step 5: Update the created resource
    await client.put(`/api/suppliers/${supplierId}`, {
      status: 'inactive',
      notes: `${newSupplier.notes} - Updated on ${new Date().toISOString()}`
    });
    
    // Step 6: Get detailed data with relationships (heavy query)
    await client.get(`/api/suppliers/${supplierId}?include=inspections,contacts`);
    
    // Step 7: Perform a search operation (CPU intensive)
    await client.get('/api/suppliers/search?q=test');
    
    // Step 8: Delete the test resource
    await client.delete(`/api/suppliers/${supplierId}`);
    
    // Step 9: Logout if we authenticated
    if (config.auth) {
      try {
        await client.post('/api/auth/logout');
      } catch (e) {
        // Ignore logout errors
      }
      
      // Clear authorization header
      delete client.defaults.headers.common['Authorization'];
    }
  } catch (error) {
    // Clean up any created resources if possible
    console.error(`Stress scenario failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  run
}; 