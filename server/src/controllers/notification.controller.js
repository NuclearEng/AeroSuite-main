const { validationResult } = require('express-validator');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');
const smsService = require('../services/sms.service');
const { BadRequestError, NotFoundError, ServerError } = require('../utils/errorHandler');
const User = require('../models/user.model');
const Inspection = require('../models/inspection.model');
const Supplier = require('../models/supplier.model');
const config = require('../config');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

/**
 * Get user notifications
 * @route GET /api/notifications
 * @access Private
 */
exports.getUserNotifications = catchAsync(async (req, res, next) => {
  const { limit = 20, skip = 0, unreadOnly = false } = req.query;
  
  const result = await notificationService.getUserNotifications(
    req.user.id,
    {
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
      unreadOnly: unreadOnly === 'true'
    }
  );
  
  res.status(200).json({
    success: true,
    ...result
  });
});

/**
 * Get unread notification count
 * @route GET /api/notifications/unread-count
 * @access Private
 */
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const result = await notificationService.getUserNotifications(
    req.user.id,
    { unreadOnly: true, limit: 0 }
  );
  
  res.status(200).json({
    success: true,
    unreadCount: result.unreadCount
  });
});

/**
 * Mark notification as read
 * @route PATCH /api/notifications/:id/read
 * @access Private
 */
exports.markAsRead = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const notification = await notificationService.markAsRead(id, req.user.id);
  
  if (!notification) {
    return next(new AppError('Notification not found', 404));
  }
  
  res.status(200).json({
    success: true,
    notification
  });
});

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 * @access Private
 */
exports.markAllAsRead = catchAsync(async (req, res, next) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
    result
  });
});

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
exports.deleteNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  const result = await notificationService.deleteNotification(id, req.user.id);
  
  if (!result) {
    return next(new AppError('Notification not found', 404));
  }
  
  res.status(200).json({
    success: true,
    message: 'Notification deleted'
  });
});

/**
 * Delete all notifications
 * @route DELETE /api/notifications
 * @access Private
 */
exports.deleteAllNotifications = catchAsync(async (req, res, next) => {
  const result = await notificationService.deleteAllNotifications(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'All notifications deleted',
    result
  });
});

/**
 * Create test notification (development only)
 * @route POST /api/notifications/test
 * @access Private (Admin)
 */
exports.sendTestNotification = catchAsync(async (req, res, next) => {
  const { title, message, type = 'info', userId } = req.body;
  
  // If userId is provided, send to that user, otherwise send to the current user
  const targetUserId = userId || req.user.id;
  
  const notification = await notificationService.createNotification(targetUserId, {
    title,
    message,
    type,
    resourceType: 'system'
  });
  
  res.status(201).json({
    success: true,
    message: 'Test notification sent',
    notification
  });
});

/**
 * Send an SMS notification to a user
 * @route POST /api/notifications/sms
 * @access Private (Admin, Manager)
 */
