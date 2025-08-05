const { body, param } = require('express-validator');
const passwordValidator = require('password-validator');

// Create password schema
const passwordSchema = new passwordValidator();
passwordSchema
  .is().min(8)
  .is().max(100)
  .has().uppercase()
  .has().lowercase()
  .has().digits(1)
  .has().symbols(1)
  .has().not().spaces();

/**
 * Validates registration request
 */
exports.validateRegistration = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .custom((value) => {
      const validationResult = passwordSchema.validate(value, { list: true });
      if (validationResult.length > 0) {
        const issues = [];
        if (validationResult.includes('min')) issues.push('be at least 8 characters long');
        if (validationResult.includes('max')) issues.push('be at most 100 characters long');
        if (validationResult.includes('uppercase')) issues.push('contain at least one uppercase letter');
        if (validationResult.includes('lowercase')) issues.push('contain at least one lowercase letter');
        if (validationResult.includes('digits')) issues.push('contain at least one number');
        if (validationResult.includes('symbols')) issues.push('contain at least one special character');
        if (validationResult.includes('spaces')) issues.push('not contain spaces');
        
        throw new Error(`Password must ${issues.join(', ')}`);
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('role')
    .optional()
    .isIn(['user', 'admin', 'manager', 'inspector']).withMessage('Invalid role specified'),
  
  body('phoneNumber')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Must be a valid phone number'),
  
  body('customerId')
    .optional()
    .isMongoId().withMessage('Must be a valid customer ID')
];

/**
 * Validates login request
 */
exports.validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validates password reset request
 */
exports.validatePasswordReset = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail()
];

/**
 * Validates password update
 */
exports.validatePasswordUpdate = [
  body('token')
    .notEmpty().withMessage('Token is required'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .custom((value) => {
      const validationResult = passwordSchema.validate(value, { list: true });
      if (validationResult.length > 0) {
        const issues = [];
        if (validationResult.includes('min')) issues.push('be at least 8 characters long');
        if (validationResult.includes('max')) issues.push('be at most 100 characters long');
        if (validationResult.includes('uppercase')) issues.push('contain at least one uppercase letter');
        if (validationResult.includes('lowercase')) issues.push('contain at least one lowercase letter');
        if (validationResult.includes('digits')) issues.push('contain at least one number');
        if (validationResult.includes('symbols')) issues.push('contain at least one special character');
        if (validationResult.includes('spaces')) issues.push('not contain spaces');
        
        throw new Error(`Password must ${issues.join(', ')}`);
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

/**
 * Validates change password request
 */
exports.validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      
      const validationResult = passwordSchema.validate(value, { list: true });
      if (validationResult.length > 0) {
        const issues = [];
        if (validationResult.includes('min')) issues.push('be at least 8 characters long');
        if (validationResult.includes('max')) issues.push('be at most 100 characters long');
        if (validationResult.includes('uppercase')) issues.push('contain at least one uppercase letter');
        if (validationResult.includes('lowercase')) issues.push('contain at least one lowercase letter');
        if (validationResult.includes('digits')) issues.push('contain at least one number');
        if (validationResult.includes('symbols')) issues.push('contain at least one special character');
        if (validationResult.includes('spaces')) issues.push('not contain spaces');
        
        throw new Error(`Password must ${issues.join(', ')}`);
      }
      return true;
    }),
  
  body('confirmPassword')
    .notEmpty().withMessage('Confirm password is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

/**
 * Validates verify email token
 */
exports.validateEmailVerification = [
  param('token')
    .notEmpty().withMessage('Token is required')
    .isLength({ min: 64, max: 64 }).withMessage('Invalid token format')
];

/**
 * Validates two-factor verification
 */
exports.validateTwoFactorVerification = [
  body('token')
    .notEmpty().withMessage('Token is required')
    .isString().withMessage('Token must be a string'),
  
  body('code')
    .notEmpty().withMessage('Verification code is required')
    .isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits')
    .isNumeric().withMessage('Code must contain only numbers')
];

/**
 * Validates two-factor setup
 */
exports.validateTwoFactorSetup = [
  body('method')
    .notEmpty().withMessage('Method is required')
    .isIn(['app', 'email']).withMessage('Invalid method. Must be app or email')
];

/**
 * Validates refresh token
 */
exports.validateRefreshToken = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
    .isString().withMessage('Refresh token must be a string')
    .isLength({ min: 40 }).withMessage('Invalid refresh token format')
]; 