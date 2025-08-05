# Security Environment Configuration

This document provides a template for security-related environment variables.

## Required Security Environment Variables

```bash
# Encryption Keys (Generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-64-character-hex-encryption-key-here
HMAC_SECRET=your-hmac-secret-key-here
SESSION_SECRET=your-session-secret-key-here

# Database Security
MONGODB_ENCRYPTION_AT_REST=true
MONGODB_FIELD_ENCRYPTION_KEY=your-field-encryption-key-here

# API Security
API_RATE_LIMIT_WINDOW_MS=60000
API_RATE_LIMIT_MAX_REQUESTS=100
API_KEY_SALT_ROUNDS=12

# Session Configuration
SESSION_MAX_AGE=86400000  # 24 hours
SESSION_IDLE_TIMEOUT=7200000  # 2 hours
MAX_CONCURRENT_SESSIONS=5
```

## Redis Configuration

```bash
# For rate limiting and sessions
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true
```

## Security Monitoring

```bash
# Alert Configuration
SECURITY_ALERT_EMAIL=security@aerosuite.com
CRITICAL_ALERT_EMAILS=security@aerosuite.com,admin@aerosuite.com
ANOMALY_DETECTION_ENABLED=true
BRUTE_FORCE_THRESHOLD=5
BRUTE_FORCE_WINDOW_MINUTES=15
```

## Audit Configuration

```bash
# Compliance and Logging
AUDIT_LOG_RETENTION_DAYS=2555  # 7 years
AUDIT_LOG_ENCRYPTION=true
AUDIT_BATCH_SIZE=100
```

## Generating Secure Keys

### Encryption Key
```bash
openssl rand -hex 32
```

### Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### API Secret
```bash
openssl rand -base64 32
```

## Production Checklist

- [ ] All keys are unique and randomly generated
- [ ] Redis is configured with password and TLS
- [ ] Email alerts are configured
- [ ] Audit retention meets compliance requirements
- [ ] File upload restrictions are appropriate
- [ ] Rate limits are configured for your load
