# Data Encryption at Rest

This document describes the data encryption system implemented in AeroSuite to protect sensitive
data at rest.

## Overview

AeroSuite implements AES-256-CBC encryption to secure sensitive data stored in the database. This
helps protect
personal identifiable information (PII), authentication tokens, and other sensitive data from
unauthorized access,
even if an attacker gains access to the database files.

## Implementation Details

The encryption system consists of the following components:

1. __Encryption Utility__: A utility module (`utils/encryption.js`) that provides encryption and
decryption functions.
2. __Mongoose Plugin__: A plugin system that automatically encrypts/decrypts specified fields on
Mongoose models.
3. __Field-Level Encryption__: Only specific sensitive fields are encrypted, rather than the entire
document.

### Encryption Algorithm

- __Algorithm__: AES-256-CBC (Advanced Encryption Standard with 256-bit key length in Cipher Block
Chaining mode)
- __Key Management__: The encryption key is stored in the environment variable `DATA_ENCRYPTION_KEY`
- __Initialization Vector (IV)__: A unique IV is generated for each encrypted field and stored with
the encrypted data

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
```bash

## Security Considerations

1. __Key Management__:
   - The encryption key should be stored securely and rotated periodically
   - In production, the key should never be stored in the codebase
   - Consider using a key management service (KMS) for production deployments

2. __Data Rotation__:
   - When encryption keys are rotated, existing data should be re-encrypted with the new key

3. __Limitations__:
   - This implementation does not protect against application-level vulnerabilities
   - Data is decrypted when loaded into the application memory
   - Search capabilities on encrypted fields are limited

## Models with Encrypted Fields

The following models contain encrypted fields:

1. __User__:
   - Personal contact information
   - Authentication tokens
   - Two-factor authentication secrets
   - SSO identifiers

2. __Customer__:
   - Contact information
   - Address details
   - Notes that may contain sensitive information

## Setting Up Encryption Keys

For development:
```bash
export DATA_ENCRYPTION_KEY=<32-byte-hex-key>
```bash

For production, add to environment configuration:
```bash
DATA_ENCRYPTION_KEY=<32-byte-hex-key>
```bash

To generate a secure encryption key:
```javascript
const { generateEncryptionKey } = require('./utils/encryption');
const key = generateEncryptionKey();
console.log(key); // Use this as your DATA_ENCRYPTION_KEY
```bash

## Compliance

This encryption implementation helps AeroSuite comply with data protection regulations like GDPR,
CCPA, and industry standards that require protection of sensitive data at rest.
