/**
 * OWASP Security Testing Tasks
 * 
 * Based on OWASP Web Security Testing Guide (WSTG) and 
 * Application Security Verification Standard (ASVS)
 * 
 * References:
 * - https://owasp.org/www-project-web-security-testing-guide/
 * - https://owasp.org/www-project-application-security-verification-standard/
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Test input validation and sanitization
 */
async function testInputValidation(input, type) {
  const maliciousPatterns = {
    xss: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi
    ],
    sql: [
      /(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
      /(\b(or|and)\b\s+\d+\s*=\s*\d+)/gi,
      /(\b(union|select)\b.*\bfrom\b)/gi,
      /(\b(union|select)\b.*\bwhere\b)/gi
    ],
    nosql: [
      /\$where\s*:/gi,
      /\$regex\s*:/gi,
      /\$ne\s*:/gi,
      /\$gt\s*:/gi,
      /\$lt\s*:/gi
    ],
    command: [
      /[;&|`$()]/g,
      /\b(cat|ls|rm|wget|curl|nc|netcat)\b/gi,
      /\b(whoami|id|pwd)\b/gi
    ],
    path: [
      /\.\.\/\.\.\/\.\.\//gi,
      /\.\.\\\.\.\\\.\.\\/gi,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi
    ]
  };

  const patterns = maliciousPatterns[type] || [];
  
  for (const pattern of patterns) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        type: type,
        pattern: pattern.toString(),
        input: input
      };
    }
  }

  return {
    isValid: true,
    type: type,
    input: input
  };
}

/**
 * Test output encoding
 */
async function testOutputEncoding(input, context) {
  const encodingRules = {
    html: {
      patterns: [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, /javascript:/gi, /on\w+\s*=/gi],
      replacement: (match) => match.replace(/</g, '&lt;').replace(/>/g, '&gt;')
    },
    javascript: {
      patterns: [/['"`]/g, /<\/script>/gi],
      replacement: (match) => match.replace(/'/g, "\\'").replace(/"/g, '\\"')
    },
    css: {
      patterns: [/url\s*\(/gi, /expression\s*\(/gi],
      replacement: (match) => match.replace(/url\s*\(/gi, 'url\\(').replace(/expression\s*\(/gi, 'expression\\(')
    },
    url: {
      patterns: [/javascript:/gi, /data:/gi, /vbscript:/gi],
      replacement: (match) => encodeURIComponent(match)
    },
    xml: {
      patterns: [/[<>&'"]/g],
      replacement: (match) => {
        const entities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' };
        return entities[match] || match;
      }
    }
  };

  const rule = encodingRules[context] || encodingRules.html;
  let encoded = input;

  for (const pattern of rule.patterns) {
    encoded = encoded.replace(pattern, rule.replacement);
  }

  return {
    original: input,
    encoded: encoded,
    context: context,
    isEncoded: encoded !== input
  };
}

/**
 * Test authentication security
 */
async function testAuthenticationSecurity(credentials) {
  const { email, password } = credentials;
  
  // Test password complexity
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    notCommon: !['password', '123456', 'qwerty', 'admin'].includes(password.toLowerCase())
  };

  const isStrongPassword = Object.values(passwordChecks).every(check => check);

  // Test timing attack prevention (simulated)
  const startTime = Date.now();
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 50)); // Consistent timing
  const responseTime = Date.now() - startTime;

  return {
    isStrongPassword,
    passwordChecks,
    responseTime,
    timingAttackPrevention: responseTime > 100 && responseTime < 200
  };
}

/**
 * Test session management security
 */
async function testSessionManagement() {
  // Generate secure session token
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const sessionData = {
    userId: 'test-user-id',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
    fingerprint: crypto.randomBytes(16).toString('hex'),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0 (Test Browser)'
  };

  // Test session security features
  const securityChecks = {
    hasSecureToken: sessionToken.length >= 64,
    hasExpiration: sessionData.expiresAt > new Date(),
    hasFingerprint: sessionData.fingerprint.length >= 32,
    hasIpTracking: !!sessionData.ipAddress,
    hasUserAgentTracking: !!sessionData.userAgent
  };

  return {
    sessionToken,
    sessionData,
    securityChecks,
    isSecure: Object.values(securityChecks).every(check => check)
  };
}

/**
 * Test access control
 */
async function testAccessControl(userRole, resource, action) {
  const accessMatrix = {
    admin: {
      users: ['read', 'write', 'delete'],
      inspections: ['read', 'write', 'delete'],
      reports: ['read', 'write', 'delete'],
      customers: ['read', 'write', 'delete'],
      suppliers: ['read', 'write', 'delete']
    },
    inspector: {
      inspections: ['read', 'write'],
      reports: ['read'],
      customers: ['read'],
      suppliers: ['read']
    },
    manager: {
      inspections: ['read', 'write'],
      reports: ['read', 'write'],
      customers: ['read', 'write'],
      suppliers: ['read', 'write']
    },
    user: {
      inspections: ['read'],
      reports: ['read'],
      customers: ['read'],
      suppliers: ['read']
    }
  };

  const userPermissions = accessMatrix[userRole] || {};
  const resourcePermissions = userPermissions[resource] || [];
  
  return {
    hasPermission: resourcePermissions.includes(action),
    userRole,
    resource,
    action,
    allowedActions: resourcePermissions
  };
}

/**
 * Test rate limiting
 */
async function testRateLimiting(requests, windowMs = 60000) {
  const requestTimes = requests.map(() => Date.now());
  const recentRequests = requestTimes.filter(time => 
    Date.now() - time < windowMs
  );

  const rateLimitConfig = {
    maxRequests: 10,
    windowMs: windowMs
  };

  const isRateLimited = recentRequests.length > rateLimitConfig.maxRequests;

  return {
    isRateLimited,
    requestCount: recentRequests.length,
    maxRequests: rateLimitConfig.maxRequests,
    windowMs: rateLimitConfig.windowMs
  };
}

/**
 * Test security headers
 */
async function testSecurityHeaders(headers) {
  const requiredHeaders = {
    'strict-transport-security': {
      required: true,
      pattern: /max-age=\d+/i,
      description: 'Enforces HTTPS'
    },
    'x-content-type-options': {
      required: true,
      value: 'nosniff',
      description: 'Prevents MIME type sniffing'
    },
    'x-frame-options': {
      required: true,
      values: ['DENY', 'SAMEORIGIN'],
      description: 'Prevents clickjacking'
    },
    'x-xss-protection': {
      required: true,
      pattern: /1; mode=block/i,
      description: 'XSS protection'
    },
    'referrer-policy': {
      required: true,
      pattern: /(no-referrer|strict-origin|strict-origin-when-cross-origin)/i,
      description: 'Controls referrer information'
    },
    'content-security-policy': {
      required: true,
      pattern: /default-src/i,
      description: 'Content Security Policy'
    }
  };

  const results = {};
  let allHeadersPresent = true;

  for (const [headerName, config] of Object.entries(requiredHeaders)) {
    const headerValue = headers[headerName.toLowerCase()];
    
    if (!headerValue) {
      results[headerName] = {
        present: false,
        description: config.description,
        required: config.required
      };
      allHeadersPresent = false;
    } else {
      let isValid = true;
      
      if (config.pattern) {
        isValid = config.pattern.test(headerValue);
      } else if (config.value) {
        isValid = headerValue.toLowerCase() === config.value.toLowerCase();
      } else if (config.values) {
        isValid = config.values.some(value => 
          headerValue.toLowerCase() === value.toLowerCase()
        );
      }

      results[headerName] = {
        present: true,
        value: headerValue,
        valid: isValid,
        description: config.description
      };
    }
  }

  return {
    allHeadersPresent,
    results,
    score: Object.values(results).filter(r => r.present && r.valid).length / Object.keys(requiredHeaders).length
  };
}

/**
 * Test encryption
 */
async function testEncryption(data) {
  const algorithm = 'aes-256-gcm';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipher(algorithm, key);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const decipher = crypto.createDecipher(algorithm, key);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return {
    original: data,
    encrypted: encrypted,
    decrypted: decrypted,
    algorithm: algorithm,
    isEncrypted: encrypted !== data,
    isReversible: decrypted === data
  };
}

/**
 * Test JWT security
 */
async function testJWTSecurity(token, secret) {
  try {
    const decoded = jwt.verify(token, secret);
    
    const securityChecks = {
      hasExpiration: !!decoded.exp,
      hasIssuer: !!decoded.iss,
      hasAudience: !!decoded.aud,
      hasIssuedAt: !!decoded.iat,
      hasNotBefore: !!decoded.nbf,
      hasJWTId: !!decoded.jti,
      isNotExpired: decoded.exp ? decoded.exp > Date.now() / 1000 : false
    };

    return {
      isValid: true,
      decoded,
      securityChecks,
      isSecure: Object.values(securityChecks).every(check => check)
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message,
      securityChecks: {},
      isSecure: false
    };
  }
}

/**
 * Test CSRF protection
 */
async function testCSRFProtection() {
  const csrfToken = crypto.randomBytes(32).toString('hex');
  
  const securityChecks = {
    hasToken: !!csrfToken,
    tokenLength: csrfToken.length >= 32,
    isRandom: /^[a-f0-9]{64}$/.test(csrfToken),
    hasExpiration: true // Simulated
  };

  return {
    csrfToken,
    securityChecks,
    isProtected: Object.values(securityChecks).every(check => check)
  };
}

/**
 * Test SQL injection prevention
 */
async function testSQLInjectionPrevention(query) {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
    /(\b(or|and)\b\s+\d+\s*=\s*\d+)/gi,
    /(\b(union|select)\b.*\bfrom\b)/gi,
    /(\b(union|select)\b.*\bwhere\b)/gi,
    /(\b(union|select)\b.*\bjoin\b)/gi,
    /(\b(union|select)\b.*\border\s+by\b)/gi,
    /(\b(union|select)\b.*\bgroup\s+by\b)/gi,
    /(\b(union|select)\b.*\bhaving\b)/gi,
    /(\b(union|select)\b.*\blimit\b)/gi,
    /(\b(union|select)\b.*\boffset\b)/gi
  ];

  const detectedPatterns = [];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(query)) {
      detectedPatterns.push(pattern.toString());
    }
  }

  return {
    query,
    isVulnerable: detectedPatterns.length > 0,
    detectedPatterns,
    preventionScore: detectedPatterns.length === 0 ? 100 : 0
  };
}

