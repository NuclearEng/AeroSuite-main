/**
 * Feedback Service
 * 
 * Handles business logic for the customer feedback system
 * 
 * @task TS379 - Customer feedback collection system
 */

const mongoose = require('mongoose');
const Feedback = require('../models/feedback.model');
const User = mongoose.model('User');
const Customer = mongoose.model('Customer');
const { AppError } = require('../utils/errorHandler');
const logger = require('../infrastructure/logger');
const notificationService = require('./notification.service');
const emailService = require('./email.service');
const cache = require('../utils/cache');

class FeedbackService {
  /**
   * Create new feedback
   */
  async createFeedback(feedbackData, user = null, ipAddress = null, userAgent = null) {
    try {
      const feedback = new Feedback({
        ...feedbackData,
        user: user?._id || null,
        ipAddress,
        userAgent
      });
      
      // If customer ID is provided, verify it exists
      if (feedbackData.customer) {
        const customer = await Customer.findById(feedbackData.customer);
        if (!customer) {
          throw new AppError('Customer not found', 404);
        }
      } else if (user?.customerId) {
        // If user has associated customer, use that
        feedback.customer = user.customerId;
      }
      
      // Parse user agent if provided
      if (userAgent) {
        feedback.userAgent = this.parseUserAgent(userAgent);
      }
      
      // Save the feedback
      await feedback.save();
      
      // Send notifications
      await this.sendFeedbackNotifications(feedback);
      
      return feedback;
    } catch (error) {
      logger.error('Error creating feedback:', error);
      throw error;
    }
  }
  
