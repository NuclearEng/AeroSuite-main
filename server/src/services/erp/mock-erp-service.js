/**
 * Mock ERP Service
 * 
 * This service provides a mock implementation of the ERP service
 * for development and testing purposes.
 */

const BaseERPService = require('./base-erp-service');
const logger = require('../../utils/logger');
const { faker } = require('@faker-js/faker');

// Seed faker for consistent data
faker.seed(12345);

class MockERPService extends BaseERPService {
  constructor() {
    super('mock');
    this.mockData = this.generateMockData();
    logger.info('MockERPService initialized with mock data');
  }
  
  /**
   * Generate mock data for testing
   * 
   * @returns {Object} - Mock data
   */
  generateMockData() {
    return {
      inventory: this.generateMockInventory(50),
      purchaseOrders: this.generateMockPurchaseOrders(30),
      vendors: this.generateMockVendors(25),
      productionOrders: this.generateMockProductionOrders(20),
      qualityInspections: this.generateMockQualityInspections(40)
    };
  }
  
  /**
   * Generate mock inventory items
   * 
   * @param {number} count - Number of items to generate
   * @returns {Array} - Mock inventory items
   */
  generateMockInventory(count) {
    const items = [];
    
    for (let i = 0; i < count; i++) {
      const itemCode = `ITEM${i.toString().padStart(4, '0')}`;
      
      items.push({
        id: i + 1,
        itemCode,
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        category: faker.commerce.department(),
        uom: faker.helpers.arrayElement(['EA', 'KG', 'M', 'L', 'BOX']),
        quantity: faker.number.int({ min: 0, max: 1000 }),
        reorderPoint: faker.number.int({ min: 5, max: 50 }),
        unitCost: parseFloat(faker.commerce.price({ min: 1, max: 500 })),
        supplier: faker.helpers.arrayElement(['SUP0001', 'SUP0002', 'SUP0003', 'SUP0004', 'SUP0005']),
        location: faker.helpers.arrayElement(['WAREHOUSE-A', 'WAREHOUSE-B', 'WAREHOUSE-C']),
        lastUpdated: faker.date.recent({ days: 30 })
      });
    }
    
    return items;
  }
  
  /**
   * Generate mock purchase orders
   * 
   * @param {number} count - Number of purchase orders to generate
   * @returns {Array} - Mock purchase orders
   */
  generateMockPurchaseOrders(count) {
    const orders = [];
    
    for (let i = 0; i < count; i++) {
      const id = i + 1;
      const poNumber = `PO${id.toString().padStart(5, '0')}`;
      const itemCount = faker.number.int({ min: 1, max: 5 });
      const items = [];
      
      for (let j = 0; j < itemCount; j++) {
        items.push({
          id: j + 1,
          itemCode: `ITEM${faker.number.int({ min: 0, max: 9999 }).toString().padStart(4, '0')}`,
          description: faker.commerce.productName(),
          quantity: faker.number.int({ min: 1, max: 100 }),
          unitPrice: parseFloat(faker.commerce.price({ min: 1, max: 500 })),
          totalPrice: 0 // Will be calculated below
        });
      }
      
      // Calculate item totals
      items.forEach(item => {
        item.totalPrice = item.quantity * item.unitPrice;
      });
      
      // Calculate PO total
      const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      orders.push({
        id,
        poNumber,
        vendor: faker.helpers.arrayElement(['SUP0001', 'SUP0002', 'SUP0003', 'SUP0004', 'SUP0005']),
        vendorName: faker.company.name(),
        date: faker.date.recent({ days: 60 }),
        dueDate: faker.date.future({ days: 30, refDate: new Date() }),
        status: faker.helpers.arrayElement(['draft', 'submitted', 'approved', 'received', 'closed']),
        total,
        currency: 'USD',
        items,
        notes: faker.lorem.sentence(),
        createdBy: faker.person.fullName(),
        createdAt: faker.date.recent({ days: 60 })
      });
    }
    
    return orders;
  }
  
