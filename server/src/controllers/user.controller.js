const User = require('../models/user.model');
const { NotFoundError, BadRequestError, UnauthorizedError } = require('../utils/errorHandler');
const bcrypt = require('bcryptjs');

/**
 * Get all users with pagination and memory optimization
 * @route GET /api/users
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Implement pagination to reduce memory usage
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Project only necessary fields
    const users = await User.find()
      .select('email firstName lastName role createdAt')
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better memory usage
    
    const total = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: users
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user by ID
 * @route GET /api/users/:id
 */
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    // Ensure user can only access their own data unless admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return next(new UnauthorizedError('Not authorized to access this user data'));
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new user
 * @route POST /api/users
 */
exports.createUser = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email }).lean();
    
    if (existingUser) {
      return next(new BadRequestError('User already exists'));
    }
    
    // Create new user
    const user = await User.create({
      email,
      password, // Model will hash the password before saving
      firstName,
      lastName,
      role
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user
 * @route PUT /api/users/:id
 */
exports.updateUser = async (req, res, next) => {
  try {
    // Prevent role update unless admin
    if (req.body.role && req.user.role !== 'admin') {
      return next(new UnauthorizedError('Not authorized to change role'));
    }
    
    // Ensure user can only update their own data unless admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return next(new UnauthorizedError('Not authorized to update this user'));
    }
    
    // Hash password if provided
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete user
 * @route DELETE /api/users/:id
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return next(new NotFoundError('User not found'));
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current user profile
 * @route GET /api/users/profile/me
 */
exports.getProfile = async (req, res, next) => {
  try {
    // Using lean() for better memory efficiency
    const user = await User.findById(req.user.id).select('-password').lean();
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update current user profile
 * @route PUT /api/users/profile/me
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Prevent role updates through this endpoint
    if (req.body.role) {
      return next(new BadRequestError('Cannot update role through this endpoint'));
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Change user password
 * @route PUT /api/users/profile/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Check current password
    const isMatch = await user.matchPassword(currentPassword);
    
    if (!isMatch) {
      return next(new BadRequestError('Current password is incorrect'));
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get user dashboard preferences
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getDashboardPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return dashboard preferences or empty object if not set
    const dashboardPreferences = user.notificationPreferences?.dashboardLayout || {};
    
    return res.status(200).json({
      success: true,
      data: dashboardPreferences
    });
  } catch (error) {
    console.error('Error fetching dashboard preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard preferences',
      error: error.message
    });
  }
};

/**
 * Save user dashboard preferences
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.saveDashboardPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { widgets, layout } = req.body;
    
    if (!widgets || !layout) {
      return res.status(400).json({
        success: false,
        message: 'Widgets and layout are required'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Initialize preferences object if it doesn't exist
    if (!user.notificationPreferences) {
      user.notificationPreferences = {};
    }
    
    // Save dashboard preferences
    user.notificationPreferences.dashboardLayout = {
      widgets,
      layout
    };
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Dashboard preferences saved successfully'
    });
  } catch (error) {
    console.error('Error saving dashboard preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving dashboard preferences',
      error: error.message
    });
  }
};

/**
 * Reset user dashboard preferences
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.resetDashboardPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Reset dashboard preferences
    if (user.notificationPreferences) {
      user.notificationPreferences.dashboardLayout = {};
      await user.save();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Dashboard preferences reset successfully'
    });
  } catch (error) {
    console.error('Error resetting dashboard preferences:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting dashboard preferences',
      error: error.message
    });
  }
}; 