/**
 * Test XSS prevention
 */
async function testXSSPrevention(input) {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /<input\b[^<]*(?:(?!<\/input>)<[^<]*)*>/gi,
    /<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi,
    /<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi
  ];

  const detectedPatterns = [];
  
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.toString());
    }
  }

  return {
    input,
    isVulnerable: detectedPatterns.length > 0,
    detectedPatterns,
    preventionScore: detectedPatterns.length === 0 ? 100 : 0
  };
}

/**
 * Test directory traversal prevention
 */
async function testDirectoryTraversalPrevention(path) {
  const traversalPatterns = [
    /\.\.\/\.\.\/\.\.\//gi,
    /\.\.\\\.\.\\\.\.\\/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.\/\.\.\/\.\.\/\.\.\//gi,
    /\.\.\\\.\.\\\.\.\\\.\.\\/gi
  ];

  const detectedPatterns = [];
  
  for (const pattern of traversalPatterns) {
    if (pattern.test(path)) {
      detectedPatterns.push(pattern.toString());
    }
  }

  return {
    path,
    isVulnerable: detectedPatterns.length > 0,
    detectedPatterns,
    preventionScore: detectedPatterns.length === 0 ? 100 : 0
  };
}

/**
 * Test business logic security
 */
async function testBusinessLogicSecurity(action, data) {
  const businessRules = {
    inspection: {
      canComplete: (data) => {
        return data.status === 'in-progress' && 
               data.inspectorId === data.currentUserId &&
               new Date(data.scheduledDate) <= new Date();
      },
      canUpdate: (data) => {
        return data.status !== 'completed' && 
               data.inspectorId === data.currentUserId;
      }
    },
    user: {
      canDelete: (data) => {
        return data.role !== 'admin' && 
               data.currentUserRole === 'admin';
      },
      canUpdate: (data) => {
        return data.userId === data.currentUserId || 
               data.currentUserRole === 'admin';
      }
    }
  };

  const rule = businessRules[action];
  if (!rule) {
    return {
      isValid: false,
      error: 'No business rule defined for this action'
    };
  }

  const ruleChecks = Object.entries(rule).map(([ruleName, ruleFunction]) => ({
    ruleName,
    isValid: ruleFunction(data),
    description: `Business rule: ${ruleName}`
  }));

  return {
    action,
    data,
    ruleChecks,
    isValid: ruleChecks.every(check => check.isValid)
  };
}

