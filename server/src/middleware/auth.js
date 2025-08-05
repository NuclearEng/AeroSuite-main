const jwt = require('jsonwebtoken');
const { UnauthorizedError, ForbiddenError } = require('../utils/errorHandler');
const User = require('../models/user.model');

/**
 * Middleware to protect routes by verifying JWT token
 */
const protect = async (req, res, next) => {
  try {
    // 1) Get token from Authorization header
    const authHeader = req.headers.authorization;
    let token;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return next(new UnauthorizedError('You are not logged in. Please log in to access this resource.'));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const user = await User.findById(decoded.id).select('+isActive');
    if (!user) {
      return next(new UnauthorizedError('The user associated with this token no longer exists.'));
    }

    // 4) Check if user is active
    if (!user.isActive) {
      return next(new UnauthorizedError('Your account has been deactivated. Please contact an administrator.'));
    }

    // 5) Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new UnauthorizedError('Invalid token. Please log in again.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Your token has expired. Please log in again.'));
    }
    return next(error);
  }
};

/**
 * Middleware to restrict access to specific roles
 * @param {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('You are not logged in. Please log in first.'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action.'));
    }

    next();
  };
};

module.exports = {
  protect,
  restrictTo
}; 