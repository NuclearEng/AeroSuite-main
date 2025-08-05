# AeroSuite Security Practices

## Authentication
- All endpoints require JWT authentication.
- Passwords are hashed using bcrypt.
- 2FA is available for all users.

## Authorization
- Role-based access control (RBAC) enforced at API and UI layers.
- Principle of least privilege for all roles.

## Data Protection
- All sensitive data is encrypted at rest and in transit (TLS 1.2+).
- Input validation and sanitization on all endpoints.
- Regular vulnerability scanning and dependency checks.

## Secrets Management
- Secrets are stored in environment variables, never in code.
- Use of secret management tools in production (e.g., AWS Secrets Manager).

## Logging & Monitoring
- All access and errors are logged with context.
- Security events are monitored and alerted in real time.

## Developer Guidelines
- Never commit secrets or credentials.
- Use prepared statements for DB queries.
- Review code for security issues before merging. 