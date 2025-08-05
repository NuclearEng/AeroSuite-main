/**
 * Session Persistence Test Scenario
 * 
 * This scenario tests the Redis-based session management implemented in TS350.
 * It verifies that user sessions persist across multiple requests over time,
 * which is essential for horizontal scaling.
 * 
 * Task: TS354 - Load testing implementation
 */

/**
 * Run the session persistence scenario
 * @param {Object} client - HTTP client instance
 * @param {Object} config - Test configuration
 * @returns {Promise<void>}
 */
async function run(client, config) {
  // Generate a unique identifier for this test run
  const testId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  
  try {
    // Step 1: Create a test user or use existing credentials
    const credentials = {
      email: config.auth?.email || `session-test-${testId}@example.com`,
      password: config.auth?.password || 'Test123!@#'
    };
    
    // Create test user if no auth credentials provided
    if (!config.auth) {
      try {
        await client.post('/api/users/register', {
          email: credentials.email,
          password: credentials.password,
          firstName: 'Session',
          lastName: 'Test',
          role: 'user'
        });
        
        // Wait a moment for user creation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // If user already exists, that's fine, we'll try to log in
        console.log(`Could not create test user, attempting login: ${error.message}`);
      }
    }
    
    // Step 2: Login to establish a session
    console.log('Logging in to establish session...');
    const loginResponse = await client.post('/api/auth/login', credentials);
    
    // Get authentication token and session cookie
    const token = loginResponse.data.token;
    client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Save the cookies if they exist
    const cookies = loginResponse.headers['set-cookie'];
    if (cookies) {
      client.defaults.headers.common['Cookie'] = cookies.join('; ');
    }
    
    // Extract session ID from response if available
    const sessionId = loginResponse.data.sessionId || 'unknown';
    console.log(`Established session: ${sessionId}`);
    
    // Step 3: Verify authenticated user profile can be accessed
    console.log('Verifying initial profile access...');
    const initialProfileResponse = await client.get('/api/users/profile');
    console.log(`Initial profile access successful: ${initialProfileResponse.data.email}`);
    
    // Create a resource to verify later
    console.log('Creating a test resource...');
    const supplier = {
      name: `Session Test Supplier ${testId}`,
      email: `session-${testId}@example.com`,
      phone: `555-${Math.floor(1000 + Math.random() * 9000)}`,
      address: {
        street: `${Math.floor(100 + Math.random() * 900)} Session St`,
        city: 'Test City',
        state: 'TS',
        zipCode: `${Math.floor(10000 + Math.random() * 90000)}`,
        country: 'Test Country'
      },
      status: 'active',
      category: 'test',
      notes: `Session test supplier created on ${new Date().toISOString()}`
    };
    
    const createResponse = await client.post('/api/suppliers', supplier);
    const supplierId = createResponse.data.id;
    console.log(`Created resource with ID: ${supplierId}`);
    
    // Step 4: Simulate session inactivity by waiting
    const waitTime = config.sessionWaitTime || 5000; // 5 seconds by default
    console.log(`Waiting ${waitTime/1000} seconds to simulate inactivity...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    // Step 5: Verify session still works after inactivity
    console.log('Verifying session persistence after inactivity...');
    const profileResponse = await client.get('/api/users/profile');
    console.log(`Session persistence confirmed: ${profileResponse.data.email}`);
    
    // Step 6: Access the previously created resource
    console.log('Accessing previously created resource...');
    const getResponse = await client.get(`/api/suppliers/${supplierId}`);
    console.log(`Resource access successful: ${getResponse.data.name}`);
    
    // Step 7: Update the resource to verify write operations
    console.log('Updating the resource...');
    await client.put(`/api/suppliers/${supplierId}`, {
      status: 'inactive',
      notes: `Session test supplier updated after inactivity on ${new Date().toISOString()}`
    });
    console.log('Resource update successful');
    
    // Step 8: Delete the resource
    console.log('Deleting the resource...');
    await client.delete(`/api/suppliers/${supplierId}`);
    console.log('Resource deletion successful');
    
    // Step 9: Verify resource deletion
    try {
      await client.get(`/api/suppliers/${supplierId}`);
      throw new Error('Resource was not deleted');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Resource deletion verified');
      } else {
        throw error;
      }
    }
    
    // Step 10: Logout to clean up
    try {
      await client.post('/api/auth/logout');
      console.log('Logout successful');
    } catch (e) {
      console.log(`Logout error (this may be expected): ${e.message}`);
    }
    
    // Clean up headers
    delete client.defaults.headers.common['Authorization'];
    delete client.defaults.headers.common['Cookie'];
    
    console.log('Session persistence test completed successfully');
  } catch (error) {
    console.error(`Session persistence test failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  run
}; 