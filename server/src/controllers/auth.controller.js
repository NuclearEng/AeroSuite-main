const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/user.model');
const { 
  sendPasswordResetEmail, 
  sendTwoFactorCode, 
  sendTwoFactorEnabledNotification,
  sendEmailVerificationEmail,
  sendEmailVerificationSuccessEmail
} = require('../services/email.service');
const twoFactorService = require('../services/twoFactor.service');
const securityService = require('../services/security.service');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
exports.register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { firstName, lastName, email, password, role, phoneNumber, customerId } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for security
    const hashedEmailToken = crypto
      .createHash('sha256')
      .update(emailVerificationToken)
      .digest('hex');
    
    // Set token expiration to 24 hours
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      phoneNumber,
      customerId,
      emailVerified: false,
      emailVerificationToken: hashedEmailToken,
      emailVerificationExpires
    });

    await newUser.save();

    // Generate verification URL
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;
    
    // Send verification email
    await sendEmailVerificationEmail(newUser.email, verificationUrl, newUser.firstName);

    // Create token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove password from response
    const user = newUser.toObject();
    delete user.password;
    delete user.emailVerificationToken;
    delete user.emailVerificationExpires;

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      token,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check login attempts before proceeding
    await securityService.checkLoginAllowed(email, req.ip);

    // Check if user exists
    const user = await User.findOne({ email }).select('+password +twoFactorAuth.enabled +twoFactorAuth.secret +twoFactorAuth.method +loginHistory +securityEvents');
    
    // Track login attempt regardless of success
    // We do this before checking if user exists to prevent username enumeration
    const loginSuccessful = user && await user.comparePassword(password);
    await securityService.trackLoginAttempt(
      email, 
      req.ip, 
      req.headers['user-agent'], 
      loginSuccessful
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator.'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        emailVerificationRequired: true
      });
    }

    // Check if password matches
    if (!loginSuccessful) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check for suspicious activity
    const suspiciousActivity = await securityService.detectSuspiciousActivity(
      user, 
      req.ip, 
      req.headers['user-agent']
    );
    
    // If suspicious login is detected, we might:
    // 1. Require additional verification
    // 2. Force 2FA even if not enabled
    // 3. Notify the user
    // 4. Log the event for security monitoring
    const forceMfa = suspiciousActivity.suspiciousLogin && !user.twoFactorAuth.enabled;

    // Check if 2FA is enabled or forced due to suspicious activity
    if (user.twoFactorAuth.enabled || forceMfa) {
      // Generate temporary login token
      const tempToken = securityService.createSecureToken(
        user,
        req.ip,
        req.headers['user-agent'],
        { 
          expiresIn: '15m',
          additionalClaims: { 
            requires2FA: true,
            forcedMfa: forceMfa,
            suspiciousLogin: suspiciousActivity.suspiciousLogin
          }
        }
      );

      // If using email-based 2FA, send code
      if (user.twoFactorAuth.method === 'email' || forceMfa) {
        const twoFactorService = require('../services/twoFactor.service');
        const twoFactorCode = twoFactorService.generateTemporaryToken();
        
        // Store the token temporarily
        user.twoFactorAuth.tempSecret = twoFactorCode.token;
        user.markModified('twoFactorAuth');
        await user.save();
        
        // Send code via email
        const emailService = require('../services/email.service');
        await emailService.sendTwoFactorCode(
          user.email, 
          twoFactorCode.token, 
          user.firstName, 
          suspiciousActivity.suspiciousLogin ? suspiciousActivity.reasons : null
        );
      }

      return res.status(200).json({
        success: true,
        message: suspiciousActivity.suspiciousLogin 
          ? 'Additional verification required due to suspicious login attempt' 
          : 'Two-factor authentication required',
        tempToken,
        twoFactorMethod: forceMfa ? 'email' : user.twoFactorAuth.method,
        suspiciousLogin: suspiciousActivity.suspiciousLogin,
        suspiciousReasons: suspiciousActivity.reasons
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Add refresh token to user's tokens array
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({
      token: refreshToken,
      expires: refreshTokenExpiry,
      createdAt: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    // Limit stored refresh tokens to prevent DB bloat
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    await user.save();

    // Create token with security features
    const accessToken = securityService.createSecureToken(
      user,
      req.ip,
      req.headers['user-agent']
    );

    // Remove sensitive data from response
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.twoFactorAuth.secret;
    delete userObject.twoFactorAuth.tempSecret;
    delete userObject.refreshTokens;
    delete userObject.loginHistory; // Don't send full history
    delete userObject.securityEvents;

    // Set refresh token as an HttpOnly cookie for better security
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: accessToken,
      refreshToken, // Also include in response for clients that can't use cookies
      user: userObject
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login user (v2 with PKCE support for SPAs)
 * @route POST /api/v2/auth/login
 * @access Public
 */
exports.loginV2 = async (req, res) => {
  try {
    const { email, password, codeVerifier, codeChallenge, codeChallengeMethod } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password +twoFactorAuth.enabled +twoFactorAuth.secret +twoFactorAuth.method +refreshTokens');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account is deactivated. Please contact an administrator.'
      });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return res.status(401).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        emailVerificationRequired: true
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Track login attempt for security metrics
    await User.updateOne({ _id: user._id }, { 
      $push: { 
        loginHistory: { 
          timestamp: new Date(), 
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        } 
      } 
    });

    // PKCE verification if code verifier is provided
    let pkceVerified = true;
    if (codeVerifier && user.pendingCodeChallenge) {
      // Verify the code challenge
      const computedChallenge = crypto
        .createHash('sha256')
        .update(codeVerifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
      
      pkceVerified = (computedChallenge === user.pendingCodeChallenge);
      
      if (!pkceVerified) {
        return res.status(401).json({
          success: false,
          message: 'PKCE verification failed'
        });
      }
      
      // Clear the pending code challenge
      user.pendingCodeChallenge = undefined;
      await user.save();
    } else if (codeChallenge && codeChallengeMethod) {
      // Store the code challenge for future verification
      user.pendingCodeChallenge = codeChallenge;
      await user.save();
    }

    // Check if 2FA is enabled
    if (user.twoFactorAuth.enabled) {
      // Generate temporary login token
      const tempToken = jwt.sign(
        { 
          id: user._id, 
          role: user.role,
          requires2FA: true,
          pkceVerified
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Short-lived token
      );

      // If using email-based 2FA, send code
      if (user.twoFactorAuth.method === 'email') {
        const { token } = twoFactorService.generateTemporaryToken();
        
        // Store the token temporarily
        user.twoFactorAuth.tempSecret = token;
        user.markModified('twoFactorAuth');
        await user.save();
        
        // Send code via email
        await sendTwoFactorCode(user.email, token, user.firstName);
      }

      return res.status(200).json({
        success: true,
        message: 'Two-factor authentication required',
        tempToken,
        twoFactorMethod: user.twoFactorAuth.method
      });
    }

    // Update last login
    user.lastLogin = new Date();
    
    // Generate refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Add refresh token to user's tokens array
    user.refreshTokens.push({
      token: refreshToken,
      expires: refreshTokenExpiry,
      createdAt: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    // Limit stored refresh tokens to prevent DB bloat
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    
    await user.save();

    // Create access token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Remove sensitive data from response
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.twoFactorAuth.secret;
    delete userObject.twoFactorAuth.tempSecret;
    delete userObject.refreshTokens;

    // Set refresh token as an HttpOnly cookie for better security
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken, // Also include in response for clients that can't use cookies
      user: userObject
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 * @access Public
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Token expires in 1 hour
    user.resetPasswordExpires = Date.now() + 3600000;
    
    await user.save();

    // Send email with reset link
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    
    await sendPasswordResetEmail(user.email, resetUrl, user.firstName);

    res.status(200).json({
      success: true,
      message: 'Password reset email sent'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Reset password
 * @route POST /api/auth/reset-password/:token
 * @access Public
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with the token and check if token is still valid
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Change password
 * @route POST /api/auth/change-password
 * @access Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update user profile
 * @route PUT /api/auth/update-profile
 * @access Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, preferences } = req.body;

    const updateData = {
      firstName,
      lastName,
      phoneNumber
    };

    // Only update preferences if provided
    if (preferences) {
      updateData.preferences = preferences;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Initialize two-factor authentication setup
 * @route POST /api/auth/2fa/setup
 * @access Private
 */
exports.setupTwoFactor = async (req, res) => {
  try {
    const { method } = req.body;
    
    // Validate method
    if (!['app', 'email', 'sms'].includes(method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA method'
      });
    }
    
    // Get user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // If method is app, generate TOTP secret
    if (method === 'app') {
      const secret = twoFactorService.generateSecret(user.email);
      
      // Store temporary secret
      user.twoFactorAuth.tempSecret = secret.base32;
      user.twoFactorAuth.method = method;
      user.markModified('twoFactorAuth');
      await user.save();
      
      // Generate QR code
      const qrCode = await twoFactorService.generateQRCode(secret.otpauth_url);
      
      return res.status(200).json({
        success: true,
        message: 'Two-factor authentication setup initialized',
        qrCode,
        secret: secret.base32
      });
    }
    
    // For email/SMS, set method and generate verification code
    if (method === 'email' || method === 'sms') {
      const { token } = twoFactorService.generateTemporaryToken();
      
      user.twoFactorAuth.tempSecret = token;
      user.twoFactorAuth.method = method;
      user.markModified('twoFactorAuth');
      await user.save();
      
      // Send verification code
      if (method === 'email') {
        await sendTwoFactorCode(user.email, token, user.firstName);
      } else if (method === 'sms' && user.phoneNumber) {
        // This would integrate with SMS service in production
        console.log(`SMS code ${token} would be sent to ${user.phoneNumber}`);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Phone number is required for SMS authentication'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `Verification code sent via ${method}`,
        method
      });
    }
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify and enable two-factor authentication
 * @route POST /api/auth/2fa/verify
 * @access Private
 */
exports.verifyAndEnableTwoFactor = async (req, res) => {
  try {
    const { token } = req.body;
    
    // Get user with 2FA fields
    const user = await User.findById(req.user.id).select('+twoFactorAuth.tempSecret +twoFactorAuth.method');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.twoFactorAuth.tempSecret) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication setup not initialized'
      });
    }
    
    let isValid = false;
    
    // Verify token based on method
    if (user.twoFactorAuth.method === 'app') {
      isValid = twoFactorService.verifyToken(token, user.twoFactorAuth.tempSecret);
    } else {
      // For email/SMS, directly compare tokens
      isValid = token === user.twoFactorAuth.tempSecret;
    }
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // Token is valid, enable 2FA
    const backupCodes = twoFactorService.generateBackupCodes();
    const hashedBackupCodes = twoFactorService.hashBackupCodes(backupCodes);
    
    // Update user with 2FA data
    user.twoFactorAuth.enabled = true;
    user.twoFactorAuth.secret = user.twoFactorAuth.tempSecret;
    user.twoFactorAuth.tempSecret = undefined;
    user.twoFactorAuth.backupCodes = hashedBackupCodes;
    user.markModified('twoFactorAuth');
    await user.save();
    
    // Send notification email
    await sendTwoFactorEnabledNotification(user.email, user.firstName);
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
      backupCodes
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify 2FA token during login
 * @route POST /api/auth/2fa/verify-login
 * @access Public (with temp token)
 */
exports.verifyTwoFactorLogin = async (req, res) => {
  try {
    const { token, tempToken } = req.body;
    
    if (!token || !tempToken) {
      return res.status(400).json({
        success: false,
        message: 'Verification code and temporary token are required'
      });
    }
    
    // Verify temp token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    // Check if token has 2FA flag
    if (!decoded.requires2FA) {
      return res.status(400).json({
        success: false,
        message: 'Invalid authentication flow'
      });
    }
    
    // Get user with 2FA fields
    const user = await User.findById(decoded.id).select('+twoFactorAuth.secret +twoFactorAuth.tempSecret +twoFactorAuth.backupCodes +twoFactorAuth.method');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    let isValid = false;
    let isBackupCode = false;
    
    // Check if using backup code (format: XXXX-XXXX-XXXX-XXXX)
    if (token.includes('-') || token.length > 10) {
      isValid = twoFactorService.verifyBackupCode(token, user.twoFactorAuth.backupCodes);
      isBackupCode = true;
    } else {
      // Verify based on method
      if (user.twoFactorAuth.method === 'app') {
        isValid = twoFactorService.verifyToken(token, user.twoFactorAuth.secret);
      } else {
        // For email/SMS, compare with tempSecret
        isValid = token === user.twoFactorAuth.tempSecret;
      }
    }
    
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }
    
    // If backup code was used, remove it
    if (isBackupCode) {
      user.twoFactorAuth.backupCodes = twoFactorService.removeUsedBackupCode(
        token,
        user.twoFactorAuth.backupCodes
      );
      user.markModified('twoFactorAuth.backupCodes');
    }
    
    // Clear temporary secret if using email/SMS
    if (user.twoFactorAuth.method !== 'app') {
      user.twoFactorAuth.tempSecret = undefined;
      user.markModified('twoFactorAuth');
    }
    
    // Update last login and last used 2FA
    user.lastLogin = new Date();
    user.twoFactorAuth.lastUsed = new Date();
    await user.save();
    
    // Create full access token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Remove sensitive data
    const userObject = user.toObject();
    delete userObject.twoFactorAuth.secret;
    delete userObject.twoFactorAuth.tempSecret;
    delete userObject.twoFactorAuth.backupCodes;
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication successful',
      token: accessToken,
      user: userObject
    });
  } catch (error) {
    console.error('2FA login verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Disable two-factor authentication
 * @route POST /api/auth/2fa/disable
 * @access Private
 */
exports.disableTwoFactor = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to disable 2FA'
      });
    }
    
    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    
    // Disable 2FA
    user.twoFactorAuth = {
      enabled: false,
      method: 'app'
    };
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Two-factor authentication disabled successfully'
    });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disabling two-factor authentication',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Generate new backup codes
 * @route POST /api/auth/2fa/backup-codes
 * @access Private
 */
exports.generateBackupCodes = async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to generate new backup codes'
      });
    }
    
    // Get user with password and 2FA fields
    const user = await User.findById(req.user.id).select('+password +twoFactorAuth.enabled');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }
    
    // Check if 2FA is enabled
    if (!user.twoFactorAuth.enabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled'
      });
    }
    
    // Generate new backup codes
    const backupCodes = twoFactorService.generateBackupCodes();
    const hashedBackupCodes = twoFactorService.hashBackupCodes(backupCodes);
    
    // Update user
    user.twoFactorAuth.backupCodes = hashedBackupCodes;
    user.markModified('twoFactorAuth');
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'New backup codes generated successfully',
      backupCodes
    });
  } catch (error) {
    console.error('Generate backup codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating new backup codes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify email
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Hash the token to compare with stored token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    
    // Find user with the token and check if token is still valid
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // Mark email as verified and remove verification fields
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    
    await user.save();
    
    // Send confirmation email
    await sendEmailVerificationSuccessEmail(user.email, user.firstName);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 * @access Public
 */
exports.resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }
    
    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token for security
    const hashedEmailToken = crypto
      .createHash('sha256')
      .update(emailVerificationToken)
      .digest('hex');
    
    // Set token expiration to 24 hours
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    
    // Update user with new token
    user.emailVerificationToken = hashedEmailToken;
    user.emailVerificationExpires = emailVerificationExpires;
    
    await user.save();
    
    // Generate verification URL
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;
    
    // Send verification email
    await sendEmailVerificationEmail(user.email, verificationUrl, user.firstName);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending verification email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Refresh access token using refresh token
 * @route POST /api/v2/auth/refresh-token
 * @access Public
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body || req.cookies;
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Find user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken,
      'refreshTokens.expires': { $gt: new Date() }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Implement refresh token rotation for enhanced security
    // Remove the used refresh token
    user.refreshTokens = user.refreshTokens.filter(
      token => token.token !== refreshToken
    );
    
    // Generate new refresh token
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Add new refresh token
    user.refreshTokens.push({
      token: newRefreshToken,
      expires: refreshTokenExpiry,
      createdAt: new Date(),
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    await user.save();
    
    // Generate new access token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Error refreshing token',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all active sessions for a user
 * @route GET /api/v2/auth/sessions
 * @access Private
 */
exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('refreshTokens');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Format sessions for client
    const sessions = user.refreshTokens.map(token => ({
      id: token._id,
      createdAt: token.createdAt,
      expiresAt: token.expires,
      userAgent: token.userAgent,
      ipAddress: token.ipAddress,
      isCurrent: token.userAgent === req.headers['user-agent'] && token.ipAddress === req.ip
    }));
    
    res.status(200).json({
      success: true,
      sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Terminate a specific session
 * @route DELETE /api/v2/auth/sessions/:sessionId
 * @access Private
 */
exports.terminateSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    
    const result = await User.updateOne(
      { _id: userId },
      { $pull: { refreshTokens: { _id: sessionId } } }
    );
    
    if (result.nModified === 0) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or already terminated'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    console.error('Terminate session error:', error);
    res.status(500).json({
      success: false,
      message: 'Error terminating session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Terminate all sessions except current
 * @route DELETE /api/v2/auth/sessions
 * @access Private
 */
exports.terminateAllSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find current refresh token by user agent and IP
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Keep only current session if identifiable
    const currentToken = user.refreshTokens.find(
      token => token.userAgent === req.headers['user-agent'] && token.ipAddress === req.ip
    );
    
    if (currentToken) {
      user.refreshTokens = [currentToken];
    } else {
      user.refreshTokens = [];
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'All other sessions terminated successfully'
    });
  } catch (error) {
    console.error('Terminate all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error terminating sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Complete user onboarding
 * @route PUT /api/auth/complete-onboarding
 * @access Private
 */
exports.completeOnboarding = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        $set: { 
          onboardingCompleted: true,
          onboardingCompletedAt: new Date()
        } 
      },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: {
        onboardingCompleted: user.onboardingCompleted,
        onboardingCompletedAt: user.onboardingCompletedAt
      }
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing onboarding',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = exports; 