// Task: SEC023 - Encryption in Transit Implementation
const crypto = require('crypto');
const tls = require('tls');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

/**
 * TLS/SSL Configuration
 */
const tlsConfig = {
  // Minimum TLS version
  minVersion: 'TLSv1.2',
  
  // Cipher suites (ordered by preference)
  ciphers: [
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES256-SHA256',
    'DHE-RSA-AES128-GCM-SHA256',
    'DHE-RSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-SHA256',
    'DHE-RSA-AES256-SHA256',
    'HIGH',
    '!aNULL',
    '!eNULL',
    '!EXPORT',
    '!DES',
    '!RC4',
    '!MD5',
    '!PSK',
    '!SRP',
    '!CAMELLIA'
  ].join(':'),
  
  // Reject unauthorized connections
  rejectUnauthorized: process.env.NODE_ENV === 'production',
  
  // Request client certificates
  requestCert: process.env.REQUIRE_CLIENT_CERT === 'true',
  
  // Session timeout
  sessionTimeout: 300, // 5 minutes
  
  // Handshake timeout
  handshakeTimeout: 120000 // 2 minutes
};

/**
 * HTTPS enforcement middleware
 */
const enforceHTTPS = (options = {}) => {
  const {
    redirect = true,
    statusCode = 301,
    excludePaths = ['/health', '/api/webhooks'],
    trustProxy = process.env.TRUST_PROXY === 'true'
  } = options;

  return (req, res, next) => {
    // Skip in development
    if (process.env.NODE_ENV === 'development') {
      return next();
    }

    // Check if path is excluded
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Determine if request is secure
    const isSecure = req.secure || 
                    (trustProxy && req.headers['x-forwarded-proto'] === 'https');

    if (!isSecure) {
      if (redirect) {
        const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
        return res.redirect(statusCode, httpsUrl);
      } else {
        return next(new AppError('HTTPS required', 403));
      }
    }

    // Add Strict-Transport-Security header
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    next();
  };
};

/**
 * Payload encryption middleware
 */
const encryptPayload = (options = {}) => {
  const {
    algorithm = 'aes-256-gcm',
    encryptRequests = true,
    encryptResponses = true,
    excludePaths = [],
    publicKeyPath = process.env.PUBLIC_KEY_PATH,
    privateKeyPath = process.env.PRIVATE_KEY_PATH
  } = options;

  let publicKey, privateKey;

  // Load keys on initialization
  (async () => {
    try {
      if (publicKeyPath) {
        publicKey = await fs.readFile(publicKeyPath, 'utf8');
      }
      if (privateKeyPath) {
        privateKey = await fs.readFile(privateKeyPath, 'utf8');
      }
    } catch (error) {
      logger.error('Failed to load encryption keys:', error);
    }
  })();

  return async (req, res, next) => {
    // Skip if path is excluded
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Decrypt request if encrypted
    if (encryptRequests && req.headers['x-encrypted'] === 'true') {
      try {
        req.body = await decryptData(req.body, privateKey, algorithm);
      } catch (error) {
        logger.error('Request decryption failed:', error);
        return next(new AppError('Invalid encrypted request', 400));
      }
    }

    // Set up response encryption
    if (encryptResponses && req.headers['accept-encryption'] === 'true') {
      const originalSend = res.send;
      
      res.send = function(data) {
        if (typeof data === 'object') {
          try {
            const encrypted = encryptData(data, publicKey, algorithm);
            res.setHeader('X-Encrypted', 'true');
            res.setHeader('X-Encryption-Algorithm', algorithm);
            return originalSend.call(this, encrypted);
          } catch (error) {
            logger.error('Response encryption failed:', error);
          }
        }
        return originalSend.call(this, data);
      };
    }

    next();
  };
};

/**
 * API key encryption
 */
const encryptApiKey = (apiKey) => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(
    process.env.API_KEY_SECRET || 'default-secret',
    'salt',
    32
  );
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    algorithm
  };
};

/**
 * API key decryption
 */
const decryptApiKey = (encryptedData) => {
  const { encrypted, iv, algorithm } = encryptedData;
  const key = crypto.scryptSync(
    process.env.API_KEY_SECRET || 'default-secret',
    'salt',
    32
  );
  
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(iv, 'hex')
  );
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Certificate pinning middleware
 */
const certificatePinning = (options = {}) => {
  const {
    pins = [],
    includeSubdomains = true,
    maxAge = 5184000, // 60 days
    reportUri = process.env.HPKP_REPORT_URI
  } = options;

  return (req, res, next) => {
    if (process.env.NODE_ENV !== 'production' || pins.length === 0) {
      return next();
    }

    // Build HPKP header
    let header = pins.map(pin => `pin-sha256="${pin}"`).join('; ');
    header += `; max-age=${maxAge}`;
    
    if (includeSubdomains) {
      header += '; includeSubDomains';
    }
    
    if (reportUri) {
      header += `; report-uri="${reportUri}"`;
    }

    res.setHeader('Public-Key-Pins', header);
    next();
  };
};

/**
 * Mutual TLS (mTLS) authentication
 */
