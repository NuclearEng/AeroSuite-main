/**
 * Browsing Test Scenario
 * 
 * This scenario simulates a user browsing through the application,
 * viewing different lists and details pages.
 * 
 * Task: TS354 - Load testing implementation
 */

/**
 * Run the browsing scenario
 * @param {Object} client - HTTP client instance
 * @param {Object} config - Test configuration
 * @returns {Promise<void>}
 */
async function run(client, config) {
  // Step 1: Get customers list
  const customersResponse = await client.get('/api/customers?limit=10&page=1');
  const customers = customersResponse.data.data || [];
  
  // Step 2: If we have customers, view a random customer detail
  if (customers.length > 0) {
    const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
    await client.get(`/api/customers/${randomCustomer.id}`);
  }
  
  // Step 3: Get suppliers list
  const suppliersResponse = await client.get('/api/suppliers?limit=10&page=1');
  const suppliers = suppliersResponse.data.data || [];
  
  // Step 4: If we have suppliers, view a random supplier detail
  if (suppliers.length > 0) {
    const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)];
    await client.get(`/api/suppliers/${randomSupplier.id}`);
  }
  
  // Step 5: Get inspections list
  const inspectionsResponse = await client.get('/api/inspections?limit=10&page=1');
  const inspections = inspectionsResponse.data.data || [];
  
  // Step 6: If we have inspections, view a random inspection detail
  if (inspections.length > 0) {
    const randomInspection = inspections[Math.floor(Math.random() * inspections.length)];
    await client.get(`/api/inspections/${randomInspection.id}`);
  }
  
  // Step 7: Get dashboard data
  await client.get('/api/dashboard');
  
  // Step 8: Get notifications
  await client.get('/api/notifications');
}

module.exports = {
  run
}; 