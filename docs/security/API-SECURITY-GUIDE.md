# API Security Guide

## Authentication Methods

### 1. API Keys
```bash
# Create API key
POST /api/v1/api-keys
{
  "name": "Production Key",
  "scopes": ["read:inspections", "write:reports"],
  "allowedIps": ["192.168.1.0/24"],
  "expiresInDays": 90
}

# Use API key
curl -H "X-API-Key: sk_live_abc123..." https://api.aerosuite.com/v1/inspections
```

### 2. JWT Tokens
- Set as httpOnly cookies
- Automatic refresh handling
- Session fingerprinting

### 3. OAuth 2.0
- Authorization code flow
- PKCE for SPAs
- Scope-based permissions

## Rate Limiting

| Endpoint Type | Limit | Window |
|--------------|-------|---------|
| Global | 1000 req | 1 min |
| Auth | 5 req | 15 min |
| API | 100 req | 1 min |
| Upload | 10 req | 5 min |

## Security Best Practices

### Input Validation
```javascript
// All inputs validated
{
  title: { type: 'string', maxLength: 200 },
  severity: { enum: ['low', 'medium', 'high'] }
}
```

### Request Signing
```javascript
const signature = crypto
  .createHmac('sha256', secret)
  .update(`${method}\n${path}\n${timestamp}`)
  .digest('hex');
```

### Error Handling
```javascript
// Good: Generic errors
{ "error": "Invalid input", "code": "VALIDATION_ERROR" }

// Bad: Exposed internals
{ "error": "MongoDB duplicate key: email_1" }
```

## Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000`

## Monitoring
- Failed auth attempts
- Rate limit violations
- Suspicious patterns
- API key usage

## Support
- Security: security@aerosuite.com
- Docs: https://docs.aerosuite.com/api/security
