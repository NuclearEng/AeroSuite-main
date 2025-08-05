/**
 * Authentication Core Framework - Configuration
 * Task: TS028 - Authentication Core Framework
 * 
 * This module provides configuration for the authentication system,
 * including token settings, password policies, and authentication strategies.
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Default configuration values
const defaults = {
  // JWT settings
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-should-be-changed-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    issuer: process.env.JWT_ISSUER || 'aerosuite-api',
    audience: process.env.JWT_AUDIENCE || 'aerosuite-client',
    algorithm: 'HS256',
    clockTolerance: 30, // seconds
    refreshTokenLength: 64
  },
  
  // Password policy
  passwordPolicy: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    requireSpecialChars: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
    specialChars: process.env.PASSWORD_SPECIAL_CHARS || '!@#$%^&*()_+{}[]|:;<>,.?~-',
    preventReuse: parseInt(process.env.PASSWORD_PREVENT_REUSE || '5', 10), // Last 5 passwords
    expiryDays: parseInt(process.env.PASSWORD_EXPIRY_DAYS || '90', 10), // 90 days
    lockoutThreshold: parseInt(process.env.PASSWORD_LOCKOUT_THRESHOLD || '5', 10), // 5 attempts
    lockoutDuration: parseInt(process.env.PASSWORD_LOCKOUT_DURATION || '15', 10) // 15 minutes
  },
  
  // Session settings
  session: {
    name: process.env.SESSION_NAME || 'aerosuite.sid',
    secret: process.env.SESSION_SECRET || 'default-session-secret-should-be-changed-in-production',
    cookieMaxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || (24 * 60 * 60 * 1000).toString(), 10), // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset expiration on activity
    unset: 'destroy'
  },
  
  // Authentication strategies
  strategies: {
    local: {
      enabled: process.env.AUTH_STRATEGY_LOCAL !== 'false',
      usernameField: 'email',
      passwordField: 'password'
    },
    oauth: {
      google: {
        enabled: process.env.AUTH_STRATEGY_GOOGLE === 'true',
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
        scope: ['profile', 'email']
      },
      microsoft: {
        enabled: process.env.AUTH_STRATEGY_MICROSOFT === 'true',
        clientId: process.env.MICROSOFT_CLIENT_ID || '',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
        callbackURL: process.env.MICROSOFT_CALLBACK_URL || '/api/auth/microsoft/callback',
        scope: ['user.read']
      }
    },
    saml: {
      enabled: process.env.AUTH_STRATEGY_SAML === 'true',
      entryPoint: process.env.SAML_ENTRY_POINT || '',
      issuer: process.env.SAML_ISSUER || 'aerosuite',
      callbackUrl: process.env.SAML_CALLBACK_URL || '/api/auth/saml/callback',
      cert: process.env.SAML_CERT || '',
      privateKey: process.env.SAML_PRIVATE_KEY || '',
      signatureAlgorithm: process.env.SAML_SIGNATURE_ALGORITHM || 'sha256'
    }
  },
  
  // Multi-factor Authentication (MFA)
  mfa: {
    enabled: process.env.MFA_ENABLED === 'true',
    methods: {
      totp: {
        enabled: process.env.MFA_TOTP_ENABLED === 'true',
        issuer: process.env.MFA_TOTP_ISSUER || 'AeroSuite',
        algorithm: process.env.MFA_TOTP_ALGORITHM || 'sha1',
        digits: parseInt(process.env.MFA_TOTP_DIGITS || '6', 10),
        period: parseInt(process.env.MFA_TOTP_PERIOD || '30', 10),
        window: parseInt(process.env.MFA_TOTP_WINDOW || '1', 10)
      },
      sms: {
        enabled: process.env.MFA_SMS_ENABLED === 'true',
        provider: process.env.MFA_SMS_PROVIDER || 'twilio',
        codeLength: parseInt(process.env.MFA_SMS_CODE_LENGTH || '6', 10),
        expiryMinutes: parseInt(process.env.MFA_SMS_EXPIRY_MINUTES || '10', 10)
      },
      email: {
        enabled: process.env.MFA_EMAIL_ENABLED === 'true',
        codeLength: parseInt(process.env.MFA_EMAIL_CODE_LENGTH || '6', 10),
        expiryMinutes: parseInt(process.env.MFA_EMAIL_EXPIRY_MINUTES || '10', 10)
      },
      recovery: {
        enabled: true,
        codeCount: parseInt(process.env.MFA_RECOVERY_CODE_COUNT || '10', 10),
        codeLength: parseInt(process.env.MFA_RECOVERY_CODE_LENGTH || '12', 10)
      }
    },
    enforcedRoles: (process.env.MFA_ENFORCED_ROLES || 'admin,security').split(',')
  },
  
  // Access control
  accessControl: {
    roleHierarchy: {
      superadmin: ['admin', 'manager', 'user'],
      admin: ['manager', 'user'],
      manager: ['user'],
      user: []
    },
    defaultRole: process.env.DEFAULT_ROLE || 'user',
    systemRoles: ['superadmin', 'admin', 'manager', 'user', 'guest']
  },
  
  // API key authentication
  apiKey: {
    enabled: process.env.API_KEY_AUTH_ENABLED === 'true',
    headerName: process.env.API_KEY_HEADER || 'X-API-Key',
    keyLength: parseInt(process.env.API_KEY_LENGTH || '32', 10),
    expiryDays: parseInt(process.env.API_KEY_EXPIRY_DAYS || '365', 10)
  },
  
  // Security features
  security: {
    rateLimiting: {
      enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || (15 * 60 * 1000).toString(), 10), // 15 minutes
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // 100 requests per window
      message: 'Too many requests, please try again later'
    },
    bruteForceProtection: {
      enabled: process.env.BRUTE_FORCE_PROTECTION !== 'false',
      maxAttempts: parseInt(process.env.BRUTE_FORCE_MAX_ATTEMPTS || '5', 10),
      blockDuration: parseInt(process.env.BRUTE_FORCE_BLOCK_DURATION || '15', 10) // minutes
    },
    jwtBlacklist: {
      enabled: process.env.JWT_BLACKLIST_ENABLED !== 'false',
      useRedis: process.env.JWT_BLACKLIST_USE_REDIS === 'true'
    }
  }
};

// Environment-specific overrides
const env = process.env.NODE_ENV || 'development';
const envConfigs = {
  development: {
    security: {
      rateLimiting: {
        maxRequests: 1000 // Higher limit for development
      }
    }
  },
  test: {
    passwordPolicy: {
      expiryDays: 365 // Longer expiry for testing
    },
    security: {
      rateLimiting: {
        enabled: false // Disable rate limiting for tests
      }
    }
  },
  production: {
    jwt: {
      clockTolerance: 10 // Stricter clock tolerance in production
    },
    session: {
      secure: true // Force secure cookies in production
    }
  }
};

// Merge configurations
const config = {
  ...defaults,
  ...(envConfigs[env] || {})
};

// Validate critical configuration
if (env === 'production') {
  // Check for default secrets in production
  if (config.jwt.secret === defaults.jwt.secret) {
    console.error('WARNING: Using default JWT secret in production! Set JWT_SECRET environment variable.');
    if (process.env.STRICT_CONFIG_VALIDATION === 'true') {
      throw new Error('Default JWT secret used in production');
    }
  }
  
  if (config.session.secret === defaults.session.secret) {
    console.error('WARNING: Using default session secret in production! Set SESSION_SECRET environment variable.');
    if (process.env.STRICT_CONFIG_VALIDATION === 'true') {
      throw new Error('Default session secret used in production');
    }
  }
  
  // Ensure OAuth credentials are set if enabled
  if (config.strategies.oauth.google.enabled && !config.strategies.oauth.google.clientId) {
    console.error('WARNING: Google OAuth enabled but missing client ID');
    if (process.env.STRICT_CONFIG_VALIDATION === 'true') {
      throw new Error('Google OAuth configuration incomplete');
    }
  }
  
  if (config.strategies.oauth.microsoft.enabled && !config.strategies.oauth.microsoft.clientId) {
    console.error('WARNING: Microsoft OAuth enabled but missing client ID');
    if (process.env.STRICT_CONFIG_VALIDATION === 'true') {
      throw new Error('Microsoft OAuth configuration incomplete');
    }
  }
  
  if (config.strategies.saml.enabled && !config.strategies.saml.entryPoint) {
    console.error('WARNING: SAML authentication enabled but missing entry point');
    if (process.env.STRICT_CONFIG_VALIDATION === 'true') {
      throw new Error('SAML configuration incomplete');
    }
  }
}

module.exports = config; 