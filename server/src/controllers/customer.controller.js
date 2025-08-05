const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Customer = require('../models/customer.model');
const Inspection = require('../models/inspection.model');
const Supplier = require('../models/supplier.model');
const CustomerActivity = require('../models/customerActivity.model');
const { executeOptimizedQuery } = require('../utils/queryOptimizer');

/**
 * Get all customers with pagination, filtering and sorting
 * @route GET /api/customers
 * @access Private
 */
exports.getCustomers = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortField = req.query.sortField || 'name';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.industry) {
      filter.industry = req.query.industry;
    }
    
    if (req.query.serviceLevel) {
      filter.serviceLevel = req.query.serviceLevel;
    }
    
    // Text search
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { code: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { primaryContactName: { $regex: req.query.search, $options: 'i' } },
        { primaryContactEmail: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // For customer users, only show their own customer
    if (req.user.role === 'customer' && req.user.customerId) {
      filter._id = req.user.customerId;
    }
    
    // Execute query with pagination and sorting using optimized query with caching
    const customers = await executeOptimizedQuery(Customer, 'find', filter, {
      sort: { [sortField]: sortOrder },
      skip,
      limit
    });
    
    // Get total count for pagination using optimized query
    const total = await executeOptimizedQuery(Customer, 'count', filter);
    
    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get customer by ID
 * @route GET /api/customers/:id
 * @access Private
 */
exports.getCustomer = async (req, res) => {
  try {
    // Use optimized query with caching
    const customer = await executeOptimizedQuery(Customer, 'findById', req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Check if customer user has access to this customer
    if (req.user.role === 'customer' && req.user.customerId) {
      if (customer._id.toString() !== req.user.customerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this customer'
        });
      }
    }
    
    res.status(200).json({
      success: true,
      data: customer
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create new customer
 * @route POST /api/customers
 * @access Private (Admin, Manager)
 */
exports.createCustomer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const {
      name,
      code,
      description,
      industry,
      status,
      logo,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      billingAddress,
      shippingAddress,
      contractStartDate,
      contractEndDate,
      serviceLevel,
      notes,
      customFields
    } = req.body;
    
    // Check if customer with same name or code already exists using optimized query
    const existingCustomer = await executeOptimizedQuery(Customer, 'findOne', {
      $or: [
        { name },
        { code }
      ]
    });
    
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: existingCustomer.name === name 
          ? 'Customer with this name already exists' 
          : 'Customer with this code already exists'
      });
    }
    
    // Create new customer using optimized query to handle cache invalidation
    const customer = await executeOptimizedQuery(Customer, 'create', {
      name,
      code,
      description,
      industry,
      status,
      logo,
      primaryContactName,
      primaryContactEmail,
      primaryContactPhone,
      billingAddress,
      shippingAddress,
      contractStartDate,
      contractEndDate,
      serviceLevel,
      notes,
      customFields
    });
    
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating customer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update customer by ID
 * @route PUT /api/customers/:id
 * @access Private (Admin, Manager)
 */
exports.updateCustomer = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }
    
    const customerId = req.params.id;
    
    // Find customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Check if customer is trying to update code to an existing one
    if (req.body.code && req.body.code !== customer.code) {
      const existingCustomer = await Customer.findOne({ code: req.body.code });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this code already exists'
        });
      }
    }
    
    // Check if customer is trying to update name to an existing one
    if (req.body.name && req.body.name !== customer.name) {
      const existingCustomer = await Customer.findOne({ name: req.body.name });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'Customer with this name already exists'
        });
      }
    }
    
    // Update fields
    const updatableFields = [
      'name', 'description', 'industry', 'status', 'logo',
      'primaryContactName', 'primaryContactEmail', 'primaryContactPhone',
      'billingAddress', 'shippingAddress', 'contractStartDate',
      'contractEndDate', 'serviceLevel', 'notes', 'customFields'
    ];
    
    // Special case for code field (only admins can change it)
    if (req.body.code && req.user.role === 'admin') {
      customer.code = req.body.code;
    }
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        customer[field] = req.body[field];
      }
    });
    
    await customer.save();
    
    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating customer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete customer by ID
 * @route DELETE /api/customers/:id
 * @access Private (Admin)
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    // Check if customer has associated inspections
    const inspectionCount = await Inspection.countDocuments({ customerId });
    if (inspectionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${inspectionCount} associated inspections`
      });
    }
    
    // Check if customer has associated suppliers
    const supplierCount = await Supplier.countDocuments({ customers: customerId });
    if (supplierCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${supplierCount} associated suppliers`
      });
    }
    
    const customer = await Customer.findByIdAndDelete(customerId);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting customer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get customer metrics
 * @route GET /api/customers/:id/metrics
 * @access Private
 */
