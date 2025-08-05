# Advanced User Permissions Management in AeroSuite

This document describes the advanced permission management system implemented in AeroSuite. The system provides fine-grained control over user permissions beyond the basic role-based access control.

## Table of Contents

1. [Overview](#overview)
2. [Permission Structure](#permission-structure)
3. [Role Management](#role-management)
4. [User Custom Permissions](#user-custom-permissions)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)

## Overview

The advanced permission system enhances the basic role-based access control (RBAC) with the following features:

- Fine-grained permissions based on action and resource
- Organized permissions by category
- Custom permissions for individual users
- Permission overrides (both granting and denying)
- Caching for performance optimization
- API endpoints for permission management

## Permission Structure

Permissions follow a structured naming convention:

```
category:action:resource
```

For example:
- `supplier:read` - Permission to view suppliers
- `inspection:create:defect` - Permission to create defect records in inspections
- `user:update:permission` - Permission to modify user permissions

Each permission has the following attributes:
- **Name**: Unique identifier (e.g., `supplier:read`)
- **Description**: Human-readable description
- **Category**: Functional area (e.g., supplier, customer, inspection)
- **Action**: Operation (create, read, update, delete, manage, approve, execute, export)
- **Resource**: Target of the action (e.g., supplier, inspection, defect)

## Role Management

Roles are collections of permissions. The system comes with five default roles:

1. **Admin**: Full system access
2. **Manager**: Access to most features except some administrative functions
3. **Inspector**: Access to inspection features and limited supplier/customer access
4. **Customer**: Limited access to their own data
5. **Viewer**: Read-only access to most data

Roles have the following attributes:
- **Name**: Unique identifier
- **Description**: Human-readable description
- **Permissions**: Array of permission names
- **IsSystem**: Flag indicating if the role is a system default (cannot be deleted)
- **Priority**: Numerical priority (higher takes precedence in case of conflicts)
- **IsActive**: Flag indicating if the role is active

Custom roles can be created with specific sets of permissions tailored to your organization's needs.

## User Custom Permissions

Beyond role-based permissions, individual users can have custom permissions:

- **Granted Permissions**: Additional permissions granted to the user
- **Denied Permissions**: Permissions explicitly denied to the user (overrides role permissions)

The effective permissions for a user are calculated as:
```
(Role Permissions + Granted Permissions) - Denied Permissions
```

This allows for flexible permission assignment without creating numerous specialized roles.

## API Endpoints

The permission system exposes the following API endpoints:

### Permission Management

- `GET /api/v2/permissions`: Get all permissions
- `GET /api/v2/permissions/category/:category`: Get permissions by category
- `POST /api/v2/permissions/categories`: Get permissions by multiple categories
- `POST /api/v2/permissions`: Create a new permission
- `PUT /api/v2/permissions/:id`: Update a permission
- `DELETE /api/v2/permissions/:id`: Delete a permission
- `POST /api/v2/permissions/initialize`: Initialize default permissions and roles

### Role Management

- `GET /api/v2/permissions/roles`: Get all roles
- `GET /api/v2/permissions/roles/:name`: Get role by name
- `GET /api/v2/permissions/roles/:name/permissions`: Get role permissions
- `POST /api/v2/permissions/roles`: Create a new role
- `PUT /api/v2/permissions/roles/:name`: Update a role
- `PUT /api/v2/permissions/roles/:name/permissions`: Update role permissions
- `POST /api/v2/permissions/roles/:name/permissions`: Add permissions to role
- `DELETE /api/v2/permissions/roles/:name/permissions`: Remove permissions from role
- `DELETE /api/v2/permissions/roles/:name`: Delete a role

### User Permission Management

- `GET /api/v2/permissions/users/:id`: Get user permissions
- `PUT /api/v2/permissions/users/:id`: Update user custom permissions
- `POST /api/v2/permissions/users/:id`: Add custom permissions to user
- `DELETE /api/v2/permissions/users/:id`: Remove custom permissions or clear all

## Usage Examples

### Creating a Custom Role

```javascript
// Example request to create a Quality Manager role
const response = await fetch('/api/v2/permissions/roles', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'quality_manager',
    description: 'Quality Management Team Lead',
    permissions: [
      'supplier:read',
      'supplier:read:performance',
      'supplier:read:risk',
      'supplier:update:risk',
      'inspection:read',
      'inspection:create',
      'inspection:update',
      'inspection:approve',
      'inspection:read:report',
      'inspection:export:report',
      'report:create',
      'report:read',
      'report:export'
    ],
    priority: 70
  })
});
```

### Adding Custom Permissions to a User

```javascript
// Example request to grant additional permissions to a user
const response = await fetch(`/api/v2/permissions/users/${userId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    permissions: ['supplier:manage', 'customer:manage'],
    type: 'granted'
  })
});
```

### Denying Specific Permissions to a User

```javascript
// Example request to deny specific permissions to a user
const response = await fetch(`/api/v2/permissions/users/${userId}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    permissions: ['user:delete', 'user:update:role'],
    type: 'denied'
  })
});
```

## Best Practices

1. **Minimize Custom Roles**: Try to use the default roles when possible, as they are maintained and updated with the system.

2. **Use Custom Permissions Sparingly**: Prefer role-based permissions for most users and only add custom permissions when necessary.

3. **Document Custom Roles**: Keep documentation of any custom roles you create, including what permissions they have and why they were created.

4. **Audit Regularly**: Regularly review user permissions to ensure they are appropriate for each user's current responsibilities.

5. **Follow Least Privilege Principle**: Grant the minimum permissions needed for a user to perform their job.

6. **Use Denied Permissions Carefully**: Denied permissions override role permissions, which can lead to unexpected behavior if not managed carefully.

7. **Test Permission Changes**: After making significant permission changes, test the system to ensure everything works as expected.

8. **Consider Role Hierarchy**: When creating custom roles, consider the priority level to establish a clear hierarchy.

9. **Group Related Permissions**: When assigning custom permissions, group them logically by functional area or task. 
