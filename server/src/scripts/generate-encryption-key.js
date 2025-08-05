#!/usr/bin/env node

/**
 * This script generates a secure encryption key for the AeroSuite data encryption system.
 * 
 * Usage:
 *   node generate-encryption-key.js
 */

const { generateEncryptionKey } = require('../utils/encryption');

// Generate a new encryption key
const key = generateEncryptionKey();

// Output the key with instructions
console.log('\n=== AeroSuite Data Encryption Key ===\n');
console.log(`Generated Key: ${key}`);
console.log('\nStore this key securely. For development:');
console.log(`export DATA_ENCRYPTION_KEY=${key}`);
console.log('\nFor production, add to your environment variables or secrets management system.\n');
console.log('IMPORTANT: Never commit this key to version control!\n'); 