const mutualTLS = (options = {}) => {
  const {
    ca = [],
    requestCert = true,
    rejectUnauthorized = true,
    checkClientCertificate = true
  } = options;

  return (req, res, next) => {
    if (!checkClientCertificate) {
      return next();
    }

    const cert = req.connection.getPeerCertificate();

    if (!cert || Object.keys(cert).length === 0) {
      return next(new AppError('Client certificate required', 401));
    }

    // Verify certificate is valid
    if (cert.valid_from && cert.valid_to) {
      const now = new Date();
      const validFrom = new Date(cert.valid_from);
      const validTo = new Date(cert.valid_to);
      
      if (now < validFrom || now > validTo) {
        return next(new AppError('Client certificate expired or not yet valid', 401));
      }
    }

    // Additional certificate validation
    if (ca.length > 0) {
      // Implement CA validation logic
      const isValid = validateCertificateChain(cert, ca);
      if (!isValid) {
        return next(new AppError('Client certificate not trusted', 401));
      }
    }

    // Attach certificate info to request
    req.clientCertificate = {
      subject: cert.subject,
      issuer: cert.issuer,
      serialNumber: cert.serialNumber,
      fingerprint: cert.fingerprint,
      validFrom: cert.valid_from,
      validTo: cert.valid_to
    };

    logger.info('mTLS authentication successful', {
      subject: cert.subject,
      fingerprint: cert.fingerprint
    });

    next();
  };
};

/**
 * WebSocket encryption
 */
class SecureWebSocket {
  constructor(ws, options = {}) {
    this.ws = ws;
    this.algorithm = options.algorithm || 'aes-256-gcm';
    this.key = options.key || crypto.randomBytes(32);
    this.authenticated = false;
  }

  async authenticate(token) {
    // Implement token verification
    try {
      const payload = await verifyToken(token);
      this.userId = payload.userId;
      this.authenticated = true;
      return true;
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      return false;
    }
  }

  send(data) {
    if (!this.authenticated) {
      throw new Error('WebSocket not authenticated');
    }

    const encrypted = this.encrypt(data);
    this.ws.send(JSON.stringify({
      type: 'encrypted',
      data: encrypted,
      algorithm: this.algorithm
    }));
  }

  encrypt(data) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    const text = JSON.stringify(data);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('base64'),
      tag: tag.toString('base64')
    };
  }

  decrypt(encryptedData) {
    const { encrypted, iv, tag } = encryptedData;
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }
}

/**
 * Generate HTTPS options
 */
async function generateHTTPSOptions(options = {}) {
  const {
    keyPath = process.env.SSL_KEY_PATH,
    certPath = process.env.SSL_CERT_PATH,
    caPath = process.env.SSL_CA_PATH,
    dhparamPath = process.env.SSL_DHPARAM_PATH
  } = options;

  const httpsOptions = {
    ...tlsConfig,
    secureProtocol: 'TLS_method',
    secureOptions: 
      crypto.constants.SSL_OP_NO_SSLv2 |
      crypto.constants.SSL_OP_NO_SSLv3 |
      crypto.constants.SSL_OP_NO_TLSv1 |
      crypto.constants.SSL_OP_NO_TLSv1_1 |
      crypto.constants.SSL_OP_SINGLE_ECDH_USE |
      crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE
  };

  try {
    // Load certificates
    if (keyPath && certPath) {
      httpsOptions.key = await fs.readFile(keyPath);
      httpsOptions.cert = await fs.readFile(certPath);
    }

    // Load CA certificates
    if (caPath) {
      httpsOptions.ca = await fs.readFile(caPath);
    }

    // Load DH parameters
    if (dhparamPath) {
      httpsOptions.dhparam = await fs.readFile(dhparamPath);
    }

    // OCSP Stapling
    httpsOptions.server = https.createServer(httpsOptions);
    httpsOptions.server.on('OCSPRequest', (cert, issuer, cb) => {
      // Implement OCSP stapling
      logger.debug('OCSP request received');
      cb(null, null); // Placeholder
    });

    return httpsOptions;
  } catch (error) {
    logger.error('Failed to load SSL certificates:', error);
    throw error;
  }
}

// Helper functions

function encryptData(data, publicKey, algorithm) {
  const text = JSON.stringify(data);
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  
  // Encrypt data with symmetric key
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  // Get auth tag for GCM mode
  let tag;
  if (algorithm.includes('gcm')) {
    tag = cipher.getAuthTag();
  }
  
  // Encrypt symmetric key with public key
  const encryptedKey = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    key
  );
  
  return {
    data: encrypted,
    key: encryptedKey.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag ? tag.toString('base64') : undefined,
    algorithm
  };
}

async function decryptData(encryptedData, privateKey, algorithm) {
  const { data, key, iv, tag } = encryptedData;
  
  // Decrypt symmetric key
  const decryptedKey = crypto.privateDecrypt(
    {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256'
    },
    Buffer.from(key, 'base64')
  );
  
  // Decrypt data
  const decipher = crypto.createDecipheriv(
    algorithm,
    decryptedKey,
    Buffer.from(iv, 'base64')
  );
  
  // Set auth tag for GCM mode
  if (algorithm.includes('gcm') && tag) {
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
  }
  
  let decrypted = decipher.update(data, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return JSON.parse(decrypted);
}

function validateCertificateChain(cert, ca) {
  // Implement certificate chain validation
  // This is a simplified example
  try {
    // Check if certificate issuer is in CA list
    return ca.some(caCert => {
      return cert.issuer && caCert.subject &&
             JSON.stringify(cert.issuer) === JSON.stringify(caCert.subject);
    });
  } catch (error) {
    logger.error('Certificate chain validation error:', error);
    return false;
  }
}

async function verifyToken(token) {
  // Implement token verification logic
  // This should match your authentication implementation
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  tlsConfig,
  enforceHTTPS,
  encryptPayload,
  encryptApiKey,
  decryptApiKey,
  certificatePinning,
  mutualTLS,
  SecureWebSocket,
  generateHTTPSOptions
}; 