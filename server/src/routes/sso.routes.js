/**
 * SSO Routes
 * 
 * Provides single sign-on authentication endpoints
 */

const express = require('express');
const router = express.Router();
const ssoController = require('../controllers/sso.controller');

/**
 * @route   GET /api/auth/sso/providers
 * @desc    Get available SSO providers
 * @access  Public
 */
router.get('/providers', ssoController.getProviders);

/**
 * @route   GET /api/auth/sso/microsoft
 * @desc    Login with Microsoft
 * @access  Public
 */
router.get('/microsoft', ssoController.loginWithMicrosoft);

/**
 * @route   GET /api/auth/sso/microsoft/callback
 * @desc    Handle Microsoft callback
 * @access  Public
 */
router.get('/microsoft/callback', ssoController.microsoftCallback);

/**
 * @route   GET /api/auth/sso/google
 * @desc    Authenticate with Google
 * @access  Public
 */
router.get('/google', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mock Google SSO authentication'
  });
});

/**
 * @route   GET /api/auth/sso/google/callback
 * @desc    Google auth callback
 * @access  Public
 */
router.get('/google/callback', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mock Google SSO callback',
    token: 'mock-jwt-token',
    user: {
      _id: 'user_123456789',
      email: 'google-user@example.com',
      role: 'user'
    }
  });
});

/**
 * @route   GET /api/auth/sso/okta
 * @desc    Login with Okta
 * @access  Public
 */
router.get('/okta', ssoController.loginWithOkta);

/**
 * @route   GET /api/auth/sso/okta/callback
 * @desc    Handle Okta callback
 * @access  Public
 */
router.get('/okta/callback', ssoController.oktaCallback);

/**
 * @route   GET /api/auth/sso/auth0
 * @desc    Login with Auth0
 * @access  Public
 */
router.get('/auth0', ssoController.loginWithAuth0);

/**
 * @route   GET /api/auth/sso/auth0/callback
 * @desc    Handle Auth0 callback
 * @access  Public
 */
router.get('/auth0/callback', ssoController.auth0Callback);

/**
 * @route   GET /api/auth/sso/saml
 * @desc    Login with SAML
 * @access  Public
 */
router.get('/saml', ssoController.loginWithSaml);

/**
 * @route   POST /api/auth/sso/saml/callback
 * @desc    Handle SAML callback
 * @access  Public
 */
router.post('/saml/callback', ssoController.samlCallback);

module.exports = router; 