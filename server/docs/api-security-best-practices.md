# API Security Best Practices

This document outlines the API security best practices implemented in AeroSuite to protect against common vulnerabilities as defined in the OWASP API Security Top 10.

## Security Measures Implemented

### 1. Authentication and Authorization

- **JWT Token Security**
  - Algorithm restriction to HS256
  - Token expiration validation
  - Issuer validation
  - Protection against timing attacks
  - Token reuse detection

- **API Key Authentication**
  - Constant-time comparison to prevent timing attacks
  - Required for external service integrations
  - Separate from user authentication

- **Role-Based Access Control**
  - Endpoint-specific role requirements
  - Customer-specific data access controls
  - Principle of least privilege

### 2. Input Validation and Sanitization

- **Request Validation**
  - Type checking for all input parameters
  - Min/max value validation
  - Pattern matching for structured data
  - Required field validation

- **SQL Injection Protection**
  - Pattern detection for common SQL injection attacks
  - Deep inspection of request parameters, query strings, and body
  - Blocking of suspicious requests

### 3. Rate Limiting and Abuse Protection

- **Rate Limiting**
  - Configurable time windows and request limits
  - IP-based rate limiting
  - User-based rate limiting for authenticated endpoints
  - Custom response messages

- **Brute Force Protection**
  - Account lockout after failed attempts
  - Progressive delays between authentication attempts
  - Monitoring and alerting for repeated failures

### 4. Transport Security

- **HTTPS Enforcement**
  - Strict Transport Security (HSTS)
  - TLS 1.2+ requirement
  - Secure cipher configuration
  - Certificate validation

- **API Endpoint Security**
  - Content-Type enforcement
  - Method validation
  - Request size limits
  - Additional security headers

### 5. Sensitive Data Protection

- **Data Filtering**
  - Automatic removal of sensitive fields from responses
  - Deep object traversal for nested sensitive data
  - Configurable sensitive field list

- **CSRF Protection**
  - Token validation for state-changing operations
  - Token-based defense against cross-site requests
  - Exemption for safe methods (GET, HEAD, OPTIONS)

## Implementation Details

### API Security Middleware

The API security measures are implemented through a set of middleware functions in `server/src/middleware/api-security.middleware.js`:

```javascript
// Example usage of API security middleware
const apiSecurity = require('../middleware/api-security.middleware');

// Apply security to all API routes
app.use('/api', apiSecurity.secureApi);

// Apply rate limiting to authentication endpoints
app.use('/api/auth', apiSecurity.createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 requests per 15 minutes
}));

// Validate request body
app.post('/api/users', apiSecurity.validateRequest.body({
  name: { type: 'string', required: true },
  email: { type: 'string', required: true, pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/ },
  age: { type: 'number', min: 18, max: 120 }
}), userController.createUser);
```

### Environment Variables

The following environment variables can be configured for API security:

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT signing | - |
| `JWT_ISSUER` | JWT issuer name | 'aerosuite' |
| `JWT_MAX_AGE` | Maximum JWT token age | '24h' |
| `API_KEY` | API key for external services | - |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting window in milliseconds | 900000 (15 minutes) |
| `RATE_LIMIT_MAX` | Maximum requests per window | 100 |

## OWASP API Security Top 10 Coverage

| OWASP API Security Risk | Coverage | Implementation |
|-------------------------|----------|----------------|
| API1:2019 Broken Object Level Authorization | ✅ | Role-based access control, customer-specific restrictions |
| API2:2019 Broken User Authentication | ✅ | Enhanced JWT validation, API key auth, rate limiting |
| API3:2019 Excessive Data Exposure | ✅ | Sensitive data filtering, response pruning |
| API4:2019 Lack of Resources & Rate Limiting | ✅ | Configurable rate limiting, request size limits |
| API5:2019 Broken Function Level Authorization | ✅ | Role-based middleware, endpoint-specific permissions |
| API6:2019 Mass Assignment | ✅ | Input validation, schema-based request validation |
| API7:2019 Security Misconfiguration | ✅ | Security headers, HTTPS enforcement, content type validation |
| API8:2019 Injection | ✅ | SQL injection protection, input sanitization |
| API9:2019 Improper Assets Management | ✅ | API versioning, deprecated endpoint handling |
| API10:2019 Insufficient Logging & Monitoring | ✅ | Comprehensive logging, error tracking, monitoring endpoints |

## Best Practices for Developers

When building new API endpoints, follow these guidelines:

1. **Always apply appropriate middleware**
   - Use `apiSecurity.secureApi` for all new routes
   - Add role-based restrictions using `restrictTo`
   - Apply request validation with `validateRequest`

2. **Input validation**
   - Validate all inputs with appropriate schema
   - Never trust client-provided data
   - Use pattern matching for structured data

3. **Output sanitization**
   - Never return sensitive data
   - Filter all responses with `protectSensitiveData`
   - Return only what the client needs

4. **Authorization**
   - Check permissions for each operation
   - Implement proper object-level authorization
   - Use customer-specific restrictions where appropriate

5. **Error handling**
   - Use generic error messages in production
   - Don't expose implementation details
   - Log detailed errors server-side only

## Testing API Security

Security testing is performed through:

1. **Automated scanning** with OWASP ZAP during CI/CD pipeline
2. **Manual penetration testing** on a quarterly basis
3. **Dependency scanning** for vulnerabilities
4. **Code reviews** with security focus

## References

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [NIST API Security Guidelines](https://pages.nist.gov/800-95/sp800-95.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-jwt-bcp-02) 