  /**
   * Get feedback by ID
   */
  async getFeedbackById(feedbackId, options = {}) {
    try {
      const { populate = true } = options;
      
      let query = Feedback.findById(feedbackId);
      
      if (populate) {
        query = query.populate('user', 'firstName lastName email')
                    .populate('customer', 'name')
                    .populate('assignedTo', 'firstName lastName email')
                    .populate('internalNotes.user', 'firstName lastName')
                    .populate('response.respondedBy', 'firstName lastName');
      }
      
      const feedback = await query;
      
      if (!feedback) {
        throw new AppError('Feedback not found', 404);
      }
      
      return feedback;
    } catch (error) {
      logger.error('Error getting feedback by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get all feedback with filtering and pagination
   */
  async getAllFeedback(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = '-createdAt',
        status,
        feedbackType,
        customer,
        source,
        minRating,
        maxRating,
        search,
        startDate,
        endDate,
        tags,
        isAddressed,
        assignedTo
      } = options;
      
      // Build filter object
      const filter = {};
      
      if (status) filter.status = status;
      if (feedbackType) filter.feedbackType = feedbackType;
      if (customer) filter.customer = customer;
      if (source) filter.source = source;
      if (isAddressed !== undefined) filter.isAddressed = isAddressed;
      if (assignedTo) filter.assignedTo = assignedTo;
      
      // Rating range
      if (minRating !== undefined || maxRating !== undefined) {
        filter.rating = {};
        if (minRating !== undefined) filter.rating.$gte = Number(minRating);
        if (maxRating !== undefined) filter.rating.$lte = Number(maxRating);
      }
      
      // Date range
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) {
          const endDateObj = new Date(endDate);
          endDateObj.setDate(endDateObj.getDate() + 1); // Include the end date
          filter.createdAt.$lt = endDateObj;
        }
      }
      
      // Tags (array match)
      if (tags) {
        if (Array.isArray(tags)) {
          filter.tags = { $in: tags };
        } else {
          filter.tags = tags;
        }
      }
      
      // Text search
      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { 'contactInfo.name': { $regex: search, $options: 'i' } },
          { 'contactInfo.email': { $regex: search, $options: 'i' } }
        ];
      }
      
      // Execute query with pagination
      const skip = (page - 1) * limit;
      
      const [feedback, total] = await Promise.all([
        Feedback.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .populate('user', 'firstName lastName email')
          .populate('customer', 'name')
          .populate('assignedTo', 'firstName lastName'),
        Feedback.countDocuments(filter)
      ]);
      
      return {
        data: feedback,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting all feedback:', error);
      throw error;
    }
  }
  
  /**
   * Update feedback
   */
  async updateFeedback(feedbackId, updateData, user) {
    try {
      const feedback = await this.getFeedbackById(feedbackId, { populate: false });
      
      // Fields that can be updated
      const allowedFields = [
        'status', 'priority', 'assignedTo', 'tags', 'isAddressed', 'isFeatured'
      ];
      
      // Update allowed fields
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          feedback[field] = updateData[field];
        }
      });
      
      // Add internal note if provided
      if (updateData.note) {
        feedback.internalNotes.push({
          user: user._id,
          content: updateData.note
        });
      }
      
      // Add response if provided
      if (updateData.response) {
        feedback.response = {
          content: updateData.response.content,
          respondedBy: user._id,
          respondedAt: new Date(),
          isPublic: updateData.response.isPublic || false
        };
        
        // If response is public and we have contact info, send email
        if (feedback.response.isPublic && 
            feedback.contactInfo?.email && 
            feedback.contactInfo.allowContact) {
          await this.sendFeedbackResponseEmail(feedback);
        }
      }
      
      await feedback.save();
      
      // Get fully populated feedback
      const updatedFeedback = await this.getFeedbackById(feedbackId);
      
      return updatedFeedback;
    } catch (error) {
      logger.error('Error updating feedback:', error);
      throw error;
    }
  }
  
  /**
   * Delete feedback
   */
  async deleteFeedback(feedbackId) {
    try {
      const feedback = await Feedback.findByIdAndDelete(feedbackId);
      
      if (!feedback) {
        throw new AppError('Feedback not found', 404);
      }
      
      return { success: true, message: 'Feedback deleted successfully' };
    } catch (error) {
      logger.error('Error deleting feedback:', error);
      throw error;
    }
  }
  
  /**
   * Get feedback statistics
   */
  async getFeedbackStatistics(filters = {}) {
    try {
      // Try to get from cache first
      const cacheKey = `feedback_stats:${JSON.stringify(filters)}`;
      const cachedStats = await cache.get(cacheKey);
      
      if (cachedStats) {
        return cachedStats;
      }
      
      const stats = await Feedback.getStatistics(filters);
      
      // Cache for 1 hour
      await cache.set(cacheKey, stats, 3600);
      
      return stats;
    } catch (error) {
      logger.error('Error getting feedback statistics:', error);
      throw error;
    }
  }
  
  /**
   * Get feedback by customer
   */
  async getCustomerFeedback(customerId, options = {}) {
    try {
      return await this.getAllFeedback({
        ...options,
        customer: customerId
      });
    } catch (error) {
      logger.error('Error getting customer feedback:', error);
      throw error;
    }
  }
  
  /**
   * Send notifications about new feedback
   */
  async sendFeedbackNotifications(feedback) {
    try {
      // Get admin users to notify
      const admins = await User.find({ role: 'admin' });
      
      // Create notification for each admin
      for (const admin of admins) {
        await notificationService.createNotification({
          user: admin._id,
          type: 'feedback',
          title: 'New Feedback Received',
          message: `New ${feedback.feedbackType} feedback has been submitted`,
          data: {
            feedbackId: feedback._id,
            feedbackType: feedback.feedbackType
          },
          priority: feedback.priority === 'critical' ? 'high' : 'medium'
        });
      }
      
      // Send email to support team
      await emailService.sendEmail({
        to: process.env.SUPPORT_EMAIL || 'support@aerosuite.com',
        subject: `New Feedback: ${feedback.title || feedback.feedbackType}`,
        template: 'new-feedback',
        data: {
          feedback
        }
      }).catch(err => {
        logger.error('Failed to send feedback notification email:', err);
      });
      
      return true;
    } catch (error) {
      logger.error('Error sending feedback notifications:', error);
      // Don't throw, just log the error
      return false;
    }
  }
  
  /**
   * Send email response to feedback submitter
   */
  async sendFeedbackResponseEmail(feedback) {
    try {
      if (!feedback.contactInfo?.email || !feedback.response?.content) {
        return false;
      }
      
      await emailService.sendEmail({
        to: feedback.contactInfo.email,
        subject: `Response to your feedback - ${feedback.title || 'AeroSuite Feedback'}`,
        template: 'feedback-response',
        data: {
          feedback,
          name: feedback.contactInfo.name || 'Valued Customer',
          responseContent: feedback.response.content
        }
      });
      
      return true;
    } catch (error) {
      logger.error('Error sending feedback response email:', error);
      return false;
    }
  }
  
  /**
   * Parse user agent string
   */
  parseUserAgent(userAgentString) {
    try {
      // Simple parsing - in production, consider using a library like ua-parser-js
      const result = {
        browser: 'Unknown',
        device: 'Unknown',
        os: 'Unknown'
      };
      
      // Extract browser
      if (userAgentString.includes('Chrome')) {
        result.browser = 'Chrome';
      } else if (userAgentString.includes('Firefox')) {
        result.browser = 'Firefox';
      } else if (userAgentString.includes('Safari') && !userAgentString.includes('Chrome')) {
        result.browser = 'Safari';
      } else if (userAgentString.includes('Edge')) {
        result.browser = 'Edge';
      } else if (userAgentString.includes('MSIE') || userAgentString.includes('Trident/')) {
        result.browser = 'Internet Explorer';
      }
      
      // Extract OS
      if (userAgentString.includes('Windows')) {
        result.os = 'Windows';
      } else if (userAgentString.includes('Mac OS')) {
        result.os = 'macOS';
      } else if (userAgentString.includes('Linux')) {
        result.os = 'Linux';
      } else if (userAgentString.includes('Android')) {
        result.os = 'Android';
      } else if (userAgentString.includes('iOS') || userAgentString.includes('iPhone') || userAgentString.includes('iPad')) {
        result.os = 'iOS';
      }
      
      // Extract device type
      if (userAgentString.includes('Mobile')) {
        result.device = 'Mobile';
      } else if (userAgentString.includes('Tablet') || userAgentString.includes('iPad')) {
        result.device = 'Tablet';
      } else {
        result.device = 'Desktop';
      }
      
      return result;
    } catch (error) {
      logger.error('Error parsing user agent:', error);
      return {
        browser: 'Unknown',
        device: 'Unknown',
        os: 'Unknown'
      };
    }
  }
}

module.exports = new FeedbackService(); 