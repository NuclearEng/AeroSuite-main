const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const logger = require('../infrastructure/logger');
const realtimeNotificationService = require('./realtime-notification.service');

/**
 * Notification Service
 * 
 * Handles creation and management of notifications
 */
const notificationService = {
  /**
   * Create a notification for a single user
   * 
   * @param {string} userId - User ID
   * @param {Object} data - Notification data
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} data.type - Notification type (info, success, error, warning)
   * @param {string} [data.link] - URL to navigate to when clicked
   * @param {string} [data.action] - Action text
   * @param {string} [data.resourceType] - Type of resource this notification relates to
   * @param {string} [data.resourceId] - ID of the related resource
   * @returns {Promise<Object>} Created notification
   */
  createNotification: async (userId, data) => {
    try {
      const notification = await Notification.createNotification({
        user: userId,
        ...data
      });
      
      // Send real-time notification if user is connected
      if (realtimeNotificationService.isUserConnected(userId)) {
        realtimeNotificationService.sendToUser(userId, notification);
      }
      
      return notification;
    } catch (error) {
      logger.error(`Error creating notification for user ${userId}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Create notifications for multiple users
   * 
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} data - Notification data (same as createNotification)
   * @returns {Promise<Array>} Created notifications
   */
  createNotifications: async (userIds, data) => {
    try {
      const notifications = await Notification.createNotifications(userIds, data);
      
      // Send real-time notifications to connected users
      const connectedUserIds = userIds.filter(userId => 
        realtimeNotificationService.isUserConnected(userId)
      );
      
      if (connectedUserIds.length > 0) {
        // Find the notification for each user
        for (const userId of connectedUserIds) {
          const userNotification = notifications.find(n => n.user.toString() === userId);
          if (userNotification) {
            realtimeNotificationService.sendToUser(userId, userNotification);
          }
        }
      }
      
      return notifications;
    } catch (error) {
      logger.error(`Error creating notifications for ${userIds.length} users: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Create notification for users with specific roles
   * 
   * @param {Array<string>} roles - Array of role names
   * @param {Object} data - Notification data (same as createNotification)
   * @returns {Promise<Array>} Created notifications
   */
  createNotificationsForRoles: async (roles, data) => {
    try {
      // Find users with the specified roles
      const users = await User.find({ role: { $in: roles } }, '_id');
      const userIds = users.map(user => user._id);
      
      if (userIds.length === 0) {
        logger.warn(`No users found with roles: ${roles.join(', ')}`);
        return [];
      }
      
      return await Notification.createNotifications(userIds, data);
    } catch (error) {
      logger.error(`Error creating notifications for roles ${roles}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Create inspection notification
   * 
   * @param {Object} inspection - Inspection object
   * @param {string} action - Action performed (created, updated, completed, etc.)
   * @param {Array<string>} [additionalUserIds] - Additional users to notify
   * @returns {Promise<Array>} Created notifications
   */
  createInspectionNotification: async (inspection, action, additionalUserIds = []) => {
    try {
      // Determine notification details based on action
      let title, message, type;
      const resourceType = 'inspection';
      const resourceId = inspection._id;
      const link = `/inspections/${inspection._id}`;
      
      switch (action) {
        case 'created':
          title = 'New Inspection Scheduled';
          message = `Inspection ${inspection.inspectionNumber || resourceId.toString().substring(0, 8).toUpperCase()} has been scheduled`;
          type = 'info';
          break;
        case 'updated':
          title = 'Inspection Updated';
          message = `Inspection ${inspection.inspectionNumber || resourceId.toString().substring(0, 8).toUpperCase()} has been updated`;
          type = 'info';
          break;
        case 'completed':
          title = `Inspection ${inspection.result === 'pass' ? 'Passed' : inspection.result === 'fail' ? 'Failed' : 'Completed'}`;
          message = `Inspection ${inspection.inspectionNumber || resourceId.toString().substring(0, 8).toUpperCase()} has been completed with result: ${inspection.result}`;
          type = inspection.result === 'pass' ? 'success' : inspection.result === 'fail' ? 'error' : 'warning';
          break;
        case 'cancelled':
          title = 'Inspection Cancelled';
          message = `Inspection ${inspection.inspectionNumber || resourceId.toString().substring(0, 8).toUpperCase()} has been cancelled`;
          type = 'warning';
          break;
        default:
          title = 'Inspection Update';
          message = `Inspection ${inspection.inspectionNumber || resourceId.toString().substring(0, 8).toUpperCase()} has been ${action}`;
          type = 'info';
      }
      
      // Collect users to notify
      const userIds = [...new Set([
        inspection.inspectedBy?.toString(),
        ...(additionalUserIds || [])
      ])].filter(Boolean); // Remove duplicates and nulls
      
      // Add managers and admins for completed/failed inspections
      if (action === 'completed' && inspection.result === 'fail') {
        // Get managers and admins
        const managers = await User.find({ role: { $in: ['admin', 'manager'] } }, '_id');
        userIds.push(...managers.map(m => m._id.toString()));
      }
      
      // Create the notifications
      return await Notification.createNotifications(
        [...new Set(userIds)], // Remove duplicates
        { title, message, type, link, resourceType, resourceId }
      );
    } catch (error) {
      logger.error(`Error creating inspection notification: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Create supplier notification
   * 
   * @param {Object} supplier - Supplier object
   * @param {string} action - Action performed
   * @param {Array<string>} [additionalUserIds] - Additional users to notify
   * @returns {Promise<Array>} Created notifications
   */
  createSupplierNotification: async (supplier, action, additionalUserIds = []) => {
    try {
      // Determine notification details based on action
      let title, message, type;
      const resourceType = 'supplier';
      const resourceId = supplier._id;
      const link = `/suppliers/${supplier._id}`;
      
      switch (action) {
        case 'created':
          title = 'New Supplier Added';
          message = `Supplier ${supplier.name} has been added to the system`;
          type = 'info';
          break;
        case 'updated':
          title = 'Supplier Updated';
          message = `Supplier ${supplier.name} has been updated`;
          type = 'info';
          break;
        case 'status-changed':
          title = `Supplier Status Changed: ${supplier.status}`;
          message = `Supplier ${supplier.name} status has been changed to ${supplier.status}`;
          type = supplier.status === 'active' ? 'success' : supplier.status === 'inactive' ? 'error' : 'warning';
          break;
        default:
          title = 'Supplier Update';
          message = `Supplier ${supplier.name} has been ${action}`;
          type = 'info';
      }
      
      // Notify managers and specified users
      const managers = await User.find({ role: { $in: ['admin', 'manager'] } }, '_id');
      const userIds = [
        ...managers.map(m => m._id.toString()),
        ...(additionalUserIds || [])
      ];
      
      // Create the notifications
      return await Notification.createNotifications(
        [...new Set(userIds)], // Remove duplicates
        { title, message, type, link, resourceType, resourceId }
      );
    } catch (error) {
      logger.error(`Error creating supplier notification: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Get user notifications
   * 
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @param {number} [options.limit] - Max number of notifications to return
   * @param {number} [options.skip] - Number of notifications to skip
   * @param {boolean} [options.unreadOnly] - Only return unread notifications
   * @returns {Promise<Object>} Notifications and count
   */
  getUserNotifications: async (userId, options = {}) => {
    try {
      const { limit = 20, skip = 0, unreadOnly = false } = options;
      
      // Build query
      const query = { user: userId };
      if (unreadOnly) {
        query.read = false;
      }
      
      // Get notifications with pagination
      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      // Get count of unread notifications
      const unreadCount = await Notification.countDocuments({ user: userId, read: false });
      
      return {
        notifications,
        unreadCount,
        total: await Notification.countDocuments(query)
      };
    } catch (error) {
      logger.error(`Error getting notifications for user ${userId}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Mark notification as read
   * 
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Updated notification
   */
  markAsRead: async (notificationId, userId) => {
    try {
      return await Notification.markAsRead(notificationId, userId);
    } catch (error) {
      logger.error(`Error marking notification ${notificationId} as read: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Mark all notifications as read for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Update result
   */
  markAllAsRead: async (userId) => {
    try {
      return await Notification.markAllAsRead(userId);
    } catch (error) {
      logger.error(`Error marking all notifications as read for user ${userId}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Delete notification
   * 
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteNotification: async (notificationId, userId) => {
    try {
      return await Notification.deleteNotification(notificationId, userId);
    } catch (error) {
      logger.error(`Error deleting notification ${notificationId}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Delete all notifications for a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Deletion result
   */
  deleteAllNotifications: async (userId) => {
    try {
      return await Notification.deleteAllNotifications(userId);
    } catch (error) {
      logger.error(`Error deleting all notifications for user ${userId}: ${error.message}`);
      throw error;
    }
  },
  
  /**
   * Send a real-time system alert to all connected users
   * 
   * @param {string} message - Alert message
   * @param {string} type - Alert type (info, warning, error)
   * @returns {boolean} Whether the alert was sent
   */
  sendSystemAlert: (message, type = 'info') => {
    return realtimeNotificationService.sendSystemAlert(message, type);
  },
  
  /**
   * Get connected user statistics
   * 
   * @returns {Object} Connection statistics
   */
  getConnectionStats: () => {
    return {
      totalConnectedUsers: realtimeNotificationService.getConnectedUserCount()
    };
  }
};

module.exports = notificationService; 