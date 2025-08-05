# AeroSuite Logging Standards

## Overview
AeroSuite uses a centralized, production-grade Winston logger for all application logging. This ensures:
- Structured, queryable logs (JSON format)
- Log rotation and retention
- Context-rich logs (requestId, userId, etc.)
- Consistent log levels and usage
- Easy integration with external log aggregators (ELK, Datadog, Sentry, etc.)

**All logs must use the logger in `server/src/infrastructure/logger.js`.**

---

## Log Levels
- `error`: Critical failures, exceptions, or data loss
- `warn`: Recoverable issues, unexpected states
- `info`: Business events, state changes, normal operations
- `debug`: Detailed diagnostic information (dev/test only)

---

## Usage Patterns

### Basic Logging
```js
const logger = require('../infrastructure/logger');
logger.info('User created', { userId: user._id });
logger.error('Failed to process payment', { orderId, error });
```

### Logging with Request Context
```js
// In an Express route or middleware:
logger.info('Processing request', logger.withContext({ custom: 'value' }, req));
```

### Logging in Error Handlers
```js
logger.error('Unhandled error', logger.withContext({ stack: err.stack }, req));
```

### Logging with logWithRequest
```js
logger.logWithRequest(req, 'info', 'User login', { userId: req.user.id });
```

---

## Best Practices
- **Always include context**: Use `logger.withContext(meta, req)` or `logger.logWithRequest` to add requestId, userId, etc.
- **Use structured metadata**: Pass objects, not string interpolation, for log details.
- **Log at the appropriate level**: Avoid overusing `debug` or `error`.
- **Do not log sensitive data**: Never log passwords, secrets, or PII.
- **Rotate and monitor logs**: Logs are rotated and stored in `logs/`. Monitor disk usage and retention.

---

## Extending Logging
- **External Aggregators**: Add a new Winston transport (e.g., Elasticsearch, Datadog, Sentry) in `logger.js`.
- **Custom Formats**: Add or modify Winston formats for compliance or custom needs.
- **Security/Audit Logs**: Use `securityEventLogger.js` for compliance/audit events.

---

## Example: Adding a New Transport
```js
const { transports } = require('winston');
logger.add(new transports.Http({
  host: 'log-aggregator.local',
  path: '/logs',
  ssl: true
}));
```

---

## References
- [Winston Logger Docs](https://github.com/winstonjs/winston)
- [AeroSuite logger.js](./src/infrastructure/logger.js) 
