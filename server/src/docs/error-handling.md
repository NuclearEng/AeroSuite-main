# Error Handling Guide

This document describes the standardized error handling system used in the AeroSuite API.

## Overview

The AeroSuite API implements a comprehensive error handling system that ensures consistent error responses across all endpoints. This system is designed to provide clear, actionable error messages to clients while also facilitating debugging and monitoring.

## Error Response Format

All error responses follow a standardized format:

```json
{
  "success": false,
  "message": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "errors": {
    "field1": "Error message for field1",
    "field2": "Error message for field2"
  },
  "meta": {
    "requestId": "req-123456789",
    "path": "/api/resource",
    "timestamp": "2023-07-15T12:34:56.789Z"
  }
}
```

### Fields Explained

- `success`: Always `false` for error responses
- `message`: Human-readable error message
- `code`: Machine-readable error code
- `errors`: Object containing field-specific validation errors (if applicable)
- `meta`: Additional metadata about the request
  - `requestId`: Unique identifier for the request
  - `path`: The API endpoint that was accessed
  - `timestamp`: When the error occurred

## HTTP Status Codes

The API uses standard HTTP status codes to indicate the nature of errors:

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - The request was malformed or contained invalid parameters |
| 401 | Unauthorized - Authentication is required or failed |
| 403 | Forbidden - The authenticated user doesn't have permission |
| 404 | Not Found - The requested resource doesn't exist |
| 409 | Conflict - The request conflicts with the current state |
| 422 | Unprocessable Entity - The request was well-formed but contains semantic errors |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Something went wrong on the server |
| 503 | Service Unavailable - The service is temporarily unavailable |

## Error Codes

The API uses standardized error codes to provide more specific information about what went wrong:

### Authentication Errors

- `AUTHENTICATION_REQUIRED`: Authentication is required to access the resource
- `INVALID_CREDENTIALS`: The provided credentials are invalid
- `INVALID_TOKEN`: The authentication token is invalid
- `TOKEN_EXPIRED`: The authentication token has expired

### Authorization Errors

- `ACCESS_DENIED`: The user doesn't have permission to perform the action
- `INSUFFICIENT_PERMISSIONS`: The user's permissions are insufficient

### Resource Errors

- `RESOURCE_NOT_FOUND`: The requested resource doesn't exist
- `RESOURCE_ALREADY_EXISTS`: A resource with the same identifier already exists
- `RESOURCE_CONFLICT`: The request conflicts with the current state of the resource

### Validation Errors

- `VALIDATION_ERROR`: The request contains validation errors
- `INVALID_INPUT`: The input data is invalid
- `MISSING_REQUIRED_FIELD`: A required field is missing
- `INVALID_FORMAT`: The data format is invalid

### Business Logic Errors

- `BUSINESS_LOGIC_ERROR`: The request violates business rules
- `OPERATION_NOT_ALLOWED`: The requested operation is not allowed
- `PRECONDITION_FAILED`: A precondition for the operation was not met

### API Errors

- `INVALID_API_VERSION`: The requested API version is invalid
- `UNSUPPORTED_API_VERSION`: The requested API version is not supported
- `DEPRECATED_API_VERSION`: The requested API version is deprecated

### Server Errors

- `INTERNAL_SERVER_ERROR`: An unexpected error occurred on the server
- `SERVICE_UNAVAILABLE`: The service is temporarily unavailable
- `DATABASE_ERROR`: A database error occurred
- `EXTERNAL_SERVICE_ERROR`: An error occurred in an external service

### Rate Limiting Errors

- `RATE_LIMIT_EXCEEDED`: The client has sent too many requests

## Handling Errors in Client Applications

### Best Practices

1. **Always check the `success` field** to determine if the request was successful
2. **Handle common error codes** specifically in your application
3. **Display field-specific validation errors** next to the corresponding form fields
4. **Include the `requestId` in support requests** to help with troubleshooting
5. **Implement appropriate retry logic** for 5xx errors and rate limiting

### Example: Handling Validation Errors

```javascript
async function createResource(data) {
  try {
    const response = await fetch('/api/resources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      // Handle validation errors
      if (result.code === 'VALIDATION_ERROR' && result.errors) {
        return {
          success: false,
          validationErrors: result.errors
        };
      }
      
      // Handle other errors
      return {
        success: false,
        message: result.message,
        code: result.code
      };
    }
    
    // Handle success
    return {
      success: true,
      data: result.data
    };
  } catch (error) {
    // Handle network errors
    return {
      success: false,
      message: 'Network error',
      code: 'NETWORK_ERROR'
    };
  }
}
```

## Implementing Error Handling in Controllers

### Using the Base Controller

The `BaseController` class provides built-in error handling for common operations:

```javascript
const BaseController = require('./BaseController');

class UserController extends BaseController {
  constructor(userService) {
    super(userService, 'user');
  }
  
  // Custom methods can use the error handling utilities
  async customAction(req, res, next) {
    try {
      // Your logic here
      const result = await this.service.customAction(req.params.id);
      this.sendSuccess(res, result, 'Custom action successful');
    } catch (error) {
      next(error);
    }
  }
}
```

### Using Controller Wrappers

The `controllerWrapper` utility provides a cleaner way to handle errors:

```javascript
const { asyncHandler } = require('../utils/controllerWrapper');

// Define the controller function
const getUser = async (req, res, next) => {
  const user = await userService.findById(req.params.id);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  return user;
};

// Export with the wrapper
module.exports = {
  getUser: asyncHandler(getUser, 'User retrieved successfully')
};
```

## Throwing Appropriate Errors

The error handling system provides a variety of error classes for different situations:

```javascript
const { 
  BadRequestError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  ServerError
} = require('../utils/errorHandler');

// Example usage
if (!id) {
  throw new BadRequestError('ID is required');
}

if (!user) {
  throw new NotFoundError(`User with ID ${id} not found`);
}

if (!hasPermission) {
  throw new ForbiddenError('You do not have permission to perform this action');
}

if (emailExists) {
  throw new ConflictError('A user with this email already exists');
}

if (Object.keys(validationErrors).length > 0) {
  throw new ValidationError('Validation failed', validationErrors);
}
```

## Conclusion

By following these guidelines, you can ensure consistent error handling across the AeroSuite API, providing a better experience for API consumers and making debugging easier for developers. 
