# AeroSuite E2E Testing Automation

## 🚀 Quick Start

### Option 1: Docker-based Testing (Recommended)
Run E2E tests with full Docker environment:

```bash
# Run tests with existing Docker setup
npm run test:e2e:docker

# Rebuild all Docker images and run tests
npm run test:e2e:docker:rebuild

# Keep services running after tests
npm run test:e2e:docker:keep
```

### Option 2: Local Testing
Run E2E tests with local Node.js servers:

```bash
npm run test:e2e:auto
```

This command will:
- ✅ Automatically find available ports
- ✅ Update configuration files
- ✅ Start backend and frontend servers
- ✅ Run all E2E tests
- ✅ Clean up everything when done

## 📋 Available Commands

### Docker-based Testing Commands
```bash
# Run E2E tests with Docker
npm run test:e2e:docker              # Run tests using docker-compose
npm run test:e2e:docker:rebuild      # Rebuild images and run tests
npm run test:e2e:docker:keep         # Keep containers running after tests

# Manual Docker management
npm run docker:test:up               # Start test environment
npm run docker:test:down             # Stop test environment
npm run docker:test:logs             # View container logs
npm run docker:test:build            # Build test images
```

### Local Testing Commands
```bash
# Automated local testing
npm run test:e2e:auto                # Full automation with port scanning
npm run test:e2e:simple              # Simple automation (fixed ports)

# Pre-flight checks
npm run test:e2e:check               # Check if tests are ready to run
npm run test:e2e:analyze             # Analyze test quality
```

### Manual Testing
```bash
# Run tests manually (requires servers to be running)
npm run test:e2e

# Open Cypress Test Runner (interactive mode)
npm run cy:open

# Run specific test suites
npm run cy:run:auth       # Authentication tests
npm run cy:run:dashboard  # Dashboard tests
npm run cy:run:suppliers  # Supplier management tests
npm run cy:run:customers  # Customer management tests
npm run cy:run:inspections # Inspection tests
```

## 🐳 Docker vs Local Testing

### When to Use Docker Testing
- **Production-like environment**: Tests run against the same stack as production
- **Complete isolation**: No conflicts with local services
- **Consistent results**: Same environment for all developers
- **Full stack testing**: Includes MongoDB, Redis, and all services

### When to Use Local Testing
- **Faster iteration**: No Docker overhead
- **Debugging**: Easier to debug application code
- **Development**: When actively developing features
- **Resource constraints**: When Docker resources are limited

## 🔧 How It Works

### Automated Test Runner (`test:e2e:auto`)

1. **Port Detection**: Scans for available ports starting from defaults (3000 for frontend, 5000 for backend)
2. **Configuration Update**: Temporarily updates config files with selected ports
3. **Server Management**: Starts both servers and waits for them to be ready
4. **Test Execution**: Runs all E2E tests in headless mode
5. **Cleanup**: Stops servers, restores configs, and cleans up resources

### Docker Test Runner (`test:e2e:docker`)

1. **Docker Check**: Verifies Docker and Docker Compose are installed
2. **Image Building**: Builds or rebuilds all required Docker images
3. **Service Orchestration**: Starts MongoDB, Redis, Backend, and Frontend
4. **Health Monitoring**: Waits for all services to be healthy
5. **Test Execution**: Runs Cypress tests against Docker environment
6. **Cleanup**: Optionally stops all services or keeps them running

### Features

- **Smart Port Selection**: Automatically finds free ports if defaults are occupied
- **Configuration Backup**: Creates backups before modifying any files
- **Health Checks**: Waits for servers to be fully ready before testing
- **Graceful Cleanup**: Ensures all resources are cleaned up, even on failure
- **Error Recovery**: Handles interruptions and unexpected errors
- **Docker Integration**: Full support for containerized testing
- **Service Dependencies**: Proper startup order with health checks

## 📁 Test Structure

```
cypress/
├── e2e/                    # Test files
│   ├── auth.cy.js         # Authentication tests
│   ├── dashboard.cy.js    # Dashboard tests
│   ├── suppliers.cy.js    # Supplier tests
│   ├── customers.cy.js    # Customer tests
│   └── inspections.cy.js  # Inspection tests
├── fixtures/              # Test data
│   └── testData.json
├── support/               # Helper functions
│   ├── commands.js        # Custom Cypress commands
│   └── e2e.js            # Global configuration
└── README.md             # This file
```

## 🛠 Troubleshooting

### Docker-Specific Issues

1. **Docker Not Found**
   - Install Docker Desktop: https://www.docker.com/products/docker-desktop
   - Ensure Docker daemon is running

2. **Container Build Failures**
   - Clear Docker cache: `docker system prune -a`
   - Rebuild with no cache: `npm run test:e2e:docker:rebuild`

3. **Service Health Check Failures**
   - Check logs: `npm run docker:test:logs`
   - Verify port availability: `lsof -i :3000,5000,9999,27017,6379`
   - Increase timeout in scripts/e2e-docker-runner.js

### Local Testing Issues

1. **Port Already in Use**
   - The automation will automatically find alternative ports
   - You can also manually kill processes: `lsof -ti:3000 | xargs kill -9`

2. **Server Start Timeout**
   - Check server logs for errors
   - Ensure all dependencies are installed: `npm install`
   - Try running servers manually first to debug

3. **Test Failures**
   - Check if the application is working correctly
   - Review test output for specific failures
   - Use `npm run cy:open` for interactive debugging

### Debug Mode

For detailed logging during automated tests:

```bash
# Run with debug output
DEBUG=* npm run test:e2e:auto
```

## 📊 Test Reports

After running tests:
- **Screenshots**: Saved in `cypress/screenshots/` (on failure)
- **Videos**: Saved in `cypress/videos/` (if enabled)
- **Analysis Report**: `cypress/e2e-analysis-report.json`

## 🔍 Pre-flight Checks

Before running tests, you can verify everything is set up correctly:

```bash
npm run test:e2e:check
```

This will check:
- Required directories exist
- Test files are present
- Configuration is valid
- Dependencies are installed

## 📈 Test Quality Analysis

Analyze your E2E test quality:

```bash
npm run test:e2e:analyze
```

This provides:
- Test coverage analysis
- Code quality metrics
- Best practice recommendations
- Quality score (0-100)

## 🎯 Best Practices

1. **Use Data Attributes**: Prefer `data-testid` for element selection
2. **Avoid Hard Waits**: Use `cy.intercept()` instead of `cy.wait(timeout)`
3. **Clean Test Data**: Use `afterEach` hooks to clean up test data
4. **Isolated Tests**: Each test should be independent
5. **Meaningful Names**: Use descriptive test and suite names

## 🔐 Security Notes

- The automation creates temporary `.env.e2e` files
- All configuration changes are reverted after tests
- Backup files are created with timestamps
- No sensitive data is logged

## 📝 Writing New Tests

Example test structure:

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    cy.login(); // Custom command
    cy.visit('/feature-path');
  });

  it('should perform expected behavior', () => {
    cy.get('[data-testid="element"]').click();
    cy.contains('Expected Text').should('be.visible');
  });

  afterEach(() => {
    // Clean up test data if needed
  });
});
```

## 🚦 CI/CD Integration

For CI environments:

```bash
# Use the CI-specific command
npm run test:e2e:ci

# Or use the automated runner with CI-friendly output
CI=true npm run test:e2e:auto
```

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Run the pre-flight check: `npm run test:e2e:check`
3. Review the test analysis: `npm run test:e2e:analyze`
4. Check server logs for errors