/**
 * Authentication Test Scenario
 * 
 * This scenario tests the authentication flow by performing
 * login, fetching user data, and logout operations.
 * 
 * Task: TS354 - Load testing implementation
 */

/**
 * Run the authentication scenario
 * @param {Object} client - HTTP client instance
 * @param {Object} config - Test configuration
 * @returns {Promise<void>}
 */
async function run(client, config) {
  // Test credentials (should be configured or generated)
  const credentials = {
    email: config.auth?.email || 'test@example.com',
    password: config.auth?.password || 'testpassword'
  };
  
  // Step 1: Log in
  const loginResponse = await client.post('/api/auth/login', credentials);
  
  // Get authentication token
  const token = loginResponse.data.token;
  
  // Update client authorization header
  client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  // Step 2: Get user profile
  await client.get('/api/users/profile');
  
  // Step 3: Get notifications
  await client.get('/api/notifications');
  
  // Step 4: Logout (optional, depends on API design)
  try {
    await client.post('/api/auth/logout');
  } catch (e) {
    // Ignore logout errors, as some APIs handle this client-side
  }
  
  // Clean up
  delete client.defaults.headers.common['Authorization'];
}

module.exports = {
  run
}; 