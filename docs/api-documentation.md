# AeroSuite API Documentation

This document provides a comprehensive guide to the AeroSuite API, including authentication, endpoints, request/response formats, and usage examples.

## Overview

The AeroSuite API provides programmatic access to the AeroSuite quality management system. It enables developers to integrate with:

- User authentication and authorization
- Supplier management
- Customer management
- Inspection workflows
- Document management
- Reporting and analytics
- Notifications
- ERP integrations

## API Versions

AeroSuite uses versioned APIs to ensure backward compatibility. Currently, the following versions are supported:

| Version | Status | Base URL | Release Date | Sunset Date |
|---------|--------|----------|--------------|-------------|
| v1      | Active | `/api/v1` | 2023-01-01   | -           |
| v2      | Active | `/api/v2` | 2023-07-01   | -           |

### Version Selection

You can specify the API version in one of the following ways:

1. **URL Path** (recommended): `/api/v1/users`
2. **Custom Header**: `X-API-Version: v1`
3. **Accept Header**: `Accept: application/json; version=1`
4. **Query Parameter**: `?api-version=v1`

If no version is specified, the default version (currently v1) will be used.

## Authentication

AeroSuite API uses JWT (JSON Web Tokens) for authentication. Most endpoints require authentication, except for public endpoints like login and registration.

### Obtaining a Token

To authenticate, you need to obtain a JWT token by sending a POST request to the login endpoint:

```
POST /api/v1/auth/login
```

Request body:
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "5f8d0f3a7c213e5cb3c3b4e2",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user"
    },
    "expiresIn": 3600
  }
}
```

### Using the Token

Include the token in the Authorization header of your requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Refresh

Tokens expire after a certain period (default: 1 hour). You can use the refresh token to get a new token without requiring the user to log in again:

```
POST /api/v1/auth/refresh-token
```

Request body:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Logout

To invalidate a token (e.g., when the user logs out), send a request to:

```
POST /api/v1/auth/logout
```

## API Keys

For service-to-service integrations, you can use API keys. API keys are long-lived credentials that don't expire like JWTs. To use an API key, include it in the `X-API-Key` header:

```
X-API-Key: your-api-key
```

API keys can be created and managed in the admin console.

## Response Format

All API responses follow a consistent JSON format:

### Success Responses

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "pagination": {
    // Pagination details (if applicable)
  }
}
```

### Error Responses

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "statusCode": 400,
  "timestamp": "2023-07-18T14:25:43.511Z",
  "path": "/api/v1/users",
  "requestId": "req-123456"
}
```

## Common Parameters

### Pagination

For endpoints that return lists of items, pagination is supported with these query parameters:

- `page` - Page number (1-based, default: 1)
- `limit` - Number of items per page (default: 10, max: 100)

Example:
```
GET /api/v1/suppliers?page=2&limit=20
```

### Filtering

Many list endpoints support filtering by various fields:

- `search` - Free text search across relevant fields
- Other endpoint-specific filters (e.g., `status`, `type`)

Example:
```
GET /api/v1/inspections?status=scheduled&type=incoming
```

### Sorting

Sort results using the `sort` parameter:

- `sort=field` for ascending order
- `sort=-field` for descending order

Example:
```
GET /api/v1/customers?sort=-created
```

## Rate Limiting

To protect the API from abuse, rate limiting is applied. The default limits are:

- 100 requests per 15-minute window for authenticated users
- 20 requests per 15-minute window for unauthenticated users

When a rate limit is exceeded, the API returns a 429 status code with a `Retry-After` header indicating when you can resume making requests.

## Core Resources

### Authentication

Authentication endpoints handle user login, registration, and token management.

- `POST /api/v1/auth/login` - Log in a user
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/refresh-token` - Refresh an access token
- `POST /api/v1/auth/logout` - Log out a user
- `GET /api/v1/auth/me` - Get current user profile
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password/:token` - Reset password
- `GET /api/v1/auth/verify-email/:token` - Verify email address

### Users

User management endpoints for administrators.

- `GET /api/v1/users` - List users
- `GET /api/v1/users/:id` - Get user details
- `POST /api/v1/users` - Create a user
- `PUT /api/v1/users/:id` - Update a user
- `DELETE /api/v1/users/:id` - Delete a user
- `PUT /api/v1/users/:id/status` - Update user status

### Suppliers

Endpoints for managing suppliers and their qualifications.

- `GET /api/v1/suppliers` - List suppliers
- `GET /api/v1/suppliers/:id` - Get supplier details
- `POST /api/v1/suppliers` - Create a supplier
- `PUT /api/v1/suppliers/:id` - Update a supplier
- `DELETE /api/v1/suppliers/:id` - Delete a supplier
- `GET /api/v1/suppliers/:id/qualifications` - List supplier qualifications
- `POST /api/v1/suppliers/:id/qualifications` - Add supplier qualification
- `GET /api/v1/suppliers/:id/performance` - Get supplier performance metrics
- `GET /api/v1/suppliers/:id/risk` - Get supplier risk assessment

### Customers

Endpoints for managing customers.

- `GET /api/v1/customers` - List customers
- `GET /api/v1/customers/:id` - Get customer details
- `POST /api/v1/customers` - Create a customer
- `PUT /api/v1/customers/:id` - Update a customer
- `DELETE /api/v1/customers/:id` - Delete a customer
- `GET /api/v1/customers/:id/contacts` - List customer contacts
- `POST /api/v1/customers/:id/contacts` - Add customer contact

### Inspections

Endpoints for managing inspection workflows.

- `GET /api/v1/inspections` - List inspections
- `GET /api/v1/inspections/:id` - Get inspection details
- `POST /api/v1/inspections` - Create an inspection
- `PUT /api/v1/inspections/:id` - Update an inspection
- `DELETE /api/v1/inspections/:id` - Delete an inspection
- `GET /api/v1/inspections/:id/checklist` - Get inspection checklist
- `PUT /api/v1/inspections/:id/checklist` - Update inspection checklist
- `GET /api/v1/inspections/:id/defects` - List inspection defects
- `POST /api/v1/inspections/:id/defects` - Add inspection defect
- `POST /api/v1/inspections/:id/complete` - Complete an inspection
- `GET /api/v1/inspections/:id/report` - Generate inspection report
- `GET /api/v1/inspections/:id/attachments` - List inspection attachments
- `POST /api/v1/inspections/:id/attachments` - Upload inspection attachment

### Documents

Endpoints for managing documents and attachments.

- `GET /api/v1/documents` - List documents
- `GET /api/v1/documents/:id` - Get document details
- `POST /api/v1/documents` - Upload a document
- `DELETE /api/v1/documents/:id` - Delete a document
- `GET /api/v1/documents/:id/download` - Download a document

### Notifications

Endpoints for managing notifications.

- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/:id` - Get notification details
- `PUT /api/v1/notifications/:id/read` - Mark notification as read
- `PUT /api/v1/notifications/read-all` - Mark all notifications as read