exports.sendSMS = async (req, res, next) => {
  try {
    const { to, body, options } = req.body;

    if (!to || !body) {
      return next(new BadRequestError('Phone number and message body are required'));
    }

    const result = await smsService.sendSMS(to, body, options);

    if (!result.success) {
      return next(new ServerError(result.error || 'Failed to send SMS'));
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send SMS notifications to multiple users
 * @route POST /api/notifications/sms/batch
 * @access Private (Admin, Manager)
 */
exports.sendBatchSMS = async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return next(new BadRequestError('Valid messages array is required'));
    }

    // Check if batch size exceeds the limit
    if (messages.length > config.sms.rateLimit.maxBatchSize) {
      return next(new BadRequestError(`Batch size exceeds maximum of ${config.sms.rateLimit.maxBatchSize}`));
    }

    // Validate each message has required fields
    for (const message of messages) {
      if (!message.to || !message.body) {
        return next(new BadRequestError('Each message must have "to" and "body" fields'));
      }
    }

    const results = await smsService.sendBatchSMS(messages);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule an SMS notification
 * @route POST /api/notifications/sms/schedule
 * @access Private (Admin, Manager)
 */
exports.scheduleSMS = async (req, res, next) => {
  try {
    const { to, body, sendAt, options } = req.body;

    if (!to || !body || !sendAt) {
      return next(new BadRequestError('Phone number, message body, and send time are required'));
    }

    // Parse the date if it's a string
    const scheduledTime = typeof sendAt === 'string' ? new Date(sendAt) : sendAt;

    if (isNaN(scheduledTime.getTime())) {
      return next(new BadRequestError('Invalid date format for sendAt'));
    }

    // Check if scheduled time is in the future
    if (scheduledTime <= new Date()) {
      return next(new BadRequestError('Scheduled time must be in the future'));
    }

    const result = await smsService.scheduleSMS(to, body, scheduledTime, options);

    if (!result.success) {
      return next(new ServerError(result.error || 'Failed to schedule SMS'));
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel a scheduled SMS notification
 * @route DELETE /api/notifications/sms/schedule/:messageId
 * @access Private (Admin, Manager)
 */
exports.cancelScheduledSMS = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return next(new BadRequestError('Message ID is required'));
    }

    const result = await smsService.cancelScheduledSMS(messageId);

    if (!result.success) {
      return next(new ServerError(result.error || 'Failed to cancel scheduled SMS'));
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Start phone number verification
 * @route POST /api/notifications/verify/phone
 * @access Private
 */
exports.startPhoneVerification = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return next(new BadRequestError('Phone number is required'));
    }

    if (!smsService.isValidPhoneNumber(phoneNumber)) {
      return next(new BadRequestError('Invalid phone number format. Use E.164 format (+1234567890)'));
    }

    const result = await smsService.startPhoneVerification(phoneNumber);

    if (!result.success) {
      return next(new ServerError(result.error || 'Failed to start verification'));
    }

    res.status(200).json({
      success: true,
      data: {
        status: result.status,
        message: 'Verification code sent'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify phone number with code
 * @route POST /api/notifications/verify/phone/check
 * @access Private
 */
exports.checkVerificationCode = async (req, res, next) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return next(new BadRequestError('Phone number and verification code are required'));
    }

    const result = await smsService.checkVerificationCode(phoneNumber, code);

    if (!result.success) {
      return next(new ServerError(result.error || 'Failed to check verification code'));
    }

    // If verification is successful, update the user's phone verification status
    if (result.valid) {
      // Find the user by ID (assuming req.user is set by auth middleware)
      const user = await User.findById(req.user.id);
      
      if (user) {
        // Update user's phone number and verification status
        user.phoneNumber = phoneNumber;
        user.isPhoneVerified = true;
        await user.save();
      }
    }

    res.status(200).json({
      success: true,
      data: {
        valid: result.valid,
        status: result.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send inspection reminder notifications
 * @route POST /api/notifications/inspections/reminders
 * @access Private (Admin, Manager)
 */
exports.sendInspectionReminders = async (req, res, next) => {
  try {
    const { inspectionIds } = req.body;

    if (!inspectionIds || !Array.isArray(inspectionIds) || inspectionIds.length === 0) {
      return next(new BadRequestError('Valid inspection IDs array is required'));
    }

    // Get inspections
    const inspections = await Inspection.find({
      _id: { $in: inspectionIds }
    }).populate('supplierId customerId assignedTo');

    if (inspections.length === 0) {
      return next(new NotFoundError('No inspections found with the provided IDs'));
    }

    const messages = [];
    const results = [];

    // Prepare messages for each inspection
    for (const inspection of inspections) {
      if (!inspection.assignedTo) {
        results.push({
          inspectionId: inspection._id,
          success: false,
          error: 'No inspector assigned'
        });
        continue;
      }

      // Skip if inspector doesn't have a verified phone number
      if (!inspection.assignedTo.phoneNumber || !inspection.assignedTo.isPhoneVerified) {
        results.push({
          inspectionId: inspection._id,
          success: false,
          error: 'Inspector has no verified phone number'
        });
        continue;
      }

      // Format date and time
      const date = new Date(inspection.scheduledDate).toLocaleDateString();
      const time = new Date(inspection.scheduledDate).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });

      // Get supplier name
      const supplierName = inspection.supplierId ? inspection.supplierId.name : 'Unknown Supplier';

      // Format message using template
      const templateMessage = config.sms.templates.inspectionReminder
        .replace('{date}', date)
        .replace('{time}', time)
        .replace('{supplier}', supplierName);

      messages.push({
        to: inspection.assignedTo.phoneNumber,
        body: templateMessage,
        options: {
          inspectionId: inspection._id.toString()
        }
      });
    }

    // If no valid messages, return early
    if (messages.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalSent: 0,
          results
        }
      });
    }

    // Send batch SMS
    const smsResults = await smsService.sendBatchSMS(messages);

    // Match results with inspections
    smsResults.forEach((result, index) => {
      results.push({
        inspectionId: messages[index].options.inspectionId,
        success: result.success,
        messageId: result.messageId,
        error: result.error
      });
    });

    // Count successful sends
    const totalSent = results.filter(r => r.success).length;

    res.status(200).json({
      success: true,
      data: {
        totalSent,
        results
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get SMS message status
 * @route GET /api/notifications/sms/status/:messageId
 * @access Private (Admin, Manager)
 */
exports.getMessageStatus = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    if (!messageId) {
      return next(new BadRequestError('Message ID is required'));
    }

    const result = await smsService.getMessageStatus(messageId);

    if (!result.success) {
      return next(new ServerError(result.error || 'Failed to get message status'));
    }

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}; 