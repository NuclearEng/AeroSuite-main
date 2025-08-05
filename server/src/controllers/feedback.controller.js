/**
 * Feedback Controller
 * 
 * Handles API requests for the customer feedback system
 * 
 * @task TS379 - Customer feedback collection system
 */

const feedbackService = require('../services/feedback.service');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { validateRequest } = require('../utils/validator');
const { uploadFiles } = require('../utils/fileUpload');

/**
 * Create new feedback
 * @route POST /api/feedback
 */
exports.createFeedback = async (req, res, next) => {
  try {
    // Validate request
    validateRequest(req.body, {
      source: { type: 'string', required: true },
      content: { type: 'string', required: true },
      feedbackType: { type: 'string', required: false },
      title: { type: 'string', required: false },
      rating: { type: 'number', required: false },
      context: { type: 'object', required: false },
      contactInfo: { type: 'object', required: false }
    });
    
    // Get user from request if authenticated
    const user = req.user || null;
    
    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    // Handle file uploads if any
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = await uploadFiles(req.files, 'feedback');
    }
    
    // Create feedback
    const feedback = await feedbackService.createFeedback(
      {
        ...req.body,
        attachments
      },
      user,
      ipAddress,
      userAgent
    );
    
    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    logger.error('Error creating feedback:', error);
    next(error);
  }
};

/**
 * Get feedback by ID
 * @route GET /api/feedback/:id
 */
exports.getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const feedback = await feedbackService.getFeedbackById(id);
    
    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    logger.error('Error getting feedback by ID:', error);
    next(error);
  }
};

/**
 * Get all feedback with filtering and pagination
 * @route GET /api/feedback
 */
exports.getAllFeedback = async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort || '-createdAt',
      status: req.query.status,
      feedbackType: req.query.feedbackType,
      customer: req.query.customer,
      source: req.query.source,
      minRating: req.query.minRating,
      maxRating: req.query.maxRating,
      search: req.query.search,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      tags: req.query.tags,
      isAddressed: req.query.isAddressed === 'true' ? true : 
                  req.query.isAddressed === 'false' ? false : undefined,
      assignedTo: req.query.assignedTo
    };
    
    const result = await feedbackService.getAllFeedback(options);
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting all feedback:', error);
    next(error);
  }
};

/**
 * Update feedback
 * @route PATCH /api/feedback/:id
 */
exports.updateFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    if (!user) {
      throw new AppError('Authentication required', 401);
    }
    
    const feedback = await feedbackService.updateFeedback(id, req.body, user);
    
    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });
  } catch (error) {
    logger.error('Error updating feedback:', error);
    next(error);
  }
};

/**
 * Delete feedback
 * @route DELETE /api/feedback/:id
 */
exports.deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await feedbackService.deleteFeedback(id);
    
    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting feedback:', error);
    next(error);
  }
};

/**
 * Get feedback statistics
 * @route GET /api/feedback/statistics
 */
exports.getFeedbackStatistics = async (req, res, next) => {
  try {
    // Extract filter parameters
    const filters = {
      feedbackType: req.query.feedbackType,
      source: req.query.source,
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
      customer: req.query.customer
    };
    
    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined) {
        delete filters[key];
      }
    });
    
    const statistics = await feedbackService.getFeedbackStatistics(filters);
    
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting feedback statistics:', error);
    next(error);
  }
};

/**
 * Get feedback for a specific customer
 * @route GET /api/feedback/customer/:customerId
 */
exports.getCustomerFeedback = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort || '-createdAt'
    };
    
    const result = await feedbackService.getCustomerFeedback(customerId, options);
    
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error getting customer feedback:', error);
    next(error);
  }
}; 