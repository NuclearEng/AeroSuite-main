const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Supplier = require('../models/supplier.model');
const Customer = require('../models/customer.model');
const Inspection = require('../models/inspection.model');
const Component = require('../models/component.model');
const { BadRequestError, NotFoundError } = require('../utils/errorHandler');
const analyticsService = require('../services/analytics.service');
const notificationService = require('../services/notification.service');
const { executeOptimizedQuery } = require('../utils/queryOptimizer');

/**
 * Get all suppliers with pagination, filtering and sorting
 * @route GET /api/suppliers
 * @access Private
 */
exports.getSuppliers = async (req, res) => {
  try {
    // Parse query parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const sortField = req.query.sortField || 'name';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const skip = (page - 1) * limit;
    
    // Build filter conditions
    const filter = {};
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { primaryContactName: searchRegex },
        { primaryContactEmail: searchRegex }
      ];
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.customerId) {
      filter.customers = mongoose.Types.ObjectId(req.query.customerId);
    }
    
    if (req.query.industry) {
      filter.industry = req.query.industry;
    }
    
    // Execute optimized query with pagination
    const suppliers = await executeOptimizedQuery(Supplier, 'find', filter, {
      sort: { [sortField]: sortOrder },
      skip,
      limit,
      populate: [{ path: 'customers', select: 'name code' }]
    });
    
    // Get total count for pagination using optimized query
    const total = await executeOptimizedQuery(Supplier, 'count', filter);
    
    res.status(200).json({
      suppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting suppliers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get supplier by ID
 * @route GET /api/suppliers/:id
 * @access Private
 */
exports.getSupplier = async (req, res) => {
  try {
    // Use executeOptimizedQuery for better performance
    const supplier = await executeOptimizedQuery(Supplier, 'findById', req.params.id, {
      populate: [{ path: 'customers', select: 'name code status logo' }]
    });
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Get recent inspections for this supplier with optimized query
    const recentInspections = await executeOptimizedQuery(Inspection, 'find', 
      { supplier: req.params.id }, 
      {
        sort: { scheduledDate: -1 },
        limit: 5,
        populate: [{ path: 'customer', select: 'name code' }]
      }
    );
    
    // Get components supplied by this supplier with optimized query
    const components = await executeOptimizedQuery(Component, 'find', 
      { supplier: req.params.id }, 
      {
        sort: { createdAt: -1 },
        limit: 10
      }
    );
    
    // Calculate inspection stats with optimized aggregation
    const inspectionStats = await executeOptimizedQuery(Inspection, 'aggregate', [
      { $match: { supplier: mongoose.Types.ObjectId(req.params.id) } },
      { $group: {
          _id: '$result',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const stats = {
      inspections: {
        total: 0,
        pass: 0,
        fail: 0,
        conditional: 0,
        pending: 0
      },
      components: components.length
    };
    
    inspectionStats.forEach(stat => {
      stats.inspections.total += stat.count;
      if (stat._id === 'pass') stats.inspections.pass = stat.count;
      if (stat._id === 'fail') stats.inspections.fail = stat.count;
      if (stat._id === 'conditional') stats.inspections.conditional = stat.count;
      if (stat._id === 'pending') stats.inspections.pending = stat.count;
    });
    
    res.status(200).json({
      supplier,
      recentInspections,
      components,
      stats
    });
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Create new supplier
 * @route POST /api/suppliers
 * @access Private (Admin, Manager)
 */
exports.createSupplier = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      // Create new supplier using optimized query
      const supplier = await executeOptimizedQuery(Supplier, 'create', {
        ...req.body,
        createdBy: req.user.id
      });
      
      // Create notification for managers and admins
      try {
        await notificationService.createSupplierNotification(supplier, 'created');
      } catch (error) {
        console.error('Error creating supplier notification:', error);
        // Continue execution even if notification fails
      }
      
      // Add supplier to customers using optimized query
      if (req.body.customers && req.body.customers.length > 0) {
        await executeOptimizedQuery(Customer, 'updateMany', 
          { 
            filter: { _id: { $in: req.body.customers } },
            update: { $addToSet: { suppliers: supplier._id } }
          }
        );
      }
      
      res.status(201).json({
        success: true,
        data: supplier
      });
    } catch (err) {
      next(err);
    }
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update supplier
 * @route PUT /api/suppliers/:id
 * @access Private (Admin, Manager)
 */
exports.updateSupplier = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Get the current supplier data
    const supplier = await executeOptimizedQuery(Supplier, 'findById', req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Update supplier fields
    const updateData = {
      ...req.body,
      updatedBy: req.user.id,
      updatedAt: Date.now()
    };
    
    // Update supplier using optimized query
    const updatedSupplier = await executeOptimizedQuery(Supplier, 'findById', req.params.id, {
      new: true,
      runValidators: true
    });
    
    // Handle customer associations updates
    if (req.body.customers) {
      // Get current customers
      const currentCustomers = supplier.customers.map(c => c.toString());
      const newCustomers = req.body.customers.map(c => c.toString());
      
      // Find customers to add and remove
      const customersToAdd = newCustomers.filter(c => !currentCustomers.includes(c));
      const customersToRemove = currentCustomers.filter(c => !newCustomers.includes(c));
      
      // Add supplier to new customers
      if (customersToAdd.length > 0) {
        await executeOptimizedQuery(Customer, 'updateMany', 
          { 
            filter: { _id: { $in: customersToAdd } },
            update: { $addToSet: { suppliers: supplier._id } }
          }
        );
      }
      
      // Remove supplier from old customers
      if (customersToRemove.length > 0) {
        await executeOptimizedQuery(Customer, 'updateMany', 
          { 
            filter: { _id: { $in: customersToRemove } },
            update: { $pull: { suppliers: supplier._id } }
          }
        );
      }
    }
    
    // Create notification
    try {
      await notificationService.createSupplierNotification(updatedSupplier, 'updated');
    } catch (error) {
      console.error('Error creating supplier notification:', error);
      // Continue execution even if notification fails
    }
    
    res.status(200).json({
      success: true,
      data: updatedSupplier
    });
  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Delete supplier
 * @route DELETE /api/suppliers/:id
 * @access Private (Admin)
 */
exports.deleteSupplier = async (req, res) => {
  try {
    // Use optimized query to find the supplier
    const supplier = await executeOptimizedQuery(Supplier, 'findById', req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Check if there are related inspections
    const inspectionCount = await executeOptimizedQuery(Inspection, 'count', { supplier: req.params.id });
    
    if (inspectionCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete supplier with associated inspections. Deactivate instead.' 
      });
    }
    
    // Remove supplier from all customers
    await executeOptimizedQuery(Customer, 'updateMany', 
      { 
        filter: { suppliers: req.params.id },
        update: { $pull: { suppliers: req.params.id } }
      }
    );
    
    // Delete the supplier
    await executeOptimizedQuery(Supplier, 'findById', req.params.id);
    
    // Create notification
    try {
      await notificationService.createSupplierNotification(supplier, 'deleted');
    } catch (error) {
      console.error('Error creating supplier notification:', error);
      // Continue execution even if notification fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get supplier performance metrics
 * @route GET /api/suppliers/:id/metrics
 * @access Private
 */
exports.getSupplierMetrics = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Get period from query params (default to last 6 months)
    const period = req.query.period || '6months';
    
    // Calculate date range based on period
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '3months':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '1year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '2years':
        startDate.setFullYear(startDate.getFullYear() - 2);
        break;
      case '6months':
      default:
        startDate.setMonth(startDate.getMonth() - 6);
        break;
    }
    
    // Get supplier metrics from model method
    const metrics = await supplier.getMetrics();
    
    // Get inspection metrics for this period
    const Inspection = mongoose.model('Inspection');
    
    // Get inspection count by result for the period
    const inspectionResults = await Inspection.aggregate([
      {
        $match: {
          supplierId: mongoose.Types.ObjectId(req.params.id),
          scheduledDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$result',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate on-time delivery rate
    const deliveryStats = await Inspection.aggregate([
      {
        $match: {
          supplierId: mongoose.Types.ObjectId(req.params.id),
          scheduledDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $project: {
          isOnTime: {
            $cond: [
              { $lte: ['$completionDate', '$scheduledDate'] },
              1,
              0
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          totalDeliveries: { $sum: 1 },
          onTimeDeliveries: { $sum: '$isOnTime' }
        }
      }
    ]);
    
    // Calculate defect rate
    const defectStats = await Inspection.aggregate([
      {
        $match: {
          supplierId: mongoose.Types.ObjectId(req.params.id),
          scheduledDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $project: {
          defectCount: { $size: { $ifNull: ['$defects', []] } }
        }
      },
      {
        $group: {
          _id: null,
          totalInspections: { $sum: 1 },
          totalDefects: { $sum: '$defectCount' },
          inspectionsWithDefects: {
            $sum: {
              $cond: [{ $gt: ['$defectCount', 0] }, 1, 0]
            }
          }
        }
      }
    ]);
    
    // Get industry average metrics
    const industryAverages = await Inspection.aggregate([
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplierId',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      {
        $unwind: '$supplier'
      },
      {
        $match: {
          'supplier.category': supplier.category,
          scheduledDate: { $gte: startDate, $lte: endDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$supplierId',
          passRate: {
            $avg: {
              $cond: [{ $eq: ['$result', 'pass'] }, 100, 0]
            }
          },
          inspectionCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          avgPassRate: { $avg: '$passRate' },
          totalSuppliers: { $sum: 1 }
        }
      }
    ]);
    
    // Calculate performance score (0-100)
    const deliveryRate = deliveryStats.length > 0 && deliveryStats[0].totalDeliveries > 0
      ? (deliveryStats[0].onTimeDeliveries / deliveryStats[0].totalDeliveries) * 100
      : 0;
      
    const passRate = metrics.totalInspections > 0
      ? (metrics.passedInspections / metrics.totalInspections) * 100
      : 0;
      
    const defectRate = defectStats.length > 0 && defectStats[0].totalInspections > 0
      ? (defectStats[0].inspectionsWithDefects / defectStats[0].totalInspections) * 100
      : 0;
    
    // Calculate overall performance score with weighted factors
    const performanceScore = (
      (passRate * 0.4) + 
      (deliveryRate * 0.3) + 
      ((100 - defectRate) * 0.3)
    );
    
    // Calculate risk level based on performance score
    let riskLevel = 'low';
    if (performanceScore < 60) {
      riskLevel = 'high';
    } else if (performanceScore < 80) {
      riskLevel = 'medium';
    }
    
    // Format response data
    const performanceData = {
      supplierId: supplier._id,
      metrics: {
        quality: Math.round(passRate),
        delivery: Math.round(deliveryRate),
        defectRate: Math.round(defectRate),
        responsiveness: supplier.communicationRating * 20, // Convert 0-5 scale to 0-100
        cost: supplier.costRating * 20, // Convert 0-5 scale to 0-100
        overallScore: Math.round(performanceScore)
      },
      trends: metrics.monthlyInspections.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        passRate: item.total > 0 ? (item.passed / item.total) * 100 : 0,
        total: item.total
      })),
      industryComparison: {
        qualityScore: Math.round(passRate),
        industryAverage: industryAverages.length > 0 
          ? Math.round(industryAverages[0].avgPassRate) 
          : 0,
        totalSuppliers: industryAverages.length > 0 
          ? industryAverages[0].totalSuppliers 
          : 0
      },
      riskAssessment: {
        overallRisk: riskLevel,
        factors: [
          {
            name: 'Quality Issues',
            level: passRate < 70 ? 'high' : passRate < 90 ? 'medium' : 'low',
            impact: 'high'
          },
          {
            name: 'Delivery Performance',
            level: deliveryRate < 70 ? 'high' : deliveryRate < 90 ? 'medium' : 'low',
            impact: 'high'
          },
          {
            name: 'Defect Rate',
            level: defectRate > 30 ? 'high' : defectRate > 10 ? 'medium' : 'low',
            impact: 'medium'
          }
        ]
      }
    };
    
    res.status(200).json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('Error getting supplier metrics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update supplier rating
 * @route PATCH /api/suppliers/:id/rating
 * @access Private (Admin, Manager)
 */
exports.updateSupplierRating = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const { rating, qualityRating, deliveryRating, communicationRating, notes } = req.body;
    
    // Check if supplier exists
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }
    
    // Create rating entry
    const ratingEntry = {
      overallRating: rating,
      qualityRating,
      deliveryRating,
      communicationRating,
      notes,
      ratedBy: req.user.id,
      ratedAt: new Date()
    };
    
    // Update supplier with new rating
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { ratingHistory: ratingEntry },
        $set: { 
          overallRating: rating,
          qualityRating,
          deliveryRating,
          communicationRating
        }
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json(updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier rating:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 