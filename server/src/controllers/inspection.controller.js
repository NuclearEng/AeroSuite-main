const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const Inspection = require('../models/inspection.model');
const Customer = require('../models/customer.model');
const Supplier = require('../models/supplier.model');
const User = require('../models/user.model');
const { sendInspectionNotification, sendInspectionResultNotification } = require('../services/email.service');
const { BadRequestError, NotFoundError, ServerError } = require('../utils/errorHandler');
const analyticsService = require('../services/analytics.service');
const notificationService = require('../services/notification.service');

// Import transporter for direct email sending in updateInspection
const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');

// Create transporter for direct email access
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Get all inspections with pagination, filtering and sorting
 * @route GET /api/inspections
 * @access Private
 */
exports.getInspections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object from query params
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.result) {
      filter.result = req.query.result;
    }
    
    if (req.query.customerId) {
      filter.customerId = req.query.customerId;
    }
    
    if (req.query.supplierId) {
      filter.supplierId = req.query.supplierId;
    }
    
    if (req.query.inspectionType) {
      filter.inspectionType = req.query.inspectionType;
    }
    
    // Date range filtering
    if (req.query.startDate || req.query.endDate) {
      filter.scheduledDate = {};
      
      if (req.query.startDate) {
        filter.scheduledDate.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        filter.scheduledDate.$lte = new Date(req.query.endDate);
      }
    }
    
    // Search by text
    if (req.query.search) {
      filter.$or = [
        { inspectionNumber: { $regex: req.query.search, $options: 'i' } },
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { partNumber: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    // Sort options
    const sortOptions = {};
    if (req.query.sortBy) {
      sortOptions[req.query.sortBy] = req.query.sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by creation date desc
    }
    
    // Execute query with pagination
    const inspections = await Inspection.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('customerId', 'name')
      .populate('supplierId', 'name')
      .populate('inspectedBy', 'firstName lastName');
    
    // Get total count for pagination
    const total = await Inspection.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        inspections,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get inspection by ID
 * @route GET /api/inspections/:id
 * @access Private
 */
exports.getInspection = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('customerId')
      .populate('supplierId')
      .populate('componentId')
      .populate('inspectedBy', 'firstName lastName email');
    
    if (!inspection) {
      return next(new NotFoundError(`Inspection not found with id ${req.params.id}`));
    }
    
    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create new inspection
 * @route POST /api/inspections
 * @access Private
 */
exports.createInspection = async (req, res, next) => {
  try {
    // Validate customer exists
    const customer = await Customer.findById(req.body.customerId);
    if (!customer) {
      return next(new BadRequestError(`Customer not found with id ${req.body.customerId}`));
    }
    
    // Validate supplier exists
    const supplier = await Supplier.findById(req.body.supplierId);
    if (!supplier) {
      return next(new BadRequestError(`Supplier not found with id ${req.body.supplierId}`));
    }
    
    // Create inspection
    const inspection = await Inspection.create({
      ...req.body,
      // Set inspectedBy to current user if not specified
      inspectedBy: req.body.inspectedBy || req.user.id
    });

    // Send email notifications for new inspection
    try {
      // Get inspector details
      const inspector = await User.findById(inspection.inspectedBy);
      const inspectorName = inspector ? `${inspector.firstName} ${inspector.lastName}` : 'Unassigned';

      // Generate a unique inspection number if not provided
      const inspectionNumber = inspection.inspectionNumber || `INS-${inspection._id.toString().substring(0, 8).toUpperCase()}`;
      
      // Send email to customer primary contact
      if (customer.primaryContactEmail) {
        await sendInspectionNotification(
          customer.primaryContactEmail,
          inspectionNumber,
          customer.name,
          supplier.name,
          inspection.inspectionType,
          inspection.scheduledDate,
          inspectorName
        );
      }
      
      // Send email to supplier primary contact
      if (supplier.primaryContactEmail) {
        await sendInspectionNotification(
          supplier.primaryContactEmail,
          inspectionNumber,
          customer.name,
          supplier.name,
          inspection.inspectionType,
          inspection.scheduledDate,
          inspectorName
        );
      }
      
      // Create in-app notifications
      await notificationService.createInspectionNotification(inspection, 'created');
      
    } catch (emailError) {
      console.error('Failed to send notification emails:', emailError);
      // Continue execution even if email fails
    }
    
    // Update analytics
    try {
      analyticsService.recordInspectionCreated(inspection);
    } catch (analyticsError) {
      console.error('Failed to update analytics:', analyticsError);
      // Continue execution even if analytics update fails
    }

    res.status(201).json({
      success: true,
      data: inspection
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update inspection
 * @route PUT /api/inspections/:id
 * @access Private
 */
exports.updateInspection = async (req, res, next) => {
  try {
    // Find existing inspection
    const existingInspection = await Inspection.findById(req.params.id);
    
    if (!existingInspection) {
      return next(new NotFoundError(`Inspection not found with id ${req.params.id}`));
    }
    
    // Check if status is being changed to 'completed'
    const isBeingCompleted = 
      existingInspection.status !== 'completed' && 
      req.body.status === 'completed';
    
    // Check if the result is being updated (only for completed inspections)
    const resultChanged = 
      existingInspection.result !== req.body.result && 
      req.body.result && 
      req.body.status === 'completed';
      
    // Update inspection
    const inspection = await Inspection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customerId')
     .populate('supplierId')
     .populate('inspectedBy');
    
    // Send notifications if inspection is completed or the result has changed
    if (isBeingCompleted || resultChanged) {
      try {
        // Get required information
        const customer = inspection.customerId;
        const supplier = inspection.supplierId;
        const inspector = inspection.inspectedBy;
        
        // Generate a unique inspection number if not provided
        const inspectionNumber = inspection.inspectionNumber || 
          `INS-${inspection._id.toString().substring(0, 8).toUpperCase()}`;
        
        // Inspector name for notification
        const inspectorName = inspector ? 
          `${inspector.firstName} ${inspector.lastName}` : 'Unassigned';
        
        // Count defects if any
        const defectCount = inspection.defects ? inspection.defects.length : 0;
        
        // Send result notification to customer
        if (customer && customer.primaryContactEmail) {
          await sendInspectionResultNotification(
            customer.primaryContactEmail,
            inspectionNumber,
            customer.name,
            supplier.name,
            inspection.result,
            inspection.completionDate || new Date(),
            inspectorName,
            defectCount
          );
        }
        
        // Send result notification to supplier
        if (supplier && supplier.primaryContactEmail) {
          await sendInspectionResultNotification(
            supplier.primaryContactEmail,
            inspectionNumber,
            customer.name,
            supplier.name,
            inspection.result,
            inspection.completionDate || new Date(),
            inspectorName,
            defectCount
          );
        }
        
        // Create in-app notifications for completion
        await notificationService.createInspectionNotification(inspection, 'completed');
        
      } catch (emailError) {
        console.error('Failed to send result notification emails:', emailError);
        // Continue execution even if email fails
      }
    } else if (Object.keys(req.body).length > 0) {
      // It's just a regular update, not a completion
      try {
        // Create in-app notifications for update
        await notificationService.createInspectionNotification(inspection, 'updated');
      } catch (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Continue execution even if notification fails
      }
    }
    
    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete inspection by ID
 * @route DELETE /api/inspections/:id
 * @access Private
 */
exports.deleteInspection = async (req, res) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: 'Inspection not found'
      });
    }
    
    // Only allow deletion of scheduled inspections
    if (inspection.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Only scheduled inspections can be deleted'
      });
    }
    
    // Check if user has permission to delete this inspection
    if (['admin', 'manager'].includes(req.user.role)) {
      await inspection.remove();
      
      res.status(200).json({
        success: true,
        message: 'Inspection deleted successfully'
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete inspections'
      });
    }
  } catch (error) {
    console.error('Delete inspection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting inspection',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get inspection statistics
 * @route GET /api/inspections/stats
 * @access Private
 */
exports.getInspectionStats = async (req, res, next) => {
  try {
    // Base filter
    const filter = {};
    
    // Date range filter
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    // Apply customer filter for customer users
    if (req.user.role === 'customer' && req.user.customerId) {
      filter.customerId = mongoose.Types.ObjectId(req.user.customerId);
    }
    
    // Apply custom filters if provided
    if (req.query.customerId) {
      filter.customerId = mongoose.Types.ObjectId(req.query.customerId);
    }
    
    if (req.query.supplierId) {
      filter.supplierId = mongoose.Types.ObjectId(req.query.supplierId);
    }
    
    // Get basic statistics
    const stats = await analyticsService.getInspectionStats(filter);
    
    // Get monthly trend data
    const monthlyTrend = await analyticsService.getInspectionTrends(filter, startDate, endDate);
    
    res.status(200).json({
      success: true,
      data: {
        statusCounts: stats.statusCounts,
        resultCounts: stats.resultCounts,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error('Get inspection stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching inspection statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get advanced inspection analytics
 * @route GET /api/inspections/analytics
 * @access Private
 */
exports.getAdvancedAnalytics = async (req, res, next) => {
  try {
    // Base filter
    const filter = {};
    
    // Date range filter
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    
    // Apply role-based filters
    if (req.user.role === 'customer' && req.user.customerId) {
      filter.customerId = mongoose.Types.ObjectId(req.user.customerId);
    }
    
    // Apply custom filters if provided
    if (req.query.customerId) {
      filter.customerId = mongoose.Types.ObjectId(req.query.customerId);
    }
    
    if (req.query.supplierId) {
      filter.supplierId = mongoose.Types.ObjectId(req.query.supplierId);
    }
    
    // Get all analytics in parallel for performance
    const [
      basicStats,
      trends,
      supplierPerformance,
      defectAnalytics,
      timelineAnalytics
    ] = await Promise.all([
      analyticsService.getInspectionStats(filter),
      analyticsService.getInspectionTrends(filter, startDate, endDate),
      analyticsService.getSupplierPerformance(filter),
      analyticsService.getDefectAnalytics(filter),
      analyticsService.getInspectionTimeline(filter)
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        summary: basicStats,
        trends,
        supplierPerformance,
        defects: defectAnalytics,
        timeline: timelineAnalytics
      }
    });
  } catch (error) {
    console.error('Get advanced analytics error:', error);
    next(error);
  }
};

/**
 * Get supplier comparison analytics
 * @route GET /api/inspections/analytics/supplier-comparison
 * @access Private (Admin, Manager)
 */
exports.getSupplierComparison = async (req, res, next) => {
  try {
    // Check permissions
    if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource'
      });
    }
    
    // Get filter criteria
    const filter = {};
    
    if (req.query.customerId) {
      filter.customerId = mongoose.Types.ObjectId(req.query.customerId);
    }
    
    // Get supplier performance data
    const supplierPerformance = await analyticsService.getSupplierPerformance(filter);
    
    res.status(200).json({
      success: true,
      data: supplierPerformance
    });
  } catch (error) {
    console.error('Get supplier comparison error:', error);
    next(error);
  }
};

/**
 * Update inspection checklist items
 * @route PATCH /api/inspections/:id/checklist
 * @access Private
 */
exports.updateChecklistItems = async (req, res, next) => {
  try {
    const { checklistItems } = req.body;
    
    if (!checklistItems || !Array.isArray(checklistItems)) {
      return next(new BadRequestError('Checklist items array is required'));
    }
    
    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return next(new NotFoundError(`Inspection not found with id ${req.params.id}`));
    }
    
    // Update checklist items
    inspection.checklistItems = checklistItems;
    
    // If inspection is in progress, automatically update status based on checklist completion
    if (inspection.status === 'in-progress') {
      const totalItems = checklistItems.filter(item => item.status !== 'n/a').length;
      const completedItems = checklistItems.filter(item => item.status === 'pass' || item.status === 'fail').length;
      
      if (completedItems === totalItems && totalItems > 0) {
        inspection.status = 'completed';
        inspection.completionDate = new Date();
      }
    }
    
    await inspection.save();
    
    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Add defect to inspection
 * @route POST /api/inspections/:id/defects
 * @access Private
 */
exports.addDefect = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return next(new NotFoundError(`Inspection not found with id ${req.params.id}`));
    }
    
    // Add new defect
    inspection.defects.push(req.body);
    await inspection.save();
    
    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Batch update checklist items
 * @route PATCH /api/inspections/:id/checklist/batch
 * @access Private
 */
exports.batchUpdateChecklistItems = async (req, res, next) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new BadRequestError('Valid checklist items array is required'));
    }
    
    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return next(new NotFoundError(`Inspection not found with id ${req.params.id}`));
    }
    
    // Validate inspection can be updated
    if (inspection.status === 'cancelled') {
      return next(new BadRequestError('Cancelled inspections cannot be updated'));
    }
    
    if (inspection.status === 'completed') {
      // Check if user has permission to modify completed inspections
      if (!['admin', 'manager'].includes(req.user.role)) {
        return next(new BadRequestError('Completed inspections can only be modified by managers or admins'));
      }
    }
    
    // Start a session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Process each item in the batch
      for (const item of items) {
        const checklistItem = inspection.checklistItems.id(item.id);
        
        if (!checklistItem) {
          // Rollback transaction if an item is not found
          await session.abortTransaction();
          session.endSession();
          return next(new BadRequestError(`Checklist item not found with id ${item.id}`));
        }
        
        // Update the checklist item
        Object.keys(item).forEach(key => {
          if (key !== 'id' && key in checklistItem) {
            checklistItem[key] = item[key];
          }
        });
      }
      
      // Update inspection status based on checklist completion
      if (inspection.status === 'in-progress') {
        const totalItems = inspection.checklistItems.filter(item => item.status !== 'n/a').length;
        const completedItems = inspection.checklistItems.filter(item => 
          item.status === 'pass' || item.status === 'fail'
        ).length;
        
        if (completedItems === totalItems && totalItems > 0) {
          inspection.status = 'completed';
          inspection.completionDate = new Date();
        }
      }
      
      // Save inspection within transaction
      await inspection.save({ session });
      
      // Commit transaction
      await session.commitTransaction();
      session.endSession();
      
      // Retrieve fully populated inspection for response
      const updatedInspection = await Inspection.findById(req.params.id)
        .populate('customerId')
        .populate('supplierId')
        .populate('inspectedBy');
      
      // Send notifications if inspection was completed
      if (inspection.status === 'completed') {
        try {
          await notificationService.createInspectionNotification(updatedInspection, 'completed');
          
          // Send email notifications asynchronously
          const emailPromise = (async () => {
            const customer = updatedInspection.customerId;
            const supplier = updatedInspection.supplierId;
            const inspector = updatedInspection.inspectedBy;
            
            if (customer && supplier) {
              const inspectionNumber = updatedInspection.inspectionNumber;
              const inspectorName = inspector ? 
                `${inspector.firstName} ${inspector.lastName}` : 'Unassigned';
              const defectCount = updatedInspection.defects ? updatedInspection.defects.length : 0;
              
              // Send notifications in parallel for better performance
              await Promise.all([
                customer.primaryContactEmail ? 
                  sendInspectionResultNotification(
                    customer.primaryContactEmail,
                    inspectionNumber,
                    customer.name,
                    supplier.name,
                    updatedInspection.result,
                    updatedInspection.completionDate,
                    inspectorName,
                    defectCount
                  ) : Promise.resolve(),
                  
                supplier.primaryContactEmail ?
                  sendInspectionResultNotification(
                    supplier.primaryContactEmail,
                    inspectionNumber,
                    customer.name,
                    supplier.name,
                    updatedInspection.result,
                    updatedInspection.completionDate,
                    inspectorName,
                    defectCount
                  ) : Promise.resolve()
              ]);
            }
          })();
          
          // Don't await email sending to improve response time
          emailPromise.catch(error => {
            console.error('Failed to send result notification emails:', error);
          });
        } catch (notificationError) {
          console.error('Failed to create notification:', notificationError);
          // Continue execution even if notification fails
        }
      }
      
      res.status(200).json({
        success: true,
        data: updatedInspection
      });
    } catch (error) {
      // Rollback transaction on error
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (err) {
    next(err);
  }
};

// Optimized version of completeInspection
exports.completeInspection = async (req, res, next) => {
  // Start a session for transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const inspection = await Inspection.findById(req.params.id).session(session);
    
    if (!inspection) {
      await session.abortTransaction();
      session.endSession();
      return next(new NotFoundError(`Inspection not found with id ${req.params.id}`));
    }
    
    // Only allow completion of in-progress inspections
    if (inspection.status !== 'in-progress') {
      await session.abortTransaction();
      session.endSession();
      return next(new BadRequestError('Only in-progress inspections can be completed'));
    }
    
    // Update inspection with completion data
    inspection.status = 'completed';
    inspection.completionDate = new Date();
    
    // Update with any additional data from the request
    if (req.body.notes) {
      inspection.notes = req.body.notes;
    }
    
    if (req.body.nonConformanceReport) {
      inspection.nonConformanceReport = {
        ...inspection.nonConformanceReport,
        ...req.body.nonConformanceReport
      };
    }
    
    // Save inspection within transaction
    await inspection.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
    session.endSession();
    
    // Get fully populated inspection for notifications
    const populatedInspection = await Inspection.findById(req.params.id)
      .populate('customerId')
      .populate('supplierId')
      .populate('inspectedBy');
    
    // Send notifications asynchronously
    const notificationPromise = (async () => {
      try {
        await notificationService.createInspectionNotification(populatedInspection, 'completed');
        
        const customer = populatedInspection.customerId;
        const supplier = populatedInspection.supplierId;
        const inspector = populatedInspection.inspectedBy;
        
        if (customer && supplier) {
          const inspectionNumber = populatedInspection.inspectionNumber;
          const inspectorName = inspector ? 
            `${inspector.firstName} ${inspector.lastName}` : 'Unassigned';
          const defectCount = populatedInspection.defects ? populatedInspection.defects.length : 0;
          
          // Send notifications in parallel
          await Promise.all([
            customer.primaryContactEmail ? 
              sendInspectionResultNotification(
                customer.primaryContactEmail,
                inspectionNumber,
                customer.name,
                supplier.name,
                populatedInspection.result,
                populatedInspection.completionDate,
                inspectorName,
                defectCount
              ) : Promise.resolve(),
              
            supplier.primaryContactEmail ?
              sendInspectionResultNotification(
                supplier.primaryContactEmail,
                inspectionNumber,
                customer.name,
                supplier.name,
                populatedInspection.result,
                populatedInspection.completionDate,
                inspectorName,
                defectCount
              ) : Promise.resolve()
          ]);
        }
      } catch (error) {
        console.error('Notification error:', error);
      }
    })();
    
    // Update analytics asynchronously
    const analyticsPromise = analyticsService.recordInspectionCompleted(populatedInspection)
      .catch(error => {
        console.error('Analytics error:', error);
      });
    
    res.status(200).json({
      success: true,
      message: 'Inspection completed successfully',
      data: populatedInspection
    });
    
    // No need to await these promises as they run in the background
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    next(error);
  }
};

/**
 * Upload inspection photos
 * Note: This requires the file upload middleware to be used before this controller
 */
exports.uploadPhotos = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(new BadRequestError('No files uploaded'));
    }
    
    const inspection = await Inspection.findById(req.params.id);
    
    if (!inspection) {
      return next(new NotFoundError(`Inspection not found with id ${req.params.id}`));
    }
    
    // Handle file upload
    const { checklistItemId } = req.query;
    
    if (checklistItemId) {
      // Add to specific checklist item
      const checklistItem = inspection.checklistItems.id(checklistItemId);
      
      if (!checklistItem) {
        return next(new BadRequestError(`Checklist item not found with id ${checklistItemId}`));
      }
      
      // Add file URLs to checklist item photos
      checklistItem.photos = [
        ...checklistItem.photos,
        ...req.files.map(file => file.location || file.path)
      ];
    } else if (req.query.defectId) {
      // Add to specific defect
      const defect = inspection.defects.id(req.query.defectId);
      
      if (!defect) {
        return next(new BadRequestError(`Defect not found with id ${req.query.defectId}`));
      }
      
      // Add file URLs to defect photos
      defect.photos = [
        ...defect.photos,
        ...req.files.map(file => file.location || file.path)
      ];
    } else {
      // Add as general attachments
      const newAttachments = req.files.map(file => ({
        fileName: file.originalname,
        fileType: file.mimetype,
        fileUrl: file.location || file.path,
        uploadedBy: req.user.id,
        description: req.body.description || ''
      }));
      
      inspection.attachments = [
        ...inspection.attachments,
        ...newAttachments
      ];
    }
    
    await inspection.save();
    
    res.status(200).json({
      success: true,
      data: inspection
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate inspection report
 * @route GET /api/inspections/:id/report
 * @access Private
 */
exports.generateReport = async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('customerId')
      .populate('supplierId')
      .populate('componentId')
      .populate('inspectedBy', 'firstName lastName email');
    
    if (!inspection) {
      return next(new NotFoundError(`Inspection not found with id ${req.params.id}`));
    }
    
    // Get report service
    const reportService = require('../services/report.service');
    
    // Generate the report
    const reportPath = await reportService.generateInspectionReport(inspection, {
      includePhotos: req.query.includePhotos === 'true',
      includeSignatures: req.query.includeSignatures === 'true'
    });
    
    // Check if we want to download the file directly or just get the path
    if (req.query.download === 'true') {
      res.download(reportPath, `inspection-report-${inspection.inspectionNumber}.pdf`, (err) => {
        if (err) {
          next(new ServerError('Error downloading report file'));
        }
      });
    } else {
      // Just return the file path (useful for previewing in client)
      const relativePath = reportPath.replace(process.cwd(), '');
      
      res.status(200).json({
        success: true,
        data: {
          reportPath: relativePath,
          reportUrl: `/api/reports${relativePath}`,
          inspectionNumber: inspection.inspectionNumber,
          generatedAt: new Date()
        },
        message: 'Report generated successfully'
      });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Get inspection statistics
 */
exports.getStatistics = async (req, res, next) => {
  try {
    // Filter criteria
    const filter = {};
    
    // Add date range if provided
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }
    
    // Add customer filter if provided
    if (req.query.customerId) {
      filter.customerId = req.query.customerId;
    }
    
    // Add supplier filter if provided
    if (req.query.supplierId) {
      filter.supplierId = req.query.supplierId;
    }
    
    // Count by status
    const statusCounts = await Inspection.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Count by result
    const resultCounts = await Inspection.aggregate([
      { $match: filter },
      { $group: { _id: '$result', count: { $sum: 1 } } }
    ]);
    
    // Format data for frontend
    const statusData = {};
    statusCounts.forEach(item => {
      statusData[item._id] = item.count;
    });
    
    const resultData = {};
    resultCounts.forEach(item => {
      resultData[item._id] = item.count;
    });
    
    res.status(200).json({
      success: true,
      data: {
        status: statusData,
        result: resultData,
        total: await Inspection.countDocuments(filter)
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = exports; 