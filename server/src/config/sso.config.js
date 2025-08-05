/**
 * Single Sign-On (SSO) Configuration
 * 
 * This file contains configuration settings for various SSO providers.
 */

module.exports = {
  // General SSO settings
  enabled: process.env.SSO_ENABLED === 'true' || false,
  
  // Default redirect URL after successful authentication
  redirectUrl: process.env.SSO_REDIRECT_URL || 'http://localhost:3000/dashboard',
  
  // OAuth2 state parameter timeout in milliseconds
  stateTimeout: 10 * 60 * 1000, // 10 minutes
  
  // Allowed email domains for SSO (empty array means all domains are allowed)
  allowedDomains: process.env.SSO_ALLOWED_DOMAINS 
    ? process.env.SSO_ALLOWED_DOMAINS.split(',').map(domain => domain.trim())
    : [],
  
  // Microsoft Azure AD / Microsoft 365
  microsoft: {
    enabled: process.env.SSO_MICROSOFT_ENABLED === 'true' || false,
    clientId: process.env.SSO_MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.SSO_MICROSOFT_CLIENT_SECRET || '',
    tenantId: process.env.SSO_MICROSOFT_TENANT_ID || 'common', // Use 'common' for multi-tenant
    scopes: ['user.read', 'profile', 'email', 'offline_access', 'openid'],
    redirectUri: process.env.SSO_MICROSOFT_REDIRECT_URI || 'http://localhost:5000/api/auth/microsoft/callback',
    authority: process.env.SSO_MICROSOFT_AUTHORITY || 'https://login.microsoftonline.com/common',
    prompt: 'select_account', // Use 'none' to skip the authentication UI if session exists
  },
  
  // Google OAuth2
  google: {
    enabled: process.env.SSO_GOOGLE_ENABLED === 'true' || false,
    clientId: process.env.SSO_GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.SSO_GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.SSO_GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid'
    ],
    prompt: 'select_account', // Use 'none' to skip the authentication UI if session exists
    accessType: 'offline', // To get refresh token
    includeGrantedScopes: true
  },
  
  // Okta
  okta: {
    enabled: process.env.SSO_OKTA_ENABLED === 'true' || false,
    clientId: process.env.SSO_OKTA_CLIENT_ID || '',
    clientSecret: process.env.SSO_OKTA_CLIENT_SECRET || '',
    domain: process.env.SSO_OKTA_DOMAIN || '', // e.g., 'dev-123456.okta.com'
    redirectUri: process.env.SSO_OKTA_REDIRECT_URI || 'http://localhost:5000/api/auth/okta/callback',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    state: true,
    pkce: true
  },
  
  // Auth0
  auth0: {
    enabled: process.env.SSO_AUTH0_ENABLED === 'true' || false,
    clientId: process.env.SSO_AUTH0_CLIENT_ID || '',
    clientSecret: process.env.SSO_AUTH0_CLIENT_SECRET || '',
    domain: process.env.SSO_AUTH0_DOMAIN || '', // e.g., 'your-tenant.auth0.com'
    redirectUri: process.env.SSO_AUTH0_REDIRECT_URI || 'http://localhost:5000/api/auth/auth0/callback',
    scopes: ['openid', 'profile', 'email'],
    responseType: 'code',
    audience: process.env.SSO_AUTH0_AUDIENCE || ''
  },
  
  // SAML Configuration (for enterprise SSO)
  saml: {
    enabled: process.env.SSO_SAML_ENABLED === 'true' || false,
    entryPoint: process.env.SSO_SAML_ENTRY_POINT || '', // IdP login URL
    issuer: process.env.SSO_SAML_ISSUER || 'aerosuite-saml', // SP entity ID
    callbackUrl: process.env.SSO_SAML_CALLBACK_URL || 'http://localhost:5000/api/auth/saml/callback',
    cert: process.env.SSO_SAML_CERT || '', // IdP public certificate
    privateKey: process.env.SSO_SAML_PRIVATE_KEY || '', // SP private key
    decryptionPvk: process.env.SSO_SAML_DECRYPTION_PVK || '', // Private key for assertion decryption
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',
    validateInResponseTo: true,
    disableRequestedAuthnContext: false,
    authnContext: 'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
    forceAuthn: false, // Whether to force re-authentication
    providerName: process.env.SSO_SAML_PROVIDER_NAME || 'AeroSuite', // SP name
    identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    // Maps SAML attributes to user properties
    attributeMapping: {
      email: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress',
      firstName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname',
      lastName: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname',
      role: 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
    }
  },
  
  // SSO User Creation and Mapping
  userProvisioning: {
    // If true, automatically create users on first SSO login
    autoCreateUsers: process.env.SSO_AUTO_CREATE_USERS === 'true' || true,
    
    // Default role for new SSO users
    defaultRole: process.env.SSO_DEFAULT_ROLE || 'viewer',
    
    // If true, update user profile from SSO attributes on every login
    updateProfileOnLogin: process.env.SSO_UPDATE_PROFILE_ON_LOGIN === 'true' || true,
    
    // Domains that get special roles (e.g., admin@yourcompany.com gets admin role)
    roleMappings: {
      admin: process.env.SSO_ADMIN_DOMAINS 
        ? process.env.SSO_ADMIN_DOMAINS.split(',').map(domain => domain.trim())
        : ['admin@aerosuite.com'],
      manager: process.env.SSO_MANAGER_DOMAINS 
        ? process.env.SSO_MANAGER_DOMAINS.split(',').map(domain => domain.trim())
        : ['manager@aerosuite.com']
    }
  }
}; 