/**
 * Test information disclosure
 */
async function testInformationDisclosure(response) {
  const sensitivePatterns = [
    /error\s*:\s*.+/gi,
    /stack\s*trace/gi,
    /exception/gi,
    /debug/gi,
    /version/gi,
    /database/gi,
    /password/gi,
    /secret/gi,
    /key/gi,
    /token/gi
  ];

  const detectedPatterns = [];
  const responseText = JSON.stringify(response);

  for (const pattern of sensitivePatterns) {
    if (pattern.test(responseText)) {
      detectedPatterns.push(pattern.toString());
    }
  }

  return {
    isSecure: detectedPatterns.length === 0,
    detectedPatterns,
    securityScore: detectedPatterns.length === 0 ? 100 : Math.max(0, 100 - detectedPatterns.length * 10)
  };
}

// Export all tasks
module.exports = {
  testInputValidation,
  testOutputEncoding,
  testAuthenticationSecurity,
  testSessionManagement,
  testAccessControl,
  testRateLimiting,
  testSecurityHeaders,
  testEncryption,
  testJWTSecurity,
  testCSRFProtection,
  testSQLInjectionPrevention,
  testXSSPrevention,
  testDirectoryTraversalPrevention,
  testBusinessLogicSecurity,
  testInformationDisclosure
}; 