exports.getCustomerMetrics = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Check if customer user has access to this customer
    if (req.user.role === 'customer' && req.user.customerId) {
      if (customer._id.toString() !== req.user.customerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this customer'
        });
      }
    }
    
    // Get metrics from customer model method
    const metrics = await customer.getMetrics();
    
    // Get suppliers for this customer
    const suppliers = await Supplier.find({ customers: customerId })
      .select('name code overallRating')
      .sort({ overallRating: -1 });
    
    // Get recent inspections
    const recentInspections = await Inspection.find({ customerId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('supplierId', 'name')
      .select('inspectionNumber title status result scheduledDate completionDate');
    
    // Monthly inspection trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyInspections = await Inspection.aggregate([
      {
        $match: {
          customerId: mongoose.Types.ObjectId(customerId),
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          total: { $sum: 1 },
          passed: {
            $sum: {
              $cond: [{ $eq: ["$result", "pass"] }, 1, 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ["$result", "fail"] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);
    
    // Format monthly data
    const formattedMonthly = monthlyInspections.map(item => {
      const date = new Date(item._id.year, item._id.month - 1, 1);
      return {
        month: date.toLocaleString('default', { month: 'short' }),
        year: item._id.year,
        total: item.total,
        passed: item.passed,
        failed: item.failed,
        passRate: item.total > 0 ? (item.passed / item.total) * 100 : 0
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        metrics,
        suppliers,
        recentInspections,
        monthlyTrend: formattedMonthly
      }
    });
  } catch (error) {
    console.error('Get customer metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get customer inspections
 * @route GET /api/customers/:id/inspections
 * @access Private
 */
exports.getCustomerInspections = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Check if customer user has access to this customer
    if (req.user.role === 'customer' && req.user.customerId) {
      if (customer._id.toString() !== req.user.customerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this customer'
        });
      }
    }
    
    // Parse query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortField = req.query.sortField || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = { customerId };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.result) {
      filter.result = req.query.result;
    }
    
    if (req.query.inspectionType) {
      filter.inspectionType = req.query.inspectionType;
    }
    
    if (req.query.supplierId) {
      filter.supplierId = req.query.supplierId;
    }
    
    // Execute query
    const inspections = await Inspection.find(filter)
      .populate('supplierId', 'name code')
      .populate('inspectedBy', 'firstName lastName')
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);
    
    // Get total count
    const total = await Inspection.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: inspections,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer inspections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer inspections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get customer suppliers
 * @route GET /api/customers/:id/suppliers
 * @access Private
 */
exports.getCustomerSuppliers = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Check if customer user has access to this customer
    if (req.user.role === 'customer' && req.user.customerId) {
      if (customer._id.toString() !== req.user.customerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this customer'
        });
      }
    }
    
    // Parse query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Get suppliers for this customer
    const suppliers = await Supplier.find({ customers: customerId })
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
    
    // Get total count
    const total = await Supplier.countDocuments({ customers: customerId });
    
    res.status(200).json({
      success: true,
      data: suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer suppliers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer suppliers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get customer activity history
 * @route GET /api/customers/:id/activities
 * @access Private
 */
exports.getCustomerActivities = async (req, res) => {
  try {
    const customerId = req.params.id;
    
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }
    
    // Check if customer user has access to this customer
    if (req.user.role === 'customer' && req.user.customerId) {
      if (customer._id.toString() !== req.user.customerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this customer'
        });
      }
    }
    
    // Parse query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Filter by activity type if provided
    const filter = { customerId };
    if (req.query.activityType) {
      filter.activityType = req.query.activityType;
    }
    
    // Get activities
    const activities = await CustomerActivity.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('performedBy', 'firstName lastName avatar')
      .populate('relatedEntities.inspection', 'inspectionNumber title')
      .populate('relatedEntities.supplier', 'name code');
    
    // Get total count
    const total = await CustomerActivity.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get customer activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching customer activities',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}; 