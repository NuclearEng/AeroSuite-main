const config = require('../config');
const logger = require('../infrastructure/logger');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const querystring = require('querystring');
// Commenting out SAML2-js to avoid dependency issues
// const saml2 = require('saml2-js');
const msal = require('@azure/msal-node');

// OAuth2 state token store (in-memory for simplicity, in production use Redis)
const stateStore = new Map();

/**
 * Single Sign-On Service
 * 
 * Handles integration with various SSO providers (Microsoft, Google, Okta, Auth0, SAML)
 */
class SSOService {
  constructor() {
    this.initialized = false;
    this.providers = {
      microsoft: null,
      google: null,
      okta: null,
      auth0: null,
      saml: null
    };
    
    this.initialize();
  }

  /**
   * Initialize the SSO service and configure providers
   */
  initialize() {
    try {
      if (!config.sso?.enabled) {
        logger.info('SSO is disabled in configuration');
        return;
      }

      // Initialize Microsoft provider
      if (config.sso.microsoft?.enabled) {
        this.initializeMicrosoftProvider();
      }
      
      // Initialize Google provider
      if (config.sso.google?.enabled) {
        this.initializeGoogleProvider();
      }
      
      // Initialize Okta provider
      if (config.sso.okta?.enabled) {
        this.initializeOktaProvider();
      }
      
      // Initialize Auth0 provider
      if (config.sso.auth0?.enabled) {
        this.initializeAuth0Provider();
      }
      
      // Initialize SAML provider
      if (config.sso.saml?.enabled) {
        this.initializeSamlProvider();
      }
      
      this.initialized = true;
      logger.info('SSO service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize SSO service:', error);
    }
  }

  /**
   * Initialize Microsoft/Azure AD provider
   */
  initializeMicrosoftProvider() {
    try {
      const { clientId, clientSecret, authority } = config.sso.microsoft;
      
      if (!clientId || !clientSecret) {
        logger.warn('Microsoft SSO credentials are missing');
        return;
      }
      
      const msalConfig = {
        auth: {
          clientId,
          clientSecret,
          authority
        }
      };
      
      this.providers.microsoft = new msal.ConfidentialClientApplication(msalConfig);
      logger.info('Microsoft SSO provider initialized');
    } catch (error) {
      logger.error('Failed to initialize Microsoft SSO provider:', error);
    }
  }

  /**
   * Initialize Google provider
   */
  initializeGoogleProvider() {
    try {
      const { clientId, clientSecret, redirectUri } = config.sso.google;
      
      if (!clientId || !clientSecret) {
        logger.warn('Google SSO credentials are missing');
        return;
      }
      
      this.providers.google = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
      
      logger.info('Google SSO provider initialized');
    } catch (error) {
      logger.error('Failed to initialize Google SSO provider:', error);
    }
  }

  /**
   * Initialize Okta provider
   */
  initializeOktaProvider() {
    try {
      const { clientId, clientSecret, domain } = config.sso.okta;
      
      if (!clientId || !clientSecret || !domain) {
        logger.warn('Okta SSO credentials are missing');
        return;
      }
      
      // For Okta, we'll just store the config and use axios for API calls
      this.providers.okta = {
        config: config.sso.okta
      };
      
      logger.info('Okta SSO provider initialized');
    } catch (error) {
      logger.error('Failed to initialize Okta SSO provider:', error);
    }
  }

  /**
   * Initialize Auth0 provider
   */
  initializeAuth0Provider() {
    try {
      const { clientId, clientSecret, domain } = config.sso.auth0;
      
      if (!clientId || !clientSecret || !domain) {
        logger.warn('Auth0 SSO credentials are missing');
        return;
      }
      
      // For Auth0, we'll just store the config and use axios for API calls
      this.providers.auth0 = {
        config: config.sso.auth0
      };
      
      logger.info('Auth0 SSO provider initialized');
    } catch (error) {
      logger.error('Failed to initialize Auth0 SSO provider:', error);
    }
  }

  /**
   * Initialize SAML provider
   */
  initializeSamlProvider() {
    try {
      const { entryPoint, issuer, cert, privateKey } = config.sso.saml;
      
      if (!entryPoint || !cert) {
        logger.warn('SAML SSO credentials are missing');
        return;
      }
      
      // Commenting out SAML provider initialization to avoid dependency issues
      /*
      // Create SAML service provider
      const sp_options = {
        entity_id: issuer,
        private_key: privateKey,
        certificate: cert,
        assert_endpoint: config.sso.saml.callbackUrl
      };
      
      // Create identity provider
      const idp_options = {
        sso_login_url: entryPoint,
        sso_logout_url: entryPoint.replace('/login', '/logout'),
        certificates: [cert]
      };
      */
      
      // Log that SAML is disabled
      logger.info('SAML SSO provider temporarily disabled');
      
      // Set the provider to an empty object to avoid null reference errors
      this.providers.saml = {};
    } catch (error) {
      logger.error('Failed to initialize SAML SSO provider:', error);
    }
  }

