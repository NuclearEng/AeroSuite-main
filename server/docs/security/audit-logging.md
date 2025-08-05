# Audit Logging System

This document provides an overview of the comprehensive audit logging system implemented in AeroSuite to track sensitive operations.

## Overview

AeroSuite implements a robust audit logging system that:

1. **Automatically logs sensitive operations** across the application
2. **Provides detailed audit trails** for security and compliance purposes
3. **Supports forensic analysis** in case of security incidents
4. **Enables compliance** with regulatory requirements (GDPR, SOC 2, etc.)

## Architecture

The audit logging system consists of the following components:

1. **AuditLog Model**: A MongoDB model for storing audit log entries
2. **Audit Logging Service**: A service that provides methods for creating and querying audit logs
3. **Audit Logging Middleware**: Middleware that automatically logs sensitive operations
4. **Audit Logging Controller**: API endpoints for accessing and managing audit logs
5. **Audit Logging Routes**: RESTful routes for the audit logging API

## Sensitive Operations

The following types of operations are considered sensitive and are automatically logged:

1. **Authentication Operations**
   - User login/logout
   - Failed login attempts
   - Password changes/resets
   - MFA enablement/disablement
   - API key generation/revocation

2. **User Management Operations**
   - User creation/modification/deletion
   - Role changes
   - Permission changes
   - Account locking/unlocking

3. **Data Operations**
   - Access to sensitive data
   - Export of sensitive data
   - Deletion of sensitive data
   - Encryption key rotation
   - Data anonymization

4. **System Operations**
   - System settings changes
   - Security settings changes
   - Feature flag changes
   - Integration configuration

5. **Admin Operations**
   - Admin actions
   - Bulk operations
   - Report generation
   - Database operations

## Implementation Details

### AuditLog Model

The AuditLog model stores the following information for each audit log entry:

```javascript
const auditLogSchema = new Schema({
  // User who performed the action
  user: {
    id: mongoose.Schema.Types.ObjectId,
    username: String,
    email: String,
    role: String
  },
  
  // Action information
  action: String,
  entity: String,
  entityId: mongoose.Schema.Types.ObjectId,
  status: String, // success, failure, warning, info
  description: String,
  
  // Timestamp
  timestamp: Date,
  
  // Additional metadata
  metadata: {
    ip: String,
    userAgent: String,
    requestId: String,
    changes: Object,
    context: Object
  },
  
  // Severity level
  severity: String, // low, medium, high, critical
  
  // Whether this is a sensitive operation
  sensitive: Boolean
});
```

### Audit Logging Service

The Audit Logging Service provides the following methods:

```javascript
// Log a sensitive operation
auditLoggingService.logSensitiveOperation({
  user: { id, username, email, role },
  action: 'USER_ROLE_CHANGED',
  entity: 'User',
  entityId: userId,
  description: 'User role changed from USER to ADMIN',
  metadata: { changes: { from: 'USER', to: 'ADMIN' } }
});

// Log any operation (will automatically detect if sensitive)
auditLoggingService.logOperation({
  user: { id, username, email, role },
  action: 'USER_PROFILE_VIEWED',
  entity: 'User',
  entityId: userId,
  description: 'User profile viewed'
});

// Log from a request
auditLoggingService.logFromRequest(req, {
  action: 'USER_UPDATED',
  entity: 'User',
  entityId: userId,
  description: 'User updated'
});

// Get audit logs for an entity
auditLoggingService.getEntityAuditLogs('User', userId, {
  from: new Date('2023-01-01'),
  to: new Date(),
  sensitive: true
});

// Get audit logs for a user
auditLoggingService.getUserAuditLogs(userId, {
  from: new Date('2023-01-01'),
  to: new Date()
});

// Get sensitive operation logs
auditLoggingService.getSensitiveOperationLogs({
  from: new Date('2023-01-01'),
  to: new Date()
});
```

### Automatic Audit Logging

The audit logging middleware automatically logs sensitive operations based on predefined route patterns. For example:

```javascript
// User management
{
  path: '/api/v1/users',
  method: 'POST',
  action: 'USER_CREATED',
  entity: 'User',
  description: 'User created'
}

// Authentication
{
  path: '/api/v1/auth/login',
  method: 'POST',
  action: 'USER_LOGIN',
  entity: 'User',
  description: 'User login'
}

// Data protection
{
  path: /^\/api\/v1\/data-protection\/rotate-keys\/[a-zA-Z]+$/,
  method: 'POST',
  action: 'ENCRYPTION_KEY_ROTATED',
  entity: 'Encryption',
  description: 'Encryption keys rotated'
}
```

