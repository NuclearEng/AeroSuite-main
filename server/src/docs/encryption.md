# Data Encryption at Rest

This document describes the data encryption system implemented in AeroSuite to protect sensitive data at rest.

## Overview

AeroSuite implements AES-256-CBC encryption to secure sensitive data stored in the database. This helps protect 
personal identifiable information (PII), authentication tokens, and other sensitive data from unauthorized access, 
even if an attacker gains access to the database files.

## Implementation Details

The encryption system consists of the following components:

1. **Encryption Utility**: A utility module (`utils/encryption.js`) that provides encryption and decryption functions.
2. **Mongoose Plugin**: A plugin system that automatically encrypts/decrypts specified fields on Mongoose models.
3. **Field-Level Encryption**: Only specific sensitive fields are encrypted, rather than the entire document.

### Encryption Algorithm

- **Algorithm**: AES-256-CBC (Advanced Encryption Standard with 256-bit key length in Cipher Block Chaining mode)
- **Key Management**: The encryption key is stored in the environment variable `DATA_ENCRYPTION_KEY`
- **Initialization Vector (IV)**: A unique IV is generated for each encrypted field and stored with the encrypted data

### Usage in Models

The encryption is applied to models using the `encryptionPlugin`:

```javascript
const { encryptionPlugin } = require('../utils/encryption');

// Apply encryption plugin with an array of field names to encrypt
schema.plugin(encryptionPlugin([
  'sensitiveField1',
  'sensitiveField2',
  'nestedObject.sensitiveField3'
]));
```

## Security Considerations

1. **Key Management**:
   - The encryption key should be stored securely and rotated periodically
   - In production, the key should never be stored in the codebase
   - Consider using a key management service (KMS) for production deployments

2. **Data Rotation**:
   - When encryption keys are rotated, existing data should be re-encrypted with the new key

3. **Limitations**:
   - This implementation does not protect against application-level vulnerabilities
   - Data is decrypted when loaded into the application memory
   - Search capabilities on encrypted fields are limited

## Models with Encrypted Fields

The following models contain encrypted fields:

1. **User**:
   - Personal contact information
   - Authentication tokens
   - Two-factor authentication secrets
   - SSO identifiers

2. **Customer**:
   - Contact information
   - Address details
   - Notes that may contain sensitive information

## Setting Up Encryption Keys

For development:
```
export DATA_ENCRYPTION_KEY=<32-byte-hex-key>
```

For production, add to environment configuration:
```
DATA_ENCRYPTION_KEY=<32-byte-hex-key>
```

To generate a secure encryption key:
```javascript
const { generateEncryptionKey } = require('./utils/encryption');
const key = generateEncryptionKey();
console.log(key); // Use this as your DATA_ENCRYPTION_KEY
```

## Compliance

This encryption implementation helps AeroSuite comply with data protection regulations like GDPR, CCPA, and industry standards that require protection of sensitive data at rest. 
