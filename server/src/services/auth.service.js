/**
 * Authentication Core Framework - Service
 * Task: TS028 - Authentication Core Framework
 * 
 * This module provides the core authentication functionality,
 * including user authentication, token management, and MFA.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const authConfig = require('../config/auth.config');
const User = require('../models/User');
const Token = require('../models/Token');
const LoginHistory = require('../models/LoginHistory');
const { AppError } = require('../utils/errorHandler');
const emailService = require('./email.service');
const logger = require('../infrastructure/logger');
const { logAuthEvent, SEC_EVENT_SEVERITY } = require('../utils/securityEventLogger');

// Token blacklist storage (replace with Redis in production)
const tokenBlacklist = new Set();

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email: userData.email }, { username: userData.username }] 
      });
      
      if (existingUser) {
        throw new AppError('User already exists', 409);
      }

      // Validate password
      const passwordValidation = this.validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        throw new AppError(passwordValidation.errors.join(', '), 400);
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const user = await User.create({
        ...userData,
        password: hashedPassword,
        isEmailVerified: false,
        isActive: true,
        createdAt: new Date()
      });

      // Generate email verification token
      const verificationToken = await this.generateEmailVerificationToken(user._id);

      // Send verification email
      await emailService.sendVerificationEmail(user.email, verificationToken);

      // Generate tokens
      const tokens = await this.generateAuthTokens(user);

      // Log registration
      await this.logAuthEvent(user._id, 'register', { success: true });

      return {
        user: this.sanitizeUser(user),
        tokens
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(email, password, ipAddress, userAgent) {
    try {
      // Find user
      const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');
      
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Check if account is locked
      if (user.isLocked) {
        throw new AppError('Account is locked. Please try again later.', 423);
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        await this.handleFailedLogin(user);
        throw new AppError('Invalid credentials', 401);
      }

      // Check if email is verified
      if (!user.isEmailVerified) {
        throw new AppError('Please verify your email before logging in', 401);
      }

      // Check if MFA is enabled
      if (user.mfaEnabled) {
        // Generate temporary MFA token
        const mfaToken = await this.generateMFAToken(user._id);
        return {
          requiresMFA: true,
          mfaToken,
          mfaMethods: user.mfaMethods
        };
      }

      // Reset failed login attempts
      await user.resetLoginAttempts();

      // Generate tokens
      const tokens = await this.generateAuthTokens(user);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Log successful login
      await this.logAuthEvent(user._id, 'login', { 
        success: true, 
        ipAddress, 
        userAgent 
      });

      // Record login history
      await LoginHistory.create({
        userId: user._id,
        ipAddress,
        userAgent,
        loginTime: new Date(),
        success: true
      });

      return {
        user: this.sanitizeUser(user),
        tokens
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify MFA code
   */
  async verifyMFA(mfaToken, code, method = 'totp') {
    try {
      // Verify MFA token
      const decoded = await this.verifyToken(mfaToken);
      const user = await User.findById(decoded.userId).select('+mfaSecret');

      if (!user || !user.mfaEnabled) {
        throw new AppError('Invalid MFA token', 401);
      }

      let isValid = false;

      switch (method) {
        case 'totp':
          isValid = this.verifyTOTP(code, user.mfaSecret);
          break;
        
        case 'backup-code':
          isValid = await this.verifyBackupCode(user, code);
          break;

        default:
          throw new AppError('Invalid MFA method', 400);
      }

      if (!isValid) {
        await this.logAuthEvent(user._id, 'mfa_failed', { method });
        throw new AppError('Invalid MFA code', 401);
      }

      // Generate auth tokens
      const tokens = await this.generateAuthTokens(user);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Log successful MFA
      await this.logAuthEvent(user._id, 'mfa_success', { method });

      return {
        user: this.sanitizeUser(user),
        tokens
      };
    } catch (error) {
      logger.error('MFA verification error:', error);
      throw error;
    }
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Generate secret
      const secret = this.generateTOTPSecret(user.email);

      // Generate QR code
      const qrCode = await this.generateTOTPQRCode(secret.otpauth_url);

      // Generate backup codes
      const backupCodes = await this.generateRecoveryCodes();

      // Store secret temporarily (not enabled yet)
      user.mfaSecret = secret.secret;
      
      // Hash backup codes
      const hashedBackupCodes = await this.hashRecoveryCodes(backupCodes);
      
      user.mfaBackupCodes = hashedBackupCodes;
      await user.save();

      return {
        secret: secret.secret,
        qrCode,
        backupCodes
      };
    } catch (error) {
      logger.error('MFA setup error:', error);
      throw error;
    }
  }

  /**
   * Enable MFA after verification
   */
  async enableMFA(userId, verificationCode) {
    try {
      const user = await User.findById(userId).select('+mfaSecret');
      
      if (!user || !user.mfaSecret) {
        throw new AppError('MFA setup not initiated', 400);
      }

      // Verify the code
      const isValid = this.verifyTOTP(verificationCode, user.mfaSecret);

      if (!isValid) {
        throw new AppError('Invalid verification code', 400);
      }

      // Enable MFA
      user.mfaEnabled = true;
      user.mfaMethods = ['totp', 'backup-codes'];
      await user.save();

      // Log MFA enablement
      await this.logAuthEvent(userId, 'mfa_enabled', { method: 'totp' });

      return { success: true };
    } catch (error) {
      logger.error('MFA enable error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = await this.verifyToken(refreshToken);
      
      // Check if token exists in database
      const tokenDoc = await Token.findOne({
        token: refreshToken,
        type: 'refresh',
        userId: decoded.userId,
        expiresAt: { $gt: new Date() }
      });

      if (!tokenDoc) {
        throw new AppError('Invalid refresh token', 401);
      }

      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      return { accessToken };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    try {
      // Remove refresh token from database
      await Token.deleteOne({ token: refreshToken, type: 'refresh' });
      
      // Blacklist the token
      await this.blacklistToken(refreshToken);
      
      return { success: true };
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email) {
    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        // Don't reveal if user exists
        return { success: true };
      }

      // Generate reset token
      const resetToken = this.generateRandomToken(32);
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Save token
      await Token.create({
        userId: user._id,
        token: hashedToken,
        type: 'password-reset',
        expiresAt: new Date(Date.now() + authConfig.tokens.passwordReset.expiresIn)
      });

      // Send reset email
      await emailService.sendPasswordResetEmail(user.email, resetToken);

      // Log password reset request
      await this.logAuthEvent(user._id, 'password_reset_requested', {});

      return { success: true };
    } catch (error) {
      logger.error('Password reset request error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    try {
      // Hash the token to find it
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Find valid token
      const tokenDoc = await Token.findOne({
        token: hashedToken,
        type: 'password-reset',
        expiresAt: { $gt: new Date() }
      });

      if (!tokenDoc) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Get user
      const user = await User.findById(tokenDoc.userId).select('+passwordHistory');
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(passwordValidation.errors.join(', '), 400);
      }

      // Check password history
      await this.checkPasswordHistory(user, newPassword);

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password and history
      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      user.passwordHistory.push({
        password: hashedPassword,
        changedAt: new Date()
      });

      // Keep only last N passwords in history
      if (user.passwordHistory.length > authConfig.passwordPolicy.historyCount) {
        user.passwordHistory = user.passwordHistory.slice(-authConfig.passwordPolicy.historyCount);
      }

      await user.save();

      // Delete the reset token
      await Token.deleteOne({ _id: tokenDoc._id });

      // Log password reset
      await this.logAuthEvent(user._id, 'password_reset_completed', {});

      return { success: true };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password +passwordHistory');
      
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isPasswordValid = await this.verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      // Validate new password
      const passwordValidation = this.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(passwordValidation.errors.join(', '), 400);
      }

      // Check password history
      await this.checkPasswordHistory(user, newPassword);

      // Hash new password
      const hashedPassword = await this.hashPassword(newPassword);

      // Update password
      user.password = hashedPassword;
      user.passwordChangedAt = new Date();
      user.passwordHistory.push({
        password: hashedPassword,
        changedAt: new Date()
      });

      // Keep only last N passwords
      if (user.passwordHistory.length > authConfig.passwordPolicy.historyCount) {
        user.passwordHistory = user.passwordHistory.slice(-authConfig.passwordPolicy.historyCount);
      }

      await user.save();

      // Log password change
      await this.logAuthEvent(userId, 'password_changed', {});

      return { success: true };
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

  // Helper methods
  
  generateAccessToken(user) {
    return jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        role: user.role 
      },
      authConfig.jwt.secret,
      {
        expiresIn: authConfig.jwt.expiresIn,
        issuer: authConfig.jwt.issuer,
        audience: authConfig.jwt.audience
      }
    );
  }

  async generateRefreshToken(userId) {
    const refreshToken = jwt.sign(
      { userId, type: 'refresh' },
      authConfig.jwt.refreshSecret,
      {
        expiresIn: authConfig.jwt.refreshExpiresIn,
        issuer: authConfig.jwt.issuer
      }
    );

    // Store in database
    await Token.create({
      userId,
      token: refreshToken,
      type: 'refresh',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return refreshToken;
  }

  async generateAuthTokens(user) {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user._id);

    return { accessToken, refreshToken };
  }

  async generateMFAToken(userId) {
    return jwt.sign(
      { userId, type: 'mfa' },
      authConfig.jwt.secret,
      { expiresIn: '5m' }
    );
  }

  async generateEmailVerificationToken(userId) {
    const token = this.generateRandomToken(32);
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    await Token.create({
      userId,
      token: hashedToken,
      type: 'email-verification',
      expiresAt: new Date(Date.now() + authConfig.tokens.emailVerification.expiresIn)
    });

    return token;
  }

  async generateRecoveryCodes() {
    const { mfa } = authConfig;
    const recoveryConfig = mfa.methods.recovery;
    
    const codes = [];
    const codeLength = recoveryConfig.codeLength;
    
    for (let i = 0; i < recoveryConfig.codeCount; i++) {
      const code = crypto.randomBytes(Math.ceil(codeLength / 2))
        .toString('hex')
        .slice(0, codeLength)
        .toUpperCase();
        
      // Format code as xxxx-xxxx-xxxx for better readability
      const formattedCode = code.match(/.{1,4}/g).join('-');
      codes.push(formattedCode);
    }
    
    return codes;
  }

  async hashRecoveryCodes(codes) {
    const hashedCodes = [];
    
    for (const code of codes) {
      const normalizedCode = code.replace(/-/g, '').toUpperCase();
      const hashedCode = await this.hashPassword(normalizedCode);
      hashedCodes.push(hashedCode);
    }
    
    return hashedCodes;
  }

  async verifyRecoveryCode(code, hashedCodes) {
    const normalizedCode = code.replace(/-/g, '').toUpperCase();
    
    for (let i = 0; i < hashedCodes.length; i++) {
      const isValid = await this.verifyPassword(normalizedCode, hashedCodes[i]);
      if (isValid) {
        return { isValid: true, index: i };
      }
    }
    
    return { isValid: false, index: -1 };
  }

  async verifyBackupCode(user, code) {
    const backupCode = user.mfaBackupCodes.find(bc => !bc.used);
    
    if (!backupCode) {
      return false;
    }

    const isValid = await this.verifyPassword(code, backupCode.code);
    
    if (isValid) {
      backupCode.used = true;
      backupCode.usedAt = new Date();
      await user.save();
    }

    return isValid;
  }

  validatePassword(password) {
    const result = {
      isValid: true,
      errors: []
    };
    
    const { passwordPolicy } = authConfig;
    
    // Check minimum length
    if (password.length < passwordPolicy.minLength) {
      result.isValid = false;
      result.errors.push(`Password must be at least ${passwordPolicy.minLength} characters long`);
    }
    
    // Check for uppercase letters
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one uppercase letter');
    }
    
    // Check for lowercase letters
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one lowercase letter');
    }
    
    // Check for numbers
    if (passwordPolicy.requireNumbers && !/[0-9]/.test(password)) {
      result.isValid = false;
      result.errors.push('Password must contain at least one number');
    }
    
    // Check for special characters
    if (passwordPolicy.requireSpecialChars) {
      const specialCharsRegex = new RegExp(`[${passwordPolicy.specialChars.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`);
      if (!specialCharsRegex.test(password)) {
        result.isValid = false;
        result.errors.push('Password must contain at least one special character');
      }
    }
    
    return result;
  }

  async checkPasswordHistory(user, newPassword) {
    if (!user.passwordHistory || user.passwordHistory.length === 0) {
      return;
    }

    for (const oldPassword of user.passwordHistory) {
      const isReused = await this.verifyPassword(newPassword, oldPassword.password);
      if (isReused) {
        throw new AppError(
          `Password cannot be the same as your last ${authConfig.passwordPolicy.historyCount} passwords`,
          400
        );
      }
    }
  }

  async handleFailedLogin(user) {
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    if (user.loginAttempts >= authConfig.passwordPolicy.lockoutThreshold) {
      user.lockUntil = new Date(Date.now() + authConfig.passwordPolicy.lockoutDuration);
    }
    
    await user.save();
  }

  async logAuthEvent(userId, action, metadata) {
    try {
      await logger.audit({
        userId,
        action,
        category: 'authentication',
        metadata,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to log auth event:', error);
    }
  }

  sanitizeUser(user) {
    const sanitized = user.toObject();
    delete sanitized.password;
    delete sanitized.mfaSecret;
    delete sanitized.mfaBackupCodes;
    delete sanitized.passwordHistory;
    delete sanitized.loginAttempts;
    delete sanitized.lockUntil;
    return sanitized;
  }

  async verifyToken(token) {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }
    
    const { jwt: jwtConfig } = authConfig;
    
    const options = {
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
      algorithms: [jwtConfig.algorithm],
      clockTolerance: jwtConfig.clockTolerance
    };
    
    try {
      return jwt.verify(token, jwtConfig.secret, options);
    } catch (error) {
      // Log authentication failure
      logAuthEvent(
        SEC_EVENT_SEVERITY.MEDIUM,
        'Token verification failed',
        {
          error: error.message,
          tokenType: 'JWT',
          action: 'VERIFY_TOKEN'
        }
      );
      
      throw error;
    }
  }

  async blacklistToken(token, options = {}) {
    // In a production system, this would use Redis with token expiration
    tokenBlacklist.add(token);
    
    // Log token blacklisting
    logAuthEvent(
      SEC_EVENT_SEVERITY.INFO,
      'Token blacklisted',
      {
        tokenType: 'JWT',
        action: 'BLACKLIST_TOKEN',
        reason: options.reason || 'logout',
        userId: options.userId || 'unknown'
      }
    );
  }

  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async verifyTOTP(token, secret) {
    const { mfa } = authConfig;
    const totpConfig = mfa.methods.totp;
    
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: totpConfig.window,
      algorithm: totpConfig.algorithm,
      digits: totpConfig.digits
    });
  }

  generateTOTPSecret(userIdentifier) {
    const { mfa } = authConfig;
    const totpConfig = mfa.methods.totp;
    
    const secret = speakeasy.generateSecret({
      length: 20,
      name: `${totpConfig.issuer}:${userIdentifier}`,
      issuer: totpConfig.issuer
    });
    
    return {
      secret: secret.base32,
      otpauth_url: secret.otpauth_url
    };
  }

  async generateTOTPQRCode(otpauthUrl) {
    return QRCode.toDataURL(otpauthUrl);
  }

  generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new AuthService(); 