  /**
   * Generate mock vendors
   * 
   * @param {number} count - Number of vendors to generate
   * @returns {Array} - Mock vendors
   */
  generateMockVendors(count) {
    const vendors = [];
    
    for (let i = 0; i < count; i++) {
      const id = i + 1;
      const code = `SUP${id.toString().padStart(4, '0')}`;
      
      vendors.push({
        id,
        code,
        name: faker.company.name(),
        contactName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        address: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: faker.location.country()
        },
        website: faker.internet.url(),
        type: faker.helpers.arrayElement(['manufacturer', 'distributor', 'service']),
        status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
        taxId: faker.number.int({ min: 100000000, max: 999999999 }).toString(),
        paymentTerms: faker.helpers.arrayElement(['Net 30', 'Net 45', 'Net 60']),
        notes: faker.lorem.sentence(),
        qualificationStatus: faker.helpers.arrayElement(['qualified', 'pending', 'disqualified']),
        rating: faker.number.int({ min: 1, max: 5 }),
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent({ days: 30 })
      });
    }
    
    return vendors;
  }
  
  /**
   * Generate mock production orders
   * 
   * @param {number} count - Number of production orders to generate
   * @returns {Array} - Mock production orders
   */
  generateMockProductionOrders(count) {
    const orders = [];
    
    for (let i = 0; i < count; i++) {
      const id = i + 1;
      const orderNumber = `WO${id.toString().padStart(5, '0')}`;
      
      orders.push({
        id,
        orderNumber,
        itemCode: `ITEM${faker.number.int({ min: 0, max: 9999 }).toString().padStart(4, '0')}`,
        itemDescription: faker.commerce.productName(),
        quantity: faker.number.int({ min: 10, max: 1000 }),
        status: faker.helpers.arrayElement(['planned', 'released', 'in_progress', 'completed', 'closed']),
        startDate: faker.date.recent({ days: 30 }),
        endDate: faker.date.future({ days: 30 }),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
        notes: faker.lorem.sentence(),
        responsible: faker.person.fullName(),
        location: faker.helpers.arrayElement(['PLANT-A', 'PLANT-B', 'PLANT-C']),
        createdAt: faker.date.recent({ days: 60 }),
        updatedAt: faker.date.recent({ days: 30 })
      });
    }
    
    return orders;
  }
  
  /**
   * Generate mock quality inspections
   * 
   * @param {number} count - Number of inspections to generate
   * @returns {Array} - Mock quality inspections
   */
  generateMockQualityInspections(count) {
    const inspections = [];
    
    for (let i = 0; i < count; i++) {
      const id = i + 1;
      const inspectionNumber = `QC${id.toString().padStart(5, '0')}`;
      
      inspections.push({
        id,
        inspectionNumber,
        type: faker.helpers.arrayElement(['incoming', 'in-process', 'final', 'supplier']),
        itemCode: `ITEM${faker.number.int({ min: 0, max: 9999 }).toString().padStart(4, '0')}`,
        itemDescription: faker.commerce.productName(),
        supplierCode: faker.helpers.arrayElement(['SUP0001', 'SUP0002', 'SUP0003', 'SUP0004', 'SUP0005']),
        supplierName: faker.company.name(),
        quantity: faker.number.int({ min: 1, max: 100 }),
        sampleSize: faker.number.int({ min: 1, max: 20 }),
        inspector: faker.person.fullName(),
        date: faker.date.recent({ days: 30 }),
        result: faker.helpers.arrayElement(['passed', 'failed', 'pending']),
        status: faker.helpers.arrayElement(['draft', 'in_progress', 'completed', 'cancelled']),
        notes: faker.lorem.sentence(),
        defects: faker.number.int({ min: 0, max: 10 }),
        createdAt: faker.date.recent({ days: 60 }),
        updatedAt: faker.date.recent({ days: 30 })
      });
    }
    
    return inspections;
  }
  
  /**
   * Simulate a delay for mock API responses
   * 
   * @returns {Promise<void>}
   */
  async simulateDelay() {
    const delayMs = this.config.delayMs || 200;
    return new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  /**
   * Authenticate with the mock API (no-op)
   * 
   * @returns {Promise<void>}
   */
  async authenticate() {
    logger.info('Mock ERP authentication successful (simulated)');
    return Promise.resolve();
  }
  
  /**
   * Get inventory data from mock ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Inventory items
   */
  async getInventory(params = {}) {
    await this.simulateDelay();
    
    let items = [...this.mockData.inventory];
    
    // Apply filtering if provided
    if (params.filter) {
      const filter = params.filter.toLowerCase();
      items = items.filter(item => 
        item.itemCode.toLowerCase().includes(filter) ||
        item.name.toLowerCase().includes(filter) ||
        item.description.toLowerCase().includes(filter)
      );
    }
    
    // Apply pagination
    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      const offset = parseInt(params.offset, 10) || 0;
      items = items.slice(offset, offset + limit);
    }
    
    logger.info(`Mock ERP: Retrieved ${items.length} inventory items`);
    return items;
  }
  
  /**
   * Get purchase orders from mock ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Purchase orders
   */
  async getPurchaseOrders(params = {}) {
    await this.simulateDelay();
    
    let orders = [...this.mockData.purchaseOrders];
    
    // Apply filtering if provided
    if (params.filter) {
      const filter = params.filter.toLowerCase();
      orders = orders.filter(order => 
        order.poNumber.toLowerCase().includes(filter) ||
        order.vendorName.toLowerCase().includes(filter) ||
        order.status.toLowerCase().includes(filter)
      );
    }
    
    // Apply pagination
    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      const offset = parseInt(params.offset, 10) || 0;
      orders = orders.slice(offset, offset + limit);
    }
    
    logger.info(`Mock ERP: Retrieved ${orders.length} purchase orders`);
    return orders;
  }
  
  /**
   * Get vendor/supplier data from mock ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Vendors
   */
  async getVendors(params = {}) {
    await this.simulateDelay();
    
    let vendors = [...this.mockData.vendors];
    
    // Apply filtering if provided
    if (params.filter) {
      const filter = params.filter.toLowerCase();
      vendors = vendors.filter(vendor => 
        vendor.code.toLowerCase().includes(filter) ||
        vendor.name.toLowerCase().includes(filter) ||
        vendor.email.toLowerCase().includes(filter) ||
        vendor.status.toLowerCase().includes(filter)
      );
    }
    
    // Filter by vendor type if provided
    if (params.vendorType) {
      vendors = vendors.filter(vendor => vendor.type === params.vendorType);
    }
    
    // Apply pagination
    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      const offset = parseInt(params.offset, 10) || 0;
      vendors = vendors.slice(offset, offset + limit);
    }
    
    logger.info(`Mock ERP: Retrieved ${vendors.length} vendors`);
    return vendors;
  }
  
  /**
   * Get production orders from mock ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Production orders
   */
  async getProductionOrders(params = {}) {
    await this.simulateDelay();
    
    let orders = [...this.mockData.productionOrders];
    
    // Apply filtering if provided
    if (params.filter) {
      const filter = params.filter.toLowerCase();
      orders = orders.filter(order => 
        order.orderNumber.toLowerCase().includes(filter) ||
        order.itemDescription.toLowerCase().includes(filter) ||
        order.status.toLowerCase().includes(filter)
      );
    }
    
    // Apply pagination
    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      const offset = parseInt(params.offset, 10) || 0;
      orders = orders.slice(offset, offset + limit);
    }
    
    logger.info(`Mock ERP: Retrieved ${orders.length} production orders`);
    return orders;
  }
  
  /**
   * Get quality inspection data from mock ERP
   * 
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} - Quality inspections
   */
  async getQualityInspections(params = {}) {
    await this.simulateDelay();
    
    let inspections = [...this.mockData.qualityInspections];
    
    // Apply filtering if provided
    if (params.filter) {
      const filter = params.filter.toLowerCase();
      inspections = inspections.filter(inspection => 
        inspection.inspectionNumber.toLowerCase().includes(filter) ||
        inspection.itemDescription.toLowerCase().includes(filter) ||
        inspection.supplierName.toLowerCase().includes(filter) ||
        inspection.status.toLowerCase().includes(filter) ||
        inspection.result.toLowerCase().includes(filter)
      );
    }
    
    // Apply pagination
    if (params.limit) {
      const limit = parseInt(params.limit, 10);
      const offset = parseInt(params.offset, 10) || 0;
      inspections = inspections.slice(offset, offset + limit);
    }
    
    logger.info(`Mock ERP: Retrieved ${inspections.length} quality inspections`);
    return inspections;
  }
  
  /**
   * Create a purchase order in the mock ERP system
   * 
   * @param {Object} purchaseOrder - Purchase order data
   * @returns {Promise<Object>} - Created purchase order
   */
  async createPurchaseOrder(purchaseOrder) {
    await this.simulateDelay();
    
    const id = this.mockData.purchaseOrders.length + 1;
    const poNumber = `PO${id.toString().padStart(5, '0')}`;
    
    const newPO = {
      id,
      poNumber,
      vendor: purchaseOrder.vendorCode,
      vendorName: purchaseOrder.vendorName || 'Vendor Name',
      date: purchaseOrder.date || new Date(),
      dueDate: purchaseOrder.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'draft',
      total: 0,
      currency: 'USD',
      items: [],
      notes: purchaseOrder.notes || '',
      createdBy: purchaseOrder.createdBy || 'System',
      createdAt: new Date()
    };
    
    // Process items if provided
    if (purchaseOrder.items && Array.isArray(purchaseOrder.items)) {
      newPO.items = purchaseOrder.items.map((item, index) => ({
        id: index + 1,
        itemCode: item.itemCode,
        description: item.description || `Item ${index + 1}`,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        totalPrice: (item.quantity || 1) * (item.unitPrice || 0)
      }));
      
      // Calculate PO total
      newPO.total = newPO.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    
    this.mockData.purchaseOrders.push(newPO);
    
    logger.info(`Mock ERP: Created purchase order ${poNumber}`);
    return newPO;
  }
  
  /**
   * Update a purchase order in the mock ERP system
   * 
   * @param {string} id - Purchase order ID
   * @param {Object} purchaseOrder - Updated purchase order data
   * @returns {Promise<Object>} - Updated purchase order
   */
  async updatePurchaseOrder(id, purchaseOrder) {
    await this.simulateDelay();
    
    const index = this.mockData.purchaseOrders.findIndex(po => po.id.toString() === id.toString());
    
    if (index === -1) {
      throw new Error(`Purchase order with ID ${id} not found`);
    }
    
    const existingPO = this.mockData.purchaseOrders[index];
    
    // Update fields
    const updatedPO = {
      ...existingPO,
      ...purchaseOrder,
      id: existingPO.id,
      poNumber: existingPO.poNumber,
      updatedAt: new Date()
    };
    
    // Recalculate totals if items were updated
    if (purchaseOrder.items && Array.isArray(purchaseOrder.items)) {
      updatedPO.items = purchaseOrder.items.map((item, index) => ({
        id: index + 1,
        itemCode: item.itemCode,
        description: item.description || `Item ${index + 1}`,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        totalPrice: (item.quantity || 1) * (item.unitPrice || 0)
      }));
      
      updatedPO.total = updatedPO.items.reduce((sum, item) => sum + item.totalPrice, 0);
    }
    
    this.mockData.purchaseOrders[index] = updatedPO;
    
    logger.info(`Mock ERP: Updated purchase order ${updatedPO.poNumber}`);
    return updatedPO;
  }
  
  /**
   * Create a vendor/supplier in the mock ERP system
   * 
   * @param {Object} supplier - Vendor data
   * @returns {Promise<Object>} - Created vendor
   */
  async createVendor(supplier) {
    await this.simulateDelay();
    
    const id = this.mockData.vendors.length + 1;
    const code = supplier.code || `SUP${id.toString().padStart(4, '0')}`;
    
    const newVendor = {
      id,
      code,
      name: supplier.name,
      contactName: supplier.contactPerson || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || {},
      website: supplier.website || '',
      type: supplier.type || 'supplier',
      status: supplier.status || 'active',
      notes: supplier.notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.mockData.vendors.push(newVendor);
    
    logger.info(`Mock ERP: Created vendor ${code}`);
    return newVendor;
  }
  
  /**
   * Update a vendor/supplier in the mock ERP system
   * 
   * @param {string} id - Vendor ID
   * @param {Object} supplier - Updated vendor data
   * @returns {Promise<Object>} - Updated vendor
   */
  async updateVendor(id, supplier) {
    await this.simulateDelay();
    
    // First try to find by ID
    let index = this.mockData.vendors.findIndex(vendor => vendor.id.toString() === id.toString());
    
    // If not found, try to find by code
    if (index === -1) {
      index = this.mockData.vendors.findIndex(vendor => vendor.code === id);
    }
    
    if (index === -1) {
      throw new Error(`Vendor with ID/code ${id} not found`);
    }
    
    const existingVendor = this.mockData.vendors[index];
    
    // Update fields
    const updatedVendor = {
      ...existingVendor,
      ...supplier,
      id: existingVendor.id,
      code: existingVendor.code,
      updatedAt: new Date()
    };
    
    this.mockData.vendors[index] = updatedVendor;
    
    logger.info(`Mock ERP: Updated vendor ${updatedVendor.code}`);
    return updatedVendor;
  }
  
  /**
   * Create a quality inspection in the mock ERP system
   * 
   * @param {Object} inspection - Inspection data
   * @returns {Promise<Object>} - Created inspection
   */
  async createQualityInspection(inspection) {
    await this.simulateDelay();
    
    const id = this.mockData.qualityInspections.length + 1;
    const inspectionNumber = `QC${id.toString().padStart(5, '0')}`;
    
    const newInspection = {
      id,
      inspectionNumber,
      type: inspection.type || 'incoming',
      itemCode: inspection.itemCode || '',
      itemDescription: inspection.itemDescription || '',
      supplierCode: inspection.supplierCode || '',
      supplierName: inspection.supplierName || '',
      quantity: inspection.quantity || 1,
      sampleSize: inspection.sampleSize || 1,
      inspector: inspection.inspector || '',
      date: inspection.date || new Date(),
      result: inspection.result || 'pending',
      status: inspection.status || 'draft',
      notes: inspection.notes || '',
      defects: inspection.defects || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.mockData.qualityInspections.push(newInspection);
    
    logger.info(`Mock ERP: Created quality inspection ${inspectionNumber}`);
    return newInspection;
  }
  
  /**
   * Update a quality inspection in the mock ERP system
   * 
   * @param {string} id - Inspection ID
   * @param {Object} inspection - Updated inspection data
   * @returns {Promise<Object>} - Updated inspection
   */
  async updateQualityInspection(id, inspection) {
    await this.simulateDelay();
    
    const index = this.mockData.qualityInspections.findIndex(insp => insp.id.toString() === id.toString());
    
    if (index === -1) {
      throw new Error(`Quality inspection with ID ${id} not found`);
    }
    
    const existingInspection = this.mockData.qualityInspections[index];
    
    // Update fields
    const updatedInspection = {
      ...existingInspection,
      ...inspection,
      id: existingInspection.id,
      inspectionNumber: existingInspection.inspectionNumber,
      updatedAt: new Date()
    };
    
    this.mockData.qualityInspections[index] = updatedInspection;
    
    logger.info(`Mock ERP: Updated quality inspection ${updatedInspection.inspectionNumber}`);
    return updatedInspection;
  }
  
  /**
   * Sync data from AeroSuite to mock ERP
   * 
   * @param {string} entity - Entity type (suppliers, inspections)
   * @param {Array} data - Data to sync
   * @returns {Promise<Object>} - Sync results
   */
  async syncToERP(entity, data) {
    await this.simulateDelay();
    
    logger.info(`Mock ERP: Syncing ${data.length} ${entity} to ERP`);
    
    // Simulate sync process
    const successCount = Math.floor(data.length * 0.95); // 95% success rate
    const errorCount = data.length - successCount;
    
    const errors = [];
    for (let i = 0; i < errorCount; i++) {
      const randomIndex = Math.floor(Math.random() * data.length);
      const item = data[randomIndex];
      errors.push({
        item: item.id || item.code || `Item ${randomIndex}`,
        error: 'Simulated sync error'
      });
    }
    
    return {
      success: true,
      message: `Successfully synced ${successCount} of ${data.length} ${entity} to ERP`,
      data: {
        entity,
        totalCount: data.length,
        successCount,
        errorCount,
        errors,
        newCount: Math.floor(successCount * 0.3), // 30% new
        updatedCount: Math.floor(successCount * 0.7) // 70% updated
      }
    };
  }
  
  /**
   * Sync data from mock ERP to AeroSuite
   * 
   * @param {string} entity - Entity type (vendors, inventory, purchaseOrders)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Sync results
   */
  async syncFromERP(entity, params = {}) {
    await this.simulateDelay();
    
    let data = [];
    
    switch (entity) {
      case 'vendors':
        data = await this.getVendors(params);
        break;
      case 'inventory':
        data = await this.getInventory(params);
        break;
      case 'purchaseOrders':
        data = await this.getPurchaseOrders(params);
        break;
      default:
        throw new Error(`Unsupported entity type: ${entity}`);
    }
    
    logger.info(`Mock ERP: Synced ${data.length} ${entity} from ERP`);
    
    return {
      success: true,
      message: `Successfully retrieved ${data.length} ${entity} from ERP`,
      data
    };
  }
}

module.exports = new MockERPService(); 