/**
 * service-discovery-example.js
 * 
 * Example usage of service discovery
 * Implements RF024 - Implement service discovery for microservices
 */

const { 
  ServiceDiscovery, 
  ServiceDiscoveryClient, 
  InMemoryStorageAdapter 
} = require('../core/discovery');

// Example function to demonstrate service discovery usage
async function runServiceDiscoveryExample() {
  console.log('Starting service discovery example...');
  
  // Create storage adapter
  const storageAdapter = new InMemoryStorageAdapter();
  
  // Create service discovery instance with storage adapter
  const discovery = ServiceDiscovery.getInstance({
    storage: storageAdapter,
    heartbeatInterval: 10000,  // 10 seconds
    timeoutThreshold: 30000    // 30 seconds
  });
  
  // Start the service discovery system
  await discovery.start();
  console.log('Service discovery system started');
  
  // Create service discovery clients for different services
  const authServiceClient = new ServiceDiscoveryClient({
    discovery,
    serviceInfo: {
      name: 'auth-service',
      version: '1.0.0',
      host: 'localhost',
      port: 5001,
      protocol: 'http',
      metadata: {
        type: 'core',
        capabilities: ['authentication', 'authorization']
      }
    }
  });
  
  const userServiceClient = new ServiceDiscoveryClient({
    discovery,
    serviceInfo: {
      name: 'user-service',
      version: '1.0.0',
      host: 'localhost',
      port: 5002,
      protocol: 'http',
      metadata: {
        type: 'core',
        capabilities: ['user-management', 'profile']
      }
    }
  });
  
  const notificationServiceClient = new ServiceDiscoveryClient({
    discovery,
    serviceInfo: {
      name: 'notification-service',
      version: '1.0.0',
      host: 'localhost',
      port: 5003,
      protocol: 'http',
      metadata: {
        type: 'support',
        capabilities: ['email', 'push', 'sms']
      }
    }
  });
  
  // Register services
  console.log('Registering services...');
  const authServiceId = await authServiceClient.register();
  console.log(`Auth service registered with ID: ${authServiceId}`);
  
  const userServiceId = await userServiceClient.register();
  console.log(`User service registered with ID: ${userServiceId}`);
  
  const notificationServiceId = await notificationServiceClient.register();
  console.log(`Notification service registered with ID: ${notificationServiceId}`);
  
  // Discover services
  console.log('\nDiscovering all services:');
  const allServices = await discovery.discoverServices();
  console.log(`Found ${allServices.length} services:`);
  allServices.forEach(service => {
    console.log(` - ${service.name} (${service.version}) at ${service.protocol}://${service.host}:${service.port}`);
  });
  
  // Discover services by name
  console.log('\nDiscovering auth services:');
  const authServices = await discovery.discoverServices('auth-service');
  console.log(`Found ${authServices.length} auth services:`);
  authServices.forEach(service => {
    console.log(` - ${service.id}: ${service.protocol}://${service.host}:${service.port}`);
  });
  
  // Discover services by metadata
  console.log('\nDiscovering core services:');
  const coreServices = await discovery.discoverServices(null, {
    metadata: { type: 'core' }
  });
  console.log(`Found ${coreServices.length} core services:`);
  coreServices.forEach(service => {
    console.log(` - ${service.name}: ${service.protocol}://${service.host}:${service.port}`);
  });
  
  // Update service metadata
  console.log('\nUpdating notification service metadata...');
  await notificationServiceClient.updateMetadata({
    capabilities: ['email', 'push', 'sms', 'webhook'],
    status: 'ready'
  });
  console.log('Notification service metadata updated');
  
  // Get service URL using client
  console.log('\nGetting service URLs:');
  const authServiceUrl = await authServiceClient.getServiceUrl('auth-service', '/api/v1/auth');
  console.log(`Auth service URL: ${authServiceUrl}`);
  
  const userServiceUrl = await userServiceClient.getServiceUrl('user-service', '/api/v1/users');
  console.log(`User service URL: ${userServiceUrl}`);
  
  // Demonstrate load balancing
  console.log('\nRegistering multiple instances of the same service for load balancing:');
  
  // Create multiple instances of the same service
  for (let i = 1; i <= 3; i++) {
    const apiServiceClient = new ServiceDiscoveryClient({
      discovery,
      serviceInfo: {
        name: 'api-service',
        version: '1.0.0',
        host: 'api-server',
        port: 8000 + i,
        protocol: 'http',
        metadata: {
          instance: i,
          region: i % 2 === 0 ? 'us-east' : 'us-west'
        }
      }
    });
    
    const serviceId = await apiServiceClient.register();
    console.log(`API service instance ${i} registered with ID: ${serviceId}`);
  }
  
  // Create a client for consuming the API service
  const apiClient = new ServiceDiscoveryClient({ discovery });
  
  // Demonstrate round-robin load balancing
  console.log('\nDemonstrating round-robin load balancing:');
  for (let i = 0; i < 5; i++) {
    const service = await apiClient.getServiceInstance('api-service');
    console.log(`Request ${i + 1} routed to instance ${service.metadata.instance} at ${service.host}:${service.port}`);
  }
  
  // Demonstrate filtering by metadata
  console.log('\nDemonstrating filtering by metadata (us-east region):');
  for (let i = 0; i < 3; i++) {
    const service = await apiClient.getServiceInstance('api-service', {
      filter: {
        metadata: { region: 'us-east' }
      }
    });
    console.log(`Request ${i + 1} routed to instance ${service.metadata.instance} at ${service.host}:${service.port} in ${service.metadata.region}`);
  }
  
  // Deregister a service
  console.log('\nDeregistering notification service...');
  await notificationServiceClient.deregister();
  console.log('Notification service deregistered');
  
  // Verify deregistration
  const remainingServices = await discovery.discoverServices();
  console.log(`\nRemaining services after deregistration: ${remainingServices.length}`);
  remainingServices.forEach(service => {
    console.log(` - ${service.name} (${service.id})`);
  });
  
  // Stop the service discovery system
  console.log('\nStopping service discovery system...');
  await discovery.stop();
  console.log('Service discovery system stopped');
}

// Run the example if this file is executed directly
if (require.main === module) {
  runServiceDiscoveryExample().catch(error => {
    console.error('Error running service discovery example:', error);
  });
}

module.exports = { runServiceDiscoveryExample }; 