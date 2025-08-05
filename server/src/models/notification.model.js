const mongoose = require('mongoose');

/**
 * Notification Schema
 * 
 * Stores user notifications for various system events
 */
const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['info', 'success', 'error', 'warning'],
      default: 'info'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    action: {
      type: String,
      trim: true
    },
    link: {
      type: String,
      trim: true
    },
    resourceType: {
      type: String,
      enum: ['inspection', 'supplier', 'customer', 'component', 'user', 'system'],
      default: 'system'
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Default expiration: 30 days from creation
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      },
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Index for querying notifications efficiently
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

/**
 * Create notification for a user
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Object>} Created notification
 */
notificationSchema.statics.createNotification = async function(notificationData) {
  return this.create(notificationData);
};

/**
 * Create notifications for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data (without user field)
 * @returns {Promise<Array>} Created notifications
 */
notificationSchema.statics.createNotifications = async function(userIds, notificationData) {
  const notifications = userIds.map(userId => ({
    user: userId,
    ...notificationData
  }));
  
  return this.insertMany(notifications);
};

/**
 * Mark notification as read
 * @param {ObjectId} notificationId - Notification ID
 * @param {ObjectId} userId - User ID (for security)
 * @returns {Promise<Object>} Updated notification
 */
notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { $set: { read: true } },
    { new: true }
  );
};

/**
 * Mark all notifications as read for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} Update result
 */
notificationSchema.statics.markAllAsRead = async function(userId) {
  return this.updateMany(
    { user: userId, read: false },
    { $set: { read: true } }
  );
};

/**
 * Delete notification
 * @param {ObjectId} notificationId - Notification ID
 * @param {ObjectId} userId - User ID (for security)
 * @returns {Promise<Object>} Deletion result
 */
notificationSchema.statics.deleteNotification = async function(notificationId, userId) {
  return this.findOneAndDelete({ _id: notificationId, user: userId });
};

/**
 * Delete all notifications for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} Deletion result
 */
notificationSchema.statics.deleteAllNotifications = async function(userId) {
  return this.deleteMany({ user: userId });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 