  /**
   * Generate a state parameter for OAuth flows and store it
   * @param {string} provider - The SSO provider (microsoft, google, etc.)
   * @param {Object} data - Additional data to store with the state
   * @returns {string} - The generated state parameter
   */
  generateState(provider, data = {}) {
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with provider info and expiration
    stateStore.set(state, {
      provider,
      data,
      expires: Date.now() + config.sso.stateTimeout
    });
    
    return state;
  }

  /**
   * Verify and consume a state parameter
   * @param {string} state - The state parameter to verify
   * @returns {Object|null} - The stored state data or null if invalid
   */
  verifyState(state) {
    if (!stateStore.has(state)) {
      return null;
    }
    
    const stateData = stateStore.get(state);
    
    // Check if expired
    if (stateData.expires < Date.now()) {
      stateStore.delete(state);
      return null;
    }
    
    // Consume the state (one-time use)
    stateStore.delete(state);
    
    return stateData;
  }

  /**
   * Generate a login URL for Microsoft SSO
   * @param {Object} options - Additional options
   * @returns {string} - The login URL
   */
  getMicrosoftLoginUrl(options = {}) {
    if (!this.providers.microsoft) {
      throw new Error('Microsoft SSO provider is not initialized');
    }
    
    const { scopes, redirectUri } = config.sso.microsoft;
    const state = this.generateState('microsoft', options);
    
    const authUrlParameters = {
      scopes,
      redirectUri,
      state
    };
    
    const url = this.providers.microsoft.getAuthCodeUrl(authUrlParameters);
    return url;
  }

  /**
   * Handle Microsoft auth callback
   * @param {string} code - Authorization code from Microsoft
   * @param {string} state - State parameter
   * @returns {Promise<Object>} - User data and tokens
   */
  async handleMicrosoftCallback(code, state) {
    if (!this.providers.microsoft) {
      throw new Error('Microsoft SSO provider is not initialized');
    }
    
    // Verify state
    const stateData = this.verifyState(state);
    if (!stateData) {
      throw new Error('Invalid or expired state parameter');
    }
    
    // Exchange code for tokens
    const { redirectUri } = config.sso.microsoft;
    const tokenResponse = await this.providers.microsoft.acquireTokenByCode({
      code,
      redirectUri,
      scopes: config.sso.microsoft.scopes
    });
    
    // Get user info from ID token claims
    const idTokenClaims = tokenResponse.idTokenClaims;
    
    const userInfo = {
      id: idTokenClaims.oid || idTokenClaims.sub,
      email: idTokenClaims.preferred_username || idTokenClaims.email,
      displayName: idTokenClaims.name,
      firstName: idTokenClaims.given_name,
      lastName: idTokenClaims.family_name,
      tenantId: idTokenClaims.tid
    };
    
    // Find or create user
    const user = await this.findOrCreateUser({
      provider: 'microsoft',
      providerUserId: userInfo.id,
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      displayName: userInfo.displayName,
      providerData: {
        tenantId: userInfo.tenantId
      }
    });
    
    // Generate JWT token
    const token = this.generateToken(user);
    
    return {
      user,
      token,
      providerTokens: {
        accessToken: tokenResponse.accessToken,
        idToken: tokenResponse.idToken,
        refreshToken: tokenResponse.refreshToken
      }
    };
  }

  /**
   * Generate a login URL for Google SSO
   * @param {Object} options - Additional options
   * @returns {string} - The login URL
   */
  getGoogleLoginUrl(options = {}) {
    if (!this.providers.google) {
      throw new Error('Google SSO provider is not initialized');
    }
    
    const { scopes, prompt, accessType, includeGrantedScopes } = config.sso.google;
    const state = this.generateState('google', options);
    
    const url = this.providers.google.generateAuthUrl({
      access_type: accessType,
      scope: scopes,
      include_granted_scopes: includeGrantedScopes,
      prompt,
      state
    });
    
    return url;
  }

