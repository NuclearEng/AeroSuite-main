/**
 * service-interfaces-example.js
 * 
 * Examples of how to use the service interfaces
 * Implements RF022 - Implement service interfaces
 */

// Import the service provider
const ServiceProvider = require('../core/interfaces/ServiceProvider');

// Import specific service interfaces
const SupplierServiceInterface = require('../domains/supplier/interfaces/SupplierServiceInterface');
const CustomerServiceInterface = require('../domains/customer/interfaces/CustomerServiceInterface');
const InspectionServiceInterface = require('../domains/inspection/interfaces/InspectionServiceInterface');
const ComponentServiceInterface = require('../domains/component/interfaces/ComponentServiceInterface');

/**
 * Example of using the service provider
 */
async function serviceProviderExample() {
  console.log('Service Provider Example:');
  
  // Get services using the service provider
  const supplierService = ServiceProvider.getSupplierService();
  const customerService = ServiceProvider.getCustomerService();
  const inspectionService = ServiceProvider.getInspectionService();
  const componentService = ServiceProvider.getComponentService();
  
  // Use the services
  const suppliers = await supplierService.findAll({ limit: 5 });
  console.log(`Found ${suppliers.total} suppliers`);
  
  const customers = await customerService.findAll({ limit: 5 });
  console.log(`Found ${customers.total} customers`);
  
  const inspections = await inspectionService.findAll({ limit: 5 });
  console.log(`Found ${inspections.total} inspections`);
  
  const components = await componentService.findAll({ limit: 5 });
  console.log(`Found ${components.total} components`);
  
  // List all registered services
  const serviceNames = ServiceProvider.getServiceNames();
  console.log('Registered services:', serviceNames);
}

/**
 * Example of using service interfaces directly
 */
async function serviceInterfaceExample() {
  console.log('\nService Interface Example:');
  
  // Get services using the interfaces
  const supplierService = SupplierServiceInterface.getInstance();
  const customerService = CustomerServiceInterface.getInstance();
  const inspectionService = InspectionServiceInterface.getInstance();
  const componentService = ComponentServiceInterface.getInstance();
  
  // Use the services
  const activeSuppliers = await supplierService.getByStatus('active', { limit: 5 });
  console.log(`Found ${activeSuppliers.total} active suppliers`);
  
  const manufacturingCustomers = await customerService.getByIndustry('manufacturing', { limit: 5 });
  console.log(`Found ${manufacturingCustomers.total} manufacturing customers`);
  
  const scheduledInspections = await inspectionService.getByStatus('scheduled', { limit: 5 });
  console.log(`Found ${scheduledInspections.total} scheduled inspections`);
  
  const lowStockComponents = await componentService.getLowStock(10, { limit: 5 });
  console.log(`Found ${lowStockComponents.total} components with low stock`);
}

/**
 * Example of dependency injection with service interfaces
 */
class InspectionController {
  constructor(inspectionService, customerService, supplierService) {
    this.inspectionService = inspectionService;
    this.customerService = customerService;
    this.supplierService = supplierService;
  }
  
  async createInspection(data) {
    // Validate customer exists
    const customer = await this.customerService.findById(data.customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${data.customerId} not found`);
    }
    
    // Validate supplier exists if provided
    if (data.supplierId) {
      const supplier = await this.supplierService.findById(data.supplierId);
      if (!supplier) {
        throw new Error(`Supplier with ID ${data.supplierId} not found`);
      }
    }
    
    // Create inspection
    return this.inspectionService.create(data);
  }
}

/**
 * Example of dependency injection
 */
async function dependencyInjectionExample() {
  console.log('\nDependency Injection Example:');
  
  // Create controller with injected services
  const controller = new InspectionController(
    ServiceProvider.getInspectionService(),
    ServiceProvider.getCustomerService(),
    ServiceProvider.getSupplierService()
  );
  
  // Use the controller
  try {
    const inspection = await controller.createInspection({
      type: 'quality-audit',
      scheduledDate: new Date(),
      customerId: '60d21b4667d0d8992e610c85', // Example ID
      description: 'Annual quality audit'
    });
    
    console.log('Created inspection:', inspection.id);
  } catch (error) {
    console.error('Error creating inspection:', error.message);
  }
}

/**
 * Run all examples
 */
async function runExamples() {
  try {
    await serviceProviderExample();
    await serviceInterfaceExample();
    await dependencyInjectionExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  runExamples();
}

module.exports = {
  serviceProviderExample,
  serviceInterfaceExample,
  dependencyInjectionExample,
  runExamples
}; 