## API Endpoints

The audit logging system exposes the following API endpoints:

| Endpoint | Method | Description | Required Role |
|----------|--------|-------------|--------------|
| `/api/v1/audit-logs` | GET | Get audit logs with filtering | ADMIN, SECURITY_OFFICER, AUDITOR |
| `/api/v1/audit-logs/:id` | GET | Get audit log by ID | ADMIN, SECURITY_OFFICER, AUDITOR |
| `/api/v1/audit-logs/export` | POST | Export audit logs | ADMIN, SECURITY_OFFICER, AUDITOR |
| `/api/v1/audit-logs/statistics` | GET | Get audit statistics | ADMIN, SECURITY_OFFICER, AUDITOR |

### Query Parameters

The `/api/v1/audit-logs` endpoint supports the following query parameters:

- `entity`: Filter by entity type (e.g., 'User', 'Customer')
- `entityId`: Filter by entity ID
- `userId`: Filter by user ID
- `action`: Filter by action type
- `from`: Start date for filtering
- `to`: End date for filtering
- `sensitive`: Filter for sensitive operations only
- `limit`: Maximum number of logs to return
- `skip`: Number of logs to skip (for pagination)
- `sort`: Sort order (1 for ascending, -1 for descending)
- `sanitize`: Whether to sanitize sensitive data in the logs

## Security Considerations

1. **Access Control**:
   - Audit logs are only accessible to authorized roles (ADMIN, SECURITY_OFFICER, AUDITOR)
   - Sensitive data in logs can be sanitized before being returned

2. **Data Protection**:
   - Sensitive data in audit logs (e.g., IP addresses, emails) can be sanitized
   - Audit logs are stored securely with appropriate access controls

3. **Performance**:
   - Audit logging is designed to have minimal impact on application performance
   - Audit log creation is asynchronous and non-blocking

4. **Reliability**:
   - Audit logging failures are handled gracefully and do not affect the main application flow
   - Errors in audit logging are logged to the security event system

## Usage Examples

### Manually Logging a Sensitive Operation

```javascript
const auditLoggingService = require('../services/audit-logging.service');

async function changeUserRole(userId, newRole) {
  // Perform the role change
  await User.findByIdAndUpdate(userId, { role: newRole });
  
  // Log the sensitive operation
  await auditLoggingService.logSensitiveOperation({
    user: req.user,
    action: 'USER_ROLE_CHANGED',
    entity: 'User',
    entityId: userId,
    description: `User role changed to ${newRole}`,
    metadata: {
      changes: {
        role: {
          from: user.role,
          to: newRole
        }
      }
    }
  });
}
```

### Querying Audit Logs

```javascript
const auditLoggingService = require('../services/audit-logging.service');

async function getUserActivityAudit(userId) {
  // Get all audit logs for the user
  const userLogs = await auditLoggingService.getUserAuditLogs(userId, {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    limit: 100,
    sort: -1, // Most recent first
    sanitize: true
  });
  
  return userLogs;
}
```

### Exporting Audit Logs

```javascript
// In a controller
async function exportUserAuditLogs(req, res) {
  const { userId, format = 'csv' } = req.body;
  
  // Get logs for the user
  const logs = await auditLoggingService.getUserAuditLogs(userId, {
    limit: 1000,
    sanitize: true
  });
  
  // Format as CSV
  const csv = convertLogsToCSV(logs);
  
  // Send as download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="user-audit-${userId}.csv"`);
  res.send(csv);
}
```

## Compliance Mapping

The audit logging system helps meet the following compliance requirements:

| Regulation | Requirement | How AeroSuite Meets It |
|------------|-------------|------------------------|
| SOC 2 | CC7.2 - Monitor system changes | Logs all system setting changes |
| SOC 2 | CC5.2 - Restrict access to sensitive data | Logs all access to sensitive data |
| GDPR | Article 30 - Records of processing activities | Logs all data processing operations |
| GDPR | Article 32 - Security of processing | Provides audit trails for security events |
| HIPAA | 164.312(b) - Audit controls | Records and examines activity in systems with PHI |
| ISO 27001 | A.12.4 - Logging and monitoring | Provides comprehensive logging of security events |

## Implementation Checklist

- [x] Create AuditLog model
- [x] Implement Audit Logging Service
- [x] Create Audit Logging Middleware
- [x] Implement Audit Logging Controller
- [x] Create Audit Logging Routes
- [x] Apply middleware in application
- [x] Document the audit logging system
- [ ] Create audit log visualization dashboard
- [ ] Implement automated audit log analysis
- [ ] Set up audit log retention policies 