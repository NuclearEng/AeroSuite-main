# AeroSuite API Contracts

This document describes the standardized API contracts used in the AeroSuite platform.

## Response Format

All API responses follow a standardized format to ensure consistency across the platform.

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data goes here
  },
  "meta": {
    // Metadata such as pagination info goes here (if applicable)
  },
  "apiVersion": "v1"
}
```bash

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE",
  "details": {
    // Additional error details (if applicable)
  },
  "statusCode": 400,
  "timestamp": "2023-07-01T12:34:56.789Z",
  "path": "/api/v1/resource",
  "requestId": "req-123456",
  "apiVersion": "v1"
}
```bash

## Pagination

For endpoints that return collections of resources, pagination is implemented using the following
pattern:

### Request

Pagination parameters are passed as query parameters:

```http
GET /api/v1/resources?page=2&limit=10
```bash

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number (1-based) | 1 |
| `limit` | Number of items per page | 20 |

### Response

Paginated responses include metadata about the pagination:

```json
{
  "success": true,
  "data": [
    // Array of resources
  ],
  "meta": {
    "pagination": {
      "page": 2,
      "limit": 10,
      "totalItems": 45,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": true
    }
  }
}
```bash

## Filtering

Filtering is implemented using query parameters:

```http
GET /api/v1/resources?filter[status]=active&filter[type]=supplier
```bash

Complex filters can be implemented using a JSON string:

```http
GET /api/v1/resources?filter={"status":"active","createdAt":{"$gt":"2023-01-01"}}
```bash

## Sorting

Sorting is implemented using the `sort` query parameter:

```http
GET /api/v1/resources?sort=name
GET /api/v1/resources?sort=-createdAt
```bash

Multiple sort fields can be specified using commas:

```http
GET /api/v1/resources?sort=status,-createdAt
```bash

## Field Selection

Field selection is implemented using the `fields` query parameter:

```http
GET /api/v1/resources?fields=id,name,status
```bash

## Error Codes

AeroSuite uses standardized error codes to indicate the type of error that occurred.

| Error Code | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `AUTHENTICATION_ERROR` | Authentication failed |
| `AUTHORIZATION_ERROR` | Authorization failed |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `RESOURCE_ALREADY_EXISTS` | Resource already exists |
| `INVALID_REQUEST` | Invalid request format |
| `INTERNAL_SERVER_ERROR` | Internal server error |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable |
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded |
| `INVALID_API_VERSION` | Invalid API version |
| `INACTIVE_API_VERSION` | API version is no longer active |
| `UNSUPPORTED_API_VERSION` | API version not supported for this route |
| `VERSION_MISMATCH` | API version mismatch |

## HTTP Status Codes

AeroSuite uses standard HTTP status codes to indicate the result of API requests.

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request successful, no content to return |
| 400 | Bad Request - Request validation failed |
| 401 | Unauthorized - Authentication failed |
| 403 | Forbidden - Authorization failed |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Request validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 503 | Service Unavailable - Service temporarily unavailable |

## Authentication

AeroSuite supports two authentication methods:

### JWT Authentication

For user-based authentication, JWT tokens are used:

```http
Authorization: Bearer <token>
```bash

### API Key Authentication

For service-to-service authentication, API keys are used:

```http
X-API-Key: <api-key>
```bash

## Rate Limiting

Rate limiting is implemented using the following headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | The maximum number of requests allowed in the current time window |
| `X-RateLimit-Remaining` | The number of requests remaining in the current time window |
| `X-RateLimit-Reset` | The time at which the current rate limit window resets (Unix timestamp) |

When the rate limit is exceeded, the API returns a 429 Too Many Requests response with the
following headers:

```http
Retry-After: <seconds>
```bash

## Versioning

API versioning is implemented using one of the following methods:

### URL Path

```http
GET /api/v1/resources
```bash

### Custom Header

```http
X-API-Version: v1
```bash

### Accept Header

```http
Accept: application/vnd.aerosuite.v1+json
```bash

### Query Parameter

```http
GET /api/resources?api-version=v1
```bash

See the [API Versioning Guide](/api/docs/versioning) for more information.

## Webhooks

AeroSuite supports webhooks for event notifications. Webhook payloads follow the same standardized
format as API responses:

```json
{
  "event": "resource.created",
  "timestamp": "2023-07-01T12:34:56.789Z",
  "data": {
    // Event data goes here
  },
  "apiVersion": "v1"
}
```bash

Webhook requests include the following headers:

| Header | Description |
|--------|-------------|
| `X-AeroSuite-Event` | The event type |
| `X-AeroSuite-Signature` | HMAC signature for verification |
| `X-AeroSuite-Timestamp` | Event timestamp |
| `X-AeroSuite-Request-ID` | Unique request ID |

## Bulk Operations

For endpoints that support bulk operations, the request and response formats are as follows:

### Bulk Create

```json
POST /api/v1/resources/bulk
{
  "items": [
    {
      // Resource data
    },
    {
      // Resource data
    }
  ]
}
```bash

### Bulk Update

```json
PATCH /api/v1/resources/bulk
{
  "items": [
    {
      "id": "resource-id-1",
      // Fields to update
    },
    {
      "id": "resource-id-2",
      // Fields to update
    }
  ]
}
```bash

### Bulk Delete

```json
DELETE /api/v1/resources/bulk
{
  "ids": ["resource-id-1", "resource-id-2"]
}
```bash

### Bulk Response

```json
{
  "success": true,
  "message": "Bulk operation completed",
  "data": {
    "processed": 2,
    "successful": 2,
    "failed": 0,
    "results": [
      {
        "id": "resource-id-1",
        "success": true
      },
      {
        "id": "resource-id-2",
        "success": true
      }
    ]
  }
}
```bash

## Conclusion

This document describes the standardized API contracts used in the AeroSuite platform. By following
these contracts, you can ensure consistent behavior across all API endpoints.
