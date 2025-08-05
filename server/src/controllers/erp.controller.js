/**
 * ERP Controller
 * 
 * This controller handles API endpoints for ERP system integration.
 */

const erpService = require('../services/erp/erp-service');
const logger = require('../utils/logger');

/**
 * Get vendors/suppliers from ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getVendors = async (req, res) => {
  try {
    const params = {
      filter: req.query.filter,
      limit: req.query.limit,
      offset: req.query.offset,
      vendorType: req.query.vendorType
    };
    
    const vendors = await erpService.getVendors(params);
    
    res.json({
      success: true,
      count: vendors.length,
      data: vendors
    });
  } catch (error) {
    logger.error(`Error getting vendors from ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors from ERP system',
      error: error.message
    });
  }
};

/**
 * Get inventory items from ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getInventory = async (req, res) => {
  try {
    const params = {
      filter: req.query.filter,
      limit: req.query.limit,
      offset: req.query.offset
    };
    
    const inventory = await erpService.getInventory(params);
    
    res.json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    logger.error(`Error getting inventory from ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory from ERP system',
      error: error.message
    });
  }
};

/**
 * Get purchase orders from ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getPurchaseOrders = async (req, res) => {
  try {
    const params = {
      filter: req.query.filter,
      limit: req.query.limit,
      offset: req.query.offset
    };
    
    const purchaseOrders = await erpService.getPurchaseOrders(params);
    
    res.json({
      success: true,
      count: purchaseOrders.length,
      data: purchaseOrders
    });
  } catch (error) {
    logger.error(`Error getting purchase orders from ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders from ERP system',
      error: error.message
    });
  }
};

/**
 * Get quality inspections from ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const getQualityInspections = async (req, res) => {
  try {
    const params = {
      filter: req.query.filter,
      limit: req.query.limit,
      offset: req.query.offset
    };
    
    const inspections = await erpService.getQualityInspections(params);
    
    res.json({
      success: true,
      count: inspections.length,
      data: inspections
    });
  } catch (error) {
    logger.error(`Error getting quality inspections from ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quality inspections from ERP system',
      error: error.message
    });
  }
};

/**
 * Create a vendor/supplier in the ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createVendor = async (req, res) => {
  try {
    const vendor = req.body;
    
    // Validate required fields
    if (!vendor.name) {
      return res.status(400).json({
        success: false,
        message: 'Vendor name is required'
      });
    }
    
    const result = await erpService.createVendor(vendor);
    
    res.status(201).json({
      success: true,
      message: 'Vendor created successfully in ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error creating vendor in ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create vendor in ERP system',
      error: error.message
    });
  }
};

/**
 * Update a vendor/supplier in the ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = req.body;
    
    const result = await erpService.updateVendor(id, vendor);
    
    res.json({
      success: true,
      message: 'Vendor updated successfully in ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error updating vendor in ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor in ERP system',
      error: error.message
    });
  }
};

/**
 * Create a purchase order in the ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = req.body;
    
    // Validate required fields
    if (!purchaseOrder.vendorCode && !purchaseOrder.supplier) {
      return res.status(400).json({
        success: false,
        message: 'Vendor/supplier information is required'
      });
    }
    
    const result = await erpService.createPurchaseOrder(purchaseOrder);
    
    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully in ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error creating purchase order in ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order in ERP system',
      error: error.message
    });
  }
};

/**
 * Update a purchase order in the ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = req.body;
    
    const result = await erpService.updatePurchaseOrder(id, purchaseOrder);
    
    res.json({
      success: true,
      message: 'Purchase order updated successfully in ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error updating purchase order in ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order in ERP system',
      error: error.message
    });
  }
};

/**
 * Create a quality inspection in the ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const createQualityInspection = async (req, res) => {
  try {
    const inspection = req.body;
    
    // Validate required fields
    if (!inspection.type || !inspection.supplierCode) {
      return res.status(400).json({
        success: false,
        message: 'Inspection type and supplier information are required'
      });
    }
    
    const result = await erpService.createQualityInspection(inspection);
    
    res.status(201).json({
      success: true,
      message: 'Quality inspection created successfully in ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error creating quality inspection in ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create quality inspection in ERP system',
      error: error.message
    });
  }
};

/**
 * Update a quality inspection in the ERP system
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const updateQualityInspection = async (req, res) => {
  try {
    const { id } = req.params;
    const inspection = req.body;
    
    const result = await erpService.updateQualityInspection(id, inspection);
    
    res.json({
      success: true,
      message: 'Quality inspection updated successfully in ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error updating quality inspection in ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update quality inspection in ERP system',
      error: error.message
    });
  }
};

/**
 * Sync suppliers from AeroSuite to ERP
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const syncSuppliersToERP = async (req, res) => {
  try {
    const options = {
      filter: req.body.filter || {}
    };
    
    const result = await erpService.syncSuppliersToERP(options);
    
    res.json({
      success: true,
      message: 'Suppliers synced successfully to ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error syncing suppliers to ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to sync suppliers to ERP system',
      error: error.message
    });
  }
};

/**
 * Sync inspections from AeroSuite to ERP
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const syncInspectionsToERP = async (req, res) => {
  try {
    const options = {
      filter: req.body.filter || {}
    };
    
    const result = await erpService.syncInspectionsToERP(options);
    
    res.json({
      success: true,
      message: 'Inspections synced successfully to ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error syncing inspections to ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to sync inspections to ERP system',
      error: error.message
    });
  }
};

/**
 * Sync vendors from ERP to AeroSuite
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const syncVendorsFromERP = async (req, res) => {
  try {
    const options = {
      params: req.body.params || {}
    };
    
    const result = await erpService.syncVendorsFromERP(options);
    
    res.json({
      success: true,
      message: 'Vendors synced successfully from ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error syncing vendors from ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to sync vendors from ERP system',
      error: error.message
    });
  }
};

/**
 * Sync inventory from ERP to AeroSuite
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const syncInventoryFromERP = async (req, res) => {
  try {
    const options = {
      params: req.body.params || {}
    };
    
    const result = await erpService.syncInventoryFromERP(options);
    
    res.json({
      success: true,
      message: 'Inventory synced successfully from ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error syncing inventory from ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to sync inventory from ERP system',
      error: error.message
    });
  }
};

/**
 * Sync purchase orders from ERP to AeroSuite
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
const syncPurchaseOrdersFromERP = async (req, res) => {
  try {
    const options = {
      params: req.body.params || {}
    };
    
    const result = await erpService.syncPurchaseOrdersFromERP(options);
    
    res.json({
      success: true,
      message: 'Purchase orders synced successfully from ERP system',
      data: result
    });
  } catch (error) {
    logger.error(`Error syncing purchase orders from ERP: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to sync purchase orders from ERP system',
      error: error.message
    });
  }
};

module.exports = {
  getVendors,
  getInventory,
  getPurchaseOrders,
  getQualityInspections,
  createVendor,
  updateVendor,
  createPurchaseOrder,
  updatePurchaseOrder,
  createQualityInspection,
  updateQualityInspection,
  syncSuppliersToERP,
  syncInspectionsToERP,
  syncVendorsFromERP,
  syncInventoryFromERP,
  syncPurchaseOrdersFromERP
}; 