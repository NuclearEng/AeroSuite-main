const logger = require('../infrastructure/logger');
const User = require('../models/user.model');

let io;
const userSockets = new Map(); // Map userId -> Set of socket ids

/**
 * Real-time Notification Service
 * 
 * Handles real-time notifications using Socket.IO
 */
const realtimeNotificationService = {
  /**
   * Initialize the socket.io instance
   * 
   * @param {Object} socketIo - Socket.IO server instance
   */
  initialize: (socketIo) => {
    if (!socketIo) {
      logger.error('Socket.IO instance is required for real-time notifications');
      return;
    }
    
    io = socketIo;
    
    io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);
      
      // Handle authentication
      socket.on('authenticate', async (data) => {
        try {
          // In a real implementation, you'd verify the token here
          // For simplicity, we're just using the userId from the data
          const { userId } = data;
          
          if (!userId) {
            socket.emit('authentication_error', { message: 'User ID is required' });
            return;
          }
          
          // Check if user exists
          const user = await User.findById(userId);
          if (!user) {
            socket.emit('authentication_error', { message: 'User not found' });
            return;
          }
          
          // Store socket association with user
          if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
          }
          userSockets.get(userId).add(socket.id);
          
          // Store user ID in socket data
          socket.data.userId = userId;
          
          // Join user-specific room
          socket.join(`user:${userId}`);
          
          // Join role-based rooms
          if (user.role) {
            socket.join(`role:${user.role}`);
          }
          
          logger.info(`Socket ${socket.id} authenticated for user ${userId}`);
          socket.emit('authenticated', { success: true });
          
          // Send any pending notifications
          realtimeNotificationService.sendPendingNotifications(userId);
        } catch (error) {
          logger.error(`Socket authentication error: ${error.message}`);
          socket.emit('authentication_error', { message: 'Authentication failed' });
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        const { userId } = socket.data;
        logger.info(`Socket disconnected: ${socket.id}`);
        
        if (userId && userSockets.has(userId)) {
          userSockets.get(userId).delete(socket.id);
          
          // Clean up if this was the last socket for this user
          if (userSockets.get(userId).size === 0) {
            userSockets.delete(userId);
          }
        }
      });
    });
  },
  
  /**
   * Send notification to a specific user
   * 
   * @param {string} userId - User ID
   * @param {Object} notification - Notification object
   * @returns {boolean} Whether the notification was sent
   */
  sendToUser: (userId, notification) => {
    if (!io) {
      logger.error('Socket.IO not initialized');
      return false;
    }
    
    try {
      io.to(`user:${userId}`).emit('notification', notification);
      logger.debug(`Real-time notification sent to user ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending real-time notification to user ${userId}: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Send notification to multiple users
   * 
   * @param {Array<string>} userIds - Array of user IDs
   * @param {Object} notification - Notification object
   * @returns {number} Number of users the notification was sent to
   */
  sendToUsers: (userIds, notification) => {
    if (!io) {
      logger.error('Socket.IO not initialized');
      return 0;
    }
    
    let sentCount = 0;
    
    for (const userId of userIds) {
      try {
        io.to(`user:${userId}`).emit('notification', notification);
        sentCount++;
      } catch (error) {
        logger.error(`Error sending real-time notification to user ${userId}: ${error.message}`);
      }
    }
    
    logger.debug(`Real-time notification sent to ${sentCount}/${userIds.length} users`);
    return sentCount;
  },
  
  /**
   * Send notification to users with specific roles
   * 
   * @param {Array<string>} roles - Array of role names
   * @param {Object} notification - Notification object
   * @returns {boolean} Whether the notification was sent
   */
  sendToRoles: (roles, notification) => {
    if (!io) {
      logger.error('Socket.IO not initialized');
      return false;
    }
    
    try {
      for (const role of roles) {
        io.to(`role:${role}`).emit('notification', notification);
      }
      
      logger.debug(`Real-time notification sent to roles: ${roles.join(', ')}`);
      return true;
    } catch (error) {
      logger.error(`Error sending real-time notification to roles ${roles}: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Send notification to all connected users
   * 
   * @param {Object} notification - Notification object
   * @returns {boolean} Whether the notification was sent
   */
  broadcast: (notification) => {
    if (!io) {
      logger.error('Socket.IO not initialized');
      return false;
    }
    
    try {
      io.emit('notification', notification);
      logger.debug('Real-time notification broadcasted to all users');
      return true;
    } catch (error) {
      logger.error(`Error broadcasting real-time notification: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Send a system alert to all connected users
   * 
   * @param {string} message - Alert message
   * @param {string} type - Alert type (info, warning, error)
   * @returns {boolean} Whether the alert was sent
   */
  sendSystemAlert: (message, type = 'info') => {
    if (!io) {
      logger.error('Socket.IO not initialized');
      return false;
    }
    
    try {
      io.emit('system-alert', { message, type });
      logger.info(`System alert (${type}): ${message}`);
      return true;
    } catch (error) {
      logger.error(`Error sending system alert: ${error.message}`);
      return false;
    }
  },
  
  /**
   * Check if a user is currently connected
   * 
   * @param {string} userId - User ID
   * @returns {boolean} Whether the user is connected
   */
  isUserConnected: (userId) => {
    return userSockets.has(userId) && userSockets.get(userId).size > 0;
  },
  
  /**
   * Get the number of connected sockets for a user
   * 
   * @param {string} userId - User ID
   * @returns {number} Number of connected sockets
   */
  getUserConnectionCount: (userId) => {
    if (!userSockets.has(userId)) {
      return 0;
    }
    
    return userSockets.get(userId).size;
  },
  
  /**
   * Get the total number of connected users
   * 
   * @returns {number} Number of connected users
   */
  getConnectedUserCount: () => {
    return userSockets.size;
  },
  
  /**
   * Send pending notifications to a user
   * 
   * @param {string} userId - User ID
   * @returns {Promise<number>} Number of notifications sent
   */
  sendPendingNotifications: async (userId) => {
    try {
      // In a real implementation, you'd fetch pending notifications from the database
      // and send them to the user
      return 0;
    } catch (error) {
      logger.error(`Error sending pending notifications to user ${userId}: ${error.message}`);
      return 0;
    }
  }
};

module.exports = realtimeNotificationService; 