  /**
   * Handle Google auth callback
   * @param {string} code - Authorization code from Google
   * @param {string} state - State parameter
   * @returns {Promise<Object>} - User data and tokens
   */
  async handleGoogleCallback(code, state) {
    if (!this.providers.google) {
      throw new Error('Google SSO provider is not initialized');
    }
    
    // Verify state
    const stateData = this.verifyState(state);
    if (!stateData) {
      throw new Error('Invalid or expired state parameter');
    }
    
    // Exchange code for tokens
    const { tokens } = await this.providers.google.getToken(code);
    this.providers.google.setCredentials(tokens);
    
    // Get user info
    const people = google.people({ version: 'v1', auth: this.providers.google });
    const { data } = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos'
    });
    
    const userInfo = {
      id: data.resourceName.replace('people/', ''),
      email: data.emailAddresses?.[0]?.value,
      displayName: data.names?.[0]?.displayName,
      firstName: data.names?.[0]?.givenName,
      lastName: data.names?.[0]?.familyName,
      picture: data.photos?.[0]?.url
    };
    
    // Find or create user
    const user = await this.findOrCreateUser({
      provider: 'google',
      providerUserId: userInfo.id,
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
      displayName: userInfo.displayName,
      providerData: {
        picture: userInfo.picture
      }
    });
    
    // Generate JWT token
    const token = this.generateToken(user);
    
    return {
      user,
      token,
      providerTokens: tokens
    };
  }

  /**
   * Generate a login URL for Okta SSO
   * @param {Object} options - Additional options
   * @returns {string} - The login URL
   */
  getOktaLoginUrl(options = {}) {
    if (!this.providers.okta) {
      throw new Error('Okta SSO provider is not initialized');
    }
    
    const { clientId, domain, redirectUri, scopes, responseType } = config.sso.okta;
    const state = this.generateState('okta', options);
    
    // Generate PKCE code challenge
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallengeBuffer = crypto.createHash('sha256').update(codeVerifier).digest();
    const codeChallenge = Buffer.from(codeChallengeBuffer).toString('base64url');
    
    // Store code verifier with state
    stateStore.get(state).data.codeVerifier = codeVerifier;
    
    const query = querystring.stringify({
      client_id: clientId,
      response_type: responseType,
      scope: scopes.join(' '),
      redirect_uri: redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    return `https://${domain}/oauth2/v1/authorize?${query}`;
  }

  /**
   * Handle Okta auth callback
   * @param {string} code - Authorization code from Okta
   * @param {string} state - State parameter
   * @returns {Promise<Object>} - User data and tokens
   */
  async handleOktaCallback(code, state) {
    if (!this.providers.okta) {
      throw new Error('Okta SSO provider is not initialized');
    }
    
    // Verify state
    const stateData = this.verifyState(state);
    if (!stateData) {
      throw new Error('Invalid or expired state parameter');
    }
    
    const { clientId, clientSecret, domain, redirectUri } = config.sso.okta;
    const codeVerifier = stateData.data.codeVerifier;
    
    // Exchange code for tokens
    const tokenUrl = `https://${domain}/oauth2/v1/token`;
    const tokenResponse = await axios.post(
      tokenUrl,
      querystring.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
        }
      }
    );
    
    const tokens = tokenResponse.data;
    
    // Get user info
    const userInfoUrl = `https://${domain}/oauth2/v1/userinfo`;
    const userInfoResponse = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    
    const userInfo = userInfoResponse.data;
    
    // Find or create user
    const user = await this.findOrCreateUser({
      provider: 'okta',
      providerUserId: userInfo.sub,
      email: userInfo.email,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      displayName: userInfo.name
    });
    
    // Generate JWT token
    const token = this.generateToken(user);
    
    return {
      user,
      token,
      providerTokens: tokens
    };
  }

  /**
   * Generate a login URL for Auth0 SSO
   * @param {Object} options - Additional options
   * @returns {string} - The login URL
   */
  getAuth0LoginUrl(options = {}) {
    if (!this.providers.auth0) {
      throw new Error('Auth0 SSO provider is not initialized');
    }
    
    const { clientId, domain, redirectUri, scopes, responseType, audience } = config.sso.auth0;
    const state = this.generateState('auth0', options);
    
    const query = querystring.stringify({
      client_id: clientId,
      response_type: responseType,
      scope: scopes.join(' '),
      redirect_uri: redirectUri,
      state,
      audience
    });
    
    return `https://${domain}/authorize?${query}`;
  }

  /**
   * Handle Auth0 auth callback
   * @param {string} code - Authorization code from Auth0
   * @param {string} state - State parameter
   * @returns {Promise<Object>} - User data and tokens
   */
  async handleAuth0Callback(code, state) {
    if (!this.providers.auth0) {
      throw new Error('Auth0 SSO provider is not initialized');
    }
    
    // Verify state
    const stateData = this.verifyState(state);
    if (!stateData) {
      throw new Error('Invalid or expired state parameter');
    }
    
    const { clientId, clientSecret, domain, redirectUri } = config.sso.auth0;
    
    // Exchange code for tokens
    const tokenUrl = `https://${domain}/oauth/token`;
    const tokenResponse = await axios.post(
      tokenUrl,
      {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const tokens = tokenResponse.data;
    
    // Get user info
    const userInfoUrl = `https://${domain}/userinfo`;
    const userInfoResponse = await axios.get(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`
      }
    });
    
    const userInfo = userInfoResponse.data;
    
    // Find or create user
    const user = await this.findOrCreateUser({
      provider: 'auth0',
      providerUserId: userInfo.sub,
      email: userInfo.email,
      firstName: userInfo.given_name,
      lastName: userInfo.family_name,
      displayName: userInfo.name
    });
    
    // Generate JWT token
    const token = this.generateToken(user);
    
    return {
      user,
      token,
      providerTokens: tokens
    };
  }

  /**
   * Generate a SAML login request
   * @param {Object} options - Additional options
   * @returns {Object} - SAML request URL and parameters
   */
  getSamlLoginRequest(options = {}) {
    if (!this.providers.saml) {
      throw new Error('SAML SSO provider is not initialized');
    }
    
    // SAML is disabled, return a dummy URL
    logger.info('SAML login requested but SAML is disabled');
    return '/auth/saml/disabled';
    
    /* Commented out to avoid dependency issues
    const { sp, idp } = this.providers.saml;
    
    // Generate SAML auth request
    const loginRequest = sp.create_login_request_url({
      idp,
      assert_endpoint: config.sso.saml.callbackUrl,
      force_authn: config.sso.saml.forceAuthn,
      relay_state: JSON.stringify({ 
        id: uuidv4(),
        ...options
      })
    });
    
    return loginRequest;
    */
  }

  /**
   * Handle SAML auth callback/assertion
   * @param {string} samlResponse - The SAML response/assertion
   * @param {string} relayState - Relay state parameter
   * @returns {Promise<Object>} - User data and tokens
   */
  async handleSamlCallback(samlResponse, relayState) {
    if (!this.providers.saml) {
      throw new Error('SAML SSO provider is not initialized');
    }
    
    // SAML is disabled, throw an error
    throw new Error('SAML authentication is currently disabled');
    
    /* Commented out to avoid dependency issues
    const { sp, idp } = this.providers.saml;
    let relayStateData = {};
    
    // Parse relay state if valid JSON
    try {
      relayStateData = JSON.parse(relayState);
    } catch (e) {
      // Ignore parsing errors, use empty object
    }
    
    // Process SAML response
    const samlOptions = {
      request_body: {
        SAMLResponse: samlResponse,
        RelayState: relayState
      }
    };
    
    return new Promise((resolve, reject) => {
      sp.post_assert(idp, samlOptions, async (err, samlResponse) => {
        if (err) {
          return reject(err);
        }
        
        try {
          const attributeMapping = config.sso.saml.attributeMapping;
          const nameId = samlResponse.user.name_id;
          
          // Extract user attributes using the mapping
          const getAttributeValue = (samlAttrName) => {
            if (!samlAttrName) return null;
            return samlResponse.user.attributes[samlAttrName];
          };
          
          const userInfo = {
            nameId,
            email: getAttributeValue(attributeMapping.email) || nameId,
            firstName: getAttributeValue(attributeMapping.firstName),
            lastName: getAttributeValue(attributeMapping.lastName),
            role: getAttributeValue(attributeMapping.role)
          };
          
          // Find or create user
          const user = await this.findOrCreateUser({
            provider: 'saml',
            providerUserId: nameId,
            email: userInfo.email,
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            role: userInfo.role,
            providerData: {
              nameId: userInfo.nameId,
              provider: relayStateData.provider || 'generic-saml'
            }
          });
          
          // Generate JWT token
          const token = this.generateToken(user);
          
          resolve({
            user,
            token,
            samlResponse
          });
        } catch (error) {
          reject(error);
        }
      });
    });
    */
  }

  /**
   * Find an existing user by SSO provider ID or create a new user
   * @param {Object} userData - User data from SSO provider
   * @returns {Promise<Object>} - User object
   */
  async findOrCreateUser(userData) {
    const { 
      provider, 
      providerUserId, 
      email, 
      firstName, 
      lastName,
      displayName,
      role,
      providerData = {}
    } = userData;
    
    // Check if user already exists with this provider
    const existingUserByProvider = await User.findOne({
      [`ssoConnections.${provider}.id`]: providerUserId
    });
    
    if (existingUserByProvider) {
      // Update the user's SSO connection data
      existingUserByProvider.ssoConnections[provider] = {
        connected: true,
        id: providerUserId,
        email,
        displayName: displayName || `${firstName} ${lastName}`.trim(),
        ...providerData,
        lastLogin: new Date()
      };
      
      // Update user profile if configured
      if (config.sso.userProvisioning.updateProfileOnLogin) {
        if (firstName) existingUserByProvider.firstName = firstName;
        if (lastName) existingUserByProvider.lastName = lastName;
        if (email) existingUserByProvider.email = email;
      }
      
      await existingUserByProvider.save();
      return existingUserByProvider;
    }
    
    // Check if user exists with the same email
    if (email) {
      const existingUserByEmail = await User.findOne({ email });
      
      if (existingUserByEmail) {
        // Connect the existing user to this SSO provider
        existingUserByEmail.ssoConnections[provider] = {
          connected: true,
          id: providerUserId,
          email,
          displayName: displayName || `${firstName} ${lastName}`.trim(),
          ...providerData,
          lastLogin: new Date()
        };
        
        // Update primary SSO provider if not set
        if (!existingUserByEmail.primarySSOProvider) {
          existingUserByEmail.primarySSOProvider = provider;
        }
        
        await existingUserByEmail.save();
        return existingUserByEmail;
      }
    }
    
    // Auto-create user if enabled
    if (!config.sso.userProvisioning.autoCreateUsers) {
      throw new Error('User does not exist and auto-creation is disabled');
    }
    
    // Check if email domain is in allowed list (if configured)
    if (email && config.sso.allowedDomains.length > 0) {
      const domain = email.split('@')[1];
      if (!config.sso.allowedDomains.includes(domain)) {
        throw new Error(`Email domain ${domain} is not allowed for SSO`);
      }
    }
    
    // Determine role based on email domain mappings or default
    let userRole = config.sso.userProvisioning.defaultRole;
    
    // Use role from SSO if available
    if (role) {
      userRole = role;
    } else if (email) {
      // Check domain-based role mappings
      const { roleMappings } = config.sso.userProvisioning;
      
      for (const [mappedRole, domains] of Object.entries(roleMappings)) {
        // Check for exact email match
        if (domains.includes(email)) {
          userRole = mappedRole;
          break;
        }
        
        // Check for domain match
        const domain = email.split('@')[1];
        if (domains.some(d => d.startsWith('@') && d.substring(1) === domain)) {
          userRole = mappedRole;
          break;
        }
      }
    }
    
    // Create new user
    const newUser = new User({
      email,
      firstName: firstName || '',
      lastName: lastName || '',
      isSSO: true,
      primarySSOProvider: provider,
      role: userRole,
      status: 'active',
      // Set random password (not used for SSO users, but required by schema)
      password: crypto.randomBytes(32).toString('hex')
    });
    
    // Set SSO connection
    newUser.ssoConnections[provider] = {
      connected: true,
      id: providerUserId,
      email,
      displayName: displayName || `${firstName} ${lastName}`.trim(),
      ...providerData,
      lastLogin: new Date()
    };
    
    await newUser.save();
    return newUser;
  }

  /**
   * Generate a JWT token for a user
   * @param {Object} user - User object
   * @returns {string} - JWT token
   */
  generateToken(user) {
    // Get JWT secret from environment or use a default (should be in config)
    const jwtSecret = process.env.JWT_SECRET || 'aerosuite-jwt-secret';
    
    // Create JWT payload
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      isSSO: user.isSSO,
      ssoProvider: user.primarySSOProvider
    };
    
    // Sign and return the token
    return jwt.sign(
      payload,
      jwtSecret,
      { expiresIn: '1d' }
    );
  }

  /**
   * Get all SSO providers status
   * @returns {Object} - Status of all SSO providers
   */
  getProvidersStatus() {
    return {
      microsoft: {
        enabled: config.sso.microsoft?.enabled || false,
        initialized: !!this.providers.microsoft
      },
      google: {
        enabled: config.sso.google?.enabled || false,
        initialized: !!this.providers.google
      },
      okta: {
        enabled: config.sso.okta?.enabled || false,
        initialized: !!this.providers.okta
      },
      auth0: {
        enabled: config.sso.auth0?.enabled || false,
        initialized: !!this.providers.auth0
      },
      saml: {
        enabled: config.sso.saml?.enabled || false,
        initialized: !!this.providers.saml
      }
    };
  }
}

// Create a singleton instance
const ssoService = new SSOService();

module.exports = ssoService; 