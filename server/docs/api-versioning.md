# AeroSuite API Versioning Guide

This document describes the API versioning strategy implemented in the AeroSuite platform.

## Versioning Strategy

AeroSuite uses a robust API versioning strategy that allows clients to specify which version of the
API they want to use. This ensures backward compatibility while allowing the API to evolve.

### Version Format

API versions follow a simplified semantic versioning format:

- __Major versions__ (v1, v2): Represent significant changes that may include breaking changes
- __Minor versions__ (v1.1, v2.1): Represent backward-compatible feature additions within a major
version

### Specifying API Version

Clients can specify which API version to use in several ways (in order of precedence):

1. __URL Path__: Include the version in the URL path
   ```
   GET /api/v1/customers
   GET /api/v2.1/customers
   ```

2. __Custom Header__: Use the `X-API-Version` header
   ```
   X-API-Version: v1
   ```

3. __Accept Header__: Use content negotiation with vendor-specific media type
   ```
   Accept: application/vnd.aerosuite.v1+json
   ```

4. __Query Parameter__: Use the `api-version` query parameter
   ```
   GET /api/customers?api-version=v1
   ```

If no version is specified, the default version will be used (currently `v1`).

### Version Compatibility

- __Major versions__ (v1 → v2): May contain breaking changes
- __Minor versions__ (v1 → v1.1): Backward compatible within the same major version

## Version Lifecycle

Each API version goes through the following lifecycle:

1. __Active__: The version is fully supported
2. __Deprecated__: The version is still available but will be removed in the future
3. __Sunset__: The version is no longer available

When a version is deprecated, the following headers are included in responses:

- `Warning`: Indicates that the version is deprecated
- `Deprecation`: The date when the version was deprecated
- `Sunset`: The date when the version will be removed
- `Link`: Link to the successor version

## Available Versions

| Version | Status | Release Date | Deprecation Date | Sunset Date | Description |
|---------|--------|--------------|------------------|-------------|-------------|
| v0      | Deprecated | 2022-06-01 | 2023-01-01 | 2023-12-31 | Legacy API version |
| v1      | Active | 2023-01-01 | - | - | Initial stable API version |
| v1.1    | Active | 2023-03-15 | - | - | v1 with bug fixes and minor enhancements |
| v2      | Active | 2023-07-01 | - | - | Enhanced API with advanced filtering and bulk operations |
| v2.1    | Active | 2023-09-15 | - | - | v2 with enhanced security features |

## Feature Support by Version

| Feature | v0 | v1 | v1.1 | v2 | v2.1 |
|---------|----|----|------|----|----- |
| Basic CRUD | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pagination | | ✓ | ✓ | ✓ | ✓ |
| Sorting | | ✓ | ✓ | ✓ | ✓ |
| Field Selection | | ✓ | ✓ | ✓ | ✓ |
| Rate Limiting | | ✓ | ✓ | ✓ | ✓ |
| Export Data | | | ✓ | | |
| Advanced Filtering | | | | ✓ | ✓ |
| Bulk Operations | | | | ✓ | ✓ |
| Webhooks | | | | ✓ | ✓ |
| Enhanced Security | | | | | ✓ |

## API Version Management Endpoints

The following endpoints are available for API version management:

### Get All Versions

```bash
GET /api/versions
```bash

Returns a list of all available API versions and their status.

### Get Version Families

```bash
GET /api/versions/families
```bash

Returns API versions organized by families (major versions and their minor versions).

### Get Version Details

```bash
GET /api/versions/{version}
```bash

Returns detailed information about a specific API version.

### Get Version Features

```bash
GET /api/versions/{version}/features
```bash

Returns a list of features available in a specific API version.

### Check Version Compatibility

```bash
GET /api/versions/compatibility/{clientVersion}/{serverVersion}
```bash

Checks compatibility between client and server versions.

### Get Migration Guide

```bash
GET /api/versions/migration/{fromVersion}/{toVersion}
```bash

Returns a migration guide for moving from one API version to another.

### Get Feature Information

```bash
GET /api/versions/feature/{featureId}
```bash

Returns information about which versions support a specific feature.

### Get Latest Version

```bash
GET /api/versions/latest
```bash

Returns the latest API version.

### Get Latest Version in a Family

```bash
GET /api/versions/latest/{majorVersion}
```bash

Returns the latest version within a major version family.

## Migration Guides

When upgrading between API versions, please refer to the migration guides:

- [Migrating from v0 to v1](/api/versions/migration/v0/v1)
- [Migrating from v1 to v2](/api/versions/migration/v1/v2)
- [Migrating from v1 to v1.1](/api/versions/migration/v1/v1.1)
- [Migrating from v2 to v2.1](/api/versions/migration/v2/v2.1)

## Best Practices

1. __Specify a version explicitly__: Always specify the API version you want to use.
2. __Use feature detection__: Check if a feature is available before using it.
3. __Follow migration guides__: When upgrading to a new version, follow the migration guide.
4. __Monitor deprecation notices__: Watch for deprecation headers in API responses.
5. __Test with multiple versions__: Test your client with different API versions to ensure
compatibility.
