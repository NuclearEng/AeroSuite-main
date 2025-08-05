const ssoService = require('../services/sso.service');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Get SSO providers status and configuration
 * @route GET /api/auth/sso/providers
 * @access Public
 */
exports.getProviders = (req, res) => {
  try {
    const providersStatus = ssoService.getProvidersStatus();
    
    // Get enabled and initialized providers only
    const enabledProviders = Object.entries(providersStatus)
      .filter(([_, status]) => status.enabled && status.initialized)
      .map(([provider]) => provider);
    
    res.status(200).json({
      success: true,
      data: {
        enabled: config.sso.enabled,
        providers: enabledProviders
      }
    });
  } catch (error) {
    logger.error('Failed to get SSO providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get SSO providers'
    });
  }
};

/**
 * Begin Microsoft SSO flow
 * @route GET /api/auth/sso/microsoft
 * @access Public
 */
exports.loginWithMicrosoft = (req, res) => {
  try {
    // Generate Microsoft login URL
    const url = ssoService.getMicrosoftLoginUrl({
      redirectAfterLogin: req.query.redirect || config.sso.redirectUrl
    });
    
    // Redirect to Microsoft login
    res.redirect(url);
  } catch (error) {
    logger.error('Microsoft SSO login error:', error);
    res.redirect(`/login?error=${encodeURIComponent('Failed to initiate Microsoft login')}`);
  }
};

/**
 * Handle Microsoft SSO callback
 * @route GET /api/auth/sso/microsoft/callback
 * @access Public
 */
exports.microsoftCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      throw new Error('Authorization code missing');
    }
    
    // Handle the callback
    const result = await ssoService.handleMicrosoftCallback(code, state);
    
    // Get redirect URL from state (default to dashboard)
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const redirectUrl = stateData?.redirectAfterLogin || config.sso.redirectUrl;
    
    // Set JWT token in cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Redirect to the frontend with success
    res.redirect(`${redirectUrl}?sso=microsoft`);
  } catch (error) {
    logger.error('Microsoft SSO callback error:', error);
    res.redirect(`/login?error=${encodeURIComponent('Microsoft authentication failed')}`);
  }
};

/**
 * Begin Google SSO flow
 * @route GET /api/auth/sso/google
 * @access Public
 */
exports.loginWithGoogle = (req, res) => {
  // Mock implementation
  res.status(200).json({
    success: true,
    message: 'Mock Google SSO authentication'
  });
};

/**
 * Handle Google SSO callback
 * @route GET /api/auth/sso/google/callback
 * @access Public
 */
exports.googleCallback = (req, res) => {
  // Mock implementation
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
};

/**
 * Begin Okta SSO flow
 * @route GET /api/auth/sso/okta
 * @access Public
 */
exports.loginWithOkta = (req, res) => {
  try {
    // Generate Okta login URL
    const url = ssoService.getOktaLoginUrl({
      redirectAfterLogin: req.query.redirect || config.sso.redirectUrl
    });
    
    // Redirect to Okta login
    res.redirect(url);
  } catch (error) {
    logger.error('Okta SSO login error:', error);
    res.redirect(`/login?error=${encodeURIComponent('Failed to initiate Okta login')}`);
  }
};

/**
 * Handle Okta SSO callback
 * @route GET /api/auth/sso/okta/callback
 * @access Public
 */
exports.oktaCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      throw new Error('Authorization code missing');
    }
    
    // Handle the callback
    const result = await ssoService.handleOktaCallback(code, state);
    
    // Get redirect URL from state (default to dashboard)
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const redirectUrl = stateData?.redirectAfterLogin || config.sso.redirectUrl;
    
    // Set JWT token in cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Redirect to the frontend with success
    res.redirect(`${redirectUrl}?sso=okta`);
  } catch (error) {
    logger.error('Okta SSO callback error:', error);
    res.redirect(`/login?error=${encodeURIComponent('Okta authentication failed')}`);
  }
};

/**
 * Begin Auth0 SSO flow
 * @route GET /api/auth/sso/auth0
 * @access Public
 */
exports.loginWithAuth0 = (req, res) => {
  try {
    // Generate Auth0 login URL
    const url = ssoService.getAuth0LoginUrl({
      redirectAfterLogin: req.query.redirect || config.sso.redirectUrl
    });
    
    // Redirect to Auth0 login
    res.redirect(url);
  } catch (error) {
    logger.error('Auth0 SSO login error:', error);
    res.redirect(`/login?error=${encodeURIComponent('Failed to initiate Auth0 login')}`);
  }
};

/**
 * Handle Auth0 SSO callback
 * @route GET /api/auth/sso/auth0/callback
 * @access Public
 */
exports.auth0Callback = async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      throw new Error('Authorization code missing');
    }
    
    // Handle the callback
    const result = await ssoService.handleAuth0Callback(code, state);
    
    // Get redirect URL from state (default to dashboard)
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const redirectUrl = stateData?.redirectAfterLogin || config.sso.redirectUrl;
    
    // Set JWT token in cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Redirect to the frontend with success
    res.redirect(`${redirectUrl}?sso=auth0`);
  } catch (error) {
    logger.error('Auth0 SSO callback error:', error);
    res.redirect(`/login?error=${encodeURIComponent('Auth0 authentication failed')}`);
  }
};

/**
 * Begin SAML SSO flow
 * @route GET /api/auth/sso/saml
 * @access Public
 */
exports.loginWithSaml = (req, res) => {
  try {
    // Generate SAML login URL/request
    const loginRequest = ssoService.getSamlLoginRequest({
      redirectAfterLogin: req.query.redirect || config.sso.redirectUrl,
      provider: req.query.provider || 'default'
    });
    
    // Redirect to Identity Provider
    res.redirect(loginRequest);
  } catch (error) {
    logger.error('SAML SSO login error:', error);
    res.redirect(`/login?error=${encodeURIComponent('Failed to initiate SAML login')}`);
  }
};

/**
 * Handle SAML SSO callback/assertion
 * @route POST /api/auth/sso/saml/callback
 * @access Public
 */
exports.samlCallback = async (req, res) => {
  try {
    const { SAMLResponse, RelayState } = req.body;
    
    if (!SAMLResponse) {
      throw new Error('SAML response missing');
    }
    
    // Handle the SAML assertion
    const result = await ssoService.handleSamlCallback(SAMLResponse, RelayState);
    
    // Get redirect URL from relay state (default to dashboard)
    let redirectUrl = config.sso.redirectUrl;
    try {
      const relayStateData = JSON.parse(RelayState);
      if (relayStateData.redirectAfterLogin) {
        redirectUrl = relayStateData.redirectAfterLogin;
      }
    } catch (e) {
      // Use default redirect URL if relay state parsing fails
    }
    
    // Set JWT token in cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    
    // Redirect to the frontend with success
    res.redirect(`${redirectUrl}?sso=saml`);
  } catch (error) {
    logger.error('SAML SSO callback error:', error);
    res.redirect(`/login?error=${encodeURIComponent('SAML authentication failed')}`);
  }
}; 