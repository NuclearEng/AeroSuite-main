# ERP System Integration

This document describes the ERP (Enterprise Resource Planning) integration solution for the
AeroSuite application.

## Overview

AeroSuite integrates with external ERP systems to synchronize critical business data including
suppliers, inventory, purchase orders, and quality inspections. The integration provides both read
and write capabilities, allowing for bidirectional data flow between AeroSuite and ERP systems.

## Supported ERP Systems

The current implementation supports the following ERP systems:

- SAP Business One / SAP ERP
- Mock ERP (for development and testing)

Future implementations will add support for:

- Oracle ERP Cloud
- Microsoft Dynamics 365
- NetSuite

## Architecture

The ERP integration follows a service-oriented architecture with the following components:

- __ERP Service__: A facade service that handles provider selection and delegates operations to the
appropriate provider implementation.
- __Provider Services__: Specific implementations for each ERP system (SAP, Oracle, etc.).
- __Data Mappers__: Utilities for transforming data between AeroSuite and ERP data models.
- __Configuration__: Settings for connection details, credentials, and feature flags.
- __API Controllers__: REST API endpoints for interacting with ERP functionality.
- __Sync Workers__: Background processes for scheduled data synchronization.

## Configuration

ERP integration is configured through environment variables and the
`server/src/config/erp-config.js` file. Key configuration options include:

```bash
ERP_PROVIDER=sap             # The active ERP provider (sap, oracle, dynamics365, netsuite, mock)
ERP_TIMEOUT=30000            # Request timeout in milliseconds
ERP_RETRY_ATTEMPTS=3         # Number of retry attempts for failed requests
ERP_RETRY_DELAY=2000         # Delay between retry attempts in milliseconds
ERP_CACHE_ENABLED=true       # Whether to cache ERP responses
ERP_CACHE_TTL=300000         # Cache TTL in milliseconds (5 minutes)
ERP_LOG_LEVEL=info           # Logging level for ERP operations

# SAP-specific settings
SAP_BASE_URL=https://sap-server.example.com:50000
SAP_COMPANY_DB=AEROSUITE
SAP_USERNAME=sap_service_user
SAP_PASSWORD=password
SAP_CLIENT_ID=client_id
SAP_CLIENT_SECRET=client_secret
```bash

## API Endpoints

The ERP integration exposes the following API endpoints:

### Get Data from ERP

- `GET /api/v1/erp/vendors` - Get vendors/suppliers from ERP
- `GET /api/v1/erp/inventory` - Get inventory items from ERP
- `GET /api/v1/erp/purchase-orders` - Get purchase orders from ERP
- `GET /api/v1/erp/quality-inspections` - Get quality inspections from ERP

### Create/Update Data in ERP

- `POST /api/v1/erp/vendors` - Create a vendor in ERP
- `PUT /api/v1/erp/vendors/:id` - Update a vendor in ERP
- `POST /api/v1/erp/purchase-orders` - Create a purchase order in ERP
- `PUT /api/v1/erp/purchase-orders/:id` - Update a purchase order in ERP
- `POST /api/v1/erp/quality-inspections` - Create a quality inspection in ERP
- `PUT /api/v1/erp/quality-inspections/:id` - Update a quality inspection in ERP

### Sync Data

- `POST /api/v1/erp/sync/suppliers/to-erp` - Sync suppliers from AeroSuite to ERP
- `POST /api/v1/erp/sync/inspections/to-erp` - Sync inspections from AeroSuite to ERP
- `POST /api/v1/erp/sync/vendors/from-erp` - Sync vendors from ERP to AeroSuite
- `POST /api/v1/erp/sync/inventory/from-erp` - Sync inventory from ERP to AeroSuite
- `POST /api/v1/erp/sync/purchase-orders/from-erp` - Sync purchase orders from ERP to AeroSuite

## Data Mapping

The integration includes data mapping utilities that transform data between AeroSuite and ERP data
models. These mappers handle:

- Field name translation
- Data type conversion
- Relationship mapping
- Default values
- Status code mapping

## Scheduled Synchronization

Scheduled synchronization can be configured using cron jobs or the built-in worker system. Common
synchronization schedules include:

- Suppliers/Vendors: Daily
- Inventory: Hourly
- Purchase Orders: Every 15 minutes
- Quality Inspections: Daily

## Error Handling

The ERP integration includes robust error handling with:

- Retry mechanisms for transient errors
- Detailed error logging
- Error notifications
- Sync status tracking
- Manual recovery options

## Testing with Mock ERP

For development and testing, the integration includes a mock ERP provider that simulates a real ERP
system. To use the mock provider:

1. Set `ERP_PROVIDER=mock` in your environment variables
2. The mock provider generates realistic test data for all entity types
3. All operations (read, write, sync) will work with the simulated data
4. The mock provider includes configurable delays and error simulation

## Security Considerations

The ERP integration implements several security measures:

- All credentials are stored in environment variables, not in code
- API authentication is required for all ERP endpoints
- HTTPS is used for all external communications
- Minimal permissions are used for ERP service accounts
- Data validation before sending to ERP systems
- Audit logging of all ERP operations

## Extending the Integration

To add support for a new ERP system:

1. Create a new provider class in `server/src/services/erp/` that extends `BaseERPService`
2. Implement all required methods for the new provider
3. Create data mappers for the new provider in `server/src/utils/erp-mappers/`
4. Add the new provider to the provider selection in `erp-service.js`
5. Update the configuration in `erp-config.js` to include settings for the new provider

## Troubleshooting

Common issues and their solutions:

- __Connection Timeouts__: Check network connectivity and increase the `ERP_TIMEOUT` value
- __Authentication Failures__: Verify credentials and check if the service account is active
- __Mapping Errors__: Ensure data models are compatible and add additional mapping logic
- __Sync Performance Issues__: Implement filtering and incremental synchronization
- __Duplicate Records__: Use proper identification fields and implement deduplication logic
