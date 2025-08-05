# AeroSuite Scripts

## Test Data Generator (`test-data-generator.js`)

**Purpose:**
Generate realistic, configurable test data for development, testing, and CI environments. Supports users, customers, suppliers, inspections, components, and documents, with relationship preservation and reproducible output.

### Usage

**From the command line:**

```bash
# Generate data with default settings
npm run test:data

# Generate data with custom settings
node scripts/test-data-generator.js generate --users 10 --customers 20 --suppliers 15

# Generate data with a specific output directory
node scripts/test-data-generator.js generate --output ./custom-test-data

# Generate data with a specific seed for reproducible results
node scripts/test-data-generator.js generate --seed 12345

# Import generated data into the database (simulation only)
node scripts/test-data-generator.js import
```

**Programmatically:**

```js
const { generateTestData } = require('./scripts/test-data-generator');
const data = generateTestData({
  outputDir: './custom-test-data',
  count: { users: 10, customers: 20 },
  seed: 12345
});
```

### Configuration

- Default config: `scripts/test-data-config.json`
- Supports environment profiles (development, testing, ci) and templates (minimal, standard, full)
- Options: outputDir, format, count, relationships, seed, locale, includeImages

### Documentation

See [`docs/test-data-generation.md`](../docs/test-data-generation.md) for full details, configuration options, and integration examples.

## Test Report Generator (`generate-test-report.js`)

**Purpose:**
Generate comprehensive test reports from Jest results, with support for HTML, JSON, and Markdown formats, code coverage, historical trends, and CI/CD integration.

### Usage

**From the command line:**

```bash
# Generate HTML report
node scripts/generate-test-report.js

# Generate report with code coverage
node scripts/generate-test-report.js --coverage

# Generate JSON or Markdown report
node scripts/generate-test-report.js --format=json
node scripts/generate-test-report.js --format=markdown

# Generate report with historical data
node scripts/generate-test-report.js --history

# Specify output directory
node scripts/generate-test-report.js --output=./reports/sprint-23

# Compare with previous report
node scripts/generate-test-report.js --compare=./test-reports/latest

# Run in CI mode
node scripts/generate-test-report.js --ci
```

**Via npm scripts:**

Add to `package.json`:

```json
"test:report": "node scripts/generate-test-report.js",
"test:report:coverage": "node scripts/generate-test-report.js --coverage"
```

### Configuration & Documentation

- See [`docs/test-report-generation.md`](../docs/test-report-generation.md) for full details, options, and integration examples.

## ERP System Integration

**Purpose:**
Integrate AeroSuite with external ERP systems (SAP, Oracle, Dynamics, Mock, etc.) for bidirectional sync of suppliers, inventory, purchase orders, and quality inspections.

### Architecture
- **ERP Service Layer:** Facade and provider classes in `server/src/services/erp/`
- **API Endpoints:** REST endpoints in `server/src/routes/v1/erp.routes.js` and `server/src/controllers/erp.controller.js`
- **Client Integration:** Service in `client/src/services/erpService.ts`
- **Configuration:** `server/src/config/erp-config.js` and environment variables
- **Data Mappers:** Utilities in `server/src/utils/erp-mappers/`
- **Sync Workers:** For scheduled or manual sync

### Usage

**Server-side:**
- Configure provider and credentials in `.env` and `server/src/config/erp-config.js`
- Use REST API endpoints (see docs/erp-integration.md) for ERP operations
- Example sync endpoints:
  - `POST /api/v1/erp/sync/suppliers/to-erp`
  - `POST /api/v1/erp/sync/vendors/from-erp`

**Client-side:**
- Use `erpService` in `client/src/services/erpService.ts` for API calls

**Development/Testing:**
- Set `ERP_PROVIDER=mock` to use the mock ERP provider

### Example npm Scripts

Add to `package.json` for common sync tasks:

```json
"erp:sync:suppliers:to-erp": "curl -X POST http://localhost:5000/api/v1/erp/sync/suppliers/to-erp",
"erp:sync:vendors:from-erp": "curl -X POST http://localhost:5000/api/v1/erp/sync/vendors/from-erp"
```

### Configuration
- See `server/src/config/erp-config.js` for provider-specific options
- Set environment variables for credentials and provider selection

### Documentation
- See [`docs/erp-integration.md`](../docs/erp-integration.md) for full details, API endpoints, and extension instructions. 