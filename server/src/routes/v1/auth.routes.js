const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const authValidator = require('../../middleware/validators/auth.validator');

// Auth routes
router.post('/register', 
  authValidator.validateRegistration,
  authController.register
);

router.post('/login', 
  authValidator.validateLogin,
  authController.login
);

router.post('/login/v2', 
  authValidator.validateLogin,
  authController.loginV2
);

router.post('/refresh-token',
  authValidator.validateRefreshToken,
  authMiddleware.refreshToken
);

router.post('/logout', 
  authMiddleware.authenticate,
  authController.logout
);

router.post('/verify-email/:token', 
  authValidator.validateEmailVerification,
  authController.verifyEmail
);

router.post('/resend-verification', 
  authValidator.validatePasswordReset, // Reusing email validator
  authController.resendVerification
);

router.post('/forgot-password', 
  authValidator.validatePasswordReset,
  authController.forgotPassword
);

router.post('/reset-password', 
  authValidator.validatePasswordUpdate,
  authController.resetPassword
);

router.post('/change-password', 
  authMiddleware.authenticate,
  authValidator.validateChangePassword,
  authController.changePassword
);

// Two-factor authentication
router.post('/two-factor/setup', 
  authMiddleware.authenticate,
  authValidator.validateTwoFactorSetup,
  authController.setupTwoFactor
);

router.post('/two-factor/verify', 
  authValidator.validateTwoFactorVerification,
  authController.verifyTwoFactor
);

router.post('/two-factor/disable', 
  authMiddleware.authenticate,
  authController.disableTwoFactor
);

// User profile
router.get('/me', 
  authMiddleware.authenticate,
  authController.getCurrentUser
);

router.patch('/me', 
  authMiddleware.authenticate,
  authController.updateProfile
);

// Session management
router.get('/sessions', 
  authMiddleware.authenticate,
  authController.getSessions
);

router.delete('/sessions/:sessionId', 
  authMiddleware.authenticate,
  authController.revokeSession
);

router.delete('/sessions', 
  authMiddleware.authenticate,
  authController.revokeAllSessions
);

// API Keys
router.post('/api-keys', 
  authMiddleware.authenticate,
  authController.createApiKey
);

router.get('/api-keys', 
  authMiddleware.authenticate,
  authController.getApiKeys
);

router.delete('/api-keys/:keyId', 
  authMiddleware.authenticate,
  authController.revokeApiKey
);

// Security settings
router.get('/security-events', 
  authMiddleware.authenticate,
  authController.getSecurityEvents
);

module.exports = router; 