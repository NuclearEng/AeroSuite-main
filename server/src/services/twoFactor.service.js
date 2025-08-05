const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

/**
 * Generate a new TOTP secret for a user
 * @returns {Object} Object containing secret in different formats
 */
exports.generateSecret = (userEmail) => {
  const secretObject = speakeasy.generateSecret({
    name: `AeroSuite:${userEmail}`,
    length: 20
  });

  return {
    base32: secretObject.base32,
    otpauth_url: secretObject.otpauth_url
  };
};

/**
 * Generate a QR code from the TOTP secret
 * @param {string} otpauthUrl - The otpauth URL
 * @returns {Promise<string>} - The QR code as a data URL
 */
exports.generateQRCode = async (otpauthUrl) => {
  try {
    return await qrcode.toDataURL(otpauthUrl);
  } catch (error) {
    throw new Error('Error generating QR code');
  }
};

/**
 * Verify a TOTP token against a secret
 * @param {string} token - The token to verify
 * @param {string} secret - The secret to verify against
 * @returns {boolean} - Whether the token is valid
 */
exports.verifyToken = (token, secret) => {
  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 1 // Allow tokens from 1 step before and after (for clock drift)
    });
  } catch (error) {
    return false;
  }
};

/**
 * Generate backup codes for 2FA recovery
 * @param {number} count - Number of backup codes to generate
 * @returns {Array<string>} - Array of backup codes
 */
exports.generateBackupCodes = (count = 10) => {
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 4 groups of 4 alphanumeric characters
    const code = Array(4).fill(0).map(() => 
      crypto.randomBytes(2).toString('hex').toUpperCase()
    ).join('-');
    
    codes.push(code);
  }
  
  return codes;
};

/**
 * Hash backup codes for secure storage
 * @param {Array<string>} codes - Array of plaintext backup codes
 * @returns {Array<string>} - Array of hashed backup codes
 */
exports.hashBackupCodes = (codes) => {
  return codes.map(code => {
    return crypto.createHash('sha256').update(code).digest('hex');
  });
};

/**
 * Verify a backup code against stored hashed codes
 * @param {string} providedCode - The code provided by the user
 * @param {Array<string>} hashedCodes - Array of stored hashed codes
 * @returns {boolean} - Whether the code is valid
 */
exports.verifyBackupCode = (providedCode, hashedCodes) => {
  // Normalize the provided code (remove dashes, uppercase)
  const normalizedCode = providedCode.replace(/-/g, '').toUpperCase();
  
  // Format the code with dashes for verification
  const formattedCode = normalizedCode.match(/.{1,4}/g).join('-');
  
  // Hash the formatted code
  const hashedCode = crypto.createHash('sha256').update(formattedCode).digest('hex');
  
  // Check if the hashed code exists in the array
  return hashedCodes.includes(hashedCode);
};

/**
 * Remove a used backup code from the array
 * @param {string} providedCode - The code provided by the user
 * @param {Array<string>} hashedCodes - Array of stored hashed codes
 * @returns {Array<string>} - Updated array of hashed codes
 */
exports.removeUsedBackupCode = (providedCode, hashedCodes) => {
  // Normalize the provided code (remove dashes, uppercase)
  const normalizedCode = providedCode.replace(/-/g, '').toUpperCase();
  
  // Format the code with dashes
  const formattedCode = normalizedCode.match(/.{1,4}/g).join('-');
  
  // Hash the formatted code
  const hashedCode = crypto.createHash('sha256').update(formattedCode).digest('hex');
  
  // Return array without the used code
  return hashedCodes.filter(code => code !== hashedCode);
};

/**
 * Generate a temporary token for 2FA verification that expires
 * This is used for email/SMS methods or when a user needs to re-authenticate
 * @returns {Object} - Object containing token and expiry
 */
exports.generateTemporaryToken = () => {
  // Generate a 6-digit token that expires in 10 minutes
  const token = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return {
    token,
    expiresAt
  };
}; 