### Reports

Endpoints for generating reports and analytics.

- `GET /api/v1/reports/inspections` - Get inspection statistics
- `GET /api/v1/reports/suppliers` - Get supplier performance reports
- `GET /api/v1/reports/quality` - Get quality metrics

## Advanced Usage

### Batch Operations

For operations on multiple resources, use the batch endpoints:

```
POST /api/v1/batch/suppliers
```

Request body:
```json
{
  "operations": [
    {
      "method": "POST",
      "path": "/suppliers",
      "body": {
        "name": "Supplier 1",
        "email": "contact@supplier1.com"
      }
    },
    {
      "method": "PUT",
      "path": "/suppliers/123",
      "body": {
        "status": "inactive"
      }
    }
  ]
}
```

### Webhooks

AeroSuite supports webhooks for real-time event notifications. You can configure webhooks in the admin console to receive notifications for events like:

- Inspection created/updated/completed
- Supplier qualification changes
- Document uploads
- User actions

Webhook payload example:
```json
{
  "event": "inspection.completed",
  "timestamp": "2023-07-18T14:25:43.511Z",
  "data": {
    "inspectionId": "5f8d0f3a7c213e5cb3c3b4e2",
    "status": "completed",
    "result": "passed"
  }
}
```

## SDK and Client Libraries

AeroSuite provides official client libraries for easy integration:

- JavaScript/TypeScript: `@aerosuite/api-client`
- Python: `aerosuite-api-client`
- Java: `com.aerosuite.api.client`

Example (JavaScript):
```javascript
import { AeroSuiteClient } from '@aerosuite/api-client';

const client = new AeroSuiteClient({
  baseUrl: 'https://api.aerosuite.com',
  version: 'v1',
  apiKey: 'your-api-key' // or use token auth
});

// Get suppliers
const suppliers = await client.suppliers.list({ status: 'active' });

// Create an inspection
const inspection = await client.inspections.create({
  title: 'Quality Inspection',
  supplierId: '5f8d0f3a7c213e5cb3c3b4e2',
  type: 'incoming'
});
```

## API Explorer

The interactive API explorer is available at:

- v1: `/api/v1/docs`
- v2: `/api/v2/docs`

The explorer allows you to:
- Browse available endpoints
- View request/response schemas
- Test API calls
- Generate code snippets

## Support and Feedback

If you have questions or need assistance with the API, please contact:

- Email: api-support@aerosuite.com
- Developer forum: https://developers.aerosuite.com/forum

We welcome feedback on the API and documentation.

## Changelog

### v2 (2023-07-01)

- Added advanced permissions management
- Enhanced inspection workflow capabilities
- Improved real-time notification system
- Added PKCE support for SPA authentication
- Implemented refresh token rotation

### v1 (2023-01-01)

- Initial API release
- Core authentication and resource management
- Basic inspection workflows
- Document management
- Supplier and customer management 
