/**
 * Initialize Permissions and Roles
 * 
 * This script initializes the default permissions and roles in the database.
 * It should be run when setting up the system for the first time or when
 * updating the permission system.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Permission = require('../models/permission.model');
const Role = require('../models/role.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    logger.info('Connected to MongoDB');
    
    try {
      // Generate default permissions
      logger.info('Generating default permissions...');
      const permissionResult = await Permission.generateDefaultPermissions();
      logger.info(`Permissions created/updated: ${permissionResult.modifiedCount + permissionResult.upsertedCount}`);
      
      // Generate default roles
      logger.info('Generating default roles...');
      const roleResult = await Role.generateDefaultRoles();
      logger.info(`Roles created/updated: ${roleResult.modifiedCount + roleResult.upsertedCount}`);
      
      // Update existing admin users with the 'admin' role if their current role is not in the system
      logger.info('Updating admin users...');
      const adminUsers = await User.find({ role: 'admin' });
      logger.info(`Found ${adminUsers.length} admin users`);
      
      // Initialize customPermissions field for all users
      logger.info('Initializing customPermissions for all users...');
      const userUpdateResult = await User.updateMany(
        { customPermissions: { $exists: false } },
        { $set: { customPermissions: { granted: [], denied: [] } } }
      );
      logger.info(`Updated ${userUpdateResult.modifiedCount} users with customPermissions field`);
      
      logger.info('Initialization completed successfully');
      
      // Get counts of permissions and roles
      const permissionsCount = await Permission.countDocuments({ isActive: true });
      const rolesCount = await Role.countDocuments({ isActive: true });
      
      logger.info(`System now has ${permissionsCount} active permissions and ${rolesCount} active roles`);
      
      // Get all permission categories
      const categories = await Permission.distinct('category');
      logger.info(`Permission categories: ${categories.join(', ')}`);
      
      // Exit successfully
      process.exit(0);
    } catch (error) {
      logger.error('Error initializing permissions and roles:', error);
      // Exit with error
      process.exit(1);
    }
  })
  .catch(err => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  }); 